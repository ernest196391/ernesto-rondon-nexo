// Bridge to the shop's WooCommerce (casaviva.company) through its REST API.
// Casa Viva Core is the price authority; this function will push prices and
// stock to the website. The shop's PC cannot reach the website (the host
// refuses Cuban connections), so the bridge runs in the cloud.
//
// Step 1 (this version): mode "check" only — read-only. Confirms the key
// works and reports what the website has, matched to the NEXO catalog by SKU.
// Nothing is written to WooCommerce.
//
// Secrets: WOO_URL, WOO_CK, WOO_CS (function secrets, never in code or logs).
// Auth: x-nexo-import-key = NEXO_IMPORT_KEY.
// Deploy: npx.cmd supabase functions deploy nexo-woo-sync --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

type WooProduct = {
  id: number; name: string; sku: string; type: string; status: string;
  regular_price: string; sale_price: string; manage_stock: boolean; stock_quantity: number | null;
};

async function woo(path: string) {
  const base = (Deno.env.get("WOO_URL") ?? "").replace(/\/$/, "");
  const auth = "Basic " + btoa(`${Deno.env.get("WOO_CK") ?? ""}:${Deno.env.get("WOO_CS") ?? ""}`);
  const r = await fetch(`${base}/wp-json/wc/v3/${path}`, { headers: { authorization: auth, accept: "application/json" } });
  return { status: r.status, total: r.headers.get("x-wp-total"), body: await r.json().catch(() => null) };
}

Deno.serve(async req => {
  if (req.method !== "POST") return json(405, { error: "method" });
  const expected = Deno.env.get("NEXO_IMPORT_KEY") ?? "";
  if (expected.length < 32 || req.headers.get("x-nexo-import-key") !== expected) return json(401, { error: "unauthorized" });
  if (!Deno.env.get("WOO_URL") || !Deno.env.get("WOO_CK") || !Deno.env.get("WOO_CS")) return json(500, { error: "woo_not_configured" });

  const business = new URL(req.url).searchParams.get("business") ?? "casa-viva";
  const products: WooProduct[] = [];
  let total: string | null = null;
  for (let page = 1; page <= 20; page++) {
    const r = await woo(`products?per_page=100&page=${page}&_fields=id,name,sku,type,status,regular_price,sale_price,manage_stock,stock_quantity`);
    if (r.status !== 200) return json(502, { error: "woo_error", status: r.status, detail: (r.body as { code?: string })?.code ?? null });
    total = r.total;
    products.push(...(r.body as WooProduct[]));
    if ((r.body as WooProduct[]).length < 100) break;
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: items } = await admin.rpc("nexo_business_catalog_items", { p_business: business });
  const catalog = (items ?? []) as { productId: string; sku: string | null; prices: Record<string, number> }[];
  const bySku = new Map((catalog ?? []).filter(p => p.sku).map(p => [String(p.sku).trim().toUpperCase(), p] as const));
  let matched = 0, priceDiffers = 0;
  for (const w of products) {
    const c = w.sku ? bySku.get(w.sku.trim().toUpperCase()) : undefined;
    if (!c) continue;
    matched++;
    const core = (c.prices as Record<string, number>)?.USD;
    if (core != null && w.regular_price !== "" && Math.round(Number(w.regular_price) * 100) !== core) priceDiffers++;
  }
  return json(200, {
    mode: "check", writes: 0, wooProducts: products.length, wooTotalHeader: total,
    variable: products.filter(p => p.type === "variable").length,
    withSku: products.filter(p => p.sku).length, managedStock: products.filter(p => p.manage_stock).length,
    coreActive: catalog?.length ?? 0, matchedBySku: matched, priceDiffers,
    sample: products.slice(0, 3).map(p => ({ id: p.id, sku: p.sku, type: p.type, price: p.regular_price, stock: p.stock_quantity })),
  });
});
