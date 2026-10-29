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
import { markups } from "./store-info";
import { deviceCall, deviceToken, keyRejected, onEverySync } from "./sync";
import { escapeHtml, icon, openSheet } from "./ui";
import { chargeNote, orderRates, rateLine, rateOverrides, searchOrders, transferFrom, type OrderRates } from "./weborder-logic";

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
  products: Array<{ name: string; qty: number; sku: string; image?: string }>;
  /** Tasa CUP del día del pedido (Core 3.14.46): efectivo y transferencia por 1 USD, y el día («18-oct»). */
  cupRate?: number | null;
  cupTransferRate?: number | null;
  cupRateDay?: string;
  /** Recogida: true = ya pulsaron «Listo» en la web (Core 3.14.44). */
  prepared?: boolean;
  supplier: boolean;
  test: boolean;
  /** false = aún no se cobra (sale en la lista para darle el vuelto al mensajero). */
  chargeable?: boolean;
  /** Vuelto que lleva el mensajero (Lennys 20-oct). */
  change?: Array<{ amount: number; currency: string }>;
  /** Reserva de la recogida (Core 3.14.72, Pilar 3): «Kay pidió guardarlo hasta mañana». active = vigente; expired = ya venció. */
  reserva?: { until: string; untilLabel: string; by: string; note: string; active: boolean; expired: boolean; text: string } | null;
};
type Street = Array<[string, number]>;
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
  collectionAccount?: string | null;
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
let query = "";

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
          collectionAccount: c.collectionAccount ?? "",
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
    loadError = !deviceToken() ? "Este equipo no está conectado: Más → Sincronización → escribe el código de alta." : "Sin internet: la lista de pedidos necesita internet. Los cobros ya hechos se envían solos al volver la red.";
    return render();
  }
  loadError = "";
  if (root) root.querySelector<HTMLElement>("[data-list]")!.innerHTML = `<p class="t-sm muted">Cargando pedidos de la web…</p>`;
  try {
    const r = await deviceCall<{ orders: WebOrder[]; generatedAt: string }>("nexo-device-web-orders", { action: "list" });
    orders = Array.isArray(r.orders) ? r.orders : [];
    loadedAt = r.generatedAt;
  } catch (e) {
    const err = e as Error & { status?: number };
    loadError = err.status === 401 || keyRejected()
      ? "La clave de este equipo ya no vale (está desactivada). Ve a Más → Sincronización → «Conectar con otro código» y escribe el código de alta que te da Lennys."
      : err instanceof Error ? err.message : String(e);
  }
  await render();
}

