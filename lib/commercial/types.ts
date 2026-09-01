export type GestoraStatus = "pending" | "active" | "suspended";
export type PriceMode = "base" | "fixed" | "percent" | "custom_final";
export type PriceScope = "global" | "product";
export type LedgerEntryType = "provisional" | "accrual" | "adjustment" | "reversal" | "payout_hold" | "payout_release" | "payout_paid";

export type GestoraProfile = {
  id: string; userId: string; status: GestoraStatus; publicName: string; slug: string;
  referralCode: string; whatsapp: string; defaultCurrency: string;
};

export type CommercialPriceRule = {
  id: string; gestoraId: string; scope: PriceScope; productId: number | null;
  mode: PriceMode; value: number; currency: string; minFinal: number | null;
  maxFinal: number | null; rounding: number; version: number; status: "active" | "retired";
};

export type ResolvedPrice = {
  base: number; markup: number; final: number; currency: string;
  ruleId: string | null; ruleVersion: number; rounding: number;
};

export type AttributionResolution = {
  requestedRef: string; effectiveRef: string; effectiveGestoraId: string | null;
  effectiveGestoraName: string; effectiveGestoraSlug: string;
  source: "override" | "identity" | "session" | "organic"; preserved: boolean;
};

export type CommercialLineSnapshot = {
  productId: number; variationId: number; quantity: number; baseUnit: number;
  markupUnit: number; finalUnit: number; currency: string; ruleId: string | null;
  ruleVersion: number;
};
