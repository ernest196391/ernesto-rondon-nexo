export type Platform = "android" | "windows" | "web";
export type CurrencyCode = string;

export interface Money {
  currency: CurrencyCode;
  minor: bigint;
}

export interface ProductIdentity {
  id: string;
  businessId: string;
  sku?: string;
  barcodes: string[];
  externalRefs: Array<{ system: string; externalId: string }>;
}

export interface ScanResult {
  value: string;
  format?: string;
  source: "camera" | "hid" | "manual";
  scannedAt: string;
}

export interface SaleLineInput {
  id: string;
  productId: string;
  quantity: number;
  unitPriceMinor: bigint;
}

export interface PaymentInput {
  id: string;
  method: string;
  amountMinor: bigint;
  currency: CurrencyCode;
}

export interface CompleteSaleCommand {
  saleId: string;
  businessId: string;
  branchId: string;
  deviceId: string;
  currency: CurrencyCode;
  occurredAt: string;
  lines: SaleLineInput[];
  payments: PaymentInput[];
}

export interface OutboxOperation<T = unknown> {
  id: string;
  businessId: string;
  deviceId: string;
  operationType: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  payload: T;
}
