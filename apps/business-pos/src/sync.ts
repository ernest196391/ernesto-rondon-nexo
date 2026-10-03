// Outbox push (ADR-001): sends pending events in batches to the configured
// endpoint and records each answer through the Rust sync commands. The
// endpoint is a per-device setting until device provisioning exists; with no
// endpoint the queue simply stays local (sales keep working offline).
import { invoke } from "@tauri-apps/api/core";
import {
  validatePushResponse,
  type PushEvent,
  type PushRequest,
} from "../../../packages/business-domain/src/sync-contract";

type SyncState = { pending: number; failing: number; synced: number; oldestPendingAt: string | null; lastError: string | null };
type OutboxEvent = PushEvent & { attempts: number };

const ENDPOINT_KEY = "nexo.sync.endpoint";
const TOKEN_KEY = "nexo.sync.deviceToken";
/** NEXO production ingestion (Supabase Edge Function nexo-sync-push). */
export const DEFAULT_ENDPOINT = "https://viwwlriwlwodrfukbgbj.supabase.co/functions/v1/nexo-sync-push";
const BATCH = 100;

function read(key: string, fallback = ""): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value.trim());
  } catch {
    // Storage unavailable: the value is used for this session only.
  }
}

function describe(state: SyncState) {
  const parts = [`Pendientes ${state.pending}`, `sincronizados ${state.synced}`];
  if (state.failing) parts.push(`con error ${state.failing}`);
  if (state.lastError) parts.push(`último error: ${state.lastError}`);
  return parts.join(" · ");
}

/** Pushes every due event. Returns the final queue state. */
export async function pushOutbox(endpoint: string, deviceToken: string): Promise<SyncState> {
  let state = await invoke<SyncState>("sync_state");
  if (!endpoint || !deviceToken) return state;
  for (let round = 0; round < 50; round++) {
    const now = new Date().toISOString();
    const events = await invoke<OutboxEvent[]>("sync_pending_batch", { now, limit: BATCH });
    if (!events.length) break;
    const first = events[0];
    const request: PushRequest = {
      contractVersion: 1,
      businessId: first.businessId,
      deviceId: first.deviceId,
      events: events.map(({ attempts: _attempts, ...event }) => event),
    };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", "x-nexo-device-token": deviceToken },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const results = validatePushResponse(request, await response.json());
      state = await invoke<SyncState>("sync_record_results", { results, now });
      // Rejected events wait for their backoff; stop when nothing new was stored.
      if (results.every(r => r.status === "rejected")) break;
    } catch (e) {
      state = await invoke<SyncState>("sync_record_failure", {
        eventIds: events.map(e => e.eventId),
        error: String(e),
        now,
      });
      break;
    }
  }
  return state;
}

// ---------- Automatic background sync ----------

const AUTO_INTERVAL_MS = 60_000;
let running = false;
let pendingRequest: number | undefined;
let onState: ((state: SyncState, note?: string) => void) | undefined;

/** One push at a time; manual and automatic syncs share this gate. */
async function syncOnce(): Promise<SyncState | undefined> {
  const endpoint = read(ENDPOINT_KEY, DEFAULT_ENDPOINT).trim();
  const token = read(TOKEN_KEY).trim();
  if (running || !endpoint || !token || !navigator.onLine) return undefined;
  running = true;
  try {
    return await pushOutbox(endpoint, token);
  } finally {
    running = false;
  }
}

async function autoSync() {
  try {
    const state = await syncOnce();
    if (state) onState?.(state, `Auto ${new Date().toLocaleTimeString()} · `);
  } catch (e) {
    console.warn("auto sync", e);
  }
}

/** Ask for a push soon (e.g. right after a sale); bursts collapse into one. */
export function requestSync() {
  window.clearTimeout(pendingRequest);
  pendingRequest = window.setTimeout(() => void autoSync(), 2_000);
}

export function startAutoSync() {
  window.setInterval(() => void autoSync(), AUTO_INTERVAL_MS);
  window.addEventListener("online", () => requestSync());
  requestSync();
}

