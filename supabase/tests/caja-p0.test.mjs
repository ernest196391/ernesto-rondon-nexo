// Caja P0 (20-oct): última conexión y versión, D80 (2 % de mostrador), un cajón
// por tienda (turno de la tienda, «debería haber», dependienta de turno) e informe.
// Core local (migraciones reales en PGlite). No toca la nube.
import { beforeAll, describe, expect, it } from "vitest";
import { createHash, randomUUID } from "node:crypto";
import { startCore, rpcAs, seedStore } from "./core-harness.mjs";

const BIZ = "casa-viva";
const TOKEN_A = "a".repeat(40);
const TOKEN_B = "b".repeat(40);
const hash = (t) => createHash("sha256").update(t).digest("hex");
let db;
let u;
let nana;
let zaymi;
let gestora;

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

const sale = (id, shift, { staff = null, gestor = null, cash = [], lines = [{ product_id: "bc-100", quantity: 1, line_total_minor: 1000 }] } = {}) => ({
  sale_id: id, shift_id: shift, staff_id: staff, gestor_id: gestor, lines,
  total_minor: lines.reduce((t, l) => t + l.line_total_minor, 0),
  payments: cash.map(([currency, amount]) => ({ method: "cash", rail: "cash", currency, amount_minor: amount })),
});

beforeAll(async () => {
  db = await startCore();
  u = await seedStore(db, BIZ);
  await db.exec(`
    INSERT INTO nexo_business.devices (business_id, device_id, label, token_hash, active) VALUES
      ('${BIZ}', 'caja-nana', 'Caja Nana', '${hash(TOKEN_A)}', TRUE),
      ('${BIZ}', 'caja-zaymi', 'Caja Zaymi', '${hash(TOKEN_B)}', TRUE);
    INSERT INTO nexo_business.cost_settings (business_id, staff_pct, commission_mode, commission_value) VALUES ('${BIZ}', 0.5, 'percent', 10)
      ON CONFLICT (business_id) DO UPDATE SET staff_pct = 0.5, commission_mode = 'percent', commission_value = 10;
  `);
  nana = (await one(`INSERT INTO nexo_business.people (business_id, kind, full_name, status, phone) VALUES ($1, 'staff', 'Daniela (Nana)', 'active', '5355550001') RETURNING id`, [BIZ])).id;
  zaymi = (await one(`INSERT INTO nexo_business.people (business_id, kind, full_name, status, phone) VALUES ($1, 'staff', 'Zaymi', 'active', '5355550002') RETURNING id`, [BIZ])).id;
  gestora = (await one(`INSERT INTO nexo_business.people (business_id, kind, full_name, status) VALUES ($1, 'gestor', 'Dany', 'active') RETURNING id`, [BIZ])).id;
}, 60_000);

describe("equipos: última conexión y versión", () => {
  it("el checkin marca la conexión aunque no haya ventas y guarda la versión", async () => {
    expect((await call("public.nexo_business_device_checkin", "x", "1.1.0")).error).toBe("unauthorized");
    const who = await call("public.nexo_business_device_checkin", TOKEN_A, "1.1.0 <script>");
    expect(who).toMatchObject({ businessId: BIZ, deviceId: "caja-nana" });
    const d = await one("SELECT last_seen_at, last_pull_at, app_version FROM nexo_business.devices WHERE device_id = 'caja-nana'");
    expect(d.last_seen_at).not.toBeNull();
    expect(d.last_pull_at).not.toBeNull();
    expect(d.app_version).toBe("1.1.0script");
    const list = await rpcAs(db, u.owner, "public.nexo_business_device_status", { p_business: BIZ });
    expect(list.find(x => x.deviceId === "caja-nana").appVersion).toBe("1.1.0script");
    expect((await rpcAs(db, u.stranger, "public.nexo_business_device_status", { p_business: BIZ })).error).toBe("forbidden");
  });
});

