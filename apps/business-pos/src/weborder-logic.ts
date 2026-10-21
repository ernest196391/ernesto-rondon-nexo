// Reglas puras de «Cobrar pedido web» (caja 1.1.1, Lennys 21-oct). Sin Tauri: se prueban con vitest.
//
// Tasa del pedido: «se cobra como estaba el día del vale; no podemos variarlo para atrás» (Lennys).
// Cada pedido de la web guarda la tasa CUP de su día (_cvd_cup_rate); la web la manda como cupRate
// (efectivo CUP por 1 USD) y cupTransferRate (transferencia CUP por 1 USD). Todo pago en CUP de ese
// pedido se calcula con ELLA, nunca con la de hoy. La dependienta puede cambiarla solo con un motivo.

export type OrderPayment = { kind: string; currency: string; factor: number | null } | null;

export type OrderRateSource = {
  cupRate?: number | null;
  cupTransferRate?: number | null;
  cupRateDay?: string;
  payment?: OrderPayment;
};

export type OrderRates = {
  /** Efectivo CUP por 1 USD. */
  cash: number;
  /** Transferencia CUP por 1 USD. */
  transfer: number;
  /** «18-oct», o "" si no se sabe. */
  day: string;
};

const positive = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Transferencia = efectivo × (1 + %), al CUP entero (la misma regla de la web: 815 → 978). */
export const transferFrom = (cash: number, transferPct: number) => Math.round(cash * (1 + transferPct / 100));

/**
 * Tasas CUP con las que se cobra el pedido, o null si el pedido no trae ninguna (pedidos viejos:
 * entonces la caja usa la de hoy, como antes).
 */
export function orderRates(order: OrderRateSource, transferPct = 20): OrderRates | null {
  let cash = positive(order.cupRate);
  let transfer = positive(order.cupTransferRate);
  // Web vieja (sin cupRate): el factor del vale cuando pagaba en CUP.
  const factor = positive(order.payment?.factor);
  if (!cash && !transfer && factor && order.payment?.currency === "CUP") {
    if (order.payment.kind === "transfer_cup") transfer = factor;
    else cash = factor;
  }
  if (!cash && !transfer) return null;
  if (!cash) cash = Math.round(transfer! / (1 + transferPct / 100));
  if (!transfer) transfer = transferFrom(cash, transferPct);
  return { cash, transfer, day: String(order.cupRateDay ?? "").trim() };
}

/** Lo que el checkout usa en lugar de las tasas de hoy: CUP = efectivo, CUP_TRANSFER = transferencia. */
export function rateOverrides(rates: OrderRates | null): Record<string, string> {
  return rates ? { CUP: String(rates.cash), CUP_TRANSFER: String(rates.transfer) } : {};
}

/** «Tasa del pedido: 810 (18-oct) · transferencia 972». */
export function rateLine(rates: OrderRates, changed = false) {
  const n = (v: number) => v.toLocaleString("es");
  return `${changed ? "Tasa cambiada" : "Tasa del pedido"}: ${n(rates.cash)}${rates.day && !changed ? ` (${rates.day})` : ""} · transferencia ${n(rates.transfer)}`;
}

/** «850» o «850,5» → 850.5; null si no es una tasa creíble (50–5000, como la web). */
export function parseRate(raw: string): number | null {
  const n = Number(String(raw).trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 50 && n <= 5000 ? Math.round(n * 100) / 100 : null;
}

/** Nota del cobro (va a la web y queda en el cajón). */
export function chargeNote(order: OrderRates | null, used: OrderRates | null, reason = "") {
  if (!used) return "";
  const n = (v: number) => v.toLocaleString("es");
  if (order && (order.cash !== used.cash || order.transfer !== used.transfer)) {
    return `Tasa cambiada en la caja: ${n(used.cash)} (transferencia ${n(used.transfer)}) en vez de ${n(order.cash)}${order.day ? ` del ${order.day}` : ""}. Motivo: ${reason.trim()}`.slice(0, 280);
  }
  if (!order) return `Tasa puesta en la caja: ${n(used.cash)} (transferencia ${n(used.transfer)}). Motivo: ${reason.trim()}`.slice(0, 280);
  return `Tasa del pedido: ${n(used.cash)}${used.day ? ` (${used.day})` : ""}, transferencia ${n(used.transfer)}.`;
}

// ---------- Buscador (Lennys 20-oct, nota 1) ----------

export type Searchable = { number: string; customer: string; phone: string };

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const digits = (s: string) => s.replace(/\D+/g, "");

/** Por #número, nombre del cliente (sin tildes, cualquier palabra) o teléfono (al menos 3 cifras). */
export function matchesOrder(order: Searchable, query: string): boolean {
  const q = fold(query);
  if (!q) return true;
  const num = q.replace(/^#/, "");
  if (/^\d+$/.test(num)) {
    if (String(order.number).includes(num)) return true;
    return num.length >= 3 && digits(order.phone).includes(num);
  }
  const name = fold(order.customer);
  return q.split(/\s+/).every(word => name.includes(word));
}

export function searchOrders<T extends Searchable>(orders: T[], query: string): T[] {
  return orders.filter(o => matchesOrder(o, query));
}

/** Código de alta (6–7 letras/cifras) escrito donde va la clave larga del equipo (Lennys 21-oct, nota 4). */
export function looksLikeEnrollCode(raw: string): string | null {
  const code = String(raw).replace(/[\s-]+/g, "").toUpperCase();
  return /^[A-Z0-9]{6,7}$/.test(code) ? code : null;
}
