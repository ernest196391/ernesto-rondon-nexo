import { describe, expect, it } from "vitest";
import {
  cashDifferenceMinor,
  expectedCashMinor,
  validateCashMovement,
  validateOpeningFloat,
} from "./cash-shift";

describe("cash shift domain", () => {
  it("calculates expected cash from opening float, cash sales and movements", () => {
    expect(expectedCashMinor({
      openingFloatMinor: 10000n,
      cashSalesMinor: 25000n,
      movements: [
        { direction: "in", amountMinor: 5000n, reason: "Cambio adicional" },
        { direction: "out", amountMinor: 3000n, reason: "Mensajería" },
      ],
    })).toBe(37000n);
  });

  it("calculates over/short difference", () => {
    expect(cashDifferenceMinor(36500n, 37000n)).toBe(-500n);
    expect(cashDifferenceMinor(37500n, 37000n)).toBe(500n);
  });

  it("rejects invalid amounts and empty reasons", () => {
    expect(() => validateOpeningFloat(-1n)).toThrow();
    expect(() => validateCashMovement({
      direction: "in",
      amountMinor: 0n,
      reason: "Cambio",
    })).toThrow();
    expect(() => validateCashMovement({
      direction: "out",
      amountMinor: 100n,
      reason: "   ",
    })).toThrow();
  });
});
