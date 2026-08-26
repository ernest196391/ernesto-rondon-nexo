export type EvidenceOrigin = "photo" | "ocr" | "manufacturer" | "manual" | "retailer" | "inference";

export type FieldEvidence<T = string> = {
  value: T | null;
  confidence: number;
  origin: EvidenceOrigin;
  imageIds?: string[];
  sourceUrl?: string;
  observedText?: string;
};

export type ProductAnalysis = {
  targetDescription: string;
  brand: FieldEvidence;
  model: FieldEvidence;
  productType: FieldEvidence;
  category: FieldEvidence;
  observedPrice: FieldEvidence<number> & { currency?: string | null };
  warranty: FieldEvidence;
  barcode: FieldEvidence;
  qrValue: FieldEvidence;
  specifications: Array<{ name: string; value: string; confidence: number; origin: EvidenceOrigin; imageIds?: string[] }>;
  includedItems: Array<{ value: string; confidence: number; imageIds?: string[] }>;
  contradictions: string[];
  missingCritical: string[];
  requestedEvidence: string[];
};

export type ResearchSource = {
  url: string;
  title: string;
  sourceType: "manufacturer" | "manual" | "retailer" | "distributor" | "other";
  supports: string[];
  consultedAt: string;
};

export type ProductResearch = {
  status: "confirmed" | "partial" | "not_conclusive" | "not_run";
  summary: string;
  confirmedFacts: Array<{ name: string; value: string; sourceUrls: string[] }>;
  contradictions: string[];
  sources: ResearchSource[];
};

export type ProductCopy = {
  title: string;
  seoTitle: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  benefits: string[];
  specifications: Array<{ name: string; value: string }>;
  includedItems: string[];
  warranty: string | null;
  faq: Array<{ question: string; answer: string }>;
  metaDescription: string;
  primaryKeyword: string;
  relatedKeywords: string[];
  altText: string;
};

export type CaptureStatus =
  | "uploaded"
  | "analyzing"
  | "needs_evidence"
  | "researching"
  | "awaiting_review"
  | "approved"
  | "woocommerce_draft"
  | "published"
  | "failed";

export type PriceRuleScope = "product" | "category" | "commerce" | "global";
export type PriceRule = {
  id: string;
  commerceId: string;
  scope: PriceRuleScope;
  scopeId: string | null;
  minCost: number | null;
  maxCost: number | null;
  percent: number;
  fixedAmount: number;
  minimumIncrease: number;
  reservePercent: number;
  operatingCost: number;
  gestoraCommissionPercent: number;
  dependientaCommissionPercent: number;
  rounding: number;
  active: boolean;
  priority: number;
};

export type PriceCalculation = {
  cost: number;
  currency: string;
  ruleId: string;
  scope: PriceRuleScope;
  markup: number;
  reserve: number;
  operatingCost: number;
  gestoraCommission: number;
  dependientaCommission: number;
  rawPrice: number;
  finalPrice: number;
  messagingIncluded: false;
};
