import Image from "next/image";
import Link from "next/link";
export default function CommerceFooter() {
  return (
    <footer className="commerce-footer">
      <div>
        <Image src="/brand/nexo-logo-001g.png" width={150} height={54} alt="NEXO" />
        <p>Más cerca de ti.</p>
      </div>
      <nav aria-label="Comprar">
        <strong>Comprar</strong><Link href="/marketplace">Explorar</Link><Link href="/carrito">Carrito</Link>
      </nav>
      <nav aria-label="Ayuda">
        <strong>Ayuda</strong><Link href="/contacto">Entrega y recogida</Link><a href="https://wa.me/5354056173">WhatsApp</a>
      </nav>
      <small>© {new Date().getFullYear()} NEXO. Todos los derechos reservados.</small>
    </footer>
  );
}
