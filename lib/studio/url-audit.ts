import { auditWebsite, type WebAuditResult } from "../web-studio/audit";

export type SpecialistAuditKind = "commerce" | "brand" | "creator";

export type SpecialistFinding = {
  id: string;
  severity: "high" | "medium" | "low";
  evidence: string;
  interpretation: string;
  action: string;
};

export type SpecialistAuditResult = {
  kind: SpecialistAuditKind;
  sourceUrl: string;
  finalUrl: string;
  title: string | null;
  description: string | null;
  summary: string;
  findings: SpecialistFinding[];
  limitations: string[];
};

function commerceFindings(web: WebAuditResult): SpecialistFinding[] {
  return [
    {
      id: "mobile",
      severity: web.signals.hasViewport ? "low" : "high",
      evidence: web.signals.hasViewport ? "Se detectó meta viewport." : "No se detectó meta viewport.",
      interpretation: web.signals.hasViewport ? "Existe una señal básica de preparación móvil, aunque no sustituye QA visual." : "La compra móvil puede renderizarse mal o requerir zoom.",
      action: "Validar en móvil real catálogo, producto, carrito y checkout.",
    },
    {
      id: "conversion",
      severity: web.signals.formCount > 0 ? "low" : "medium",
      evidence: `Se detectaron ${web.signals.formCount} formularios y ${web.signals.linkCount} enlaces en el HTML inicial.`,
      interpretation: "La estructura inicial permite estimar si existe una ruta visible hacia acciones de compra o captación, pero no confirma el checkout completo.",
      action: "Revisar jerarquía de CTA, fricción y pasos desde producto hasta confirmación.",
    },
    {
      id: "trust",
      severity: web.description && web.signals.hasOpenGraphTitle ? "low" : "medium",
      evidence: `${web.description ? "Hay meta description" : "Falta meta description"}; ${web.signals.hasOpenGraphTitle ? "hay og:title" : "falta og:title"}.`,
      interpretation: "Metadatos incompletos suelen acompañar una presentación menos controlada de la tienda en buscadores y compartidos.",
      action: "Alinear promesa, confianza y datos de producto en metadatos y primeras pantallas.",
    },
    {
      id: "hierarchy",
      severity: web.signals.h1Count === 1 ? "low" : "medium",
      evidence: `Se detectaron ${web.signals.h1Count} elementos H1.`,
      interpretation: "La jerarquía principal influye en cuánto tarda un comprador en entender qué se vende y qué debe hacer.",
      action: "Mantener una propuesta principal inequívoca y reducir competencia entre mensajes primarios.",
    },
    {
      id: "performance-risk",
      severity: web.signals.scriptCount > 20 ? "medium" : "low",
      evidence: `Se detectaron ${web.signals.scriptCount} etiquetas script.`,
      interpretation: "El recuento no mide rendimiento, pero un volumen alto aumenta el riesgo de carga lenta en móvil.",
      action: "Medir Core Web Vitals antes de optimizar y retirar scripts sin valor comercial.",
    },
  ];
}

function brandFindings(web: WebAuditResult): SpecialistFinding[] {
  const message = web.description || web.title;
  return [
    {
      id: "positioning",
      severity: message ? "low" : "high",
      evidence: message ? `Mensaje detectable: “${message}”.` : "No se detectó título ni meta description utilizable.",
      interpretation: message ? "Existe una base textual observable para evaluar posicionamiento." : "La propuesta de valor no queda explícita en las señales básicas de la página.",
      action: "Expresar con una frase quién es la marca, para quién y qué resultado entrega.",
    },
    {
      id: "share-preview",
      severity: web.signals.hasOpenGraphTitle ? "low" : "medium",
      evidence: web.signals.hasOpenGraphTitle ? "Se detectó og:title." : "No se detectó og:title.",
      interpretation: "La marca necesita controlar cómo aparece al compartirse.",
      action: "Definir Open Graph coherente con posicionamiento, tono e identidad visual.",
    },
    {
      id: "message-hierarchy",
      severity: web.signals.h1Count === 1 ? "low" : "medium",
      evidence: `Se detectaron ${web.signals.h1Count} H1.`,
      interpretation: "Una jerarquía clara ayuda a que el mensaje de marca se entienda antes de explorar detalles.",
      action: "Usar un único mensaje principal y ordenar pruebas, oferta y narrativa alrededor de él.",
    },
    {
      id: "discoverability",
      severity: web.signals.hasCanonical && web.description ? "low" : "medium",
      evidence: `${web.signals.hasCanonical ? "Hay canonical" : "Falta canonical"}; ${web.description ? "hay description" : "falta description"}.`,
      interpretation: "La identidad también se construye en resultados de búsqueda y enlaces compartidos.",
      action: "Normalizar títulos, descriptions y URLs canónicas en las páginas principales.",
    },
    {
      id: "visual-gap",
      severity: "medium",
      evidence: "Este runtime inspecciona HTML inicial, no composición visual renderizada.",
      interpretation: "Logo, color, tipografía, fotografía y consistencia visual requieren captura/render o activos aportados.",
      action: "Completar con evidencia visual antes de emitir conclusiones de identidad gráfica.",
    },
  ];
}