describe("D80: venta de mostrador", () => {
  it("sin gestora: 2 % para quien atiende y nada del 0,5 %", async () => {
    await push("caja-nana", "sale.completed", "v-mostrador", sale("v-mostrador", null, { staff: nana, lines: [{ product_id: "bc-100", quantity: 2, line_total_minor: 5000 }] }));
    const rows = await q("SELECT kind, amount_usd::float AS usd, person_id FROM nexo_business.commission_entries WHERE sale_id = 'v-mostrador'");
    expect(rows).toEqual([{ kind: "counter_staff", usd: 1, person_id: nana }]);
  });
  it("con gestora: como antes (10 % gestora, 0,5 % dependienta)", async () => {
    await push("caja-nana", "sale.completed", "v-gestora", sale("v-gestora", null, { staff: nana, gestor: gestora, lines: [{ product_id: "bc-100", quantity: 1, line_total_minor: 10000 }] }));
    const rows = await q("SELECT kind, amount_usd::float AS usd FROM nexo_business.commission_entries WHERE sale_id = 'v-gestora' ORDER BY kind");
    expect(rows).toEqual([{ kind: "gestor", usd: 10 }, { kind: "staff", usd: 0.5 }]);
  });
  it("sin «Atiende» nadie cobra", async () => {
    await push("caja-nana", "sale.completed", "v-nadie", sale("v-nadie", null));
    expect((await q("SELECT 1 FROM nexo_business.commission_entries WHERE sale_id = 'v-nadie'")).length).toBe(0);
  });
});

