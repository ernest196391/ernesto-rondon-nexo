// «Pedidos web» en la caja (20-oct): las dependientas cobran en el mostrador los pedidos de
// las gestoras (recogida «Listo para recoger» y a domicilio con el efectivo del mensajero).
// Solo lectura y cobro. La caja se identifica con su clave (x-nexo-device-token).
//   POST {action:"list"}  → pedidos que se pueden cobrar (Core /panel/caja/web-orders)
//   POST {action:"info"}  → tarjetas de la tienda (pay-accounts) y tasa del día de la web (daily-rates)
//   POST {action:"charge", orderId, chargeId, staffId, collectionMethod, collectedUsd, collectedCup,
//         collectionReference?, collectionNote?}
//        → Core cierra el pedido con las reglas de Ventas, firmado por la dependienta de «Atiende».
//          409 already_charged = ya se cobró en Ventas (la caja lo devuelve del cajón).
//   POST {action:"change", orderId, changeRequired:[{amount, currency}], staffId} → vuelto que lleva el mensajero.
// Los productos de proveedor (SKU MK-) salen aquí como pedidos web: no se importan al catálogo.
// Caja 1.1.1 (Lennys 21-oct): cada pedido trae su tasa CUP del día del pedido (cupRate, cupTransferRate, cupRateDay;
// la caja cobra en CUP con ella, nunca con la de hoy) y la miniatura de cada producto (products[].image, solo https).
// Core: 3.14.46 (CVD_Caja_Bridge). Deploy:
// npx.cmd supabase functions deploy nexo-device-web-orders --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt --use-api
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-nexo-device-token",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

const METHODS = new Set(["cash_usd", "cash_cup", "transfer", "mixed", "other"]);

