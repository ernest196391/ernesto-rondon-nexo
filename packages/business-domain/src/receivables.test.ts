import { describe, expect, it } from "vitest";
import { creditSaleSplit, receivableBalance, validateReceivable, type Receivable } from "./receivables";

const debt: Receivable = { customerId: "cust-1", currency: "cup", originalMinor: 10_000n };

describe("receivables (fiado / partial payments)", () => {
  it("derives the balance from payments and write-offs", () => {
    const balance = receivableBalance(debt, [
      { kind: "payment", currency: "CUP", amountMinor: 4_000n, rail: "transfer" },
      { kind: "write_off", currency: "CUP", amountMinor: 1_000n, reason: "Descuento acordado" },
    ]);
    expect(balance).toEqual({
      currency: "CUP",
      originalMinor: 10_000n,
      paidMinor: 4_000n,
      writtenOffMinor: 1_000n,
      balanceMinor: 5_000n,
      status: "open",
    });
  });

  it("settles at zero and rejects overpayment", () => {
    expect(
      receivableBalance(debt, [{ kind: "payment", currency: "CUP", amountMinor: 10_000n, rail: "cash" }]).status,
    ).toBe("settled");
    expect(() =>
      receivableBalance(debt, [{ kind: "payment", currency: "CUP", amountMinor: 10_001n, rail: "cash" }]),
    ).toThrow("exceed");
  });

  it("rejects mixed currencies, empty write-off reasons and missing customers", () => {
    expect(() =>
      receivableBalance(debt, [{ kind: "payment", currency: "USD", amountMinor: 1n, rail: "cash" }]),
    ).toThrow("currency");
    expect(() =>
      receivableBalance(debt, [{ kind: "write_off", currency: "CUP", amountMinor: 1n, reason: " " }]),
    ).toThrow("reason");
    expect(() => validateReceivable({ ...debt, customerId: "" })).toThrow("customer");
  });

  it("splits a credit sale into paid now and owed", () => {
    expect(creditSaleSplit(1_000n, 400n)).toEqual({ paidNowMinor: 400n, owedMinor: 600n });
    expect(creditSaleSplit(1_000n, 0n).owedMinor).toBe(1_000n);
    expect(() => creditSaleSplit(1_000n, 1_001n)).toThrow();
  });
});
