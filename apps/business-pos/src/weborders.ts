// «Pedidos web» (20-oct): las dependientas cobran en el mostrador los pedidos de las
// gestoras: recogida «Listo para recoger» y a domicilio con el efectivo que trae el mensajero.
//
// No es una venta de la caja (la web ya descontó las existencias y la comisión de la gestora
// vive en la web): el efectivo entra al cajón como «pedido web» y la web cierra el pedido
// («Dinero recibido») firmado por la dependienta de «Atiende». Sin internet el cobro queda
// guardado y se envía solo. Si el pedido ya estaba cobrado en Ventas, la caja lo saca del
// cajón y avisa (nunca se cuenta dos veces). Los productos de proveedor (MK-) salen aquí.
import { invoke } from "@tauri-apps/api/core";
import { attribution, personName, setStaff, staffSelectHtml, staffList } from "./attribution";
import { openCheckout, type PaymentInput } from "./checkout";
import { deviceCall, deviceToken, onEverySync } from "./sync";
import { escapeHtml, icon } from "./ui";

type WebOrder = {
  id: number;
  number: string;
  date: string;
  kind: "pickup" | "delivery";
  statusLabel: string;
  customer: string;
  phone: string;
  gestora: string;
  messenger: string;
  totalUsd: number;
  payment: { kind: string; label: string; currency: string; amount: number | null; factor: number | null; prepaid: boolean; text: string } | null;
  prepaid: boolean;
  declaredUsd: string;
  declaredCup: string;
  products: Array<{ name: string; qty: number; sku: string }>;
  supplier: boolean;
  test: boolean;
};
type Charge = {
  chargeId: string;
  orderId: number;
  orderNumber: string;
  shiftId: string;
  method: string;
  usdMinor: number;
  cupMinor: number;
  cashUsdMinor: number;
  cashCupMinor: number;
  reference: string | null;
  note: string | null;
  staffId: string | null;
  staffName: string | null;
  status: "queued" | "done" | "refused";
  attempts: number;
  lastError: string | null;
  coreMessage: string | null;
  createdAt: string;
};

const say = (message: string, tone: "ok" | "error" = "ok") =>
  window.dispatchEvent(new CustomEvent("nexo:say", { detail: { message, tone } }));
