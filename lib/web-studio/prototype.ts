import type { WebAuditResult } from "./audit";

export type WebPrototype = {
  eyebrow: string;
  heroTitle: string;
  heroCopy: string;
  primaryCta: string;
  secondaryCta: string;
  sections: Array<{ title: string; purpose: string }>;
  notes: string[];
};

export function buildWebPrototype(result: WebAuditResult): WebPrototype {
  const host = new URL(result.finalUrl).hostname.replace(/^www\./, "");
  const heroTitle = result.title || host;
  const heroCopy = result.description || "Propuesta principal pendiente de redactar con evidencia adicional del negocio.";

  const sections = result.brief.recommendedSections.map((title, index) => ({
    title,
    purpose:
      index === 0
        ? "Hacer evidente qué ofrece el negocio y cuál es la acción principal."
        : index === 1
          ? "Reducir incertidumbre usando únicamente evidencia verificable."
          : index === 2
            ? "Explicar la oferta en términos de resultados y capacidades concretas."
            : index === 3
              ? "Mostrar un recorrido simple desde la necesidad hasta el resultado."
              : "Cerrar el recorrido con una acción dominante y alternativas secundarias.",
  }));

  return {
    eyebrow: host.toUpperCase(),
    heroTitle,
    heroCopy,
    primaryCta: result.signals.formCount > 0 ? "Empezar" : "Conocer la oferta",
    secondaryCta: "Ver cómo funciona",
    sections,
    notes: [
      "Borrador estructural: no se publica ni modifica la web analizada.",
      "El texto detectado se conserva; NEXO no inventa testimonios, métricas ni servicios.",
      "La aprobación humana es obligatoria antes de cualquier futura publicación.",
    ],
  };
}
