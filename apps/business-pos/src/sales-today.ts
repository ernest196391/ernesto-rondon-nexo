// «Ventas de hoy» (Lennys 21-oct 16:49): no encontraban una venta rápida (Burlete de foam, 9 USD, 14:37, gestora
// Maryta). Lista de las ventas de mostrador de HOY en este equipo: hora, productos (nombre × cantidad), total,
// cómo pagó, quién atendió y la gestora. Reglas puras (se prueban con vitest).

export type SaleRow = { id: string; total_minor: number; currency: string; occurred_at: string; operator_id: string | null; payload_json: string | null };
export type LineRow = { sale_id: string; quantity: number; name: string | null };
export type PaymentRow = { sale_id: string; method: string; currency: string; amount_minor: number; provider: string | null };

export type TodaySale = {
  id: string;
  time: string;
  products: string;
  total: string;
  paid: string;
  staff: string;
  gestora: string;
  /** Texto en minúsculas sin tildes para el buscador. */
  search: string;
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const money = (minor: number, currency: string) =>
  `${(minor / 100).toLocaleString("es", { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 })} ${currency}`;
const METHOD: Record<string, string> = { cash: "Efectivo", transfer: "Transferencia", crypto: "Cripto", card: "Tarjeta" };

/** Inicio de HOY en Cuba (UTC−4) como ISO UTC: «2026-10-21T04:00:00.000Z». */
export function cubaDayStart(now: Date = new Date()) {
  const day = new Date(now.getTime() - 4 * 3600_000).toISOString().slice(0, 10);
  return `${day}T04:00:00.000Z`;
}

export function buildTodaySales(
  sales: SaleRow[],
  lines: LineRow[],
  payments: PaymentRow[],
  nameOf: (id: string | null | undefined) => string | null,
  timeOf: (iso: string) => string = iso => new Date(iso).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", timeZone: "America/Havana" }),
): TodaySale[] {
  return sales.map(s => {
    let payload: { payload?: { gestor_id?: string | null; staff_id?: string | null } } = {};
    try {
      payload = s.payload_json ? JSON.parse(s.payload_json) : {};
    } catch {
      payload = {};
    }
    const products = lines.filter(l => l.sale_id === s.id).map(l => `${l.name ?? "Producto"}${l.quantity > 1 ? ` × ${l.quantity}` : ""}`).join(", ");
    const paid = payments
      .filter(p => p.sale_id === s.id)
      .map(p => `${METHOD[p.method] ?? p.method}${p.provider ? ` (${p.provider})` : ""} ${money(p.amount_minor, p.currency)}`)
      .join(" + ");
    const staff = nameOf(payload.payload?.staff_id ?? s.operator_id) ?? "";
    const gestora = nameOf(payload.payload?.gestor_id) ?? "";
    const time = timeOf(s.occurred_at);
    const total = money(s.total_minor, s.currency);
    return { id: s.id, time, products, total, paid, staff, gestora, search: fold([time, products, total, paid, staff, gestora].join(" ")) };
  });
}

/** Buscador: cada palabra tiene que estar (producto, gestora, quién atendió, hora o importe). */
export function filterTodaySales(rows: TodaySale[], query: string) {
  const words = fold(query).trim().split(/\s+/).filter(Boolean);
  return words.length ? rows.filter(r => words.every(w => r.search.includes(w))) : rows;
}
