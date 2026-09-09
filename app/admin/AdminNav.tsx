"use client";
import {usePathname} from "next/navigation";
import {useState} from "react";

const items=[
 {href:"/admin",label:"Inicio"},
 {href:"/admin/pedidos",label:"Pedidos"},
];

export default function AdminNav(){
 const path=usePathname();
 const[busy,setBusy]=useState(false);
 async function switchAccess(){
  if(busy)return;
  setBusy(true);
  try{
   await fetch("/api/gestoras/auth/logout",{method:"POST"});
  }finally{
   window.location.assign("/impulsa/login");
  }
 }
 return <nav className="admin-nav" aria-label="Centro de control">
  <div className="admin-nav-inner">
   {items.map(item=>{
    const active=item.href==="/admin"?path==="/admin":path.startsWith(item.href);
    return <a key={item.href} href={item.href} className={active?"active":""} aria-current={active?"page":undefined}>{item.label}</a>;
   })}
   <button className="admin-switch-access" type="button" onClick={switchAccess} disabled={busy}>{busy?"Saliendo…":"Cambiar acceso"}</button>
  </div>
 </nav>;
}
