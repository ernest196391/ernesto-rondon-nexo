/** Replay the persisted charge, including its original UTC receipt time. */
export function chargeRequest(c: {
  orderId: number; chargeId: string; staffId: string | null; method: string;
  usdMinor: number; cupMinor: number; reference: string | null;
  collectionAccount?: string | null; note: string | null; createdAt: string;
}) {
  return {
    action: "charge", orderId: c.orderId, chargeId: c.chargeId, staffId: c.staffId,
    collectionMethod: c.method, collectedUsd: c.usdMinor / 100, collectedCup: c.cupMinor / 100,
    collectionReference: c.reference ?? "", collectionAccount: c.collectionAccount ?? "",
    collectionNote: c.note ?? "", cashReceivedAt: c.createdAt,
  };
}
