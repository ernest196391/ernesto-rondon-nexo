import { describe, expect, it } from "vitest";
import { deliveryCatalog, quoteShipping } from "./delivery";

describe("cotización canónica", () => {
  it("expone identificador, monto, moneda, versión y fuente", () => {
    const quote = quoteShipping("Plaza de la Revolución", "Nuevo Vedado");
    expect(quote).toMatchObject({ status: "zone", amount: 1000, currency: "CUP", source: "shipping-rates" });
    expect(quote.ruleId).toContain("plaza-de-la-revolucion");
    expect(deliveryCatalog().localityOptions["Plaza de la Revolución"][0]).toEqual(expect.objectContaining({ id: expect.any(String), label: expect.any(String) }));
  });
});
