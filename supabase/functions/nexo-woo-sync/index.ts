// Bridge from Casa Viva Core to the shop's WooCommerce (casaviva.company).
// The shop's PC cannot reach the website (the host refuses Cuban
// connections), so the bridge runs in the cloud with the REST key in secrets.
//
// Modes (POST ?business=…&mode=…):
// * check — counts what the website has and how it matches Core. Read-only.
// * plan  — the list of changes Core would publish: price (USD) and stock per
//           product or variation matched by SKU. Read-only.
// * apply — publishes the changes the owner ticked. The plan is recomputed
//           here and only its values are written: nothing from the browser
//           reaches the website except which items to publish. Logged in
//           nexo_business.web_sync_log.
//
// Secrets: WOO_URL, WOO_CK, WOO_CS. Auth: owner session (Bearer JWT) for all
// modes; x-nexo-import-key = NEXO_IMPORT_KEY also for check/plan.
// Deploy: npx.cmd supabase functions deploy nexo-woo-sync --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, x-nexo-import-key, apikey",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

type WooItem = {
  id: number; parent_id?: number; name: string; sku: string; type?: string; status?: string;
  regular_price: string; manage_stock: boolean | "parent"; stock_quantity: number | null;
};
type CoreItem = { productId: string; sku: string; name: string; priceMinor: number | null; stock: number | null };
type Change = {
  key: string; wooId: number; parentId: number | null; sku: string; name: string;
  price: { from: string; to: string } | null; stock: { from: number | null; to: number } | null;
};

const base = () => (Deno.env.get("WOO_URL") ?? "").replace(/\/$/, "");
const auth = () => "Basic " + btoa(`${Deno.env.get("WOO_CK") ?? ""}:${Deno.env.get("WOO_CS") ?? ""}`);

async function woo(method: string, path: string, body?: unknown) {
  const r = await fetch(`${base()}/wp-json/wc/v3/${path}`, {
    method,
    headers: { authorization: auth(), accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`woo ${r.status} ${(data as { code?: string })?.code ?? ""}`.trim());
  return { data, total: r.headers.get("x-wp-total") };
}

const FIELDS = "id,parent_id,name,sku,type,status,regular_price,manage_stock,stock_quantity";

async function readWebsite(): Promise<WooItem[]> {
  const items: WooItem[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data } = await woo("GET", `products?per_page=100&page=${page}&_fields=${FIELDS}`);
    const list = data as WooItem[];
    items.push(...list);
    if (list.length < 100) break;
  }
  // Variations carry their own SKU, price and stock.
  for (const parent of items.filter(p => p.type === "variable")) {
    const { data } = await woo("GET", `products/${parent.id}/variations?per_page=100&_fields=${FIELDS}`);
    for (const v of data as WooItem[]) items.push({ ...v, parent_id: parent.id, name: `${parent.name} · ${v.name ?? v.sku}` });
  }
  return items;
}

function plan(web: WooItem[], core: CoreItem[]): { changes: Change[]; matched: number; webOnly: number } {
  const bySku = new Map(core.map(c => [c.sku.trim().toUpperCase(), c]));
  const changes: Change[] = [];
  let matched = 0;
  for (const w of web) {
    if (!w.sku || w.type === "variable") continue;
    const c = bySku.get(w.sku.trim().toUpperCase());
    if (!c) continue;
    matched++;
    const to = c.priceMinor != null ? (c.priceMinor / 100).toFixed(2) : null;
    const price = to && Number(w.regular_price || "NaN") !== Number(to) ? { from: w.regular_price, to } : null;
    const stockTo = c.stock == null ? null : Math.max(0, Number(c.stock));
    const stock = w.manage_stock === true && stockTo != null && w.stock_quantity !== stockTo ? { from: w.stock_quantity, to: stockTo } : null;
    if (price || stock) changes.push({ key: `${w.parent_id ?? 0}:${w.id}`, wooId: w.id, parentId: w.parent_id || null, sku: w.sku, name: c.name, price, stock });
  }
  return { changes, matched, webOnly: web.filter(w => w.sku && w.type !== "variable").length - matched };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "method" });
  if (!base() || !Deno.env.get("WOO_CK") || !Deno.env.get("WOO_CS")) return json(500, { error: "woo_not_configured" });
  const url = new URL(req.url);
  const business = url.searchParams.get("business") ?? "casa-viva";
  const mode = url.searchParams.get("mode") ?? "check";
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

  const expected = Deno.env.get("NEXO_IMPORT_KEY") ?? "";
  const automated = expected.length >= 32 && req.headers.get("x-nexo-import-key") === expected;
  let ownerId: string | null = null;
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (jwt) {
    const { data: user } = await admin.auth.getUser(jwt);
    if (user?.user) {
      const { data: memberships } = await admin.rpc("nexo_business_my_memberships_for", { p_user: user.user.id });
      if (Array.isArray(memberships) && memberships.some((m: { businessId: string; role: string }) => m.businessId === business && m.role === "owner")) ownerId = user.user.id;
    }
  }
  if (!ownerId && !(automated && mode !== "apply")) return json(401, { error: "unauthorized" });

  try {
    const web = await readWebsite();
    const { data: core, error } = await admin.rpc("nexo_business_web_sync_core", { p_business: business });
    if (error) throw new Error(error.message);
    const p = plan(web, core as CoreItem[]);

    if (mode === "check") {
      return json(200, { mode, writes: 0, websiteItems: web.length, variations: web.filter(w => w.parent_id).length, matched: p.matched, websiteOnly: p.webOnly, changes: p.changes.length });
    }
    if (mode === "plan") return json(200, { mode, matched: p.matched, websiteOnly: p.webOnly, changes: p.changes });
    if (mode !== "apply") return json(400, { error: "mode" });

    const wanted = new Set<string>(((await req.json().catch(() => ({}))) as { keys?: string[] }).keys ?? []);
    const chosen = p.changes.filter(c => wanted.has(c.key));
    if (!chosen.length) return json(400, { error: "nothing_selected" });
    const update = (c: Change) => ({ id: c.wooId, ...(c.price ? { regular_price: c.price.to } : {}), ...(c.stock ? { stock_quantity: c.stock.to } : {}) });
    const groups = new Map<number, Change[]>();
    for (const c of chosen) groups.set(c.parentId ?? 0, [...(groups.get(c.parentId ?? 0) ?? []), c]);
    let updated = 0;
    const failed: string[] = [];
    for (const [parent, list] of groups) {
      for (let i = 0; i < list.length; i += 100) {
        const slice = list.slice(i, i + 100);
        const path = parent ? `products/${parent}/variations/batch` : "products/batch";
        try {
          const { data } = await woo("POST", path, { update: slice.map(update) });
          for (const r of (data as { update?: Array<{ id: number; error?: unknown }> }).update ?? []) {
            if (r.error) failed.push(String(r.id)); else updated++;
          }
        } catch (e) {
          failed.push(...slice.map(c => c.sku + ": " + (e as Error).message));
        }
      }
    }
    const result = { updated, failed, requested: chosen.length };
    await admin.rpc("nexo_business_web_sync_record", { p_business: business, p_changes: chosen, p_result: result, p_user: ownerId });
    return json(200, { mode, ...result });
  } catch (e) {
    console.error("woo-sync", (e as Error).message);
    return json(502, { error: "woo_error", detail: (e as Error).message });
  }
});
