// «Pedido web: cancelar o devolver» (Ernesto 31-oct, caso de la olla Ariete: pedido web de 62 USD devuelto
// que Zaymi solo pudo sacar como «Salida del cajón · Otro»).
//
// Se busca el pedido por su #número (el del vale) y se ve su estado, los productos y lo cobrado.
//  - Abierto → «Cancelar» con causa (Core: /sales/{id}/cancel, reglas de la dependienta).
//  - Cobrado → «Devolución» con causa, unidades por línea y el dinero devuelto (USD/CUP, efectivo o
//    transferencia). El efectivo sale del cajón en el acto como «devolución de pedido #N» LIGADA al pedido
//    (nunca «Otro») y Lennys la aprueba por el bot (SALIDA SI n) con pedido, producto y causa.
// Todo pasa por la cola de la caja: sin internet queda guardado y se envía solo; el id de la acción va a
// Core como idempotencia, así que un reintento nunca cancela ni devuelve dos veces.
import { invoke } from "@tauri-apps/api/core";
import { attribution, can, personName, setStaff, staffList, staffSelectHtml } from "./attribution";
import { deviceCall, deviceToken, onEverySync } from "./sync";
import { escapeHtml as esc } from "./ui";
import { buildRefunds, confirmText, friendly, parseOrderNumber, validateAction, type ActionOrder, type Line, type Refund } from "./weborder-actions-logic";

type Action = {
  actionId: string;
  kind: "cancel" | "return";
  orderId: number;
  orderNumber: string;
  reason: string;
  productsText: string | null;
  lines: Line[];
  refunds: Refund[];
  refundMethod: string;
  refundUsdMinor: number;
  refundCupMinor: number;
  staffId: string | null;
  status: "queued" | "done" | "refused";
  attempts: number;
  lastError: string | null;
  coreMessage: string | null;
  createdAt: string;
};

const say = (message: string, tone: "ok" | "error" = "ok") =>
  window.dispatchEvent(new CustomEvent("nexo:say", { detail: { message, tone } }));
const money = (m: number, c: string) => `${(m / 100).toLocaleString("es", { minimumFractionDigits: m % 100 ? 2 : 0, maximumFractionDigits: 2 })} ${c}`;
const CACHE_KEY = "nexo.webActionOrders";

let root: HTMLElement | null = null;
let current: ActionOrder | null = null;
let sending = false;

/** Pedidos ya vistos (por si se va la red entre buscar y confirmar). Solo comodidad: puede venir vacío. */
function cacheGet(number: string): { order: ActionOrder; at: string } | null {
  try { return (JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as Record<string, { order: ActionOrder; at: string }>)[number] ?? null; } catch { return null; }
}
function cachePut(order: ActionOrder) {
  try {
    const all = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as Record<string, { order: ActionOrder; at: string }>;
    all[order.number] = { order, at: new Date().toISOString() };
    const keep = Object.entries(all).sort((a, b) => b[1].at.localeCompare(a[1].at)).slice(0, 20);
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(keep)));
  } catch { /* sin almacenamiento: no pasa nada */ }
}

/** Envía a la web cada acción que espera. Corre tras cada sincronización y justo después de registrar. */
export async function sendQueuedActions(): Promise<void> {
  if (sending || !navigator.onLine || !deviceToken()) return;
  sending = true;
  try {
    const queued = await invoke<Action[]>("web_order_action_queued");
    for (const a of queued) {
      try {
        const out = await deviceCall<{ ok: boolean; message?: string }>("nexo-device-web-orders", {
          action: a.kind, orderId: a.orderId, actionId: a.actionId, reason: a.reason, staffId: a.staffId,
          lines: a.lines.map(l => ({ itemId: l.itemId, qty: l.qty })), refunds: a.refunds,
        });
        await invoke("web_order_action_done", { actionId: a.actionId, message: out.message ?? null, now: new Date().toISOString() });
        say(`✓ Pedido #${a.orderNumber}: ${out.message ?? (a.kind === "cancel" ? "cancelado" : "devolución registrada")}`);
      } catch (e) {
        const f = friendly(e as Error & { status?: number; code?: string });
        if (f.final) {
          await invoke("web_order_action_refused", { actionId: a.actionId, message: f.text, now: new Date().toISOString() });
          const cash = a.kind === "return" && a.refunds.some(r => r.method === "cash");
          say(`Pedido #${a.orderNumber}: la web no lo aceptó. ${f.text}${cash ? " El efectivo que salió del cajón queda pendiente de Lennys." : ""}`, "error");
        } else {
          await invoke("web_order_action_failure", { actionId: a.actionId, error: f.text });
        }
      }
    }
  } finally {
    sending = false;
    if (root) void renderRecent();
  }
}
onEverySync(sendQueuedActions);

