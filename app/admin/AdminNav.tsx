"use client";
import {usePathname} from "next/navigation";

const items=[
 {href:"/admin",label:"Inicio"},
 {href:"/admin/pedidos",label:"Pedidos"},
];

export default function AdminNav(){
 const path=usePathname();
 return <nav className="admin-nav" aria-label="Centro de control">
  <div className="admin-nav-inner">
   {items.map(item=>{
    const active=item.href==="/admin"?path==="/admin":path.startsWith(item.href);
    return <a key={item.href} href={item.href} className={active?"active":""} aria-current={active?"page":undefined}>{item.label}</a>;
   })}
  </div>
 </nav>;
}
