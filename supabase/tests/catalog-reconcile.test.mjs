import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../functions/nexo-stock-bridge/index.ts", import.meta.url), "utf8");
const start = source.indexOf("// M. Metadatos NEXO → Woo");
const end = source.indexOf("// E. «Se muestra solo al reponer»", start);
const block = start >= 0 && end > start ? source.slice(start, end) : "";

describe("reconciliación de catálogo NEXO → Woo", () => {
  it("usa una sola reconciliación canónica dentro del puente programado", () => {
    expect(start).toBeGreaterThanOrEqual(0);
    expect(block).toContain('core("POST", "panel/catalog/reconcile"');
    expect(block).toContain('admin.rpc("nexo_business_catalog_reconcile_items"');
    expect((source.match(/panel\/catalog\/reconcile/g) ?? [])).toHaveLength(1);
  });

  it("solo manda metadatos no financieros", () => {
    expect(block).toContain("wooId");
    expect(block).toContain("name:");
    expect(block).toContain("sku:");
    expect(block).toContain("parentWooId:");
    expect(block).not.toContain('.schema("nexo_business")');
    expect(block).not.toMatch(/\bprice\s*:/);
    expect(source.match(/panel\/catalog\/reconcile[\s\S]{0,2500}\bprice\s*:/g) ?? []).toHaveLength(0);
    expect(block).not.toMatch(/\bstock\s*:/);
    expect(block).not.toMatch(/\bcommission/i);
    expect(block).not.toMatch(/\bvisibility\s*:/);
  });

  it("hace visibles los conflictos y las reparaciones", () => {
    expect(block).toContain("catalogSkuConflicts");
    expect(block).toContain("catalogParentOptions");
    expect(block).toContain("skuConflict");
  });
});
