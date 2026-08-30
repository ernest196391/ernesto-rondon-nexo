import type { CommercialPriceRule, ResolvedPrice } from "./types";

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function resolveCommercialPrice(input: {
  base: number; currency: string; rule?: CommercialPriceRule | null;
}): ResolvedPrice {
  const { base, currency, rule } = input;
  if (!Number.isFinite(base) || base < 0) throw new Error("Invalid base price");
  if (!rule || rule.status !== "active") return { base: money(base), markup: 0, final: money(base), currency, ruleId: null, ruleVersion: 0, rounding: 0.01 };
  if (rule.currency !== currency) throw new Error("Price rule currency mismatch");
  const raw = rule.mode === "fixed" ? base + rule.value
    : rule.mode === "percent" ? base * (1 + rule.value / 100)
      : rule.mode === "custom_final" ? rule.value : base;
  const increment = rule.rounding > 0 ? rule.rounding : 0.01;
  let final = Math.ceil((raw - Number.EPSILON) / increment) * increment;
  if (rule.minFinal !== null) final = Math.max(final, rule.minFinal);
  if (rule.maxFinal !== null) final = Math.min(final, rule.maxFinal);
  final = money(Math.max(base, final));
  return { base: money(base), markup: money(final - base), final, currency, ruleId: rule.id, ruleVersion: rule.version, rounding: increment };
}

export function choosePriceRule(rules: CommercialPriceRule[], productId: number) {
  const active = rules.filter((rule) => rule.status === "active");
  return active.filter((rule) => rule.scope === "product" && rule.productId === productId).sort((a, b) => b.version - a.version)[0]
    ?? active.filter((rule) => rule.scope === "global").sort((a, b) => b.version - a.version)[0]
    ?? null;
}
