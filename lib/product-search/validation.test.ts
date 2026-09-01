import { describe, expect, it } from "vitest";
import { calculateOffer, parseSearchPayload } from "./validation";
describe("NEXO Busca", () => {
  it("keeps delivery separate", () =>
    expect(
      calculateOffer({
        cost: 40,
        quantity: 1,
        mode: "fixed",
        markup: 5,
        delivery: 6000,
      }),
    ).toEqual({
      cost: 40,
      productTotal: 45,
      earning: 5,
      delivery: 6000,
      customerTotal: 6045,
    }));
  it("rejects unsafe URLs", () =>
    expect(
      parseSearchPayload(
        {
          hypothesis: { name: "Césped", confidence: 0.8 },
          results: [
            {
              title: "x",
              match: "exact",
              availability: "advertised",
              url: "javascript:alert(1)",
            },
          ],
        },
        "r1",
        "test",
      )?.results,
    ).toHaveLength(0));
});
