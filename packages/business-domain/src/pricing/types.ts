// Motor de precios NEXO / Casa Viva — tipos.
// Diseño: docs/nexo-business/motor-de-precios.md. Todo en USD; el CUP solo se calcula para mostrar.

export type PricingProfileId = "tienda-casa-viva" | "nexo-bajo-pedido" | "bolsa-bot";

export type PriceMethod =
  /** Precio = el menor precio redondeado que deja `targetNetMarginPct` limpio al dueño. */
  | "target_margin"
  /** Precio = compra + flete + el mayor de (fijo USD, % del costo). D43. */
  | "flat_or_pct"
  /** Precio = compra + fijo por tamaño; por encima de `pctAboveUsd`, compra × (1 + %). Bolsa del bot. */
  | "flat_by_size";

export interface RoundingTier { upToUsd: number | null; stepUsd: number }
export interface RoundingRule { mode: "ceil" | "round"; tiers: RoundingTier[]; cupStep: number }

export interface CommissionRule {
  /** pct_of_price: % del precio · fixed_usd: monto fijo · share_of_margin: % del margen (D43, bolsa). */
  mode: "pct_of_price" | "fixed_usd" | "share_of_margin";
  pct?: number;
  fixedUsd?: number;
  sharePct?: number;
  /** Redondeo hacia arriba de la comisión % (1 = dólar entero). */
  roundUpToUsd?: number;
  /** La comisión nunca baja de aquí al protegerse la ganancia del dueño. */
  minUsd?: number;
  /** «Un poco más del 10 %»: sube de a 1 USD hasta `maxPct` mientras el dueño siga ganando al menos lo mismo. */
  balanceWithOwner?: boolean;
  maxPct?: number;
}

export interface PriceRules {
  method: PriceMethod;
  targetNetMarginPct?: number;
  minNetMarginPct?: number;
  flatMarkupUsd?: number;
  markupPctOfCost?: number;
  flatBySizeUsd?: Record<string, number>;
  pctAboveUsd?: number;
  includeFixedCosts: boolean;
  contingencyPct: number;
  /** % del precio que se va en otros cargos + dependienta. */
  variablePct: number;
  commission: CommissionRule;
  /** Ganancia mínima del dueño en USD (tienda: guardia de Lennys 2,5; NEXO bajo pedido: 10). */
  minOwnerProfitUsd: number;
  /** Tienda: si el dueño gana menos del mínimo, baja la comisión (regla de Lennys). */
  reduceCommissionToProtectOwner: boolean;
  /** D43: el precio sugerido sube hasta que el dueño gane el mínimo. */
  raisePriceToMinOwnerProfit: boolean;
  /** suma: comisión + recargo (web hoy) · se-descuenta: el recargo cuenta dentro de su parte (D43). */
  gestoraMarkupMode: "suma" | "se-descuenta";
  gestoraMarkupWarnPct?: number;
  rounding: RoundingRule;
}

/** Capa parcial: cualquier campo puede pisar al de la capa anterior. */
export type PriceRulesPatch = Partial<Omit<PriceRules, "commission" | "rounding">> & {
  commission?: Partial<CommissionRule>;
  rounding?: Partial<RoundingRule>;
};

export interface PricingProfile {
  label: string;
  ownerLabel: string;
  rules: PriceRules;
  consignacion?: PriceRulesPatch;
}

export interface PricingPolicy {
  policyId: string;
  version: string;
  status: string;
  effectiveFrom?: string;
  rates?: { currency: string; staleHours: number };
  fixedCosts?: { monthlyCup: number; unitsPerMonth: number };
  profiles: Record<PricingProfileId, PricingProfile>;
  layers: {
    category: Record<string, PriceRulesPatch>;
    supplier: Record<string, PriceRulesPatch>;
    product: Record<string, PriceRulesPatch>;
  };
}

