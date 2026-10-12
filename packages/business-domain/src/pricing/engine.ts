// Motor de precios NEXO / Casa Viva — función pura (sin base de datos, sin red, sin reloj).
// Entra: costo, flete, gastos fijos, capas de reglas, recargo de la gestora, tasa y perfil.
// Sale: precio sugerido, suelo, comisión, ganancia del dueño, guardias y el «recibo del precio».
// Diseño: docs/nexo-business/motor-de-precios.md (§2 capas, §3 recibo, «Respuestas de Lennys», D43).
import type {
  CommissionOverride,
  CommissionRule,
  CostBreakdown,
  Guard,
  PriceEvaluation,
  PriceInput,
  PriceQuote,
  PriceReceipt,
  PriceRules,
  PriceRulesPatch,
  PricingPolicy,
  ReceiptStep,
  RoundingRule,
} from "./types";

export const PRICING_ENGINE_VERSION = "1.0.0";

const EPS = 1e-9;
const MAX_SEARCH_STEPS = 2000;

export function round2(n: number): number {
  return Math.round((n + Math.sign(n) * EPS) * 100) / 100;
}

function ceilTo(value: number, step: number): number {
  return Math.ceil(value / step - EPS) * step;
}

// ---------------------------------------------------------------- capas

function mergeRules(base: PriceRules, patch: PriceRulesPatch | undefined): PriceRules {
  if (!patch) return base;
  const { commission, rounding, ...rest } = patch;
  const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
  return {
    ...base,
    ...clean,
    commission: { ...base.commission, ...(commission ?? {}) } as CommissionRule,
    rounding: { ...base.rounding, ...(rounding ?? {}) } as RoundingRule,
  };
}

/** Regla que manda = general (perfil) → consignación → categoría → proveedor → producto → ajuste puntual. */
export function resolveRules(policy: PricingPolicy, input: PriceInput): { rules: PriceRules; layers: string[] } {
  const profile = policy.profiles[input.profile];
  if (!profile) throw new Error(`Perfil de precios desconocido: ${input.profile}`);
  let rules = profile.rules;
  const layers = [`perfil:${input.profile}`];
  if (input.consignment && profile.consignacion) {
    rules = mergeRules(rules, profile.consignacion);
    layers.push("consignacion");
  }
  const cat = input.category ? policy.layers.category[input.category] : undefined;
  if (cat) { rules = mergeRules(rules, cat); layers.push(`categoria:${input.category}`); }
  const sup = input.supplierId ? policy.layers.supplier[input.supplierId] : undefined;
  if (sup) { rules = mergeRules(rules, sup); layers.push(`proveedor:${input.supplierId}`); }
  const prod = policy.layers.product[input.productId];
  if (prod) { rules = mergeRules(rules, prod); layers.push(`producto:${input.productId}`); }
  if (input.overrides) { rules = mergeRules(rules, input.overrides); layers.push("ajuste-puntual"); }
  return { rules, layers };
}

// ---------------------------------------------------------------- redondeo

export function roundingStep(rounding: RoundingRule, priceUsd: number): number {
  for (const tier of rounding.tiers) {
    if (tier.upToUsd === null || priceUsd <= tier.upToUsd + EPS) return tier.stepUsd;
  }
  return rounding.tiers[rounding.tiers.length - 1]?.stepUsd ?? 1;
}

/** Siempre hacia arriba (modo ceil) a un escalón «bonito» según el tramo. */
export function roundPrice(rounding: RoundingRule, priceUsd: number): number {
  const step = roundingStep(rounding, priceUsd);
  const rounded = rounding.mode === "round" ? Math.round(priceUsd / step) * step : ceilTo(priceUsd, step);
  return round2(rounded);
}

function nextPrice(rounding: RoundingRule, priceUsd: number): number {
  return round2(priceUsd + roundingStep(rounding, priceUsd + EPS));
}

export function cupFor(priceUsd: number, rateCup: number | null | undefined, cupStep: number): number | null {
  if (!rateCup || rateCup <= 0) return null;
  return ceilTo(priceUsd * rateCup, cupStep || 1);
}

// ---------------------------------------------------------------- costo

export function fixedShareFromPolicy(policy: PricingPolicy, rateCup: number | null | undefined): number | null {
  const fc = policy.fixedCosts;
  if (!fc || !rateCup || rateCup <= 0 || fc.unitsPerMonth <= 0) return null;
  return fc.monthlyCup / rateCup / fc.unitsPerMonth;
}

