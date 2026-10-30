// Caja 1.1.3 (Lennys 30-oct): todas las opciones muestran «Quedan N», «Agotado» o «Sin dato», con el mismo formato.
export type StockLike = { quantity: number; lowAt: number };

export type StockInfo = { text: string; tone: "ok" | "low" | "out" | "none"; rank: 0 | 1 | 2 };

/** Texto y tono de la cantidad; nunca devuelve vacío (sin conteo = «Sin dato»). */
export function stockInfo(stock: StockLike | undefined): StockInfo {
  if (!stock) return { text: "Sin dato", tone: "none", rank: 2 };
  if (stock.quantity <= 0) return { text: "Agotado", tone: "out", rank: 1 };
  return { text: `Quedan ${stock.quantity}`, tone: stock.quantity <= stock.lowAt ? "low" : "ok", rank: 0 };
}

/** Con existencias primero; agotadas y sin dato al final; cada bloque por nombre (es). */
export function sortOptions<T>(items: T[], label: (item: T) => string, stockOf: (item: T) => StockLike | undefined): T[] {
  return [...items].sort((a, b) => stockInfo(stockOf(a)).rank - stockInfo(stockOf(b)).rank || label(a).localeCompare(label(b), "es"));
}
