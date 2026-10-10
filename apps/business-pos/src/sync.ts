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
import { pullRates } from "./checkout";

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

// ---------- Catalog pull ----------

type CatalogChange = { seq: number; productId: string; name: string; active: boolean; barcodes: string[]; prices: Record<string, number> };
type ApplyResult = { applied: number; lastSeq: number };

function pullUrl(endpoint: string, after: number) {
  return `${endpoint.replace(/nexo-sync-push\/?$/, "nexo-catalog-pull")}?after=${after}&limit=200`;
}

/** Downloads catalog changes after the local checkpoint and applies them page by page. */
export async function pullCatalog(endpoint: string, deviceToken: string): Promise<number> {
  let total = 0;
  for (let page = 0; page < 50; page++) {
    const after = await invoke<number>("catalog_checkpoint");
    const response = await fetch(pullUrl(endpoint, after), { headers: { "x-nexo-device-token": deviceToken } });
    if (!response.ok) throw new Error(`Catálogo: HTTP ${response.status}`);
    const { changes } = (await response.json()) as { changes: CatalogChange[] };
    if (!Array.isArray(changes) || !changes.length) break;
    const result = await invoke<ApplyResult>("catalog_apply", { changes, now: new Date().toISOString() });
    total += result.applied;
    if (changes.length < 200) break;
  }
  if (total) window.dispatchEvent(new CustomEvent("nexo:catalog-updated", { detail: { applied: total } }));
  return total;
}

// ---------- Stock pull ----------

/** Replaces the local stock snapshot with the cloud's derived stock. */
export async function pullStock(endpoint: string, deviceToken: string): Promise<number> {
  // Reloj de ESTE equipo, no el del servidor: las ventas se marcan sincronizadas con la hora
  // local, y si la PC va adelantada una venta ya incluida en la foto se restaba dos veces
  // (Lennys 10/10: vendió 1 de 2 y la caja decía "Agotado").
  const fetchedAt = new Date().toISOString();
  const response = await fetch(endpoint.replace(/nexo-sync-push\/?$/, "nexo-stock-pull"), { headers: { "x-nexo-device-token": deviceToken } });
  if (!response.ok) throw new Error(`Existencias: HTTP ${response.status}`);
  const { stock } = (await response.json()) as { stock: unknown[] };
  if (!Array.isArray(stock)) return 0;
  const count = await invoke<number>("stock_replace", { items: stock, fetchedAt });
  window.dispatchEvent(new CustomEvent("nexo:stock-updated"));
  return count;
}

// ---------- Device identity (provisioning) ----------

export type DeviceIdentity = { businessId: string; branchId: string; deviceId: string; label: string | null; provisioned: boolean };

function identityUrl(endpoint: string) {
  return endpoint.replace(/nexo-sync-push\/?$/, "nexo-device-identity");
}

/**
 * Asks the cloud which business/device this key belongs to and stores it.
 * Reloads the app when the business changes so every screen uses it.
 */
export async function provisionDevice(endpoint: string, deviceToken: string): Promise<DeviceIdentity> {
  const current = await invoke<DeviceIdentity>("device_identity");
  const response = await fetch(identityUrl(endpoint), { headers: { "x-nexo-device-token": deviceToken } });
  if (response.status === 401) throw new Error("La clave del dispositivo no es válida o está desactivada");
  if (!response.ok) throw new Error(`Identidad: HTTP ${response.status}`);
  const cloud = (await response.json()) as { businessId: string; deviceId: string; label: string | null };
  if (current.provisioned && current.businessId === cloud.businessId && current.deviceId === cloud.deviceId && current.label === cloud.label) {
    return current;
  }
  const next = await invoke<DeviceIdentity>("device_provision", {
    businessId: cloud.businessId,
    deviceId: cloud.deviceId,
    label: cloud.label,
    now: new Date().toISOString(),
  });
  if (next.businessId !== current.businessId) window.location.reload();
  else window.dispatchEvent(new CustomEvent("nexo:device-updated", { detail: next }));
  return next;
}

// ---------- Automatic background sync ----------

const AUTO_INTERVAL_MS = 60_000;
let running = false;
let pendingRequest: number | undefined;
let onState: ((state: SyncState, note?: string) => void) | undefined;
let onProblem: ((message: string) => void) | undefined;

