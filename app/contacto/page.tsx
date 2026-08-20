import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta con NEXO para proyectos, alianzas y oportunidades relacionadas con negocios, productos digitales y sistemas con inteligencia artificial.",
  alternates: {
    canonical: "/contacto",
  },
  openGraph: {
    title: "Contacto | NEXO",
    description:
      "Contacta con NEXO para proyectos, alianzas y oportunidades relacionadas con negocios, productos digitales y sistemas con inteligencia artificial.",
    url: "/contacto",
  },
};

export default function Page() {
  return (
    <main className="section">
      <div className="eyebrow">Contacto</div>
      <h1>Construyamos algo útil.</h1>
      <p className="lead">
        Este MVP todavía no publica datos personales de contacto. La siguiente iteración incorporará un formulario para negocios, alianzas y proyectos de Nexo, con protección anti-spam y almacenamiento seguro.
      </p>
    </main>
  );
}
