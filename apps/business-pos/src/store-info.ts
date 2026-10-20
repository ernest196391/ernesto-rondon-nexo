// Datos de la tienda que la caja guarda para usarlos sin internet (Lennys 20-oct 18:00):
// * las tarjetas de la tienda (las mismas de la web: nombre + últimos 4) para «¿A qué tarjeta entró?»;
// * la tasa del día de la web (FORMAS DE PAGO / panel) y los recargos de efectivo y transferencia,
//   para «¿A cómo estamos?» (Ernesto 20-oct): tasa base = elToque + 10 CUP = efectivo (+0 %), transferencia = efectivo × 1,20 (+20 %).
import { invoke } from "@tauri-apps/api/core";
import { deviceCall, deviceToken, onEverySync } from "./sync";
import { escapeHtml, openSheet } from "./ui";

export type PayAccount = { id: string; label: string; last4: string };
export type Markups = { cashPct: number; transferPct: number };
type Daily = { cup: number | null; updatedAt: string | null; stale: boolean; source: string | null };

const ACCOUNTS_KEY = "nexo.payAccounts";
const DAILY_KEY = "nexo.dailyRate";
const MARKUPS_KEY = "nexo.markups";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function keep(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sin almacenamiento: solo esta sesión
  }
}

export const payAccounts = (): PayAccount[] => load<PayAccount[]>(ACCOUNTS_KEY, []);
export const accountLabel = (a: PayAccount) => `${a.label}${a.last4 ? ` ${a.last4}` : ""}`;
export function markups(): Markups {
  const m = load<Partial<Markups>>(MARKUPS_KEY, {});
  return { cashPct: Number.isFinite(Number(m.cashPct)) ? Number(m.cashPct) : 0, transferPct: Number.isFinite(Number(m.transferPct)) ? Number(m.transferPct) : 20 };
}

/** CUP que paga el cliente por un precio en USD (al CUP entero, hacia arriba). */
export function cupPrices(usd: number, rate: number, m: Markups = markups()) {
  const up = (n: number) => Math.ceil(n - 1e-9);
  return { cash: up(usd * rate * (1 + m.cashPct / 100)), transfer: up(usd * rate * (1 + m.transferPct / 100)) };
}

export async function refreshStoreInfo() {
  if (!navigator.onLine || !deviceToken()) return;
  const info = await deviceCall<{ accounts: PayAccount[]; daily: Daily | null }>("nexo-device-web-orders", { action: "info" });
  if (Array.isArray(info.accounts)) keep(ACCOUNTS_KEY, info.accounts);
  if (info.daily) keep(DAILY_KEY, info.daily);
}
onEverySync(refreshStoreInfo);

/** Tasa base: la del día de la web; si no hay, la CUP de la caja (panel → Tasas). */
async function baseRate(): Promise<{ rate: number | null; label: string }> {
  const d = load<Daily | null>(DAILY_KEY, null);
  if (d?.cup && d.cup > 0) {
    const when = d.updatedAt ? new Date(d.updatedAt).toLocaleString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
    return { rate: Number(d.cup), label: `Tasa del día de la web${when ? ` (${when})` : ""}${d.stale ? " · ¡vieja, pide a Lennys que la ponga!" : ""}` };
  }
  try {
    const rates = await invoke<Array<{ currency: string; perUsd: string }>>("rates_current");
    const cup = Number(rates.find(r => r.currency === "CUP")?.perUsd);
    if (cup > 0) return { rate: cup, label: "Tasa CUP de la caja (no se pudo leer la de la web)" };
  } catch {
    // sin tasas
  }
  return { rate: null, label: "Sin tasa: conéctate o pide a Lennys que la ponga en el panel." };
}

const cupText = (n: number) => `${n.toLocaleString("es")} CUP`;

/** «¿A cómo estamos?»: la tasa de hoy y una calculadora USD → CUP efectivo / transferencia. */
export async function openRatesSheet() {
  const { rate, label } = await baseRate();
  const m = markups();
  const sheet = openSheet(`
    <div class="sheet-head"><h2>¿A cómo estamos?</h2><button type="button" class="btn btn-ghost" data-close>Cerrar</button></div>
    <div class="panel" style="gap: 6px">
      <div class="kv"><span class="muted">Tasa base</span><span class="t-lg num" style="font-weight: 700">${rate ? `${rate.toLocaleString("es")} CUP` : "—"}</span></div>
      <p class="t-xs muted">${escapeHtml(label)}</p>
      <div class="kv"><span>Efectivo CUP (+${m.cashPct} %)</span><span class="num">${rate ? cupText(cupPrices(1, rate, m).cash) : "—"} por USD</span></div>
      <div class="kv"><span>Transferencia CUP (+${m.transferPct} %)</span><span class="num">${rate ? cupText(cupPrices(1, rate, m).transfer) : "—"} por USD</span></div>
    </div>
    <label class="field">Precio en USD<input class="input" data-usd inputmode="decimal" placeholder="Ej.: 15" style="font-size: var(--nx-fs-xl); font-weight: 700"></label>
    <div class="panel" data-out style="gap: 6px"><p class="t-sm muted">Escribe un precio y sale lo que paga en CUP.</p></div>
    <p class="t-xs muted">Los % se cambian en el panel (Ajustes → Tasas). Se redondea al CUP entero hacia arriba.</p>`, "¿A cómo estamos?");
  sheet.el.querySelector<HTMLButtonElement>("[data-close]")!.onclick = sheet.close;
  const input = sheet.el.querySelector<HTMLInputElement>("[data-usd]")!;
  const out = sheet.el.querySelector<HTMLElement>("[data-out]")!;
  input.oninput = () => {
    const usd = Number(input.value.replace(",", "."));
    if (!rate || !Number.isFinite(usd) || usd <= 0) {
      out.innerHTML = `<p class="t-sm muted">${rate ? "Escribe un precio y sale lo que paga en CUP." : "Sin tasa no se puede calcular."}</p>`;
      return;
    }
    const p = cupPrices(usd, rate, m);
    out.innerHTML = `<div class="kv"><span>En efectivo CUP</span><span class="t-lg num" style="font-weight: 700">${cupText(p.cash)}</span></div>
      <div class="kv"><span>Por transferencia CUP</span><span class="t-lg num" style="font-weight: 700">${cupText(p.transfer)}</span></div>`;
  };
  input.focus();
}
