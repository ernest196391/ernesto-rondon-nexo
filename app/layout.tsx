import "./globals.css";
import "./mobile-a11y.css";
import "./voucher-review.css";
import "./nexo-home-film.css";
import type { Metadata } from "next";
import CommerceSiteShell from "./CommerceSiteShell";

const siteUrl = "https://nexotienda.casavivadecuba.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NEXO — Lo que buscas, más cerca",
    template: "%s | NEXO",
  },
  description:
    "Compra productos seleccionados en NEXO con entrega a domicilio o recogida coordinada.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/brand/nexo-symbol.png", apple: "/brand/nexo-symbol.png" },
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <a className="skip-link" href="#contenido-principal">
          Saltar al contenido
        </a>
        <CommerceSiteShell
          marketplaceEnabled={process.env.NEXO_MARKETPLACE_ENABLED === "true"}
        >
          {children}
        </CommerceSiteShell>
      </body>
    </html>
  );
}