export async function mountSync(container: HTMLElement) {
  container.innerHTML = `
    <form id="sync-form" class="fin-form">
      <label>Servidor de sincronización<input name="endpoint" type="url"></label>
      <label>Clave del dispositivo<input name="token" type="password" autocomplete="off" placeholder="La entrega NEXO al dar de alta el equipo"></label>
      <button type="submit">Sincronizar ahora</button>
    </form>
    <p class="fin-muted" id="sync-state"></p>`;
  const form = container.querySelector<HTMLFormElement>("#sync-form")!;
  const input = form.querySelector<HTMLInputElement>('[name="endpoint"]')!;
  const tokenInput = form.querySelector<HTMLInputElement>('[name="token"]')!;
  const stateEl = container.querySelector<HTMLElement>("#sync-state")!;
  input.value = read(ENDPOINT_KEY, DEFAULT_ENDPOINT);
  tokenInput.value = read(TOKEN_KEY);
  const show = (state: SyncState, note = "") => {
    stateEl.textContent = `${note}${describe(state)}`;
  };
  onState = show;
  form.onsubmit = async e => {
    e.preventDefault();
    save(ENDPOINT_KEY, input.value);
    save(TOKEN_KEY, tokenInput.value);
    if (!input.value.trim() || !tokenInput.value.trim()) {
      show(await invoke<SyncState>("sync_state"), "Falta el servidor o la clave del dispositivo: todo sigue guardado en el equipo · ");
      return;
    }
    if (!navigator.onLine) {
      show(await invoke<SyncState>("sync_state"), "Sin conexión: se enviará solo al volver la red · ");
      return;
    }
    stateEl.textContent = "Sincronizando…";
    const state = await syncOnce();
    show(state ?? (await invoke<SyncState>("sync_state")), state ? "" : "Ya hay un envío en curso · ");
  };
  show(await invoke<SyncState>("sync_state"));
  startAutoSync();
}

// ---------- Business summary (all devices, from the cloud) ----------

type CurrencyAmount = { currency: string; salesCount?: number; salesMinor?: number; balanceMinor?: number; openCount?: number; outstandingMinor?: number };
type BusinessSummary = {
  days: Array<{ day: string; currency: string; salesCount: number; salesMinor: number; refundsMinor: number }>;
  totals: CurrencyAmount[];
  receivables: CurrencyAmount[];
  messengerCash: CurrencyAmount[];
  devices: Array<{ deviceId: string; label: string | null; lastSeenAt: string | null; events: number }>;
  generatedAt: string;
};

const money = (minor: number, currency: string) => `${(minor / 100).toFixed(2)} ${currency}`;
const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function summaryUrl(endpoint: string, days: number) {
  return `${endpoint.replace(/nexo-sync-push\/?$/, "nexo-business-summary")}?days=${days}`;
}

export async function mountBusinessSummary(container: HTMLElement) {
  container.innerHTML = `
    <p class="fin-muted">Ventas de todos los equipos del negocio, según lo ya sincronizado.</p>
    <button type="button" id="summary-load" class="fin-load">Actualizar resumen</button>
    <div id="summary-body"></div>`;
  const body = container.querySelector<HTMLElement>("#summary-body")!;
  const load = async () => {
    const endpoint = read(ENDPOINT_KEY, DEFAULT_ENDPOINT).trim();
    const token = read(TOKEN_KEY).trim();
    if (!endpoint || !token) {
      body.innerHTML = `<p class="fin-muted">Configura la clave del dispositivo en Sincronización.</p>`;
      return;
    }
    body.innerHTML = `<p class="fin-muted">Cargando…</p>`;
    try {
      const response = await fetch(summaryUrl(endpoint, 7), { headers: { "x-nexo-device-token": token } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const s = (await response.json()) as BusinessSummary;
      const list = (items: CurrencyAmount[], pick: (c: CurrencyAmount) => string) =>
        items.length ? items.map(pick).join(" · ") : "nada";
      body.innerHTML = `
        <div class="fin-table-wrap"><table class="fin-table">
          <thead><tr><th>Día</th><th>Ventas</th><th>Importe</th><th>Devuelto</th></tr></thead>
          <tbody>${s.days
            .map(d => `<tr><th>${escapeHtml(d.day)}</th><td>${d.salesCount}</td><td>${money(d.salesMinor, d.currency)}</td><td>${money(d.refundsMinor, d.currency)}</td></tr>`)
            .join("") || `<tr><td colspan="4">Sin ventas en 7 días</td></tr>`}</tbody>
        </table></div>
        <p><strong>Total histórico:</strong> ${list(s.totals, c => `${c.salesCount} ventas · ${money(c.salesMinor ?? 0, c.currency)}`)}</p>
        <p><strong>Fiado pendiente:</strong> ${list(s.receivables, c => `${money(c.balanceMinor ?? 0, c.currency)} (${c.openCount})`)}</p>
        <p><strong>Efectivo en manos de mensajeros:</strong> ${list(s.messengerCash, c => money(c.outstandingMinor ?? 0, c.currency))}</p>
        <ul class="fin-list">${s.devices
          .map(d => `<li>${escapeHtml(d.label ?? d.deviceId)} · ${d.events} eventos · última conexión ${d.lastSeenAt ? escapeHtml(new Date(d.lastSeenAt).toLocaleString()) : "nunca"}</li>`)
          .join("")}</ul>
        <p class="fin-muted">Actualizado ${escapeHtml(new Date(s.generatedAt).toLocaleString())}</p>`;
    } catch (e) {
      body.innerHTML = `<p class="fin-muted">No se pudo cargar el resumen (${escapeHtml(String(e))}). Sin conexión el POS sigue funcionando.</p>`;
    }
  };
  container.querySelector<HTMLButtonElement>("#summary-load")!.onclick = () => void load();
}
