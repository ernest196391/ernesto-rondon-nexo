import {redirect} from "next/navigation";
import {currentCommercialActor} from "../../../lib/commercial/auth";
import {adminOverview} from "../../../lib/commercial/admin-overview";
import AdminNav from "../AdminNav";
import "../admin.css";

export const dynamic="force-dynamic";
export const metadata={title:"Pedidos | NEXO Admin"};

const labels:Record<string,string>={pending:"Pendiente",processing:"Procesando",on_hold:"En espera",completed:"Completado",cancelled:"Cancelado",refunded:"Reembolsado",failed:"Fallido"};
const filterLabels:Record<string,string>={todos:"Últimos pedidos",abiertos:"Abiertos",procesando:"Procesando",completados:"Completados",cancelados:"Cancelados"};

export default async function Page({searchParams}:{searchParams?:Promise<{estado?:string}>}){
 const actor=await currentCommercialActor();
 if(!actor||actor.role!=="admin")redirect("/admin/login");
 const data=await adminOverview();
 const params=searchParams?await searchParams:{};
 const estado=["todos","abiertos","procesando","completados","cancelados"].includes(String(params?.estado))?String(params?.estado):"todos";
 const counts={todos:data.orders.length,abiertos:data.orders.filter(o=>["pending","on_hold","processing"].includes(o.status)).length,procesando:data.orders.filter(o=>o.status==="processing").length,completados:data.orders.filter(o=>o.status==="completed").length,cancelados:data.orders.filter(o=>o.status==="cancelled").length};
 const visible=data.orders.filter(o=>estado==="abiertos"?["pending","on_hold","processing"].includes(o.status):estado==="procesando"?o.status==="processing":estado==="completados"?o.status==="completed":estado==="cancelados"?o.status==="cancelled":true);
 const chip=(key:string,label:string,count:number)=>{const active=estado===key;return <a href={key==="todos"?"/admin/pedidos":`/admin/pedidos?estado=${key}`} aria-current={active?"page":undefined} style={active?{background:"#174431",color:"#fff",borderColor:"#174431"}:undefined}>{label} <b>{count}</b></a>};
 return <main className="admin-shell">
  <header className="admin-top"><div><img src="/brand/nexo-logo-001g.png" alt="NEXO"/><span>ADMIN</span></div><a href="/">Ver tienda</a></header>
  <AdminNav/>
  <div className="admin-wrap">
   <section className="admin-hero compact"><span>PEDIDOS</span><h1>Pedidos</h1></section>
   <section className="admin-order-filters" aria-label="Filtrar pedidos por estado">{chip("todos","Todos",counts.todos)}{chip("abiertos","Abiertos",counts.abiertos)}{chip("procesando","Procesando",counts.procesando)}{chip("completados","Completados",counts.completados)}{chip("cancelados","Cancelados",counts.cancelados)}</section>
   <section className="admin-panel">
    <div className="admin-heading"><div><span>RESULTADOS</span><h2>{filterLabels[estado]}</h2></div></div>
    <div className="admin-orders">{visible.length?visible.map(o=>{const first=o.items[0];return <a className="admin-order-link" key={o.id} href={`/admin/pedidos/${o.id}`}><article><div className="order-card-grid">{first?.image?<img className="order-thumb" src={first.image} alt={first.name}/>:<div className="order-thumb placeholder" aria-hidden="true">📦</div>}<div className="order-main"><div><small>#{o.id} · {new Date(o.date).toLocaleString("es-CU",{dateStyle:"short",timeStyle:"short"})}</small><h3>{o.customer}</h3><p>{o.items.map((x:any)=>`${x.quantity}× ${x.name}`).join(" · ")}</p></div><div className="order-total"><b>{o.total.toFixed(2)} {o.currency}</b><span>{labels[o.status]||o.status}</span></div></div></div><div className="order-context"><span>{o.gestora?`Gestora: ${o.gestora}`:"Venta directa"}</span><span>{o.deliveryMode||"Entrega por confirmar"}</span>{o.locality&&<span>{o.locality}</span>}</div></article></a>}):<div className="admin-empty">No hay pedidos en este estado.</div>}</div>
   </section>
  </div>
 </main>;
}
