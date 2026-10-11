// Panel único de Casa Viva: lee los pedidos de la web (WooCommerce + Casa Viva Core)
// para el panel NEXO. Solo lectura. Solo dueñas del negocio (nexo_panel_is_owner).
// La clave de WooCommerce (WOO_URL, WOO_CK, WOO_CS) nunca sale del servidor.
//   POST { action: "summary", from?, to? }          → resumen del periodo (por defecto, este mes)
//   POST { action: "orders", status?, search?, page? } → lista de pedidos (20 por página)
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
  line_items: { name: string; quantity: number; total: string; meta_data: { display_key?: string; display_value?: unknown }[] }[];
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
    customer: `${o.billing.first_name} ${o.billing.last_name}`.trim(), phone: o.billing.phone,
    address: [o.shipping.address_1, o.shipping.city].filter(Boolean).join(", "),
    gestora: ownerType === "gestora" && ownerId ? (people[ownerId] ?? `#${ownerId}`) : null,
    commission: Number(meta(o, "_cvd_commission_amount") ?? 0) || null,
    note: o.customer_note || null,
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

    // Inventario: existencias de la web para comparar, y copiar a la web un precio cambiado en el panel.
    if (body.action === "web_levels") return json(200, await core("GET", "panel/stock/levels"));
    if (body.action === "push_price") {
      const price = Number(body.price);
      if (!(Number(body.wooId) > 0) || !(price > 0)) return json(400, { error: "Producto o precio no válido." });
      return json(200, await core("POST", "panel/products/price", { wooId: Number(body.wooId), price }));
    }

    // Mensajería: tarifas por zona en CUP (las que usa el checkout de la web).
    if (body.action === "shipping_rates") return json(200, await core("GET", "panel/shipping-rates"));
    if (body.action === "shipping_rate_save") {
      const fee = Number(body.fee);
      const municipality = String(body.municipality ?? "").trim();
      if (!municipality || !Number.isInteger(fee) || fee < 0 || fee > 100000) return json(400, { error: "Municipio o tarifa no válidos." });
      return json(200, await core("POST", "panel/shipping-rates", { municipality, zone: String(body.zone ?? "").trim(), fee, active: body.active !== false }));
    }

    // Pedidos: las mismas acciones que /ventas/ (Core aplica sus reglas y firma como la dueña).
    if (body.action === "sale") {
      const q = new URLSearchParams({ search: String(body.number ?? "") });
      const data = await core("GET", `panel/sales?${q}`);
      const one = (data.orders ?? []).find((o: { number: string }) => String(o.number) === String(body.number));
      return one ? json(200, one) : json(404, { error: "No encontré ese pedido entre los 50 más recientes." });
    }
    if (body.action === "sale_action") {
      const what = body.what === "return" ? "return" : "status";
      const params = (body.params && typeof body.params === "object") ? body.params : {};
      return json(200, await core("POST", `panel/sales/${Number(body.id)}/${what}`, params));
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
