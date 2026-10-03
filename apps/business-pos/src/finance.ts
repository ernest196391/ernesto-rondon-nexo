// Operations panel for the reusable financial core: cash shift, fiado,
// messenger cash, returns and locations. Every write goes through the Rust
// commands (atomic, idempotent, outbox in the same transaction); this module
// only collects input and renders summaries.
import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import "./finance.css";
import { mountBusinessSummary, mountSync, requestSync } from "./sync";

const CURRENCIES = ["USD", "CUP", "MLC"] as const;
const RAILS: Array<[string, string]> = [
  ["cash", "Efectivo"],
  ["transfer", "Transferencia"],
  ["card", "Tarjeta"],
  ["digital_asset", "Activo digital"],
  ["other", "Otro"],
];

type CurrencySummary = {
  currency: string;
  openingFloatMinor: number;
  salesCashMinor: number;
  otherInMinor: number;
  otherOutMinor: number;
  expectedMinor: number;
};
type CountResult = { currency: string; expectedMinor: number; countedMinor: number; differenceMinor: number };
type ShiftSummary = {
  shiftId: string;
  status: string;
  primaryCurrency: string;
  openedAt: string;
  currencies: CurrencySummary[];
  counts: CountResult[];
};
type ReceivableBalance = {
  receivableId: string;
  customerId: string;
  currency: string;
  originalMinor: number;
  paidMinor: number;
  writtenOffMinor: number;
  balanceMinor: number;
  status: string;
  dueAt: string | null;
};
type CustodyBalance = { messengerId: string; currency: string; collectedMinor: number; outstandingMinor: number };
type ReturnableLine = { saleLineId: string; productId: string; soldQuantity: number; returnedQuantity: number };
type SaleReturnSummary = { saleId: string; currency: string; totalMinor: number; refundedMinor: number; lines: ReturnableLine[] };
type Location = { locationId: string; name: string; kind: string; isDefault: boolean; active: boolean };
type StockLine = { productId: string; quantity: number };

let db: Database;
let root: HTMLElement;
let productNames = new Map<string, string>();

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const fmt = (minor: number, currency: string) => `${(minor / 100).toFixed(2)} ${currency}`;

function toMinor(raw: string): number {
  const value = Number(raw.replace(",", ".").trim());
  if (!Number.isFinite(value) || value < 0) throw new Error("Importe inválido");
  return Math.round(value * 100);
}

function field<T extends HTMLElement = HTMLInputElement>(scope: ParentNode, name: string): T {
  return scope.querySelector<T>(`[name="${name}"]`)!;
}

function currencyOptions(selected = "USD") {
  return CURRENCIES.map(c => `<option${c === selected ? " selected" : ""}>${c}</option>`).join("");
}

function railOptions() {
  return RAILS.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
}

/** Result of an operation: shown as a toast by the app shell. */
function say(message: string, tone: "ok" | "error" = "ok") {
  window.dispatchEvent(new CustomEvent("nexo:say", { detail: { message, tone } }));
}

async function run(label: string, action: () => Promise<void>) {
  try {
    await action();
    say(`✓ ${label}`);
  } catch (e) {
    say(`${label}: ${String(e)}`, "error");
  }
}

// ---------- Cash shift ----------

