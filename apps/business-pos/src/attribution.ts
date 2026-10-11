// Who brought the client (gestora) and who served (dependienta) in the sale in
// progress. The active people come with the rates pull and are kept for
// offline use; the cloud turns them into commissions when the sale syncs.
import { escapeHtml } from "./ui";

export type Person = { id: string; kind: "gestor" | "staff" | "messenger"; name: string };
const KINDS = new Set(["gestor", "staff", "messenger"]);

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
  list = people.filter((p): p is Person => p && typeof p.id === "string" && KINDS.has(p.kind) && typeof p.name === "string");
  write(PEOPLE_KEY, JSON.stringify(list));
}

const known = (id: string | null, kind: Person["kind"]) => (id && list.some(p => p.id === id && p.kind === kind) ? id : null);

/** Attribution of the sale in progress. The dependienta stays for the next sales on this device. */
export const attribution = {
  gestorId: null as string | null,
  staffId: read(STAFF_KEY),
  extra: new Set<string>(),
  /** Quién se lleva el pedido: un mensajero aprobado; null = se lo lleva el cliente. */
  messengerId: null as string | null,
  /** Cliente (opcional): va a la lista de clientes de la web con su gestora. */
  customerName: "",
  customerPhone: "",
};

/** Nombres de los mensajeros aprobados (para sugerirlos en "Efectivo de mensajeros"). */
export const messengerNames = () => list.filter(p => p.kind === "messenger").map(p => p.name);

export function setMessenger(id: string | null) {
  attribution.messengerId = known(id, "messenger");
}

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
  return {
    gestorId: known(attribution.gestorId, "gestor"),
    staffId: known(attribution.staffId, "staff"),
    messengerId: known(attribution.messengerId, "messenger"),
    customerName: attribution.customerName.trim() || null,
    customerPhone: attribution.customerPhone.replace(/\D/g, "") || null,
  };
}

/** After a sale the gestora, extra marks, mensajero and cliente reset; the dependienta stays. */
export function resetAttribution() {
  attribution.gestorId = null;
  attribution.extra.clear();
  attribution.messengerId = null;
  attribution.customerName = "";
  attribution.customerPhone = "";
}

/** Two selects for the cart; nothing when the business has no gestoras or dependientas yet. */
export function attributionHtml() {
  const gestoras = list.filter(p => p.kind === "gestor");
  const staff = list.filter(p => p.kind === "staff");
  const messengers = list.filter(p => p.kind === "messenger");
  const option = (p: Person, selected: string | null) => `<option value="${escapeHtml(p.id)}"${p.id === selected ? " selected" : ""}>${escapeHtml(p.name)}</option>`;
  const hasCustomer = attribution.customerName || attribution.customerPhone;
  return `<div class="attribution">
    ${staff.length ? `<label class="field">Atiende<select class="input" data-staff><option value="">—</option>${staff.map(p => option(p, attribution.staffId)).join("")}</select></label>` : ""}
    ${gestoras.length ? `<label class="field">Gestora<select class="input" data-gestor><option value="">Venta directa</option>${gestoras.map(p => option(p, attribution.gestorId)).join("")}</select></label>` : ""}
    <label class="field">Entrega<select class="input" data-messenger><option value="">Se lo lleva el cliente</option>${messengers.map(p => option(p, attribution.messengerId)).join("")}</select></label>
    <details class="field"${hasCustomer ? " open" : ""}><summary>Cliente (opcional)</summary>
      <input class="input" data-customer-name placeholder="Nombre" autocomplete="off" value="${escapeHtml(attribution.customerName)}">
      <input class="input" data-customer-phone placeholder="Teléfono (WhatsApp)" inputmode="tel" autocomplete="off" value="${escapeHtml(attribution.customerPhone)}">
    </details>
  </div>`;
}
