import "./globals.css";
import "./mobile-a11y.css";
import "./voucher-review.css";
import "./nexo-home-film.css";
import type { Metadata } from "next";
import CommerceSiteShell from "./CommerceSiteShell";
import PwaRegistration from "./PwaRegistration";

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
  icons: {
    icon: [
      { url: "/brand/nexo-favicon.ico?v=001g", type: "image/x-icon" },
      { url: "/brand/nexo-favicon-32.png?v=001g", sizes: "32x32", type: "image/png" },
      { url: "/brand/nexo-icon-192.png?v=001g", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/nexo-apple-touch-icon.png?v=001g", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName: "NEXO",
    title: "NEXO — Lo que buscas, más cerca",
    description:
      "Productos seleccionados, compra acompañada y entrega coordinada.",
    images: [{ url: "/brand/nexo-logo-001g.png", width: 760, height: 280, alt: "NEXO" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXO — Lo que buscas, más cerca",
    description:
      "Productos seleccionados, compra acompañada y entrega coordinada.",
  },
};

export const viewport = { themeColor: "#061A44" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <PwaRegistration />
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
