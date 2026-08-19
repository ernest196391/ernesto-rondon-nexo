import "./globals.css";
import Link from "next/link";
export const metadata={title:"Ernesto Rondón — Negocios, sistemas e IA",description:"Construyo negocios y sistemas utilizando tecnología e inteligencia artificial."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><div className="wrap"><nav><Link className="brand" href="/">ERNESTO RONDÓN</Link><div className="links"><Link href="/negocios">Negocios</Link><Link href="/herramientas">Herramientas</Link><Link href="/sobre-mi">Sobre mí</Link><Link href="/contacto">Contacto</Link></div></nav>{children}<footer>© {new Date().getFullYear()} Ernesto Rondón · Construyendo negocios, sistemas y herramientas.</footer></div></body></html>}
