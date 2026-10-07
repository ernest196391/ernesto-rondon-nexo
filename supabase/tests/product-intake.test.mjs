// Recepción de productos contra un Core local (migraciones reales en PGlite).
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { startCore, rpcAs, seedStore } from "./core-harness.mjs";

const BIZ = "casa-viva";
let db;
let u;

const stock = async (productId) => {
  const { rows } = await db.query("SELECT coalesce(sum(quantity_delta), 0)::int AS q FROM nexo_business.stock_movements WHERE business_id = $1 AND product_id = $2", [BIZ, productId]);
  return rows[0].q;
};
const count = async (sql, params = []) => (await db.query(sql, params)).rows[0].n;
const commit = (user, intake) => rpcAs(db, user, "public.nexo_business_intake_commit", { p_business: BIZ, p_intake: intake });

beforeAll(async () => {
  db = await startCore();
  u = await seedStore(db, BIZ);
}, 60_000);

describe("producto nuevo", () => {
  it("crea el producto y suma la cantidad recibida", async () => {
    const id = randomUUID();
    const r = await commit(u.owner, { id, kind: "new", product: { name: "Lámpara de mesa", category: "Iluminación", prices: { USD: 2500 } },
      lines: [{ label: null, quantity: 4 }], sheet: { fields: { name: "Lámpara de mesa" }, sources: { name: "person" } },
      photos: [{ path: `${BIZ}/${id}/1.jpg`, name: "1.jpg" }, { path: "otro-negocio/x/1.jpg", name: "intruso" }] });
    expect(r.ok).toBe(true);
    const pid = r.lines[0].productId;
    expect(pid).toBe(r.groupId);
    expect(await stock(pid)).toBe(4);
    const { rows } = await db.query("SELECT name, prices, category, variant_of, external_refs FROM nexo_business.catalog_products WHERE product_id = $1", [pid]);
    expect(rows[0]).toMatchObject({ name: "Lámpara de mesa", prices: { USD: 2500 }, category: "Iluminación", variant_of: null, external_refs: {} });
    const saved = (await db.query("SELECT photos, sheet FROM nexo_business.product_intakes WHERE id = $1", [id])).rows[0];
    expect(saved.photos).toEqual([{ path: `${BIZ}/${id}/1.jpg`, name: "1.jpg" }]);
    expect(saved.sheet.sources.name).toBe("person");
  });

  it("con variantes crea una fila por variante, sin padre, con su cantidad", async () => {
    const r = await commit(u.owner, { id: randomUUID(), kind: "new", product: { name: "Sábana", prices: { USD: 1800, CUP: 900000 } },
      lines: [{ label: "Blanca", quantity: 3 }, { label: "Azul", quantity: 2 }, { label: "Gris", quantity: 0 }] });
    expect(r.ok).toBe(true);
    expect(r.lines.map((l) => [l.name, l.added])).toEqual([["Sábana — Blanca", 3], ["Sábana — Azul", 2], ["Sábana — Gris", 0]]);
    expect(await stock(r.lines[0].productId)).toBe(3);
    expect(await stock(r.lines[1].productId)).toBe(2);
    expect(await stock(r.lines[2].productId)).toBe(0);
    expect(await count("SELECT count(*)::int AS n FROM nexo_business.catalog_products WHERE variant_of = $1", [r.groupId])).toBe(3);
    expect(await count("SELECT count(*)::int AS n FROM nexo_business.catalog_products WHERE product_id = $1", [r.groupId])).toBe(0);
  });

  it("rechaza datos incompletos sin dejar nada a medias", async () => {
    const id = randomUUID();
    const before = await count("SELECT count(*)::int AS n FROM nexo_business.catalog_products");
    expect(await commit(u.owner, { id, kind: "new", product: { name: "Sin precio", prices: {} }, lines: [{ label: null, quantity: 1 }] }))
      .toMatchObject({ error: "invalid", message: "Falta el precio de venta" });
    expect(await commit(u.owner, { id: randomUUID(), kind: "new", product: { name: "Mesa", prices: { USD: 100 } }, lines: [{ label: "Roble", quantity: 1 }, { label: "", quantity: 1 }] }))
      .toMatchObject({ error: "invalid" });
    expect(await count("SELECT count(*)::int AS n FROM nexo_business.catalog_products")).toBe(before);
    // El mismo id queda libre para el reintento corregido.
    expect((await commit(u.owner, { id, kind: "new", product: { name: "Con precio", prices: { USD: 100 } }, lines: [{ label: null, quantity: 1 }] })).ok).toBe(true);
  });
});

