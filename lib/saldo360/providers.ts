export type SaldoProvider = {
  id: string;
  name: string;
  phone: string;
  locality: string;
  paymentMethods: string[];
  rateCupPerCup: number;
  minAmountCup: number;
  maxAmountCup: number;
  confirmedAt: string;
  validUntil: string;
  optedIn: boolean;
  active: boolean;
};
export function providerIsCurrent(p: SaldoProvider, now = new Date()): boolean {
  if (!p.optedIn || !p.active || !/^53[0-9]{8}$/.test(p.phone)) return false;
  if (!Number.isFinite(p.rateCupPerCup) || p.rateCupPerCup <= 0) return false;
  if (!Number.isInteger(p.minAmountCup) || !Number.isInteger(p.maxAmountCup) || p.minAmountCup < 1 || p.maxAmountCup < p.minAmountCup) return false;
  if (!p.confirmedAt || !p.validUntil || Number.isNaN(Date.parse(p.confirmedAt)) || Number.isNaN(Date.parse(p.validUntil))) return false;
  return Date.parse(p.validUntil) >= now.getTime() && Date.parse(p.confirmedAt) <= now.getTime();
}
export function whatsAppOffer(p: SaldoProvider, amount: number): string {
  const message = `Hola, vi tu oferta en Saldo 360. ¿Tienes disponibles ${amount} CUP de saldo Cubacel? ¿Me confirmas el precio final y cómo pagar?`;
  return `https://wa.me/${p.phone}?text=${encodeURIComponent(message)}`;
}
