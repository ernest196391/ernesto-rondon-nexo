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
