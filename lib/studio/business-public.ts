import { lookup } from "node:dns/promises";
import net from "node:net";
import { auditWebsite, type WebAuditResult } from "../web-studio/audit";
import type { BusinessAuditResult } from "./business-audit";

export type PublicDimension = {
  id: string;
  name: string;
  weight: number;
  score: number | null;
  status: "scored" | "no-data" | "not-applicable";
  evidence: string[];
  action: string;
};

export type CrossFinding = {
  severity: "critical" | "high" | "medium";
  title: string;
  outsideEvidence: string;
  insideEvidence: string;
  implication: string;
};

export type BusinessPublicResult = {
  url: string;
  finalUrl: string;
  score: number | null;
  band: string;
  dimensions: PublicDimension[];
  crosses: CrossFinding[];
  currentJourney: string[];
  futureJourney: string[];
  quickWins: string[];
  roadmap: { horizon: "0–30 días" | "30–90 días" | "90+ días"; actions: string[] }[];
  doNotAutomateYet: string[];
  limitations: string[];
};

const MAX_BYTES = 1_500_000;
const timeoutMs = 8_000;

function isPrivateIPv4(ip: string) {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some(Number.isNaN)) return false;
  const [a, b] = p;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}
function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (!net.isIPv6(ip)) return true;
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || /^fe[89ab]/.test(v);
}
async function publicUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("La URL pública no es válida."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("La URL pública no está permitida.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".localhost")) throw new Error("Ese host no es público.");
  if (net.isIP(host)) { if (isPrivateIp(host)) throw new Error("No se permiten direcciones privadas."); }
  else {
    const addresses = await lookup(host, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((item) => isPrivateIp(item.address))) throw new Error("El host resuelve a una dirección no permitida.");
  }
  return url;
}

function textContent(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}
function count(html: string, re: RegExp) { return [...html.matchAll(re)].length; }
function has(html: string, re: RegExp) { return re.test(html); }
function scoreBand(score: number | null) { if (score === null) return "sin datos"; if (score < 40) return "crítico"; if (score < 60) return "débil"; if (score < 75) return "aceptable"; if (score < 90) return "bueno"; return "referencia"; }
function dim(id: string, name: string, weight: number, score: number | null, evidence: string[], action: string): PublicDimension {
  const usable = evidence.filter(Boolean);
  return { id, name, weight, score: usable.length >= 2 ? score : null, status: usable.length >= 2 ? "scored" : "no-data", evidence: usable.slice(0, 5), action };
}

async function fetchPublicHtml(finalUrl: string) {
  const target = await publicUrl(finalUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(target, { redirect: "error", signal: controller.signal, headers: { "user-agent": "NEXO-Business-Audit/1.0" } });
    if (!response.ok) throw new Error(`La web pública respondió HTTP ${response.status}.`);
    const type = response.headers.get("content-type") || "";
    if (!type.toLowerCase().includes("text/html")) throw new Error("La URL pública no devolvió HTML.");
    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_BYTES) throw new Error("La web pública supera el tamaño permitido.");
    return html;
  } finally { clearTimeout(timer); }
}