describe("reposición", () => {
  it("suma una entrada de 5; no reemplaza el stock por 5", async () => {
    const created = await commit(u.owner, { id: randomUUID(), kind: "new", product: { name: "Cojín", prices: { USD: 900 } }, lines: [{ label: null, quantity: 7 }] });
    const pid = created.lines[0].productId;
    const r = await commit(u.staff, { id: randomUUID(), kind: "restock", lines: [{ productId: pid, quantity: 5 }] });
    expect(r.ok).toBe(true);
    expect(r.lines[0]).toMatchObject({ added: 5, stockBefore: 7, stockAfter: 12, stockAuthority: "core" });
    expect(await stock(pid)).toBe(12);
  });

  it("cantidades por variante en un solo evento", async () => {
    const created = await commit(u.owner, { id: randomUUID(), kind: "new", product: { name: "Toalla", prices: { USD: 700 } },
      lines: [{ label: "S", quantity: 1 }, { label: "M", quantity: 1 }] });
    const [s, m] = created.lines.map((l) => l.productId);
    const id = randomUUID();
    const r = await commit(u.staff, { id, kind: "restock", lines: [{ productId: s, quantity: 2 }, { productId: m, quantity: 6 }] });
    expect(r.groupId).toBe(created.groupId);
    expect([await stock(s), await stock(m)]).toEqual([3, 7]);
    expect(await count("SELECT count(*)::int AS n FROM nexo_business.sync_events WHERE event_id LIKE $1", [`intake:${id}%`])).toBe(1);
  });

  it("marca el producto de BizneCubano: la importación horaria lo vuelve a contar", async () => {
    const r = await commit(u.staff, { id: randomUUID(), kind: "restock", lines: [{ productId: "bc-100", quantity: 5 }] });
    expect(r.lines[0]).toMatchObject({ stockAuthority: "external", stockAfter: 5 });
    // Comportamiento actual de Core (no de este bloque): la importación fija la cifra de BizneCubano.
    await db.query("SELECT nexo_business.import_catalog($1, 'biznecubano', $2)", [BIZ, JSON.stringify([
      { productId: "bc-100", sku: "CV-100", name: "Farol solar", prices: { USD: 1100 }, stockQuantity: 0, externalRefs: { biznecubano: "100" } }])]);
    expect(await stock("bc-100")).toBe(0);
  });

  it("rechaza cantidades inválidas, productos inexistentes y repetidos", async () => {
    expect(await commit(u.staff, { id: randomUUID(), kind: "restock", lines: [{ productId: "bc-100", quantity: 0 }] })).toMatchObject({ error: "invalid" });
    expect(await commit(u.staff, { id: randomUUID(), kind: "restock", lines: [{ productId: "no-existe", quantity: 1 }] })).toMatchObject({ error: "invalid" });
    expect(await commit(u.staff, { id: randomUUID(), kind: "restock", lines: [{ productId: "bc-100", quantity: 1 }, { productId: "bc-100", quantity: 1 }] }))
      .toMatchObject({ error: "invalid" });
  });
});

