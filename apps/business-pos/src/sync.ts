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
import { getVersion } from "@tauri-apps/api/app";
import { pullRates } from "./checkout";
import { can } from "./attribution";

export type SyncState = { pending: number; failing: number; synced: number; oldestPendingAt: string | null; lastError: string | null };
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

/** Plain Spanish for the clerks (20-oct): what is waiting and what to do. */
export function describe(state: SyncState) {
  if (!state.pending) return `Todo enviado (${state.synced} en total).`;
  const n = state.pending === 1 ? "1 cosa por enviar" : `${state.pending} cosas por enviar`;
  if (!state.failing) return `${n}. Se envían solas en cuanto haya internet.`;
  return `${n}. Un intento falló (${friendlyError(state.lastError)}); se repite solo en menos de 5 minutos o toca «Sincronizar ahora».`;
}

/** Technical errors → words the clerk understands. */
export function friendlyError(raw: string | null | undefined) {
  const e = String(raw ?? "");
  if (!e) return "sin detalle";
  if (/failed to fetch|networkerror|load failed|network|timeout|sin conexi/i.test(e)) return "sin internet o la red muy lenta";
  if (/HTTP 401|unauthorized|no es válida/i.test(e)) return "la clave de este teléfono no vale: pide un código nuevo a Lennys";
  if (/HTTP 5\d\d/i.test(e)) return "la nube no contestó";
  return e.length > 120 ? `${e.slice(0, 120)}…` : e;
}

/**
 * Pushes every due event. Returns the final queue state.
 * `force` («Sincronizar ahora»): everything pending goes now, ignoring the backoff.
 */
export async function pushOutbox(endpoint: string, deviceToken: string, force = false): Promise<SyncState> {
  let state = await invoke<SyncState>("sync_state");
  if (!endpoint || !deviceToken) return state;
  if (force) await invoke<number>("sync_make_all_due");
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
  if (!Array.isArray(stock)) throw new Error("Existencias: respuesta inválida del servidor");
  const count = await invoke<number>("stock_replace", { items: stock, fetchedAt });
  window.dispatchEvent(new CustomEvent("nexo:stock-updated"));
  return count;
}

// ---------- Device identity (provisioning) ----------

export type DeviceIdentity = { businessId: string; branchId: string; deviceId: string; label: string | null; provisioned: boolean };

let versionCache = "";
/** This app's version (tauri.conf.json), sent with the check-in for Ajustes → Cajas. */
export async function appVersion(): Promise<string> {
  if (!versionCache) {
    try {
      versionCache = await getVersion();
    } catch {
      versionCache = "";
    }
  }
  return versionCache;
}

function identityUrl(endpoint: string, version = "") {
  return endpoint.replace(/nexo-sync-push\/?$/, "nexo-device-identity") + (version ? `?v=${encodeURIComponent(version)}` : "");
}

/** URL of another device function next to the sync endpoint. */
export function functionUrl(name: string) {
  return read(ENDPOINT_KEY, DEFAULT_ENDPOINT).trim().replace(/nexo-sync-push\/?$/, name);
}

/** The device key, or "" when this phone is not connected yet. */
export function deviceToken() {
  return read(TOKEN_KEY).trim();
}