async function renderShift() {
  const box = root.querySelector<HTMLElement>("#fin-shift")!;
  const shift = await invoke<ShiftSummary | null>("cash_shift_current");

  if (!shift) {
    box.innerHTML = `
      <p class="fin-muted">No hay turno abierto en este dispositivo. Las ventas se guardan igual, pero no entran en ningún cajón.</p>
      <form id="fin-open" class="fin-form">
        <label>Moneda principal<select name="primary">${currencyOptions()}</select></label>
        ${CURRENCIES.map(c => `<label>Fondo inicial ${c}<input name="float-${c}" inputmode="decimal" placeholder="0.00"></label>`).join("")}
        <button type="submit">Abrir turno</button>
      </form>`;
    box.querySelector<HTMLFormElement>("#fin-open")!.onsubmit = e => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      void run("Turno abierto", async () => {
        const openingFloats = CURRENCIES.flatMap(c => {
          const raw = field(form, `float-${c}`).value;
          return raw.trim() ? [{ movementId: id(), currency: c, amountMinor: toMinor(raw) }] : [];
        });
        await invoke("cash_shift_open", {
          input: {
            shiftId: id(),
            outboxId: id(),
            operatorId: null,
            primaryCurrency: field<HTMLSelectElement>(form, "primary").value,
            openingFloats,
            openedAt: now(),
          },
        });
        await renderShift();
      });
    };
    return;
  }

  const rows = shift.currencies
    .map(
      c => `<tr><th>${esc(c.currency)}</th><td>${fmt(c.openingFloatMinor, c.currency)}</td><td>${fmt(c.salesCashMinor, c.currency)}</td>
        <td>${fmt(c.otherInMinor, c.currency)}</td><td>${fmt(c.otherOutMinor, c.currency)}</td><td><strong>${fmt(c.expectedMinor, c.currency)}</strong></td></tr>`,
    )
    .join("");
  box.innerHTML = `
    <p class="fin-muted">Turno abierto desde ${esc(new Date(shift.openedAt).toLocaleString())}</p>
    <div class="fin-table-wrap"><table class="fin-table">
      <thead><tr><th></th><th>Fondo</th><th>Ventas</th><th>Entradas</th><th>Salidas</th><th>Esperado</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <form id="fin-move" class="fin-form">
      <h4>Movimiento de caja</h4>
      <label>Tipo<select name="kind">
        <option value="cash_in">Entrada</option>
        <option value="cash_out">Salida</option>
        <option value="expense">Gasto</option>
      </select></label>
      <label>Moneda<select name="currency">${currencyOptions(shift.primaryCurrency)}</select></label>
      <label>Importe<input name="amount" inputmode="decimal" required placeholder="0.00"></label>
      <label>Motivo<input name="reason" required maxlength="280" placeholder="Obligatorio"></label>
      <label>Categoría (gastos)<input name="category" placeholder="transporte, mensajería…"></label>
      <button type="submit">Registrar</button>
    </form>
    <form id="fin-close" class="fin-form">
      <h4>Cerrar turno · contar el efectivo</h4>
      ${shift.currencies.map(c => `<label>Contado ${esc(c.currency)}<input name="count-${esc(c.currency)}" inputmode="decimal" required placeholder="0.00"></label>`).join("")}
      <label>Nota<input name="note" placeholder="Opcional"></label>
      <button type="submit" class="fin-danger">Cerrar turno</button>
    </form>`;

  box.querySelector<HTMLFormElement>("#fin-move")!.onsubmit = e => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    void run("Movimiento registrado", async () => {
      await invoke("cash_shift_record_movement", {
        input: {
          movementId: id(),
          outboxId: id(),
          shiftId: shift.shiftId,
          kind: field<HTMLSelectElement>(form, "kind").value,
          direction: null,
          currency: field<HTMLSelectElement>(form, "currency").value,
          amountMinor: toMinor(field(form, "amount").value),
          reason: field(form, "reason").value,
          category: field(form, "category").value || null,
          sourceType: null,
          sourceId: null,
          correctsMovementId: null,
          operatorId: null,
          occurredAt: now(),
        },
      });
      await renderShift();
    });
  };

  box.querySelector<HTMLFormElement>("#fin-close")!.onsubmit = e => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    void (async () => {
      try {
      const closed = await invoke<ShiftSummary>("cash_shift_close", {
        input: {
          shiftId: shift.shiftId,
          outboxId: id(),
          counts: shift.currencies.map(c => ({
            countId: id(),
            currency: c.currency,
            countedMinor: toMinor(field(form, `count-${c.currency}`).value),
          })),
          closedBy: null,
          note: field(form, "note").value || null,
          closedAt: now(),
        },
      });
      const lines = closed.counts
        .map(c => `${c.currency}: esperado ${fmt(c.expectedMinor, c.currency)} · contado ${fmt(c.countedMinor, c.currency)} · diferencia ${fmt(c.differenceMinor, c.currency)}`)
        .join(" | ");
      await renderShift();
      say(`✓ Turno cerrado · ${lines}`);
      } catch (err) {
        say(`Cierre de turno: ${String(err)}`, "error");
      }
    })();
  };
}

// ---------- Fiado / receivables ----------

