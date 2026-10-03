// Imports a business's real catalog (products, variants, prices, stock) from its
// website's public WooCommerce Store API into the NEXO cloud catalog. Read-only
// towards the website (Bridge 1): it never writes to WooCommerce.
//
// Auth: an owner session (Authorization: Bearer <user JWT>, member with role
// owner) or the automation key in `x-nexo-import-key` (secret NEXO_IMPORT_KEY).
// Deploy: npx.cmd supabase functions deploy nexo-catalog-import --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const SOURCES: Record<string, string> = {
  "casa-viva": "https://casavivadecuba.com",
};

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, x-nexo-import-key, apikey",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

type StoreProduct = {
  id: number;
  parent?: number;
  name: string;
  sku: string;
  type: string;
  prices: { price: string; currency_code: string; currency_minor_unit: number };
  is_in_stock: boolean;
  add_to_cart?: { maximum?: number };
  categories?: Array<{ name: string }>;
  images?: Array<{ src: string }>;
  variations?: Array<{ id: number; attributes: Array<{ name: string; value: string }> }>;
};

const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

function minor(p: StoreProduct): Record<string, number> {
  const amount = Number(p.prices.price);
  if (!Number.isFinite(amount)) return {};
  // Store API prices are already integers in the currency's minor unit.
  const scale = 10 ** (2 - (p.prices.currency_minor_unit ?? 2));
  return { [p.prices.currency_code.toUpperCase()]: Math.round(amount * scale) };
}

/** Exact quantity when the site manages stock; null when it does not. */
function quantity(p: StoreProduct): number | null {
  if (!p.is_in_stock) return 0;
  const max = p.add_to_cart?.maximum;
  return typeof max === "number" && max < 9999 ? max : null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { "user-agent": "NEXO-Business-Catalog-Import/1.0" } });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return await r.json() as T;
}

async function readCatalog(base: string, source: string) {
  const products: StoreProduct[] = [];
  for (let page = 1; page <= 50; page++) {
    const batch = await fetchJson<StoreProduct[]>(`${base}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    products.push(...batch);
    if (batch.length < 100) break;
  }
  const items: unknown[] = [];
  for (const p of products) {
    const category = p.categories?.[0]?.name ? decode(p.categories[0].name) : null;
    const image = p.images?.[0]?.src ?? null;
    if (p.type === "variable" && p.variations?.length) {
      for (const v of p.variations) {
        const variant = await fetchJson<StoreProduct>(`${base}/wp-json/wc/store/v1/products/${v.id}`);
        const label = v.attributes.map(a => a.value).join(" / ");
        items.push({
          productId: `cv-${variant.id}`,
          sku: variant.sku || `${p.sku}-${variant.id}`,
          name: `${decode(p.name)} — ${label}`,
          category,
          imageUrl: variant.images?.[0]?.src ?? image,
          variantOf: `cv-${p.id}`,
          variantLabel: label,
          prices: minor(variant),
          active: true,
          stockQuantity: quantity(variant),
          externalRefs: { [source]: { wooId: variant.id, parentWooId: p.id } },
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
        prices: minor(p),
        active: true,
        stockQuantity: quantity(p),
        externalRefs: { [source]: { wooId: p.id } },
      });
    }
  }
  return { products: products.length, items };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const business = new URL(req.url).searchParams.get("business") ?? "casa-viva";
  const base = SOURCES[business];
  if (!base) return json(400, { error: "unknown_business" });
  const source = new URL(base).hostname;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Authorize: automation key, or an owner of this business.
  const key = req.headers.get("x-nexo-import-key") ?? "";
  const expected = Deno.env.get("NEXO_IMPORT_KEY") ?? "";
  let authorized = expected.length >= 32 && key === expected;
  if (!authorized) {
    const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (jwt) {
      const { data: user } = await admin.auth.getUser(jwt);
      if (user?.user) {
        const { data: owners } = await admin.rpc("nexo_business_my_memberships_for", { p_user: user.user.id });
        authorized = Array.isArray(owners) && owners.some((m: { businessId: string; role: string }) => m.businessId === business && m.role === "owner");
      }
    }
  }
  if (!authorized) return json(401, { error: "unauthorized" });

  try {
    const { products, items } = await readCatalog(base, source);
    const { data, error } = await admin.rpc("nexo_business_import_catalog", { p_business: business, p_source: source, p_items: items });
    if (error) throw new Error(error.message);
    if (data?.error) return json(400, data);
    return json(200, { source, websiteProducts: products, ...data });
  } catch (e) {
    console.error("catalog import failed", String(e));
    return json(502, { error: "import_failed", detail: String(e) });
  }
});