export function costBreakdown(input: PriceInput, rules: PriceRules, policy?: PricingPolicy): CostBreakdown {
  if (!input.cost) throw new Error("Sin costo de compra: el motor no calcula precio (D11)");
  const { amount, currency, purchaseRate } = input.cost;
  const rate = currency.toUpperCase() === "USD" ? 1 : purchaseRate;
  if (!(rate > 0)) throw new Error("La tasa de compra debe ser mayor que 0");
  const purchaseUsd = amount / rate;
  const freightUsd = input.freightUsd ?? 0;
  let fixedShareUsd = 0;
  if (rules.includeFixedCosts) {
    fixedShareUsd = input.fixedCostShareUsd ?? (policy ? fixedShareFromPolicy(policy, input.rates?.cup) ?? 0 : 0);
  }
  const base = purchaseUsd + freightUsd + fixedShareUsd;
  const totalUsd = base * (1 + rules.contingencyPct / 100);
  return {
    purchaseUsd: round2(purchaseUsd),
    freightUsd: round2(freightUsd),
    fixedShareUsd: round2(fixedShareUsd),
    contingencyUsd: round2(totalUsd - base),
    totalUsd,
  };
}

// ---------------------------------------------------------------- reparto a un precio dado

function markupUsd(input: PriceInput, priceUsd: number): number {
  const m = input.gestoraMarkup;
  if (!m || m.value <= 0) return 0;
  return m.mode === "pct" ? (priceUsd * m.value) / 100 : m.value;
}

interface Split { commission: number; owner: number; gestoraTotal: number }

function splitAt(rules: PriceRules, priceUsd: number, costTotal: number, commission: number, markup: number): Split {
  const variable = (priceUsd * rules.variablePct) / 100;
  const owner = priceUsd - costTotal - variable - commission;
  const gestoraTotal = commission + markup;
  return { commission, owner, gestoraTotal };
}

/**
 * Evalúa un precio: comisión (con la guardia de Lennys), ganancia del dueño y avisos.
 * `override` = comisión que ya existe (la de hoy en la web) para comparar con la regla.
 */
