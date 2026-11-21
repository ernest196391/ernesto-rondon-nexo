// Disabled by default. Only the approved NEXO origin may receive this device credential.
export const CAJA_RECOVERY_URL = "https://ernesto-rondon-nexo.onrender.com/api/business/caja-recovery";
type Orders<T> = { orders: T[]; generatedAt: string; recoveryReadOnly?: boolean };

export async function listCajaOrders<T>(primary: () => Promise<Orders<T>>, token: string, enabled: boolean, lock: () => void, request: typeof fetch = fetch): Promise<Orders<T>> {
  try { return await primary(); }
  catch (error) {
    const status = (error as { status?: number } | null)?.status;
    // Browsers can mask a failed 402 preflight as TypeError. Never bypass explicit auth denial.
    if (status !== 402 && !(status === undefined && error instanceof TypeError)) throw error;
    lock();
    if (!enabled || token.length < 32 || token.length > 512) throw error;
    const res = await request(CAJA_RECOVERY_URL, {
      method: "POST", redirect: "error", credentials: "omit", cache: "no-store",
      headers: {"content-type": "application/json", "x-nexo-device-token": token},
      body: JSON.stringify({action: "list"}), signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error("Consulta alternativa no disponible (HTTP " + res.status + "). Usa Ventas.");
    const data = await res.json() as Orders<T>;
    if (data.recoveryReadOnly !== true || !Array.isArray(data.orders) ||
        typeof data.generatedAt !== "string" || !Number.isFinite(Date.parse(data.generatedAt)))
      throw new Error("Respuesta de recuperación inválida.");
    return {...data, orders: data.orders.map(o => ({...o, chargeable: false}))};
  }
}
