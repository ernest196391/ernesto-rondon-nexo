// Panel único de Casa Viva: lee los pedidos de la web (WooCommerce + Casa Viva Core)
// para el panel NEXO. Solo lectura. Solo dueñas del negocio (nexo_panel_is_owner).
// La clave de WooCommerce (WOO_URL, WOO_CK, WOO_CS) nunca sale del servidor.
//   POST { action: "summary", from?, to? }          → resumen del periodo (por defecto, este mes)
//   POST { action: "orders", status?, search?, page? } → lista de pedidos (20 por página)
//   POST { action: "staff_pay", months? }            → ventas del mes por dependienta («A pagar este mes»)
//   Productos (Core 3.13.52): product_variations, variation_add, product_variable_create, products_visibility
//   Venta de proveedor (Core 3.14.14, D69): supplier_split, supplier_split_save, supplier_sales
//   Core 3.14.41: product_description_save, product_main_photo, product_duplicate, product_copies, product_copy,
//                 product_copy_publish, product_copy_discard
//   Lennys 28-oct: product_photos, product_photos_set — fotos de un producto de la web (se añaden, ✕ quita, ★ principal),
//                 por la API de WooCommerce (sin cambiar Core)
//   D121 (Core 3.14.71): market_list, market_item, market_publish, market_unpublish — «Proveedores · bajo pedido»
//                 (lee crm_market_items sin teléfonos; publicar/retirar por /panel/market/* de la web)
// Deploy: npx.cmd supabase functions deploy nexo-panel-web --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
// 29-oct: npm: en vez de jsr: (el empaquetador de Supabase no llegaba a jsr.io y no dejaba desplegar). Misma librería.
import { createClient } from "npm:@supabase/supabase-js@2";

const BUSINESS = "casa-viva";
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, apikey",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

const base = () => (Deno.env.get("WOO_URL") ?? "").replace(/\/$/, "");
// Fotos que el panel sube a su almacén (las únicas que se mandan a la galería de la web).
const GALLERY_PREFIX = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "") + "/storage/v1/object/public/nexo-product-photos/";
// D121: fotos de la bolsa del bot (bucket privado «mercado»): se firman 1 hora para verlas y para que la web las baje.
const MARKET_BUCKET = "mercado";
// Igual que noContacts() del bot (wa.me primero): nada de teléfonos, @usuarios ni enlaces de WhatsApp al panel ni a la web.
const noContacts = (t = "") => String(t).replace(/wa\.me\/\S+/gi, "").replace(/(\+?53)?[\s-]*\d[\d\s-]{6,}\d/g, "").replace(/@\w+/g, "").trim();
const auth = () => "Basic " + btoa(`${Deno.env.get("WOO_CK") ?? ""}:${Deno.env.get("WOO_CS") ?? ""}`);

// Grupos como en BizneCubano: concretado, pendiente, perdido.
const GROUP: Record<string, "done" | "pending" | "lost"> = {
  completed: "done",
  processing: "pending", "on-hold": "pending", pending: "pending",
  cancelled: "lost", refunded: "lost", failed: "lost",
};
const STATUS_ES: Record<string, string> = {
  completed: "Completado", processing: "En proceso", "on-hold": "En espera", pending: "Pendiente de pago",
  cancelled: "Cancelado", refunded: "Reembolsado", failed: "Fallido",
};

type WooOrder = {
  id: number; number: string; status: string; date_created: string; date_completed?: string | null; total: string; currency: string;
  billing: { first_name: string; last_name: string; phone: string };
  shipping: { address_1: string; city: string; state: string };
  line_items: { name: string; quantity: number; total: string; sku?: string; meta_data: { display_key?: string; display_value?: unknown }[] }[];
  meta_data: { key: string; value: unknown }[];
  customer_note: string;
};

