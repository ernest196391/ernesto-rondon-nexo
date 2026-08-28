import Image from "next/image";
import Link from "next/link";
export default function CommerceFooter() {
  return (
    <footer className="commerce-footer">
      <div>
        <Image src="/brand/nexo-logo.png" width={150} height={54} alt="NEXO" />
        <p>Lo que buscas, más cerca.</p>
      </div>
      <nav aria-label="Comprar">
        <strong>Comprar</strong><Link href="/marketplace">Productos y categorías</Link><Link href="/carrito">Carrito</Link>
      </nav>
      <nav aria-label="Ayuda">
        <strong>Ayuda</strong><Link href="/contacto">Entrega y recogida</Link><a href="https://wa.me/5354056173">WhatsApp: +53 54056173</a>
      </nav>
      <small>© {new Date().getFullYear()} NEXO. Todos los derechos reservados.</small>
    </footer>
  );
}
