import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEXO Business Analyzer — Analiza una idea de negocio",
  description:
    "Evalúa una idea de negocio con NEXO Business Analyzer: problema, cliente, monetización, diferenciación, riesgos, MVP y próximos pasos.",
  alternates: {
    canonical: "/herramientas",
  },
  openGraph: {
    title: "NEXO Business Analyzer — Analiza una idea de negocio",
    description:
      "Somete una idea de negocio a un primer filtro de problema, cliente, monetización, diferenciación, riesgos y validación.",
    url: "/herramientas",
    type: "website",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
