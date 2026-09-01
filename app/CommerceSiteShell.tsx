"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CommerceFooter from "./CommerceFooter";
import GlobalCommerceAssistant from "./GlobalCommerceAssistant";

const commercePrefixes = ["/marketplace", "/producto/", "/carrito", "/checkout", "/pedido/", "/g/"];

export default function CommerceSiteShell({ children, marketplaceEnabled }: { children: React.ReactNode; marketplaceEnabled: boolean }) {
  const pathname = usePathname();
  const workspace = pathname.startsWith("/impulsa") || pathname.startsWith("/studio");
  const commerce = (pathname === "/" && marketplaceEnabled) || commercePrefixes.some((prefix) => pathname.startsWith(prefix));
  if (workspace) return <div id="contenido-principal">{children}</div>;
  if (commerce) return <><div id="contenido-principal">{children}</div><CommerceFooter/><GlobalCommerceAssistant/></>;
  return <div className="wrap">
    <nav aria-label="Navegación principal">
      <Link className="brand" href="/" aria-label="NEXO — Inicio"><img src="/brand/nexo-logo-001g.png" alt="NEXO"/></Link>
      <div className="links"><Link href="/#productos">Productos</Link><Link href="/contacto">Contacto</Link></div>
    </nav>
    <div id="contenido-principal">{children}</div>
    <footer>© {new Date().getFullYear()} NEXO · Lo que buscas, más cerca.</footer>
  </div>;
}
