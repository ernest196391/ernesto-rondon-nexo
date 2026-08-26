import "./globals.css";
import "./mobile-a11y.css";
import "./voucher-review.css";
import "./nexo-home-film.css";
import Link from "next/link";
import type { Metadata } from "next";

const siteUrl = "https://nexotienda.casavivadecuba.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NEXO — Lo que buscas, más cerca",
    template: "%s | NEXO",
  },
  description:
    "Compra productos seleccionados con acompañamiento, disponibilidad verificada y entrega coordinada.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName: "NEXO",
    title: "NEXO — Lo que buscas, más cerca",
    description:
      "Productos seleccionados, compra acompañada y entrega coordinada.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXO — Lo que buscas, más cerca",
    description:
      "Productos seleccionados, compra acompañada y entrega coordinada.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const platformPublic = process.env.NEXO_PLATFORM_PUBLIC === "true";
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
              <Link href="/#productos">Productos</Link>
              <Link href="/contacto">Contacto</Link>
              {platformPublic && <Link href="/studio">Studio</Link>}
              {platformPublic && <Link href="/negocios">Proyectos</Link>}
              {platformPublic && <Link href="/herramientas">Herramientas</Link>}
            </div>
          </nav>
          <div id="contenido-principal">{children}</div>
          <footer>
            © {new Date().getFullYear()} NEXO · Lo que buscas, más cerca.
          </footer>
        </div>
      </body>
    </html>
  );
}