const usd = (n: number) => `${n.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
const minor = (m: number, c: string) => `${(m / 100).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;

let root: HTMLElement | null = null;
let orders: WebOrder[] = [];
let loadedAt: string | null = null;
let loadError = "";
let sending = false;

/** Sends every queued charge to the web. Runs after each sync and right after a charge. */
export async function sendQueued(): Promise<void> {
  if (sending || !navigator.onLine || !deviceToken()) return;
  sending = true;
  try {
    const queued = await invoke<Charge[]>("web_order_queued");
    for (const c of queued) {
      try {
        const out = await deviceCall<{ ok: boolean; message?: string; signedBy?: string }>("nexo-device-web-orders", {
          action: "charge",
          orderId: c.orderId,
          chargeId: c.chargeId,
          staffId: c.staffId,
          collectionMethod: c.method,
          collectedUsd: c.usdMinor / 100,
          collectedCup: c.cupMinor / 100,
          collectionReference: c.reference ?? "",
          collectionNote: c.note ?? "",
        });
        await invoke("web_order_mark_done", { chargeId: c.chargeId, message: out.message ?? null, now: new Date().toISOString() });
        say(`✓ Pedido #${c.orderNumber} cerrado en la web`);
      } catch (e) {
        const err = e as Error & { status?: number; code?: string };
        if (err.status === 409 && (err.code === "already_charged" || err.code === "not_chargeable")) {
          const r = await invoke<{ corrected: boolean }>("web_order_mark_refused", {
            chargeId: c.chargeId, message: err.message, now: new Date().toISOString(), outboxPrefix: crypto.randomUUID(),
          });
          say(`Pedido #${c.orderNumber}: ${err.message} ${r.corrected ? "Se sacó ese dinero de la cuenta del cajón." : "Revisa el cajón: ese dinero no se pudo sacar de la cuenta."} Si el cliente pagó dos veces, devuélvele el dinero.`, "error");
        } else {
          await invoke("web_order_mark_failure", { chargeId: c.chargeId, error: err.message ?? String(e) });
        }
      }
    }
  } finally {
    sending = false;
    if (root) void render();
  }
}
onEverySync(sendQueued);

async function load() {
  if (!navigator.onLine || !deviceToken()) {
    loadError = !deviceToken() ? "Este teléfono no está conectado (Más → Sincronización)." : "Sin internet: la lista de pedidos necesita internet. Los cobros ya hechos se envían solos al volver la red.";
    return render();
  }
  loadError = "";
  if (root) root.querySelector<HTMLElement>("[data-list]")!.innerHTML = `<p class="t-sm muted">Cargando pedidos de la web…</p>`;
  try {
    const r = await deviceCall<{ orders: WebOrder[]; generatedAt: string }>("nexo-device-web-orders", { action: "list" });
    orders = Array.isArray(r.orders) ? r.orders : [];
    loadedAt = r.generatedAt;
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }
  await render();
}

function orderCard(o: WebOrder, local: Charge | undefined) {
  const items = o.products.map(p => `${p.qty > 1 ? `${p.qty}× ` : ""}${escapeHtml(p.name)}`).join(", ");
  const badges = [
    o.kind === "pickup" ? `<span class="badge badge-info">Recogida en tienda</span>` : `<span class="badge badge-low">${escapeHtml(o.statusLabel)}</span>`,
    o.supplier ? `<span class="badge">Proveedor (MK)</span>` : "",
    o.test ? `<span class="badge badge-out">PRUEBA</span>` : "",
    o.prepaid ? `<span class="badge badge-ok">Pagado por adelantado</span>` : "",
  ].join(" ");
  const who = [o.gestora ? `Gestora: ${escapeHtml(o.gestora)}` : "Venta directa", o.messenger ? `Mensajero: ${escapeHtml(o.messenger)}` : ""].filter(Boolean).join(" · ");
  const declared = o.declaredUsd || o.declaredCup ? `<div class="t-xs muted">El mensajero dijo que trae: ${[o.declaredUsd && `${escapeHtml(o.declaredUsd)} USD`, o.declaredCup && `${escapeHtml(o.declaredCup)} CUP`].filter(Boolean).join(" + ")}</div>` : "";
  const state = local
    ? `<span class="badge ${local.status === "done" ? "badge-ok" : local.status === "refused" ? "badge-out" : "badge-info"}">${local.status === "done" ? "Cobrado aquí" : local.status === "refused" ? "Ya estaba cobrado" : "Cobrado · enviando"}</span>`
    : `<button type="button" class="btn btn-primary" data-charge="${o.id}">${icon("cash", "sm")}Cobrar</button>`;
  return `<div class="panel" style="gap: 6px">
    <div class="kv"><span style="font-weight: 700">#${escapeHtml(o.number)} · ${escapeHtml(o.customer || "Cliente")}</span><span class="num" style="font-weight: 700">${usd(o.totalUsd)}</span></div>
    <div>${badges}</div>
    <div class="t-sm">${items}</div>
    <div class="t-xs muted">${who}</div>
    ${o.payment?.text ? `<div class="t-xs">Cómo paga: ${escapeHtml(o.payment.text)}</div>` : ""}
    ${declared}
    <div style="display: flex; justify-content: flex-end">${state}</div>
  </div>`;
}

async function render() {
  if (!root) return;
  const recent = await invoke<Charge[]>("web_order_recent", { limit: 30 }).catch(() => [] as Charge[]);
  const byOrder = new Map(recent.map(c => [c.orderId, c]));
  const queued = recent.filter(c => c.status === "queued");
  const list = root.querySelector<HTMLElement>("[data-list]")!;
  list.innerHTML = loadError
    ? `<div class="notice warn">${icon("alert")}<div><b>No se pudo cargar</b>${escapeHtml(loadError)}</div></div>`
    : orders.length
      ? orders.map(o => orderCard(o, byOrder.get(o.id))).join("")
      : `<p class="t-sm muted">${loadedAt ? "No hay pedidos web para cobrar ahora." : "Toca «Actualizar» para ver los pedidos."}</p>`;
  list.querySelectorAll<HTMLButtonElement>("[data-charge]").forEach(b => (b.onclick = () => void charge(Number(b.dataset.charge))));
  root.querySelector<HTMLElement>("[data-recent]")!.innerHTML = recent.length
    ? `${queued.length ? `<p class="t-sm"><b>${queued.length}</b> cobro(s) guardado(s) esperando internet para cerrarse en la web.</p>` : ""}
       ${recent.map(c => `<div class="kv t-sm"><span>#${escapeHtml(c.orderNumber)} · ${escapeHtml(new Date(c.createdAt).toLocaleString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }))}${c.staffName ? ` · ${escapeHtml(c.staffName)}` : ""}</span>
         <span>${[c.usdMinor && minor(c.usdMinor, "USD"), c.cupMinor && minor(c.cupMinor, "CUP")].filter(Boolean).join(" + ")} · ${c.status === "done" ? "✓ en la web" : c.status === "refused" ? "ya estaba cobrado" : "por enviar"}</span></div>`).join("")}`
    : `<p class="t-sm muted">Aún no cobraste pedidos web en este teléfono.</p>`;
  root.querySelector<HTMLElement>("[data-when]")!.textContent = loadedAt ? `Lista de las ${new Date(loadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "";
}

/** Asks who serves when «Atiende» is empty (the money is signed with her name). */
function askStaff(): Promise<string | null> {
  if (attribution.staffId || !staffList().length) return Promise.resolve(attribution.staffId);
  return new Promise(resolve => {
    const box = document.createElement("form");
    box.className = "panel nx-form";
    box.innerHTML = `${staffSelectHtml("staff", "¿Quién cobra?")}<button class="btn btn-primary btn-block">Seguir</button>`;
    root?.prepend(box);
    box.onsubmit = e => {
      e.preventDefault();
      const v = box.querySelector<HTMLSelectElement>("select")!.value;
      if (!v) return;
      setStaff(v);
      box.remove();
      resolve(v);
    };
  });
}

let charging = false;
async function charge(orderId: number) {
  const order = orders.find(o => o.id === orderId);
  if (!order || charging) return;
  charging = true;
  try {
    const shift = await invoke<{ shiftId: string } | null>("cash_shift_current");
    if (!shift) {
      say("Primero abre el turno (o únete al de tu compañera) en Caja: el dinero va al cajón.", "error");
      return;
    }
    const staffId = await askStaff();
    const totalMinor = Math.round(order.totalUsd * 100);
    const overrides: Record<string, string> = {};
    if (order.payment?.factor && order.payment.currency === "CUP") overrides.CUP = String(order.payment.factor);
    const payments: PaymentInput[] | null = await openCheckout(totalMinor, {
      title: `Cobrar pedido #${order.number}`,
      hint: order.prepaid ? "Pagado por adelantado (Zelle/PayPal): cobra solo lo que falte." : order.payment?.text ?? "",
      confirmLabel: "Confirmar cobro",
      rateOverrides: overrides,
    });
    if (!payments) return;
    await invoke("web_order_charge", {
      input: {
        chargeId: crypto.randomUUID(),
        outboxId: crypto.randomUUID(),
        shiftId: shift.shiftId,
        orderId: order.id,
        orderNumber: order.number,
        payments: payments.map(p => ({ method: p.method, currency: p.currency, amountMinor: p.amountMinor, externalRef: p.externalRef, provider: p.provider })),
        staffId,
        staffName: personName(staffId),
        note: null,
        occurredAt: new Date().toISOString(),
      },
    });
    say(`✓ Cobrado el pedido #${order.number}. ${navigator.onLine ? "Cerrándolo en la web…" : "Sin internet: se cierra en la web al volver la red."}`);
    await render();
    await sendQueued();
  } catch (e) {
    say(`Pedido #${order.number}: ${e instanceof Error ? e.message : String(e)}`, "error");
  } finally {
    charging = false;
  }
}

export function mountWebOrders(container: HTMLElement) {
  root = container;
  container.innerHTML = `
    <p class="t-sm muted">Pedidos de las gestoras para cobrar aquí: los de recogida y los que trae el mensajero. El dinero entra al cajón; la web cierra el pedido con tu nombre.</p>
    <div class="kv"><button type="button" class="btn btn-secondary" data-reload>${icon("cloud", "sm")}Actualizar</button><span class="t-xs muted" data-when></span></div>
    <div class="stack" data-list></div>
    <details class="panel"><summary>Cobrados en este teléfono</summary><div data-recent></div></details>`;
  container.querySelector<HTMLButtonElement>("[data-reload]")!.onclick = () => void load();
  void render();
}

/** Called when the tab is shown. */
export function refreshWebOrders() {
  void load();
  void sendQueued();
}
