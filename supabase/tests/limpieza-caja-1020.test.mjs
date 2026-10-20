// La limpieza «Pon la caja en cero» (20-oct) se prueba aquí con los mismos ids que en producción.
// La web manda en el perchero: el script decide 1A (vuelven 2 unidades) o 1B (solo dinero) comparando.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { startCore } from "./core-harness.mjs";
import { fill, dryRun } from "../../docs/nexo-business/caja/limpieza-2026-10-20.mjs";

const file = (n) => readFileSync(new URL(`../../docs/nexo-business/caja/${n}`, import.meta.url), "utf8");

async function core() {
  const db = await startCore();
  const ev = (id, device, op, entity, at, payload) =>
    db.query(`INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
      VALUES ($1, 'casa-viva', $2, $3, 'x', $4, $5, $6)`, [id, device, op, entity, at, JSON.stringify({ payload })]);
  await db.exec(`INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash) VALUES
    ('casa-viva', 'telefono-de-nana-1011-cb92', 'Nana', repeat('1', 64)), ('casa-viva', 'telefono-de-zaymi-1015-5583', 'Zaymi', repeat('2', 64))`);
  const line = [{ product_id: "cv-2547", quantity: 1, line_total_minor: 3300 }];
  await ev("c1", "telefono-de-nana-1011-cb92", "inventory.counted", "c1", "2026-10-11T01:52:08Z", { product_id: "cv-2547", difference_quantity: 3 });
  await ev("fa766e0f", "telefono-de-nana-1011-cb92", "sale.completed", "18537e0a-beed-40f9-859c-29433f2dabac", "2026-10-11T20:09:50Z", { sale_id: "18537e0a-beed-40f9-859c-29433f2dabac", total_minor: 3300, lines: line });
  await ev("a55055ce", "telefono-de-nana-1011-cb92", "sale.completed", "8735d2b1-618b-48f4-80e3-04c516cd4e82", "2026-10-11T20:10:09Z", { sale_id: "8735d2b1-618b-48f4-80e3-04c516cd4e82", total_minor: 3300, lines: line });
  await ev("z1", "telefono-de-zaymi-1015-5583", "cash_shift.opened", "12025c00-1aa2-4c78-a74b-33dfc65b04de", "2026-10-15T13:31:59Z", { shift_id: "12025c00-1aa2-4c78-a74b-33dfc65b04de", opening_floats: [] });
  const totals = async () => (await db.query(`SELECT
     coalesce(sum((envelope->'payload'->>'total_minor')::bigint) FILTER (WHERE operation_type = 'sale.completed'), 0)::int AS vendido,
     coalesce(sum((envelope->'payload'->>'refund_minor')::bigint) FILTER (WHERE operation_type = 'sale.returned'), 0)::int AS devuelto,
     (SELECT coalesce(sum(quantity_delta), 0)::int FROM nexo_business.stock_movements WHERE product_id = 'cv-2547') AS perchero
    FROM nexo_business.sync_events`)).rows[0];
  return { db, totals };
}

describe("limpieza caja en cero", () => {
  it("sin la cifra de la web no hace nada", async () => {
    const { db, totals } = await core();
    await expect(db.exec(file("limpieza-2026-10-20.sql"))).rejects.toThrow(/cifra de la web/);
    expect(await totals()).toEqual({ vendido: 6600, devuelto: 0, perchero: 1 });
  }, 60_000);

  it("web = caja (1): 1B, solo el dinero; la prueba no guarda; se repite sin efecto; se deshace", async () => {
    const { db, totals } = await core();
    const sql = fill(file("limpieza-2026-10-20.sql"), 1);
    await db.exec(dryRun(sql));
    expect(await totals()).toEqual({ vendido: 6600, devuelto: 0, perchero: 1 });
    await db.exec(sql);
    await db.exec(sql);
    expect(await totals()).toEqual({ vendido: 6600, devuelto: 6600, perchero: 1 });
    expect((await db.query("SELECT status FROM nexo_business.store_shifts WHERE shift_id = '12025c00-1aa2-4c78-a74b-33dfc65b04de'")).rows[0].status).toBe("closed");
    expect((await db.query("SELECT count(*)::int n FROM nexo_business.sync_events WHERE event_id = 'limpieza-20261020-perchero-conteo'")).rows[0].n).toBe(0);
    await db.exec(file("limpieza-2026-10-20-deshacer.sql"));
    expect(await totals()).toEqual({ vendido: 6600, devuelto: 0, perchero: 1 });
  }, 60_000);

  it("web = caja + 2 (3): 1A, vuelven las 2 unidades con un conteo «Igualar la web» (sin sumarle 2 a la web)", async () => {
    const { db, totals } = await core();
    await db.exec(fill(file("limpieza-2026-10-20.sql"), 3));
    expect(await totals()).toEqual({ vendido: 6600, devuelto: 6600, perchero: 3 });
    const count = (await db.query("SELECT envelope->'payload' p FROM nexo_business.sync_events WHERE event_id = 'limpieza-20261020-perchero-conteo'")).rows[0].p;
    expect(count).toMatchObject({ counted_quantity: 3, expected_quantity: 1, difference_quantity: 2 });
    // Las devoluciones no llevan unidades: el puente no manda +2 a la web.
    expect((await db.query("SELECT count(*)::int n FROM nexo_business.stock_movements WHERE reason = 'return'")).rows[0].n).toBe(0);
  }, 60_000);
});
