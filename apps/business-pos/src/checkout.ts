// Checkout: pay one sale with up to four payments in any currency.
//
// Sales are priced in USD. Each payment is entered in its own currency and
// converted with the rate the owners set in the dashboard (units per USD).
// The USD values must add up exactly to the total (Rust checks it again);
// extra cash becomes change and is recorded net on the last cash payment.
import { invoke } from "@tauri-apps/api/core";

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
};

const METHODS: MethodDef[] = [
  { key: "cash-usd", label: "Efectivo USD", method: "cash", currency: "USD", needsRef: false },
  { key: "cash-cup", label: "Efectivo CUP", method: "cash", currency: "CUP", needsRef: false },
  { key: "transfer-cup", label: "Transferencia CUP", method: "transfer", currency: "CUP", providers: ["Transfermóvil", "EnZona"], needsRef: true },
  { key: "transfer-mlc", label: "MLC", method: "transfer", currency: "MLC", provider: "tarjeta mlc", needsRef: true },
  { key: "zelle", label: "Zelle", method: "transfer", currency: "USD", provider: "zelle", needsRef: true },
  { key: "usdt", label: "USDT", method: "crypto", currency: "USDT", provider: "usdt", needsRef: true },
  { key: "crypto", label: "Otra cripto", method: "crypto", currency: "USD", provider: "cripto", needsRef: true },
];

const MAX_PAYMENTS = 4;

type Row = { id: string; def: MethodDef; amountMinor: number; provider: string; ref: string };

const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const fmt = (minor: number, currency: string) =>
  `${(minor / 100).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

/** Units of `currency` per USD; USD is 1, USDT defaults to 1 until the owners set it. */
function rateOf(rates: Map<string, Rate>, currency: string): number | null {
  if (currency === "USD") return 1;
  const r = Number(rates.get(currency)?.perUsd);
  if (Number.isFinite(r) && r > 0) return r;
  return currency === "USDT" ? 1 : null;
}

function rateText(rates: Map<string, Rate>, currency: string) {
  return rates.get(currency)?.perUsd ?? (currency === "USDT" ? "1" : null);
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
    const rate = rateOf(rates, row.def.currency)!;
    return {
      paymentId: row.id,
      method: row.def.method,
      currency: row.def.currency,
      amountMinor: row.amountMinor,
      usdMinor: Math.round(row.amountMinor / rate),
      exchangeRate: row.def.currency === "USD" ? null : rateText(rates, row.def.currency),
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

  const sheet = document.createElement("div");
  sheet.className = "sale-sheet checkout";
  sheet.innerHTML = `
    <button class="sale-sheet-backdrop" aria-label="Cerrar cobro"></button>
    <section class="sale-sheet-card" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div class="sale-sheet-handle"></div>
      <div class="sale-sheet-head">
        <div><small>COBRAR</small><h2 id="checkout-title">${fmt(totalMinor, "USD")}</h2></div>
      </div>
      <p class="checkout-rates"></p>
      <div class="checkout-methods"></div>
      <div class="checkout-rows"></div>
      <p class="checkout-balance" aria-live="polite"></p>
      <p class="checkout-error" role="alert"></p>
      <button type="button" class="checkout-confirm">Confirmar venta</button>
      <button type="button" class="sale-sheet-close">Cancelar</button>
    </section>`;
  document.body.appendChild(sheet);

  const $ = <T extends HTMLElement>(sel: string) => sheet.querySelector<T>(sel)!;
  const cup = rateOf(rates, "CUP");
  const rateParts = ["CUP", "MLC", "USDT"]
    .filter(c => rates.has(c))
    .map(c => `${c} ${escapeHtml(rates.get(c)!.perUsd)}`);
  const newest = rateList.map(r => r.setAt).sort().pop();
  $(".checkout-rates").textContent = rateParts.length
    ? `${cup ? `= ${fmt(Math.round(totalMinor * cup), "CUP")} · ` : ""}Tasas: ${rateParts.join(" · ")}${newest ? ` (${ago(newest)})` : ""}`
    : "Sin tasas de cambio: el dueño las fija en el panel. Solo USD disponible.";

  $(".checkout-methods").innerHTML = METHODS.map(m => {
    const missing = rateOf(rates, m.currency) === null;
    return `<button type="button" class="chip" data-key="${m.key}" ${missing ? `aria-disabled="true" title="Falta la tasa ${m.currency} en el panel"` : ""}>${escapeHtml(m.label)}</button>`;
  }).join("");

  const render = () => {
    const s = settle(rows, totalMinor, rates);
    $(".checkout-rows").innerHTML = rows.map((row, i) => {
      const rate = rateOf(rates, row.def.currency)!;
      const usd = row.def.currency === "USD" ? "" : ` ≈ ${fmt(Math.round(row.amountMinor / rate), "USD")}`;
      return `<div class="checkout-row" data-i="${i}">
        <div class="checkout-row-head"><strong>${escapeHtml(row.def.label)}</strong><button type="button" class="checkout-remove" aria-label="Quitar pago">×</button></div>
        <label>Importe en ${row.def.currency}<input class="checkout-amount" inputmode="decimal" value="${(row.amountMinor / 100).toFixed(2)}"></label>
        <span class="fin-muted">${usd}</span>
        ${row.def.providers ? `<label>Vía<select class="checkout-provider">${row.def.providers.map(p => `<option ${p === row.provider ? "selected" : ""}>${p}</option>`).join("")}</select></label>` : ""}
        ${row.def.needsRef ? `<label>Referencia<input class="checkout-ref" autocomplete="off" value="${escapeHtml(row.ref)}" placeholder="Nº de transacción"></label>` : ""}
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
      if (ref) ref.oninput = () => (row.ref = ref.value);
      const provider = el.querySelector<HTMLSelectElement>(".checkout-provider");
      if (provider) provider.onchange = () => (row.provider = provider.value);
    });

    const balance = $(".checkout-balance");
    if (s.remaining > 0) {
      balance.textContent = `Falta ${fmt(s.remaining, "USD")}${cup ? ` (${fmt(Math.ceil(s.remaining * cup), "CUP")})` : ""}`;
      balance.dataset.tone = "due";
    } else if (s.changeMinor > 0 && s.remaining === 0) {
      balance.textContent = `Cambio: ${fmt(s.changeLocal, s.changeCurrency)}`;
      balance.dataset.tone = "ok";
    } else if (s.remaining < 0) {
      balance.textContent = `Sobran ${fmt(-s.remaining, "USD")}: solo el efectivo admite cambio`;
      balance.dataset.tone = "due";
    } else {
      balance.textContent = "Pagado completo";
      balance.dataset.tone = "ok";
    }
    $(".checkout-error").textContent = "";
  };

  const addMethod = (def: MethodDef) => {
    const rate = rateOf(rates, def.currency);
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
      amountMinor: def.currency === "USD" ? remaining : Math.ceil(remaining * rate),
      provider: def.providers?.[0] ?? "",
      ref: "",
    });
    render();
    sheet.querySelectorAll<HTMLInputElement>(".checkout-amount").item(rows.length - 1)?.select();
  };
  sheet.querySelectorAll<HTMLButtonElement>(".checkout-methods .chip").forEach(b => {
    b.onclick = () => addMethod(METHODS.find(m => m.key === b.dataset.key)!);
  });
  render();

  return new Promise(resolve => {
    const close = (result: PaymentInput[] | null) => {
      sheet.remove();
      resolve(result);
    };
    $(".sale-sheet-backdrop").onclick = () => close(null);
    $(".sale-sheet-close").onclick = () => close(null);
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