function creatorFindings(web: WebAuditResult): SpecialistFinding[] {
  const host = new URL(web.finalUrl).hostname.toLowerCase();
  const isYouTube = host.includes("youtube.com") || host === "youtu.be";
  return [
    {
      id: "source",
      severity: isYouTube ? "low" : "medium",
      evidence: `Fuente analizada: ${host}.`,
      interpretation: isYouTube ? "La URL pertenece a YouTube y puede servir como punto de partida para análisis de creador." : "La URL no es YouTube; el análisis queda limitado a señales públicas de la página.",
      action: "Para análisis profundo aporta la URL canónica del canal o vídeo principal.",
    },
    {
      id: "title",
      severity: web.title ? "low" : "high",
      evidence: web.title ? `Título detectado: “${web.title}”.` : "No se detectó título.",
      interpretation: "El título es una de las señales editoriales más visibles para entender tema y promesa.",
      action: "Evaluar claridad, especificidad y gancho frente a la audiencia objetivo.",
    },
    {
      id: "description",
      severity: web.description ? "low" : "medium",
      evidence: web.description ? `Descripción pública detectada: “${web.description}”.` : "No se detectó meta description utilizable.",
      interpretation: "La descripción ayuda a contextualizar propuesta, tema o contenido, pero no sustituye una transcripción.",
      action: "Aportar transcripción o datos del canal para análisis de hooks, formatos y patrones.",
    },
    {
      id: "social-preview",
      severity: web.signals.hasOpenGraphTitle ? "low" : "medium",
      evidence: web.signals.hasOpenGraphTitle ? "Se detectó Open Graph title." : "No se detectó Open Graph title.",
      interpretation: "Las previews influyen en cómo se presenta el contenido fuera de la plataforma.",
      action: "Revisar miniatura y preview visual en la fase con captura o datos de plataforma.",
    },
    {
      id: "dataset-gap",
      severity: "medium",
      evidence: "No se consultan todavía métricas de vistas, frecuencia, outliers ni transcripciones de plataforma.",
      interpretation: "Sin ese dataset no sería riguroso afirmar patrones de rendimiento.",
      action: "Conectar un proveedor de datos o ingestión autorizada antes de puntuar rendimiento del canal.",
    },
  ];
}

export async function runSpecialistUrlAudit(kind: SpecialistAuditKind, rawUrl: string): Promise<SpecialistAuditResult> {
  const web = await auditWebsite(rawUrl);
  const findings = kind === "commerce" ? commerceFindings(web) : kind === "brand" ? brandFindings(web) : creatorFindings(web);
  const labels: Record<SpecialistAuditKind, string> = {
    commerce: "Auditoría e-commerce",
    brand: "Auditoría de marca",
    creator: "Inteligencia de creador",
  };
  return {
    kind,
    sourceUrl: web.requestedUrl,
    finalUrl: web.finalUrl,
    title: web.title,
    description: web.description,
    summary: `${labels[kind]} basada en evidencia pública observable de la URL, sin completar huecos con datos inventados.`,
    findings,
    limitations: [
      "Esta primera versión analiza HTML inicial y metadatos públicos.",
      "No ejecuta acciones sobre el sitio ni autentica cuentas externas.",
      "Las conclusiones visuales, métricas privadas y datos de plataforma requieren fuentes adicionales.",
    ],
  };
}
