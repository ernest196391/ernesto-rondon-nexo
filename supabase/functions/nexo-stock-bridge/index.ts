// D37 fase 2: un solo stock para la caja (NEXO) y la web (WooCommerce / Casa Viva Core).
// Cada 2 minutos (pg_cron) mueve MOVIMIENTOS con clave única, nunca totales:
//   A. caja/panel → web: ventas, devoluciones y entradas de la caja restan/suman en la web.
//   B. web → caja: cada línea de pedido web que descontó stock resta en la caja; si se cancela, vuelve.
// Autorización: la clave interna (Vault del trabajo programado o NEXO_IMPORT_KEY).
// Deploy: npx.cmd supabase functions deploy nexo-stock-bridge --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUSINESS = "casa-viva";
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const base = () => (Deno.env.get("WOO_URL") ?? "").replace(/\/$/, "");

async function core(method: "GET" | "POST", path: string, body?: unknown) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${base()}/wp-json/casa-viva/v1/${path}${sep}_=${Date.now()}`, {
    method,
    headers: { "x-nexo-panel-key": Deno.env.get("CASAVIVA_PANEL_KEY") ?? "", "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`core ${path} ${res.status} ${data?.message ?? ""}`);
  return data;
}

const SOLD = new Set(["pending", "processing", "on-hold", "completed"]);
const UNDONE = new Set(["cancelled", "refunded", "failed"]);

Deno.serve(async req => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const key = req.headers.get("x-nexo-key") ?? "";
  const internal = Deno.env.get("NEXO_IMPORT_KEY") ?? "";
  let ok = internal.length >= 32 && key === internal;
  if (!ok && key.length >= 32) ok = (await admin.rpc("nexo_business_check_import_key", { p_key: key })).data === true;
  if (!ok) return json(401, { error: "unauthorized" });

  const { data: state } = await admin.rpc("nexo_business_stock_checkpoint", { p_business: BUSINESS });
  if (!state?.from) return json(200, { off: true }); // puente apagado hasta el cambio

  const report = { toWeb: 0, toWebSkipped: 0, fromWeb: 0, messengers: 0, customers: 0, errors: [] as string[] };

  // A. caja/panel → web
  try {
    const { data: rows, error } = await admin.rpc("nexo_business_stock_to_web", { p_business: BUSINESS, p_limit: 200 });
    if (error) throw new Error(error.message);
    if (rows?.length) {
      const items = rows.map((r: { stock_key: string; woo_id: number; delta: number }) => ({ key: r.stock_key, wooId: r.woo_id, delta: Number(r.delta) }));
      const result = await core("POST", "panel/stock/adjust", { items });
      const applied = new Set((result.applied ?? []).map((a: { key: string }) => a.key));
      const sent = rows.filter((r: { stock_key: string }) => applied.has(r.stock_key))
        .map((r: { stock_key: string; product_id: string; delta: number }) => ({ key: r.stock_key, productId: r.product_id, delta: r.delta }));
      await admin.rpc("nexo_business_stock_mark_sent", { p_business: BUSINESS, p_items: sent });
      report.toWeb = sent.length;
      report.toWebSkipped = (result.applied ?? []).filter((a: { skipped?: string }) => a.skipped).length;
    }
  } catch (e) { report.errors.push("A: " + (e as Error).message); }

  // B. web → caja
  try {
    const since = state.checkpoint ?? state.from;
    const data = await core("GET", `panel/stock/web-sales?since=${encodeURIComponent(since)}`);
    for (const o of data.orders ?? []) {
      for (const l of o.lines ?? []) {
        let r = "";
        if (SOLD.has(o.status) && l.reduced > 0) {
          r = (await admin.rpc("nexo_business_stock_from_web", { p_business: BUSINESS, p_key: `web:${o.id}:${l.itemId}:out`, p_woo_id: l.wooId, p_delta: -l.reduced, p_order: String(o.number) })).data;
        } else if (UNDONE.has(o.status) && l.reduced === 0) {
          r = (await admin.rpc("nexo_business_stock_from_web", { p_business: BUSINESS, p_key: `web:${o.id}:${l.itemId}:back`, p_woo_id: l.wooId, p_delta: l.qty, p_order: String(o.number) })).data;
        }
        if (r === "ok") report.fromWeb++;
      }
    }
    // Se vuelve a leer con 5 minutos de solape: las claves evitan cualquier doble aplicación.
    const next = new Date(Date.parse(data.now) - 5 * 60_000).toISOString();
    await admin.rpc("nexo_business_stock_checkpoint", { p_business: BUSINESS, p_value: next });
  } catch (e) { report.errors.push("B: " + (e as Error).message); }

  // C. Mensajeros de la web → caja (people.kind='messenger'; aprobado = activo).
  try {
    const { messengers } = await core("GET", "panel/messengers");
    const items = (messengers ?? []).filter((m: { pilot: boolean }) => !m.pilot)
      .map((m: { id: number; name: string; phone: string; status: string }) => ({ wooId: m.id, name: m.name, phone: m.phone, status: m.status }));
    report.messengers = (await admin.rpc("nexo_business_sync_messengers", { p_business: BUSINESS, p_items: items })).data ?? 0;
  } catch (e) { report.errors.push("C: " + (e as Error).message); }

  // D. Clientes de la caja y del bot → lista de clientes de la web (una fila por teléfono).
  try {
    const { data: sales, error: e1 } = await admin.rpc("nexo_business_customers_from_sales", { p_business: BUSINESS, p_limit: 300 });
    if (e1) throw new Error(e1.message);
    const { data: bot, error: e2 } = await admin.rpc("nexo_business_bot_customers", { p_business: BUSINESS, p_limit: 300 });
    if (e2) throw new Error(e2.message);
    const items = [
      ...(sales ?? []).map((s: { phone: string; name: string; owner_phone: string; usd: number; at: string }) =>
        ({ phone: s.phone, name: s.name ?? "", ownerPhone: s.owner_phone ?? "", source: "caja", purchase: { usd: Number(s.usd), at: s.at } })),
      ...(bot ?? []).map((b: { phone: string; name: string; opt_out: boolean }) => ({ phone: b.phone, name: b.name ?? "", source: "bot", optOut: b.opt_out })),
    ];
    if (items.length) {
      const r = await core("POST", "panel/clients/bulk", { items });
      report.customers = r.saved ?? 0;
    }
    const last = (rows: { received_at?: string; changed_at?: string }[] | null, k: "received_at" | "changed_at") => rows?.length ? rows[rows.length - 1][k] : null;
    await admin.rpc("nexo_business_set_customer_checkpoints", { p_business: BUSINESS, p_sales: last(sales, "received_at"), p_bot: last(bot, "changed_at") });
  } catch (e) { report.errors.push("D: " + (e as Error).message); }

  return json(report.errors.length ? 207 : 200, report);
});
