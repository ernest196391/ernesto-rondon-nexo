import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("rail móvil de categorías", () => {
  const css = readFileSync("app/marketplace/marketplace.css", "utf8");
  it("impide regresión a columna o wrap", () => {
    expect(css).toMatch(/\.category-strip\s*\{[\s\S]*?flex-direction:\s*row\s*!important/);
    expect(css).toMatch(/flex-wrap:\s*nowrap\s*!important/);
    expect(css).toMatch(/overflow-x:\s*auto/);
    expect(css).toMatch(/flex:\s*0 0 82px\s*!important/);
  });
});
