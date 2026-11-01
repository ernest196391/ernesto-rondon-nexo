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
//   POST {action:"find", number, staffId} → un pedido por su #número (cualquier estado): estado, productos,
//        lo cobrado y qué se puede hacer («cancel», «return» o nada y por qué). Core 3.14.103.
//   POST {action:"cancel", orderId, actionId, reason, staffId} → cancelar con causa (reglas de la dependienta).
//   POST {action:"return", orderId, actionId, reason, lines:[{itemId, qty}], refunds:[{method, currency, amountMinor}], staffId}
//        → devolución con causa. actionId = idempotencia: un reintento sin red no hace nada dos veces.
//        409 refused = Core dijo que no para siempre (ya entregado, ya devuelto…): la caja lo enseña tal cual.
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


// Errores de Core (cancelar/devolver) en palabras de la tienda. Core ya escribe en español sencillo:
// se pasa su mensaje; solo se traducen los códigos que no traen texto claro.
const STORE_WORDS: Record<string, string> = {
  rest_forbidden: "La web no dejó hacerlo con esta cuenta. Pide a Lennys que lo haga desde el panel.",
  cvd_caja_clerk: "No encontré tu usuaria en la web. Pide a Lennys que la enlace en el panel; mientras, hazlo en Ventas.",
  cvd_return_ledger: "No se pudo anular la ganancia del mensajero. Avisa a Lennys.",
  cvd_cancel_service: "La web no pudo cancelar ahora. Prueba en un minuto.",
};
// Respuestas definitivas: no tiene sentido reintentar (la caja marca la acción como «no aceptada»).
const FINAL = new Set(["cvd_cancel_blocked", "cvd_cancel_failed", "cvd_cancel_reason", "cvd_return_done", "cvd_return_state", "cvd_return_blocked",
  "cvd_return_reason", "cvd_return_money", "cvd_return_lines", "cvd_return_paid", "cvd_return_messenger", "cvd_caja_order", "cvd_caja_clerk",
  "cvd_reserva_confirm", "cvd_reserva_blocked"]);
const storeError = (r: { status: number; data: Record<string, unknown> }, fallback: string) => {
  const code = String(r.data.code ?? "");
  const message = STORE_WORDS[code] ?? String(r.data.message ?? "") ?? "";
  if (r.status === 404 && code === "rest_no_route") return json(501, { error: "core_old", message: "La web todavía no tiene esta función (falta Core 3.14.103). Hazlo en Ventas como siempre." });
  if (FINAL.has(code) || (r.status >= 400 && r.status < 500 && r.status !== 429)) return json(409, { error: "refused", code, message: message || fallback });
  return json(502, { error: "core", code, message: message || fallback });
};
const short = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

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
    // Pedido web: cancelar o devolver (Ernesto 31-oct, caso de la olla). Lo firma siempre la dependienta de «Atiende».
    if (body.action === "find") {
      const number = short(body.number, 30);
      if (!/^\s*(#|cv-pedido-)?\s*\d{1,9}\s*$/i.test(number)) return json(400, { error: "invalid", message: "Escribe el número del pedido (el del vale, por ejemplo 5612)." });
      const person = who.person as { phone: string | null; wooUserId: number | null } | null;
      const q = new URLSearchParams({ number, clerkWooId: String(person?.wooUserId ?? 0), clerkPhone: person?.phone ?? "" });
      const r = await core("GET", `panel/caja/web-orders/find?${q}`);
      if (r.status >= 400) return storeError(r, "No se pudo leer ese pedido de la web.");
      const o = (r.data.order ?? {}) as Record<string, unknown>;
      if (Array.isArray(o.products)) {
        for (const p of o.products as Array<Record<string, unknown>>) {
          const image = String(p.image ?? "");
          p.image = /^https:\/\//.test(image) ? image.slice(0, 500) : "";
        }
      }
      return json(200, { order: o, clerkFound: r.data.clerkFound === true });
    }
    if (body.action === "cancel" || body.action === "return") {
      const orderId = Number(body.orderId);
      const actionId = short(body.actionId, 80);
      const reason = short(body.reason, 200);
      if (!Number.isInteger(orderId) || orderId <= 0 || !actionId) return json(400, { error: "invalid", message: "Faltan datos del pedido." });
      if (reason.length < 3) return json(400, { error: "invalid", message: "Escribe la causa (una frase corta)." });
      if (!who.person) return json(400, { error: "no_staff", message: "Elige quién atiende antes de cancelar o devolver." });
      const person = who.person as { name: string; phone: string | null; wooUserId: number | null };
      const clerk = { clerkName: person.name, clerkPhone: person.phone ?? "", clerkWooId: person.wooUserId ?? 0, device: who.label ?? who.deviceId };
      if (body.action === "cancel") {
        const r = await core("POST", `panel/caja/web-orders/${orderId}/cancel`, { actionId, reason, ...clerk });
        if (r.status >= 400) return storeError(r, "La web no aceptó la cancelación.");
        return json(200, r.data);
      }
      const lines = (Array.isArray(body.lines) ? body.lines : []).slice(0, 50)
        .map(l => ({ itemId: Number((l as Record<string, unknown>).itemId) || 0, qty: Number((l as Record<string, unknown>).qty) || 0 }))
        .filter(l => l.itemId > 0 && l.qty > 0);
      let usdMinor = 0, cupMinor = 0, cash = false, transfer = false;
      for (const x of (Array.isArray(body.refunds) ? body.refunds : []).slice(0, 4) as Array<Record<string, unknown>>) {
        const amount = Math.round(Number(x.amountMinor));
        if (!Number.isFinite(amount) || amount <= 0) continue;
        const currency = String(x.currency ?? "").toUpperCase();
        if (currency === "USD") usdMinor += amount; else if (currency === "CUP") cupMinor += amount; else continue;
        if (x.method === "cash") cash = true; else transfer = true;
      }
      const refundMethod = cash && transfer ? "mixed" : cash ? "cash" : transfer ? "transfer" : "none";
      const r = await core("POST", `panel/caja/web-orders/${orderId}/return`, {
        actionId, reason, lines, refundUsd: usdMinor / 100, refundCup: cupMinor / 100, refundMethod, ...clerk,
      });
      if (r.status >= 400) return storeError(r, "La web no aceptó la devolución.");
      return json(200, r.data);
    }
    return json(400, { error: "unknown_action" });
  } catch (e) {
    console.error("nexo-device-web-orders", (e as Error).message);
    return json(502, { error: "network", message: "No se pudo conectar con la web. El cobro queda guardado y se enviará solo." });
  }
});