async function woo(path: string, params: Record<string, string>) {
  const url = new URL(`${base()}/wp-json/wc/v3/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("_", String(Date.now())); // la CDN de Hostinger guarda respuestas viejas
  const res = await fetch(url, { headers: { authorization: auth() } });
  if (!res.ok) throw new Error(`woo ${path} ${res.status}`);
  return { data: await res.json(), pages: Number(res.headers.get("x-wp-totalpages") ?? "1"), total: Number(res.headers.get("x-wp-total") ?? "0") };
}

// Escribir en WooCommerce (PUT). Mismas claves que la lectura.
async function wooPut(path: string, body: unknown) {
  const res = await fetch(`${base()}/wp-json/wc/v3/${path}`, {
    method: "PUT", headers: { authorization: auth(), "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? `woo ${path} ${res.status}`);
  return data;
}

// <photo-set> Lennys 28-oct: el orden de fotos que pide el panel → las imágenes para WooCommerce (la primera = principal,
// el resto = galería). Las que ya tiene van por su id y SOLO si son de este producto; las nuevas, solo si son fotos
// subidas por el panel (prefix = nexo-product-photos). Máx. 9 (1 principal + 8 en la galería, Core 3.14.24); al menos 1.
// Nada se borra de la biblioteca de medios de la web: una foto quitada solo deja de salir en el producto.
const PHOTO_MAX = 9;
function photoSetPlan(currentIds: number[], wanted: unknown, prefix: string): { images: Array<{ id: number } | { src: string }> } | { error: string } {
  const list = Array.isArray(wanted) ? wanted : [];
  if (!list.length) return { error: "Deja al menos una foto." };
  if (list.length > PHOTO_MAX) return { error: `Caben ${PHOTO_MAX} fotos (1 principal + ${PHOTO_MAX - 1} en la galería). Quita alguna.` };
  const images: Array<{ id: number } | { src: string }> = [];
  const seen = new Set<string>();
  for (const w of list as Array<{ id?: unknown; url?: unknown }>) {
    const id = Number(w?.id);
    const url = String(w?.url ?? "");
    if (Number.isInteger(id) && id > 0) {
      if (!currentIds.includes(id)) return { error: "Una de las fotos ya no está en este producto. Cierra y vuelve a abrirlo." };
      if (!seen.has("id:" + id)) { seen.add("id:" + id); images.push({ id }); }
    } else if (prefix.startsWith("http") && url.startsWith(prefix) && !url.includes("..") && /\.(webp|jpe?g|png)$/i.test(url)) {
      if (!seen.has(url)) { seen.add(url); images.push({ src: url }); }
    } else return { error: "Foto no válida." };
  }
  return { images };
}
// </photo-set>

async function core(method: "GET" | "POST", path: string, body?: unknown) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${base()}/wp-json/casa-viva/v1/${path}${sep}_=${Date.now()}`, {
    method,
    headers: { "x-nexo-panel-key": Deno.env.get("CASAVIVA_PANEL_KEY") ?? "", "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  // D121: las rutas /panel/market/* responden { ok: false, error } (p. ej. «por debajo del mínimo»).
  if (!res.ok) throw new Error(data?.message ?? data?.error ?? `core ${path} ${res.status}`);
  return data;
}

const meta = (o: WooOrder, key: string) => o.meta_data.find(m => m.key === key)?.value ?? null;
const money = (v: string) => Math.round(Number(v || 0) * 100) / 100;
// 20-oct (Lennys): el % de las dependientas va sobre el precio de Casa Viva, sin la subida de la gestora.
// Core guarda en el pedido de una gestora _cvd_commission_base_amount (líneas a precio de Casa Viva).
// Sin gestora o sin ese dato: precio de Casa Viva = lo cobrado en productos (subida 0). El envío no cuenta.
function cvPrice(o: WooOrder) {
  const lines = Math.round(o.line_items.reduce((t, l) => t + Number(l.total || 0), 0) * 100) / 100;
  const raw = meta(o, "_cvd_owner_type") === "gestora" ? meta(o, "_cvd_commission_base_amount") : null;
  const b = raw === null || raw === "" ? NaN : Number(raw);
  const base = Number.isFinite(b) && b >= 0 ? Math.min(lines, Math.round(b * 100) / 100) : lines;
  return { lines, base, markup: Math.round((lines - base) * 100) / 100 };
}

async function names(ids: number[]) {
  const out: Record<number, string> = {};
  const unique = [...new Set(ids.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 100) {
    const { data } = await woo("customers", { include: unique.slice(i, i + 100).join(","), per_page: "100", role: "all" });
    for (const c of data as { id: number; first_name: string; last_name: string; username: string }[]) {
      out[c.id] = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.username;
    }
  }
  return out;
}

function row(o: WooOrder, people: Record<number, string>) {
  const ownerType = meta(o, "_cvd_owner_type");
  const ownerId = Number(meta(o, "_cvd_owner_user_id") ?? 0);
  return {
    id: o.id, number: o.number, date: o.date_created, status: o.status,
    // Core 3.14.69.11 (Lennys #581, 26-oct): número propio que nunca salta («Nº 292 · 8.º de hoy»); null en pruebas.
    seq: Number(meta(o, "_cvd_seq") ?? 0) || null, seqDay: Number(meta(o, "_cvd_seq_dia") ?? 0) || null, seqDate: meta(o, "_cvd_seq_fecha") || null,
    statusText: STATUS_ES[o.status] ?? o.status, group: GROUP[o.status] ?? "pending",
    operation: meta(o, "_cvd_operation_status"), total: money(o.total), currency: o.currency,
    shippingCup: Number(meta(o, "_cvd_shipping_fee_cup") ?? 0) || null,
    pickup: meta(o, "_cvd_fulfillment_type") === "pickup",
    // Día de entrega (Core 3.13.51): Y-m-d o vacío (= lo antes posible) y franja morning | afternoon.
    deliveryDate: meta(o, "_cvd_delivery_date") || null, deliveryWindow: meta(o, "_cvd_delivery_window") || null,
    customer: `${o.billing.first_name} ${o.billing.last_name}`.trim(), phone: o.billing.phone,
    address: [o.shipping.address_1, o.shipping.city].filter(Boolean).join(", "),
    gestora: ownerType === "gestora" && ownerId ? (people[ownerId] ?? `#${ownerId}`) : null,
    commission: Number(meta(o, "_cvd_commission_amount") ?? 0) || null,
    note: o.customer_note || null,
    // Venta de proveedor (bajo pedido, SKU MK-): el panel enseña el recuadro del reparto (Core 3.14.14, D69).
    supplier: o.line_items.some(l => /^MK-/i.test(l.sku ?? "")),
    items: o.line_items.map(l => ({
      name: l.name, qty: l.quantity, total: money(l.total),
      variant: l.meta_data.filter(m => m.display_key && !m.display_key.startsWith("_") && typeof m.display_value === "string")
        .map(m => `${m.display_key}: ${m.display_value}`).join(", ") || null,
    })),
  };
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!base() || !Deno.env.get("WOO_CK")) return json(500, { error: "La conexión con la web no está configurada." });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer /i, "");
  const { data: who } = await admin.auth.getUser(jwt);
  if (!who?.user) return json(401, { error: "Inicia sesión otra vez." });
  const { data: owner } = await admin.rpc("nexo_panel_is_owner", { p_user: who.user.id, p_business: BUSINESS });
  if (owner !== true) return json(403, { error: "Solo la dueña puede ver los pedidos de la web." });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* vacío */ }

  try {
    if (body.action === "summary") {
      const now = new Date();
      const from = typeof body.from === "string" ? body.from : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const to = typeof body.to === "string" ? body.to : now.toISOString();
      const orders: WooOrder[] = [];
      for (let page = 1; page <= 20; page++) {
        const { data, pages } = await woo("orders", { after: from, before: to, per_page: "100", page: String(page), status: "any" });
        orders.push(...data);
        if (page >= pages) break;
      }
      const sum = { done: 0, pending: 0, lost: 0 };
      const count = { done: 0, pending: 0, lost: 0 };
      let doneMarkup = 0; // 20-oct (Lennys): subida de las gestoras en lo vendido (lo demás es precio de Casa Viva)
      const byGestora: Record<number, { orders: number; total: number }> = {};
      for (const o of orders) {
        const g = GROUP[o.status] ?? "pending";
        sum[g] += money(o.total); count[g]++;
        if (g === "done") doneMarkup += cvPrice(o).markup;
        const id = meta(o, "_cvd_owner_type") === "gestora" ? Number(meta(o, "_cvd_owner_user_id") ?? 0) : 0;
        if (id && g !== "lost") { byGestora[id] ??= { orders: 0, total: 0 }; byGestora[id].orders++; byGestora[id].total += money(o.total); }
      }
      const people = await names(Object.keys(byGestora).map(Number));
      const ranking = Object.entries(byGestora)
        .map(([id, v]) => ({ name: people[Number(id)] ?? `#${id}`, orders: v.orders, total: Math.round(v.total * 100) / 100 }))
        .sort((a, b) => b.total - a.total).slice(0, 10);
      return json(200, {
        from, to, currency: orders[0]?.currency ?? "USD", orders: orders.length,
        total: Math.round((sum.done + sum.pending + sum.lost) * 100) / 100,
        done: { orders: count.done, total: Math.round(sum.done * 100) / 100,
          base: Math.round((sum.done - doneMarkup) * 100) / 100, markup: Math.round(doneMarkup * 100) / 100 },
        pending: { orders: count.pending, total: Math.round(sum.pending * 100) / 100 },
        lost: { orders: count.lost, total: Math.round(sum.lost * 100) / 100 },
        ranking,
      });
    }

    // Historial por meses de la web (vendido / cancelado y número de pedidos), últimos N meses.
    if (body.action === "history") {
      const months = Math.min(36, Math.max(1, Number(body.months) || 12));
      const now = new Date();
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1)).toISOString();
      const by: Record<string, { done: number; doneOrders: number; lost: number; lostOrders: number; pending: number; pendingOrders: number }> = {};
      for (let page = 1; page <= 50; page++) {
        const { data, pages } = await woo("orders", { after: from, per_page: "100", page: String(page), status: "any" });
        for (const o of data as WooOrder[]) {
          const m = o.date_created.slice(0, 7);
          const g = GROUP[o.status] ?? "pending";
          by[m] ??= { done: 0, doneOrders: 0, lost: 0, lostOrders: 0, pending: 0, pendingOrders: 0 };
          by[m][g] += money(o.total); by[m][(g + "Orders") as "doneOrders"]++;
        }
        if (page >= pages) break;
      }
      return json(200, { months: by });
    }

    // «A pagar este mes» (Lennys 16-oct): ventas concretadas de la web por mes (solo productos, sin envío) y
    // quién de las dependientas atendió cada pedido. Solo lectura: no crea pagos. Sin tocar Core.
    // Dependienta de un pedido = la primera que sea dependienta (rol cvd_clerk) de: quien recibió el dinero
    // (_cvd_collection_received_by), quien lo entregó (_cvd_handed_over_by), quien empezó a prepararlo (_cvd_operation_history).
    if (body.action === "staff_pay") {
      const n = Math.min(3, Math.max(1, Number(body.months) || 2));
      const { data: clerkRows } = await woo("customers", { role: "cvd_clerk", per_page: "100" });
      const clerks: Record<number, string> = {};
      for (const c of clerkRows as { id: number; first_name: string; last_name: string; username: string }[]) {
        clerks[c.id] = `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.username;
      }
      const now = new Date(Date.now() - 4 * 3600_000); // hora de Cuba (UTC−4)
      const pad = (x: number) => String(x).padStart(2, "0");
      const out = [];
      for (let k = 0; k < n; k++) {
        const y = now.getUTCFullYear(), m0 = now.getUTCMonth() - k;
        const start = new Date(Date.UTC(y, m0, 1)), end = new Date(Date.UTC(y, m0 + 1, 1));
        const month = `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}`;
        const after = `${month}-01T00:00:00`, before = `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-01T00:00:00`;
        // 20-oct (Lennys): el % de las dependientas va sobre el precio de Casa Viva, sin la subida de la gestora.
        // «sales» = precio de Casa Viva; «salesTotal» = lo cobrado en productos; «markup» = subida de las gestoras.
        const by: Record<string, { name: string; orders: number; sales: number }> = {};
        // 20-oct (Lennys): el bote del 0,5 % de los pedidos cerrados un día es de la dependienta
        // de turno de ese día (quien abrió el turno de la tienda en la caja). Sin turno ese día: como antes.
        const lastDay = new Date(end.getTime() - 86_400_000).toISOString().slice(0, 10);
        const { data: shiftDays } = await admin.rpc("nexo_business_shift_days", { p_business: BUSINESS, p_from: `${month}-01`, p_to: lastDay });
        const onDuty = new Map(((Array.isArray(shiftDays) ? shiftDays : []) as { day: string; staffId: string; name: string; wooUserId: number | null }[])
          .map(d => [d.day, d]));
        let total = 0, orders = 0, raised = 0;
        for (let page = 1; page <= 30; page++) {
          const { data, pages } = await woo("orders", { after, before, status: "completed", per_page: "100", page: String(page) });
          for (const o of data as WooOrder[]) {
            const price = cvPrice(o), sales = price.base;
            raised += price.lines;
            const hist = meta(o, "_cvd_operation_history");
            const firstOp = Array.isArray(hist) && hist.length ? Number((hist[0] as { user_id?: number }).user_id ?? 0) : 0;
            const shift = onDuty.get(String(o.date_completed ?? o.date_created ?? "").slice(0, 10));
            const shiftWoo = shift?.wooUserId && clerks[shift.wooUserId] ? shift.wooUserId : 0;
            const who = shift ? shiftWoo : [meta(o, "_cvd_collection_received_by"), meta(o, "_cvd_handed_over_by"), firstOp].map(Number).find(id => id && clerks[id]) ?? 0;
            const key = shift && !shiftWoo ? `turno:${shift.staffId}` : who ? String(who) : "unknown";
            by[key] ??= { name: shift && !shiftWoo ? shift.name : who ? clerks[who] : "", orders: 0, sales: 0 };
            by[key].orders++; by[key].sales = Math.round((by[key].sales + sales) * 100) / 100;
            total += sales; orders++;
          }
          if (page >= pages) break;
        }
        out.push({ month, orders, sales: Math.round(total * 100) / 100,
          salesTotal: Math.round(raised * 100) / 100, markup: Math.round((raised - total) * 100) / 100,
          clerks: Object.entries(by).filter(([k]) => k !== "unknown").map(([id, v]) => ({ id: /^\d+$/.test(id) ? Number(id) : id, ...v })).sort((a, b) => b.sales - a.sales),
          unknown: by.unknown ?? { name: "", orders: 0, sales: 0 } });
      }
      return json(200, { months: out });
    }

    if (body.action === "orders") {
      const params: Record<string, string> = { per_page: "20", page: String(Math.max(1, Number(body.page) || 1)), status: "any" };
      if (typeof body.status === "string" && body.status) params.status = body.status;
      if (typeof body.search === "string" && body.search.trim()) params.search = body.search.trim();
      const { data, pages, total } = await woo("orders", params);
      const ids = (data as WooOrder[]).filter(o => meta(o, "_cvd_owner_type") === "gestora").map(o => Number(meta(o, "_cvd_owner_user_id") ?? 0));
      const people = await names(ids);
      return json(200, { orders: (data as WooOrder[]).map(o => row(o, people)), pages, total });
    }

    // Gestoras y pagos: puerta CVD_Panel_Bridge de Core (clave CASAVIVA_PANEL_KEY, solo en el servidor).
    if (body.action === "gestoras") return json(200, await core("GET", "panel/gestoras"));
    if (body.action === "gestora_status") {
      const status = String(body.status ?? "");
      if (!["approved", "rejected"].includes(status)) return json(400, { error: "Estado no válido." });
      return json(200, await core("POST", `panel/gestoras/${Number(body.id)}/status`, { status }));
    }
    if (body.action === "payouts") {
      const q = new URLSearchParams();
      if (typeof body.status === "string" && body.status) q.set("status", body.status);
      if (Number(body.gestoraId) > 0) q.set("owner", String(Number(body.gestoraId)));
      return json(200, await core("GET", `panel/payouts?${q}`));
    }
    if (body.action === "payout_action") {
      const act = String(body.do ?? "");
      if (!["approve", "pay", "reject"].includes(act)) return json(400, { error: "Acción no válida." });
      return json(200, await core("POST", `panel/payouts/${Number(body.id)}`, { action: act, reference: String(body.reference ?? "") }));
    }

    // Programa de gestoras (Core 3.14.29, D53–D60): último cálculo del libro y «Recalcular ahora». Solo lectura de dinero: no paga nada.
    if (body.action === "programa") return json(200, await core("GET", "panel/programa"));
    if (body.action === "programa_calcular") return json(200, await core("POST", "panel/programa/calcular", {}));
    // Core 3.14.32 (D79): marcar «Revisada» una alerta «ganancia_alta» o «cuenta_compartida» (el cierre del mes espera por ellas).
    if (body.action === "programa_revisar") {
      const key = String(body.key ?? "");
      if (!/^(ganancia_alta|cuenta_compartida):[0-9a-z_:,]{1,120}$/.test(key)) return json(400, { error: "Alerta no válida." });
      return json(200, await core("POST", "panel/programa/revisar", { key }));
    }

    // Inventario: existencias de la web para comparar, y copiar a la web un precio cambiado en el panel.
    if (body.action === "web_levels") return json(200, await core("GET", "panel/stock/levels"));
    if (body.action === "push_price") {
      const price = Number(body.price);
      if (!(Number(body.wooId) > 0) || !(price > 0)) return json(400, { error: "Producto o precio no válido." });
      return json(200, await core("POST", "panel/products/price", { wooId: Number(body.wooId), price }));
    }

    // Precios en masa / oferta: [{wooId, regular, sale|null}] → precio normal y de oferta en la web.
    if (body.action === "push_prices") {
      const items = (Array.isArray(body.items) ? body.items : []).filter((i: { wooId?: number }) => Number(i?.wooId) > 0).slice(0, 500);
      if (!items.length) return json(200, { items: [] });
      return json(200, await core("POST", "panel/products/prices", { items }));
    }

    // Costo de compra (USD por unidad) → Core 3.14.0 (_cvd_cost_usd, origen manual). Devuelve el mínimo y si el precio llega.
    if (body.action === "product_web_cost") {
      const costUsd = Number(body.costUsd);
      if (!(Number(body.wooId) > 0) || !(costUsd >= 0)) return json(400, { error: "Producto o costo no válido." });
      return json(200, await core("POST", "panel/products/cost", { wooId: Number(body.wooId), costUsd, source: "manual",
        // Core 3.14.24: gastos fijos de este producto (proporcionales a su costo) para que la web use el mismo mínimo que el panel.
        fixedUsd: body.fixedUsd != null && body.fixedUsd !== "" && Number(body.fixedUsd) >= 0 ? Number(body.fixedUsd) : undefined }));
    }

    // Fotos de la galería (Core 3.14.24): solo URLs de las fotos subidas por el panel a nexo-product-photos, máx. 8.
    const galleryOf = (b: Record<string, unknown>) => (Array.isArray(b.galleryUrls) ? b.galleryUrls : [])
      .map(u => String(u ?? "")).filter(u => u.startsWith(GALLERY_PREFIX)).slice(0, 8);

    // Producto: crear en la web (sin wooId) o copiar cambios (con wooId). D39.
    if (body.action === "product_web_save") {
      const price = Number(body.price);
      const name = String(body.name ?? "").trim();
      if (!name || !(price > 0)) return json(400, { error: "Falta el nombre o el precio." });
      return json(200, await core("POST", "panel/products/save", {
        wooId: Number(body.wooId) > 0 ? Number(body.wooId) : undefined, nexoId: String(body.nexoId ?? ""), name, price,
        category: String(body.category ?? ""), imageUrl: String(body.imageUrl ?? ""), sku: String(body.sku ?? ""), active: body.active !== false,
        galleryUrls: galleryOf(body), // Core 3.14.24: más fotos (galería de la web)
        // Core 3.14.40 (Lennys 18-oct): descripción escrita en el panel (texto; solo se manda si cambió).
        ...(typeof body.description === "string" ? { description: String(body.description).slice(0, 6000) } : {}),
      }));
    }
    // Core 3.14.40: descripción de la web (texto) y lo que le falta a la ficha (medidas, material…), al abrir un producto.
    if (body.action === "product_ficha") {
      if (!(Number(body.wooId) > 0)) return json(400, { error: "Producto no válido." });
      return json(200, await core("GET", `panel/products/${Number(body.wooId)}/ficha`));
    }

    // ---------- Diseños y colores (variaciones de la web) y «Dejar de vender» (Core 3.13.52) ----------
    // Quién lo hizo queda anotado en Core (cvd_panel_product_log) y en NEXO (cost_audit).
    const by = who.user.email ?? who.user.phone ?? who.user.id;
    type WebVariation = { id: number; label: string; sku: string; price: number; stock: number | null; status: string; image: string | null;
      recent?: { orderId: number; itemId: number; status: string; reduced: number }[] };
    // Las líneas recientes que la web ya descontó (o devolvió) no las debe volver a aplicar el puente en la caja.
    const seenKeys = (v: WebVariation) => (v.recent ?? []).flatMap(l =>
      l.reduced > 0 ? [`web:${l.orderId}:${l.itemId}:out`] : ["cancelled", "refunded", "failed"].includes(l.status) ? [`web:${l.orderId}:${l.itemId}:back`] : []);
    const linkVariants = async (group: string, parent: { id: number; name: string }, list: WebVariation[], extra: { category?: string } = {}) => {
      if (!list.length) return [];
      const { data, error } = await admin.rpc("nexo_business_variant_link", {
        p_business: BUSINESS, p_user: who.user.id, p_group: group,
        p_items: list.map(v => ({ wooId: v.id, parentWooId: parent.id, label: v.label, parentName: parent.name, price: v.price, sku: v.sku,
          imageUrl: v.image ?? "", category: extra.category ?? "", webStock: v.stock, seen: seenKeys(v) })),
      });
      if (error || data?.error) throw new Error("No se pudo enlazar con la caja: " + (error?.message ?? data.error));
      return data.items as { wooId: number; productId: string; created: boolean }[];
    };

    // Ver los diseños de un producto. Los que la web tiene y la caja no (a la venta) se enlazan ahora,
    // con la cantidad de la web como punto de partida. group = el grupo de la caja (variant_of).
    if (body.action === "product_variations") {
      const data = await core("GET", `panel/products/${Number(body.wooId)}/variations`);
      const group = String(body.group ?? "").trim();
      // La RPC no toca las que ya están en la caja (por wooId): solo crea las que faltan.
      const onSale = (data.variations as WebVariation[]).filter(v => v.status === "publish" && v.price > 0);
      const linked = group ? await linkVariants(group, data.parent, onSale) : [];
      return json(200, { ...data, linked });
    }
    // Añadir un diseño o color a un producto que ya tiene diseños: Core lo crea con 0 y la caja lo enlaza.
    if (body.action === "variation_add") {
      const group = String(body.group ?? "").trim();
      const price = Number(body.price);
      if (!group || !(price > 0)) return json(400, { error: "Falta el producto o el precio." });
      const out = await core("POST", `panel/products/${Number(body.wooId)}/variations`, {
        label: String(body.label ?? "").trim(), price, imageUrl: String(body.imageUrl ?? ""), by,
      });
      const v = out.variation as WebVariation & { existing: boolean; retired: boolean };
      // Ya existía y está retirado en la web: no se reactiva solo; la dueña decide con «Volver a vender».
      if (v.existing && v.retired) return json(200, { variation: v, productId: null, created: false, existing: true, retired: true });
      // Una variante recién creada empieza en 0 en la web: la cantidad la pone la caja (y el puente la copia).
      const [link] = await linkVariants(group, { id: Number(out.parentId), name: String(out.parentName ?? "") }, [{ ...v, image: v.image ?? (String(body.imageUrl ?? "") || null), stock: v.existing ? v.stock : 0 }]);
      return json(200, { variation: v, productId: link?.productId ?? null, created: link?.created ?? false, existing: v.existing, retired: false });
    }
    // Producto nuevo con diseños (en la web como producto con variantes; en la caja, un grupo).
    if (body.action === "product_variable_create") {
      const price = Number(body.price);
      const designs = (Array.isArray(body.designs) ? body.designs : []).slice(0, 30)
        .map((d: { label?: string; imageUrl?: string }) => ({ label: String(d?.label ?? "").trim(), imageUrl: String(d?.imageUrl ?? "") }))
        .filter((d: { label: string }) => d.label);
      if (!String(body.name ?? "").trim() || !(price > 0) || !designs.length) return json(400, { error: "Falta el nombre, el precio o un diseño." });
      const out = await core("POST", "panel/products/variable", {
        name: String(body.name).trim(), price, category: String(body.category ?? ""), imageUrl: String(body.imageUrl ?? ""),
        designs, ref: String(body.ref ?? ""), by, galleryUrls: galleryOf(body),
      });
      const vars = (out.variations as (WebVariation & { existing: boolean })[]).map(v => ({ ...v, stock: v.existing ? v.stock : 0 }));
      const linked = await linkVariants(`cv-${out.parentId}`, { id: out.parentId, name: out.name }, vars, { category: String(body.category ?? "") });
      return json(200, { parentId: out.parentId, url: out.url, group: `cv-${out.parentId}`, variations: out.variations, linked });
    }
    // Dejar de vender / volver a vender en la web: [wooId] (productos, sus padres o diseños sueltos).
    if (body.action === "products_visibility") {
      const items = (Array.isArray(body.wooIds) ? body.wooIds : []).map(Number).filter(n => n > 0).slice(0, 300);
      if (!items.length) return json(200, { items: [] });
      return json(200, await core("POST", "panel/products/visibility", { items, sell: body.sell === true, by }));
    }

    // ---------- Core 3.14.41 (Lennys 20-oct): descripción de productos con diseños, foto principal y «Duplicar» ----------
    // Descripción del producto (en uno con diseños, la del padre: la misma para todos los colores).
    if (body.action === "product_description_save") {
      if (!(Number(body.wooId) > 0) || typeof body.description !== "string" || !body.description.trim()) return json(400, { error: "Escribe la descripción." });
      return json(200, await core("POST", `panel/products/${Number(body.wooId)}/description`, { description: String(body.description).slice(0, 6000), by }));
    }
    // Foto principal (la de la tienda, las gestoras y el bot). Solo fotos subidas por el panel a nexo-product-photos.
    if (body.action === "product_main_photo") {
      const url = String(body.imageUrl ?? "");
      if (!(Number(body.wooId) > 0) || !url.startsWith(GALLERY_PREFIX)) return json(400, { error: "Foto no válida." });
      return json(200, await core("POST", `panel/products/${Number(body.wooId)}/photo`, { imageUrl: url, by }));
    }
    // Lennys 28-oct: fotos de un producto (simple o con diseños; no de un diseño suelto). Leer y guardar en el orden elegido.
    type WooImage = { id: number; src: string };
    const productImages = async (wooId: number) => {
      const { data } = await woo(`products/${wooId}`, {});
      if (!data || data.type === "variation") throw new Error("Producto no válido.");
      return ((data.images ?? []) as WooImage[]).map(i => ({ id: Number(i.id), src: String(i.src) }));
    };
    if (body.action === "product_photos") {
      if (!(Number(body.wooId) > 0)) return json(400, { error: "Producto no válido." });
      return json(200, { images: await productImages(Number(body.wooId)) });
    }
    if (body.action === "product_photos_set") {
      const wooId = Number(body.wooId);
      if (!(wooId > 0)) return json(400, { error: "Producto no válido." });
      const now = await productImages(wooId);
      const plan = photoSetPlan(now.map(i => i.id), body.photos, GALLERY_PREFIX);
      if ("error" in plan) return json(400, { error: plan.error });
      const out = await wooPut(`products/${wooId}`, { images: plan.images,
        meta_data: [{ key: "_cvd_panel_photos_log", value: JSON.stringify({ at: new Date().toISOString(), by, before: now.map(i => i.id), count: plan.images.length }) }] });
      const images = ((out.images ?? []) as WooImage[]).map(i => ({ id: Number(i.id), src: String(i.src) }));
      // Las nuevas que la web no pudo bajar no se pierden en silencio: se dice cuántas faltan.
      const missing = plan.images.length - images.length;
      return json(200, { images, ...(missing > 0 ? { warning: `${missing} foto(s) no se pudieron poner en la web. Prueba otra vez.` } : {}) });
    }
    // Duplicar: copia en borrador en la web (nadie la ve). La caja no la conoce hasta publicarla.
    if (body.action === "product_duplicate") {
      if (!(Number(body.wooId) > 0)) return json(400, { error: "Producto no válido." });
      return json(200, await core("POST", `panel/products/${Number(body.wooId)}/duplicate`, { ref: String(body.ref ?? ""), by }));
    }
    if (body.action === "product_copies") return json(200, await core("GET", "panel/products/copies"));
    if (body.action === "product_copy") {
      if (!(Number(body.wooId) > 0)) return json(400, { error: "Copia no válida." });
      return json(200, await core("GET", `panel/products/${Number(body.wooId)}/copy`));
    }
    if (body.action === "product_copy_discard") {
      if (!(Number(body.wooId) > 0)) return json(400, { error: "Copia no válida." });
      return json(200, await core("POST", `panel/products/${Number(body.wooId)}/copy-discard`, { by }));
    }
    // Publicar la copia. Con diseños: sus diseños a la venta se enlazan aquí con la caja (grupo cv-<id>, 0 unidades;
    // las pone el panel). Sin diseños: la caja la crea el panel (nexo_business_product_save, como dueña) y la enlaza.
    if (body.action === "product_copy_publish") {
      const price = Number(body.price);
      const name = String(body.name ?? "").trim();
      if (!(Number(body.wooId) > 0) || !name || !(price > 0)) return json(400, { error: "Falta el nombre o el precio." });
      const photo = (u: unknown) => { const s = String(u ?? ""); return s.startsWith(GALLERY_PREFIX) ? s : ""; };
      const photos: Record<string, string> = {};
      for (const [k, v] of Object.entries((body.photos && typeof body.photos === "object") ? body.photos as Record<string, unknown> : {})) {
        if (Number(k) > 0 && photo(v)) photos[String(Number(k))] = photo(v);
      }
      const out = await core("POST", `panel/products/${Number(body.wooId)}/copy-publish`, {
        name, price, category: String(body.category ?? ""), imageUrl: photo(body.imageUrl), photos,
        keep: (Array.isArray(body.keep) ? body.keep : []).map(Number).filter((n: number) => n > 0).slice(0, 100),
        add: (Array.isArray(body.add) ? body.add : []).slice(0, 30).map((d: { label?: string; imageUrl?: string }) => ({ label: String(d?.label ?? "").trim(), imageUrl: photo(d?.imageUrl) })),
        ...(typeof body.description === "string" ? { description: String(body.description).slice(0, 6000) } : {}),
        by,
      });
      if (out.type !== "variable") return json(200, { ...out, group: null, linked: [] });
      const vars = (out.variations as WebVariation[]).filter(v => v.status === "publish" && v.price > 0).map(v => ({ ...v, stock: 0 }));
      const linked = await linkVariants(`cv-${out.wooId}`, { id: Number(out.wooId), name: String(out.name ?? name) }, vars, { category: String(out.category ?? body.category ?? "") });
      return json(200, { ...out, group: `cv-${out.wooId}`, linked });
    }

    // Mensajeros: lista y aprobar/rechazar (misma lógica que gestoras en Core).
    if (body.action === "messengers") return json(200, await core("GET", "panel/messengers"));
    if (body.action === "messenger_status") {
      const status = String(body.status ?? "");
      if (!["approved", "rejected"].includes(status)) return json(400, { error: "Estado no válido." });
      return json(200, await core("POST", `panel/messengers/${Number(body.id)}/status`, { status }));
    }

    // Clientes (Core cvd_clients): todos, o de una gestora; la dueña añade o corrige.
    if (body.action === "clients") {
      const q = new URLSearchParams();
      if (Number(body.ownerId) > 0) q.set("owner", String(Number(body.ownerId)));
      if (typeof body.search === "string" && body.search.trim()) q.set("search", body.search.trim());
      return json(200, await core("GET", `panel/clients?${q}`));
    }
    if (body.action === "client_save") {
      return json(200, await core("POST", "panel/clients", {
        phone: String(body.phone ?? ""), name: String(body.name ?? ""), note: String(body.note ?? ""),
        ownerId: Number(body.ownerId) > 0 ? Number(body.ownerId) : 0, optOut: typeof body.optOut === "boolean" ? body.optOut : null,
      }));
    }

    // Mensajería: tarifas por zona en CUP (las que usa el checkout de la web).
    if (body.action === "shipping_rates") return json(200, await core("GET", "panel/shipping-rates"));
    if (body.action === "shipping_rate_save") {
      const fee = Number(body.fee);
      const municipality = String(body.municipality ?? "").trim();
      if (!municipality || !Number.isInteger(fee) || fee < 0 || fee > 100000) return json(400, { error: "Municipio o tarifa no válidos." });
      return json(200, await core("POST", "panel/shipping-rates", { municipality, zone: String(body.zone ?? "").trim(), fee, active: body.active !== false }));
    }

    // Tasa del día de la web (Core 3.13.51): la calculadora y el "· N CUP" de las gestoras. VivaBot la pone
    // cada mañana desde «FORMAS DE PAGO»; aquí la dueña la ve y corrige. Solo se mandan los campos escritos.
    if (body.action === "daily_rates") return json(200, await core("GET", "panel/daily-rates"));
    if (body.action === "daily_rates_save") {
      const out: Record<string, number> = {};
      const limits: Record<string, [number, number]> = { cup: [50, 5000], eur: [0.5, 2], clasica: [0.8, 2], zelle: [0.8, 2], paypalPct: [0, 30] };
      for (const [k, [min, max]] of Object.entries(limits)) {
        if (body[k] === undefined || body[k] === null || body[k] === "") continue;
        const n = Number(String(body[k]).replace(",", "."));
        if (!Number.isFinite(n) || n < min || n > max) return json(400, { error: `Valor no válido: ${k} (entre ${min} y ${max}).` });
        out[k] = n;
      }
      if (!Object.keys(out).length) return json(400, { error: "Escribe al menos una tasa." });
      return json(200, await core("POST", "panel/daily-rates", out));
    }

    // Tarjetas de la tienda (Core 3.13.50): nombre + últimos 4 (nunca el número completo), activar/desactivar,
    // y los cobros de la web que no fueron en efectivo, con a qué tarjeta entró cada uno y su número.
    if (body.action === "pay_accounts") return json(200, await core("GET", "panel/pay-accounts"));
    if (body.action === "pay_account_save") {
      const last4 = String(body.last4 ?? "").trim();
      if (last4 && !/^\d{4}$/.test(last4)) return json(400, { error: "Escribe solo los últimos 4 números de la tarjeta." });
      return json(200, await core("POST", "panel/pay-accounts", {
        id: String(body.id ?? ""), label: String(body.label ?? "").trim().slice(0, 40), last4, active: body.active !== false,
      }));
    }
    if (body.action === "web_collections") {
      const day = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
      const q = new URLSearchParams({ from: day(body.from), to: day(body.to) });
      return json(200, await core("GET", `panel/collections?${q}`));
    }

    // Pedidos: las mismas acciones que /ventas/ (Core aplica sus reglas y firma como la dueña).
    if (body.action === "sale") {
      const q = new URLSearchParams({ search: String(body.number ?? "") });
      const data = await core("GET", `panel/sales?${q}`);
      const one = (data.orders ?? []).find((o: { number: string }) => String(o.number) === String(body.number));
      return one ? json(200, one) : json(404, { error: "No encontré ese pedido entre los 50 más recientes." });
    }
    // Editar un pedido abierto. Las diferencias de stock de líneas ya descontadas se aplican también en la caja.
    if (body.action === "sale_detail") return json(200, await core("GET", `panel/sales/${Number(body.id)}/detail`));
    if (body.action === "sale_edit") {
      const id = Number(body.id);
      const out = await core("POST", `panel/sales/${id}/edit`, {
        lines: Array.isArray(body.lines) ? body.lines : [], add: Array.isArray(body.add) ? body.add : [],
        phone: body.phone ?? "", address: body.address ?? "", note: typeof body.note === "string" ? body.note : undefined,
        // Core 3.13.97: nombre, día y franja de entrega; «by» = quién lo pulsó (va en la nota del pedido).
        firstName: typeof body.firstName === "string" ? body.firstName : undefined, lastName: typeof body.lastName === "string" ? body.lastName : undefined,
        deliveryDate: typeof body.deliveryDate === "string" ? body.deliveryDate : undefined, deliveryWindow: typeof body.deliveryWindow === "string" ? body.deliveryWindow : undefined,
        by,
      });
      const stamp = Date.now();
      for (const s of (out.stock ?? []) as Array<{ itemId: number; wooId: number; delta: number }>) {
        if (!s.delta) continue;
        // Si el puente aún no restó esta línea, la restará él con la cantidad nueva: no duplicar.
        const { data: synced } = await admin.rpc("nexo_business_web_line_synced", { p_business: BUSINESS, p_order: id, p_item: s.itemId });
        if (synced !== true) continue;
        await admin.rpc("nexo_business_stock_from_web", { p_business: BUSINESS, p_key: `web:${id}:${s.itemId}:edit:${stamp}`, p_woo_id: s.wooId, p_delta: s.delta, p_order: String(id) });
      }
      return json(200, out);
    }
    // ---------- D121 (Core 3.14.71): «Proveedores · bajo pedido» — la bolsa del bot (crm_market_items) ----------
    // Solo LECTURA de la bolsa, sin el teléfono ni el chat del proveedor. Publicar y retirar los hace la web
    // (/panel/market/*): allí se calcula la comisión fija (40 % de la ganancia) y se rechaza un precio bajo el mínimo.
    // Aquí solo se marca el artículo en la bolsa (publicado / agotado, precio fijado a mano) para que el bot lo respete.
    if (typeof body.action === "string" && body.action.startsWith("market_")) {
      const { data: biz } = await admin.from("crm_businesses").select("id").eq("slug", BUSINESS).maybeSingle();
      if (!biz?.id) return json(500, { error: "No encuentro la bolsa de proveedores de Casa Viva." });
      const um = (who.user.user_metadata ?? {}) as Record<string, unknown>;
      const byName = String(um.full_name ?? um.name ?? "").trim().slice(0, 60);
      const COLS = "id,title,description,category,supplier_price,currency,my_price,price_locked,status,seller_name,group_name,photos,photos_clean,first_seen,last_seen,times_seen,published_url";
      type Item = { id: number; title: string; description: string | null; category: string | null; supplier_price: number | null; currency: string | null;
        my_price: number | null; price_locked: boolean; status: string; seller_name: string | null; group_name: string | null; photos: string[] | null;
        photos_clean: string[] | null; first_seen: string; last_seen: string; times_seen: number; published_url: string | null; raw_text?: string | null };
      const pics = (it: Item) => ((it.photos_clean?.length ? it.photos_clean : it.photos) ?? []).filter(Boolean);
      const sign = async (paths: string[]) => {
        if (!paths.length) return {} as Record<string, string>;
        const { data } = await admin.storage.from(MARKET_BUCKET).createSignedUrls(paths, 3600);
        return Object.fromEntries((data ?? []).filter(d => d.signedUrl && d.path).map(d => [d.path as string, d.signedUrl as string]));
      };
      const days = (iso: string) => Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 864e5));
      // Lo que ve el panel de cada artículo: nunca seller_phone, seller_jid ni group_jid (ni se leen).
      const card = (it: Item, thumb: string | null) => ({
        id: it.id, sku: `MK-${it.id}`, title: noContacts(it.title), category: it.category, cost: Number(it.supplier_price),
        myPrice: it.my_price == null ? null : Number(it.my_price), priceLocked: !!it.price_locked, status: it.status,
        supplier: noContacts(it.seller_name ?? "") || "Proveedor", group: it.group_name ?? "", seenDays: days(it.last_seen),
        firstSeen: it.first_seen, timesSeen: it.times_seen, photos: pics(it).length, thumb, publishedUrl: it.published_url,
      });
      const preview = async (rows: Item[]) => {
        try {
          return await core("POST", "panel/market/preview", { items: rows.map(r => ({ id: r.id, title: r.title, cost: Number(r.supplier_price), category: r.category ?? "" })) });
        } catch (e) {
          console.error("market preview", (e as Error).message);
          return { items: {}, departments: [], error: "La web todavía no tiene esta función (Core 3.14.71)." };
        }
      };
      const getItem = async (id: number, extra = "") => {
        const { data } = await admin.from("crm_market_items").select(COLS + extra).eq("business_id", biz.id).eq("id", id).maybeSingle();
        return data as Item | null;
      };

      if (body.action === "market_list") {
        const tab = body.tab === "publicados" ? "publicados" : "bolsa";
        const words = String(body.search ?? "").replace(/[%_,()*]/g, " ").trim().split(/\s+/).filter(Boolean).slice(0, 5);
        let q = admin.from("crm_market_items").select(COLS).eq("business_id", biz.id).eq("currency", "USD").gt("supplier_price", 0);
        q = tab === "publicados" ? q.eq("status", "publicado") : q.in("status", ["nuevo", "aprobado"]);
        if (words.length) q = q.ilike("title", `%${words.join("%")}%`);
        const { data, error } = await q.order("last_seen", { ascending: false }).limit(60);
        if (error) throw new Error(error.message);
        const rows = (data ?? []) as Item[];
        const firsts = rows.map(r => pics(r)[0]).filter(Boolean) as string[];
        const signed = await sign(firsts);
        // «Ya publicado de otro proveedor»: mismo comienzo del nombre (3 palabras) entre lo publicado.
        const key = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ ]/g, " ").split(/\s+/).filter(w => w.length > 2).slice(0, 3).join(" ");
        const twins: Record<string, number> = {};
        if (tab === "bolsa" && rows.length) {
          const { data: pub } = await admin.from("crm_market_items").select("id,title").eq("business_id", biz.id).eq("status", "publicado").limit(1000);
          for (const p of (pub ?? []) as { id: number; title: string }[]) { const k = key(p.title); if (k.split(" ").length >= 2) twins[k] ??= p.id; }
        }
        const pv = await preview(rows);
        return json(200, {
          tab, departments: pv.departments ?? [], previewError: pv.error ?? null,
          items: rows.map(r => ({ ...card(r, signed[pics(r)[0]] ?? null), quote: pv.items?.[String(r.id)] ?? null,
            twin: twins[key(r.title)] && twins[key(r.title)] !== r.id ? `MK-${twins[key(r.title)]}` : null })),
        });
      }

      if (body.action === "market_item") {
        const it = await getItem(Number(body.id), ",raw_text");
        if (!it) return json(404, { error: "Ese artículo ya no está en la bolsa." });
        const list = pics(it).slice(0, 4);
        const signed = await sign(list);
        const pv = await preview([it]);
        return json(200, { ...card(it, signed[list[0]] ?? null), images: list.map(p => signed[p]).filter(Boolean),
          description: noContacts(it.description ?? ""), ad: noContacts(it.raw_text ?? "").slice(0, 800),
          quote: pv.items?.[String(it.id)] ?? null, departments: pv.departments ?? [], previewError: pv.error ?? null });
      }

      if (body.action === "market_publish") {
        const it = await getItem(Number(body.id));
        const price = Math.round(Number(body.price) * 100) / 100;
        if (!it) return json(404, { error: "Ese artículo ya no está en la bolsa." });
        if (it.currency !== "USD" || !(Number(it.supplier_price) > 0)) return json(400, { error: "Este artículo no tiene precio del proveedor en USD." });
        if (it.status === "descartado") return json(400, { error: "Ernesto descartó este artículo." });
        if (!(price > 0)) return json(400, { error: "Escribe el precio de venta." });
        const list = pics(it).slice(0, 4);
        const signed = await sign(list);
        const images = list.map(p => signed[p]).filter(Boolean);
        if (!images.length && !it.published_url) return json(400, { error: "No tiene fotos: no se puede publicar." });
        const department = String(body.department ?? "").replace(/[^a-z0-9-]/gi, "").slice(0, 60);
        const out = await core("POST", "panel/market/publish", {
          item_id: it.id, title: noContacts(it.title), description: noContacts(it.description ?? ""), cost: Number(it.supplier_price),
          price, department, images, version: Date.now(), by, byName,
        });
        // Precio fijado a mano: el bot (catalog.js) y el robot de proveedores (supplier-feed) ya no lo cambian.
        const { error } = await admin.from("crm_market_items").update({ status: "publicado", published_url: out.url ?? it.published_url, my_price: price, price_locked: true })
          .eq("business_id", biz.id).eq("id", it.id);
        if (error) console.error("market_publish bolsa", it.id, error.message);
        return json(200, { ...out, bolsaOk: !error });
      }

      if (body.action === "market_unpublish") {
        const it = await getItem(Number(body.id));
        if (!it) return json(404, { error: "Ese artículo ya no está en la bolsa." });
        const out = await core("POST", `panel/market/${it.id}/unpublish`, { version: Date.now(), by, byName, title: noContacts(it.title) });
        const { error } = await admin.from("crm_market_items").update({ status: "agotado" }).eq("business_id", biz.id).eq("id", it.id);
        if (error) console.error("market_unpublish bolsa", it.id, error.message);
        return json(200, { ...out, bolsaOk: !error });
      }
      return json(400, { error: "Acción desconocida." });
    }

    // Venta de proveedor (Core 3.14.14, D69): reparto del margen apuntado en el pedido. Es información: no mueve dinero.
    if (body.action === "supplier_split") return json(200, await core("GET", `panel/supplier-split/${Number(body.id)}`));
    if (body.action === "supplier_split_save") {
      const pick = (k: string) => body[k] === undefined || body[k] === null ? "" : String(body[k]);
      return json(200, await core("POST", `panel/supplier-split/${Number(body.id)}`, {
        supplier: pick("supplier"), costUsd: pick("costUsd"), route: pick("route"), vehicle: pick("vehicle"),
        messengerCup: pick("messengerCup"), messengerName: pick("messengerName"), clerkCup: pick("clerkCup"), clerkName: pick("clerkName"),
        storeCup: pick("storeCup"), by,
      }));
    }
    if (body.action === "supplier_sales") {
      const month = typeof body.month === "string" && /^\d{4}-\d{2}$/.test(body.month) ? body.month : "";
      return json(200, await core("GET", `panel/supplier-sales?month=${month}`));
    }
    if (body.action === "sale_action") {
      const what = body.what === "return" ? "return" : "status";
      const params = (body.params && typeof body.params === "object") ? body.params : {};
      return json(200, await core("POST", `panel/sales/${Number(body.id)}/${what}`, { ...params, by }));
    }

    return json(400, { error: "Acción desconocida." });
  } catch (e) {
    const msg = (e as Error).message;
    console.error("nexo-panel-web", msg);
    // Los mensajes de Core ya están en español y son para la dueña; los técnicos, no.
    const technical = /^(woo|core) /.test(msg);
    return json(502, { error: technical ? "No se pudo conectar con la web ahora. Prueba en un minuto." : msg });
  }
});
