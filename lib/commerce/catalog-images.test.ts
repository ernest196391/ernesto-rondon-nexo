import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { catalogImageFor } from "./catalog-images";

const cases = [
  ["NEXO-KONFORT-120X190", "konfort-canonical-001l.webp"],
  ["NEXO-KONFORT-135X190", "konfort-canonical-001l.webp"],
  ["NEXO-BOVIET-BVM8611M-620", "boviet-620w.webp"],
  ["NEXO-ROYAL-REG202V", "royal-reg202v.webp"],
] as const;

describe("fotografías canónicas aportadas por NEXO", () => {
  it("reutiliza la fotografía limpia en las dos medidas sin mezclar sus fichas", () => {
    const image120 = catalogImageFor({ sku: "NEXO-KONFORT-120X190", images: [] });
    const image135 = catalogImageFor({ sku: "NEXO-KONFORT-135X190", images: [] });
    expect(image120).toBe(image135);
    expect(image120).toContain("konfort-canonical-001l.webp");
  });

  it.each(cases)("sirve una imagen WebP local para %s", (sku, filename) => {
    const url = catalogImageFor({ sku, images: [] });
    expect(url).toContain(`/catalog/owner/${filename}`);
    const path = `public${url!.split("?")[0]}`;
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path).subarray(8, 12).toString()).toBe("WEBP");
  });
});