async function renderReceivables(customerId: string) {
  const list = root.querySelector<HTMLElement>("#fin-debts")!;
  if (!customerId.trim()) {
    list.innerHTML = `<p class="fin-muted">Escribe el cliente para ver sus deudas.</p>`;
    return;
  }
  const debts = await invoke<ReceivableBalance[]>("receivables_for_customer", { customerId: customerId.trim() });
  if (!debts.length) {
    list.innerHTML = `<p class="fin-muted">Sin deudas abiertas.</p>`;
    return;
  }
  list.innerHTML = debts
    .map(
      d => `<form class="fin-card fin-form" data-id="${esc(d.receivableId)}">
        <div class="fin-row"><strong>${fmt(d.balanceMinor, d.currency)} pendiente</strong><span>de ${fmt(d.originalMinor, d.currency)}${d.dueAt ? ` · vence ${esc(d.dueAt)}` : ""}</span></div>
        <label>Abono<input name="amount" inputmode="decimal" required placeholder="0.00"></label>
        <label>Forma de pago<select name="rail">${railOptions()}</select></label>
        <button type="submit">Registrar abono</button>
      </form>`,
    )
    .join("");
  list.querySelectorAll<HTMLFormElement>("form").forEach(form => {
    form.onsubmit = e => {
      e.preventDefault();
      void run("Abono registrado", async () => {
        await invoke("receivable_record_payment", {
          input: {
            entryId: id(),
            outboxId: id(),
            receivableId: form.dataset.id,
            amountMinor: toMinor(field(form, "amount").value),
            rail: field<HTMLSelectElement>(form, "rail").value,
            cashMovementId: id(),
            occurredAt: now(),
          },
        });
        await renderReceivables(customerId);
        await renderShift();
      });
    };
  });
}

function mountReceivables() {
  const box = root.querySelector<HTMLElement>("#fin-fiado")!;
  box.innerHTML = `
    <form id="fin-debt" class="fin-form">
      <label>Cliente<input name="customer" required placeholder="Nombre o teléfono"></label>
      <label>Moneda<select name="currency">${currencyOptions()}</select></label>
      <label>Importe fiado<input name="amount" inputmode="decimal" required placeholder="0.00"></label>
      <label>Vence<input name="due" type="date"></label>
      <label>Nota<input name="note" placeholder="Qué se llevó"></label>
      <button type="submit">Anotar fiado</button>
    </form>
    <div id="fin-debts"></div>`;
  const form = box.querySelector<HTMLFormElement>("#fin-debt")!;
  const customer = field(form, "customer");
  customer.onchange = () => void renderReceivables(customer.value);
  form.onsubmit = e => {
    e.preventDefault();
    void run("Fiado anotado", async () => {
      const receivableId = id();
      await invoke("receivable_open", {
        input: {
          receivableId,
          outboxId: id(),
          customerId: customer.value.trim(),
          sourceSystem: "nexo",
          sourceType: "manual",
          sourceId: receivableId,
          currency: field<HTMLSelectElement>(form, "currency").value,
          amountMinor: toMinor(field(form, "amount").value),
          dueAt: field(form, "due").value || null,
          note: field(form, "note").value || null,
          operatorId: null,
          createdAt: now(),
        },
      });
      field(form, "amount").value = "";
      await renderReceivables(customer.value);
    });
  };
  void renderReceivables("");
}

// ---------- Messenger cash ----------

function mountMessenger() {
  const box = root.querySelector<HTMLElement>("#fin-messenger")!;
  box.innerHTML = `
    <form id="fin-courier" class="fin-form">
      <label>Mensajero<input name="messenger" required placeholder="Nombre"></label>
      <label>Pedido<input name="order" required placeholder="Número de pedido"></label>
      <label>Sistema del pedido<select name="system"><option value="woocommerce">Tienda online</option><option value="nexo">NEXO</option><option value="other">Otro</option></select></label>
      <label>Moneda<select name="currency">${currencyOptions()}</select></label>
      <label>Importe<input name="amount" inputmode="decimal" required placeholder="0.00"></label>
      <div class="fin-actions">
        <button type="button" data-act="collect">Cobró al cliente</button>
        <button type="button" data-act="return">Entregó en caja</button>
      </div>
    </form>
    <div id="fin-courier-balance" class="fin-muted"></div>`;
  const form = box.querySelector<HTMLFormElement>("#fin-courier")!;
  const read = () => ({
    messengerId: field(form, "messenger").value.trim(),
    source: { sourceSystem: field<HTMLSelectElement>(form, "system").value, sourceType: "order", sourceId: field(form, "order").value.trim() },
    currency: field<HTMLSelectElement>(form, "currency").value,
    amountMinor: toMinor(field(form, "amount").value),
  });
  const show = (balances: CustodyBalance[]) => {
    box.querySelector("#fin-courier-balance")!.textContent = balances.length
      ? "Pendiente de entregar: " + balances.map(b => fmt(b.outstandingMinor, b.currency)).join(" · ")
      : "";
  };
  form.querySelectorAll<HTMLButtonElement>("button[data-act]").forEach(button => {
    button.onclick = () => {
      if (!form.reportValidity()) return;
      const collect = button.dataset.act === "collect";
      void run(collect ? "Cobro del mensajero registrado" : "Entrega registrada en caja", async () => {
        const base = { entryId: id(), outboxId: id(), operatorId: null, occurredAt: now(), ...read() };
        const balances = collect
          ? await invoke<CustodyBalance[]>("messenger_custody_collect", { input: base })
          : await invoke<CustodyBalance[]>("messenger_custody_return", { input: { ...base, cashMovementId: id() } });
        show(balances);
        if (!collect) await renderShift();
      });
    };
  });
}

