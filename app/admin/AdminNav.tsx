"use client";
import {usePathname} from "next/navigation";
import {useState} from "react";

const items=[
 {href:"/admin",label:"Inicio"},
 {href:"/admin/pedidos",label:"Pedidos"},
 {href:"/admin/productos",label:"Productos"},
];

export default function AdminNav(){
 const path=usePathname();
 const[busy,setBusy]=useState(false);
 async function switchAccess(){
  if(busy)return;
  setBusy(true);
  try{await fetch("/api/gestoras/auth/logout",{method:"POST"});}finally{window.location.assign("/impulsa/login");}
 }
 return <nav className="admin-nav" aria-label="Centro de control"><div className="admin-nav-inner">
  {items.map(item=>{const active=item.href==="/admin"?path==="/admin":path.startsWith(item.href);return <a key={item.href} href={item.href} className={active?"active":""} aria-current={active?"page":undefined}>{item.label}</a>;})}
  <button type="button" onClick={switchAccess} disabled={busy} style={{marginLeft:"auto",whiteSpace:"nowrap",border:"1px solid #cbd5cf",background:"#fff",color:"#174431",borderRadius:999,padding:"9px 13px",fontWeight:800,font:"inherit",cursor:busy?"wait":"pointer",opacity:busy?.65:1}}>{busy?"Saliendo…":"Cambiar acceso"}</button>
 </div></nav>;
}
