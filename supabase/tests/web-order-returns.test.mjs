// Pedido web: cancelar o devolver desde la caja (Ernesto 31-oct, caso de la olla Ariete, pedido web de 62 USD).
// La devolución en efectivo sale del cajón LIGADA al pedido y queda pendiente de Lennys; el bot recibe
// el pedido, el producto y la causa. La parte por transferencia también la aprueba Lennys.
// Core local (migraciones reales en PGlite). No toca la nube.
import { beforeAll, describe, expect, it } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { startCore, rpcAs, seedStore } from "./core-harness.mjs";

const BIZ = "casa-viva";
const hash = (t) => createHash("sha256").update(t).digest("hex");
let db;
let u;
let zaymi;

const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const one = async (sql, params = []) => (await q(sql, params))[0];
const call = async (fn, ...args) =>
  (await one(`SELECT ${fn}(${args.map((_, i) => `$${i + 1}`).join(", ")}) AS r`, args.map(a => (a !== null && typeof a === "object" ? JSON.stringify(a) : a)))).r;

async function push(device, op, entityId, payload, occurredAt = new Date().toISOString()) {
  await db.query(
    `INSERT INTO nexo_business.sync_events (event_id, business_id, device_id, operation_type, entity_type, entity_id, occurred_at, envelope)
     VALUES ($1, $2, $3, $4, split_part($4, '.', 1), $5, $6, $7)`,
    [randomUUID(), BIZ, device, op, entityId, occurredAt, JSON.stringify({ contract_version: 1, payload })]);
}

beforeAll(async () => {
  db = await startCore();
  u = await seedStore(db, BIZ);
  await db.exec(`INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active) VALUES ('${BIZ}', 'telefono-2', 'Teléfono 2', '${hash("z".repeat(40))}', TRUE);`);
  zaymi = (await one(`INSERT INTO nexo_business.people (business_id, kind, full_name, status, phone) VALUES ($1, 'staff', 'Zaymi', 'active', '5355550002') RETURNING id`, [BIZ])).id;
}, 60_000);

describe("devolución de la olla Ariete desde la caja", () => {
  it("62 USD en efectivo: salida ligada al pedido, pendiente de Lennys, con pedido, producto y causa", async () => {
    const reason = "Devolución pedido #5612 · 1× Olla de presión eléctrica Ariete digital · causa: La olla no calienta, la clienta la trajo";
    // Lo que manda la caja (mismo orden que el outbox): la salida del cajón y la acción.
    await push("telefono-2", "cash_movement.recorded", "wret-olla-1-usd", {
      movement_id: "wret-olla-1-usd", shift_id: "turno-31", kind: "cash_out", direction: "out", currency: "USD", amount_minor: 6200,
      reason, category: "devolucion_pedido", source_system: "woocommerce", source_type: "web_order_return", source_id: "5612", operator_id: zaymi });
    await push("telefono-2", "web_order.action_recorded", "wret-olla-1", {
      action_id: "wret-olla-1", kind: "return", shift_id: "turno-31", order_id: 5612, order_number: "5612", reason: "La olla no calienta, la clienta la trajo",
      products: "1× Olla de presión eléctrica Ariete digital", refund_method: "cash", refund_usd_minor: 6200, refund_cup_minor: 0, cash_usd_minor: 6200, cash_cup_minor: 0, staff_id: zaymi });

    const rows = await q("SELECT category, currency, amount_minor::int AS amt, order_id, method, status FROM nexo_business.fund_exit_approvals WHERE order_id = '5612'");
    expect(rows).toEqual([{ category: "devolucion_pedido", currency: "USD", amt: 6200, order_id: "5612", method: "cash", status: "pending" }]);

    const bot = await call("public.nexo_business_fund_exits_to_notify", BIZ);
    expect(bot).toHaveLength(1);
    expect(bot[0]).toMatchObject({ category: "devolucion_pedido", amountMinor: 6200, orderId: "5612", method: "cash", operator: "Zaymi", device: "Teléfono 2", reason });
    expect(bot[0].text).toBe(reason + " · 62.00 USD en efectivo del cajón · la hizo Zaymi");
    expect(await call("public.nexo_business_fund_exits_to_notify", BIZ)).toEqual([]); // nunca dos veces

    const yes = await call("public.nexo_business_fund_exit_decide", BIZ, bot[0].id, true, "Lennys");
    expect(yes).toMatchObject({ ok: true, status: "approved" });
    const today = new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 10);
    const list = await rpcAs(db, u.owner, "public.nexo_business_fund_exits", { p_business: BIZ, p_from: "2026-01-01", p_to: today });
    expect(list.find(x => x.orderId === "5612")).toMatchObject({ status: "approved", method: "cash" });
  });

  it("por transferencia: no toca el cajón pero también la aprueba Lennys; repetir el evento no duplica", async () => {
    const action = { action_id: "wret-5700", kind: "return", order_id: 5700, order_number: "5700", reason: "Llegó rota", products: "2× Taza",
      refund_method: "mixed", refund_usd_minor: 1000, refund_cup_minor: 250000, cash_usd_minor: 1000, cash_cup_minor: 0, staff_id: zaymi };
    await push("telefono-2", "web_order.action_recorded", "wret-5700", action);
    await push("telefono-2", "web_order.action_recorded", "wret-5700", action);
    const rows = await q("SELECT movement_id, currency, amount_minor::int AS amt, method, reason FROM nexo_business.fund_exit_approvals WHERE order_id = '5700'");
    expect(rows).toEqual([{ movement_id: "wret-5700-trf-cup", currency: "CUP", amt: 250000, method: "transfer", reason: "Devolución pedido #5700 · 2× Taza · causa: Llegó rota · por transferencia" }]);
  });

  it("una cancelación no pide aprobación de dinero", async () => {
    await push("telefono-2", "web_order.action_recorded", "wcan-5800", { action_id: "wcan-5800", kind: "cancel", order_id: 5800, order_number: "5800", reason: "Ya no lo quiere" });
    expect(await q("SELECT 1 FROM nexo_business.fund_exit_approvals WHERE order_id = '5800'")).toEqual([]);
  });
});
