import { normalizeCashCurrency } from "./cash-shift";

/** One movement of order cash in a messenger's custody. */
export type CustodyEntry = {
  kind: "collected" | "returned" | "write_off";
  messengerId: string;
  /** Order key, e.g. "woocommerce|order|2608". */
  orderKey: string;
  currency: string;
  amountMinor: bigint;
  reason?: string;
};

export type CustodyBalance = {
  messengerId: string;
  currency: string;
  collectedMinor: bigint;
  returnedMinor: bigint;
  writtenOffMinor: bigint;
  outstandingMinor: bigint;
};

/**
 * Per messenger and currency: collected − returned − written off. Each order's
 * cash is collected once per currency by one messenger, and its settlements
 * (returns + write-offs) never exceed that collection.
 */
export function custodyBalances(entries: readonly CustodyEntry[]): CustodyBalance[] {
  const collections = new Map<string, { messengerId: string; amount: bigint; settled: bigint }>();
  const balances = new Map<string, CustodyBalance>();

  for (const entry of entries) {
    const currency = normalizeCashCurrency(entry.currency);
    if (!entry.messengerId.trim()) throw new Error("Custody needs a messenger");
    if (entry.amountMinor <= 0n) throw new Error("Custody amount must be positive");
    const orderKey = `${entry.orderKey}|${currency}`;
    const collection = collections.get(orderKey);

    if (entry.kind === "collected") {
      if (collection) throw new Error("Order cash already collected in this currency");
      collections.set(orderKey, { messengerId: entry.messengerId, amount: entry.amountMinor, settled: 0n });
    } else {
      if (!collection || collection.messengerId !== entry.messengerId) {
        throw new Error("Settlement must match a collection by the same messenger");
      }
      if (entry.kind === "write_off" && !entry.reason?.trim()) {
        throw new Error("A custody write-off needs a reason");
      }
      collection.settled += entry.amountMinor;
      if (collection.settled > collection.amount) {
        throw new Error("Settlement cannot exceed the collected cash");
      }
    }

    const key = `${entry.messengerId}|${currency}`;
    const balance =
      balances.get(key) ??
      ({
        messengerId: entry.messengerId,
        currency,
        collectedMinor: 0n,
        returnedMinor: 0n,
        writtenOffMinor: 0n,
        outstandingMinor: 0n,
      } satisfies CustodyBalance);
    if (entry.kind === "collected") balance.collectedMinor += entry.amountMinor;
    if (entry.kind === "returned") balance.returnedMinor += entry.amountMinor;
    if (entry.kind === "write_off") balance.writtenOffMinor += entry.amountMinor;
    balance.outstandingMinor = balance.collectedMinor - balance.returnedMinor - balance.writtenOffMinor;
    balances.set(key, balance);
  }

  return [...balances.values()];
}