export function mountWebOrderActions(container: HTMLElement | null) {
  if (!container) return;
  root = container;
  root.innerHTML = `
    <p class="t-sm muted">Para un pedido de la web (#número del vale): si está abierto se cancela; si ya se cobró, se registra la devolución. Siempre con la causa.</p>
    <form class="nx-form" data-find>
      <label class="field">Número del pedido<input class="input" name="number" inputmode="numeric" autocomplete="off" placeholder="Ejemplo: 5612" required></label>
      <button class="btn btn-block" type="submit">Buscar pedido</button>
    </form>
    <div data-order></div>
    <div data-recent class="stack"></div>`;
  root.querySelector<HTMLFormElement>("[data-find]")!.onsubmit = e => {
    e.preventDefault();
    void find(new FormData(e.target as HTMLFormElement).get("number") as string);
  };
  void renderRecent();
}

async function find(raw: string) {
  const box = root!.querySelector<HTMLElement>("[data-order]")!;
  const number = parseOrderNumber(raw);
  if (!number) { box.innerHTML = `<p class="notice warn">Escribe el número del pedido, el del vale (por ejemplo 5612).</p>`; return; }
  box.innerHTML = `<p class="t-sm muted">Buscando el pedido #${esc(number)}…</p>`;
  try {
    const r = await deviceCall<{ order: ActionOrder; clerkFound: boolean }>("nexo-device-web-orders", { action: "find", number, staffId: attribution.staffId });
    current = r.order;
    cachePut(r.order);
    renderOrder(r.clerkFound ? "" : "Ojo: no encontré tu usuaria en la web. Puedes ver el pedido, pero para cancelar o devolver pide a Lennys que la enlace (o hazlo en Ventas).");
  } catch (e) {
    const cached = cacheGet(number);
    const f = friendly(e as Error & { status?: number; code?: string });
    if (cached && !f.final) {
      current = cached.order;
      renderOrder(`Sin conexión: son los datos de las ${new Date(cached.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Lo que registres se envía solo al volver la red.`);
      return;
    }
    current = null;
    box.innerHTML = `<p class="notice warn">${esc(f.final ? f.text : (e as Error).message && !/fetch/i.test((e as Error).message) ? (e as Error).message : "Sin internet no puedo ver el pedido. Búscalo cuando vuelva la red.")}</p>`;
  }
}

function orderHead(o: ActionOrder) {
  const charged = o.charged
    ? [o.charged.usd ? money(Math.round(o.charged.usd * 100), "USD") : "", o.charged.cup ? money(Math.round(o.charged.cup * 100), "CUP") : ""].filter(Boolean).join(" + ") || "sin importe"
    : "sin cobrar";
  return `<div class="panel stack">
    <div><b>Pedido #${esc(o.number)}</b>${o.test ? " · <i>prueba</i>" : ""} · ${esc(o.statusLabel)}</div>
    <div class="t-sm">${esc(o.customer)}${o.gestora ? ` · gestora ${esc(o.gestora)}` : ""} · total ${money(Math.round(o.totalUsd * 100), "USD")} · cobrado: ${esc(charged)}</div>
    <ul class="t-sm">${o.products.map(p => `<li>${p.qty}× ${esc(p.name)}</li>`).join("")}</ul>
    ${o.cancelReason && o.status === "cancelled" ? `<div class="t-sm">Causa de la cancelación: ${esc(o.cancelReason)}</div>` : ""}
    ${o.returnInfo ? `<div class="t-sm">Devolución: ${esc(o.returnInfo.products || "todo")} · ${money(Math.round(o.returnInfo.refundUsd * 100), "USD")} + ${money(Math.round(o.returnInfo.refundCup * 100), "CUP")} · ${esc(o.returnInfo.reason)} · ${esc(o.returnInfo.by)}${o.returnInfo.review === "pending" ? " · pendiente de Lennys" : ""}</div>` : ""}
  </div>`;
}

function renderOrder(note: string) {
  const o = current!;
  const box = root!.querySelector<HTMLElement>("[data-order]")!;
  const notice = note ? `<p class="notice warn">${esc(note)}</p>` : "";
  const staff = staffList().length ? staffSelectHtml("staff", "¿Quién lo hace?") : "";
  if (o.can === "cancel") {
    box.innerHTML = `${notice}${orderHead(o)}
      <form class="nx-form" data-act="cancel">
        ${staff}
        <label class="field">Causa (obligatoria)<input class="input" name="reason" required minlength="3" maxlength="200" placeholder="Por qué se cancela"></label>
        <button class="btn btn-danger btn-block" type="submit">Cancelar pedido #${esc(o.number)}</button>
      </form>`;
  } else if (o.can === "return") {
    box.innerHTML = `${notice}${orderHead(o)}
      <form class="nx-form" data-act="return">
        ${staff}
        <p class="t-sm muted">¿Qué vuelve a la tienda?</p>
        ${o.products.map(p => `<label class="field">${esc(p.name)} (tiene ${p.qty})<input class="input" name="qty-${p.itemId}" type="number" min="0" max="${p.qty}" step="1" value="${p.qty}"></label>`).join("")}
        <label class="field">Causa (obligatoria)<input class="input" name="reason" required minlength="3" maxlength="200" placeholder="Por qué lo devuelve"></label>
        <p class="t-sm muted">Dinero que se le devuelve (vacío si nada). El efectivo sale del cajón y lo aprueba Lennys.</p>
        <div class="nx-pair"><label class="field">USD<input class="input" name="usd" inputmode="decimal" placeholder="0"></label>
          <label class="field">Forma<select class="input" name="usdMethod"><option value="cash">Efectivo</option><option value="transfer">Transferencia</option></select></label></div>
        <div class="nx-pair"><label class="field">CUP<input class="input" name="cup" inputmode="decimal" placeholder="0"></label>
          <label class="field">Forma<select class="input" name="cupMethod"><option value="cash">Efectivo</option><option value="transfer">Transferencia</option></select></label></div>
        <button class="btn btn-primary btn-block" type="submit">Registrar devolución del #${esc(o.number)}</button>
      </form>`;
  } else {
    box.innerHTML = `${notice}${orderHead(o)}<p class="notice warn">${esc(o.why || "Desde la caja no se puede hacer nada con este pedido.")}</p>`;
    return;
  }
  const form = box.querySelector<HTMLFormElement>("[data-act]")!;
  form.onsubmit = e => { e.preventDefault(); void submit(form, o); };
}