/** POST to a device function with this phone's key. Throws with the server's message. */
export async function deviceCall<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const token = deviceToken();
  if (!token) throw new Error("Este teléfono aún no está conectado (Más → Sincronización).");
  const response = await fetch(functionUrl(name), {
    method: "POST",
    headers: { "content-type": "application/json", "x-nexo-device-token": token },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP ${response.status}`) as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = data.error;
    throw error;
  }
  return data;
}

/**
 * Asks the cloud which business/device this key belongs to and stores it.
 * Reloads the app when the business changes so every screen uses it.
 */
export async function provisionDevice(endpoint: string, deviceToken: string): Promise<DeviceIdentity> {
  const current = await invoke<DeviceIdentity>("device_identity");
  // Also the «check-in»: the panel sees «Última conexión» and the version even without sales to send.
  const response = await fetch(identityUrl(endpoint, await appVersion()), { headers: { "x-nexo-device-token": deviceToken } });
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

/** Extra steps other screens add to every sync (web-order queue, store shift). */
const afterPush: Array<() => Promise<void>> = [];
export function onEverySync(step: () => Promise<void>) {
  afterPush.push(step);
}

/** Which downloads failed in the last sync («Productos», «Existencias», «Tasas»). */
export let lastMissing: string[] = [];

/**
 * One sync at a time; manual and automatic syncs share this gate.
 * `force` = «Sincronizar ahora»: everything pending goes now, ignoring the backoff.
 */
export async function syncOnce(force = false): Promise<SyncState | undefined> {
  const endpoint = read(ENDPOINT_KEY, DEFAULT_ENDPOINT).trim();
  const token = read(TOKEN_KEY).trim();
  if (running || !endpoint || !token || !navigator.onLine) return undefined;
  running = true;
  try {
    // Never push or pull under an identity the key does not belong to.
    await provisionDevice(endpoint, token);
    const state = await pushOutbox(endpoint, token, force);
    for (const step of afterPush) {
      try {
        await step();
      } catch (e) {
        console.warn("sync step", e);
      }
    }
    // "Al día" = las tres descargas llegaron. Cada una se intenta aunque otra falle
    // (20-oct: antes una sola fallida dejaba sin bajar las demás) y se dice cuál faltó.
    const missing: string[] = [];
    const steps: Array<[string, () => Promise<unknown>]> = [
      ["productos", () => pullCatalog(endpoint, token)],
      ["existencias", () => pullStock(endpoint, token)],
      ["tasas y personas", () => pullRates(endpoint, token)],
    ];
    let firstError: unknown = null;
    for (const [name, run] of steps) {
      try {
        await run();
      } catch (e) {
        missing.push(name);
        firstError ??= e;
      }
    }
    lastMissing = missing;
    if (missing.length) {
      window.dispatchEvent(new CustomEvent("nexo:sync-failed", { detail: { missing } }));
      throw new Error(`no bajaron ${missing.join(", ")} (${friendlyError(firstError instanceof Error ? firstError.message : String(firstError))})`);
    }
    window.dispatchEvent(new Event("nexo:sync-complete"));
    return state;
  } finally {
    running = false;
  }
}

async function autoSync() {
  try {
    const state = await syncOnce();
    if (state) onState?.(state, `Revisado a las ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · `);
  } catch (e) {
    console.warn("auto sync", e);
    onProblem?.(`No se completó: ${e instanceof Error ? e.message : String(e)}. Se reintenta solo; también puedes tocar «Sincronizar ahora».`);
  }
}

/** Ask for a push soon (e.g. right after a sale); bursts collapse into one. */
export function requestSync() {
  window.clearTimeout(pendingRequest);
  pendingRequest = window.setTimeout(() => void autoSync(), 2_000);
}

let autoStarted = false;
export function startAutoSync() {
  if (autoStarted) return;
  autoStarted = true;
  window.setInterval(() => void autoSync(), AUTO_INTERVAL_MS);
  window.addEventListener("online", () => requestSync());
  // 20-oct: al volver a la app (Android la deja en segundo plano) se sincroniza enseguida.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") requestSync();
  });
  window.addEventListener("focus", () => requestSync());
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
      show(await invoke<SyncState>("sync_state"), "Sin internet: todo sigue guardado en el teléfono y se enviará solo al volver la red · ");
      return;
    }
    stateEl.textContent = "Enviando y bajando todo ahora…";
    try {
      // «Sincronizar ahora»: envía TODO lo pendiente ya, sin esperar los reintentos.
      const state = await syncOnce(true);
      show(state ?? (await invoke<SyncState>("sync_state")), state ? "✓ Listo · " : "Ya se está enviando, espera unos segundos · ");
    } catch (e) {
      onProblem?.(`No se completó: ${e instanceof Error ? e.message : String(e)}`);
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
    const allowed = can("summary");
    if (!allowed.ok) { body.innerHTML = `<p class="t-sm muted">${allowed.reason}</p>`; return; }
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
