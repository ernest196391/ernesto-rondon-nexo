import { describe, expect, it } from "vitest";
import { filterOffers, offerIsLive, reputationLabel, totalCup, whatsAppLink, type MarketOffer } from "./market";

const now = new Date("2026-10-27T15:00:00Z");
const base: MarketOffer = {
  id: "o1", shopSlug: "ana", shopName: "Ana", locality: "Playa", photoUrl: null, whatsapp: "5351111111",
  minCup: 100, maxCup: 5000, pricePer100Cup: 42.5, paymentMethods: ["transfermovil"],
  confirmedAt: "2026-10-27T12:00:00Z", expiresAt: "2026-10-28T12:00:00Z", confirmedOps: 0, reviewsCount: 0, ratingAvg: null,
};
const offer = (o: Partial<MarketOffer>): MarketOffer => ({ ...base, ...o });

describe("Saldo 360 · mercado", () => {
  it("total = monto × precio por 100, a céntimos (igual que la base)", () => {
    expect(totalCup(300, 42.5)).toBe(127.5);
    expect(totalCup(1000, 43)).toBe(430);
    expect(totalCup(333, 41.37)).toBe(137.76);
  });

  it("solo publica ofertas coherentes y vigentes", () => {
    expect(offerIsLive(base, now)).toBe(true);
    expect(offerIsLive(offer({ expiresAt: "2026-10-27T14:59:00Z" }), now)).toBe(false); // vencida
    expect(offerIsLive(offer({ confirmedAt: "2026-10-27T16:00:00Z" }), now)).toBe(false); // fecha futura
    expect(offerIsLive(offer({ expiresAt: "2026-10-31T12:00:00Z" }), now)).toBe(false); // más de 72 h
    expect(offerIsLive(offer({ whatsapp: "123" }), now)).toBe(false);
    expect(offerIsLive(offer({ pricePer100Cup: 0 }), now)).toBe(false);
    expect(offerIsLive(offer({ minCup: 500, maxCup: 100 }), now)).toBe(false);
    expect(offerIsLive(offer({ paymentMethods: [] }), now)).toBe(false);
  });

  it("filtra por monto y forma de pago y ordena por precio", () => {
    const list = [offer({ id: "caro", pricePer100Cup: 45 }), offer({ id: "barato", pricePer100Cup: 40, paymentMethods: ["efectivo"] }), offer({ id: "chico", maxCup: 200 })];
    expect(filterOffers(list, 300, "any", now).map((o) => o.id)).toEqual(["barato", "caro"]);
    expect(filterOffers(list, 300, "transfermovil", now).map((o) => o.id)).toEqual(["caro"]);
    expect(filterOffers(list, 150, "any", now).map((o) => o.id)).toEqual(["barato", "chico", "caro"]);
  });

  it("la reputación nunca se inventa", () => {
    expect(reputationLabel(base)).toBe("Sin operaciones verificadas");
    expect(reputationLabel(offer({ confirmedOps: 1 }))).toBe("1 operación verificada");
    expect(reputationLabel(offer({ confirmedOps: 12, reviewsCount: 5, ratingAvg: 4.6 }))).toBe("12 operaciones verificadas · ★ 4.6");
  });

  it("el enlace de WhatsApp va al número del proveedor con el monto", () => {
    const url = whatsAppLink(base, 300);
    expect(url.startsWith("https://wa.me/5351111111?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("300 CUP de saldo");
  });
});
