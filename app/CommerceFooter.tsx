import Image from "next/image";
import Link from "next/link";
export default function CommerceFooter() {
  return (
    <footer className="commerce-footer">
      <div>
        <Image src="/brand/nexo-logo.png" width={150} height={54} alt="NEXO" />
        <p>Productos útiles, atención cercana y pedidos coordinados.</p>
      </div>
      <nav aria-label="Información de la tienda">
        <Link href="/marketplace">Productos</Link>
        <Link href="/carrito">Carrito</Link>
        <Link href="/contacto">Contacto</Link>
      </nav>
      <a href="https://wa.me/5354056173">WhatsApp: +53 54056173</a>
    </footer>
  );
}
