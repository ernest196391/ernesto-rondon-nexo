// Who brought the client (gestora) and who served (dependienta) in the sale in
// progress. The active people come with the rates pull and are kept for
// offline use; the cloud turns them into commissions when the sale syncs.
import { escapeHtml } from "./ui";

export type Person = { id: string; kind: "gestor" | "staff"; name: string };

const PEOPLE_KEY = "nexo.people";
const STAFF_KEY = "nexo.staffId";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: kept for this session only.
  }
}

let list: Person[] = (() => {
  try {
    const parsed = JSON.parse(read(PEOPLE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
})();

export function savePeople(people: unknown) {
  if (!Array.isArray(people)) return;
  list = people.filter((p): p is Person => p && typeof p.id === "string" && (p.kind === "gestor" || p.kind === "staff") && typeof p.name === "string");
  write(PEOPLE_KEY, JSON.stringify(list));
}

const known = (id: string | null, kind: Person["kind"]) => (id && list.some(p => p.id === id && p.kind === kind) ? id : null);

/** Attribution of the sale in progress. The dependienta stays for the next sales on this device. */
export const attribution = {
  gestorId: null as string | null,
  staffId: read(STAFF_KEY),
  extra: new Set<string>(),
};

export function setGestor(id: string | null) {
  attribution.gestorId = known(id, "gestor");
  if (!attribution.gestorId) attribution.extra.clear();
}

export function setStaff(id: string | null) {
  attribution.staffId = known(id, "staff");
  write(STAFF_KEY, attribution.staffId);
}

export function toggleExtra(productId: string) {
  if (!attribution.gestorId) return;
  if (attribution.extra.has(productId)) attribution.extra.delete(productId);
  else attribution.extra.add(productId);
}

/** IDs to send with the sale; unknown or inactive people are dropped. */
export function saleAttribution() {
  return { gestorId: known(attribution.gestorId, "gestor"), staffId: known(attribution.staffId, "staff") };
}

/** After a sale the gestora and the extra marks reset; the dependienta stays. */
export function resetAttribution() {
  attribution.gestorId = null;
  attribution.extra.clear();
}

/** Two selects for the cart; nothing when the business has no gestoras or dependientas yet. */
export function attributionHtml() {
  const gestoras = list.filter(p => p.kind === "gestor");
  const staff = list.filter(p => p.kind === "staff");
  if (!gestoras.length && !staff.length) return "";
  const option = (p: Person, selected: string | null) => `<option value="${escapeHtml(p.id)}"${p.id === selected ? " selected" : ""}>${escapeHtml(p.name)}</option>`;
  return `<div class="attribution">
    ${staff.length ? `<label class="field">Atiende<select class="input" data-staff><option value="">—</option>${staff.map(p => option(p, attribution.staffId)).join("")}</select></label>` : ""}
    ${gestoras.length ? `<label class="field">Gestora<select class="input" data-gestor><option value="">Venta directa</option>${gestoras.map(p => option(p, attribution.gestorId)).join("")}</select></label>` : ""}
  </div>`;
}
