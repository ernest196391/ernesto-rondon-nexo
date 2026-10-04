// Imports a business's real catalog into the NEXO cloud catalog from its
// configured source (nexo_business.catalog_sources):
// * 'biznecubano' — BizneCubano decides what is sold, price and stock (public
//   snapshot from the Casa-Viva repo); the website supplies variants and IDs.
// * 'woocommerce' — the website's public Store API is the whole truth.
// Items are matched by SKU, so switching sources never duplicates products.
// Read-only towards BizneCubano and WooCommerce (Bridge 1).
//
// Auth: an owner session (Authorization: Bearer <user JWT>) or an automation
// key in `x-nexo-import-key`: the function secret NEXO_IMPORT_KEY (manual runs)
// or the Vault key `nexo_catalog_import_key` used by the hourly pg_cron job.
// Deploy: npx.cmd supabase functions deploy nexo-catalog-import --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, x-nexo-import-key, apikey",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

type StoreProduct = {
  id: number;
  name: string;
  sku: string;
  type: string;
  prices: { price: string; currency_code: string; currency_minor_unit: number };
  is_in_stock: boolean;
  add_to_cart?: { maximum?: number };
  categories?: Array<{ name: string }>;
  images?: Array<{ src: string; thumbnail?: string }>;
  variations?: Array<{ id: number; attributes: Array<{ name: string; value: string }> }>;
};

type BizneProduct = {
  code: string;
  url: string;
  name: string;
  price: number | null;
  currency: string;
  stock_hint: number | null;
  out_of_stock: boolean;
  categories: string[];
  image: string;
};

type Item = {
  productId: string;
  sku: string | null;
  name: string;
  category: string | null;
  imageUrl: string | null;
  variantOf: string | null;
  variantLabel: string | null;
  prices: Record<string, number>;
  active: boolean;
  stockQuantity: number | null;
  externalRefs: Record<string, unknown>;
};

// Same category names the Casa-Viva sync uses on the website.
const BIZNE_CATEGORIES: Record<string, string> = {
  "Baño": "Baño",
  "Cocina": "Cocina",
  "Habitación": "Habitación",
  "Sala": "Sala y muebles",
  "Higiene & Cuidado Personal": "Cuidado personal",
  "Electrodomésticos": "Electrodomésticos",
  "Ferretería": "Ferretería",
  "Otros": "Otros",
};

const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

function storePrice(p: StoreProduct): Record<string, number> {
  const amount = Number(p.prices.price);
  if (!Number.isFinite(amount)) return {};
  const scale = 10 ** (2 - (p.prices.currency_minor_unit ?? 2));
  return { [p.prices.currency_code.toUpperCase()]: Math.round(amount * scale) };
}

/** Exact quantity when the site manages stock; null when it does not. */
function storeQuantity(p: StoreProduct): number | null {
  if (!p.is_in_stock) return 0;
  const max = p.add_to_cart?.maximum;
  return typeof max === "number" && max < 9999 ? max : null;
}

/** BizneCubano SKU rule from the Casa-Viva sync (BC-<image id> or BC-P-<code>). */
function bizneSku(p: BizneProduct): string {
  const m = String(p.image ?? "").match(/\/products\/(\d+)\//);
  return m ? `BC-${m[1]}` : `BC-P-${p.code.toLowerCase().replace(/[^a-z0-9_-]/g, "")}`;
}

/** GET JSON with retries: the website sometimes answers with an HTML error page. */
async function fetchJson<T>(url: string): Promise<T> {
  let last = "";
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "NEXO-Business-Catalog-Import/1.0", accept: "application/json" } });
      const text = await r.text();
      if (r.ok && /^\s*[[{]/.test(text)) return JSON.parse(text) as T;
      last = `HTTP ${r.status}, ${r.headers.get("content-type") ?? "?"}: ${text.slice(0, 80).replace(/\s+/g, " ")}`;
    } catch (e) {
      last = String(e);
    }
    await new Promise(res => setTimeout(res, 1500 * attempt));
  }
  throw new Error(`${url}: ${last}`);
}

