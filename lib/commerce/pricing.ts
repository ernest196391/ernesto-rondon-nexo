import type { PriceCalculation, PriceRule } from "./types";

export const DEFAULT_PRICE_RULES: PriceRule[] = [
  [0, 49.999, 25, 10], [50, 99.999, 20, 0], [100, 249.999, 15, 0],
  [250, 499.999, 12, 0], [500, 999.999, 10, 0], [1000, 2499.999, 8, 0],
  [2500, null, 7, 0],
].map((values, index) => ({
  id: `nexo-global-${index + 1}`, commerceId: "nexo", scope: "global", scopeId: null,
  minCost: values[0] as number, maxCost: values[1] as number | null, percent: values[2] as number,
  fixedAmount: 0, minimumIncrease: values[3] as number, reservePercent: 0, operatingCost: 0,
  gestoraCommissionPercent: 0, dependientaCommissionPercent: 0, rounding: 0.01,
  active: true, priority: index,
}));

const scopeWeight = { product: 4, category: 3, commerce: 2, global: 1 } as const;

export function selectPriceRule(rules: PriceRule[], input: { commerceId: string; productId?: string; categoryId?: string; cost: number }) {
  return rules.filter((rule) => {
    if (!rule.active || rule.commerceId !== input.commerceId) return false;
    if (rule.minCost !== null && input.cost < rule.minCost) return false;
    if (rule.maxCost !== null && input.cost > rule.maxCost) return false;
    if (rule.scope === "product") return rule.scopeId === input.productId;
    if (rule.scope === "category") return rule.scopeId === input.categoryId;
    if (rule.scope === "commerce") return rule.scopeId === input.commerceId || rule.scopeId === null;
    return true;
  }).sort((a, b) => scopeWeight[b.scope] - scopeWeight[a.scope] || b.priority - a.priority)[0] ?? null;
}

export function calculatePrice(cost: number, currency: string, rule: PriceRule): PriceCalculation {
  if (!Number.isFinite(cost) || cost <= 0) throw new Error("A positive observed cost is required");
  const percentMarkup = cost * (rule.percent / 100);
  const markup = Math.max(percentMarkup + rule.fixedAmount, rule.minimumIncrease);
  const reserve = cost * (rule.reservePercent / 100);
  const subtotal = cost + markup + reserve + rule.operatingCost;
  const gestoraCommission = subtotal * (rule.gestoraCommissionPercent / 100);
  const dependientaCommission = subtotal * (rule.dependientaCommissionPercent / 100);
  const rawPrice = subtotal + gestoraCommission + dependientaCommission;
  const increment = rule.rounding > 0 ? rule.rounding : 0.01;
  const finalPrice = Number((Math.ceil(rawPrice / increment) * increment).toFixed(2));
  return { cost, currency, ruleId: rule.id, scope: rule.scope, markup, reserve, operatingCost: rule.operatingCost,
    gestoraCommission, dependientaCommission, rawPrice, finalPrice, messagingIncluded: false };
}
