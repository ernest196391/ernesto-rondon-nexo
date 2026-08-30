import { describe, expect, it } from "vitest";
import { choosePriceRule, resolveCommercialPrice } from "./pricing";
import type { CommercialPriceRule } from "./types";

const rule = (patch: Partial<CommercialPriceRule> = {}): CommercialPriceRule => ({ id:"r1",gestoraId:"g1",scope:"global",productId:null,mode:"base",value:0,currency:"USD",minFinal:null,maxFinal:null,rounding:0.01,version:1,status:"active",...patch });

describe("commercial pricing", () => {
  it("keeps the canonical base without markup", () => expect(resolveCommercialPrice({base:90,currency:"USD",rule:rule()}).final).toBe(90));
  it("applies fixed markup once", () => expect(resolveCommercialPrice({base:90,currency:"USD",rule:rule({mode:"fixed",value:5})})).toMatchObject({markup:5,final:95}));
  it("applies percentage markup once", () => expect(resolveCommercialPrice({base:80,currency:"USD",rule:rule({mode:"percent",value:12.5})}).final).toBe(90));
  it("clamps custom price to administrative limits", () => expect(resolveCommercialPrice({base:80,currency:"USD",rule:rule({mode:"custom_final",value:140,maxFinal:110})}).final).toBe(110));
  it("rounds deterministically upward", () => expect(resolveCommercialPrice({base:81,currency:"USD",rule:rule({mode:"percent",value:10,rounding:5})}).final).toBe(90));
  it("rejects cross-currency rules", () => expect(() => resolveCommercialPrice({base:80,currency:"CUP",rule:rule()})).toThrow(/currency/));
  it("prefers the newest product exception over global", () => expect(choosePriceRule([rule(),rule({id:"p",scope:"product",productId:7,version:2})],7)?.id).toBe("p"));
});
