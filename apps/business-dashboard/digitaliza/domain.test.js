import { describe, expect, it } from "vitest";
import { STORES } from "./store-config.js";
import { newDraft, parseMoney, parseQty, missing, nextStep, stage, toCommitPayload, groupCatalog, targetFrom, pendingAfterSync } from "./domain.js";

const cfg = STORES["casa-viva"];
const photo = { id: "p1", name: "a.jpg", type: "image/jpeg", size: 10, blob: null, uploadedPath: null };

function readyNew() {
  const d = newDraft(cfg, "new");
  d.photos = [photo];
  d.product.name = "Lámpara";
  d.product.price = "25,50";
  d.quantity = "4";
  return d;
}

describe("dinero y cantidades", () => {
  it.each([["12", 1200], ["12,5", 1250], ["12,50", 1250], ["12.50", 1250], ["1.250,50", 125050], ["1,250.50", 125050], ["1.250", 125000], ["3000", 300000]])(
    "%s -> %i", (text, minor) => expect(parseMoney(text)).toBe(minor));
  it.each(["", "0", "abc", "-5", "1,2,3x"])("%s no es un precio", (text) => expect(parseMoney(text)).toBeNull());
  it("cantidad entera ≥ 0", () => {
    expect(parseQty("5")).toBe(5);
    expect(parseQty("0")).toBe(0);
    expect(parseQty("2.5")).toBeNull();
    expect(parseQty("-1")).toBeNull();
  });
});

describe("qué falta y siguiente paso", () => {
  it("sin tipo: elegirlo", () => {
    const d = newDraft(cfg);
    expect(nextStep(d).step).toBe("tipo");
    expect(stage(d)).toBe("reception");
  });

  it("producto nuevo: fotos primero, luego datos, luego confirmar", () => {
    const d = newDraft(cfg, "new");
    expect(nextStep(d).step).toBe("fotos");
    expect(missing(d)).toEqual(["Al menos una foto del producto", "El nombre del producto", "El precio de venta", "La cantidad recibida"]);
    d.photos = [photo];
    expect(nextStep(d).step).toBe("datos");
    expect(stage(d)).toBe("data_pending");
    const ready = readyNew();
    expect(missing(ready)).toEqual([]);
    expect(nextStep(ready)).toEqual({ step: "revisar", action: "Confirmar ficha y guardar en Core" });
    ready.sync.status = "failed";
    expect(nextStep(ready).action).toBe("Reintentar guardar en Core");
  });

  it("variantes: nombres distintos y al menos una unidad", () => {
    const d = readyNew();
    d.hasVariants = true;
    d.variants = [{ label: "Azul", quantity: "0" }, { label: "azul", quantity: "0" }];
    expect(missing(d)).toEqual(["Variantes con nombres distintos", "Al menos una unidad recibida"]);
    d.variants[1] = { label: "Blanca", quantity: "2" };
    expect(missing(d)).toEqual([]);
  });

  it("reposición: producto y una cantidad positiva", () => {
    const d = newDraft(cfg, "restock");
    expect(missing(d)).toEqual(["El producto de Core al que corresponde"]);
    d.target = targetFrom({ groupId: "g", name: "Cortina", items: [{ productId: "a", variantLabel: "Beige", stock: 3, stockAuthority: "core" }] });
    expect(missing(d)).toEqual(["Cuántas unidades llegaron"]);
    d.target.lines[0].quantity = "x";
    expect(missing(d)).toContain("Cantidades en números enteros");
    d.target.lines[0].quantity = "5";
    expect(missing(d)).toEqual([]);
  });

  it("guardado en Core: el contenido sigue su propio estado", () => {
    const d = readyNew();
    d.confirmedAt = "2026-10-05T00:00:00Z";
    expect(stage(d)).toBe("sheet_confirmed");
    d.sync = { status: "synced", attempts: [], result: { lines: [] } };
    expect(stage(d)).toBe("sheet_confirmed");
    expect(nextStep(d).step).toBe("resultado");
    expect(pendingAfterSync(d)).toContain("Video vertical (bloque 3)");
  });
});

describe("carga para Core", () => {
  it("producto nuevo sin variantes", () => {
    const d = readyNew();
    d.sources.name = "person";
    const p = toCommitPayload(d, [{ path: "casa-viva/x/1.jpg" }]);
    expect(p).toMatchObject({ id: d.id, kind: "new", product: { name: "Lámpara", prices: { USD: 2550 } }, lines: [{ label: null, quantity: 4 }],
      photos: [{ path: "casa-viva/x/1.jpg" }], sheet: { sources: { name: "person" }, fields: { priceMinor: 2550, currency: "USD" } } });
  });

  it("reposición: solo las líneas con unidades; corrección acepta 0", () => {
    const r = newDraft(cfg, "restock");
    r.target = targetFrom(groupCatalog([
      { productId: "a", name: "Cortina — Beige", variantOf: "g", variantLabel: "Beige", stock: 3 },
      { productId: "b", name: "Cortina — Gris", variantOf: "g", variantLabel: "Gris", stock: 1 },
    ])[0]);
    r.target.lines[1].quantity = "2";
    expect(toCommitPayload(r).lines).toEqual([{ productId: "b", quantity: 2 }]);
    const c = newDraft(cfg, "correction");
    c.target = structuredClone(r.target);
    c.target.lines[0].counted = "0";
    expect(toCommitPayload(c).lines).toEqual([{ productId: "a", counted: 0 }]);
  });

  it("no deja enviar con datos incompletos", () => {
    expect(() => toCommitPayload(newDraft(cfg, "new"))).toThrow(/Faltan datos/);
  });

  it("agrupa variantes con el nombre sin la variante", () => {
    const g = groupCatalog([{ productId: "a", name: "Cortina — Beige", variantOf: "g" }, { productId: "s", name: "Farol", variantOf: null }]);
    expect(g.map((x) => [x.name, x.items.length])).toEqual([["Cortina", 1], ["Farol", 1]]);
  });
});