/** Website catalog: one item per simple product or per variant. */
async function readWebsite(base: string, host: string) {
  const products: StoreProduct[] = [];
  for (let page = 1; page <= 50; page++) {
    const batch = await fetchJson<StoreProduct[]>(`${base}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    products.push(...batch);
    if (batch.length < 100) break;
  }
  // parent SKU -> its items (one for simple products, one per variant)
  const bySku = new Map<string, Item[]>();
  for (const p of products) {
    const category = p.categories?.[0]?.name ? decode(p.categories[0].name) : null;
    // The 300 px thumbnail is all the POS and the dashboard show (about 10 KB).
    const image = p.images?.[0]?.thumbnail || p.images?.[0]?.src || null;
    const items: Item[] = [];
    if (p.type === "variable" && p.variations?.length) {
      for (const v of p.variations) {
        const variant = await fetchJson<StoreProduct>(`${base}/wp-json/wc/store/v1/products/${v.id}`);
        const label = v.attributes.map(a => a.value).join(" / ");
        items.push({
          productId: `cv-${variant.id}`,
          sku: variant.sku || `${p.sku}-${variant.id}`,
          name: `${decode(p.name)} — ${label}`,
          category,
          imageUrl: variant.images?.[0]?.thumbnail || variant.images?.[0]?.src || image,
          variantOf: `cv-${p.id}`,
          variantLabel: label,
          prices: storePrice(variant),
          active: true,
          stockQuantity: storeQuantity(variant),
          externalRefs: { [host]: { wooId: variant.id, parentWooId: p.id } },
        });
      }
    } else {
      items.push({
        productId: `cv-${p.id}`,
        sku: p.sku || null,
        name: decode(p.name),
        category,
        imageUrl: image,
        variantOf: null,
        variantLabel: null,
        prices: storePrice(p),
        active: true,
        stockQuantity: storeQuantity(p),
        externalRefs: { [host]: { wooId: p.id } },
      });
    }
    bySku.set(p.sku || `cv-${p.id}`, items);
  }
  return { products: products.length, bySku };
}

/**
 * Stand-in for the website when it is unreachable: the items NEXO already
 * imported, grouped like readWebsite() (variants under their BizneCubano SKU).
 * Quantities are left untouched (null) except where BizneCubano gives one.
 */
// deno-lint-ignore no-explicit-any
async function cachedWebsite(admin: any, business: string) {
  const { data, error } = await admin.rpc("nexo_business_catalog_items", { p_business: business });
  if (error) throw new Error(error.message);
  const bySku = new Map<string, Item[]>();
  for (const c of (data ?? []) as Item[]) {
    const key = c.variantOf ? (c.sku?.match(/^BC-\d+/)?.[0] ?? c.variantOf) : (c.sku ?? c.productId);
    const item: Item = { ...c, active: true, stockQuantity: null };
    bySku.set(key, [...(bySku.get(key) ?? []), item]);
  }
  if (!bySku.size) throw new Error("website unavailable and no previous import to fall back on");
  return { products: 0, bySku };
}

/** BizneCubano decides publication, price and stock; the website adds variants and IDs. */
function followBizne(snapshot: { generated_at: string; products: BizneProduct[] }, web: Map<string, Item[]>, host: string) {
  const items: Item[] = [];
  const listed = new Set<string>();
  for (const b of snapshot.products) {
    const sku = bizneSku(b);
    listed.add(sku);
    const ref = { code: b.code, url: b.url };
    const price = typeof b.price === "number" ? { [(b.currency || "USD").toUpperCase()]: Math.round(b.price * 100) } : null;
    const stock = b.out_of_stock ? 0 : (Number.isInteger(b.stock_hint) && (b.stock_hint ?? 0) > 0 ? b.stock_hint : null);
    const webItems = web.get(sku);
    if (!webItems) {
      // New on BizneCubano, not yet on the website.
      items.push({
        productId: `bc-${sku.toLowerCase()}`,
        sku,
        name: b.name,
        category: BIZNE_CATEGORIES[b.categories?.[0] ?? ""] ?? b.categories?.[0] ?? null,
        imageUrl: b.image || null,
        variantOf: null,
        variantLabel: null,
        prices: price ?? {},
        active: true,
        stockQuantity: stock,
        externalRefs: { biznecubano: ref },
      });
      continue;
    }
    const isVariants = webItems.length > 1 || webItems[0].variantOf !== null;
    for (const w of webItems) {
      items.push({
        ...w,
        // Variant prices/stock live on the website; BizneCubano only lists the parent.
        prices: isVariants ? w.prices : (price ?? w.prices),
        stockQuantity: b.out_of_stock ? 0 : isVariants ? w.stockQuantity : (stock ?? w.stockQuantity),
        externalRefs: { ...w.externalRefs, biznecubano: ref },
      });
    }
  }
  // Published on the website but no longer on BizneCubano: stop selling.
  for (const [sku, webItems] of web) {
    if (listed.has(sku)) continue;
    for (const w of webItems) items.push({ ...w, active: false });
  }
  return { items, snapshotAt: snapshot.generated_at, host };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const business = new URL(req.url).searchParams.get("business") ?? "casa-viva";
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Automation: the manual key (function secret) or the hourly job's Vault key.
  const key = req.headers.get("x-nexo-import-key") ?? "";
  const expected = Deno.env.get("NEXO_IMPORT_KEY") ?? "";
  let automated = expected.length >= 32 && key === expected;
  if (!automated && key.length >= 32) {
    const { data: vaultOk } = await admin.rpc("nexo_business_check_import_key", { p_key: key });
    automated = vaultOk === true;
  }
  let authorized = automated;
  if (!authorized) {
    const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (jwt) {
      const { data: user } = await admin.auth.getUser(jwt);
      if (user?.user) {
        const { data: memberships } = await admin.rpc("nexo_business_my_memberships_for", { p_user: user.user.id });
        authorized = Array.isArray(memberships) &&
          memberships.some((m: { businessId: string; role: string }) => m.businessId === business && m.role === "owner");
      }
    }
  }
  if (!authorized) return json(401, { error: "unauthorized" });

  const { data: source, error: sourceError } = await admin.rpc("nexo_business_catalog_source", { p_business: business });
  if (sourceError || !source) return json(400, { error: "no_catalog_source" });
  if (automated && source.auto_import === false) return json(200, { skipped: "auto_import disabled" });

  try {
    const host = new URL(source.website_url).hostname;
    let web: { products: number; bySku: Map<string, Item[]> };
    let websiteError: string | null = null;
    try {
      web = await readWebsite(source.website_url, host);
    } catch (e) {
      // Following the website needs the website; following BizneCubano can use
      // NEXO's own copy of the variants and IDs until the site is back.
      if (source.kind !== "biznecubano") throw e;
      websiteError = String(e);
      web = await cachedWebsite(admin, business);
    }
    let items: Item[];
    let snapshotAt: string | null = null;
    if (source.kind === "biznecubano") {
      const snapshot = await fetchJson<{ generated_at: string; products: BizneProduct[] }>(source.snapshot_url);
      if (!Array.isArray(snapshot.products) || snapshot.products.length === 0) throw new Error("BizneCubano snapshot is empty");
      ({ items, snapshotAt } = followBizne(snapshot, web.bySku, host));
    } else {
      items = [...web.bySku.values()].flat();
    }
    const sourceName = source.kind === "biznecubano" ? "biznecubano" : host;
    const { data, error } = await admin.rpc("nexo_business_import_catalog", { p_business: business, p_source: sourceName, p_items: items });
    if (error) throw new Error(error.message);
    if (data?.error) return json(400, data);
    const result = {
      source: source.kind, snapshotAt, websiteProducts: web.products,
      ...(websiteError ? { websiteUnavailable: true, websiteError } : {}), ...data,
    };
    await admin.rpc("nexo_business_record_import", { p_business: business, p_result: result });
    return json(200, result);
  } catch (e) {
    const result = { source: source.kind, error: "import_failed", detail: String(e) };
    await admin.rpc("nexo_business_record_import", { p_business: business, p_result: result });
    console.error("catalog import failed", String(e));
    return json(502, result);
  }
});
