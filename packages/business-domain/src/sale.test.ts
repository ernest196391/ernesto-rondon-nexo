import { describe, expect, it } from "vitest";
import { createSaleOutboxOperation, saleTotalMinor, validateCompleteSale } from "./sale";
import { createScanResult, matchesProductBarcode } from "./scanner";
import type { CompleteSaleCommand } from "./types";

const sale: CompleteSaleCommand = {
  saleId: "sale-001", businessId: "casa-viva", branchId: "main", deviceId: "android-01",
  currency: "CUP", occurredAt: "2026-09-28T12:00:00Z",
  lines: [{ id: "line-1", productId: "product-1", quantity: 2, unitPriceMinor: 12500n }],
  payments: [{ id: "pay-1", method: "cash", amountMinor: 25000n, currency: "CUP" }],
};

describe("offline sale domain", () => {
  it("calculates sale in integer minor units", () => expect(saleTotalMinor(sale)).toBe(25000n));
  it("creates stable idempotent outbox identity from sale id", () => {
    const op = createSaleOutboxOperation(sale);
    expect(op.id).toBe("sale-001");
    expect(op.entityId).toBe("sale-001");
  });
  it("rejects underpayment", () => {
    expect(() => validateCompleteSale({...sale, payments: [{...sale.payments[0], amountMinor: 1n}]})).toThrow();
  });
});

describe("scanner boundary", () => {
  it("normalizes camera/HID input before matching", () => {
    const scan = createScanResult("  8501234567890\n", "camera", "EAN_13", "2026-09-28T12:00:00Z");
    expect(matchesProductBarcode(["8501234567890"], scan)).toBe(true);
  });
});
