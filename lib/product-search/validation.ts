import type { NexoSearchResponse, ProductSearchResult } from "./types";
const matches = new Set(["exact", "close", "alternative", "unconfirmed"]),
  availability = new Set(["advertised", "unconfirmed"]);
const clean = (v: unknown, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
function safeUrl(v: unknown) {
  const t = clean(v, 1500);
  if (!t) return "";
  try {
    const u = new URL(t);
    return ["http:", "https:"].includes(u.protocol) ? u.toString() : "";
  } catch {
    return "";
  }
}
export function parseSearchPayload(
  value: unknown,
  requestId: string,
  provider: string,
): NexoSearchResponse | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, any>,
    h = raw.hypothesis;
  if (!h || typeof h !== "object" || !Array.isArray(raw.results)) return null;
  const results = raw.results
    .slice(0, 8)
    .map((item: any, index: number): ProductSearchResult | null => {
      if (!item || typeof item !== "object") return null;
      const match = clean(item.match, 20),
        state = clean(item.availability, 20),
        url = safeUrl(item.url),
        price = item.price === null ? null : Number(item.price);
      if (
        !matches.has(match) ||
        !availability.has(state) ||
        !clean(item.title) ||
        !url
      )
        return null;
      return {
        id: `result-${index + 1}`,
        title: clean(item.title),
        match: match as ProductSearchResult["match"],
        price: Number.isFinite(price) ? price : null,
        currency: clean(item.currency, 12) || "USD",
        priceLabel: clean(item.priceLabel, 80),
        location: clean(item.location, 120),
        phone: clean(item.phone, 50),
        url,
        source: clean(item.source, 100),
        observedAt: clean(item.observedAt, 30),
        availability: state as ProductSearchResult["availability"],
        note: clean(item.note),
      };
    })
    .filter(Boolean) as ProductSearchResult[];
  return {
    requestId,
    provider,
    hypothesis: {
      name: clean(h.name, 160),
      category: clean(h.category, 100),
      request: clean(h.request),
      visibleAttributes: Array.isArray(h.visibleAttributes)
        ? h.visibleAttributes
            .map((x: unknown) => clean(x, 160))
            .filter(Boolean)
            .slice(0, 12)
        : [],
      missingImportant: Array.isArray(h.missingImportant)
        ? h.missingImportant
            .map((x: unknown) => clean(x, 160))
            .filter(Boolean)
            .slice(0, 8)
        : [],
      confidence: Math.max(0, Math.min(1, Number(h.confidence) || 0)),
      distinction: clean(h.distinction),
    },
    summary: clean(raw.summary, 1000),
    results,
    verificationQuestions: Array.isArray(raw.verificationQuestions)
      ? raw.verificationQuestions
          .map((x: unknown) => clean(x, 200))
          .filter(Boolean)
          .slice(0, 8)
      : [],
  };
}
export function calculateOffer(i: {
  cost: number;
  quantity: number;
  mode: "fixed" | "percent" | "final";
  markup: number;
  delivery: number;
}) {
  const cost = Math.max(0, i.cost) * Math.max(1, i.quantity),
    product =
      i.mode === "final"
        ? Math.max(cost, i.markup)
        : i.mode === "percent"
          ? cost * (1 + Math.max(0, i.markup) / 100)
          : cost + Math.max(0, i.markup),
    productTotal = Math.round(product * 100) / 100,
    delivery = Math.max(0, i.delivery);
  return {
    cost: Math.round(cost * 100) / 100,
    productTotal,
    earning: Math.round((productTotal - cost) * 100) / 100,
    delivery,
    customerTotal: Math.round((productTotal + delivery) * 100) / 100,
  };
}
