// «Un cajón por tienda» (20-oct): el turno es de la TIENDA, no de cada teléfono.
// La primera que abre el día cuenta el fondo y queda como «dependienta de turno»;
// los otros teléfonos se unen a ese turno sin contar. Al cerrar, la nube suma todo:
// las ventas en efectivo de todos los teléfonos, los pedidos web cobrados en la caja
// y el efectivo cobrado en Ventas (web) que no pasó por la caja.
import { invoke } from "@tauri-apps/api/core";
import { deviceCall, deviceToken, onEverySync } from "./sync";

export type StoreShiftInfo = {
  storeShiftId: string;
  status: "open" | "closed";
  openedAt: string;
  openedById: string | null;
  openedBy: string | null;
  openedDevice: string;
  closedAt: string | null;
  closedBy: string | null;
  devices: Array<{ deviceId: string; label: string; role: string; lastSeenAt: string | null }> | null;
};
export type ShiftStatus = { open: StoreShiftInfo | null; mine: StoreShiftInfo | null; known: boolean; stale?: StoreShiftInfo[] };
export type CloudCurrency = {
  currency: string;
  openingFloatMinor: number;
  salesCashMinor: number;
  webInCajaMinor: number;
  webInVentasMinor: number;
  otherInMinor: number;
  outMinor: number;
  expectedMinor: number;
};
export type CloudExpected = {
  shift: StoreShiftInfo;
  currencies: CloudCurrency[];
  webOrders: Array<{ number: string; at: string; method: string; cash: Array<{ amount: number; currency: string }> }>;
  webMissing: boolean;
};
type LocalShift = { shiftId: string; status: string; storeRole: string | null; closedRemote: boolean } | null;

const CACHE_KEY = "nexo.storeShift";

/** Calendar day in Cuba (UTC−4), to tell today's shift from a forgotten one. */
export const cubaDay = (iso: string | number | Date) => new Date(new Date(iso).getTime() - 4 * 3600_000).toISOString().slice(0, 10);
export const isToday = (iso: string) => cubaDay(iso) === cubaDay(Date.now());

function remember(open: StoreShiftInfo | null) {
  try {
    if (open) localStorage.setItem(CACHE_KEY, JSON.stringify({ ...open, fetchedAt: new Date().toISOString() }));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // sin almacenamiento: solo se pierde la ayuda sin internet
  }
}

/** Last known open store shift of TODAY (for joining without internet). */
export function cachedOpen(): (StoreShiftInfo & { fetchedAt: string }) | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
    return raw && raw.status === "open" && isToday(raw.openedAt) ? raw : null;
  } catch {
    return null;
  }
}

export const online = () => navigator.onLine && !!deviceToken();

export async function fetchStatus(shiftId?: string): Promise<ShiftStatus> {
  const status = await deviceCall<ShiftStatus>("nexo-device-shift", { action: "status", shiftId: shiftId ?? null });
  remember(status.open);
  return status;
}

/** Reserves the opening in the cloud: "join" when another phone already opened today. */
export async function claimOpen(shiftId: string, operatorId: string | null) {
  const out = await deviceCall<{ action: "open" | "join"; shift: StoreShiftInfo }>("nexo-device-shift", { action: "open", shiftId, operatorId });
  if (out.shift) remember(out.shift);
  return out;
}

export async function cloudExpected(shiftId: string) {
  return deviceCall<CloudExpected>("nexo-device-shift", { action: "expected", shiftId });
}

/**
 * On every sync: if another phone counted and closed the store shift this phone
 * belongs to, close it here too (no counts) so the next day starts clean.
 */
async function reconcile() {
  if (!online()) return;
  const local = await invoke<LocalShift>("cash_shift_current");
  const status = await fetchStatus(local?.shiftId);
  if (!local || !local.storeRole || !status.known || status.mine?.status !== "closed") return;
  await invoke("cash_shift_mark_closed_remote", {
    shiftId: local.shiftId,
    closedAt: status.mine.closedAt ?? new Date().toISOString(),
    closedBy: status.mine.closedBy,
    note: `Cerrado en ${status.mine.devices?.find(d => d.role === "opener")?.label ?? "otro teléfono"}${status.mine.closedBy ? ` por ${status.mine.closedBy}` : ""}`,
  });
  window.dispatchEvent(new CustomEvent("nexo:say", { detail: { message: "El turno de la tienda se cerró en otro teléfono. Para vender, abre o únete al turno nuevo.", tone: "ok" } }));
  window.dispatchEvent(new Event("nexo:shift-changed"));
}
onEverySync(reconcile);
