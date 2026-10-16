// Puente de existencias: un conteo del panel FIJA la web a la cifra de la caja (15-oct).
// Core local (migraciones reales en PGlite) + una web simulada que aplica {set} o {delta} como Core.
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { startCore, rpcAs, seedStore } from "./core-harness.mjs";

const BIZ = "casa-viva";
let db;
let u;
const web = new Map(); // wooId → existencias en la web simulada

const caja = async (productId) =>
  (await db.query("SELECT coalesce(sum(quantity_delta), 0)::int AS q FROM nexo_business.stock_movements WHERE business_id = $1 AND product_id = $2", [BIZ, productId])).rows[0].q;
const pending = async () => (await db.query("SELECT * FROM public.nexo_business_stock_to_web($1, 200)", [BIZ])).rows;
const setStock = (productId, quantity) =>
  rpcAs(db, u.owner, "public.nexo_business_set_stock", { p_business: BIZ, p_product: productId, p_quantity: quantity, p_reason: "Conteo desde el panel" });
const events = async () => (await db.query("SELECT count(*)::int AS n FROM nexo_business.sync_events WHERE business_id = $1", [BIZ])).rows[0].n;

// Lo que hace el puente (paso A) + Core stock_adjust, en orden, y luego marca lo enviado.
async function bridgeA() {
  const rows = await pending();
  for (const r of rows) {
    const id = Number(r.woo_id);
    if (r.set_to !== null) web.set(id, Number(r.set_to));
    else web.set(id, (web.get(id) ?? 0) + Number(r.delta));
  }
  await db.query("SELECT public.nexo_business_stock_mark_sent($1, $2)", [BIZ,
    JSON.stringify(rows.map((r) => ({ key: r.stock_key, productId: r.product_id, delta: Number(r.delta) })))]);
  return rows;
}

async function addProduct(productId, wooId) {
  await db.query(
    "INSERT INTO nexo_business.catalog_products (business_id, product_id, sku, name, prices, external_refs, seq) VALUES ($1, $2, $3, $4, '{\"USD\": 1000}', $5, 0)",
    [BIZ, productId, "SKU-" + productId, "Producto " + productId, JSON.stringify(wooId ? { "casaviva.company": { wooId } } : {})]);
}

async function posSale(productId, quantity) {
  await db.query(
    `INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
     VALUES ($1, $2, 'casa-viva-caja1', 'sale.completed', 'sale', $1, to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), $3)`,
    [randomUUID(), BIZ, JSON.stringify({ contract_version: 1, payload: { lines: [{ product_id: productId, quantity }] } })]);
}

// Pedido web: la web ya descontó; el paso B lo pasa a la caja.
async function webSale(wooId, quantity, order) {
  web.set(wooId, (web.get(wooId) ?? 0) - quantity);
  const r = await db.query("SELECT public.nexo_business_stock_from_web($1, $2, $3, $4, $5) AS r", [BIZ, `web:${order}:1:out`, wooId, -quantity, String(order)]);
  expect(r.rows[0].r).toBe("ok");
}

beforeAll(async () => {
  db = await startCore();
  u = await seedStore(db, BIZ);
  await db.exec(`
    UPDATE nexo_business.catalog_sources SET stock_bridge_from = now() - interval '1 day' WHERE business_id = '${BIZ}';
    INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active)
      VALUES ('${BIZ}', 'casa-viva-caja1', 'Caja 1', repeat('a', 64), TRUE);
  `);
}, 60_000);

