// La limpieza «Pon la caja en cero» (20-oct) se prueba aquí con los mismos ids que en producción.
import { beforeAll, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { startCore } from "./core-harness.mjs";

let db;
const file = (n) => readFileSync(new URL(`../../docs/nexo-business/caja/${n}`, import.meta.url), "utf8");
const ev = (id, device, op, entity, at, payload) =>
  db.query(`INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
    VALUES ($1, 'casa-viva', $2, $3, 'x', $4, $5, $6)`, [id, device, op, entity, at, JSON.stringify({ payload })]);
const totals = async () => (await db.query(`SELECT
   coalesce(sum((envelope->'payload'->>'total_minor')::bigint) FILTER (WHERE operation_type = 'sale.completed'), 0)::int AS vendido,
   coalesce(sum((envelope->'payload'->>'refund_minor')::bigint) FILTER (WHERE operation_type = 'sale.returned'), 0)::int AS devuelto,
   (SELECT coalesce(sum(quantity_delta), 0)::int FROM nexo_business.stock_movements WHERE product_id = 'cv-2547') AS perchero
  FROM nexo_business.sync_events`)).rows[0];

beforeAll(async () => {
  db = await startCore();
  await db.exec(`INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash) VALUES
    ('casa-viva', 'telefono-de-nana-1011-cb92', 'Nana', repeat('1', 64)), ('casa-viva', 'telefono-de-zaymi-1015-5583', 'Zaymi', repeat('2', 64))`);
  const line = [{ product_id: "cv-2547", quantity: 1, line_total_minor: 3300 }];
  await ev("c1", "telefono-de-nana-1011-cb92", "inventory.counted", "c1", "2026-10-11T01:52:08Z", { product_id: "cv-2547", difference_quantity: 3 });
  await ev("fa766e0f", "telefono-de-nana-1011-cb92", "sale.completed", "18537e0a-beed-40f9-859c-29433f2dabac", "2026-10-11T20:09:50Z", { sale_id: "18537e0a-beed-40f9-859c-29433f2dabac", total_minor: 3300, lines: line });
  await ev("a55055ce", "telefono-de-nana-1011-cb92", "sale.completed", "8735d2b1-618b-48f4-80e3-04c516cd4e82", "2026-10-11T20:10:09Z", { sale_id: "8735d2b1-618b-48f4-80e3-04c516cd4e82", total_minor: 3300, lines: line });
  await ev("z1", "telefono-de-zaymi-1015-5583", "cash_shift.opened", "12025c00-1aa2-4c78-a74b-33dfc65b04de", "2026-10-15T13:31:59Z", { shift_id: "12025c00-1aa2-4c78-a74b-33dfc65b04de", opening_floats: [] });
}, 60_000);

it("la prueba no guarda nada; la limpieza deja neto 0, repone 2 percheros y cierra el turno huérfano; se puede repetir y deshacer", async () => {
  expect(await totals()).toEqual({ vendido: 6600, devuelto: 0, perchero: 1 });
  await db.exec(file("limpieza-2026-10-20-prueba.sql"));
  expect(await totals()).toEqual({ vendido: 6600, devuelto: 0, perchero: 1 });
  await db.exec(file("limpieza-2026-10-20.sql"));
  await db.exec(file("limpieza-2026-10-20.sql"));
  expect(await totals()).toEqual({ vendido: 6600, devuelto: 6600, perchero: 3 });
  expect((await db.query("SELECT status FROM nexo_business.store_shifts WHERE shift_id = '12025c00-1aa2-4c78-a74b-33dfc65b04de'")).rows[0].status).toBe("closed");
  await db.exec(file("limpieza-2026-10-20-deshacer.sql"));
  expect(await totals()).toEqual({ vendido: 6600, devuelto: 0, perchero: 1 });
  expect((await db.query("SELECT status FROM nexo_business.store_shifts WHERE shift_id = '12025c00-1aa2-4c78-a74b-33dfc65b04de'")).rows[0].status).toBe("open");
});
