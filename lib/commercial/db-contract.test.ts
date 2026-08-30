import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("commercial database contract", () => {
  it("serializes price-rule versions without locking an aggregate", () => {
    const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    expect(source).toContain('price-rule:${input.gestoraId}:${input.scope}');
    expect(source).not.toMatch(/MAX\(version\)[^\n]+FOR UPDATE/);
  });
});
