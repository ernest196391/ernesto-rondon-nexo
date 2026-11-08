/** UTC timestamp persisted by the authenticated POS; never replace it with retry time. */
export function receiptTimestamp(value: unknown, now = Date.now()): string | undefined {
  if (value === undefined || value === null || value === "") return undefined; // legacy client
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) {
    throw new Error("Fecha del ingreso no válida; revisa el reloj de la caja.");
  }
  const ms = Date.parse(value);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 19) !== value.slice(0, 19)
      || ms < Date.UTC(2020, 0, 1) || ms > now) {
    throw new Error("Fecha del ingreso no válida; revisa el reloj de la caja.");
  }
  return new Date(ms).toISOString();
}
