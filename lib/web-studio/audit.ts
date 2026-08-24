import { lookup } from "node:dns/promises";
import net from "node:net";

export type WebFinding = {
  id: string;
  severity: "high" | "medium" | "low";
  evidence: string;
  impact: string;
  recommendation: string;
};

export type WebAuditResult = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  title: string | null;
  description: string | null;
  lang: string | null;
  signals: {
    hasViewport: boolean;
    hasCanonical: boolean;
    hasOpenGraphTitle: boolean;
    h1Count: number;
    formCount: number;
    linkCount: number;
    scriptCount: number;
  };
  findings: WebFinding[];
  limitations: string[];
};

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8_000;

function isPrivateIPv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (!net.isIPv6(ip)) return true;
  const value = ip.toLowerCase();
  return value === "::1" || value === "::" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb");
}

async function assertPublicHttpUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("La URL no es válida.");
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Solo se permiten URLs http/https.");
  if (url.username || url.password) throw new Error("No se permiten credenciales dentro de la URL.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) throw new Error("Ese host no es público.");

  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("No se permiten direcciones privadas o reservadas.");
  } else {
    const addresses = await lookup(host, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((item) => isPrivateIp(item.address))) {
      throw new Error("El host resuelve a una dirección no permitida.");
    }
  }
  return url;
}

function match(html: string, re: RegExp) {
  return re.test(html);
}

function firstCapture(html: string, re: RegExp) {
  return html.match(re)?.[1]?.replace(/\s+/g, " ").trim() || null;
}

function countMatches(html: string, re: RegExp) {
  return [...html.matchAll(re)].length;
}

function buildFindings(result: Omit<WebAuditResult, "findings" | "limitations">): WebFinding[] {
  const candidates: WebFinding[] = [];
  const { signals } = result;

  if (!signals.hasViewport) candidates.push({ id: "viewport", severity: "high", evidence: "No se detectó meta viewport.", impact: "La experiencia móvil puede renderizarse o escalarse mal.", recommendation: "Añadir un viewport responsive y verificar el diseño en pantallas pequeñas." });
  if (!result.description) candidates.push({ id: "description", severity: "medium", evidence: "No se detectó meta description.", impact: "La página pierde control sobre cómo se presenta en resultados y compartidos.", recommendation: "Añadir una descripción breve y específica de la propuesta de valor." });
  if (signals.h1Count === 0) candidates.push({ id: "h1-missing", severity: "high", evidence: "No se detectó ningún H1.", impact: "La jerarquía principal de la página queda poco clara para personas y buscadores.", recommendation: "Definir un único encabezado principal que exprese con claridad la propuesta de valor." });
  if (signals.h1Count > 1) candidates.push({ id: "h1-many", severity: "medium", evidence: `Se detectaron ${signals.h1Count} elementos H1.`, impact: "La jerarquía principal puede resultar ambigua.", recommendation: "Revisar la estructura de encabezados y reservar el H1 para el mensaje principal." });
  if (!signals.hasCanonical) candidates.push({ id: "canonical", severity: "low", evidence: "No se detectó enlace canonical.", impact: "Versiones equivalentes de la página pueden competir entre sí en indexación.", recommendation: "Definir canonical cuando exista una URL preferida estable." });
  if (!signals.hasOpenGraphTitle) candidates.push({ id: "og", severity: "low", evidence: "No se detectó og:title.", impact: "Los compartidos sociales pueden mostrar previews menos controlados.", recommendation: "Añadir metadatos Open Graph coherentes con el título y la oferta." });
  if (!result.title) candidates.push({ id: "title", severity: "high", evidence: "No se detectó elemento title.", impact: "La página pierde una señal básica de contexto para navegador y buscadores.", recommendation: "Definir un título único y descriptivo." });
  if (signals.formCount === 0) candidates.push({ id: "conversion", severity: "medium", evidence: "No se detectaron formularios en el HTML inicial.", impact: "Si la página busca captar leads, la conversión puede depender de acciones menos visibles.", recommendation: "Verificar que exista una acción principal clara y medible; añadir formulario solo si encaja con el objetivo." });

  const fallback: WebFinding[] = [
    { id: "cta-review", severity: "medium", evidence: `Se detectaron ${signals.linkCount} enlaces en el HTML inicial.`, impact: "Muchos destinos pueden diluir la acción principal si no existe jerarquía visual clara.", recommendation: "Revisar la prominencia de la acción principal frente a enlaces secundarios." },
    { id: "script-weight", severity: "low", evidence: `Se detectaron ${signals.scriptCount} etiquetas script.`, impact: "Un volumen alto de JavaScript puede afectar rendimiento o interacción en equipos lentos.", recommendation: "Medir carga real antes de optimizar y eliminar scripts que no aporten valor." },
    { id: "visual-qa", severity: "low", evidence: "Este MVP inspecciona HTML inicial y metadatos, no una captura renderizada.", impact: "Problemas visuales de layout, contraste o jerarquía pueden no aparecer en esta fase.", recommendation: "Completar con revisión visual desktop/móvil en la siguiente fase del kit." },
  ];

  for (const item of fallback) {
    if (candidates.length >= 5) break;
    candidates.push(item);
  }
  return candidates.slice(0, 5);
}

export async function auditWebsite(rawUrl: string): Promise<WebAuditResult> {
  const requested = await assertPublicHttpUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(requested, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "NEXO-Web-Studio/0.1 (+https://nexo.casavivadecuba.com)" },
    });

    let current = requested;
    let currentResponse = response;
    for (let redirects = 0; redirects < 3 && currentResponse.status >= 300 && currentResponse.status < 400; redirects += 1) {
      const location = currentResponse.headers.get("location");
      if (!location) break;
      current = await assertPublicHttpUrl(new URL(location, current).toString());
      currentResponse = await fetch(current, { redirect: "manual", signal: controller.signal, headers: { "user-agent": "NEXO-Web-Studio/0.1 (+https://nexo.casavivadecuba.com)" } });
    }

    const contentType = currentResponse.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/html")) throw new Error("La URL no devolvió HTML.");
    const declaredLength = Number(currentResponse.headers.get("content-length") || 0);
    if (declaredLength > MAX_BYTES) throw new Error("La página supera el tamaño permitido para este MVP.");

    const html = await currentResponse.text();
    if (Buffer.byteLength(html, "utf8") > MAX_BYTES) throw new Error("La página supera el tamaño permitido para este MVP.");

    const base = {
      requestedUrl: requested.toString(),
      finalUrl: current.toString(),
      status: currentResponse.status,
      title: firstCapture(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      description: firstCapture(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) || firstCapture(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i),
      lang: firstCapture(html, /<html[^>]+lang=["']([^"']+)["']/i),
      signals: {
        hasViewport: match(html, /<meta[^>]+name=["']viewport["']/i),
        hasCanonical: match(html, /<link[^>]+rel=["'][^"']*canonical[^"']*["']/i),
        hasOpenGraphTitle: match(html, /<meta[^>]+property=["']og:title["']/i),
        h1Count: countMatches(html, /<h1\b[^>]*>/gi),
        formCount: countMatches(html, /<form\b[^>]*>/gi),
        linkCount: countMatches(html, /<a\b[^>]*href=/gi),
        scriptCount: countMatches(html, /<script\b[^>]*>/gi),
      },
    };

    return {
      ...base,
      findings: buildFindings(base),
      limitations: [
        "Este MVP analiza el HTML inicial y no ejecuta JavaScript remoto.",
        "Todavía no incluye captura visual, Lighthouse ni análisis semántico con un modelo de IA.",
      ],
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("La web tardó demasiado en responder.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
