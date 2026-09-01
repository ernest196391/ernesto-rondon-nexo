import type { EditorialProduct } from "./product-editorial";

type WooAttribute = { name?: string; options?: string[] };
type WooProductContentInput = {
  name?: string;
  short_description?: string;
  description?: string;
  attributes?: WooAttribute[];
};

export type ProductContent = {
  shortDescriptionHtml: string;
  descriptionHtml: string;
  keyBenefits: Array<{ title: string; detail: string }>;
  specifications: Array<{ label: string; value: string }>;
  faq: Array<{ question: string; answer: string }>;
};

function cleanText(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#039;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function section(html: string, heading: string) {
  const escaped = heading.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`<h[1-6][^>]*>[^<]*${escaped}[^<]*<\\/h[1-6]>([\\s\\S]*?)(?=<h[1-6][^>]*>|$)`, "i"))?.[1] || "";
}

function listItems(html: string) {
  return [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => cleanText(match[1]))
    .filter(Boolean);
}

function specificationItems(html: string) {
  return [...html.matchAll(/<li[^>]*>[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>([\s\S]*?)<\/li>/gi)]
    .map((match) => ({
      label: cleanText(match[1]).replace(/:\s*$/, ""),
      value: cleanText(match[2]).replace(/^:\s*/, ""),
    }))
    .filter((item) => item.label && item.value);
}

export function productContentFor(product: WooProductContentInput, editorial?: EditorialProduct): ProductContent {
  if (editorial) {
    return {
      shortDescriptionHtml: `<p>${editorial.shortDescription}</p>`,
      descriptionHtml: `<p>${editorial.longDescription}</p>`,
      keyBenefits: editorial.keyBenefits,
      specifications: editorial.specifications,
      faq: editorial.faq,
    };
  }

  const rawDescription = product.description?.trim() || "";
  const benefitsHtml = section(rawDescription, "Beneficios");
  const specificationsHtml = section(rawDescription, "Especificaciones");
  const firstHeading = rawDescription.search(/<h[1-6][^>]*>/i);
  const introduction = firstHeading >= 0 ? rawDescription.slice(0, firstHeading) : rawDescription;
  const benefits = listItems(benefitsHtml);
  const fromAttributes = (product.attributes || [])
    .map((attribute) => ({ label: cleanText(attribute.name), value: (attribute.options || []).map(cleanText).filter(Boolean).join(", ") }))
    .filter((item) => item.label && item.value);
  const specifications = specificationItems(specificationsHtml);

  return {
    shortDescriptionHtml: product.short_description?.trim() || (introduction ? introduction : `<p>${cleanText(product.name)}</p>`),
    descriptionHtml: introduction || product.short_description?.trim() || "",
    keyBenefits: benefits.map((detail) => ({ title: detail.split(/[:.–-]/, 1)[0] || "Característica", detail })),
    specifications: specifications.length ? specifications : fromAttributes,
    faq: [],
  };
}

export function validateProductCopyForPublication(copy: {
  title?: string;
  shortDescription?: string;
  description?: string;
  benefits?: string[];
  specifications?: Array<{ name?: string; value?: string }>;
}) {
  const errors: string[] = [];
  if ((copy.title || "").trim().length < 5) errors.push("Falta un título válido.");
  if ((copy.shortDescription || "").trim().length < 20) errors.push("Falta una descripción breve completa.");
  if ((copy.description || "").trim().length < 50) errors.push("Falta una descripción detallada.");
  if (!copy.benefits?.some((item) => item.trim().length >= 8)) errors.push("Faltan beneficios.");
  if (!copy.specifications?.some((item) => (item.name || "").trim() && (item.value || "").trim())) errors.push("Faltan especificaciones.");
  return errors;
}