describe("reintento de la misma recepción", () => {
  it("no duplica el producto ni suma dos veces", async () => {
    const id = randomUUID();
    const intake = { id, kind: "new", product: { name: "Espejo", prices: { USD: 3000 } }, lines: [{ label: null, quantity: 2 }] };
    const first = await commit(u.owner, intake);
    const again = await commit(u.owner, intake);
    expect(again.replayed).toBe(true);
    expect(again.lines).toEqual(first.lines);
    expect(await count("SELECT count(*)::int AS n FROM nexo_business.catalog_products WHERE name = 'Espejo'")).toBe(1);
    expect(await stock(first.lines[0].productId)).toBe(2);

    const rid = randomUUID();
    const restock = { id: rid, kind: "restock", lines: [{ productId: first.lines[0].productId, quantity: 5 }] };
    await commit(u.staff, restock);
    await commit(u.staff, restock);
    await commit(u.owner, restock);
    expect(await stock(first.lines[0].productId)).toBe(7);
  });

  it("el mismo id con otros datos es un conflicto, no una suma", async () => {
    const created = await commit(u.owner, { id: randomUUID(), kind: "new", product: { name: "Jarra", prices: { USD: 500 } }, lines: [{ label: null, quantity: 1 }] });
    const id = randomUUID();
    await commit(u.staff, { id, kind: "restock", lines: [{ productId: created.lines[0].productId, quantity: 5 }] });
    expect(await commit(u.staff, { id, kind: "restock", lines: [{ productId: created.lines[0].productId, quantity: 50 }] })).toMatchObject({ error: "conflict" });
    expect(await stock(created.lines[0].productId)).toBe(6);
  });
});

describe("corrección de existencias", () => {
  it("fija la cifra contada con un evento de conteo", async () => {
    const created = await commit(u.owner, { id: randomUUID(), kind: "new", product: { name: "Florero", prices: { USD: 400 } }, lines: [{ label: null, quantity: 10 }] });
    const pid = created.lines[0].productId;
    const r = await commit(u.owner, { id: randomUUID(), kind: "correction", lines: [{ productId: pid, counted: 8 }] });
    expect(r.lines[0]).toMatchObject({ difference: -2, stockBefore: 10, stockAfter: 8 });
    expect(await stock(pid)).toBe(8);
    const same = await commit(u.owner, { id: randomUUID(), kind: "correction", lines: [{ productId: pid, counted: 8 }] });
    expect(same.eventId).toBeNull();
  });
});

describe("permisos", () => {
  it("sin sesión, una extraña o una dependienta creando/corrigiendo: prohibido y sin cambios", async () => {
    const before = await count("SELECT count(*)::int AS n FROM nexo_business.sync_events");
    const intake = (kind) => ({ id: randomUUID(), kind, product: { name: "Intento", prices: { USD: 100 } },
      lines: kind === "new" ? [{ label: null, quantity: 1 }] : kind === "restock" ? [{ productId: "bc-100", quantity: 1 }] : [{ productId: "bc-100", counted: 99 }] });
    expect(await commit(null, intake("restock"))).toEqual({ error: "forbidden" });
    expect(await commit(u.stranger, intake("restock"))).toEqual({ error: "forbidden" });
    expect(await commit(u.staff, intake("new"))).toEqual({ error: "forbidden" });
    expect(await commit(u.staff, intake("correction"))).toEqual({ error: "forbidden" });
    expect(await rpcAs(db, u.stranger, "public.nexo_business_intake_catalog", { p_business: BIZ })).toEqual({ error: "forbidden" });
    expect(await rpcAs(db, u.stranger, "public.nexo_business_intakes", { p_business: BIZ })).toEqual({ error: "forbidden" });
    expect(await count("SELECT count(*)::int AS n FROM nexo_business.sync_events")).toBe(before);
  });

  it("la dependienta ve el catálogo para reponer pero no puede crear", async () => {
    const r = await rpcAs(db, u.staff, "public.nexo_business_intake_catalog", { p_business: BIZ });
    expect(r.access).toEqual({ receive: true, create: false, correct: false });
    expect(r.products.find((p) => p.productId === "bc-100").stockAuthority).toBe("external");
    const list = await rpcAs(db, u.staff, "public.nexo_business_intakes", { p_business: BIZ });
    expect(list.length).toBeGreaterThan(5);
  });
});
