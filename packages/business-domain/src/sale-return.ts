import type { PaymentRail } from "./cash-shift";

export type SoldLine = { saleLineId: string; quantity: number; returnedQuantity: number };

export type SaleReturnRequest = {
  saleTotalMinor: bigint;
  alreadyRefundedMinor: bigint;
  lines: ReadonlyArray<{ saleLineId: string; quantity: number }>;
  refundMinor: bigint;
  refundRail?: PaymentRail;
  reason: string;
};

/**
 * A return never edits the sale: returned quantity per line stays within what
 * was sold, total refunds stay within the sale total, a refund names its rail
 * and every return has a reason.
 */
export function validateSaleReturn(request: SaleReturnRequest, sold: readonly SoldLine[]): void {
  if (!request.reason.trim()) throw new Error("A return needs a reason");
  if (request.refundMinor < 0n) throw new Error("Refund cannot be negative");
  if ((request.refundMinor > 0n) !== (request.refundRail !== undefined)) {
    throw new Error("A refund must name its rail, and only a refund can");
  }
  if (request.lines.length === 0 && request.refundMinor === 0n) {
    throw new Error("A return needs products or a refund");
  }
  if (request.alreadyRefundedMinor + request.refundMinor > request.saleTotalMinor) {
    throw new Error("Refunds cannot exceed the sale total");
  }
  const seen = new Set<string>();
  for (const line of request.lines) {
    if (seen.has(line.saleLineId)) throw new Error("Repeated sale line");
    seen.add(line.saleLineId);
    const soldLine = sold.find((s) => s.saleLineId === line.saleLineId);
    if (!soldLine) throw new Error("Line does not belong to the sale");
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) throw new Error("Returned quantity must be positive");
    if (line.quantity > soldLine.quantity - soldLine.returnedQuantity) {
      throw new Error("Returned quantity cannot exceed the sold quantity");
    }
  }
}