export function evaluateAtPrice(
  policy: PricingPolicy,
  input: PriceInput,
  priceUsd: number,
  override?: CommissionOverride,
  resolved?: { rules: PriceRules; layers: string[] },
  steps?: ReceiptStep[],
): PriceEvaluation {
  const { rules } = resolved ?? resolveRules(policy, input);
  const costs = costBreakdown(input, rules, policy);
  const costTotal = costs.totalUsd;
  const markup = markupUsd(input, priceUsd);
  const variableUsd = (priceUsd * rules.variablePct) / 100;
  const margin = priceUsd - costTotal;
  const guards: Guard[] = [];
  const c = rules.commission;
  const minOwner = rules.minOwnerProfitUsd;
  const log = (step: string, rule: string, detail: string, usd?: number) => steps?.push({ step, rule, detail, usd: usd === undefined ? undefined : round2(usd) });

  let commission: number;
  let source: string;
  let before: number;

  if (override) {
    commission = override.mode === "fixed_usd" ? override.value : (priceUsd * override.value) / 100;
    source = override.source ?? `actual:${override.mode}`;
  } else if (c.mode === "share_of_margin") {
    // D43 / bolsa: la gestora tiene derecho a sharePct del margen (precio − compra − flete).
    const share = Math.max(0, (margin * (c.sharePct ?? 0)) / 100);
    commission = rules.gestoraMarkupMode === "se-descuenta" ? Math.max(0, share - markup) : share;
    source = `regla:${c.sharePct}%-del-margen${rules.gestoraMarkupMode === "se-descuenta" ? "-menos-recargo" : ""}`;
    log("reparto", "commission.share_of_margin", `${c.sharePct} % de ${round2(margin)} = ${round2(share)}; el recargo propio (${round2(markup)}) ${rules.gestoraMarkupMode === "se-descuenta" ? "cuenta dentro" : "va aparte"}`, commission);
  } else if (c.mode === "fixed_usd") {
    commission = c.fixedUsd ?? 0;
    source = "regla:fija";
    log("comision", "commission.fixed_usd", `fija por producto`, commission);
  } else {
    const pct = c.pct ?? 0;
    commission = c.roundUpToUsd ? ceilTo((priceUsd * pct) / 100, c.roundUpToUsd) : (priceUsd * pct) / 100;
    source = `regla:${pct}%`;
    log("comision", "commission.pct_of_price", `${pct} % de ${priceUsd} hacia arriba a ${c.roundUpToUsd ?? 0} USD`, commission);
    if (c.balanceWithOwner && c.maxPct && c.maxPct > pct) {
      const cap = ceilTo((priceUsd * c.maxPct) / 100, c.roundUpToUsd || 1);
      const start = commission;
      while (commission + 1 <= cap + EPS && splitAt(rules, priceUsd, costTotal, commission + 1, markup).owner >= commission + 1 - EPS) commission += 1;
      if (commission > start) log("comision", "commission.balanceWithOwner", `sube hasta ${c.maxPct} % porque la tienda sigue ganando al menos lo mismo que la gestora`, commission);
    }
  }
  before = commission;

  // Guardia de Lennys: si el dueño gana menos del mínimo, la comisión baja (nunca de minUsd).
  const guardOn = rules.reduceCommissionToProtectOwner && !(override?.skipGuard);
  if (guardOn) {
    const floor = c.minUsd ?? 0;
    while (splitAt(rules, priceUsd, costTotal, commission, markup).owner < minOwner - EPS && commission - 1 >= floor - EPS) commission -= 1;
    if (commission < before) {
      guards.push({ code: "comision-reducida", severity: "info", message: `La comisión baja de ${round2(before)} a ${round2(commission)} USD para que la tienda gane al menos ${minOwner} USD` });
      log("guardia", "minOwnerProfitUsd", `comisión ${round2(before)} → ${round2(commission)}`, commission);
    }
  }

  const split = splitAt(rules, priceUsd, costTotal, commission, markup);
  const gestoraTotal = rules.gestoraMarkupMode === "se-descuenta" && !override ? Math.max(commission + markup, 0) : commission + markup;
  const ownerProfit = split.owner;
  const ownerMarginPct = priceUsd > 0 ? (ownerProfit / priceUsd) * 100 : 0;

  // ---- avisos
  if (priceUsd + EPS < costs.purchaseUsd) {
    guards.push({ code: "bajo-costo", severity: "bloqueo", message: `Se vende a ${priceUsd} y la compra cuesta ${costs.purchaseUsd} USD` });
  }
  if (ownerProfit < -EPS) {
    guards.push({ code: "perdida-tras-comision", severity: "bloqueo", message: `Después de comisión y gastos queda ${round2(ownerProfit)} USD (pérdida)` });
  } else if (ownerProfit < minOwner - EPS) {
    guards.push({ code: "ganancia-minima-no-alcanzada", severity: "aviso", message: `Queda ${round2(ownerProfit)} USD; el mínimo es ${minOwner} USD` });
  }
  const unit = costs.purchaseUsd;
  if (unit > 0 && priceUsd > 0) {
    const ratio = unit / priceUsd;
    if (ratio >= 5) guards.push({ code: "posible-cup-como-usd", severity: "aviso", message: `El costo (${unit}) es ${round2(ratio)} veces el precio: ¿se apuntó en CUP como si fuera USD?` });
    else if (ratio > 1) guards.push({ code: "posible-paquete", severity: "aviso", message: `El costo (${unit}) es mayor que el precio (${priceUsd}): ¿es el costo del paquete y no de la unidad?` });
    else if (ratio < 0.15) guards.push({ code: "costo-muy-bajo", severity: "info", message: `El costo es solo el ${round2(ratio * 100)} % del precio: confirma que es el de una unidad y en USD` });
  }
  if (rules.gestoraMarkupWarnPct && markup > 0 && (markup / priceUsd) * 100 > rules.gestoraMarkupWarnPct + EPS) {
    guards.push({ code: "recargo-gestora-alto", severity: "aviso", message: `El recargo de la gestora es ${round2((markup / priceUsd) * 100)} % del precio (aviso a partir de ${rules.gestoraMarkupWarnPct} %)` });
  }

  const rateCup = input.rates?.cup ?? null;
  return {
    priceUsd: round2(priceUsd),
    priceCup: cupFor(priceUsd, rateCup, rules.rounding.cupStep),
    rateCup,
    costs: { ...costs, totalUsd: round2(costs.totalUsd) },
    marginUsd: round2(margin),
    variableUsd: round2(variableUsd),
    commissionUsd: round2(commission),
    commissionBeforeGuardUsd: round2(before),
    commissionSource: source,
    gestora: { markupUsd: round2(markup), totalUsd: round2(gestoraTotal), salePriceUsd: round2(priceUsd + markup) },
    ownerProfitUsd: round2(ownerProfit),
    ownerMarginPct: round2(ownerMarginPct),
    guards,
  };
}

// ---------------------------------------------------------------- precio sugerido

