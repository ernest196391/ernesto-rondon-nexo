import "./globals.css";
import "./mobile-a11y.css";
import "./voucher-review.css";
import Link from "next/link";
import type { Metadata } from "next";

const siteUrl = "https://nexo.casavivadecuba.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NEXO — De una idea a un negocio real",
    template: "%s | NEXO",
  },
  description:
    "NEXO investiga, valida y construye negocios, productos digitales y sistemas con inteligencia artificial.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName: "NEXO",
    title: "NEXO — De una idea a un negocio real",
    description:
      "Investiga, valida y construye negocios y productos digitales con inteligencia artificial.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXO — De una idea a un negocio real",
    description:
      "Investiga, valida y construye negocios y productos digitales con inteligencia artificial.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#contenido-principal">
          Saltar al contenido
        </a>
        <div className="wrap">
          <nav aria-label="Navegación principal">
            <Link className="brand" href="/" aria-label="NEXO — Inicio">
              NEXO
            </Link>
            <div className="links">
              <Link href="/negocios">Proyectos</Link>
              <Link href="/herramientas">Herramientas</Link>
              <Link href="/mensajeria/interpretar-vale">Vales</Link>
              <Link href="/sobre-mi">Ernesto</Link>
              <Link href="/contacto">Contacto</Link>
            </div>
          </nav>
          <div id="contenido-principal">{children}</div>
          <footer>
            © {new Date().getFullYear()} NEXO · Idea → evidencia → negocio.
          </footer>
        </div>
      </body>
    </html>
  );
}
