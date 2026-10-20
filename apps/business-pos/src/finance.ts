// Operations panel for the reusable financial core: cash shift, fiado,
// messenger cash, returns and locations. Every write goes through the Rust
// commands (atomic, idempotent, outbox in the same transaction); this module
// only collects input and renders summaries.
import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import "./finance.css";
import { mountBusinessSummary, mountSync, requestSync, syncOnce } from "./sync";
import { cachedOpen, claimOpen, cloudExpected, fetchStatus, isToday, online, type CloudExpected, type StoreShiftInfo } from "./shift";
import { icon, openSheet } from "./ui";
import { attribution, can, messengerNames, personName, setStaff, staffList, staffSelectHtml } from "./attribution";

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
  storeRole: "opener" | "joiner" | null;
  openedBy: string | null;
  closedBy: string | null;
  closedRemote: boolean;
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

let shiftCurrency = "";

const signed = (minor: number, currency: string, sign: "+" | "−") => `${sign} ${fmt(minor, currency)}`;

async function shiftMovements(shiftId: string) {
  return db.select<Array<{ kind: string | null; direction: string; currency: string | null; amount_minor: number; reason: string; occurred_at: string }>>(
    `SELECT kind,direction,currency,amount_minor,reason,occurred_at FROM local_cash_movements
     WHERE shift_id=$1 AND COALESCE(kind,'') <> 'opening_float'
     ORDER BY occurred_at DESC LIMIT 30`,
    [shiftId],
  );
}

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString([], { day: "2-digit", month: "2-digit" });

function staffOrSay(form: HTMLFormElement, name: string): string | null {
  const select = form.querySelector<HTMLSelectElement>(`[name="${name}"]`);
  if (!select) return attribution.staffId;
  if (!select.value) {
    say("Elige quién eres (la dependienta que abre o cierra)", "error");
    return null;
  }
  setStaff(select.value);
  return select.value;
}

async function openLocal(shiftId: string, role: "opener" | "joiner", operatorId: string | null, primary: string, openingFloats: unknown[]) {
  await invoke("cash_shift_open", {
    input: { shiftId, outboxId: id(), operatorId, primaryCurrency: primary, openingFloats, openedAt: now(), storeRole: role },
  });
  requestSync();
}

async function joinShift(shift: StoreShiftInfo, operatorId: string | null) {
  await openLocal(shift.storeShiftId, "joiner", operatorId, "USD", []);
  say(`✓ Te uniste al turno que abrió ${shift.openedBy ?? "tu compañera"} a las ${hhmm(shift.openedAt)}`);
  await renderShift();
}

/** No open shift on this phone: join the store's shift of today, or open it (count the drawer). */
async function openShiftForm(box: HTMLElement) {
  box.innerHTML = `<div class="notice calm">${icon("clock")}<div><b>No hay turno abierto en este teléfono</b>Para vender hay que abrir el turno de la tienda o unirse al de tu compañera.</div></div><p class="t-sm muted" data-cloud>Mirando si la tienda ya abrió hoy…</p>`;
  let open: StoreShiftInfo | null = null;
  let stale: StoreShiftInfo[] = [];
  let checked = false;
  if (online()) {
    try {
      const st = await fetchStatus();
      open = st.open;
      stale = st.stale ?? [];
      checked = true;
    } catch {
      checked = false;
    }
  }
  const cached = !checked ? cachedOpen() : null;
  const today = open ?? cached;
  const cloudNote = checked
    ? today ? "" : "La tienda todavía no abrió el turno hoy: ábrelo tú contando el dinero del cajón."
    : `Sin internet no se puede saber si tu compañera ya abrió.${cached ? "" : " Si ya abrió, únete cuando vuelva la red; si eres la primera, ábrelo."}`;
  box.innerHTML = `
    <div class="notice calm">${icon("clock")}<div><b>No hay turno abierto en este teléfono</b>Para vender hay que abrir el turno de la tienda o unirse al de tu compañera. Hay un solo cajón.</div></div>
    ${stale.length ? `<div class="notice warn">${icon("alert")}<div><b>Turno viejo sin cerrar</b>${stale.map(s => `Del ${esc(dayLabel(s.openedAt))} en ${esc(s.openedDevice)}${s.openedBy ? ` (abrió ${esc(s.openedBy)})` : ""}`).join(" · ")}. Hay que contarlo y cerrarlo en ese teléfono. No se mezcla con el de hoy.</div></div>` : ""}
    ${today ? `<form id="fin-join" class="panel nx-form">
      <h2 class="t-lg">Unirme al turno de hoy</h2>
      <p class="t-sm">Abrió <b>${esc(today.openedBy ?? "tu compañera")}</b> a las ${esc(hhmm(today.openedAt))} en ${esc(today.openedDevice)}. El dinero ya lo contó ella: tú no cuentas nada.${cached ? " (Dato guardado: sin internet.)" : ""}</p>
      ${staffSelectHtml("staff", "¿Quién eres?")}
      <button type="submit" class="btn btn-primary btn-xl btn-block">Unirme al turno</button>
    </form>` : ""}
    ${cloudNote ? `<p class="t-sm muted">${esc(cloudNote)}</p>` : ""}
    <form id="fin-open" class="panel nx-form" ${today ? 'style="display:none"' : ""}>
      <h2 class="t-lg">Abrir el turno de la tienda</h2>
      ${staffSelectHtml("staff", "¿Quién abre? (queda como dependienta de turno)")}
      <label class="field">Moneda principal<select class="input" name="primary">${currencyOptions()}</select></label>
      <p class="t-sm muted">Cuenta el dinero del cajón (deja vacío lo que no haya):</p>
      <div class="grid-3">${CURRENCIES.map(c => `<label class="field">${c}<input class="input" name="float-${c}" inputmode="decimal" placeholder="0,00"></label>`).join("")}</div>
      <button type="submit" class="btn btn-primary btn-xl btn-block">Abrir turno</button>
    </form>
    ${today ? `<button type="button" class="btn btn-ghost btn-block t-sm" data-show-open>Mi compañera NO abrió: abrir el turno yo</button>` : ""}`;
  box.querySelector<HTMLButtonElement>("[data-show-open]")?.addEventListener("click", () => {
    if (!confirm("Solo hay un cajón. ¿Seguro que nadie abrió el turno hoy?")) return;
    box.querySelector<HTMLFormElement>("#fin-open")!.style.display = "";
  });
  const join = box.querySelector<HTMLFormElement>("#fin-join");
  if (join && today) {
    join.onsubmit = e => {
      e.preventDefault();
      const staff = staffOrSay(join, "staff");
      if (staffList().length && !staff) return;
      void run("Turno", () => joinShift(today, staff));
    };
  }
  const form = box.querySelector<HTMLFormElement>("#fin-open")!;
  form.onsubmit = e => {
    e.preventDefault();
    const staff = staffOrSay(form, "staff");
    if (staffList().length && !staff) return;
    void (async () => {
      try {
        const openingFloats = CURRENCIES.flatMap(c => {
          const raw = field(form, `float-${c}`).value;
          return raw.trim() ? [{ movementId: id(), currency: c, amountMinor: toMinor(raw) }] : [];
        });
        const shiftId = id();
        const primary = field<HTMLSelectElement>(form, "primary").value;
        if (online()) {
          // La nube decide: si otra ya abrió hoy, te unes a su turno (un solo cajón).
          let claim: Awaited<ReturnType<typeof claimOpen>> | null = null;
          try {
            claim = await claimOpen(shiftId, staff);
          } catch {
            claim = null;
          }
          if (claim?.action === "join") {
            await joinShift(claim.shift, staff);
            say(`${claim.shift.openedBy ?? "Tu compañera"} ya había abierto el turno: te uniste y no se contó el dinero dos veces.`);
            return;
          }
          if (!claim) say("No se pudo avisar a la nube: el turno se abre aquí y se avisa al sincronizar.", "error");
        }
        await openLocal(shiftId, "opener", staff, primary, openingFloats);
        say(`✓ Turno abierto${personName(staff) ? ` · ${personName(staff)} es la dependienta de turno` : ""}`);
        await renderShift();
      } catch (err) {
        say(`Turno: ${String(err)}`, "error");
      }
    })();
  };
}

