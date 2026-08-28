import { describe, expect, it } from "vitest";
import { initialKnowledgeSeeds, normalizeKnowledgeIdentifier } from "./knowledge";

describe("NEXO product knowledge", () => {
  it("normaliza alias con acentos y separadores", () => {
    expect(normalizeKnowledgeIdentifier("  Colchón KONFORT 135 × 190  ")).toBe("colchon-konfort-135-190");
  });

  it("mantiene el Boviet físico en 620 W y nunca 625 W", () => {
    const boviet = initialKnowledgeSeeds.find((item) => item.id === "pk_boviet_620");
    expect(boviet).toBeTruthy();
    expect(boviet?.specs.find((spec) => spec.name === "Potencia máxima")?.value).toBe("620");
    expect(JSON.stringify(boviet)).not.toContain("625 W");
  });

  it("conserva como probable la discrepancia Royal RA123SL/RA12RSL", () => {
    const royal = initialKnowledgeSeeds.find((item) => item.id === "pk_royal_ra123sl");
    expect(royal?.confidence).toBe("probable");
    expect(royal?.aliases).toContain("RA123SL");
    expect(royal?.aliases).toContain("RA12RSL");
    expect(royal?.gaps.some((gap) => gap.question.includes("RA123SL") && gap.question.includes("RA12RSL"))).toBe(true);
  });

  it("no confirma líneas de colchones sin etiqueta física", () => {
    const mattresses = initialKnowledgeSeeds.filter((item) => item.brand === "KONFORT");
    expect(mattresses).toHaveLength(2);
    expect(mattresses.every((item) => item.model === null && item.confidence === "probable")).toBe(true);
    expect(mattresses.every((item) => item.gaps.length > 0)).toBe(true);
  });
});
