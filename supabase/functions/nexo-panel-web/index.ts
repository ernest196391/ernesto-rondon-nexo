// Panel único de Casa Viva: lee los pedidos de la web (WooCommerce + Casa Viva Core)
// para el panel NEXO. Solo lectura. Solo dueñas del negocio (nexo_panel_is_owner).
// La clave de WooCommerce (WOO_URL, WOO_CK, WOO_CS) nunca sale del servidor.
//   POST { action: "summary", from?, to? }          → resumen del periodo (por defecto, este mes)
//   POST { action: "orders", status?, search?, page? } → lista de pedidos (20 por página)
//   POST { action: "staff_pay", months? }            → ventas del mes por dependienta («A pagar este mes»)
//   Productos (Core 3.13.52): product_variations, variation_add, product_variable_create, products_visibility
//   Venta de proveedor (Core 3.14.14, D69): supplier_split, supplier_split_save, supplier_sales
// Deploy: npx.cmd supabase functions deploy nexo-panel-web --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

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
  id: number; number: string; status: string; date_created: string; total: string; currency: string;
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

async function core(method: "GET" | "POST", path: string, body?: unknown) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${base()}/wp-json/casa-viva/v1/${path}${sep}_=${Date.now()}`, {
    method,
    headers: { "x-nexo-panel-key": Deno.env.get("CASAVIVA_PANEL_KEY") ?? "", "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? `core ${path} ${res.status}`);
  return data;
}

const meta = (o: WooOrder, key: string) => o.meta_data.find(m => m.key === key)?.value ?? null;
const money = (v: string) => Math.round(Number(v || 0) * 100) / 100;

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
      const byGestora: Record<number, { orders: number; total: number }> = {};
      for (const o of orders) {
        const g = GROUP[o.status] ?? "pending";
        sum[g] += money(o.total); count[g]++;
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
        done: { orders: count.done, total: Math.round(sum.done * 100) / 100 },
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
        const by: Record<string, { name: string; orders: number; sales: number }> = {};
        let total = 0, orders = 0;
        for (let page = 1; page <= 30; page++) {
          const { data, pages } = await woo("orders", { after, before, status: "completed", per_page: "100", page: String(page) });
          for (const o of data as WooOrder[]) {
            const sales = Math.round(o.line_items.reduce((t, l) => t + Number(l.total || 0), 0) * 100) / 100;
            const hist = meta(o, "_cvd_operation_history");
            const firstOp = Array.isArray(hist) && hist.length ? Number((hist[0] as { user_id?: number }).user_id ?? 0) : 0;
            const who = [meta(o, "_cvd_collection_received_by"), meta(o, "_cvd_handed_over_by"), firstOp].map(Number).find(id => id && clerks[id]) ?? 0;
            const key = who ? String(who) : "unknown";
            by[key] ??= { name: who ? clerks[who] : "", orders: 0, sales: 0 };
            by[key].orders++; by[key].sales = Math.round((by[key].sales + sales) * 100) / 100;
            total += sales; orders++;
          }
          if (page >= pages) break;
        }
        out.push({ month, orders, sales: Math.round(total * 100) / 100,
          clerks: Object.entries(by).filter(([k]) => k !== "unknown").map(([id, v]) => ({ id: Number(id), ...v })).sort((a, b) => b.sales - a.sales),
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

    // Programa de gestoras (Core 3.14.1, D53–D58): último cálculo del libro y «Recalcular ahora». Solo lectura de dinero: no paga nada.
    if (body.action === "programa") return json(200, await core("GET", "panel/programa"));
    if (body.action === "programa_calcular") return json(200, await core("POST", "panel/programa/calcular", {}));

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
      }));
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
