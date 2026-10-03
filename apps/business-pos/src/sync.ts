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
const BATCH = 100;

function readEndpoint(): string {
  try {
    return localStorage.getItem(ENDPOINT_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveEndpoint(value: string) {
  try {
    localStorage.setItem(ENDPOINT_KEY, value.trim());
  } catch {
    // Storage unavailable: the endpoint is used for this session only.
  }
}

function describe(state: SyncState) {
  const parts = [`Pendientes ${state.pending}`, `sincronizados ${state.synced}`];
  if (state.failing) parts.push(`con error ${state.failing}`);
  if (state.lastError) parts.push(`último error: ${state.lastError}`);
  return parts.join(" · ");
}

/** Pushes every due event. Returns the final queue state. */
export async function pushOutbox(endpoint: string): Promise<SyncState> {
  let state = await invoke<SyncState>("sync_state");
  if (!endpoint) return state;
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
        headers: { "content-type": "application/json" },
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

export async function mountSync(container: HTMLElement) {
  container.innerHTML = `
    <form id="sync-form" class="fin-form">
      <label>Servidor de sincronización<input name="endpoint" type="url" placeholder="https://…/api/nexo-business/sync/push"></label>
      <button type="submit">Sincronizar ahora</button>
    </form>
    <p class="fin-muted" id="sync-state"></p>`;
  const form = container.querySelector<HTMLFormElement>("#sync-form")!;
  const input = form.querySelector<HTMLInputElement>('[name="endpoint"]')!;
  const stateEl = container.querySelector<HTMLElement>("#sync-state")!;
  input.value = readEndpoint();
  const show = (state: SyncState, note = "") => {
    stateEl.textContent = `${note}${describe(state)}`;
  };
  form.onsubmit = async e => {
    e.preventDefault();
    saveEndpoint(input.value);
    if (!input.value.trim()) {
      show(await invoke<SyncState>("sync_state"), "Sin servidor configurado: todo sigue guardado en el equipo · ");
      return;
    }
    stateEl.textContent = "Sincronizando…";
    show(await pushOutbox(input.value.trim()));
  };
  show(await invoke<SyncState>("sync_state"));
}
