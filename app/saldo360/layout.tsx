import type {Metadata,Viewport} from "next";
export const metadata:Metadata={title:{absolute:"Saldo 360 — Busco saldo · Tengo saldo"},description:"Compara precios de saldo móvil y escribe directo al vendedor por WhatsApp.",manifest:"/saldo360/manifest.webmanifest",icons:{icon:[{url:"/saldo360/icon-32.png",sizes:"32x32",type:"image/png"},{url:"/saldo360/logo.svg",type:"image/svg+xml"}],apple:"/saldo360/apple-touch-icon.png"}};
export const viewport:Viewport={themeColor:"#0D3B8E",width:"device-width",initialScale:1};
export default function SaldoLayout({children}:{children:React.ReactNode}){return <>{children}</>;}
