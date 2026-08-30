import { deliveryCatalog, normalizeText, quoteShipping } from "./delivery";

export function getDeliveryQuoteAnswer(question: string) {
  if (!/(mensajer[ií]a|entrega|env[ií]o)/i.test(question)) return null;
  const normalized = normalizeText(question);
  const catalog = deliveryCatalog();
  const municipality = catalog.municipalities.find((name) => normalized.includes(normalizeText(name)));
  const candidates = municipality ? catalog.localities[municipality] : Object.values(catalog.localities).flat();
  const locality = [...new Set(candidates)].sort((a, b) => b.length - a.length).find((name) => normalized.includes(normalizeText(name)));
  if (!municipality || !locality) return { answer: "¿En qué municipio y localidad sería la entrega?", municipality: municipality || null, locality: locality || null, status: "needs_location" as const };
  const quote = quoteShipping(municipality, locality);
  if (quote.status !== "zone") return { answer: "Todavía no tenemos una tarifa registrada para esa zona.", municipality, locality, status: "pending" as const };
  return { answer: `La mensajería para ${locality}, ${municipality}, es de ${quote.feeCup.toLocaleString("es-ES")} CUP.`, municipality, locality, feeCup: quote.feeCup, version: quote.version, status: "quoted" as const };
}