/** One push at a time; manual and automatic syncs share this gate. */
async function syncOnce(): Promise<SyncState | undefined> {
  const endpoint = read(ENDPOINT_KEY, DEFAULT_ENDPOINT).trim();
  const token = read(TOKEN_KEY).trim();
  if (running || !endpoint || !token || !navigator.onLine) return undefined;
  running = true;
  try {
    // Never push or pull under an identity the key does not belong to.
    await provisionDevice(endpoint, token);
    const state = await pushOutbox(endpoint, token);
    try {
      await pullCatalog(endpoint, token);
    } catch (e) {
      console.warn("catalog pull", e);
    }
    try {
      await pullStock(endpoint, token);
    } catch (e) {
      console.warn("stock pull", e);
    }
    try {
      await pullRates(endpoint, token);
    } catch (e) {
      console.warn("rates pull", e);
    }
    return state;
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
    onProblem?.(`No se sincronizó: ${e instanceof Error ? e.message : String(e)}`);
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

/** Alta con código corto: la nube crea el equipo y entrega su clave una sola vez. */
export async function enrollWithCode(code: string): Promise<{ label: string; deviceId: string }> {
  const url = DEFAULT_ENDPOINT.replace(/nexo-sync-push\/?$/, "nexo-device-enroll");
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
  const body = (await response.json().catch(() => ({}))) as { error?: string; token?: string; label?: string; deviceId?: string };
  if (!response.ok || !body.token) throw new Error(body.error || "No se pudo dar de alta");
  save(ENDPOINT_KEY, DEFAULT_ENDPOINT);
  save(TOKEN_KEY, body.token);
  await provisionDevice(DEFAULT_ENDPOINT, body.token);
  return { label: body.label ?? "", deviceId: body.deviceId ?? "" };
}

export async function mountSync(container: HTMLElement) {
  container.innerHTML = `
    <form id="enroll-form" class="nx-form" ${read(TOKEN_KEY) ? 'hidden style="display:none"' : ""}>
      <p class="t-sm">Para conectar este equipo con la tienda, pide a Ernesto un <b>código de alta</b> y escríbelo aquí.</p>
      <label class="field">Código de alta<input class="input" name="code" autocomplete="off" autocapitalize="characters" maxlength="7" placeholder="Ej.: K7M2QX" style="text-transform:uppercase;letter-spacing:.2em;font-size:1.3em"></label>
      <button type="submit" class="btn btn-primary btn-block">Conectar este equipo</button>
    </form>
    <form id="sync-form" class="nx-form">
      <button type="submit" class="btn btn-primary btn-block">Sincronizar ahora</button>
      <details class="t-sm"><summary class="muted">Opciones avanzadas</summary>
        <label class="field">Servidor de sincronización<input class="input" name="endpoint" type="url"></label>
        <label class="field">Clave del dispositivo<input class="input" name="token" type="password" autocomplete="off" placeholder="La entrega NEXO al dar de alta el equipo"></label>
      </details>
    </form>
    <p class="t-sm muted" id="sync-state"></p>`;
  const enrollForm = container.querySelector<HTMLFormElement>("#enroll-form")!;
  enrollForm.onsubmit = async e => {
    e.preventDefault();
    const codeInput = enrollForm.querySelector<HTMLInputElement>('[name="code"]')!;
    const button = enrollForm.querySelector<HTMLButtonElement>("button")!;
    if (!navigator.onLine) {
      stateEl.textContent = "Necesitas internet solo para este paso. Conéctate y prueba otra vez.";
      return;
    }
    button.disabled = true;
    stateEl.textContent = "Conectando…";
    try {
      const who = await enrollWithCode(codeInput.value);
      tokenInput.value = read(TOKEN_KEY);
      enrollForm.hidden = true;
      enrollForm.style.display = "none";
      stateEl.textContent = `✅ Equipo conectado: ${who.label}. Descargando productos…`;
      const state = await syncOnce();
      if (state) show(state, `✅ ${who.label} · `);
    } catch (err) {
      stateEl.textContent = err instanceof Error ? err.message : String(err);
    } finally {
      button.disabled = false;
    }
  };
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
  onProblem = message => {
    stateEl.textContent = message;
  };
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
    try {
      const state = await syncOnce();
      show(state ?? (await invoke<SyncState>("sync_state")), state ? "" : "Ya hay un envío en curso · ");
    } catch (e) {
      onProblem?.(`No se sincronizó: ${e instanceof Error ? e.message : String(e)}`);
    }
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
    <p class="t-sm muted">Ventas de todos los equipos del negocio, según lo ya sincronizado.</p>
    <button type="button" id="summary-load" class="btn btn-secondary btn-block">Actualizar resumen</button>
    <div id="summary-body"></div>`;
  const body = container.querySelector<HTMLElement>("#summary-body")!;
  const load = async () => {
    const endpoint = read(ENDPOINT_KEY, DEFAULT_ENDPOINT).trim();
    const token = read(TOKEN_KEY).trim();
    if (!endpoint || !token) {
      body.innerHTML = `<p class="t-sm muted">Configura la clave del dispositivo en Sincronización.</p>`;
      return;
    }
    body.innerHTML = `<p class="t-sm muted">Cargando…</p>`;
    try {
      const response = await fetch(summaryUrl(endpoint, 7), { headers: { "x-nexo-device-token": token } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const s = (await response.json()) as BusinessSummary;
      const list = (items: CurrencyAmount[], pick: (c: CurrencyAmount) => string) =>
        items.length ? items.map(pick).join(" · ") : "nada";
      body.innerHTML = `
        <div style="overflow-x: auto"><table class="tbl">
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
        <p class="t-sm muted">Actualizado ${escapeHtml(new Date(s.generatedAt).toLocaleString())}</p>`;
    } catch (e) {
      body.innerHTML = `<p class="t-sm muted">No se pudo cargar el resumen (${escapeHtml(String(e))}). Sin conexión el POS sigue funcionando.</p>`;
    }
  };
  container.querySelector<HTMLButtonElement>("#summary-load")!.onclick = () => void load();
}