function meetsFloor(rules: PriceRules, ev: PriceEvaluation): boolean {
  if (ev.ownerProfitUsd < -EPS) return false;
  if (rules.minNetMarginPct !== undefined && ev.ownerMarginPct + EPS < rules.minNetMarginPct) return false;
  if (rules.raisePriceToMinOwnerProfit && ev.ownerProfitUsd + EPS < rules.minOwnerProfitUsd) return false;
  return true;
}

function meetsTarget(rules: PriceRules, ev: PriceEvaluation): boolean {
  if (!meetsFloor(rules, ev)) return false;
  if (rules.method === "target_margin" && rules.targetNetMarginPct !== undefined) {
    // El precio sugerido debe dejar el margen objetivo con la comisión COMPLETA de la gestora:
    // la guardia (bajar la comisión) es para precios de mercado, no para abaratar la sugerencia.
    const ownerWithFullCommission = ev.ownerProfitUsd - (ev.commissionBeforeGuardUsd - ev.commissionUsd);
    return ev.priceUsd > 0 && (ownerWithFullCommission / ev.priceUsd) * 100 + EPS >= rules.targetNetMarginPct;
  }
  return true;
}

function search(policy: PricingPolicy, input: PriceInput, resolved: { rules: PriceRules; layers: string[] }, start: number, ok: (ev: PriceEvaluation) => boolean): number {
  let price = roundPrice(resolved.rules.rounding, Math.max(start, 0.01));
  for (let i = 0; i < MAX_SEARCH_STEPS; i++) {
    const ev = evaluateAtPrice(policy, input, price, undefined, resolved);
    if (ok(ev)) return price;
    price = nextPrice(resolved.rules.rounding, price);
  }
  throw new Error(`No se encontró precio para ${input.productId} (revisa las reglas)`);
}

function rawPrice(rules: PriceRules, costs: CostBreakdown, input: PriceInput): { raw: number; detail: string } {
  const landed = costs.purchaseUsd + costs.freightUsd;
  if (rules.method === "flat_or_pct") {
    const flat = rules.flatMarkupUsd ?? 0;
    const pct = (costs.purchaseUsd * (rules.markupPctOfCost ?? 0)) / 100;
    return { raw: landed + Math.max(flat, pct), detail: `compra ${costs.purchaseUsd} + transporte ${costs.freightUsd} + el mayor de ${flat} y ${rules.markupPctOfCost} % (${round2(pct)})` };
  }
  if (rules.method === "flat_by_size") {
    if (rules.pctAboveUsd !== undefined && costs.purchaseUsd > rules.pctAboveUsd) {
      return { raw: costs.purchaseUsd * (1 + (rules.markupPctOfCost ?? 0) / 100) + costs.freightUsd, detail: `más de ${rules.pctAboveUsd} USD: compra + ${rules.markupPctOfCost} %` };
    }
    const sizes = rules.flatBySizeUsd ?? {};
    const size = input.size && sizes[input.size] !== undefined ? input.size : Object.keys(sizes)[0];
    return { raw: landed + (sizes[size] ?? 0), detail: `compra + ${sizes[size] ?? 0} USD (tamaño ${size})` };
  }
  const c = rules.commission;
  const commissionPct = c.mode === "pct_of_price" ? c.pct ?? 0 : 0;
  const fixed = c.mode === "fixed_usd" ? c.fixedUsd ?? 0 : 0;
  const denom = 1 - ((rules.targetNetMarginPct ?? 0) + commissionPct + rules.variablePct) / 100;
  return {
    raw: (costs.totalUsd + fixed) / Math.max(denom, 0.05),
    detail: `(costo total ${round2(costs.totalUsd)}${fixed ? ` + comisión ${fixed}` : ""}) ÷ (1 − ${rules.targetNetMarginPct} % − ${commissionPct} % − ${rules.variablePct} %)`,
  };
}

function rateGuards(policy: PricingPolicy, input: PriceInput): Guard[] {
  const out: Guard[] = [];
  const r = input.rates;
  if (!r || !(r.cup > 0)) {
    out.push({ code: "sin-tasa", severity: "info", message: "Sin tasa del CUP: el precio en CUP no se calcula" });
    return out;
  }
  if (r.otherCup && Math.abs(r.otherCup.value - r.cup) > EPS) {
    out.push({ code: "tasa-distinta", severity: "aviso", message: `Hay dos tasas: ${r.cup} (la del día) y ${r.otherCup.value} (${r.otherCup.source}). Debe quedar una sola` });
  }
  const staleHours = policy.rates?.staleHours;
  if (staleHours && r.updatedAt && input.now) {
    const hours = (Date.parse(input.now) - Date.parse(r.updatedAt)) / 3_600_000;
    if (hours > staleHours) out.push({ code: "tasa-vieja", severity: "aviso", message: `La tasa tiene ${Math.round(hours)} h sin actualizar (máximo ${staleHours} h)` });
  }
  return out;
}

