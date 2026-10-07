// Ficha central de conocimiento contra un Core local (migraciones reales en PGlite).
import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { startCore, rpcAs, seedStore } from "./core-harness.mjs";
import { OLLA_REINA_EON } from "../../apps/business-dashboard/digitaliza/pilots/olla-reina-eon.js";

const BIZ = "casa-viva";
let db, u, group;
const call = (user, fn, args) => rpcAs(db, user, `public.${fn}`, { p_business: BIZ, ...args });
const knowledge = () => call(u.owner, "nexo_business_knowledge", { p_group: group });

beforeAll(async () => {
  db = await startCore();
  u = await seedStore(db, BIZ);
  const r = await call(u.owner, "nexo_business_intake_commit", { p_intake: { id: randomUUID(), ...OLLA_REINA_EON.intake } });
  group = r.groupId;
  for (const fact of OLLA_REINA_EON.facts) {
    const saved = await call(u.owner, "nexo_business_fact_save", { p_group: group, p_fact: fact });
    expect(saved.ok, JSON.stringify(saved)).toBe(true);
  }
}, 60_000);

describe("caso piloto: Olla Reina EON", () => {
  it("la ficha reúne datos de Core (precio, existencias) y los hechos con su estado", async () => {
    const k = await knowledge();
    expect(k.products[0]).toMatchObject({ name: "Olla Reina EON", prices: { USD: 6500 }, stock: 10 });
    expect(k.version).toBe(OLLA_REINA_EON.facts.length);
    const power = k.facts.find((f) => f.key === "power");
    expect(power).toMatchObject({ value: "800", unit: "W", status: "declared", scope: "product" });
    expect(k.pending).toEqual(["Consumo real (kWh por cocción)", "Fabricante y modelo exacto", "Tiempos de cocción reales"]);
    const model = k.facts.find((f) => f.key === "manufacturer_model");
    expect(model.value).toBeNull();
    expect(model.evidence).toHaveLength(2);
  });
});

describe("reglas de evidencia", () => {
  const base = { key: "material", label: "Material de la olla interior", kind: "feature", source: "Prueba" };
  it("no se rellena un dato pendiente ni se verifica sin evidencia", async () => {
    expect(await call(u.owner, "nexo_business_fact_save", { p_group: group, p_fact: { ...base, status: "pending", value: "Acero" } })).toMatchObject({ error: "invalid" });
    expect(await call(u.owner, "nexo_business_fact_save", { p_group: group, p_fact: { ...base, status: "verified", value: "Acero" } }))
      .toMatchObject({ error: "invalid", message: "Un dato verificado necesita evidencia (enlace o archivo)" });
    expect(await call(u.owner, "nexo_business_fact_save", { p_group: group, p_fact: { ...base, status: "declared" } })).toMatchObject({ error: "invalid" });
  });
  it("precio y existencias no se guardan como hechos", async () => {
    expect(await call(u.owner, "nexo_business_fact_save", { p_group: group, p_fact: { key: "precio", label: "Precio", kind: "price", value: "60", status: "declared", source: "x" } }))
      .toMatchObject({ error: "invalid" });
  });
  it("la dependienta no cambia hechos", async () => {
    expect(await call(u.staff, "nexo_business_fact_save", { p_group: group, p_fact: { ...base, status: "declared", value: "x" } })).toEqual({ error: "forbidden" });
  });
});

