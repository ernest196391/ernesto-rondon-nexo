import { describe, expect, it } from "vitest";
import { getDeliveryQuoteAnswer } from "./assistant-delivery-tool";

describe("herramienta canónica de mensajería del asistente", () => {
  it("pide los dos datos cuando faltan", () => expect(getDeliveryQuoteAnswer("¿Cuánto cuesta la entrega?")?.answer).toBe("¿En qué municipio y localidad sería la entrega?"));
  it("usa la misma tarifa que checkout", () => expect(getDeliveryQuoteAnswer("Entrega para Nuevo Vedado, Plaza de la Revolución")).toMatchObject({ status: "quoted", feeCup: 1000, version: "2026-08-04-v2" }));
});
