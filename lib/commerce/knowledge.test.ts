import { describe, expect, it } from "vitest";
import { initialKnowledgeSeeds, normalizeKnowledgeIdentifier } from "./knowledge";

describe("NEXO product knowledge", () => {
  it("normaliza alias con acentos y separadores", () => {
    expect(normalizeKnowledgeIdentifier("  Colchón KONFORT 135 × 190  ")).toBe("colchon-konfort-135-190");
  });

  it("mantiene el Boviet físico en 620 W y nunca publica 625 W como potencia", () => {
    const boviet = initialKnowledgeSeeds.find((item) => item.id === "pk_boviet_620");
    expect(boviet).toBeTruthy();
    expect(boviet?.specs.find((spec) => spec.name === "Potencia máxima")?.value).toBe("620");
    expect(boviet?.specs.some((spec) => spec.unit === "W" && spec.value === "625")).toBe(false);
    expect(boviet?.summary).toContain("620 W");
    expect(boviet?.summary).not.toContain("625 W");
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

  it("incluye el segundo grupo de productos WooCommerce sin inventar SKU", () => {
    const linkedIds = [1009, 1011, 1013, 1015, 1021, 1023];
    const linked = initialKnowledgeSeeds.filter((item) => item.woocommerceProductId && linkedIds.includes(item.woocommerceProductId));
    expect(linked.map((item) => item.woocommerceProductId).sort()).toEqual(linkedIds);
    expect(linked.every((item) => item.sku === null)).toBe(true);
  });

  it("mantiene como desconocidos los datos críticos no verificados", () => {
    const parker = initialKnowledgeSeeds.find((item) => item.id === "pk_parker_split");
    const fridge = initialKnowledgeSeeds.find((item) => item.id === "pk_refrigerator_two_door");
    expect(parker?.confidence).toBe("unknown");
    expect(parker?.gaps.some((gap) => gap.question.includes("BTU"))).toBe(true);
    expect(parker?.specs.some((spec) => spec.name.includes("BTU"))).toBe(false);
    expect(fridge?.confidence).toBe("unknown");
    expect(fridge?.gaps.length).toBeGreaterThan(0);
    expect(fridge?.specs.some((spec) => /No Frost|inverter|capacidad/i.test(`${spec.name} ${spec.value}`))).toBe(false);
  });

  it("no presenta el manual BERA como evidencia confirmada de la unidad física", () => {
    const bera = initialKnowledgeSeeds.find((item) => item.id === "pk_bera_br150");
    expect(bera?.confidence).toBe("probable");
    expect(bera?.specs.every((spec) => spec.confidence === "probable")).toBe(true);
    expect(bera?.gaps.some((gap) => gap.question.includes("unidad física"))).toBe(true);
  });

  it("vincula los cinco productos de la primera prueba con fuentes y material para gestoras", () => {
    const ids = [1058, 1060, 1062, 1064, 1066];
    const batch = initialKnowledgeSeeds.filter((item) => item.woocommerceProductId && ids.includes(item.woocommerceProductId));
    expect(batch.map((item) => item.woocommerceProductId).sort()).toEqual(ids);
    expect(batch.every((item) => item.sku?.startsWith("NEXO-") && item.sources.length > 0)).toBe(true);
    expect(batch.every((item) => item.faq.length >= 3 && item.salesPlaybook.benefits.length > 0)).toBe(true);
  });

  it("conserva como no verificadas las especificaciones críticas de la lámpara genérica", () => {
    const lamp = initialKnowledgeSeeds.find((item) => item.id === "pk_lamp_led_usb_30w");
    expect(lamp?.confidence).toBe("probable");
    expect(lamp?.specs.find((spec) => spec.name === "Potencia anunciada")?.confidence).toBe("probable");
    expect(lamp?.specs.some((spec) => /autonomía|lúmenes|grado IP|batería/i.test(spec.name))).toBe(false);
    expect(lamp?.gaps.length).toBeGreaterThan(0);
  });

  it("no confunde DELTA 3 Ultra estándar con la variante Plus", () => {
    const ecoflow = initialKnowledgeSeeds.find((item) => item.id === "pk_ecoflow_delta3_ultra");
    expect(ecoflow?.model).toBe("DELTA 3 Ultra");
    expect(ecoflow?.specs.find((spec) => spec.name === "Expansión de batería")?.value).toContain("no compatible");
    expect(ecoflow?.salesPlaybook.warnings.join(" ")).toContain("no Plus");
  });

  it("registra el segundo lote comercial sin inventar datos críticos", () => {
    const lolaran = initialKnowledgeSeeds.find((item) => item.id === "pk_lolaran_al1000");
    const vacuum = initialKnowledgeSeeds.find((item) => item.id === "pk_generic_handheld_usb_vacuum");
    const doorbell = initialKnowledgeSeeds.find((item) => item.id === "pk_lumivault_x3pro");
    expect(lolaran?.woocommerceProductId).toBe(1078);
    expect(lolaran?.specs.some((spec) => spec.name === "Conteo de valor" && spec.value.includes("seleccionada"))).toBe(true);
    expect(vacuum?.gaps.some((gap) => gap.question.includes("potencia"))).toBe(true);
    expect(vacuum?.specs.some((spec) => /potencia|autonomía/i.test(spec.name))).toBe(false);
    expect(doorbell?.gaps.some((gap) => gap.question.includes("grado IP"))).toBe(true);
  });
});