/**
 * Cotiza un producto: precio sugerido por la regla, su suelo y el reparto a ese precio, con el recibo.
 * Si no hay costo devuelve un error controlado (D11: nunca se inventa un precio).
 */
export function quotePrice(policy: PricingPolicy, input: PriceInput): PriceQuote {
  const resolved = resolveRules(policy, input);
  const { rules, layers } = resolved;
  const steps: ReceiptStep[] = [];
  const costs = costBreakdown(input, rules, policy);
  steps.push({ step: "costo", rule: "costo_total", detail: `compra ${costs.purchaseUsd} + flete ${costs.freightUsd} + fijos ${costs.fixedShareUsd}, + ${rules.contingencyPct} % imprevistos`, usd: round2(costs.totalUsd) });

  const { raw, detail } = rawPrice(rules, costs, input);
  steps.push({ step: "precio-crudo", rule: `method:${rules.method}`, detail, usd: round2(raw) });

  const floorUsd = search(policy, input, resolved, costs.purchaseUsd, (ev) => meetsFloor(rules, ev));
  let suggested: number;
  if (rules.method === "target_margin") {
    suggested = search(policy, input, resolved, costs.totalUsd, (ev) => meetsTarget(rules, ev));
    steps.push({ step: "redondeo", rule: "targetNetMarginPct", detail: `menor precio redondeado que deja ${rules.targetNetMarginPct} % limpio a la ${policy.profiles[input.profile].ownerLabel}`, usd: suggested });
  } else {
    suggested = roundPrice(rules.rounding, raw);
    steps.push({ step: "redondeo", rule: `rounding.${rules.rounding.mode}`, detail: `escalón ${roundingStep(rules.rounding, raw)} USD`, usd: suggested });
  }
  if (suggested + EPS < floorUsd) {
    steps.push({ step: "suelo", rule: "minNetMarginPct/minOwnerProfitUsd", detail: `${suggested} está bajo el suelo; se sube a ${floorUsd}`, usd: floorUsd });
    suggested = floorUsd;
  }

  const ev = evaluateAtPrice(policy, input, suggested, undefined, resolved, steps);
  const guards = [...ev.guards, ...rateGuards(policy, input)];
  if (ev.priceCup !== null) steps.push({ step: "cup", rule: "rates.cup", detail: `${suggested} × ${ev.rateCup} hacia arriba a ${rules.rounding.cupStep} CUP = ${ev.priceCup} CUP` });

  const receipt: PriceReceipt = {
    engineVersion: PRICING_ENGINE_VERSION,
    policyId: policy.policyId,
    policyVersion: policy.version,
    profile: input.profile,
    layers,
    steps,
  };
  return {
    ...ev,
    guards,
    productId: input.productId,
    profile: input.profile,
    ownerLabel: policy.profiles[input.profile].ownerLabel,
    suggestedUsd: suggested,
    rawPriceUsd: round2(raw),
    floorUsd,
    rules,
    receipt,
  };
}

/**
 * «Precio de mercado»: Lennys pone el precio a mano (mirando las redes) y el motor
 * calcula comisión, ganancia y avisos a ese precio, más el suelo para compararlo.
 */
export function quoteAtMarketPrice(policy: PricingPolicy, input: PriceInput, marketPriceUsd: number, override?: CommissionOverride): PriceQuote {
  const base = quotePrice(policy, input);
  const resolved = resolveRules(policy, input);
  const steps: ReceiptStep[] = [
    ...base.receipt.steps.filter((s) => s.step === "costo"),
    { step: "precio-de-mercado", rule: "manual", detail: `precio puesto a mano: ${marketPriceUsd}`, usd: marketPriceUsd },
  ];
  const ev = evaluateAtPrice(policy, input, marketPriceUsd, override, resolved, steps);
  const guards = [...ev.guards, ...rateGuards(policy, input)];
  if (marketPriceUsd + EPS < base.floorUsd) {
    guards.push({ code: "bajo-suelo", severity: "bloqueo", message: `A ${marketPriceUsd} está por debajo del suelo (${base.floorUsd}): no se publica sin el SÍ de la dueña` });
  }
  return { ...base, ...ev, guards, receipt: { ...base.receipt, steps } };
}