let busy = false;
async function submit(form: HTMLFormElement, o: ActionOrder) {
  if (busy) return;
  const kind = form.dataset.act as "cancel" | "return";
  const data = new FormData(form);
  const staffId = (data.get("staff") as string | null) || attribution.staffId;
  if (staffList().length && !staffId) { say("Elige quién lo hace.", "error"); return; }
  if (staffId && staffId !== attribution.staffId) setStaff(staffId);
  if (kind === "return") {
    const allowed = can("returns");
    if (!allowed.ok) { say(allowed.reason ?? "Sin permiso para devoluciones.", "error"); return; }
  }
  const reason = String(data.get("reason") ?? "").replace(/\s+/g, " ").trim();
  const lines: Line[] = kind === "return" ? o.products.map(p => ({ itemId: p.itemId, name: p.name, qty: Number(data.get(`qty-${p.itemId}`) || 0) })) : [];
  const problem = validateAction(kind, reason, lines, o);
  if (problem) { say(problem, "error"); return; }
  const refunds = kind === "return" ? buildRefunds(String(data.get("usd") ?? ""), String(data.get("usdMethod") ?? ""), String(data.get("cup") ?? ""), String(data.get("cupMethod") ?? "")) : [];
  if (typeof refunds === "string") { say(refunds, "error"); return; }
  const chosen = lines.filter(l => l.qty > 0);
  if (!window.confirm(confirmText(kind, o, reason, chosen, refunds))) return;
  busy = true;
  try {
    const cash = refunds.some(r => r.method === "cash");
    const shift = cash ? await invoke<{ shiftId: string } | null>("cash_shift_current") : null;
    if (cash && !shift) { say("Para devolver efectivo abre el turno de caja: el dinero sale del cajón.", "error"); return; }
    const actionId = `w${kind === "cancel" ? "can" : "ret"}-${crypto.randomUUID()}`;
    await invoke("web_order_action_record", {
      input: {
        actionId, outboxId: crypto.randomUUID(), kind, orderId: o.id, orderNumber: o.number, reason,
        lines: chosen, refunds, shiftId: shift?.shiftId ?? null,
        staffId: staffId ?? null, staffName: staffId ? personName(staffId) : null, occurredAt: new Date().toISOString(),
      },
    });
    say(kind === "cancel"
      ? `Pedido #${o.number}: cancelación guardada. Se envía a la web ahora.`
      : `Pedido #${o.number}: devolución guardada${cash ? " y el efectivo salió del cajón (pendiente de Lennys)" : ""}. Se envía a la web ahora.`);
    window.dispatchEvent(new Event("nexo:shift-changed"));
    await sendQueuedActions();
    current = null;
    root!.querySelector<HTMLElement>("[data-order]")!.innerHTML = "";
  } catch (e) {
    say(String(e instanceof Error ? e.message : e), "error");
  } finally {
    busy = false;
  }
}

async function renderRecent() {
  const box = root?.querySelector<HTMLElement>("[data-recent]");
  if (!box) return;
  const recent = await invoke<Action[]>("web_order_action_recent", { limit: 10 }).catch(() => [] as Action[]);
  box.innerHTML = recent.length
    ? `<p class="t-sm muted">Hechas en este teléfono</p>${recent.map(a => {
        const back = [a.refundUsdMinor ? money(a.refundUsdMinor, "USD") : "", a.refundCupMinor ? money(a.refundCupMinor, "CUP") : ""].filter(Boolean).join(" + ");
        const state = a.status === "done" ? "✓ en la web" : a.status === "refused" ? `no aceptada: ${a.coreMessage ?? ""}` : `por enviar${a.lastError ? ` (${a.lastError})` : ""}`;
        return `<div class="t-sm">#${esc(a.orderNumber)} · ${a.kind === "cancel" ? "cancelado" : `devolución${a.productsText ? ` ${esc(a.productsText)}` : ""}${back ? ` · ${back}` : ""}`} · ${esc(a.reason)} · ${esc(state)}</div>`;
      }).join("")}`
    : "";
}

