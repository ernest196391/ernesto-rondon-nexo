import { describe, expect, it } from "vitest";
import { applyEditorial, containsProhibitedCopy, editorialFor, PROHIBITED_PUBLIC_COPY, validateEditorial } from "./product-editorial";

const skus = ["NEXO-KONFORT-120X190", "NEXO-KONFORT-135X190", "NEXO-ROYAL-REG202V", "NEXO-BOVIET-BVM8611M-620", "NEXO-FRIDGE-WD", "NEXO-RA123SL", "NEXO-GF-8816", "NEXO-HB-BLENDER-WHITE", "NEXO-PARKER-SPLIT", "NEXO-DIGITAL-HD", "NEXO-PH43HDCE"];

describe("capa editorial pública", () => {
  it.each(skus)("define copy y SEO únicos para %s", (sku) => {
    const editorial = editorialFor({ sku });
    expect(editorial).toBeDefined();
    expect(editorial!.displayName.length).toBeLessThanOrEqual(60);
    expect(editorial!.metaDescription.length).toBeGreaterThanOrEqual(120);
    expect(editorial!.metaDescription.length).toBeLessThanOrEqual(180);
    expect(editorial!.longDescription).not.toBe(editorial!.shortDescription);
    expect(editorial!.keyBenefits.length).toBeGreaterThanOrEqual(3);
    expect(editorial!.faq.length).toBeGreaterThanOrEqual(2);
    expect(containsProhibitedCopy(editorial)).toBe(false);
    expect(validateEditorial(editorial!)).toEqual([]);
    expect(editorial!.keyBenefits.map((item) => item.title.toLowerCase())).not.toContain("marca");
    expect(editorial!.keyBenefits.map((item) => item.title.toLowerCase())).not.toContain("modelo");
  });
  it("conserva el nombre canónico y los alias en búsqueda", () => {
    const product = applyEditorial({ sku: "NEXO-RA123SL", name: "Ventilador solar recargable Royal RA123SL de 12 pulgadas con bombillos LED" });
    expect(product.name).toBe("Ventilador solar recargable Royal");
    expect(product.search_text).toContain("RA123SL");
    expect(product.search_text).toContain("bombillos");
  });
  it.each(PROHIBITED_PUBLIC_COPY)("detecta la frase prohibida: %s", (phrase) => {
    expect(containsProhibitedCopy({ answer: phrase })).toBe(true);
  });
  it.each([
    "NEXO-SUMRY-4000W-24V",
    "NEXO-BLUETTI-ELITE100-V2",
    "NEXO-ECOFLOW-DELTA3-ULTRA",
    "NEXO-LAMPARA-LED-30W",
    "NEXO-OCEDAR-EASYWRING",
    "NEXO-LOLARAN-AL1000",
    "NEXO-ASPIRADORA-MANO-USB",
    "NEXO-LUMIVAULT-X3PRO",
    "NEXO-LOGIC-ML8",
    "NEXO-BAMBU-A1-COMBO",
    "NEXO-MOCHILA-COMPACTA",
    "NEXO-CINTURON-TERMICO",
  ])("completa beneficios, especificaciones, FAQ y SEO para %s", (sku) => {
    const editorial = editorialFor({ sku });
    expect(editorial).toBeDefined();
    expect(editorial!.keyBenefits.length).toBeGreaterThanOrEqual(4);
    expect(editorial!.specifications.length).toBeGreaterThanOrEqual(5);
    expect(editorial!.faq.length).toBeGreaterThanOrEqual(3);
    expect(editorial!.searchAliases.length).toBeGreaterThanOrEqual(5);
    expect(editorial!.metaDescription.length).toBeGreaterThanOrEqual(100);
    expect(validateEditorial(editorial!)).toEqual([]);
  });
});
