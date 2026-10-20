// Caja P0 (20-oct): textos de sincronización en español sencillo y el día de Cuba del turno.
import { describe, expect, it } from "vitest";
import { describe as describeState, friendlyError } from "./sync";
import { cubaDay, isToday } from "./shift";

describe("textos de sincronización", () => {
  it("dice qué falta y qué hacer, sin jerga", () => {
    expect(describeState({ pending: 0, failing: 0, synced: 12, oldestPendingAt: null, lastError: null })).toBe("Todo enviado (12 en total).");
    expect(describeState({ pending: 3, failing: 0, synced: 1, oldestPendingAt: null, lastError: null })).toMatch(/3 cosas por enviar\. Se envían solas/);
    const failing = describeState({ pending: 1, failing: 1, synced: 0, oldestPendingAt: null, lastError: "TypeError: Failed to fetch" });
    expect(failing).toMatch(/1 cosa por enviar/);
    expect(failing).toMatch(/sin internet/);
    expect(failing).toMatch(/menos de 5 minutos/);
  });
  it("traduce los errores técnicos", () => {
    expect(friendlyError("HTTP 401")).toMatch(/código nuevo a Lennys/);
    expect(friendlyError("HTTP 503")).toBe("la nube no contestó");
    expect(friendlyError(null)).toBe("sin detalle");
  });
});

describe("día del turno (hora de Cuba)", () => {
  it("las 22:00 de Cuba siguen siendo el mismo día aunque en UTC ya sea mañana", () => {
    expect(cubaDay("2026-10-21T02:00:00Z")).toBe("2026-10-20");
    expect(cubaDay("2026-10-20T04:30:00Z")).toBe("2026-10-20");
    expect(isToday(new Date().toISOString())).toBe(true);
    expect(isToday("2026-10-11T20:09:00Z")).toBe(false);
  });
});
