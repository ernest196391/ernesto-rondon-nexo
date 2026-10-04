// Checkout: pay one sale with up to four payments in any currency.
//
// Sales are priced in USD. Each payment is entered in its own currency and
// converted with the rate the owners set in the dashboard (units per USD).
// The USD values must add up exactly to the total (Rust checks it again);
// extra cash becomes change and is recorded net on the last cash payment.
import { invoke } from "@tauri-apps/api/core";
import { icon, openSheet } from "./ui";

export type PaymentInput = {
  paymentId: string;
  method: "cash" | "transfer" | "crypto";
  currency: string;
  amountMinor: number;
  usdMinor: number;
  exchangeRate: string | null;
  provider: string | null;
  externalRef: string | null;
};

type Rate = { currency: string; perUsd: string; setAt: string };

type MethodDef = {
  key: string;
  label: string;
  method: PaymentInput["method"];
  currency: string;
  provider?: string;
  /** Asks which app/bank the transfer came through. */
  providers?: string[];
  needsRef: boolean;
  /** Rate entry when it is not the currency itself (Zelle: USD with a surcharge). */
  rateKey?: string;
};

const METHODS: MethodDef[] = [
  { key: "cash-usd", label: "Efectivo USD", method: "cash", currency: "USD", needsRef: false },
  { key: "cash-cup", label: "Efectivo CUP", method: "cash", currency: "CUP", needsRef: false },
  { key: "transfer-cup", label: "Transferencia CUP", method: "transfer", currency: "CUP", providers: ["Transfermóvil", "EnZona"], needsRef: true },
  { key: "transfer-mlc", label: "MLC", method: "transfer", currency: "MLC", provider: "tarjeta mlc", needsRef: true },
  { key: "zelle", label: "Zelle", method: "transfer", currency: "USD", provider: "zelle", rateKey: "ZELLE", needsRef: true },
  { key: "usdt", label: "USDT", method: "crypto", currency: "USDT", provider: "usdt", needsRef: true },
  { key: "crypto", label: "Otra cripto", method: "crypto", currency: "USD", provider: "cripto", needsRef: true },
];

const MAX_PAYMENTS = 3;

type Row = { id: string; def: MethodDef; amountMinor: number; provider: string; ref: string };