async function core(method: "GET" | "POST", path: string, body?: unknown) {
  const base = (Deno.env.get("WOO_URL") ?? "").replace(/\/$/, "");
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${base}/wp-json/casa-viva/v1/${path}${sep}_=${Date.now()}`, {
    method,
    headers: { "x-nexo-panel-key": Deno.env.get("CASAVIVA_PANEL_KEY") ?? "", "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data: data as Record<string, unknown> };
}

const money = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
};

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "method" });
  const token = req.headers.get("x-nexo-device-token") ?? "";
  if (token.length < 32) return json(401, { error: "unauthorized" });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const { data: who, error } = await admin.rpc("nexo_business_device_person", { p_token: token, p_person: String(body.staffId ?? "") });
  if (error) { console.error("device_person", error.message); return json(500, { error: "server_error" }); }
  if (!who || who.error) return json(401, { error: "unauthorized" });

  try {
    // Tarjetas de la tienda (las de la web, «¿A qué tarjeta entró?») y la tasa del día de la web (Lennys 20-oct).
    if (body.action === "info") {
      const [acc, rates] = await Promise.all([core("GET", "panel/pay-accounts"), core("GET", "panel/daily-rates")]);
      const accounts = ((acc.data.accounts ?? []) as Array<{ id: string; label?: string; last4?: string; active?: boolean }>)
        .filter(a => a.active !== false).map(a => ({ id: String(a.id), label: String(a.label ?? ""), last4: String(a.last4 ?? "") }));
      const daily = (rates.data.rates ?? null) as { cup?: number; updatedAt?: string; stale?: boolean; source?: string } | null;
      return json(200, { accounts, daily: daily ? { cup: daily.cup ?? null, updatedAt: daily.updatedAt ?? null, stale: !!daily.stale, source: daily.source ?? null } : null });
    }

    if (body.action === "list") {
      const r = await core("GET", "panel/caja/web-orders");
      if (r.status === 404) return json(501, { error: "core_old", message: "La web todavía no tiene esta función (falta Core 3.14.42). Cobra en Ventas como siempre." });
      if (r.status >= 400) return json(502, { error: "core", message: "No se pudo leer los pedidos de la web. Prueba en un minuto." });
      const rate = (v: unknown) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 50 && n <= 5000 ? Math.round(n * 100) / 100 : null;
      };
      const orders = (Array.isArray(r.data.orders) ? r.data.orders : []) as Array<Record<string, unknown>>;
      for (const o of orders) {
        o.cupRate = rate(o.cupRate);
        o.cupTransferRate = rate(o.cupTransferRate);
        o.cupRateDay = String(o.cupRateDay ?? "").slice(0, 12);
        // Pilar 3 (Core 3.14.72): reserva de la recogida («Kay pidió guardarlo hasta mañana»), solo textos cortos.
        const rv = o.reserva as Record<string, unknown> | null | undefined;
        o.reserva = rv && typeof rv === "object"
          ? { until: String(rv.until ?? "").slice(0, 10), untilLabel: String(rv.untilLabel ?? "").slice(0, 40), by: String(rv.by ?? "").slice(0, 60), note: String(rv.note ?? "").slice(0, 160), text: String(rv.text ?? "").slice(0, 200), active: rv.active === true, expired: rv.expired === true }
          : null;
        if (Array.isArray(o.products)) {
          for (const p of o.products as Array<Record<string, unknown>>) {
            const image = String(p.image ?? "");
            p.image = /^https:\/\//.test(image) ? image.slice(0, 500) : "";
          }
        }
      }
      return json(200, { ...r.data, orders });
    }

    if (body.action === "charge") {
      const orderId = Number(body.orderId);
      const chargeId = String(body.chargeId ?? "").slice(0, 80);
      const method = String(body.collectionMethod ?? "");
      if (!Number.isInteger(orderId) || orderId <= 0 || !chargeId || !METHODS.has(method)) return json(400, { error: "invalid", message: "Faltan datos del cobro." });
      if (!who.person) return json(400, { error: "no_staff", message: "Elige quién atiende antes de cobrar." });
      const person = who.person as { name: string; phone: string | null; wooUserId: number | null };
      const r = await core("POST", `panel/caja/web-orders/${orderId}/charge`, {
        chargeId, collectionMethod: method,
        collectedUsd: money(body.collectedUsd), collectedCup: money(body.collectedCup),
        collectionReference: String(body.collectionReference ?? "").slice(0, 60),
        collectionAccount: String(body.collectionAccount ?? "").slice(0, 40),
        collectionNote: String(body.collectionNote ?? "").slice(0, 280),
        clerkName: person.name, clerkPhone: person.phone ?? "", clerkWooId: person.wooUserId ?? 0, device: who.label ?? who.deviceId,
      });
      const code = String(r.data.code ?? "");
      const message = String(r.data.message ?? "");
      if (r.status === 404 && code === "rest_no_route") return json(501, { error: "core_old", message: "La web todavía no tiene esta función (falta Core 3.14.42)." });
      if (code === "cvd_already_charged") return json(409, { error: "already_charged", message });
      if (code === "cvd_not_chargeable" || code === "cvd_caja_order") return json(409, { error: "not_chargeable", message });
      if (r.status >= 400) return json(r.status >= 500 ? 502 : 422, { error: "core", message: message || "La web no aceptó el cobro." });
      return json(200, r.data);
    }
    // Vuelto que lleva el mensajero (Lennys 20-oct): {action:"change", orderId, changeRequired:[{amount, currency}], staffId}.
    if (body.action === "change") {
      const orderId = Number(body.orderId);
      if (!Number.isInteger(orderId) || orderId <= 0 || !Array.isArray(body.changeRequired)) return json(400, { error: "invalid", message: "Faltan datos del vuelto." });
      const person = who.person as { name: string } | null;
      const r = await core("POST", `panel/caja/web-orders/${orderId}/change`, {
        changeRequired: (body.changeRequired as Array<{ amount?: unknown; currency?: unknown }>).slice(0, 3).map(c => ({ amount: money(c.amount), currency: String(c.currency ?? "").toUpperCase() })),
        clerkName: person?.name ?? "", device: who.label ?? who.deviceId,
      });
      if (r.status === 404 && String(r.data.code ?? "") === "rest_no_route") return json(501, { error: "core_old", message: "La web todavía no tiene esta función (falta Core 3.14.42)." });
      if (r.status >= 400) return json(r.status >= 500 ? 502 : 422, { error: "core", message: String(r.data.message ?? "La web no aceptó el vuelto.") });
      return json(200, r.data);
    }
    return json(400, { error: "unknown_action" });
  } catch (e) {
    console.error("nexo-device-web-orders", (e as Error).message);
    return json(502, { error: "network", message: "No se pudo conectar con la web. El cobro queda guardado y se enviará solo." });
  }
});
