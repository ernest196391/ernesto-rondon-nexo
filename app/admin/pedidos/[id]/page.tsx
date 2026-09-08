import {notFound,redirect} from "next/navigation";
import {currentCommercialActor} from "../../../../lib/commercial/auth";
import {adminOrderDetail} from "../../../../lib/commercial/admin-overview";
import AdminNav from "../../AdminNav";
import OrderActions from "./OrderActions";
import "../../admin.css";

export const dynamic="force-dynamic";
const labels:Record<string,string>={pending:"Pendiente",processing:"Procesando",on_hold:"En espera",completed:"Completado",cancelled:"Cancelado",refunded:"Reembolsado",failed:"Fallido"};

export default async function Page({params}:{params:Promise<{id:string}>}){
 const actor=await currentCommercialActor();
 if(!actor||actor.role!=="admin")redirect("/admin/login");
 const {id}=await params;
 const orderId=Number(id);
 if(!Number.isFinite(orderId))notFound();
 let data;
 try{data=await adminOrderDetail(orderId)}catch{return notFound()}
 const o=data.order;
 const commission=data.ledger.reduce((s:number,x:any)=>s+Number(x.amount||0),0);
 return <main className="admin-shell">
  <header className="admin-top"><div><img src="/brand/nexo-logo-001g.png" alt="NEXO"/><span>ADMIN</span></div><a href="/">Ver tienda</a></header>
  <AdminNav/>
  <div className="admin-wrap">
   <a className="admin-back" href="/admin/pedidos">← Pedidos</a>
   <section className="admin-order-detail-head"><div><span>PEDIDO #{o.id}</span><h1>{o.customer}</h1><p>{new Date(o.date).toLocaleString("es-CU",{dateStyle:"medium",timeStyle:"short"})}</p></div><div><strong>{o.total.toFixed(2)} {o.currency}</strong><span>{labels[o.status]||o.status}</span></div></section>
   <OrderActions orderId={o.id} status={o.status}/>
   <section className="admin-detail-grid">
    <article className="admin-panel"><div className="admin-heading"><div><span>COMPRA</span><h2>Productos</h2></div></div><div className="simple-list product-lines">{o.items.map((x:any)=><div className="product-line" key={`${x.productId}-${x.variationId}-${x.name}`}>{x.image?<img className="order-thumb detail" src={x.image} alt={x.name}/>:<div className="order-thumb detail placeholder" aria-hidden="true">📦</div>}<span><b>{x.quantity}× {x.name}</b><small>Producto #{x.productId||"—"}</small></span><strong>{x.total.toFixed(2)} {o.currency}</strong></div>)}</div><div className="admin-summary"><span>Subtotal <b>{o.subtotal.toFixed(2)} {o.currency}</b></span><span>Mensajería <b>{o.shippingTotal.toFixed(2)} {o.currency}</b></span><span>Total <b>{o.total.toFixed(2)} {o.currency}</b></span></div></article>
    <article className="admin-panel"><div className="admin-heading"><div><span>CLIENTE Y ENTREGA</span><h2>Entrega</h2></div></div><dl className="admin-facts"><div><dt>Teléfono</dt><dd>{o.phone||"No disponible"}</dd></div><div><dt>Email</dt><dd>{o.email||"No disponible"}</dd></div><div><dt>Modalidad</dt><dd>{o.deliveryMode||"No disponible"}</dd></div><div><dt>Localidad</dt><dd>{o.locality||"No disponible"}</dd></div><div><dt>Dirección</dt><dd>{o.address||"No disponible"}</dd></div><div><dt>Referencia</dt><dd>{o.reference||"No disponible"}</dd></div><div><dt>Horario</dt><dd>{o.deliveryWindow||"No disponible"}</dd></div><div><dt>Pago</dt><dd>{o.paymentMethod||"No disponible"}</dd></div></dl></article>
   </section>
   <section className="admin-detail-grid">
    <article className="admin-panel"><div className="admin-heading"><div><span>ATRIBUCIÓN</span><h2>Origen</h2></div></div><dl className="admin-facts"><div><dt>Origen</dt><dd>{o.origin||"No disponible"}</dd></div><div><dt>Gestora</dt><dd>{o.gestora||"Venta directa"}</dd></div><div><dt>Tienda</dt><dd>{o.gestoraSlug||"No aplica"}</dd></div><div><dt>Referral solicitado</dt><dd>{o.refRequested||"No disponible"}</dd></div><div><dt>Referral efectivo</dt><dd>{o.refEffective||"No disponible"}</dd></div><div><dt>Comisión</dt><dd>{commission?`${commission.toFixed(2)} ${data.ledger[0]?.currency||o.currency}`:"Sin movimiento registrado"}</dd></div></dl>{data.ledger.length>0&&<div className="simple-list compact-list">{data.ledger.map((l:any)=><div key={l.id}><span><b>{l.type}</b><small>{l.status}</small></span><strong>{Number(l.amount).toFixed(2)} {l.currency}</strong></div>)}</div>}</article>
    <article className="admin-panel"><div className="admin-heading"><div><span>TRAZABILIDAD</span><h2>Estado</h2></div></div><div className="admin-status-card"><b>{labels[o.status]||o.status}</b></div>{o.customerNote&&<div className="admin-note"><b>Nota del cliente</b><p>{o.customerNote}</p></div>}{data.reconciliation.length?<div className="simple-list compact-list">{data.reconciliation.map((r:any,i:number)=><div key={i}><span><b>Incidencia</b><small>{r.error}</small></span><strong>{r.status}</strong></div>)}</div>:<div className="admin-empty">Sin incidencias.</div>}</article>
   </section>
  </div>
 </main>;
}
