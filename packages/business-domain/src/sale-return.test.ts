import { describe, expect, it } from "vitest";
import { validateSaleReturn, type SaleReturnRequest, type SoldLine } from "./sale-return";

const sold: SoldLine[] = [
  { saleLineId: "l1", quantity: 3, returnedQuantity: 1 },
  { saleLineId: "l2", quantity: 1, returnedQuantity: 0 },
];

const request = (overrides: Partial<SaleReturnRequest>): SaleReturnRequest => ({
  saleTotalMinor: 8_000n,
  alreadyRefundedMinor: 1_000n,
  lines: [{ saleLineId: "l1", quantity: 2 }],
  refundMinor: 2_000n,
  refundRail: "cash",
  reason: "Producto defectuoso",
  ...overrides,
});

describe("sale returns", () => {
  it("accepts a return within sold quantity and remaining sale total", () => {
    expect(() => validateSaleReturn(request({}), sold)).not.toThrow();
    expect(() => validateSaleReturn(request({ refundMinor: 0n, refundRail: undefined }), sold)).not.toThrow();
  });

  it("rejects over-returns, over-refunds and foreign lines", () => {
    expect(() => validateSaleReturn(request({ lines: [{ saleLineId: "l1", quantity: 3 }] }), sold)).toThrow("sold quantity");
    expect(() => validateSaleReturn(request({ refundMinor: 7_001n }), sold)).toThrow("sale total");
    expect(() => validateSaleReturn(request({ lines: [{ saleLineId: "zz", quantity: 1 }] }), sold)).toThrow("belong");
  });

  it("requires a reason and a rail only when money is refunded", () => {
    expect(() => validateSaleReturn(request({ reason: " " }), sold)).toThrow("reason");
    expect(() => validateSaleReturn(request({ refundRail: undefined }), sold)).toThrow("rail");
    expect(() => validateSaleReturn(request({ refundMinor: 0n }), sold)).toThrow("rail");
  });
});
