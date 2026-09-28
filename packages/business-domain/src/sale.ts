import { multiplyMinor } from "./money";
import type { CompleteSaleCommand, OutboxOperation } from "./types";

export function validateCompleteSale(command: CompleteSaleCommand): void {
  if (!command.saleId || !command.businessId || !command.branchId || !command.deviceId) {
    throw new Error("Sale identity is incomplete");
  }
  if (!command.lines.length) throw new Error("Sale requires at least one line");
  if (!command.payments.length) throw new Error("Sale requires at least one payment");
  const total = command.lines.reduce((sum, line) => sum + multiplyMinor(line.unitPriceMinor, line.quantity), 0n);
  const paid = command.payments.reduce((sum, payment) => {
    if (payment.currency !== command.currency) throw new Error("Payment currency mismatch");
    return sum + payment.amountMinor;
  }, 0n);
  if (paid !== total) throw new Error("Payment total does not match sale total");
}

export function saleTotalMinor(command: CompleteSaleCommand): bigint {
  return command.lines.reduce((sum, line) => sum + multiplyMinor(line.unitPriceMinor, line.quantity), 0n);
}

export function createSaleOutboxOperation(command: CompleteSaleCommand): OutboxOperation<CompleteSaleCommand> {
  validateCompleteSale(command);
  return {
    id: command.saleId,
    businessId: command.businessId,
    deviceId: command.deviceId,
    operationType: "sale.completed",
    entityType: "sale",
    entityId: command.saleId,
    occurredAt: command.occurredAt,
    payload: command,
  };
}
