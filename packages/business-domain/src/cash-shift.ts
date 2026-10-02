export type CashDirection = "in" | "out";

export type CashMovement = {
  direction: CashDirection;
  amountMinor: bigint;
  reason: string;
};

export function validateOpeningFloat(openingFloatMinor: bigint): void {
  if (openingFloatMinor < 0n) {
    throw new Error("Opening float cannot be negative");
  }
}

export function validateCashMovement(movement: CashMovement): void {
  if (movement.amountMinor <= 0n) {
    throw new Error("Cash movement amount must be greater than zero");
  }
  if (!movement.reason.trim()) {
    throw new Error("Cash movement reason is required");
  }
}

export function expectedCashMinor(args: {
  openingFloatMinor: bigint;
  cashSalesMinor: bigint;
  movements: CashMovement[];
}): bigint {
  validateOpeningFloat(args.openingFloatMinor);
  if (args.cashSalesMinor < 0n) {
    throw new Error("Cash sales cannot be negative");
  }

  return args.movements.reduce((expected, movement) => {
    validateCashMovement(movement);
    return movement.direction === "in"
      ? expected + movement.amountMinor
      : expected - movement.amountMinor;
  }, args.openingFloatMinor + args.cashSalesMinor);
}

export function cashDifferenceMinor(countedMinor: bigint, expectedMinor: bigint): bigint {
  if (countedMinor < 0n) {
    throw new Error("Counted cash cannot be negative");
  }
  return countedMinor - expectedMinor;
}

// Multi-currency ledger (migration 0004). Mirrors the rules enforced by the
// Rust repository in packages/business-db/rust so UI and sync code can
// validate and preview before calling it.

export type CashLedgerKind =
  | "opening_float"
  | "cash_in"
  | "cash_out"
  | "expense"
  | "correction"
  | "order_cash"
  | "messenger_return";

export type CashLedgerEntry = {
  kind: CashLedgerKind;
  direction: CashDirection;
  currency: string;
  amountMinor: bigint;
  reason: string;
  correctsMovementId?: string;
};

export type ShiftPayment = {
  method: string;
  currency: string;
  amountMinor: bigint;
};

export type CurrencyCount = {
  currency: string;
  expectedMinor: bigint;
  countedMinor: bigint;
  differenceMinor: bigint;
};

const FIXED_DIRECTION: Record<Exclude<CashLedgerKind, "correction">, CashDirection> = {
  opening_float: "in",
  cash_in: "in",
  order_cash: "in",
  messenger_return: "in",
  cash_out: "out",
  expense: "out",
};

export function normalizeCashCurrency(raw: string): string {
  const currency = raw.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,16}$/.test(currency)) {
    throw new Error("Invalid currency");
  }
  return currency;
}

/** Only physical cash changes the drawer; transfers and other rails do not. */
export function isDrawerCash(method: string): boolean {
  return method === "cash";
}

export function validateLedgerEntry(entry: CashLedgerEntry): void {
  validateCashMovement(entry);
  normalizeCashCurrency(entry.currency);
  if (entry.kind === "correction") {
    if (!entry.correctsMovementId?.trim()) {
      throw new Error("A correction must reference the movement it corrects");
    }
    return;
  }
  if (entry.correctsMovementId) {
    throw new Error("Only a correction can reference another movement");
  }
  if (FIXED_DIRECTION[entry.kind] !== entry.direction) {
    throw new Error("Direction does not match movement kind");
  }
}

/** Expected drawer cash per currency: ledger entries + cash payments only. */
export function expectedCashByCurrency(args: {
  entries: CashLedgerEntry[];
  salePayments: ShiftPayment[];
}): Map<string, bigint> {
  const expected = new Map<string, bigint>();
  const bump = (currency: string, delta: bigint) => {
    const code = normalizeCashCurrency(currency);
    expected.set(code, (expected.get(code) ?? 0n) + delta);
  };

  for (const entry of args.entries) {
    validateLedgerEntry(entry);
    bump(entry.currency, entry.direction === "in" ? entry.amountMinor : -entry.amountMinor);
  }
  for (const payment of args.salePayments) {
    if (payment.amountMinor < 0n) {
      throw new Error("Payment amount cannot be negative");
    }
    if (isDrawerCash(payment.method)) {
      bump(payment.currency, payment.amountMinor);
    }
  }
  return expected;
}

/**
 * Close reconciliation: every currency with expected cash must be counted;
 * extra counted currencies are accepted with expected 0.
 */
export function reconcileShiftClose(
  expected: Map<string, bigint>,
  counted: Array<{ currency: string; countedMinor: bigint }>,
): CurrencyCount[] {
  const counts = new Map<string, bigint>();
  for (const count of counted) {
    const currency = normalizeCashCurrency(count.currency);
    if (counts.has(currency)) {
      throw new Error(`Duplicate count for ${currency}`);
    }
    counts.set(currency, count.countedMinor);
  }
  for (const currency of expected.keys()) {
    if (!counts.has(currency)) {
      throw new Error(`Missing count for ${currency}`);
    }
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, countedMinor]) => {
      const expectedMinor = expected.get(currency) ?? 0n;
      return {
        currency,
        expectedMinor,
        countedMinor,
        differenceMinor: cashDifferenceMinor(countedMinor, expectedMinor),
      };
    });
}
