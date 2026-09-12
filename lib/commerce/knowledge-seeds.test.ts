import { describe, expect, it } from "vitest";
import type { ProductKnowledgeSeed } from "./knowledge";
import { dedupeKnowledgeSeeds, initialKnowledgeSeeds } from "./knowledge";

function seed(id: string, sku: string | null, woo: number | null): ProductKnowledgeSeed {
  return {
    id,
    sku,
    woocommerceProductId: woo,
    brand: null,
    model: null,
    aliases: [],
    productType: "test",
    summary: "test",
    customerDescription: "test",
    confidence: "confirmed_nexo",
    specs: [],
    faq: [],
    sources: [],
    salesPlaybook: { benefits: [], idealCustomer: [], sellingPoints: [], objections: [], warnings: [] },
    gaps: [],
  };
}

describe("knowledge seed identity", () => {
  it("keeps the first canonical record for duplicate SKU or WooCommerce ID", () => {
    const result = dedupeKnowledgeSeeds([
      seed("canonical", "NEXO-ONE", 10),
      seed("same-sku", "nexo-one", 11),
      seed("same-woo", "NEXO-TWO", 10),
      seed("unique", "NEXO-THREE", 12),
    ]);
    expect(result.map((item) => item.id)).toEqual(["canonical", "unique"]);
  });

  it("prefers the record linked to WooCommerce over an unlinked duplicate SKU", () => {
    const result = dedupeKnowledgeSeeds([
      seed("supplier-note", "NEXO-ONE", null),
      seed("canonical", "nexo-one", 10),
    ]);
    expect(result.map((item) => item.id)).toEqual(["canonical"]);
  });

  it("ships without conflicting seed identities", () => {
    const ids = initialKnowledgeSeeds.map((item) => item.id);
    const skus = initialKnowledgeSeeds.flatMap((item) => item.sku ? [item.sku.toLowerCase()] : []);
    const wooIds = initialKnowledgeSeeds.flatMap((item) => item.woocommerceProductId === null ? [] : [item.woocommerceProductId]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(skus).size).toBe(skus.length);
    expect(new Set(wooIds).size).toBe(wooIds.length);
  });
});
