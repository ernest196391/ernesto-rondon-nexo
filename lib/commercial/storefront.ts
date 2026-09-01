import { getWooProduct, listWooProducts } from "../commerce/woocommerce";
import { applyEditorial } from "../commerce/product-editorial";
import { catalogImageFor } from "../commerce/catalog-images";
import { storefrontProducts } from "../commerce/storefront";
import { choosePriceRule, resolveCommercialPrice } from "./pricing";
import { getGestoraByRef, getGestoraBySlug, listRules, listSelectedProductIds } from "./db";
import type { CommercialLineSnapshot } from "./types";

export function filterSelectedProducts<T extends { id: number | string }>(products: T[], ids: number[]) {
  const selected = new Set(ids.map(Number));
  return products.filter((product) => selected.has(Number(product.id)));
}

export async function commercialStorefront(slug: string) {
  const gestora = await getGestoraBySlug(slug);
  if (!gestora || gestora.status !== "active") return null;
  const [ids, rules, raw] = await Promise.all([
    listSelectedProductIds(gestora.id),
    listRules(gestora.id),
    listWooProducts({ perPage: 50 }),
  ]);
  const products = filterSelectedProducts(storefrontProducts(raw), ids).map((rawProduct: any) => {
    const product = applyEditorial(rawProduct);
    const resolved = resolveCommercialPrice({
      base: Number(product.price),
      currency: gestora.defaultCurrency,
      rule: choosePriceRule(rules, Number(product.id)),
    });
    const src = catalogImageFor(product);
    return {
      id: Number(product.id),
      name: product.name,
      slug: product.slug,
      price: resolved.final.toFixed(2),
      currency: resolved.currency,
      stock_status: product.stock_status,
      images: src ? [{ src, alt: product.images?.[0]?.alt || product.name }] : product.images || [],
      categories: product.categories || [],
    };
  });
  return {
    gestora: {
      publicName: gestora.publicName,
      slug: gestora.slug,
      referralCode: gestora.referralCode,
      whatsapp: gestora.whatsapp,
    },
    products,
  };
}

export async function resolvedProductPrice(ref:string,productId:number){const gestora=await getGestoraByRef(ref);if(!gestora||gestora.status!=="active")return null;const [product,rules]=await Promise.all([getWooProduct(productId),listRules(gestora.id)]);return{gestora,product,resolved:resolveCommercialPrice({base:Number(product.price),currency:gestora.defaultCurrency,rule:choosePriceRule(rules,productId)})};}

export async function projectCommercialCart(cart:any,ref:string){const gestora=await getGestoraByRef(ref);if(!gestora||gestora.status!=="active")return{cart,gestora:null,lines:[] as CommercialLineSnapshot[]};const rules=await listRules(gestora.id),lines:CommercialLineSnapshot[]=[];let totalItems=0;const items=(cart.items||[]).map((item:any)=>{const minor=Number(item.prices?.currency_minor_unit??cart.totals?.currency_minor_unit??2),factor=10**minor,base=Number(item.prices?.price??0)/factor,resolved=resolveCommercialPrice({base,currency:item.prices?.currency_code||gestora.defaultCurrency,rule:choosePriceRule(rules,Number(item.id))}),quantity=Number(item.quantity||1),line=Math.round(resolved.final*quantity*factor);totalItems+=line;lines.push({productId:Number(item.id),variationId:Number(item.variation?.[0]?.id||0),quantity,baseUnit:resolved.base,markupUnit:resolved.markup,finalUnit:resolved.final,currency:resolved.currency,ruleId:resolved.ruleId,ruleVersion:resolved.ruleVersion});return{...item,prices:{...item.prices,price:String(Math.round(resolved.final*factor)),regular_price:String(Math.round(resolved.final*factor)),sale_price:String(Math.round(resolved.final*factor))},totals:{...item.totals,line_subtotal:String(line),line_total:String(line)}};});const totals={...cart.totals,total_items:String(totalItems),total_items_tax:"0",total_price:String(totalItems+Number(cart.totals?.total_shipping||0))};return{cart:{...cart,items,totals},gestora,lines};}
