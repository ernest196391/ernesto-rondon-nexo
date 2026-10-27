// Saldo 360 — reglas del mercado compartidas por servidor y navegador.
// Precio = CUP que paga el comprador por cada 100 CUP de saldo (misma unidad que la base y VivaBot).

export const PAYMENT_METHODS = { transfermovil: "Transfermóvil", enzona: "EnZona", efectivo: "Efectivo" } as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export type MarketOffer = {
  id: string;
  shopSlug: string;
  shopName: string;
  locality: string;
  photoUrl: string | null;
  whatsapp: string;
  minCup: number;
  maxCup: number;
  pricePer100Cup: number;
  paymentMethods: PaymentMethod[];
  confirmedAt: string;
  expiresAt: string;
  confirmedOps: number;
  reviewsCount: number;
  ratingAvg: number | null;
};

const MAX_VALIDITY_MS = 72 * 3600_000;

/** Una oferta solo se muestra si todo es coherente y sigue vigente. Ante la duda, no se publica. */
export function offerIsLive(o: MarketOffer, now = new Date()): boolean {
  if (!/^53[0-9]{8}$/.test(o.whatsapp)) return false;
  if (!Number.isFinite(o.pricePer100Cup) || o.pricePer100Cup <= 0) return false;
  if (!Number.isInteger(o.minCup) || !Number.isInteger(o.maxCup) || o.minCup < 1 || o.maxCup < o.minCup) return false;
  if (!o.paymentMethods.length || o.paymentMethods.some((m) => !(m in PAYMENT_METHODS))) return false;
  const confirmed = Date.parse(o.confirmedAt), expires = Date.parse(o.expiresAt), t = now.getTime();
  if (!Number.isFinite(confirmed) || !Number.isFinite(expires)) return false;
  return confirmed <= t && expires > t && expires - confirmed <= MAX_VALIDITY_MS;
}

/** Total en CUP, redondeado a céntimos (igual que la base: round(monto * precio / 100, 2)). */
export function totalCup(amountCup: number, pricePer100Cup: number): number {
  return Math.round(amountCup * pricePer100Cup) / 100;
}

export function formatCup(n: number): string {
  return new Intl.NumberFormat("es-CU", { maximumFractionDigits: 2 }).format(n) + " CUP";
}

export function filterOffers(offers: MarketOffer[], amountCup: number, method: PaymentMethod | "any", now = new Date()): MarketOffer[] {
  return offers
    .filter((o) => offerIsLive(o, now) && amountCup >= o.minCup && amountCup <= o.maxCup && (method === "any" || o.paymentMethods.includes(method)))
    .sort((a, b) => a.pricePer100Cup - b.pricePer100Cup || Date.parse(b.confirmedAt) - Date.parse(a.confirmedAt));
}

/** «hace 3 h», «hace 20 min»: la frescura se ve sin hacer cuentas. */
export function ago(iso: string, now = new Date()): string {
  const min = Math.max(0, Math.round((now.getTime() - Date.parse(iso)) / 60_000));
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}

export function reputationLabel(o: Pick<MarketOffer, "confirmedOps" | "reviewsCount" | "ratingAvg">): string {
  if (o.confirmedOps <= 0) return "Sin operaciones verificadas";
  const ops = `${o.confirmedOps} ${o.confirmedOps === 1 ? "operación verificada" : "operaciones verificadas"}`;
  return o.ratingAvg != null && o.reviewsCount > 0 ? `${ops} · ★ ${o.ratingAvg.toFixed(1)}` : ops;
}

export function whatsAppLink(o: Pick<MarketOffer, "whatsapp">, amountCup: number): string {
  const text = `Hola, vi tu oferta en Saldo 360. ¿Tienes ${amountCup} CUP de saldo? ¿Me confirmas el precio final y cómo pagar?`;
  return `https://wa.me/${o.whatsapp}?text=${encodeURIComponent(text)}`;
}