// ---------- Returns ----------

async function mountReturns() {
  const box = root.querySelector<HTMLElement>("#fin-returns")!;
  const sales = await db.select<Array<{ id: string; total_minor: number; currency: string; occurred_at: string }>>(
    "SELECT id,total_minor,currency,occurred_at FROM local_sales ORDER BY rowid DESC LIMIT 15",
  );
  box.innerHTML = `
    <label>Venta<select id="fin-sale"><option value="">Elige una venta reciente</option>${sales
      .map(s => `<option value="${esc(s.id)}">${esc(new Date(s.occurred_at).toLocaleString())} · ${fmt(s.total_minor, s.currency)}</option>`)
      .join("")}</select></label>
    <form id="fin-return" class="fin-form" hidden></form>`;
  const select = box.querySelector<HTMLSelectElement>("#fin-sale")!;
  select.onchange = () => void renderReturnForm(select.value);
}

async function renderReturnForm(saleId: string) {
  const form = root.querySelector<HTMLFormElement>("#fin-return")!;
  if (!saleId) {
    form.hidden = true;
    return;
  }
  const summary = await invoke<SaleReturnSummary>("sale_return_summary", { saleId });
  const left = summary.totalMinor - summary.refundedMinor;
  form.hidden = false;
  form.innerHTML = `
    ${summary.lines
      .map(l => {
        const max = l.soldQuantity - l.returnedQuantity;
        return `<label>${esc(productNames.get(l.productId) ?? l.productId)} · vendidos ${l.soldQuantity}, devueltos ${l.returnedQuantity}
          <input name="qty-${esc(l.saleLineId)}" type="number" min="0" max="${max}" value="0"${max ? "" : " disabled"}></label>`;
      })
      .join("")}
    <label>Reembolso (máx. ${fmt(left, summary.currency)})<input name="refund" inputmode="decimal" value="0"></label>
    <label>Forma de reembolso<select name="rail">${railOptions()}</select></label>
    <label>Motivo<input name="reason" required placeholder="Obligatorio"></label>
    <button type="submit">Registrar devolución</button>`;
  form.onsubmit = e => {
    e.preventDefault();
    void run("Devolución registrada", async () => {
      const refundMinor = toMinor(field(form, "refund").value || "0");
      const lines = summary.lines.flatMap(l => {
        const qty = Number(field(form, `qty-${l.saleLineId}`).value || 0);
        return qty > 0 ? [{ returnLineId: id(), saleLineId: l.saleLineId, quantity: qty, inventoryMovementId: id() }] : [];
      });
      await invoke("sale_return_record", {
        input: {
          returnId: id(),
          outboxId: id(),
          saleId,
          lines,
          refundMinor,
          refundRail: refundMinor > 0 ? field<HTMLSelectElement>(form, "rail").value : null,
          cashMovementId: id(),
          reason: field(form, "reason").value,
          operatorId: null,
          occurredAt: now(),
        },
      });
      await renderReturnForm(saleId);
      await renderShift();
    });
  };
}

// ---------- Locations ----------

