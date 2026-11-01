// «Pedido web: cancelar o devolver» (Ernesto 31-oct, caso de la olla Ariete): cuentas y textos sin pantalla,
// para poder probarlos (weborder-actions.test.ts).

export type ActionOrder = {
  id: number;
  number: string;
  date: string;
  status: string;
  statusLabel: string;
  customer: string;
  gestora: string;
  totalUsd: number;
  charged: { method: string; usd: number; cup: number; at: string } | null;
  products: Array<{ itemId: number; name: string; qty: number; totalUsd: number; sku: string; image?: string }>;
  /** Lo que se puede hacer desde la caja: «cancel», «return» o '' (y por qué en `why`). */
  can: "cancel" | "return" | "";
  why: string;
  cancelReason: string;
  returnInfo: { by: string; reason: string; refundUsd: number; refundCup: number; refundMethod: string; full: boolean; products: string; review: string } | null;
  test: boolean;
};
export type Refund = { method: "cash" | "transfer"; currency: "USD" | "CUP"; amountMinor: number };
export type Line = { itemId: number; name: string; qty: number };

/** «5612», «#5612» o «CV-PEDIDO-5612» → "5612"; '' si no es un número de pedido. */
export function parseOrderNumber(raw: string): string {
  const m = /^\s*(?:#|cv-pedido-)?\s*(\d{1,9})\s*$/i.exec(raw ?? "");
  return m ? String(Number(m[1])) : "";
}

/** «62», «62,50» → minor units; NaN si está mal escrito o es negativo. Vacío = 0. */
export function amountMinor(raw: string): number {
  const text = String(raw ?? "").trim().replace(",", ".");
  if (!text) return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return NaN;
  return Math.round(Number(text) * 100);
}

/** El dinero devuelto, una fila por moneda con su forma. */
export function buildRefunds(usd: string, usdMethod: string, cup: string, cupMethod: string): Refund[] | string {
  const out: Refund[] = [];
  for (const [currency, raw, method] of [["USD", usd, usdMethod], ["CUP", cup, cupMethod]] as const) {
    const m = amountMinor(raw);
    if (Number.isNaN(m)) return `El dinero en ${currency} está mal escrito (usa números, por ejemplo 62 o 62,50).`;
    if (m <= 0) continue;
    if (method !== "cash" && method !== "transfer") return `Di si los ${currency} se devolvieron en efectivo o por transferencia.`;
    out.push({ method, currency, amountMinor: m });
  }
  return out;
}

/** '' = se puede registrar; si no, qué falta. */
export function validateAction(kind: "cancel" | "return", reason: string, lines: Line[], order: ActionOrder): string {
  if (reason.replace(/\s+/g, " ").trim().length < 3) return kind === "cancel" ? "Escribe por qué se cancela (una frase corta)." : "Escribe la causa de la devolución (una frase corta).";
  if (kind === "cancel") return "";
  const chosen = lines.filter(l => l.qty > 0);
  if (!chosen.length) return "Elige qué producto vuelve y cuántos.";
  for (const l of chosen) {
    const p = order.products.find(x => x.itemId === l.itemId);
    if (!p) return "Ese producto no está en este pedido.";
    if (!Number.isInteger(l.qty) || l.qty > p.qty) return `Del producto «${p.name}» el pedido tiene ${p.qty}: no se pueden devolver más.`;
  }
  return "";
}

/** «1× Olla de presión eléctrica Ariete digital». */
export const productsText = (lines: Line[]) => lines.filter(l => l.qty > 0).map(l => `${l.qty}× ${l.name}`).join(", ");

const money = (minor: number, currency: string) =>
  `${(minor / 100).toLocaleString("es", { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 })} ${currency}`;

/** Lo que se le pregunta antes de registrar (lo mismo que leerá Lennys). */
export function confirmText(kind: "cancel" | "return", order: ActionOrder, reason: string, lines: Line[], refunds: Refund[]): string {
  if (kind === "cancel") {
    return `¿Cancelar el pedido #${order.number}?\n\n• Las existencias vuelven a la tienda\n• La comisión de quien vendió queda anulada\n• No se puede deshacer\n\nCausa: ${reason.trim()}`;
  }
  const back = refunds.length
    ? refunds.map(r => `${money(r.amountMinor, r.currency)} ${r.method === "cash" ? "en efectivo (sale del cajón)" : "por transferencia"}`).join(" + ")
    : "nada (no se devuelve dinero)";
  return `Devolución del pedido #${order.number}\n\n• Vuelve: ${productsText(lines)}\n• Se le devuelve: ${back}\n• Lo aprueba Lennys\n\nCausa: ${reason.trim()}`;
}

/** Errores en palabras de la tienda; `queued` = quedó en la cola (sin red o la web no contestó). */
export function friendly(err: { status?: number; code?: string; message?: string } | null | undefined): { text: string; final: boolean } {
  const status = err?.status ?? 0;
  const message = String(err?.message ?? "").trim();
  if (status === 409 && err?.code === "refused") return { text: message || "La web no lo aceptó.", final: true };
  if (status === 400 && (err?.code === "invalid" || err?.code === "no_staff")) return { text: message || "Faltan datos.", final: true };
  if (status === 501) return { text: message || "La web todavía no tiene esta función. Hazlo en Ventas.", final: false };
  if (status === 401) return { text: "Este teléfono no está conectado (Más → Sincronización).", final: false };
  if (!status || /fetch|network|load failed|conex/i.test(message)) return { text: "Sin conexión: quedó guardado y se envía solo al volver la red.", final: false };
  return { text: message || "La web no contestó: se vuelve a probar sola.", final: false };
}
