import { describe, expect, it } from "vitest";
import { dbError, normalizeCubanMobile, slugFromName, timeLeft } from "./shop-rules";

describe("Saldo 360 · tienda del vendedor", () => {
  it("acepta móviles cubanos escritos de varias formas", () => {
    expect(normalizeCubanMobile("5 123 4567")).toBe("5351234567");
    expect(normalizeCubanMobile("+53 5123-4567")).toBe("5351234567");
    expect(normalizeCubanMobile("5351234567")).toBe("5351234567");
    expect(normalizeCubanMobile("7123456")).toBeNull(); // fijo
    expect(normalizeCubanMobile("41234567")).toBeNull(); // no empieza por 5
    expect(normalizeCubanMobile("51234")).toBeNull();
  });

  it("la dirección de la tienda cumple el formato de la base", () => {
    const re = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
    for (const name of ["Saldo Rápido Playa", "¡¡¡", "Ñoño & Cía. — Habana del Este 2026 con nombre larguísimo", "a"]) {
      expect(slugFromName(name, "k3x9")).toMatch(re);
    }
    expect(slugFromName("Saldo Rápido Playa", "k3x9")).toBe("saldo-rapido-playa-k3x9");
  });

  it("traduce los errores de la base a frases para el vendedor", () => {
    expect(dbError("Máximo 5 ofertas activas por tienda")).toMatch(/5 ofertas/);
    expect(dbError('duplicate key value violates unique constraint "shops_slug_key"')).toMatch(/ya existe/);
    expect(dbError("new row violates row-level security policy")).toMatch(/permiso/);
    expect(dbError("algo raro")).toMatch(/No se pudo guardar/);
  });

  it("dice cuánto le queda a una oferta", () => {
    const now = new Date("2026-10-27T12:00:00Z");
    expect(timeLeft("2026-10-27T11:00:00Z", now)).toBe("vencida");
    expect(timeLeft("2026-10-27T12:30:00Z", now)).toBe("vence en 30 min");
    expect(timeLeft("2026-10-28T12:00:00Z", now)).toBe("vence en 24 h");
  });
});