describe("un cajón por tienda", () => {
  const S = "turno-hoy";
  it("la primera caja abre; la segunda se une al mismo turno", async () => {
    expect((await call("public.nexo_business_on_duty", BIZ)).open).toBe(false);
    const opened = await call("public.nexo_business_device_shift", TOKEN_A, "open", { shiftId: S, operatorId: nana });
    expect(opened.action).toBe("open");
    // La otra caja intenta abrir su propio turno: le dicen que se una.
    const second = await call("public.nexo_business_device_shift", TOKEN_B, "open", { shiftId: "otro", operatorId: zaymi });
    expect(second).toMatchObject({ action: "join", shift: { storeShiftId: S, openedBy: "Daniela (Nana)", openedDevice: "Caja Nana" } });
    // Llegan los eventos.
    await push("caja-nana", "cash_shift.opened", S, { shift_id: S, operator_id: nana, store_role: "opener", opening_floats: [{ currency: "USD", amount_minor: 5000 }, { currency: "CUP", amount_minor: 100000 }] });
    await push("caja-zaymi", "cash_shift.joined", S, { shift_id: S, operator_id: zaymi, store_role: "joiner", opening_floats: [] });
    const rows = await q("SELECT device_id, role, store_shift_id, claimed FROM nexo_business.store_shifts WHERE store_shift_id = $1 ORDER BY device_id", [S]);
    expect(rows).toEqual([
      { device_id: "caja-nana", role: "opener", store_shift_id: S, claimed: false },
      { device_id: "caja-zaymi", role: "joiner", store_shift_id: S, claimed: false },
    ]);
  });

  it("la dependienta de turno es quien abrió hoy (para el bot)", async () => {
    expect(await call("public.nexo_business_on_duty", BIZ)).toMatchObject({ open: true, storeShiftId: S, name: "Daniela (Nana)", phone: "5355550001" });
    const days = await call("public.nexo_business_shift_days", BIZ, "2026-01-01", "2099-01-01");
    expect(days.at(-1)).toMatchObject({ staffId: nana, name: "Daniela (Nana)" });
  });

  it("una apertura sin internet del mismo rato se une y su fondo no se suma", async () => {
    await push("caja-zaymi", "cash_shift.opened", "offline-2", { shift_id: "offline-2", operator_id: zaymi, store_role: "opener", opening_floats: [{ currency: "USD", amount_minor: 5000 }] });
    expect(await one("SELECT store_shift_id, merged FROM nexo_business.store_shifts WHERE shift_id = 'offline-2'")).toEqual({ store_shift_id: S, merged: true });
  });

  it("debería haber = fondo + efectivo de todas las cajas + web − salidas, sin contar dos veces", async () => {
    await push("caja-nana", "sale.completed", "v1", sale("v1", S, { staff: nana, cash: [["USD", 2000]] }));
    await push("caja-zaymi", "sale.completed", "v2", sale("v2", S, { staff: zaymi, cash: [["CUP", 50000]] }));
    await push("caja-zaymi", "sale.completed", "v3", sale("v3", S, { staff: zaymi, cash: [] })); // transferencia: no es efectivo
    // Pedido web cobrado en la caja (order_cash, web_order) y un gasto.
    await push("caja-zaymi", "cash_movement.recorded", "m1", { shift_id: S, kind: "order_cash", direction: "in", currency: "USD", amount_minor: 3300, source_type: "web_order", source_id: "4223" });
    await push("caja-nana", "cash_movement.recorded", "m2", { shift_id: S, kind: "expense", direction: "out", currency: "CUP", amount_minor: 10000 });
    await push("caja-nana", "sale.returned", "r1", { shift_id: S, sale_id: "v1", currency: "USD", refund_minor: 500, refund_rail: "cash" });
    // Otro turno: no cuenta.
    await push("caja-nana", "sale.completed", "v-otro", sale("v-otro", "otro-turno", { cash: [["USD", 99900]] }));
    const r = await call("public.nexo_business_device_shift", TOKEN_B, "expected", { shiftId: S, web: [{ currency: "USD", amountMinor: 4000 }, { currency: "CUP", amountMinor: 0 }] });
    const usd = r.currencies.find(c => c.currency === "USD");
    const cup = r.currencies.find(c => c.currency === "CUP");
    expect(usd).toMatchObject({ openingFloatMinor: 5000, salesCashMinor: 2000, webInCajaMinor: 3300, webInVentasMinor: 4000, outMinor: 500, expectedMinor: 13800 });
    expect(cup).toMatchObject({ openingFloatMinor: 100000, salesCashMinor: 50000, outMinor: 10000, expectedMinor: 140000 });
    expect(r.shift.devices.map(d => d.label).sort()).toEqual(["Caja Nana", "Caja Zaymi", "Caja Zaymi"]);
    expect((await call("public.nexo_business_device_shift", TOKEN_B, "expected", { shiftId: "no-existe" })).error).toBe("unknown_shift");
  });

  it("al cerrar en una caja se cierra para todas, y la otra lo sabe", async () => {
    await push("caja-zaymi", "cash_shift.closed", S, { shift_id: S, closed_by: zaymi, expected_source: "cloud", counts: [{ currency: "USD", expected_minor: 13800, counted_minor: 13800, difference_minor: 0 }] });
    const status = await call("public.nexo_business_device_shift", TOKEN_A, "status", { shiftId: S });
    expect(status.open).toBeNull();
    expect(status.mine).toMatchObject({ status: "closed", closedBy: "Zaymi" });
    expect((await q("SELECT status FROM nexo_business.store_shifts WHERE store_shift_id = $1", [S])).every(r => r.status === "closed")).toBe(true);
    expect((await call("public.nexo_business_on_duty", BIZ)).open).toBe(false);
  });

  it("el informe enseña quién atendió y los turnos", async () => {
    const today = new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 10);
    const r = await rpcAs(db, u.owner, "public.nexo_business_report", { p_business: BIZ, p_from: "2026-01-01", p_to: today });
    expect(r.sales.find(s => s.saleId === "v-mostrador")).toMatchObject({ staff: "Daniela (Nana)", gestora: null });
    expect(r.sales.find(s => s.saleId === "v-gestora")).toMatchObject({ gestora: "Dany" });
    const nanaRow = r.staff.find(s => s.name === "Daniela (Nana)");
    expect(nanaRow).toMatchObject({ counterUsd: 1.2, staffUsd: 0.5 }); // 2 % de 50 + 2 % de 10 (v1)
    const turno = r.shifts.find(s => s.shiftId === S);
    expect(turno).toMatchObject({ openedBy: "Daniela (Nana)", closedBy: "Zaymi", status: "closed", expectedSource: "cloud", oneDrawer: true });
    expect(r.withoutStaff.sales).toBeGreaterThan(0);
  });

  it("la migración se puede aplicar otra vez sin romper nada", async () => {
    const { readFileSync } = await import("node:fs");
    const sql = readFileSync(new URL("../migrations/20261020120000_nexo_business_caja_p0.sql", import.meta.url), "utf8");
    await db.exec(sql);
    expect((await one("SELECT count(*)::int AS n FROM nexo_business.store_shifts")).n).toBeGreaterThan(0);
  });
});

describe("pedidos web: quién cobra", () => {
  it("la caja obtiene nombre, teléfono e id web de la dependienta de Atiende (solo personal activo)", async () => {
    const r = await call("public.nexo_business_device_person", TOKEN_A, nana);
    expect(r).toMatchObject({ deviceId: "caja-nana", label: "Caja Nana", person: { name: "Daniela (Nana)", phone: "5355550001" } });
    expect((await call("public.nexo_business_device_person", TOKEN_A, gestora)).person).toBeNull();
    expect((await call("public.nexo_business_device_person", "z".repeat(40), nana)).error).toBe("unauthorized");
  });
});
