import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { catalogImageFor } from "./catalog-images";

const cases = [
  ["NEXO-KONFORT-120X190", "konfort-120x190.webp"],
  ["NEXO-BOVIET-BVM8611M-620", "boviet-620w.webp"],
  ["NEXO-ROYAL-REG202V", "royal-reg202v.webp"],
] as const;

describe("fotografías canónicas aportadas por NEXO", () => {
  it.each(cases)("sirve una imagen WebP local para %s", (sku, filename) => {
    const url = catalogImageFor({ sku, images: [] });
    expect(url).toContain(`/catalog/owner/${filename}`);
    const path = `public${url!.split("?")[0]}`;
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path).subarray(8, 12).toString()).toBe("WEBP");
  });
});
