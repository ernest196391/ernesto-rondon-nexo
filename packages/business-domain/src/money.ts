import type { Money } from "./types";

export function money(currency: string, minor: bigint): Money {
  if (!currency.trim()) throw new Error("Currency is required");
  return { currency: currency.toUpperCase(), minor };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error("Currency mismatch");
  return { currency: a.currency, minor: a.minor + b.minor };
}

export function multiplyMinor(unitPriceMinor: bigint, quantity: number): bigint {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer in Phase 1");
  }
  return unitPriceMinor * BigInt(quantity);
}
