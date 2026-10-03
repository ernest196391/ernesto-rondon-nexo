/**
 * NEXO Business outbox push contract v1 (ADR-001).
 *
 * POST {endpoint} with a PushRequest; the server answers one PushResult per
 * event. `applied` = stored now, `duplicate` = already stored (the normal
 * answer to a retry), `rejected` = invariant/validation failure (client keeps
 * the event and retries with backoff). The server must store event_id
 * uniquely in the same transaction that applies the effect.
 */
export type PushEvent = {
  eventId: string;
  businessId: string;
  deviceId: string;
  operationType: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  envelope: unknown;
};

export type PushRequest = {
  contractVersion: 1;
  businessId: string;
  deviceId: string;
  events: PushEvent[];
};

export type PushStatus = "applied" | "duplicate" | "rejected";
export type PushResult = { eventId: string; status: PushStatus; error?: string };
export type PushResponse = { results: PushResult[] };

const STATUSES: ReadonlySet<string> = new Set(["applied", "duplicate", "rejected"]);

/** Client side: accept a response only if it answers exactly the events sent. */
export function validatePushResponse(request: PushRequest, response: unknown): PushResult[] {
  const results = (response as PushResponse | null)?.results;
  if (!Array.isArray(results)) throw new Error("Push response has no results");
  const sent = new Set(request.events.map(e => e.eventId));
  const answered = new Set<string>();
  for (const r of results) {
    if (!r || typeof r.eventId !== "string" || !STATUSES.has(r.status)) {
      throw new Error("Malformed push result");
    }
    if (!sent.has(r.eventId)) throw new Error(`Result for an event that was not sent: ${r.eventId}`);
    if (answered.has(r.eventId)) throw new Error(`Duplicate result for ${r.eventId}`);
    answered.add(r.eventId);
  }
  if (answered.size !== sent.size) throw new Error("Push response is missing results");
  return results;
}

/**
 * Server side: classify a batch against event IDs already stored. Events
 * repeated inside the same batch are applied once. Events are attributed to the
 * authenticated sender device; only the business must match (early Android
 * builds labelled their sales with another device id).
 */
export function classifyPush(
  request: PushRequest,
  alreadyStored: ReadonlySet<string>,
  validate: (event: PushEvent) => string | undefined = () => undefined,
): PushResult[] {
  if (request.contractVersion !== 1) throw new Error("Unsupported contract version");
  const seen = new Set(alreadyStored);
  return request.events.map(event => {
    if (event.businessId !== request.businessId) {
      return { eventId: event.eventId, status: "rejected", error: "Event belongs to another business" };
    }
    if (seen.has(event.eventId)) return { eventId: event.eventId, status: "duplicate" };
    const error = validate(event);
    if (error) return { eventId: event.eventId, status: "rejected", error };
    seen.add(event.eventId);
    return { eventId: event.eventId, status: "applied" };
  });
}
