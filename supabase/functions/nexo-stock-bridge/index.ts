// D37 fase 2: un solo stock para la caja (NEXO) y la web (WooCommerce / Casa Viva Core).
// Cada 2 minutos (pg_cron) mueve MOVIMIENTOS con clave única:
//   B. web → caja: cada línea de pedido web que descontó stock resta en la caja; si se cancela, vuelve.
//   A. caja/panel → web: ventas, devoluciones y entradas de la caja restan/suman en la web.
//      Excepción (15-oct): un conteo de «Quedan» en el panel FIJA la web a la cifra de la caja (set).
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

  const report = { toWeb: 0, toWebSet: 0, toWebHeld: 0, toWebSkipped: 0, fromWeb: 0, reshown: 0, keptHidden: 0, messengers: 0, customers: 0, gestoras: null as unknown, catalogReconciled: 0, catalogParents: 0, errors: [] as string[] };

  // B va ANTES que A (15-oct): así los pedidos web ya están en la caja cuando A fija la web tras un conteo
  // del panel, y la cifra fijada ya los descuenta. Si B falla, A no fija ninguna cifra en esta vuelta.
  let webSalesOk = false;

  // B. web → caja
  try {
    const since = state.checkpoint ?? state.from;
    const data = await core("GET", `panel/stock/web-sales?since=${encodeURIComponent(since)}`);
    // B0. Cambios de productos hechos en /ventas/ (Core 3.13.97, «edits»), ANTES de las líneas:
    //  - línea ya restada en la caja (:out de una vuelta anterior) → se aplica la diferencia (clave única);
    //  - línea aún sin restar → se descarta: el :out de abajo ya usa la cantidad nueva.
    // Core los marca hechos; si eso falla, no se toca ninguna línea en esta vuelta (se repite entera).
    const editsDone: { order: number; key: string; result: string }[] = [];
    for (const o of data.orders ?? []) {
      for (const e of (o.edits ?? []) as { key: string; itemId: number; wooId: number; delta: number }[]) {
        const s = await admin.rpc("nexo_business_web_line_synced", { p_business: BUSINESS, p_order: o.id, p_item: e.itemId });
        if (s.error) throw new Error(s.error.message);
        if (s.data === true && e.delta) {
          const r = await admin.rpc("nexo_business_stock_from_web", { p_business: BUSINESS, p_key: e.key, p_woo_id: e.wooId, p_delta: e.delta, p_order: String(o.number) });
          if (r.error) throw new Error(r.error.message);
          if (r.data === "ok") report.fromWeb++;
          editsDone.push({ order: o.id, key: e.key, result: "applied" });
        } else editsDone.push({ order: o.id, key: e.key, result: "skipped" });
      }
    }
    if (editsDone.length) await core("POST", "panel/stock/edits-done", { items: editsDone });
    for (const o of data.orders ?? []) {
      for (const l of o.lines ?? []) {
        let r = "";
        if (SOLD.has(o.status) && l.reduced > 0) {
          r = (await admin.rpc("nexo_business_stock_from_web", { p_business: BUSINESS, p_key: `web:${o.id}:${l.itemId}:out`, p_woo_id: l.wooId, p_delta: -l.reduced, p_order: String(o.number) })).data;
        } else if (UNDONE.has(o.status) && l.reduced === 0
          // Solo se devuelve a la caja lo que antes se restó (:out). Un pedido que nunca descontó
          // (pendiente de pago, fallido, cancelado antes de que pasara el puente) no debe sumar unidades.
          && (await admin.rpc("nexo_business_web_line_synced", { p_business: BUSINESS, p_order: o.id, p_item: l.itemId })).data === true) {
          r =(await admin.rpc("nexo_business_stock_from_web", { p_business: BUSINESS, p_key: `web:${o.id}:${l.itemId}:back`, p_woo_id: l.wooId, p_delta: l.qty, p_order: String(o.number) })).data;
        }
        if (r === "ok") report.fromWeb++;
      }
    }
    // Se vuelve a leer con 5 minutos de solape: las claves evitan cualquier doble aplicación.
    const next = new Date(Date.parse(data.now) - 5 * 60_000).toISOString();
    await admin.rpc("nexo_business_stock_checkpoint", { p_business: BUSINESS, p_value: next });
    webSalesOk = true;
  } catch (e) { report.errors.push("B: " + (e as Error).message); }

  // A. caja/panel → web
  //  - conteo del panel (set_to no nulo): la web queda con esa cifra exacta. El Core en vivo solo sabe
  //    sumar/restar, así que se leen las existencias de la web (panel/stock/levels) y se manda
  //    la diferencia «cifra − web» (16-oct: así no hace falta tocar Core).
  //  - lo demás (ventas, devoluciones, entradas…): diferencia, como siempre → {key, wooId, delta}
  try {
    type Row = { stock_key: string; product_id: string; woo_id: number; delta: number; set_to: number | null; kind: string };
    const { data, error } = await admin.rpc("nexo_business_stock_to_web", { p_business: BUSINESS, p_limit: 200 });
    if (error) throw new Error(error.message);
    // Un conteo espera a la próxima vuelta (y con él todo lo posterior de ese producto) si:
    //  - B falló (los pedidos web aún no están en la caja), o
    //  - en esta misma vuelta va antes otra diferencia del mismo producto (la lectura de la web aún no la incluye).
    const held = new Set<string>();
    const seen = new Set<string>();
    const rows = ((data ?? []) as Row[]).filter(r => {
      if (held.has(r.product_id)) return false;
      if (r.set_to != null && (!webSalesOk || seen.has(r.product_id))) { held.add(r.product_id); return false; }
      seen.add(r.product_id);
      return true;
    });
    report.toWebHeld = (data?.length ?? 0) - rows.length;
    let levels = new Map<number, number | null>();
    if (rows.some(r => r.set_to != null)) {
      const lv = await core("GET", "panel/stock/levels");
      levels = new Map((lv.products ?? []).map((p: { wooId: number; stock: number | null }) => [Number(p.wooId), p.stock == null ? null : Number(p.stock)]));
    }
    const noop: Row[] = []; // conteos que no cambian nada en la web (ya está igual, o la web no lleva stock de ese producto)
    const items: { key: string; wooId: number; delta: number }[] = [];
    const deltaOf = new Map<string, number>();
    for (const r of rows) {
      let d = Number(r.delta);
      if (r.set_to != null) {
        const w = levels.get(Number(r.woo_id));
        if (w == null) { noop.push(r); report.toWebSkipped++; continue; }
        d = Number(r.set_to) - w;
        if (d === 0) { noop.push(r); report.toWebSet++; continue; }
        report.toWebSet++;
      }
      deltaOf.set(r.stock_key, d);
      items.push({ key: r.stock_key, wooId: r.woo_id, delta: d });
    }
    let applied = new Set<string>();
    if (items.length) {
      const result = await core("POST", "panel/stock/adjust", { items });
      applied = new Set((result.applied ?? []).map((a: { key: string }) => a.key));
      report.toWebSkipped += (result.applied ?? []).filter((a: { skipped?: string }) => a.skipped).length;
    }
    const sent = [...noop.map(r => ({ key: r.stock_key, productId: r.product_id, delta: 0 })),
      ...rows.filter(r => applied.has(r.stock_key)).map(r => ({ key: r.stock_key, productId: r.product_id, delta: deltaOf.get(r.stock_key) ?? Number(r.delta) }))];
    if (sent.length) await admin.rpc("nexo_business_stock_mark_sent", { p_business: BUSINESS, p_items: sent });
    report.toWeb = sent.length;
  } catch (e) { report.errors.push("A: " + (e as Error).message); }

  // M. Metadatos NEXO → Woo (13-nov): misma ejecución programada, sin crear otro cron.
  // NEXO manda solo identidad/catalogación no financiera. NO precio, stock, visibilidad, comisiones ni pedidos.
  try {
    type CatalogRow = {
      product_id: string; name: string; sku: string | null; active: boolean;
      variant_label: string | null; external_refs: Record<string, { wooId?: number; parentWooId?: number }> | null;
    };
    const { data: catalog, error } = await admin.schema("nexo_business").from("catalog_products")
      .select("product_id,name,sku,active,variant_label,external_refs")
      .eq("business_id", BUSINESS)
      .limit(2000);
    if (error) throw new Error(error.message);
    const items = ((catalog ?? []) as CatalogRow[]).flatMap(p => {
      const web = p.external_refs?.["casaviva.company"];
      const wooId = Number(web?.wooId ?? 0);
      if (!(wooId > 0)) return [];
      return [{
        wooId,
        name: String(p.name ?? "").trim(),
        sku: String(p.sku ?? "").trim(),
        active: p.active !== false,
        parentWooId: Number(web?.parentWooId ?? 0) || null,
      }];
    });
    for (let i = 0; i < items.length; i += 300) {
      const out = await core("POST", "panel/catalog/reconcile", { items: items.slice(i, i + 300) });
      const rows = (out.items ?? []) as { changed?: string[]; skuConflict?: number }[];
      report.catalogReconciled += rows.length;
      report.catalogChanged += rows.reduce((n, r) => n + (Array.isArray(r.changed) ? r.changed.length : 0), 0);
      report.catalogSkuConflicts += rows.filter(r => Number(r.skuConflict ?? 0) > 0).length;
      const parents = (out.parents ?? {}) as Record<string, string[]>;
      report.catalogParentOptions += Object.values(parents).reduce((n, values) => n + (Array.isArray(values) ? values.length : 0), 0);
    }
  } catch (e) { report.errors.push("M: " + (e as Error).message); }

  // E. «Se muestra solo al reponer» (Ernesto 10-nov, migración 20261110210000): lo que la caja volvió a mostrar
  //    porque llegó mercancía a un producto oculto por «Se acabó» → también en la web (después de A: ya con sus
  //    unidades). Mismo camino que «Mostrar» del panel, con auto. Si la web dice no_reponer (liquidación), en la caja
  //    vuelve a quedar oculto «A propósito». Sin la migración todavía, no hace nada.
  try {
    const { data: queue, error } = await admin.rpc("nexo_business_reshow_pending", { p_business: BUSINESS, p_limit: 50 });
    if (error && !/reshow_pending|PGRST202|schema cache|does not exist/i.test(`${error.message} ${error.code ?? ""}`)) throw new Error(error.message);
    type Reshow = { id: number; productId: string; wooId: number | null; parentWooId: number | null; qty: number };
    const done: number[] = [];
    const keep: string[] = [];
    for (const it of (error ? [] : (queue ?? [])) as Reshow[]) {
      if (!it.wooId) { done.push(it.id); continue; }
      try {
        const items = [Number(it.wooId), ...(it.parentWooId ? [Number(it.parentWooId)] : [])];
        const r = await core("POST", "panel/products/visibility", { items, sell: true, auto: true, qty: Number(it.qty) || 0, by: "Llegó mercancía (automático)" });
        const mine = (r.items ?? []).find((x: { wooId: number }) => Number(x.wooId) === Number(it.wooId));
        if (mine?.skipped === "no_reponer") keep.push(it.productId);
        done.push(it.id);
      } catch (e) { report.errors.push("E " + it.productId + ": " + (e as Error).message); } // se repite en la próxima vuelta
    }
    if (done.length) {
      const d = await admin.rpc("nexo_business_reshow_done", { p_business: BUSINESS, p_ids: done, p_keep_hidden: keep });
      if (d.error) throw new Error(d.error.message);
      report.reshown = done.length - keep.length;
      report.keptHidden = keep.length;
    }
  } catch (e) { report.errors.push("E: " + (e as Error).message); }

  // C. Mensajeros de la web → caja (people.kind='messenger'; aprobado = activo).
  try {
    const { messengers } = await core("GET", "panel/messengers");
    const items = (messengers ?? []).filter((m: { pilot: boolean }) => !m.pilot)
      .map((m: { id: number; name: string; phone: string; status: string }) => ({ wooId: m.id, name: m.name, phone: m.phone, status: m.status }));
    report.messengers = (await admin.rpc("nexo_business_sync_messengers", { p_business: BUSINESS, p_items: items })).data ?? 0;
  } catch (e) { report.errors.push("C: " + (e as Error).message); }

  // C2. Gestoras de la web → caja (una sola lista; aprobada = activa; sin cuentas de prueba).
  try {
    const { gestoras } = await core("GET", "panel/gestoras");
    const items = (gestoras ?? []).filter((g: { test?: boolean }) => !g.test)
      .map((g: { id: number; name: string; phone: string; status: string }) => ({ wooId: g.id, name: g.name, phone: g.phone, status: g.status }));
    if (items.length) report.gestoras = (await admin.rpc("nexo_business_sync_gestoras", { p_business: BUSINESS, p_items: items })).data;
  } catch (e) { report.errors.push("C2: " + (e as Error).message); }

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


  // F. Reconciliación de catálogo NEXO → Woo (13-nov): evita drift silencioso tras una escritura parcial.
  // No toca stock, pedidos, fotos ni descripción. NEXO/Panel ya es autoridad de nombre, SKU y precio normal.
  try {
    const { data: catalogRows, error: catErr } = await admin.schema("nexo_business").from("catalog_products")
      .select("product_id,name,sku,prices,active,external_refs")
      .eq("business_id", BUSINESS)
      .not("external_refs", "is", null)
      .limit(2000);
    if (catErr) throw new Error(catErr.message);
    const items = (catalogRows ?? []).map((p: any) => {
      const ref = p.external_refs?.["casaviva.company"] ?? {};
      const wooId = Number(ref.wooId ?? 0);
      const price = Number(p.prices?.USD ?? 0) / 100;
      return wooId > 0 && price > 0 ? {
        wooId, parentWooId: Number(ref.parentWooId ?? 0) || null,
        name: String(p.name ?? ""), sku: String(p.sku ?? ""), price,
        active: p.active !== false,
      } : null;
    }).filter(Boolean);
    for (let i = 0; i < items.length; i += 400) {
      const out = await core("POST", "panel/catalog/reconcile", { items: items.slice(i, i + 400) });
      report.catalogReconciled += (out.items ?? []).filter((x: { ok?: boolean }) => x.ok).length;
      report.catalogParents += Object.keys(out.parents ?? {}).length;
    }
  } catch (e) { report.errors.push("F: " + (e as Error).message); }

  return json(report.errors.length ? 207 : 200, report);
});
