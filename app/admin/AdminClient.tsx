"use client";
import Link from "next/link";
import AdminNav from "./AdminNav";

type Overview={
 kpis:{orders:number;gestoraOrders:number;activeGestoras:number;availableCommission:number;stockAlerts:number};
 orders:any[];products:any[];gestoras:any[];ledger:any[];payouts:any[];reconciliation:any[];
};

const labels:Record<string,string>={pending:"Pendiente",processing:"Procesando",on_hold:"En espera",completed:"Completado",cancelled:"Cancelado",refunded:"Reembolsado",failed:"Fallido"};

export default function AdminClient({initial}:{initial:Overview}){
 const pending=initial.orders.filter(o=>["pending","on_hold","processing"].includes(o.status));
 const stock=initial.products.filter(p=>p.stockStatus!=="instock"||(p.stockQuantity!=null&&p.stockQuantity<=2));
 const attention=[
  ...pending.slice(0,4).map(o=>({kind:"Pedido",title:`Pedido #${o.id} · ${o.customer}`,detail:`${labels[o.status]||o.status}${o.gestora?` · ${o.gestora}`:""}`,href:`/admin/pedidos/${o.id}`})),
  ...initial.reconciliation.slice(0,2).map(r=>({kind:"Incidencia",title:`Pedido #${r.orderId}`,detail:r.error||"Reconciliación pendiente",href:`/admin/pedidos/${r.orderId}`})),
  ...stock.slice(0,3).map(p=>({kind:"Inventario",title:p.name,detail:p.stockQuantity==null?p.stockStatus:`Quedan ${p.stockQuantity}`,href:"#inventario"}))
 ].slice(0,7);
 const priorityAction=pending.length?{href:"/admin/pedidos?estado=abiertos",label:"Ver pedidos abiertos"}:stock.length?{href:"#inventario",label:"Ver stock"}:null;
 return <main className="admin-shell">
  <header className="admin-top"><div><img src="/brand/nexo-logo-001g.png" alt="NEXO"/><span>ADMIN</span></div><Link href="/">Ver tienda</Link></header>
  <AdminNav/>
  <div className="admin-wrap">
   <section className="admin-hero"><span>OPERACIONES</span><h1>¿Qué necesita atención?</h1><p>Prioridades reales de pedidos, inventario e incidencias.</p></section>
   <section className="admin-kpis">
    <article><small>PEDIDOS ABIERTOS</small><strong>{pending.length}</strong></article>
    <article><small>CON GESTORA</small><strong>{initial.kpis.gestoraOrders}</strong></article>
    <article><small>GESTORAS ACTIVAS</small><strong>{initial.kpis.activeGestoras}</strong></article>
    <article><small>COMISIÓN DISPONIBLE</small><strong>{initial.kpis.availableCommission.toFixed(2)} USD</strong></article>
    <article><small>STOCK A REVISAR</small><strong>{initial.kpis.stockAlerts}</strong></article>
   </section>
   <section className="admin-panel">
    <div className="admin-heading"><div><span>PRIORIDAD</span><h2>Atender ahora</h2></div>{priorityAction&&<a className="admin-text-link" href={priorityAction.href}>{priorityAction.label}</a>}</div>
    {attention.length?<div className="attention-list">{attention.map((x,i)=><a key={`${x.kind}-${i}`} href={x.href}><small>{x.kind}</small><div><b>{x.title}</b><span>{x.detail}</span></div><strong>→</strong></a>)}</div>:<div className="admin-empty">No hay acciones urgentes ahora.</div>}
   </section>
   <section className="admin-home-grid">
    <article className="admin-panel"><div className="admin-heading"><div><span>PEDIDOS</span><h2>Actividad reciente</h2></div></div><div className="simple-list">{initial.orders.slice(0,5).map(o=><a className="simple-row-link" key={o.id} href={`/admin/pedidos/${o.id}`}><span><b>#{o.id} · {o.customer}</b><small>{labels[o.status]||o.status}{o.gestora?` · ${o.gestora}`:""}</small></span><strong>{o.total.toFixed(2)} {o.currency}</strong></a>)}</div></article>
    <article className="admin-panel" id="inventario"><div className="admin-heading"><div><span>INVENTARIO</span><h2>Stock bajo</h2></div></div>{stock.length?<div className="simple-list">{stock.slice(0,6).map(p=><div key={p.id}><span><b>{p.name}</b><small>Producto #{p.id}</small></span><strong>{p.stockQuantity==null?p.stockStatus:p.stockQuantity}</strong></div>)}</div>:<div className="admin-empty">Sin alertas de stock.</div>}</article>
   </section>
  </div>
 </main>;
}
