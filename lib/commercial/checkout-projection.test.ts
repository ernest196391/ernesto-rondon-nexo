import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("commercial checkout projection",()=>{it("keeps the gestora price when checkout is restored",()=>{const source=readFileSync("app/api/commerce/checkout/route.ts","utf8");expect(source).toContain("projection = await projectCommercialCart(result.cart, referral)");expect(source).toContain("{ cart: projection.cart, referral }");});});