describe("piezas, versiones e historial", () => {
  it("una pieza guarda la versión de la ficha; con otra versión se rechaza", async () => {
    const k = await knowledge();
    const ok = await call(u.owner, "nexo_business_piece_record", { p_group: group, p_piece: { channel: "web", format: "ficha", templateId: "web-ficha",
      templateVersion: 1, knowledgeVersion: k.version, factKeys: ["power", "capacity"] } });
    expect(ok).toMatchObject({ ok: true, knowledgeVersion: k.version });
    expect(await call(u.owner, "nexo_business_piece_record", { p_group: group, p_piece: { channel: "web", format: "ficha", templateId: "web-ficha",
      templateVersion: 1, knowledgeVersion: k.version - 1 } })).toMatchObject({ error: "conflict" });
  });

  it("cambiar una característica usada marca la pieza; el historial conserva el valor anterior", async () => {
    await call(u.owner, "nexo_business_piece_record", { p_group: group, p_piece: { channel: "revolico", format: "anuncio", templateId: "revolico",
      templateVersion: 1, knowledgeVersion: (await knowledge()).version, factKeys: ["capacity"] } });
    const r = await call(u.owner, "nexo_business_fact_save", { p_group: group, p_fact: { key: "power", label: "Potencia", kind: "feature", value: "1000",
      unit: "W", status: "contradicted", source: "Placa de la olla", note: "La placa dice 1000 W; el anuncio, 800 W" } });
    expect(r.piecesToReview).toBe(1); // solo la pieza web usa «power»
    const k = await knowledge();
    expect(k.pieces.map((p) => [p.channel, p.status])).toEqual([["revolico", "draft"], ["web", "needs_review"]]);
    expect(k.pending).toContain("Potencia");
    const history = await call(u.owner, "nexo_business_fact_history", { p_group: group, p_key: "power" });
    expect(history.map((h) => [h.value, h.current])).toEqual([["1000", true], ["800", false]]);
  });

  it("cambiar la garantía o el precio en Core marca todas las piezas vivas", async () => {
    await call(u.owner, "nexo_business_fact_save", { p_group: group, p_fact: { key: "warranty", label: "Garantía", kind: "warranty", value: "3", unit: "meses", status: "declared", source: "Cambio de política" } });
    expect((await knowledge()).pieces.every((p) => p.status === "needs_review")).toBe(true);
    await db.query("UPDATE nexo_business.content_pieces SET status = 'approved' WHERE group_id = $1", [group]);
    await db.query("UPDATE nexo_business.catalog_products SET prices = '{\"USD\": 6000}' WHERE product_id = $1", [group]);
    const k = await knowledge();
    expect(k.pieces.every((p) => p.status === "needs_review" && p.reviewReason === "Cambió el precio en Core")).toBe(true);
  });
});

describe("experiencias reales", () => {
  it("se guardan aparte de las especificaciones y se corrigen con historial", async () => {
    const before = (await knowledge()).facts.find((f) => f.key === "cooking_times");
    const e = await call(u.staff, "nexo_business_experience_save", { p_group: group, p_exp: { title: "Frijoles negros", conditions: "Remojo 8 h, agua de la llave",
      quantities: "500 g frijoles + 1,5 L agua", settings: "Programa «Frijoles», válvula cerrada", duration: "45 min + 15 min de despresurizar",
      result: "Blandos, enteros", files: [{ path: "casa-viva/prueba/frijoles.jpg" }], testedBy: "Dependienta Prueba" } });
    expect(e.ok).toBe(true);
    const fix = await call(u.staff, "nexo_business_experience_save", { p_group: group, p_exp: { id: e.id, title: "Frijoles negros", duration: "40 min + 15 min", result: "Blandos, enteros" } });
    const k = await knowledge();
    expect(k.experiences).toHaveLength(1);
    expect(k.experiences[0]).toMatchObject({ id: fix.id, duration: "40 min + 15 min" });
    // La experiencia no cambia el hecho pendiente: complementa, no sustituye en silencio.
    expect(k.facts.find((f) => f.key === "cooking_times")).toEqual(before);
    const { rows } = await db.query("SELECT count(*)::int AS n FROM nexo_business.product_experiences WHERE group_id = $1", [group]);
    expect(rows[0].n).toBe(2);
  });
  it("sin título o resultado no se guarda; una extraña no puede", async () => {
    expect(await call(u.staff, "nexo_business_experience_save", { p_group: group, p_exp: { title: "x" } })).toMatchObject({ error: "invalid" });
    expect(await call(u.stranger, "nexo_business_experience_save", { p_group: group, p_exp: { title: "Prueba", result: "ok" } })).toEqual({ error: "forbidden" });
    expect(await call(u.stranger, "nexo_business_knowledge", { p_group: group })).toEqual({ error: "forbidden" });
  });
});