export interface CostInput {
  amount: number;
  currency: string;
  /** Unidades de `currency` por 1 USD el día de la compra (USD = 1). */
  purchaseRate: number;
}

export interface GestoraMarkup { mode: "pct" | "usd"; value: number }

export interface RatesInput {
  /** CUP por 1 USD: la tasa única del día (web, cvd_daily_rates). */
  cup: number;
  /** Fecha ISO de la tasa (para el aviso de tasa vieja). */
  updatedAt?: string;
  /** Otra tasa conocida (p. ej. la nube, 775) para avisar si no coinciden. */
  otherCup?: { source: string; value: number };
}

export interface PriceInput {
  productId: string;
  name?: string;
  category?: string | null;
  supplierId?: string | null;
  profile: PricingProfileId;
  /** Costo de compra por unidad. null = sin costo (D11: no se calcula precio). */
  cost: CostInput | null;
  freightUsd?: number;
  /** Gastos fijos por unidad. Si falta, sale de policy.fixedCosts y la tasa. */
  fixedCostShareUsd?: number;
  consignment?: boolean;
  /** Tamaño para la bolsa del bot (pequeno / grande). */
  size?: string;
  /** Recargo propio de la gestora encima del precio base. */
  gestoraMarkup?: GestoraMarkup;
  rates?: RatesInput;
  /** Capa extra de un solo uso (la más concreta de todas). */
  overrides?: PriceRulesPatch;
  /** Para el aviso de tasa vieja; ISO. Sin él no se comprueba. */
  now?: string;
}

export type GuardCode =
  | "sin-costo"
  | "bajo-costo"
  | "perdida-tras-comision"
  | "bajo-suelo"
  | "ganancia-minima-no-alcanzada"
  | "comision-reducida"
  | "posible-paquete"
  | "posible-cup-como-usd"
  | "costo-muy-bajo"
  | "tasa-distinta"
  | "tasa-vieja"
  | "sin-tasa"
  | "recargo-gestora-alto";

export interface Guard { code: GuardCode; severity: "info" | "aviso" | "bloqueo"; message: string }

export interface ReceiptStep { step: string; rule: string; detail: string; usd?: number }

export interface PriceReceipt {
  engineVersion: string;
  policyId: string;
  policyVersion: string;
  profile: PricingProfileId;
  layers: string[];
  steps: ReceiptStep[];
}

export interface CostBreakdown {
  purchaseUsd: number;
  freightUsd: number;
  fixedShareUsd: number;
  contingencyUsd: number;
  totalUsd: number;
}

export interface PriceEvaluation {
  priceUsd: number;
  priceCup: number | null;
  rateCup: number | null;
  costs: CostBreakdown;
  /** Margen antes de comisión y cargos = precio − costo total. */
  marginUsd: number;
  variableUsd: number;
  /** Lo que paga el dueño a la gestora (comisión, o en D43 lo que falta hasta su parte). */
  commissionUsd: number;
  /** Comisión antes de la guardia de ganancia mínima. */
  commissionBeforeGuardUsd: number;
  commissionSource: string;
  gestora: { markupUsd: number; totalUsd: number; salePriceUsd: number };
  ownerProfitUsd: number;
  ownerMarginPct: number;
  guards: Guard[];
}

export interface PriceQuote extends PriceEvaluation {
  productId: string;
  profile: PricingProfileId;
  ownerLabel: string;
  /** Precio que sugiere la regla. */
  suggestedUsd: number;
  /** Precio crudo antes de redondear (solo métodos de fórmula). */
  rawPriceUsd: number;
  /** Menor precio que no rompe el suelo (margen mínimo y ganancia mínima). */
  floorUsd: number;
  rules: PriceRules;
  receipt: PriceReceipt;
}

export interface CommissionOverride {
  mode: "fixed_usd" | "pct_of_price";
  value: number;
  /** true = no aplicar la guardia de Lennys (para ver «lo que pasa hoy»). */
  skipGuard?: boolean;
  source?: string;
}
