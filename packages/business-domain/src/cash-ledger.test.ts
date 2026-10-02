import { describe, expect, it } from "vitest";
import {
  expectedCashByCurrency,
  normalizeCashCurrency,
  reconcileShiftClose,
  validateLedgerEntry,
  type CashLedgerEntry,
} from "./cash-shift";

const entry = (overrides: Partial<CashLedgerEntry>): CashLedgerEntry => ({
  kind: "cash_in",
  direction: "in",
  currency: "CUP",
  amountMinor: 100n,
  reason: "Cambio",
  ...overrides,
});

describe("multi-currency cash ledger", () => {
  it("keeps expected cash separate per currency and ignores transfers", () => {
    const expected = expectedCashByCurrency({
      entries: [
        entry({ kind: "opening_float", currency: "CUP", amountMinor: 10000n, reason: "Fondo inicial" }),
        entry({ kind: "opening_float", currency: "usd", amountMinor: 2000n, reason: "Fondo inicial" }),
        entry({ kind: "expense", direction: "out", currency: "CUP", amountMinor: 3000n, reason: "Mensajería" }),
        entry({ kind: "messenger_return", currency: "USD", amountMinor: 500n, reason: "Cobro entregado" }),
      ],
      salePayments: [
        { method: "cash", currency: "CUP", amountMinor: 25000n },
        { method: "transfer", currency: "CUP", amountMinor: 40000n },
      ],
    });
    expect(expected.get("CUP")).toBe(32000n);
    expect(expected.get("USD")).toBe(2500n);
  });

  it("applies corrections in either direction", () => {
    const expected = expectedCashByCurrency({
      entries: [
        entry({ kind: "cash_in", amountMinor: 500n }),
        entry({ kind: "correction", direction: "out", amountMinor: 50n, reason: "Error de tecleo", correctsMovementId: "m1" }),
      ],
      salePayments: [],
    });
    expect(expected.get("CUP")).toBe(450n);
  });

  it("rejects incoherent ledger entries", () => {
    expect(() => validateLedgerEntry(entry({ kind: "expense", direction: "in" }))).toThrow();
    expect(() => validateLedgerEntry(entry({ kind: "correction", direction: "in" }))).toThrow();
    expect(() => validateLedgerEntry(entry({ correctsMovementId: "m1" }))).toThrow();
    expect(() => validateLedgerEntry(entry({ reason: "  " }))).toThrow();
    expect(() => validateLedgerEntry(entry({ currency: "C$" }))).toThrow();
    expect(normalizeCashCurrency(" mlc ")).toBe("MLC");
  });

  it("requires a count for every expected currency and reports differences", () => {
    const expected = new Map([["CUP", 35000n], ["USD", 1500n]]);
    expect(() => reconcileShiftClose(expected, [{ currency: "CUP", countedMinor: 35000n }])).toThrow(/USD/);
    expect(() =>
      reconcileShiftClose(expected, [
        { currency: "CUP", countedMinor: 1n },
        { currency: "cup", countedMinor: 2n },
        { currency: "USD", countedMinor: 1500n },
      ]),
    ).toThrow(/Duplicate/);

    expect(
      reconcileShiftClose(expected, [
        { currency: "usd", countedMinor: 1500n },
        { currency: "CUP", countedMinor: 34500n },
        { currency: "MLC", countedMinor: 0n },
      ]),
    ).toEqual([
      { currency: "CUP", expectedMinor: 35000n, countedMinor: 34500n, differenceMinor: -500n },
      { currency: "MLC", expectedMinor: 0n, countedMinor: 0n, differenceMinor: 0n },
      { currency: "USD", expectedMinor: 1500n, countedMinor: 1500n, differenceMinor: 0n },
    ]);
  });
});
