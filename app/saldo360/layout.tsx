import type {Metadata,Viewport} from "next";
export const metadata:Metadata={title:"Saldo 360 — Busco saldo · Tengo saldo",description:"Busca ofertas de saldo Cubacel o prepara tu anuncio. Compara proveedores y contacta directamente.",manifest:"/saldo360/manifest.webmanifest",icons:{icon:"/saldo360/logo.svg",apple:"/saldo360/logo.svg"}};
export const viewport:Viewport={themeColor:"#0D3B8E"};
export default function SaldoLayout({children}:{children:React.ReactNode}){return <>{children}</>;}