const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const fmt = (minor: number, currency: string) =>
  `${(minor / 100).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

const methodIcon = (m: MethodDef) => icon(m.method === "cash" ? "cash" : "transfer");

const keyOf = (m: MethodDef) => m.rateKey ?? m.currency;

/** Units per USD for a rate key; USD is 1, USDT and Zelle default to 1 until the owners set them. */
function rateOf(rates: Map<string, Rate>, currency: string): number | null {
  if (currency === "USD") return 1;
  const r = Number(rates.get(currency)?.perUsd);
  if (Number.isFinite(r) && r > 0) return r;
  return currency === "USDT" || currency === "ZELLE" ? 1 : null;
}

function rateText(rates: Map<string, Rate>, currency: string) {
  return rates.get(currency)?.perUsd ?? (currency === "USDT" || currency === "ZELLE" ? "1" : null);
}

function ago(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `hace ${hours} h` : `hace ${Math.round(hours / 24)} días`;
}

/** Converts the rows to payments; change comes off the last cash row. */
function settle(rows: Row[], totalMinor: number, rates: Map<string, Rate>) {
  const payments: PaymentInput[] = rows.map(row => {
    const rate = rateOf(rates, keyOf(row.def))!;
    return {
      paymentId: row.id,
      method: row.def.method,
      currency: row.def.currency,
      amountMinor: row.amountMinor,
      usdMinor: Math.round(row.amountMinor / rate),
      exchangeRate: keyOf(row.def) === "USD" ? null : rateText(rates, keyOf(row.def)),
      provider: row.def.providers ? row.provider : row.def.provider ?? null,
      externalRef: row.ref.trim() || null,
    };
  });
  let paid = payments.reduce((sum, p) => sum + p.usdMinor, 0);

  // Rounding: a foreign-currency payment may land one cent off per row.
  const foreign = payments.filter(p => p.currency !== "USD");
  const drift = totalMinor - paid;
  if (drift !== 0 && foreign.length && Math.abs(drift) <= foreign.length) {
    foreign[foreign.length - 1].usdMinor += drift;
    paid = totalMinor;
  }

  let changeMinor = 0;
  let changeCurrency = "USD";
  let changeLocal = 0;
  if (paid > totalMinor) {
    const cash = [...payments].reverse().find(p => p.method === "cash");
    changeMinor = paid - totalMinor;
    if (cash) {
      const rate = rateOf(rates, cash.currency)!;
      changeCurrency = cash.currency;
      changeLocal = cash.currency === "USD" ? changeMinor : Math.round(changeMinor * rate);
      if (changeLocal < cash.amountMinor) {
        cash.amountMinor -= changeLocal;
        cash.usdMinor -= changeMinor;
        paid = totalMinor;
      }
    }
  }
  return { payments, paid, remaining: totalMinor - paid, changeMinor, changeCurrency, changeLocal };
}

/**
 * Opens the checkout sheet. Resolves with the payments, or null if the
 * seller closes it.
 */
export async function openCheckout(totalMinor: number): Promise<PaymentInput[] | null> {
  let rateList: Rate[] = [];
  try {
    rateList = await invoke<Rate[]>("rates_current");
  } catch {
    rateList = [];
  }
  const rates = new Map(rateList.map(r => [r.currency, r]));
  const rows: Row[] = [];

  const panel = openSheet(`
      <div class="sheet-head"><h2>Cobrar ${fmt(totalMinor, "USD")}</h2><button type="button" class="btn btn-ghost checkout-cancel">Cancelar</button></div>
      <p class="t-sm muted checkout-rates"></p>
      <div class="checkout-rows" style="display: flex; flex-direction: column; gap: 8px"></div>
      <p class="t-xs muted" style="font-weight: 700">AÑADIR FORMA DE PAGO (MÁX. ${MAX_PAYMENTS})</p>
      <div class="methods checkout-methods"></div>
      <div class="kv"><span style="font-weight: 700">Cubierto</span><span class="badge checkout-balance" aria-live="polite" style="font-size: 15px"></span></div>
      <p class="t-sm checkout-error" role="alert" style="color: var(--nx-danger); font-weight: 700"></p>
      <button type="button" class="btn btn-primary btn-xl btn-block checkout-confirm">Confirmar venta</button>`, "Cobrar");
  const sheet = panel.el;

  const $ = <T extends HTMLElement>(sel: string) => sheet.querySelector<T>(sel)!;
  const cup = rateOf(rates, "CUP");
  const rateParts = ["CUP", "MLC", "USDT", "ZELLE"]
    .filter(c => rates.has(c))
    .map(c => `${c} ${escapeHtml(rates.get(c)!.perUsd)}`);
  const newest = rateList.map(r => r.setAt).sort().pop();
  $(".checkout-rates").innerHTML = icon("clock", "sm") + " " + escapeHtml(rateParts.length
    ? `${cup ? `= ${fmt(Math.round(totalMinor * cup), "CUP")} · ` : ""}Tasas: ${rateParts.join(" · ")}${newest ? ` (${ago(newest)})` : ""}`
    : "Sin tasas de cambio: el dueño las fija en el panel. Solo USD disponible.");

  $(".checkout-methods").innerHTML = METHODS.map(m => {
    const missing = rateOf(rates, keyOf(m)) === null;
    return `<button type="button" class="method-btn" data-key="${m.key}" ${missing ? `disabled title="Falta la tasa ${m.currency} en el panel"` : ""}>${icon("plus", "sm")}${escapeHtml(m.label)}</button>`;
  }).join("");

  const render = () => {
    const s = settle(rows, totalMinor, rates);
    $(".checkout-rows").innerHTML = rows.map((row, i) => {
      const rate = rateOf(rates, keyOf(row.def))!;
      const usd = keyOf(row.def) === "USD" ? "" : ` ≈ ${fmt(Math.round(row.amountMinor / rate), "USD")}`;
      const missingRef = row.def.needsRef && !row.ref.trim();
      return `<div class="pay checkout-row${missingRef ? " is-active" : ""}" data-i="${i}">
        <span class="method">${methodIcon(row.def)}${escapeHtml(row.def.label)}<button type="button" class="btn btn-ghost btn-icon checkout-remove" aria-label="Quitar pago">${icon("trash", "sm")}</button></span>
        <label class="amount"><input class="checkout-amount num" inputmode="decimal" aria-label="Importe en ${row.def.currency}" value="${(row.amountMinor / 100).toFixed(2)}" style="width: 96px; border: 0; background: transparent; font: inherit; text-align: right"><small>${row.def.currency}</small></label>
        ${usd ? `<span class="t-xs muted" style="grid-column: 1 / -1; margin-top: -6px">${usd}</span>` : ""}
        ${row.def.providers ? `<label class="field" style="grid-column: 1 / -1">Vía<select class="input checkout-provider">${row.def.providers.map(p => `<option ${p === row.provider ? "selected" : ""}>${p}</option>`).join("")}</select></label>` : ""}
        ${row.def.needsRef ? `<label class="ref${missingRef ? " is-missing" : ""}">${icon(missingRef ? "alert" : "check", "sm")}<input class="checkout-ref" autocomplete="off" value="${escapeHtml(row.ref)}" placeholder="Referencia de la transacción" style="flex: 1; border: 0; background: transparent; font: inherit; color: inherit; min-height: 40px"></label>` : ""}
      </div>`;
    }).join("");
    sheet.querySelectorAll<HTMLElement>(".checkout-row").forEach(el => {
      const row = rows[Number(el.dataset.i)];
      el.querySelector<HTMLButtonElement>(".checkout-remove")!.onclick = () => {
        rows.splice(rows.indexOf(row), 1);
        render();
      };
      const amount = el.querySelector<HTMLInputElement>(".checkout-amount")!;
      amount.onchange = () => {
        const value = Number(amount.value.replace(",", "."));
        row.amountMinor = Number.isFinite(value) && value > 0 ? Math.round(value * 100) : 0;
        render();
      };
      const ref = el.querySelector<HTMLInputElement>(".checkout-ref");
      if (ref) {
        ref.oninput = () => (row.ref = ref.value);
        ref.onchange = () => render();
      }
      const provider = el.querySelector<HTMLSelectElement>(".checkout-provider");
      if (provider) provider.onchange = () => (row.provider = provider.value);
    });

    const balance = $(".checkout-balance");
    if (s.remaining > 0) {
      balance.textContent = `Falta ${fmt(s.remaining, "USD")}${cup ? ` (${fmt(Math.ceil(s.remaining * cup), "CUP")})` : ""}`;
      balance.className = "badge badge-low checkout-balance";
    } else if (s.changeMinor > 0 && s.remaining === 0) {
      balance.textContent = `Cambio a devolver: ${fmt(s.changeLocal, s.changeCurrency)}`;
      balance.className = "badge badge-info checkout-balance";
    } else if (s.remaining < 0) {
      balance.textContent = `Sobran ${fmt(-s.remaining, "USD")}: solo el efectivo admite cambio`;
      balance.className = "badge badge-out checkout-balance";
    } else {
      balance.textContent = `Completo · ${fmt(totalMinor, "USD")}`;
      balance.className = "badge badge-ok checkout-balance";
    }
    $(".checkout-error").textContent = "";
  };

  const addMethod = (def: MethodDef) => {
    const rate = rateOf(rates, keyOf(def));
    if (rate === null) {
      $(".checkout-error").textContent = `Falta la tasa ${def.currency}: el dueño la fija en el panel.`;
      return;
    }
    if (rows.length >= MAX_PAYMENTS) {
      $(".checkout-error").textContent = `Como máximo ${MAX_PAYMENTS} formas de pago.`;
      return;
    }
    const remaining = Math.max(settle(rows, totalMinor, rates).remaining, 0);
    rows.push({
      id: crypto.randomUUID(),
      def,
      amountMinor: keyOf(def) === "USD" ? remaining : Math.ceil(remaining * rate),
      provider: def.providers?.[0] ?? "",
      ref: "",
    });
    render();
    sheet.querySelectorAll<HTMLInputElement>(".checkout-amount").item(rows.length - 1)?.select();
  };
  sheet.querySelectorAll<HTMLButtonElement>(".checkout-methods .method-btn").forEach(b => {
    b.onclick = () => addMethod(METHODS.find(m => m.key === b.dataset.key)!);
  });
  render();

  return new Promise(resolve => {
    let result: PaymentInput[] | null = null;
    const close = (r: PaymentInput[] | null) => {
      result = r;
      panel.close();
    };
    void panel.closed.then(() => resolve(result));
    $(".checkout-cancel").onclick = () => close(null);
    $(".checkout-confirm").onclick = () => {
      const s = settle(rows, totalMinor, rates);
      const error = $(".checkout-error");
      if (!rows.length) return void (error.textContent = "Elige cómo paga el cliente.");
      if (rows.some(r => r.amountMinor <= 0)) return void (error.textContent = "Hay un pago sin importe.");
      if (s.remaining !== 0) return void (error.textContent = "Los pagos no cuadran con el total.");
      if (rows.some(r => r.def.needsRef && !r.ref.trim())) return void (error.textContent = "Falta la referencia de una transferencia.");
      close(s.payments);
    };
  });
}

/** Payment summary for receipts, e.g. "Efectivo USD 20,00 USD · Transferencia CUP 8.330,00 CUP (ref 4821)". */
export function describePayments(payments: PaymentInput[]) {
  return payments.map(p => {
    const def = METHODS.find(m => m.method === p.method && m.currency === p.currency && (!m.provider || m.provider === p.provider))
      ?? METHODS.find(m => m.method === p.method && m.currency === p.currency);
    const label = p.provider && def?.providers ? `${def.label} (${p.provider})` : def?.label ?? p.method;
    return `${label} ${fmt(p.amountMinor, p.currency)}${p.externalRef ? ` · ref ${p.externalRef}` : ""}`;
  });
}

/** Pulls the rates in force for this device's business. */
export async function pullRates(endpoint: string, deviceToken: string) {
  const response = await fetch(endpoint.replace(/nexo-sync-push\/?$/, "nexo-rates-pull"), { headers: { "x-nexo-device-token": deviceToken } });
  if (!response.ok) throw new Error(`Tasas: HTTP ${response.status}`);
  const { rates } = (await response.json()) as { rates: Array<{ currency: string; perUsd: number | string; setAt: string }> };
  if (!Array.isArray(rates)) return;
  await invoke("rates_replace", {
    rates: rates.map(r => ({ currency: r.currency, perUsd: String(r.perUsd), setAt: r.setAt })),
    fetchedAt: new Date().toISOString(),
  });
}