function movementSheet(shift: ShiftSummary, kind: "cash_in" | "cash_out" | "expense") {
  const title = kind === "cash_in" ? "Entrada de dinero" : kind === "cash_out" ? "Salida de dinero" : "Gasto";
  const sheet = openSheet(`
    <div class="sheet-head"><h2>${title}</h2><button type="button" class="btn btn-ghost" data-close>Cerrar</button></div>
    <form class="nx-form">
      <div class="seg" role="group" aria-label="Moneda">${shift.currencies.map(c => `<button type="button" data-cur="${esc(c.currency)}" aria-pressed="${c.currency === shiftCurrency}">${esc(c.currency)}</button>`).join("")}</div>
      <label class="field">Importe<input class="input" name="amount" inputmode="decimal" required placeholder="0,00" style="font-size: var(--nx-fs-xl); font-weight: 700"></label>
      <label class="field">Motivo<input class="input" name="reason" required maxlength="280" placeholder="${kind === "cash_in" ? "Cambio traído del banco" : kind === "expense" ? "Transporte" : "Pago a mensajero"}"></label>
      ${kind === "expense" ? `<label class="field">Categoría<input class="input" name="category" placeholder="transporte, mensajería…"></label>` : ""}
      <button type="submit" class="btn btn-primary btn-xl btn-block">Registrar</button>
    </form>`, title);
  let currency = shiftCurrency;
  sheet.el.querySelector<HTMLButtonElement>("[data-close]")!.onclick = sheet.close;
  sheet.el.querySelectorAll<HTMLButtonElement>("[data-cur]").forEach(b => (b.onclick = () => {
    currency = b.dataset.cur!;
    sheet.el.querySelectorAll("[data-cur]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  }));
  const form = sheet.el.querySelector<HTMLFormElement>("form")!;
  form.onsubmit = e => {
    e.preventDefault();
    void run(`${title} registrada`, async () => {
      await invoke("cash_shift_record_movement", {
        input: {
          movementId: id(),
          outboxId: id(),
          shiftId: shift.shiftId,
          kind,
          direction: null,
          currency,
          amountMinor: toMinor(field(form, "amount").value),
          reason: field(form, "reason").value,
          category: kind === "expense" ? field(form, "category").value || null : null,
          sourceType: null,
          sourceId: null,
          correctsMovementId: null,
          operatorId: attribution.staffId,
          occurredAt: now(),
        },
      });
      sheet.close();
      requestSync();
      await renderShift();
    });
  };
}

type Expected = { currency: string; expectedMinor: number; lines: Array<[string, number]> };

/** Billetes de la hoja «CIERRE DE VENTAS DIARIO» (Lennys 20-oct). */
const BILLS: Record<string, number[]> = {
  USD: [100, 50, 20, 10, 5, 3, 1],
  CUP: [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 1],
};
/** Transferencias como en la hoja: CUP, saldo (CEL), tarjeta clásica (y Zelle/USD por si acaso). */
const TRANSFER_TYPES: Array<[string, string]> = [["cup", "Transferencia CUP"], ["saldo", "Saldo (CEL)"], ["clasica", "Clásica"], ["usd", "USD / Zelle"]];

/** «Debería haber»: de la nube (todo el cajón) o, sin internet, solo de este teléfono. */
async function expectedFor(shift: ShiftSummary): Promise<{ list: Expected[]; cloud: boolean; note: string; webOrders: CloudExpected["webOrders"] }> {
  // Vueltos (Lennys 20-oct): salen del fondo y vuelven; van en líneas aparte, nunca como venta.
  const vueltos = await db.select<Array<{ currency: string; category: string; total: number }>>(
    `SELECT currency, category, SUM(amount_minor) AS total FROM local_cash_movements
     WHERE shift_id=$1 AND category IN ('vuelto','vuelto_devuelto') GROUP BY currency, category`, [shift.shiftId]).catch(() => []);
  const v = (currency: string, category: string) => Number(vueltos.find(x => x.currency === currency && x.category === category)?.total ?? 0);
  const local = (): Expected[] => shift.currencies.map(c => ({
    currency: c.currency,
    expectedMinor: c.expectedMinor,
    lines: [
      ["Fondo inicial", c.openingFloatMinor], ["Ventas en efectivo (este teléfono)", c.salesCashMinor],
      ["Vuelto en la calle", -v(c.currency, "vuelto")], ["Vuelto devuelto", v(c.currency, "vuelto_devuelto")],
      ["Entradas", c.otherInMinor - v(c.currency, "vuelto_devuelto")], ["Salidas y gastos", -(c.otherOutMinor - v(c.currency, "vuelto"))],
    ],
  }));
  if (!online() || !shift.storeRole) {
    return {
      list: local(),
      cloud: false,
      webOrders: [],
      note: !shift.storeRole
        ? "Turno de antes del cambio: solo cuenta este teléfono."
        : "SIN INTERNET: esto es solo lo de este teléfono. Falta lo de los otros teléfonos y lo cobrado en Ventas (web). Cierra con internet si puedes.",
    };
  }
  try {
    await syncOnce(true).catch(() => undefined); // que la nube tenga todo lo de este teléfono
    const cloud = await cloudExpected(shift.shiftId);
    const missingPhones = (cloud.shift.devices ?? []).filter(d => d.lastSeenAt && Date.now() - new Date(d.lastSeenAt).getTime() > 30 * 60_000);
    const notes = [
      "Toda la tienda: los teléfonos del turno + lo cobrado en Ventas (web) en efectivo.",
      cloud.webMissing ? "OJO: no se pudo leer lo cobrado en Ventas (web): falta esa parte." : "",
      missingPhones.length ? `OJO: ${missingPhones.map(d => d.label).join(", ")} no se conecta desde hace más de 30 min; sus ventas pueden faltar.` : "",
    ].filter(Boolean);
    return {
      list: cloud.currencies.map(c => ({
        currency: c.currency,
        expectedMinor: c.expectedMinor,
        lines: [
          ["Fondo inicial", c.openingFloatMinor], ["Ventas en efectivo (todos los teléfonos)", c.salesCashMinor],
          ["Pedidos web cobrados en la caja", c.webInCajaMinor], ["Pedidos web cobrados en Ventas", c.webInVentasMinor],
          ["Vuelto en la calle", -(c.vueltoOutMinor ?? 0)], ["Vuelto devuelto", c.vueltoBackMinor ?? 0],
          ["Otras entradas", c.otherInMinor], ["Salidas, gastos y devoluciones", -c.outMinor],
        ],
      })),
      cloud: true,
      webOrders: cloud.webOrders ?? [],
      note: notes.join(" "),
    };
  } catch (e) {
    return { list: local(), cloud: false, webOrders: [], note: `No se pudo calcular con la nube (${String(e instanceof Error ? e.message : e)}). Esto es solo lo de este teléfono; falta lo de los otros y lo de Ventas.` };
  }
}

async function closeSheet(shift: ShiftSummary) {
  const sheet = openSheet(`<div class="sheet-head"><h2>Contar y cerrar turno</h2><button type="button" class="btn btn-ghost" data-close>Volver</button></div><p class="t-sm muted">Calculando lo que debería haber en el cajón…</p>`, "Cerrar turno");
  sheet.el.querySelector<HTMLButtonElement>("[data-close]")!.onclick = sheet.close;
  const exp = await expectedFor(shift);
  const rows = exp.list.filter(e => e.expectedMinor !== 0 || shift.currencies.some(c => c.currency === e.currency));
  sheet.el.innerHTML = `
    <div class="sheet-head"><h2>Contar y cerrar turno</h2><button type="button" class="btn btn-ghost" data-close>Volver</button></div>
    <form class="nx-form">
      <div class="notice ${exp.cloud ? "ok" : "warn"}">${icon(exp.cloud ? "check" : "alert")}<div><b>${exp.cloud ? "Cuenta de toda la tienda" : "Cuenta solo de este teléfono"}</b>${esc(exp.note)}</div></div>
      <table class="tbl"><thead><tr><th>Efectivo</th><th>Debería haber</th><th>Contado</th><th>Dif.</th></tr></thead><tbody>
        ${rows.map(c => `<tr><td style="font-weight: 700">${esc(c.currency)}</td><td class="num">${(c.expectedMinor / 100).toFixed(2)}</td>
          <td><input class="input" name="count-${esc(c.currency)}" data-expected="${c.expectedMinor}" inputmode="decimal" required placeholder="0,00" style="width: 88px; text-align: right"></td>
          <td class="num muted" data-diff="${esc(c.currency)}">—</td></tr>`).join("")}
      </tbody></table>
      <details class="t-sm"><summary>De dónde sale «debería haber»</summary>${rows.map(c => `<p style="font-weight:700;margin:6px 0 2px">${esc(c.currency)}</p>${c.lines.filter(([, v]) => v).map(([label, v]) => `<div class="kv"><span class="muted">${esc(label)}</span><span class="num">${v < 0 ? "−" : "+"} ${fmt(Math.abs(v), c.currency)}</span></div>`).join("")}`).join("")}</details>
      <details class="t-sm" data-bills><summary><b>Desglose de billetes</b> (como la hoja de cierre)</summary>
        ${Object.entries(BILLS).map(([cur, list]) => `<p style="font-weight:700;margin:8px 0 2px">${esc(cur === "CUP" ? "MN (CUP)" : cur)}</p>
          <div class="grid-3">${list.map(b => `<label class="field">${b}<input class="input" data-bill="${cur}:${b}" inputmode="numeric" placeholder="0"></label>`).join("")}</div>
          <p class="t-xs muted" data-bill-total="${cur}"></p>`).join("")}
        <p class="t-xs muted">Al escribir billetes, «Contado» se llena solo con la suma.</p>
      </details>
      <details class="t-sm" data-transfers open><summary><b>Transferencias del día</b> (no van en el cajón)</summary>
        <div data-transfer-rows></div>
        <button type="button" class="btn btn-ghost btn-block" data-add-transfer>+ Añadir transferencia</button>
        <p class="t-xs muted">Tipo, importe y los últimos 4 números de la tarjeta donde entró.</p>
      </details>
      ${exp.webOrders.length ? `<details class="t-sm"><summary>Cobros de pedidos web en Ventas (${exp.webOrders.length})</summary>${exp.webOrders.map(o => `<div class="kv"><span>#${esc(o.number)}</span><span class="num">${o.cash.map(c => fmt(Math.round(c.amount * 100), c.currency)).join(" + ")}</span></div>`).join("")}</details>` : ""}
      <p class="t-xs muted">Transferencias, Zelle y cripto no se cuentan en caja: van con su referencia.</p>
      <div data-warn></div>
      ${staffSelectHtml("staff", "¿Quién cuenta y cierra?")}
      <label class="field">Motivo de la diferencia<input class="input" name="note" placeholder="Ej.: vuelto mal dado"></label>
      <button type="submit" class="btn btn-primary btn-xl btn-block">Cerrar turno</button>
    </form>`;
  sheet.el.querySelector<HTMLButtonElement>("[data-close]")!.onclick = sheet.close;
  const form = sheet.el.querySelector<HTMLFormElement>("form")!;
  const diffs = () => rows.map(c => {
    const raw = field(form, `count-${c.currency}`).value;
    let counted: number | null = null;
    try {
      counted = raw.trim() ? toMinor(raw) : null;
    } catch {
      counted = null;
    }
    return { currency: c.currency, diff: counted === null ? null : counted - c.expectedMinor };
  });
  const paint = () => {
    const all = diffs();
    for (const d of all) {
      const cell = sheet.el.querySelector<HTMLElement>(`[data-diff="${d.currency}"]`)!;
      cell.className = `num ${d.diff === null ? "muted" : d.diff === 0 ? "pos" : "neg"}`;
      cell.textContent = d.diff === null ? "—" : d.diff === 0 ? "0" : `${d.diff > 0 ? "+" : "−"}${(Math.abs(d.diff) / 100).toFixed(2)}`;
    }
    const off = all.filter(d => d.diff);
    sheet.el.querySelector<HTMLElement>("[data-warn]")!.innerHTML = off.length
      ? `<div class="notice warn">${icon("alert")}<div><b>${off.map(d => `${d.diff! < 0 ? "Faltan" : "Sobran"} ${fmt(Math.abs(d.diff!), d.currency)}`).join(" · ")}</b>Escribe un motivo para cerrar.</div></div>`
      : "";
  };
  form.querySelectorAll("input[data-expected]").forEach(i => i.addEventListener("input", paint));
  // Desglose: la suma de billetes llena «Contado».
  const billTotals = () => Object.fromEntries(Object.entries(BILLS).map(([cur, list]) => [cur, list.reduce((t, b) => {
    const n = Number(form.querySelector<HTMLInputElement>(`[data-bill="${cur}:${b}"]`)?.value || 0);
    return t + (Number.isFinite(n) && n > 0 ? Math.floor(n) * b * 100 : 0);
  }, 0)]));
  form.querySelectorAll<HTMLInputElement>("[data-bill]").forEach(i => i.addEventListener("input", () => {
    const totals = billTotals();
    for (const [cur, minor] of Object.entries(totals)) {
      const label = form.querySelector<HTMLElement>(`[data-bill-total="${cur}"]`);
      if (label) label.textContent = minor ? `Suma: ${fmt(minor, cur)}` : "";
      const count = form.querySelector<HTMLInputElement>(`[name="count-${cur}"]`);
      if (count && minor) count.value = (minor / 100).toFixed(2);
    }
    paint();
  }));
  // Transferencias por tipo + últimos 4 números.
  const transferBox = form.querySelector<HTMLElement>("[data-transfer-rows]")!;
  const addTransfer = () => {
    const row = document.createElement("div");
    row.className = "grid-3";
    row.dataset.transfer = "";
    row.innerHTML = `<label class="field">Tipo<select class="input" data-t-type>${TRANSFER_TYPES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>
      <label class="field">Importe<input class="input" data-t-amount inputmode="decimal" placeholder="0,00"></label>
      <label class="field">Últimos 4<input class="input" data-t-last4 inputmode="numeric" maxlength="4" placeholder="2690"></label>`;
    transferBox.append(row);
  };
  form.querySelector<HTMLButtonElement>("[data-add-transfer]")!.onclick = addTransfer;
  addTransfer();
  const details = () => {
    const bills: Record<string, Record<string, number>> = {};
    for (const [cur, list] of Object.entries(BILLS)) {
      for (const b of list) {
        const n = Math.floor(Number(form.querySelector<HTMLInputElement>(`[data-bill="${cur}:${b}"]`)?.value || 0));
        if (n > 0) (bills[cur] ??= {})[String(b)] = n;
      }
    }
    const transfers = Array.from(transferBox.querySelectorAll<HTMLElement>("[data-transfer]")).flatMap(r => {
      const raw = r.querySelector<HTMLInputElement>("[data-t-amount]")!.value;
      if (!raw.trim()) return [];
      const last4 = r.querySelector<HTMLInputElement>("[data-t-last4]")!.value.replace(/\D/g, "");
      if (last4.length !== 4) throw new Error("En cada transferencia pon los últimos 4 números de la tarjeta");
      const type = r.querySelector<HTMLSelectElement>("[data-t-type]")!.value;
      return [{ type, currency: type === "usd" ? "USD" : "CUP", amountMinor: toMinor(raw), last4 }];
    });
    return Object.keys(bills).length || transfers.length ? { bills, transfers } : null;
  };
  form.onsubmit = e => {
    e.preventDefault();
    const off = diffs().some(d => d.diff);
    if (off && !field(form, "note").value.trim()) {
      say("Escribe el motivo de la diferencia para cerrar", "error");
      return;
    }
    const staff = staffOrSay(form, "staff");
    if (staffList().length && !staff) return;
    void (async () => {
      try {
        const closed = await invoke<ShiftSummary>("cash_shift_close", {
          input: {
            shiftId: shift.shiftId,
            outboxId: id(),
            counts: rows.map(c => ({ countId: id(), currency: c.currency, countedMinor: toMinor(field(form, `count-${c.currency}`).value) })),
            closedBy: staff,
            note: field(form, "note").value || null,
            closedAt: now(),
            expected: exp.cloud ? exp.list.map(c => ({ currency: c.currency, expectedMinor: c.expectedMinor })) : null,
            details: details(),
          },
        });
        sheet.close();
        requestSync();
        const lines = closed.counts
          .map(c => `${c.currency} ${c.differenceMinor === 0 ? "cuadra" : `${c.differenceMinor > 0 ? "sobran" : "faltan"} ${fmt(Math.abs(c.differenceMinor), c.currency)}`}`)
          .join(" · ");
        await renderShift();
        say(`✓ Turno cerrado${exp.cloud ? " (toda la tienda)" : " (solo este teléfono)"} · ${lines}`);
      } catch (err) {
        say(`Cierre de turno: ${String(err)}`, "error");
      }
    })();
  };
}

async function renderShift() {
  const box = root.querySelector<HTMLElement>("#fin-shift")!;
  const shift = await invoke<ShiftSummary | null>("cash_shift_current");
  if (!shift) return openShiftForm(box);

  if (!shift.currencies.some(c => c.currency === shiftCurrency)) shiftCurrency = shift.primaryCurrency;
  const cur = shift.currencies.find(c => c.currency === shiftCurrency) ?? shift.currencies[0];
  const opened = new Date(shift.openedAt);
  const floats = shift.currencies.filter(c => c.openingFloatMinor).map(c => fmt(c.openingFloatMinor, c.currency)).join(" y ") || "sin fondo";
  const who = personName(shift.openedBy);
  const old = !isToday(shift.openedAt);
  const role = shift.storeRole === "joiner"
    ? `Te uniste al turno de la tienda${who ? ` (${esc(who)})` : ""}: el fondo lo contó quien abrió. Aquí ves solo lo de este teléfono.`
    : shift.storeRole === "opener"
      ? `Turno de la tienda${who ? ` · abrió ${esc(who)}, dependienta de turno` : ""} · abrió con ${floats}`
      : `Desde ${esc(opened.toLocaleDateString())} · abrió con ${floats}`;
  const moves = await shiftMovements(shift.shiftId);
  box.innerHTML = `
    <div class="notice ${old ? "warn" : "ok"}">${icon(old ? "alert" : "clock")}<div><b>Turno abierto · ${esc(old ? `${dayLabel(shift.openedAt)} ` : "")}${esc(opened.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</b>${old ? "Este turno es de otro día: cuéntalo y ciérralo antes de seguir vendiendo. " : ""}${role}</div></div>
    ${shift.currencies.length > 1 ? `<div class="seg" role="group" aria-label="Moneda">${shift.currencies.map(c => `<button type="button" data-cur="${esc(c.currency)}" aria-pressed="${c.currency === cur.currency}">${esc(c.currency)}</button>`).join("")}</div>` : ""}
    <div class="panel" style="gap: 8px">
      <div class="kv"><span class="muted">Fondo inicial</span><span class="num">${fmt(cur.openingFloatMinor, cur.currency)}</span></div>
      <div class="kv"><span class="muted">Ventas en efectivo</span><span class="num pos">${signed(cur.salesCashMinor, cur.currency, "+")}</span></div>
      <div class="kv"><span class="muted">Entradas (también pedidos web)</span><span class="num pos">${signed(cur.otherInMinor, cur.currency, "+")}</span></div>
      <div class="kv"><span class="muted">Salidas y gastos</span><span class="num neg">${signed(cur.otherOutMinor, cur.currency, "−")}</span></div>
      <div class="hr"></div>
      <div class="kv" style="font-weight: 700"><span>${shift.storeRole ? "En este teléfono" : "Debe haber"}</span><span class="t-lg num">${fmt(cur.expectedMinor, cur.currency)}</span></div>
      ${shift.storeRole ? `<p class="t-xs muted">Al cerrar, la nube suma todos los teléfonos y lo cobrado en Ventas.</p>` : ""}
    </div>
    <div class="grid-3">
      <button type="button" class="btn btn-secondary" data-move="cash_in">${icon("arrowDown", "sm")}Entrada</button>
      <button type="button" class="btn btn-secondary" data-move="cash_out">${icon("arrowUp", "sm")}Salida</button>
      <button type="button" class="btn btn-secondary" data-move="expense">${icon("receipt", "sm")}Gasto</button>
    </div>
    <button type="button" class="btn btn-primary btn-xl btn-block" data-close-shift>Contar y cerrar turno</button>
    <p class="t-xs muted" style="font-weight: 700">MOVIMIENTOS DEL TURNO</p>
    <div class="panel" style="padding: 4px 16px; gap: 0">${moves.length ? moves.map(m => {
      const out = m.direction === "out";
      return `<div class="list-row"><div class="ico-box" style="background: var(--nx-${out ? "danger" : "ok"}-soft); color: var(--nx-${out ? "danger" : "ok"})">${icon(out ? "arrowUp" : "arrowDown")}</div>
        <div class="grow"><div style="font-weight: 700">${esc(m.reason)}</div><div class="t-xs muted">${esc(new Date(m.occurred_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}${m.kind === "expense" ? " · gasto" : ""}</div></div>
        <span class="num ${out ? "neg" : "pos"}">${out ? "−" : "+"} ${fmt(m.amount_minor, m.currency ?? cur.currency)}</span></div>`;
    }).join("") : `<p class="muted" style="padding: 12px 0">Sin entradas ni salidas todavía.</p>`}</div>`;
  box.querySelectorAll<HTMLButtonElement>("[data-cur]").forEach(b => (b.onclick = () => { shiftCurrency = b.dataset.cur!; void renderShift(); }));
  box.querySelectorAll<HTMLButtonElement>("[data-move]").forEach(b => (b.onclick = () => movementSheet(shift, b.dataset.move as "cash_in" | "cash_out" | "expense")));
  box.querySelector<HTMLButtonElement>("[data-close-shift]")!.onclick = () => void closeSheet(shift);
}

/** Opens Caja on the close sheet directly (home button «Cerrar el día»). */
export async function startCloseDay() {
  const shift = await invoke<ShiftSummary | null>("cash_shift_current");
  if (!shift) {
    say("No hay turno abierto en este teléfono.", "error");
    return;
  }
  await closeSheet(shift);
}
window.addEventListener("nexo:shift-changed", () => void renderShift());

// ---------- Fiado / receivables ----------

async function renderReceivables(customerId: string) {
  const list = root.querySelector<HTMLElement>("#fin-debts")!;
  if (!customerId.trim()) {
    list.innerHTML = `<p class="t-sm muted">Escribe el cliente para ver sus deudas.</p>`;
    return;
  }
  const debts = await invoke<ReceivableBalance[]>("receivables_for_customer", { customerId: customerId.trim() });
  if (!debts.length) {
    list.innerHTML = `<p class="t-sm muted">Sin deudas abiertas.</p>`;
    return;
  }
  list.innerHTML = debts
    .map(
      d => `<form class="panel nx-form" data-id="${esc(d.receivableId)}">
        <div class="kv"><strong>${fmt(d.balanceMinor, d.currency)} pendiente</strong><span>de ${fmt(d.originalMinor, d.currency)}${d.dueAt ? ` · vence ${esc(d.dueAt)}` : ""}</span></div>
        <label class="field">Abono<input class="input" name="amount" inputmode="decimal" required placeholder="0.00"></label>
        <label class="field">Forma de pago<select class="input" name="rail">${railOptions()}</select></label>
        <button type="submit" class="btn btn-primary btn-block">Registrar abono</button>
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
    <form id="fin-debt" class="nx-form">
      <label class="field">Cliente<input class="input" name="customer" required placeholder="Nombre o teléfono"></label>
      <label class="field">Moneda<select class="input" name="currency">${currencyOptions()}</select></label>
      <label class="field">Importe fiado<input class="input" name="amount" inputmode="decimal" required placeholder="0.00"></label>
      <label class="field">Vence<input class="input" name="due" type="date"></label>
      <label class="field">Nota<input class="input" name="note" placeholder="Qué se llevó"></label>
      <button type="submit" class="btn btn-primary btn-block">Anotar fiado</button>
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
    <form id="fin-courier" class="nx-form">
      <label class="field">Mensajero<input class="input" name="messenger" required placeholder="Nombre" list="fin-messengers" autocomplete="off"></label>
      <datalist id="fin-messengers">${messengerNames().map(n => `<option value="${esc(n)}">`).join("")}</datalist>
      <label class="field">Pedido<input class="input" name="order" required placeholder="Número de pedido"></label>
      <label class="field">Sistema del pedido<select class="input" name="system"><option value="woocommerce">Tienda online</option><option value="nexo">NEXO</option><option value="other">Otro</option></select></label>
      <label class="field">Moneda<select class="input" name="currency">${currencyOptions()}</select></label>
      <label class="field">Importe<input class="input" name="amount" inputmode="decimal" required placeholder="0.00"></label>
      <div class="grid-2">
        <button type="button" class="btn btn-secondary" data-act="collect">Cobró al cliente</button>
        <button type="button" class="btn btn-secondary" data-act="return">Entregó en caja</button>
      </div>
    </form>
    <div id="fin-courier-balance" class="t-sm muted"></div>`;
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
    <label class="field">Venta<select class="input" id="fin-sale"><option value="">Elige una venta reciente</option>${sales
      .map(s => `<option value="${esc(s.id)}">${esc(new Date(s.occurred_at).toLocaleString())} · ${fmt(s.total_minor, s.currency)}</option>`)
      .join("")}</select></label>
    <form id="fin-return" class="nx-form" hidden></form>`;
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
        return `<label class="field">${esc(productNames.get(l.productId) ?? l.productId)} · vendidos ${l.soldQuantity}, devueltos ${l.returnedQuantity}
          <input class="input" name="qty-${esc(l.saleLineId)}" type="number" min="0" max="${max}" value="0"${max ? "" : " disabled"}></label>`;
      })
      .join("")}
    <label class="field">Reembolso (máx. ${fmt(left, summary.currency)})<input class="input" name="refund" inputmode="decimal" value="0"></label>
    <label class="field">Forma de reembolso<select class="input" name="rail">${railOptions()}</select></label>
    <label class="field">Motivo<input class="input" name="reason" required placeholder="Obligatorio"></label>
    <button type="submit" class="btn btn-primary btn-block">Registrar devolución</button>`;
  // El reembolso se rellena solo con lo que vale lo devuelto (precio cobrado por unidad);
  // si la dependienta lo cambia a mano, se respeta.
  const prices = new Map(
    (await db.select<Array<{ id: string; quantity: number; line_total_minor: number }>>(
      "SELECT id,quantity,line_total_minor FROM local_sale_lines WHERE sale_id = $1", [saleId],
    )).map(l => [l.id, l.line_total_minor / l.quantity]),
  );
  const refund = field(form, "refund");
  let touched = false;
  refund.addEventListener("input", () => { touched = true; });
  form.querySelectorAll<HTMLInputElement>("input[name^='qty-']").forEach(input =>
    input.addEventListener("input", () => {
      if (touched) return;
      const minor = summary.lines.reduce((t, l) => t + Number(field(form, `qty-${l.saleLineId}`).value || 0) * (prices.get(l.saleLineId) ?? 0), 0);
      refund.value = (Math.min(Math.round(minor), left) / 100).toFixed(2);
    }),
  );
  form.onsubmit = e => {
    e.preventDefault();
    const allowed = can("returns");
    if (!allowed.ok) { alert(allowed.reason); return; }
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
      : `<p class="t-sm muted">Aún no hay ubicaciones. La primera será la principal: las ventas descuentan stock de ella.</p>`}
    ${first ? `<p class="t-sm muted">Stock en ${esc(first.name)}: ${stock.map(s => `${esc(productNames.get(s.productId) ?? s.productId)} ${s.quantity}`).join(" · ") || "sin movimientos"}</p>` : ""}
    <form id="fin-loc" class="nx-form">
      <label class="field">Nombre<input class="input" name="name" required placeholder="${locations.length ? "Almacén" : "Tienda principal"}"></label>
      <label class="field">Tipo<select class="input" name="kind">${kinds.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>
      <button type="submit" class="btn btn-primary btn-block">Crear ubicación</button>
    </form>
    ${locations.length ? `<form id="fin-count" class="nx-form">
      <h3 class="t-lg">Conteo físico</h3>
      <p class="t-sm muted">Cuenta lo que hay de verdad: el sistema ajusta la diferencia y la registra.</p>
      <label class="field">Ubicación<select class="input" name="location">${locations.filter(l => l.active).map(l => `<option value="${esc(l.locationId)}"${l.isDefault ? " selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label>
      <label class="field">Producto<select class="input" name="product">${[...productNames].map(([pid, name]) => `<option value="${esc(pid)}">${esc(name)}</option>`).join("")}</select></label>
      <label class="field">Cantidad contada<input class="input" name="counted" type="number" min="0" step="1" required></label>
      <label class="field">Motivo<input class="input" name="reason" required value="Conteo físico"></label>
      <button type="submit" class="btn btn-primary btn-block">Registrar conteo</button>
    </form>` : ""}
    ${locations.filter(l => l.active).length > 1 ? `<form id="fin-transfer" class="nx-form">
      <h3 class="t-lg">Trasladar</h3>
      <p class="t-sm muted">Mueve unidades de una ubicación a otra (por ejemplo, del almacén a la tienda).</p>
      <label class="field">Producto<select class="input" name="product">${[...productNames].map(([pid, name]) => `<option value="${esc(pid)}">${esc(name)}</option>`).join("")}</select></label>
      <div class="grid-2">
        <label class="field">Desde<select class="input" name="from">${locations.filter(l => l.active).map(l => `<option value="${esc(l.locationId)}">${esc(l.name)}</option>`).join("")}</select></label>
        <label class="field">Hacia<select class="input" name="to">${locations.filter(l => l.active).map((l, i) => `<option value="${esc(l.locationId)}"${i === 1 ? " selected" : ""}>${esc(l.name)}</option>`).join("")}</select></label>
      </div>
      <label class="field">Cantidad<input class="input" name="qty" type="number" min="1" step="1" required></label>
      <label class="field">Motivo<input class="input" name="reason" required value="Reposición"></label>
      <button type="submit" class="btn btn-primary btn-block">Trasladar</button>
    </form>` : ""}`;
  const transferForm = box.querySelector<HTMLFormElement>("#fin-transfer");
  if (transferForm) {
    transferForm.onsubmit = e => {
      e.preventDefault();
      if (field<HTMLSelectElement>(transferForm, "from").value === field<HTMLSelectElement>(transferForm, "to").value) {
        say("Elige dos ubicaciones distintas", "error");
        return;
      }
      void run("Traslado registrado", async () => {
        await invoke("inventory_transfer", {
          input: {
            transferId: id(),
            outboxId: id(),
            outMovementId: id(),
            inMovementId: id(),
            productId: field<HTMLSelectElement>(transferForm, "product").value,
            fromLocationId: field<HTMLSelectElement>(transferForm, "from").value,
            toLocationId: field<HTMLSelectElement>(transferForm, "to").value,
            quantity: Number(field(transferForm, "qty").value),
            reason: field(transferForm, "reason").value,
            operatorId: null,
            occurredAt: now(),
          },
        });
        await renderLocations();
        requestSync();
      });
    };
  }
  const countForm = box.querySelector<HTMLFormElement>("#fin-count");
  if (countForm) {
    countForm.onsubmit = e => {
      e.preventDefault();
      const allowed = can("counts");
      if (!allowed.ok) { alert(allowed.reason); return; }
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

// ---------- Consignment ----------

type ConsignmentRow = { location_id: string; customer_id: string; currency: string; name: string };

async function defaultLocation() {
  const locations = await invoke<Location[]>("inventory_locations");
  return locations.find(l => l.isDefault && l.active) ?? null;
}

function productOptions() {
  return [...productNames].sort((a, b) => a[1].localeCompare(b[1], "es")).map(([pid, name]) => `<option value="${esc(pid)}">${esc(name)}</option>`).join("");
}

/** Moves units between the store and a client's consignment location. */
function consignmentMoveSheet(account: ConsignmentRow, direction: "send" | "collect", store: Location) {
  const send = direction === "send";
  const title = send ? `Enviar a ${account.customer_id}` : `Recoger de ${account.customer_id}`;
  const sheet = openSheet(`
    <div class="sheet-head"><h2>${esc(title)}</h2><button type="button" class="btn btn-ghost" data-close>Cerrar</button></div>
    <form class="nx-form">
      <p class="t-sm muted">${send ? `Sale de ${esc(store.name)} y queda en depósito del cliente: sigue siendo tuyo hasta que lo liquides.` : `Vuelve a ${esc(store.name)} lo que el cliente no vendió.`}</p>
      <label class="field">Buscar producto<input class="input" type="search" data-filter placeholder="🔍 Escribe parte del nombre" autocomplete="off"></label>
      <label class="field">Producto<select class="input" name="product" size="6">${productOptions()}</select></label>
      <label class="field">Cantidad<input class="input" name="qty" type="number" min="1" step="1" required></label>
      <button type="submit" class="btn btn-primary btn-xl btn-block">${send ? "Enviar" : "Recoger"}</button>
    </form>`, title);
  sheet.el.querySelector<HTMLButtonElement>("[data-close]")!.onclick = sheet.close;
  const form = sheet.el.querySelector<HTMLFormElement>("form")!;
  // Buscador: filtra la lista de productos mientras se escribe (sin tildes ni mayúsculas)
  const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const picker = field<HTMLSelectElement>(form, "product");
  form.querySelector<HTMLInputElement>("[data-filter]")!.addEventListener("input", ev => {
    const q = plain((ev.target as HTMLInputElement).value.trim());
    let first: HTMLOptionElement | null = null;
    for (const o of Array.from(picker.options)) {
      o.hidden = !!q && !plain(o.text).includes(q);
      if (!o.hidden && !first) first = o;
    }
    if (first && picker.selectedOptions[0]?.hidden !== false) first.selected = true;
  });
  form.onsubmit = e => {
    e.preventDefault();
    void run(send ? "Mercancía enviada en consignación" : "Mercancía recogida", async () => {
      await invoke("inventory_transfer", {
        input: {
          transferId: id(),
          outboxId: id(),
          outMovementId: id(),
          inMovementId: id(),
          productId: field<HTMLSelectElement>(form, "product").value,
          fromLocationId: send ? store.locationId : account.location_id,
          toLocationId: send ? account.location_id : store.locationId,
          quantity: Number(field(form, "qty").value),
          reason: send ? `Consignación a ${account.customer_id}` : `Devolución de consignación de ${account.customer_id}`,
          operatorId: null,
          occurredAt: now(),
        },
      });
      sheet.close();
      requestSync();
      await renderConsignment();
    });
  };
}

/** Records what the client sold: stock leaves their location and a fiado opens for the total. */
async function settleSheet(account: ConsignmentRow) {
  const stock = (await invoke<StockLine[]>("inventory_location_stock", { locationId: account.location_id })).filter(s => s.quantity > 0);
  const prices = await db.select<Array<{ product_id: string; amount_minor: number }>>(
    "SELECT product_id, amount_minor FROM local_prices WHERE active=1 AND currency=$1",
    [account.currency],
  );
  const priceOf = new Map(prices.map(p => [p.product_id, p.amount_minor]));
  const title = `Liquidar a ${account.customer_id}`;
  const sheet = openSheet(`
    <div class="sheet-head"><h2>${esc(title)}</h2><button type="button" class="btn btn-ghost" data-close>Cerrar</button></div>
    ${stock.length ? `<form class="nx-form">
      <p class="t-sm muted">Escribe cuántas unidades vendió el cliente y a qué precio. El total queda como fiado del cliente.</p>
      <table class="tbl"><thead><tr><th>Producto</th><th>Tiene</th><th>Vendió</th><th>Precio ${esc(account.currency)}</th></tr></thead><tbody>
        ${stock.map(s => `<tr><td>${esc(productNames.get(s.productId) ?? s.productId)}</td><td>${s.quantity}</td>
          <td><input class="input" name="qty-${esc(s.productId)}" type="number" min="0" max="${s.quantity}" step="1" value="0" style="width: 64px; text-align: right"></td>
          <td><input class="input" name="price-${esc(s.productId)}" inputmode="decimal" value="${priceOf.has(s.productId) ? (priceOf.get(s.productId)! / 100).toFixed(2) : ""}" style="width: 84px; text-align: right"></td></tr>`).join("")}
      </tbody></table>
      <div class="kv"><span style="font-weight: 700">Total a cobrar</span><span class="t-lg num" data-total>0.00 ${esc(account.currency)}</span></div>
      <label class="field">Vence<input class="input" name="due" type="date"></label>
      <button type="submit" class="btn btn-primary btn-xl btn-block">Liquidar</button>
    </form>` : `<p class="muted">El cliente no tiene mercancía en depósito.</p>`}`, title);
  sheet.el.querySelector<HTMLButtonElement>("[data-close]")!.onclick = sheet.close;
  const form = sheet.el.querySelector<HTMLFormElement>("form");
  if (!form) return;
  const lines = () => stock.flatMap(s => {
    const qty = Number(field(form, `qty-${s.productId}`).value || 0);
    if (!qty) return [];
    return [{ productId: s.productId, quantity: qty, unitPriceMinor: toMinor(field(form, `price-${s.productId}`).value || "0") }];
  });
  const paint = () => {
    try {
      const total = lines().reduce((t, l) => t + l.quantity * l.unitPriceMinor, 0);
      form.querySelector("[data-total]")!.textContent = fmt(total, account.currency);
    } catch {
      form.querySelector("[data-total]")!.textContent = "Precio inválido";
    }
  };
  form.querySelectorAll("input").forEach(i => i.addEventListener("input", paint));
  form.onsubmit = e => {
    e.preventDefault();
    void run("Consignación liquidada · el total quedó en fiado", async () => {
      const sold = lines();
      if (!sold.length) throw new Error("Indica al menos un producto vendido");
      await invoke("consignment_settle", {
        input: {
          settlementId: id(),
          outboxId: id(),
          receivableId: id(),
          receivableOutboxId: id(),
          locationId: account.location_id,
          lines: sold.map(l => ({ lineId: id(), inventoryMovementId: id(), ...l })),
          dueAt: field(form, "due").value || null,
          note: null,
          operatorId: null,
          occurredAt: now(),
        },
      });
      sheet.close();
      requestSync();
      await renderConsignment();
    });
  };
}

async function renderConsignment() {
  const box = root.querySelector<HTMLElement>("#fin-consignment");
  if (!box) return;
  const store = await defaultLocation();
  const accounts = await db.select<ConsignmentRow[]>(
    `SELECT a.location_id, a.customer_id, a.currency, l.name
     FROM local_consignment_accounts a JOIN local_locations l ON l.id = a.location_id
     ORDER BY a.customer_id`,
  );
  const cards = await Promise.all(accounts.map(async a => {
    const stock = (await invoke<StockLine[]>("inventory_location_stock", { locationId: a.location_id })).filter(s => s.quantity > 0);
    const units = stock.reduce((n, s) => n + s.quantity, 0);
    return `<div class="panel" data-account="${esc(a.location_id)}" style="gap: 8px">
      <div class="kv"><span style="font-weight: 700">${esc(a.customer_id)}</span><span class="badge ${units ? "badge-info" : "badge-calm"}">${units} en depósito</span></div>
      ${stock.length ? `<p class="t-xs muted">${stock.slice(0, 4).map(s => `${esc(productNames.get(s.productId) ?? s.productId)} × ${s.quantity}`).join(" · ")}${stock.length > 4 ? ` · y ${stock.length - 4} más` : ""}</p>` : ""}
      <div class="grid-3"><button type="button" class="btn btn-secondary" data-act="send">Enviar</button><button type="button" class="btn btn-secondary" data-act="collect" ${units ? "" : "disabled"}>Recoger</button><button type="button" class="btn btn-primary" data-act="settle" ${units ? "" : "disabled"}>Liquidar</button></div>
    </div>`;
  }));
  box.innerHTML = `
    <p class="t-sm muted">Aquí va la mercancía que <b>la tienda deja a un cliente</b> para que él la venda: sigue siendo de la tienda hasta que la liquides, y entonces el total pasa a su fiado.</p>
    <div class="notice info">${icon("alert")}<div><b>¿Te dan mercancía a ti para vender?</b> (Casa Bella, Cítricos Caribe, las socias…) Eso no va aquí: véndela normal en <b>Vender</b>. En el panel de la dueña cada producto tiene marcado su dueño, y al venderlo la app apunta sola lo que hay que pagarle.</div></div>
    ${store ? "" : `<div class="notice warn">${icon("alert")}<div><b>Falta la ubicación principal</b>Créala en Inventario → Ubicaciones y conteos.</div></div>`}
    ${cards.join("") || `<p class="muted">Sin clientes en consignación.</p>`}
    <form id="fin-consign-new" class="nx-form">
      <h3 class="t-lg">Nuevo cliente en consignación</h3>
      <label class="field">Cliente<input class="input" name="customer" required placeholder="Nombre o teléfono"></label>
      <label class="field">Moneda de los precios<select class="input" name="currency">${currencyOptions()}</select></label>
      <button type="submit" class="btn btn-primary btn-block">Crear</button>
    </form>`;
  box.querySelectorAll<HTMLElement>("[data-account]").forEach(card => {
    const account = accounts.find(a => a.location_id === card.dataset.account)!;
    card.querySelectorAll<HTMLButtonElement>("[data-act]").forEach(b => (b.onclick = () => {
      if (b.dataset.act === "settle") return void settleSheet(account);
      if (!store) return say("Primero crea la ubicación principal en Inventario", "error");
      consignmentMoveSheet(account, b.dataset.act as "send" | "collect", store);
    }));
  });
  const form = box.querySelector<HTMLFormElement>("#fin-consign-new")!;
  form.onsubmit = e => {
    e.preventDefault();
    void run("Cliente en consignación creado", async () => {
      const customer = field(form, "customer").value.trim();
      const locationId = id();
      await invoke("inventory_create_location", {
        input: { locationId, outboxId: id(), name: `Consignación · ${customer}`, kind: "consignment", branchId: null, isDefault: false, authoritySystem: null, createdAt: now() },
      });
      await invoke("consignment_open_account", {
        input: { locationId, outboxId: id(), customerId: customer, currency: field<HTMLSelectElement>(form, "currency").value, createdAt: now() },
      });
      requestSync();
      await renderConsignment();
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
  void renderConsignment().catch(e => say(String(e), "error"));
  await Promise.all([renderShift(), mountReturns(), renderLocations(), mountSync(root.querySelector<HTMLElement>("#fin-sync")!), mountBusinessSummary(root.querySelector<HTMLElement>("#fin-summary")!)]).catch(e => say(String(e), "error"));
}