async function renderLocations() {
  const box = root.querySelector<HTMLElement>("#fin-locations")!;
  const locations = await invoke<Location[]>("inventory_locations");
  const kinds: Array<[string, string]> = [
    ["store", "Tienda"],
    ["warehouse", "Almacén"],
    ["branch", "Sucursal"],
    ["transit", "Tránsito"],
    ["consignment", "Consignación"],
    ["damaged", "Dañado"],
  ];
  const first = locations.find(l => l.isDefault);
  let stock: StockLine[] = [];
  if (first) stock = await invoke<StockLine[]>("inventory_location_stock", { locationId: first.locationId });
  box.innerHTML = `
    ${locations.length
      ? `<ul class="fin-list">${locations.map(l => `<li><strong>${esc(l.name)}</strong> · ${esc(kinds.find(k => k[0] === l.kind)?.[1] ?? l.kind)}${l.isDefault ? " · principal" : ""}</li>`).join("")}</ul>`
      : `<p class="fin-muted">Aún no hay ubicaciones. La primera será la principal: las ventas descuentan stock de ella.</p>`}
    ${first ? `<p class="fin-muted">Stock en ${esc(first.name)}: ${stock.map(s => `${esc(productNames.get(s.productId) ?? s.productId)} ${s.quantity}`).join(" · ") || "sin movimientos"}</p>` : ""}
    <form id="fin-loc" class="fin-form">
      <label>Nombre<input name="name" required placeholder="${locations.length ? "Almacén" : "Tienda principal"}"></label>
      <label>Tipo<select name="kind">${kinds.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>
      <button type="submit">Crear ubicación</button>
    </form>
    ${locations.length ? `<form id="fin-count" class="fin-form">
      <h4>Conteo físico</h4>
      <p class="fin-muted">Cuenta lo que hay de verdad: el sistema ajusta la diferencia y la registra.</p>
      <label>Ubicación<select name="location">${locations.filter(l => l.active).map(l => `<option value="${esc(l.locationId)}"${l.isDefault ? " selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label>
      <label>Producto<select name="product">${[...productNames].map(([pid, name]) => `<option value="${esc(pid)}">${esc(name)}</option>`).join("")}</select></label>
      <label>Cantidad contada<input name="counted" type="number" min="0" step="1" required></label>
      <label>Motivo<input name="reason" required value="Conteo físico"></label>
      <button type="submit">Registrar conteo</button>
    </form>` : ""}`;
  const countForm = box.querySelector<HTMLFormElement>("#fin-count");
  if (countForm) {
    countForm.onsubmit = e => {
      e.preventDefault();
      void (async () => {
        try {
        const result = await invoke<{ expectedQuantity: number; countedQuantity: number; differenceQuantity: number }>("inventory_count", {
          input: {
            countId: id(),
            outboxId: id(),
            adjustmentMovementId: id(),
            locationId: field<HTMLSelectElement>(countForm, "location").value,
            productId: field<HTMLSelectElement>(countForm, "product").value,
            countedQuantity: Number(field(countForm, "counted").value),
            reason: field(countForm, "reason").value,
            operatorId: null,
            countedAt: now(),
          },
        });
        await renderLocations();
        say(`✓ Conteo: esperado ${result.expectedQuantity}, contado ${result.countedQuantity}, ajuste ${result.differenceQuantity > 0 ? "+" : ""}${result.differenceQuantity}`);
        requestSync();
        } catch (err) {
          say(`Conteo: ${String(err)}`, "error");
        }
      })();
    };
  }
  box.querySelector<HTMLFormElement>("#fin-loc")!.onsubmit = e => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    void run("Ubicación creada", async () => {
      await invoke("inventory_create_location", {
        input: {
          locationId: id(),
          outboxId: id(),
          name: field(form, "name").value,
          kind: field<HTMLSelectElement>(form, "kind").value,
          branchId: null,
          isDefault: locations.length === 0,
          authoritySystem: null,
          createdAt: now(),
        },
      });
      await renderLocations();
    });
  };
}

// ---------- Mount ----------

export async function refreshFinance() {
  if (!root) return;
  requestSync();
  await Promise.all([renderShift(), mountReturns()]).catch(e => say(String(e), "error"));
}

/**
 * Fills the sections the app shell placed anywhere inside `container`:
 * #fin-shift, #fin-fiado, #fin-messenger, #fin-returns, #fin-locations,
 * #fin-sync and #fin-summary.
 */
export async function mountFinance(container: HTMLElement, database: Database) {
  root = container;
  db = database;
  const names = await db.select<Array<{ id: string; name: string }>>("SELECT id,name FROM local_products");
  productNames = new Map(names.map(p => [p.id, p.name]));
  mountReceivables();
  mountMessenger();
  await Promise.all([renderShift(), mountReturns(), renderLocations(), mountSync(root.querySelector<HTMLElement>("#fin-sync")!), mountBusinessSummary(root.querySelector<HTMLElement>("#fin-summary")!)]).catch(e => say(String(e), "error"));
}