function buildDimensions(audit: WebAuditResult, html: string): PublicDimension[] {
  const text = textContent(html).toLowerCase();
  const priceCount = count(text, /(?:\$|€|usd|eur|cup|precio|price|desde\s+\d)/gi);
  const ctaCount = count(text, /(?:comprar|reservar|agenda|contactar|contacto|cotizar|presupuesto|book|buy|shop|contact|get started|empieza|solicitar)/gi);
  const socialLinks = count(html, /href=["'][^"']*(?:instagram\.com|facebook\.com|tiktok\.com|youtube\.com|linkedin\.com|x\.com|twitter\.com)[^"']*["']/gi);
  const metaSignals = [has(html, /connect\.facebook\.net|facebook\.com\/tr/i), has(html, /\bfbq\s*\(/i)].filter(Boolean).length;
  const mapsLinks = count(html, /href=["'][^"']*(?:maps\.google|google\.com\/maps|goo\.gl\/maps)[^"']*["']/gi);
  const localBusiness = has(html, /LocalBusiness|PostalAddress|openingHours/i);
  const reviewSchema = has(html, /AggregateRating|Review|ratingValue/i);
  const reviewMentions = count(text, /(?:reseñas?|opiniones?|testimonios?|reviews?|ratings?)/gi);
  const logoSignals = count(html, /<img[^>]+(?:class|id|alt|src)=["'][^"']*logo[^"']*["']/gi);
  const themeColor = has(html, /<meta[^>]+name=["']theme-color["']/i);
  const articleCount = count(html, /<article\b/gi);
  const datedContent = count(html, /<time\b|datePublished|article:published_time|author/i);
  const navCount = count(html, /<nav\b/gi);
  const productSignals = count(html, /Product|Offer|priceCurrency|add-to-cart|add_to_cart|woocommerce|shopify/i);

  return [
    dim("web-ux", "Web & UX", 15,
      Math.max(0, Math.min(100, 30 + (audit.signals.hasViewport ? 25 : 0) + (audit.signals.h1Count === 1 ? 20 : 0) + (navCount > 0 ? 15 : 0) + (audit.signals.formCount > 0 || ctaCount > 0 ? 10 : 0))),
      [`HTTP ${audit.status}`, audit.signals.hasViewport ? "Meta viewport detectada" : "Meta viewport no detectada", `H1 detectados: ${audit.signals.h1Count}`, navCount ? `Navegaciones detectadas: ${navCount}` : "", audit.signals.formCount || ctaCount ? `Formularios/CTA visibles: ${audit.signals.formCount}/${ctaCount}` : ""],
      "Priorizar claridad móvil, jerarquía y una acción principal visible."),
    dim("offer", "Offer & pricing", 15,
      Math.min(100, 35 + Math.min(priceCount, 3) * 15 + Math.min(productSignals, 3) * 10),
      [priceCount ? `Señales públicas de precio/oferta: ${priceCount}` : "", productSignals ? `Señales de producto/oferta estructurada: ${productSignals}` : "", audit.description ? `Descripción pública: ${audit.description.slice(0, 180)}` : ""],
      "Hacer explícito qué se ofrece, para quién, con qué resultado y cómo se compra o solicita."),
    dim("copy", "Copy & communication", 12,
      Math.min(100, 30 + (audit.title ? 25 : 0) + (audit.description ? 25 : 0) + (audit.signals.h1Count === 1 ? 20 : 0)),
      [audit.title ? `Título: ${audit.title}` : "", audit.description ? `Meta description: ${audit.description}` : "", `H1 detectados: ${audit.signals.h1Count}`],
      "Reducir ambigüedad: propuesta de valor, prueba y siguiente paso deben entenderse en segundos."),
    dim("journey", "Visible customer journey", 12,
      Math.min(100, 30 + (navCount ? 20 : 0) + (ctaCount ? 25 : 0) + (audit.signals.formCount ? 25 : 0)),
      [navCount ? `Navegación visible: ${navCount}` : "", ctaCount ? `CTA/verbos de acción detectados: ${ctaCount}` : "", audit.signals.formCount ? `Formularios detectados: ${audit.signals.formCount}` : ""],
      "Convertir el recorrido en pocos pasos: descubrir → confiar → elegir → contactar/comprar → seguimiento."),
    dim("social", "Social networks", 10,
      Math.min(100, 35 + Math.min(socialLinks, 4) * 12 + (audit.signals.hasOpenGraphTitle ? 15 : 0)),
      [socialLinks ? `Enlaces a redes detectados: ${socialLinks}` : "", audit.signals.hasOpenGraphTitle ? "Open Graph configurado" : ""],
      "Alinear perfiles sociales con la misma promesa, CTA y prueba de la web."),
    dim("meta-ads", "Meta Ads", 8,
      metaSignals === 2 ? 75 : 45,
      [metaSignals >= 1 ? "Se detectó infraestructura técnica asociada a Meta" : "", metaSignals >= 2 ? "Se detectaron dos señales independientes del pixel/eventos Meta" : ""],
      "Si hay tráfico pagado, verificar medición de conversión y seguimiento antes de escalar inversión."),
    dim("maps", "Google Business / Maps", 8,
      mapsLinks && localBusiness ? 80 : 55,
      [mapsLinks ? `Enlaces de Maps detectados: ${mapsLinks}` : "", localBusiness ? "Schema LocalBusiness/PostalAddress/openingHours detectado" : ""],
      "Mantener dirección, horario, teléfono y categoría consistentes entre web y ficha local."),
    dim("reputation", "Reputation", 6,
      reviewSchema && reviewMentions ? 80 : 55,
      [reviewSchema ? "Schema de Review/AggregateRating detectado" : "", reviewMentions ? `Menciones de reseñas/testimonios: ${reviewMentions}` : ""],
      "Mostrar prueba social verificable y responder a causas operativas detrás de reseñas negativas."),
    dim("brand", "Brand consistency", 6,
      Math.min(100, 35 + (logoSignals ? 25 : 0) + (themeColor ? 20 : 0) + (audit.signals.hasOpenGraphTitle ? 20 : 0)),
      [logoSignals ? `Señales de logotipo: ${logoSignals}` : "", themeColor ? "Theme color declarada" : "", audit.signals.hasOpenGraphTitle ? "Título Open Graph configurado" : ""],
      "Unificar logotipo, color, tono y promesa en web y canales públicos."),
    dim("seo", "Basic SEO", 4,
      Math.min(100, 20 + (audit.title ? 20 : 0) + (audit.description ? 20 : 0) + (audit.signals.hasCanonical ? 15 : 0) + (audit.signals.h1Count === 1 ? 15 : 0) + (audit.lang ? 10 : 0)),
      [audit.title ? "Title detectado" : "", audit.description ? "Meta description detectada" : "", audit.signals.hasCanonical ? "Canonical detectado" : "", audit.signals.h1Count === 1 ? "Un H1 principal" : `H1: ${audit.signals.h1Count}`, audit.lang ? `Idioma: ${audit.lang}` : ""],
      "Completar metadatos básicos y estructura semántica antes de optimizaciones avanzadas."),
    dim("content", "Content", 4,
      Math.min(100, 35 + Math.min(articleCount, 3) * 12 + Math.min(datedContent, 3) * 10),
      [articleCount ? `Elementos article: ${articleCount}` : "", datedContent ? `Señales de fecha/autor: ${datedContent}` : ""],
      "Publicar contenido que responda dudas de compra y pueda medirse por intención y conversión."),
  ];
}

function weightedScore(dimensions: PublicDimension[]) {
  const scored = dimensions.filter((d) => d.status === "scored" && d.score !== null);
  const weight = scored.reduce((sum, d) => sum + d.weight, 0);
  if (!weight) return null;
  return Math.round(scored.reduce((sum, d) => sum + (d.score as number) * d.weight, 0) / weight);
}

function insideEvidence(inside: BusinessAuditResult, areaName: string) {
  return inside.areas.find((a) => a.name === areaName)?.evidence || "Sin evidencia interna suficiente";
}

function buildCrosses(dimensions: PublicDimension[], inside: BusinessAuditResult, html: string): CrossFinding[] {
  const out: CrossFinding[] = [];
  const meta = dimensions.find((d) => d.id === "meta-ads");
  const journey = dimensions.find((d) => d.id === "journey");
  const text = textContent(html).toLowerCase();
  const capture = inside.areas.find((a) => a.name === "Captación y primer contacto");
  const scheduling = inside.areas.find((a) => a.name === "Agenda y citas");
  const retention = inside.areas.find((a) => a.name === "Retención y reactivación");
  const data = inside.areas.find((a) => a.name === "Datos y medición");

  if (meta?.status === "scored" && (capture?.level ?? 5) <= 2) out.push({ severity: "critical", title: "Canal pagado potencialmente desatendido", outsideEvidence: meta.evidence.join(" · "), insideEvidence: capture?.evidence || "Sin evidencia interna", implication: "No conviene aumentar adquisición si el primer contacto sigue dependiendo de respuesta manual o personal." });
  if (meta?.status === "scored" && (data?.level ?? 5) <= 2) out.push({ severity: "critical", title: "Tráfico pagado sin medición interna madura", outsideEvidence: meta.evidence.join(" · "), insideEvidence: data?.evidence || "Sin evidencia interna", implication: "La inversión puede crecer sin una lectura fiable de consultas, conversiones y retorno." });
  if ((/24\/7|24 horas|siempre abierto|always open/.test(text)) && (capture?.level ?? 5) <= 2) out.push({ severity: "high", title: "Promesa pública difícil de sostener", outsideEvidence: "La web pública comunica disponibilidad continua o equivalente.", insideEvidence: capture?.evidence || "Sin evidencia interna", implication: "La expectativa del cliente puede superar la capacidad real de respuesta." });
  if ((/reservar|reserva|agenda|cita|book now|booking/.test(text)) && (scheduling?.level ?? 5) <= 2) out.push({ severity: "high", title: "La web pide reservar pero la agenda sigue siendo manual", outsideEvidence: "La presencia pública contiene lenguaje de reserva/agenda.", insideEvidence: scheduling?.evidence || "Sin evidencia interna", implication: "Se crea fricción entre intención del cliente y operación interna." });
  if (journey?.status === "scored" && journey.score !== null && journey.score >= 65 && (retention?.level ?? 5) <= 2) out.push({ severity: "medium", title: "Captación visible, retención poco sistematizada", outsideEvidence: journey.evidence.join(" · "), insideEvidence: retention?.evidence || "Sin evidencia interna", implication: "El negocio puede estar concentrando esfuerzo en conseguir clientes nuevos y dejando valor en reactivación/recurrencia." });
  return out.slice(0, 8);
}

export async function runBusinessPublicAudit(rawUrl: string, inside: BusinessAuditResult): Promise<BusinessPublicResult> {
  const audit = await auditWebsite(rawUrl);
  const html = await fetchPublicHtml(audit.finalUrl);
  const dimensions = buildDimensions(audit, html);
  const score = weightedScore(dimensions);
  const crosses = buildCrosses(dimensions, inside, html);
  const weak = inside.areas.filter((a) => a.level !== null && a.level <= 2).map((a) => a.name);
  const currentJourney = ["Descubre el negocio en web/canales públicos", "Interpreta oferta y prueba disponible", "Busca una acción de contacto/compra/reserva", "El negocio recibe y procesa la solicitud", "Cobro/servicio", "Seguimiento y reactivación según proceso actual"];
  const futureJourney = ["Descubre una propuesta consistente", "Valida confianza con evidencia", "Elige y actúa en un CTA medible", "Solicitud entra en un punto central", "NEXO/automatización asiste sin ocultar handoff humano", "Cobro/servicio queda trazado", "Seguimiento, reseña y reactivación se disparan con reglas"];
  const quickWins = [
    ...dimensions.filter((d) => d.status === "scored" && (d.score ?? 100) < 65).slice(0, 3).map((d) => d.action),
    ...inside.areas.filter((a) => a.level !== null && a.level <= 2).slice(0, 2).map((a) => a.next),
  ].slice(0, 5);
  const roadmap = [
    { horizon: "0–30 días" as const, actions: quickWins.slice(0, 3) },
    { horizon: "30–90 días" as const, actions: weak.slice(0, 3).map((name) => `Elevar ${name.toLowerCase()} a un proceso central y medible.`) },
    { horizon: "90+ días" as const, actions: ["Conectar adquisición, operación, datos y retención en un mismo ciclo de aprendizaje.", "Automatizar únicamente pasos con datos y responsables claros."] },
  ];
  return {
    url: rawUrl,
    finalUrl: audit.finalUrl,
    score,
    band: scoreBand(score),
    dimensions,
    crosses,
    currentJourney,
    futureJourney,
    quickWins,
    roadmap,
    doNotAutomateYet: inside.areas.filter((a) => a.level === 1).map((a) => `${a.name}: primero documentar y estabilizar el proceso.`).slice(0, 5),
    limitations: ["La parte exterior usa únicamente evidencia pública accesible desde la URL proporcionada.", "No se accede a Ads Manager, Analytics, Search Console, CRM ni cuentas privadas.", "Una dimensión sin dos evidencias concretas queda como sin datos y su peso se redistribuye; nunca se convierte en cero."],
  };
}
