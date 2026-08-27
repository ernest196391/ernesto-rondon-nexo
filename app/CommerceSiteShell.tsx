"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const commercePrefixes = ["/marketplace", "/producto/", "/carrito", "/checkout", "/pedido/"];

export default function CommerceSiteShell({ children, marketplaceEnabled }: { children: React.ReactNode; marketplaceEnabled: boolean }) {
  const pathname = usePathname();
  const commerce = (pathname === "/" && marketplaceEnabled) || commercePrefixes.some((prefix) => pathname.startsWith(prefix));
  if (commerce) return <div id="contenido-principal">{children}</div>;
  return <div className="wrap">
    <nav aria-label="Navegación principal">
      <Link className="brand" href="/" aria-label="NEXO — Inicio">NEXO</Link>
      <div className="links"><Link href="/#productos">Productos</Link><Link href="/contacto">Contacto</Link></div>
    </nav>
    <div id="contenido-principal">{children}</div>
    <footer>© {new Date().getFullYear()} NEXO · Lo que buscas, más cerca.</footer>
  </div>;
}