describe("conteo del panel → la web queda igual que la caja", () => {
  it("caso real del 14-oct: caja 0, web 1, Quedan=1 → web 1 (antes quedaba 2)", async () => {
    await addProduct("p-real", 9001);
    web.set(9001, 1);
    expect(await setStock("p-real", 1)).toMatchObject({ ok: true, from: 0, to: 1 });
    const rows = await bridgeA();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ product_id: "p-real", kind: "inventory.counted" });
    expect(Number(rows[0].delta)).toBe(1);
    expect(Number(rows[0].set_to)).toBe(1);
    expect(web.get(9001)).toBe(1);
    expect(await caja("p-real")).toBe(1);
  });

  it("idempotente: lo ya enviado no vuelve a salir", async () => {
    expect((await pending()).filter((r) => r.product_id === "p-real")).toHaveLength(0);
  });

  it("misma cifra que la caja pero la web distinta → conteo sin diferencia que iguala la web", async () => {
    await addProduct("p-igual", 9002);
    await setStock("p-igual", 3);
    await bridgeA();
    web.set(9002, 7); // se desajustó por fuera
    const before = await events();
    expect(await setStock("p-igual", 3)).toMatchObject({ ok: true, unchanged: true, web: "igualar" });
    expect(await events()).toBe(before + 1);
    expect(await caja("p-igual")).toBe(3); // la caja no se mueve
    const rows = await bridgeA();
    expect(rows.map((r) => [r.product_id, Number(r.delta), Number(r.set_to)])).toEqual([["p-igual", 0, 3]]);
    expect(web.get(9002)).toBe(3);
  });

  it("producto que no está en la web: misma cifra no deja ningún evento (como antes)", async () => {
    await addProduct("p-local", null);
    await setStock("p-local", 2);
    const before = await events();
    expect(await setStock("p-local", 2)).toEqual({ ok: true, unchanged: true });
    expect(await events()).toBe(before);
    expect((await pending()).filter((r) => r.product_id === "p-local")).toHaveLength(0);
  });

  it("venta de la caja después del conteo sale como diferencia, detrás del conteo", async () => {
    await addProduct("p-orden", 9003);
    web.set(9003, 10);
    await setStock("p-orden", 5);
    await posSale("p-orden", 1);
    const rows = await bridgeA();
    expect(rows.map((r) => [r.kind, Number(r.delta), r.set_to === null ? null : Number(r.set_to)]))
      .toEqual([["inventory.counted", 5, 5], ["sale.completed", -1, null]]);
    expect(web.get(9003)).toBe(4);
    expect(await caja("p-orden")).toBe(4);
  });

  it("pedido web pasado a la caja después del conteo: la cifra fijada ya lo descuenta", async () => {
    await addProduct("p-web", 9004);
    web.set(9004, 8);
    await setStock("p-web", 5);
    await webSale(9004, 2, 7001); // la web baja a 6 y el paso B lo resta en la caja (B va antes que A)
    const rows = await bridgeA();
    expect(rows.map((r) => Number(r.set_to))).toEqual([3]);
    expect(web.get(9004)).toBe(3);
    expect(await caja("p-web")).toBe(3);
  });

  it("dos conteos seguidos del mismo producto: manda el último", async () => {
    await addProduct("p-dos", 9005);
    web.set(9005, 0);
    await setStock("p-dos", 4);
    await posSale("p-dos", 1);
    await setStock("p-dos", 9);
    await bridgeA();
    expect(web.get(9005)).toBe(9);
    expect(await caja("p-dos")).toBe(9);
  });

  it("ventas normales siguen siendo diferencias (set_to vacío)", async () => {
    await posSale("p-real", 1);
    const rows = await pending();
    expect(rows.map((r) => [r.product_id, Number(r.delta), r.set_to])).toEqual([["p-real", -1, null]]);
    await bridgeA();
    expect(web.get(9001)).toBe(0);
  });

  it("permisos: solo el puente (service_role) puede leer la cola", async () => {
    const { rows } = await db.query(`SELECT has_function_privilege('authenticated', 'public.nexo_business_stock_to_web(text, integer)', 'EXECUTE') AS a,
      has_function_privilege('anon', 'public.nexo_business_stock_to_web(text, integer)', 'EXECUTE') AS b,
      has_function_privilege('service_role', 'public.nexo_business_stock_to_web(text, integer)', 'EXECUTE') AS s,
      has_function_privilege('authenticated', 'public.nexo_business_set_stock(text, text, bigint, text)', 'EXECUTE') AS o`);
    expect(rows[0]).toEqual({ a: false, b: false, s: true, o: true });
  });

  it("solo la dueña puede contar", async () => {
    expect(await rpcAs(db, u.staff, "public.nexo_business_set_stock", { p_business: BIZ, p_product: "p-real", p_quantity: 50, p_reason: null }))
      .toEqual({ error: "forbidden" });
  });
});
