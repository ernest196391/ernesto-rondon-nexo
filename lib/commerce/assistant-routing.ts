import type { AICapability } from "./ai-providers";

const COMPLEX_PATTERNS = [
  /analiza (?:detalladamente|a fondo|en profundidad)/i,
  /explica (?:paso a paso|con detalle)/i,
  /compara .{10,}(?:teniendo en cuenta|seg[uú]n|para decidir)/i,
  /(?:recomienda|cu[aá]l me conviene).{10,}(?:presupuesto|necesidad|consumo|condiciones)/i,
  /(?:calcula|dimensiona).{10,}(?:consumo|autonom[ií]a|bater[ií]a|sistema|presupuesto)/i,
];

export function assistantCapability(question: string, hasAttachments = false): AICapability {
  if (hasAttachments) return "vision";
  const normalized = question.replace(/\s+/g, " ").trim();
  if (normalized.length >= 420 || COMPLEX_PATTERNS.some((pattern) => pattern.test(normalized)))
    return "complex_reasoning";
  return "fast_chat";
}
