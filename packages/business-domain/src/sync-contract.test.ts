import { describe, expect, it } from "vitest";
import { classifyPush, validatePushResponse, type PushEvent, type PushRequest } from "./sync-contract";

const event = (eventId: string, overrides: Partial<PushEvent> = {}): PushEvent => ({
  eventId,
  businessId: "biz",
  deviceId: "pos-1",
  operationType: "sale.completed",
  entityType: "sale",
  entityId: eventId,
  occurredAt: "2026-10-02T10:00:00Z",
  envelope: {},
  ...overrides,
});

const request = (events: PushEvent[]): PushRequest => ({ contractVersion: 1, businessId: "biz", deviceId: "pos-1", events });

describe("outbox push contract", () => {
  it("applies new events once and answers retries as duplicates", () => {
    const req = request([event("e1"), event("e2"), event("e1")]);
    expect(classifyPush(req, new Set(["e2"])).map(r => r.status)).toEqual(["applied", "duplicate", "duplicate"]);
  });

  it("rejects foreign-business or invalid events without blocking the rest", () => {
    const req = request([event("e1", { businessId: "other" }), event("e2"), event("e3")]);
    const results = classifyPush(req, new Set(), e => (e.eventId === "e3" ? "Total mismatch" : undefined));
    expect(results.map(r => r.status)).toEqual(["rejected", "applied", "rejected"]);
    expect(results[2].error).toBe("Total mismatch");
  });

  it("accepts events labelled with another device of the same business", () => {
    expect(classifyPush(request([event("e1", { deviceId: "windows-pilot-01" })]), new Set())[0].status).toBe("applied");
  });

  it("client accepts only complete, matching responses", () => {
    const req = request([event("e1"), event("e2")]);
    const good = { results: [{ eventId: "e1", status: "applied" }, { eventId: "e2", status: "duplicate" }] };
    expect(validatePushResponse(req, good)).toHaveLength(2);
    expect(() => validatePushResponse(req, { results: [{ eventId: "e1", status: "applied" }] })).toThrow("missing");
    expect(() => validatePushResponse(req, { results: [{ eventId: "zz", status: "applied" }, { eventId: "e1", status: "applied" }] })).toThrow("not sent");
    expect(() => validatePushResponse(req, { results: [{ eventId: "e1", status: "ok" }] })).toThrow("Malformed");
    expect(() => validatePushResponse(req, null)).toThrow();
  });
});