/** Miniatura del producto (150 px de la web; el navegador la guarda en caché). Sin foto: un cuadro gris. */
const photo = (p: { name: string; image?: string }) => /^https:\/\//.test(p.image ?? "")
  ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" width="56" height="56" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; flex: none; background: var(--nx-surface-2, #eee)" onerror="this.style.visibility='hidden'">`
  : `<span aria-hidden="true" style="width: 56px; height: 56px; border-radius: 8px; flex: none; background: var(--nx-surface-2, #eee)"></span>`;

const changeText = (list: Array<{ amount: number; currency: string }> | undefined) =>
  (list ?? []).filter(c => c.amount > 0).map(c => `${c.amount.toLocaleString("es")} ${c.currency}`).join(" + ");

/** Pilar 3 (caso #5551): la reserva en rojo arriba de la tarjeta; ámbar si ya venció. Sin reserva, nada. */
function reservaBanner(o: WebOrder) {
  const r = o.reserva;
  if (!r || o.kind !== "pickup" || !r.text) return "";
  if (r.active) {
    return `<div role="alert" style="background: #b3261e; color: #fff; border-radius: 10px; padding: 10px 12px; font-weight: 800; line-height: 1.35">⛔ ${escapeHtml(r.text)}${r.note ? `<div style="font-weight: 600; font-size: .85em">${escapeHtml(r.note)}</div>` : ""}<div style="font-weight: 600; font-size: .8em">No lo canceles ni se lo des a otra persona.</div></div>`;
  }
  return r.expired
    ? `<div role="note" style="background: #fff3d6; border: 1px solid #e0b24a; color: #6a4300; border-radius: 10px; padding: 10px 12px; font-weight: 700">⏰ ${escapeHtml(r.text)}<div style="font-weight: 600; font-size: .85em">Pregunta si el cliente viene.</div></div>`
    : "";
}

function orderCard(o: WebOrder, local: Charge | undefined, street: Street) {
  const inStreet = street.filter(([, m]) => m > 0);
  const items = o.products.map(p => `<div style="display: flex; align-items: center; gap: 8px">${photo(p)}<span>${p.qty > 1 ? `<b>${p.qty}×</b> ` : ""}${escapeHtml(p.name)}</span></div>`).join("");
  const ready = o.kind === "pickup" && o.prepared !== false && /listo/i.test(o.statusLabel);
  const badges = [
    o.kind === "pickup"
      ? `<span class="badge ${ready ? "badge-ok" : "badge-low"}">${escapeHtml(o.statusLabel || "Recogida en tienda")}</span>`
      : `<span class="badge badge-low">${escapeHtml(o.statusLabel)}</span>`,
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
    ${reservaBanner(o)}
    <div class="kv"><span style="font-weight: 700">#${escapeHtml(o.number)} · ${escapeHtml(o.customer || "Cliente")}</span><span class="num" style="font-weight: 700">${usd(o.totalUsd)}</span></div>
    <div>${badges}</div>
    <div class="t-sm" style="display: grid; gap: 4px">${items}</div>
    ${o.cupRate ? `<div class="t-xs muted">Tasa del pedido: ${o.cupRate.toLocaleString("es")}${o.cupRateDay ? ` (${escapeHtml(o.cupRateDay)})` : ""}</div>` : ""}
    <div class="t-xs muted">${who}</div>
    ${o.payment?.text ? `<div class="t-xs">Cómo paga: ${escapeHtml(o.payment.text)}</div>` : ""}
    ${declared}
    ${o.kind !== "pickup" ? `<div class="t-xs">Vuelto que lleva: <b>${escapeHtml(changeText(o.change) || "sin vuelto")}</b>${inStreet.length ? ` · en la calle (del fondo): <b>${inStreet.map(([c, m]) => minor(m, c)).join(" + ")}</b>` : ""}</div>` : ""}
    <div style="display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap">
      ${o.kind !== "pickup" && !local ? `<button type="button" class="btn btn-secondary" data-vuelto="${o.id}">Vuelto</button>` : ""}
      ${inStreet.length && !local ? `<button type="button" class="btn btn-secondary" data-vuelto-back="${o.id}">Devolvió el vuelto</button>` : ""}
      ${o.chargeable === false ? `<span class="badge">Aún no se cobra</span>` : state}
    </div>
  </div>`;
}

