import { normalizeCashCurrency, type PaymentRail } from "./cash-shift";

/** Money a customer owes the business, in one currency (fiado / partial payment). */
export type Receivable = {
  customerId: string;
  currency: string;
  originalMinor: bigint;
};

export type ReceivableEntry =
  | { kind: "payment"; currency: string; amountMinor: bigint; rail: PaymentRail }
  | { kind: "write_off"; currency: string; amountMinor: bigint; reason: string };

export type ReceivableBalance = {
  currency: string;
  originalMinor: bigint;
  paidMinor: bigint;
  writtenOffMinor: bigint;
  balanceMinor: bigint;
  status: "open" | "settled";
};

export function validateReceivable(receivable: Receivable): void {
  if (!receivable.customerId.trim()) {
    throw new Error("A receivable needs a customer");
  }
  normalizeCashCurrency(receivable.currency);
  if (receivable.originalMinor <= 0n) {
    throw new Error("Amount owed must be positive");
  }
}

/**
 * Derived balance: original − payments − write-offs. Entries are append-only
 * and must share the receivable currency; the balance never goes below zero.
 */
export function receivableBalance(receivable: Receivable, entries: readonly ReceivableEntry[]): ReceivableBalance {
  validateReceivable(receivable);
  const currency = normalizeCashCurrency(receivable.currency);
  let paidMinor = 0n;
  let writtenOffMinor = 0n;

  for (const entry of entries) {
    if (normalizeCashCurrency(entry.currency) !== currency) {
      throw new Error("Receivable entry currency mismatch");
    }
    if (entry.amountMinor <= 0n) {
      throw new Error("Receivable entry amount must be positive");
    }
    if (entry.kind === "payment") {
      paidMinor += entry.amountMinor;
    } else {
      if (!entry.reason.trim()) {
        throw new Error("A write-off needs a reason");
      }
      writtenOffMinor += entry.amountMinor;
    }
    if (paidMinor + writtenOffMinor > receivable.originalMinor) {
      throw new Error("Receivable entries cannot exceed the amount owed");
    }
  }

  const balanceMinor = receivable.originalMinor - paidMinor - writtenOffMinor;
  return {
    currency,
    originalMinor: receivable.originalMinor,
    paidMinor,
    writtenOffMinor,
    balanceMinor,
    status: balanceMinor > 0n ? "open" : "settled",
  };
}

/** Splits a sale into what is paid now and what stays owed (partial payment). */
export function creditSaleSplit(totalMinor: bigint, paidNowMinor: bigint): { paidNowMinor: bigint; owedMinor: bigint } {
  if (totalMinor <= 0n) {
    throw new Error("Sale total must be positive");
  }
  if (paidNowMinor < 0n || paidNowMinor > totalMinor) {
    throw new Error("Payment must be between zero and the sale total");
  }
  return { paidNowMinor, owedMinor: totalMinor - paidNowMinor };
}
