import { describe, expect, it } from "vitest";
import { custodyBalances, type CustodyEntry } from "./messenger-custody";

const e = (overrides: Partial<CustodyEntry>): CustodyEntry => ({
  kind: "collected",
  messengerId: "msg-1",
  orderKey: "woocommerce|order|2608",
  currency: "USD",
  amountMinor: 1_000n,
  ...overrides,
});

describe("messenger custody", () => {
  it("tracks collected cash until it is returned or written off", () => {
    const [usd] = custodyBalances([
      e({}),
      e({ kind: "returned", amountMinor: 900n }),
      e({ kind: "write_off", amountMinor: 100n, reason: "Billete roto" }),
    ]);
    expect(usd).toMatchObject({ collectedMinor: 1_000n, returnedMinor: 900n, writtenOffMinor: 100n, outstandingMinor: 0n });
  });

  it("keeps split USD/CUP collections apart", () => {
    const balances = custodyBalances([e({}), e({ currency: "cup", amountMinor: 150_000n })]);
    expect(balances.map((b) => [b.currency, b.outstandingMinor])).toEqual([
      ["USD", 1_000n],
      ["CUP", 150_000n],
    ]);
  });

  it("rejects double collection, foreign or excess settlements and reasonless write-offs", () => {
    expect(() => custodyBalances([e({}), e({ messengerId: "msg-2" })])).toThrow("already collected");
    expect(() => custodyBalances([e({}), e({ kind: "returned", messengerId: "msg-2" })])).toThrow("same messenger");
    expect(() => custodyBalances([e({}), e({ kind: "returned", amountMinor: 1_001n })])).toThrow("exceed");
    expect(() => custodyBalances([e({}), e({ kind: "write_off", amountMinor: 1n })])).toThrow("reason");
  });
});