async function render() {
  if (!root) return;
  const recent = await invoke<Charge[]>("web_order_recent", { limit: 30 }).catch(() => [] as Charge[]);
  const byOrder = new Map(recent.map(c => [c.orderId, c]));
  const queued = recent.filter(c => c.status === "queued");
  const list = root.querySelector<HTMLElement>("[data-list]")!;
  const streets = new Map<number, Street>();
  for (const o of orders) {
    if (o.kind === "pickup") continue;
    streets.set(o.id, await invoke<Street>("web_order_vuelto_outstanding", { orderId: o.id }).catch(() => []));
  }
  // Pilar 3: las recogidas con reserva vigente van arriba (la tienda no las puede perder de vista).
  const shown = searchOrders(orders, query).map((o, i) => ({ o, i })).sort((a, b) => Number(!!b.o.reserva?.active) - Number(!!a.o.reserva?.active) || a.i - b.i).map(x => x.o);
  list.innerHTML = loadError
    ? `<div class="notice warn">${icon("alert")}<div><b>No se pudo cargar</b>${escapeHtml(loadError)}</div></div>`
    : shown.length
      ? shown.map(o => orderCard(o, byOrder.get(o.id), streets.get(o.id) ?? [])).join("")
      : orders.length
        ? `<p class="t-sm muted">Ningún pedido con «${escapeHtml(query)}». Prueba con el número (#4243), el nombre o el teléfono.</p>`
        : `<p class="t-sm muted">${loadedAt ? "No hay pedidos web para cobrar ahora." : "Toca «Actualizar» para ver los pedidos."}</p>`;
  list.querySelectorAll<HTMLButtonElement>("[data-charge]").forEach(b => (b.onclick = () => void charge(Number(b.dataset.charge))));
  list.querySelectorAll<HTMLButtonElement>("[data-vuelto]").forEach(b => (b.onclick = () => void vueltoSheet(Number(b.dataset.vuelto))));
  list.querySelectorAll<HTMLButtonElement>("[data-vuelto-back]").forEach(b => (b.onclick = () => void vueltoBack(Number(b.dataset.vueltoBack), streets.get(Number(b.dataset.vueltoBack)) ?? [])));
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
  if (!order || charging || order.chargeable === false) return;
  charging = true;
  try {
    const shift = await invoke<{ shiftId: string } | null>("cash_shift_current");
    if (!shift) {
      say("Primero abre el turno (o únete al de tu compañera) en Caja: el dinero va al cajón.", "error");
      return;
    }
    const staffId = await askStaff();
    const totalMinor = Math.round(order.totalUsd * 100);
    // Tasa del DÍA DEL PEDIDO para todo pago en CUP (efectivo o transferencia), nunca la de hoy (Lennys 21-oct).
    const pct = markups().transferPct;
    const fromOrder = orderRates(order, pct);
    let used: OrderRates | null = fromOrder;
    let reason = "";
    const payments: PaymentInput[] | null = await openCheckout(totalMinor, {
      title: `Cobrar pedido #${order.number}`,
      hint: [order.prepaid ? "Pagado por adelantado (Zelle/PayPal): cobra solo lo que falte." : order.payment?.text ?? "",
        (await invoke<Street>("web_order_vuelto_outstanding", { orderId: order.id }).catch(() => [] as Street)).filter(([, m]) => m > 0).length
          ? "Cobra solo el pedido: el vuelto que trae el mensajero vuelve solo al fondo." : ""].filter(Boolean).join(" · "),
      confirmLabel: "Confirmar cobro",
      rateOverrides: rateOverrides(fromOrder),
      orderRate: {
        line: fromOrder ? rateLine(fromOrder) : "Este pedido no guardó su tasa: se usa la de hoy.",
        change: (cash, why) => {
          used = { cash, transfer: transferFrom(cash, pct), day: "" };
          reason = why;
          return { overrides: rateOverrides(used), line: `${rateLine(used, true)} · motivo: ${why}` };
        },
      },
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
        // La tasa queda escrita si se cobró algo en CUP o si la cambiaron (con su motivo).
        note: (reason || payments.some(p => p.currency === "CUP") ? chargeNote(fromOrder, used, reason) : "") || null,
        occurredAt: new Date().toISOString(),
        collectionAccount: payments.find(p => p.accountId)?.accountId ?? null,
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

// ---------- Vueltos (Lennys 20-oct) ----------
// El vuelto que se lleva el mensajero sale del FONDO («vuelto en la calle»). Al cobrar el pedido (aquí
// o en Ventas) vuelve solo al fondo; no es venta. Si el pedido no se entrega, «Devolvió el vuelto».
// Lo de antes (Caja → Salida / Entrada a mano) sigue valiendo.

async function vueltoSheet(orderId: number) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  const shift = await invoke<{ shiftId: string } | null>("cash_shift_current");
  const now = order.change?.find(c => c.amount > 0);
  const sheet = openSheet(`
    <div class="sheet-head"><h2>Vuelto · pedido #${escapeHtml(order.number)}</h2><button type="button" class="btn btn-ghost" data-close>Cerrar</button></div>
    <form class="nx-form">
      <p class="t-sm">Ahora en el pedido: <b>${escapeHtml(changeText(order.change) || "sin vuelto")}</b>${order.messenger ? ` · lo lleva ${escapeHtml(order.messenger)}` : ""}</p>
      <div class="grid-3">
        <label class="field">Importe<input class="input" name="amount" inputmode="decimal" placeholder="0,00" value="${now ? String(now.amount) : ""}" style="font-size: var(--nx-fs-xl); font-weight: 700"></label>
        <label class="field">Moneda<select class="input" name="currency">${["USD", "CUP"].map(c => `<option${(now?.currency ?? "USD") === c ? " selected" : ""}>${c}</option>`).join("")}</select></label>
      </div>
      <p class="t-xs muted">Sale del fondo de la caja y vuelve cuando se cobra el pedido. No es venta.</p>
      <button type="submit" class="btn btn-primary btn-xl btn-block" data-give>Darle el vuelto del fondo</button>
      <button type="button" class="btn btn-secondary btn-block" data-only>Solo cambiar el vuelto en el pedido (aún no se lo lleva)</button>
      <p class="t-sm" data-msg style="color: var(--nx-danger); font-weight: 700"></p>
    </form>`, "Vuelto");
  sheet.el.querySelector<HTMLButtonElement>("[data-close]")!.onclick = sheet.close;
  const form = sheet.el.querySelector<HTMLFormElement>("form")!;
  const msg = sheet.el.querySelector<HTMLElement>("[data-msg]")!;
  const read = () => {
    const amount = Number(form.querySelector<HTMLInputElement>("[name=amount]")!.value.replace(",", "."));
    const currency = form.querySelector<HTMLSelectElement>("[name=currency]")!.value;
    return { amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0, currency };
  };
  /** Avisa a la web (Ventas y el vale del mensajero). Sin internet no se puede: se dice claro. */
  const saveInOrder = async (amount: number, currency: string) => {
    if (!navigator.onLine) return "Sin internet: el vuelto NO se cambió en la web; avísale al mensajero y cámbialo luego en Ventas.";
    try {
      const out = await deviceCall<{ message?: string }>("nexo-device-web-orders", {
        action: "change", orderId: order.id, staffId: attribution.staffId, changeRequired: amount > 0 ? [{ amount, currency }] : [],
      });
      order.change = amount > 0 ? [{ amount, currency }] : [];
      return out.message ?? "Vuelto guardado en el pedido.";
    } catch (e) {
      return `La web no guardó el vuelto: ${e instanceof Error ? e.message : String(e)}`;
    }
  };
  sheet.el.querySelector<HTMLButtonElement>("[data-only]")!.onclick = () => void (async () => {
    const { amount, currency } = read();
    const text = await saveInOrder(amount, currency);
    sheet.close();
    say(text, text.startsWith("Sin internet") || text.startsWith("La web no") ? "error" : "ok");
    await render();
  })();
  form.onsubmit = e => {
    e.preventDefault();
    void (async () => {
      const { amount, currency } = read();
      if (!amount) return void (msg.textContent = "Escribe cuánto vuelto se lleva.");
      if (!shift) return void (msg.textContent = "Primero abre el turno (o únete) en Caja: el vuelto sale del cajón.");
      try {
        await invoke("web_order_vuelto", {
          out: true,
          input: {
            movementId: crypto.randomUUID(), outboxId: crypto.randomUUID(), shiftId: shift.shiftId, orderId: order.id, orderNumber: order.number,
            messenger: order.messenger || null, currency, amountMinor: Math.round(amount * 100), staffId: attribution.staffId, occurredAt: new Date().toISOString(),
          },
        });
      } catch (err) {
        return void (msg.textContent = String(err));
      }
      const same = order.change?.some(c => c.currency === currency && Math.abs(c.amount - amount) < 0.005);
      const text = same ? "" : await saveInOrder(amount, currency);
      sheet.close();
      say(`✓ Vuelto ${minor(Math.round(amount * 100), currency)} en la calle (pedido #${order.number}). Vuelve al cajón al cobrar el pedido. ${text}`.trim(), text.startsWith("Sin internet") || text.startsWith("La web no") ? "error" : "ok");
      window.dispatchEvent(new Event("nexo:shift-changed"));
      await render();
    })();
  };
}

/** El mensajero devolvió el vuelto sin cobrar el pedido (no se entregó, el cliente pagó exacto…). */
async function vueltoBack(orderId: number, street: Street) {
  const order = orders.find(o => o.id === orderId);
  const shift = await invoke<{ shiftId: string } | null>("cash_shift_current");
  if (!order || !shift) return say("Primero abre el turno (o únete) en Caja.", "error");
  const parts = street.filter(([, m]) => m > 0);
  if (!confirm(`¿El mensajero devolvió ${parts.map(([c, m]) => minor(m, c)).join(" + ")} del pedido #${order.number}? Vuelve al fondo.`)) return;
  try {
    for (const [currency, amountMinor] of parts) {
      await invoke("web_order_vuelto", {
        out: false,
        input: { movementId: crypto.randomUUID(), outboxId: crypto.randomUUID(), shiftId: shift.shiftId, orderId: order.id, orderNumber: order.number,
          messenger: order.messenger || null, currency, amountMinor, staffId: attribution.staffId, occurredAt: new Date().toISOString() },
      });
    }
    say(`✓ Vuelto devuelto al fondo (pedido #${order.number})`);
    window.dispatchEvent(new Event("nexo:shift-changed"));
    await render();
  } catch (e) {
    say(String(e), "error");
  }
}

export function mountWebOrders(container: HTMLElement) {
  root = container;
  container.innerHTML = `
    <p class="t-sm muted">Pedidos de las gestoras para cobrar aquí: los de recogida y los que trae el mensajero. El dinero entra al cajón; la web cierra el pedido con tu nombre.</p>
    <div class="kv"><button type="button" class="btn btn-secondary" data-reload>${icon("cloud", "sm")}Actualizar</button><span class="t-xs muted" data-when></span></div>
    <input class="input" type="search" data-search autocomplete="off" placeholder="Buscar: #número, nombre o teléfono" aria-label="Buscar pedido" style="font-size: var(--nx-fs-lg)">
    <div class="stack" data-list></div>
    <details class="panel"><summary>Cobrados en este teléfono</summary><div data-recent></div></details>`;
  container.querySelector<HTMLButtonElement>("[data-reload]")!.onclick = () => void load();
  const search = container.querySelector<HTMLInputElement>("[data-search]")!;
  search.value = query;
  search.oninput = () => {
    query = search.value;
    void render();
  };
  void render();
}

/** Called when the tab is shown. */
export function refreshWebOrders() {
  void load();
  void sendQueued();
}
