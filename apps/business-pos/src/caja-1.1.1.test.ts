// Caja 1.1.1 (Lennys 21-oct 16:47 y 16:49): quién puede sacar dinero del fondo y «Ventas de hoy».
import { describe, expect, it } from "vitest";
import { fundExitPeople, type Person } from "./attribution";
import { buildTodaySales, cubaDayStart, filterTodaySales } from "./sales-today";

describe("salida del fondo: solo el equipo de la tienda", () => {
  const people: Person[] = [
    { id: "s1", kind: "staff", name: "Daniela (Nana)" },
    { id: "s2", kind: "staff", name: "Lennys" },
    { id: "s3", kind: "staff", name: "Zaymi", permissions: {} },
    { id: "g1", kind: "gestor", name: "Dany" },
    { id: "m1", kind: "messenger", name: "Daiquel" },
    { id: "p1", kind: "partner", name: "Maryta" },
    { id: "s4", kind: "staff", name: "Sin permiso", permissions: { fund_exit: false } },
  ];
  it("salen Lennys, Zaymi y Nana; nunca gestoras, mensajeros ni socios", () => {
    expect(fundExitPeople(people).map(p => p.name)).toEqual(["Daniela (Nana)", "Lennys", "Zaymi"]);
  });
});

describe("Ventas de hoy", () => {
  it("el día empieza a las 00:00 de Cuba (04:00 UTC)", () => {
    expect(cubaDayStart(new Date("2026-10-21T18:37:00Z"))).toBe("2026-10-21T04:00:00.000Z");
    expect(cubaDayStart(new Date("2026-10-22T02:00:00Z"))).toBe("2026-10-21T04:00:00.000Z");
  });

  const names: Record<string, string> = { g1: "Maryta", s1: "Zaymi" };
  const rows = buildTodaySales(
    [
      { id: "v1", total_minor: 900, currency: "USD", occurred_at: "2026-10-21T18:37:00Z", operator_id: null,
        payload_json: JSON.stringify({ payload: { gestor_id: "g1", staff_id: "s1" } }) },
      { id: "v2", total_minor: 2550, currency: "USD", occurred_at: "2026-10-21T15:00:00Z", operator_id: "s1", payload_json: null },
    ],
    [
      { sale_id: "v1", quantity: 1, name: "Burlete de foam para puertas" },
      { sale_id: "v2", quantity: 2, name: "Sábana 2 plazas" },
      { sale_id: "v2", quantity: 1, name: null },
    ],
    [
      { sale_id: "v1", method: "cash", currency: "CUP", amount_minor: 729000, provider: null },
      { sale_id: "v2", method: "transfer", currency: "CUP", amount_minor: 2066000, provider: "Transfermóvil" },
    ],
    id => (id ? names[id] ?? null : null),
    iso => iso.slice(11, 16),
  );

  it("hora, productos con cantidad, total, cómo pagó, quién atendió y gestora", () => {
    expect(rows[0]).toMatchObject({
      time: "18:37", products: "Burlete de foam para puertas", total: "9 USD",
      paid: "Efectivo 7290 CUP", staff: "Zaymi", gestora: "Maryta",
    });
    expect(rows[1]).toMatchObject({ products: "Sábana 2 plazas × 2, Producto", total: "25,50 USD", staff: "Zaymi", gestora: "" });
    expect(rows[1].paid).toMatch(/^Transferencia \(Transfermóvil\) /);
  });

  it("el buscador encuentra la venta por producto o gestora, sin tildes", () => {
    expect(filterTodaySales(rows, "burlete").map(r => r.id)).toEqual(["v1"]);
    expect(filterTodaySales(rows, "maryta foam").map(r => r.id)).toEqual(["v1"]);
    expect(filterTodaySales(rows, "sabana").map(r => r.id)).toEqual(["v2"]);
    expect(filterTodaySales(rows, "").length).toBe(2);
  });
});
