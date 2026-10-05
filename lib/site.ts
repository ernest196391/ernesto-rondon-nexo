// Dirección pública de la tienda NEXO. Un solo sitio para cambiarla.
// En producción se fija con la variable NEXO_PUBLIC_URL (Render).
// Destino acordado: https://tienda.nexocuba.com (docs/00-FUENTE-DE-VERDAD/DECISIONES.md D17).
const FALLBACK = "https://nexotienda.casavivadecuba.com";

function resolve(): string {
  const configured = process.env.NEXO_PUBLIC_URL;
  if (configured) {
    try {
      const url = new URL(configured);
      if (!/^(localhost|127\.0\.0\.1)$/i.test(url.hostname)) return url.origin;
    } catch {}
  }
  return FALLBACK;
}

export const SITE_URL = resolve();
export const SITE_HOST = new URL(SITE_URL).host;
