"use client";
import {useMemo,useState} from "react";

type Product={id:number;name:string;sku:string;price:string;regularPrice:string;status:string;stockStatus:string;stockQuantity:number|null;manageStock:boolean;image:string;type:string};
type Props={products:Product[]};

export default function ProductsClient({products}:Props){
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState<"all"|"instock"|"outofstock"|"draft">("all");
 const [busy,setBusy]=useState<number|null>(null);
 const [feedback,setFeedback]=useState<Record<number,string>>({});
 const [rows,setRows]=useState(products);
 const visible=useMemo(()=>rows.filter(p=>{
  const q=query.trim().toLowerCase();
  const matches=!q||`${p.name} ${p.sku} ${p.id}`.toLowerCase().includes(q);
  const state=filter==="all"||filter==="draft"?p.status==="draft":p.stockStatus===filter;
  return matches&&state;
 }),[rows,query,filter]);
 async function act(productId:number,body:Record<string,unknown>){
  setBusy(productId);setFeedback(v=>({...v,[productId]:"Guardando…"}));
  try{
   const response=await fetch("/api/admin/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,...body})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"No se pudo guardar.");
   setRows(current=>current.map(p=>p.id!==productId?p:{...p,...(body.action==="stock"?{stockQuantity:Number(body.quantity),stockStatus:Number(body.quantity)>0?"instock":"outofstock",manageStock:true}:body.action==="price"?{price:Number(body.price).toFixed(2),regularPrice:Number(body.price).toFixed(2)}:body.action==="status"?{status:String(body.status)}:{})}));
   setFeedback(v=>({...v,[productId]:"Actualizado"}));
  }catch(e){setFeedback(v=>({...v,[productId]:e instanceof Error?e.message:"Error al guardar"}));}
  finally{setBusy(null);}
 }
 const count=(key:string)=>key==="draft"?rows.filter(p=>p.status==="draft").length:rows.filter(p=>p.stockStatus===key).length;
 return <>
  <section className="admin-product-toolbar">
   <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por producto, SKU o ID" aria-label="Buscar productos"/>
   <div className="admin-product-tabs">
    {[['all','Todos',rows.length],['instock','Disponibles',count('instock')],['outofstock','Agotados',count('outofstock')],['draft','Borradores',count('draft')]].map(([key,label,total])=><button key={String(key)} className={filter===key?"active":""} onClick={()=>setFilter(key as typeof filter)}>{label} <b>{total}</b></button>)}
   </div>
  </section>
  <section className="admin-products-grid">
   {visible.length?visible.map(p=><article className="admin-product-card" key={p.id}>
    <div className="admin-product-primary">
     {p.image?<img src={p.image} alt={p.name}/>:<div className="admin-product-placeholder">📦</div>}
     <div><small>#{p.id}{p.sku?` · ${p.sku}`:""}</small><h2>{p.name}</h2><div className="admin-product-badges"><span>{p.status==="publish"?"Publicado":"Borrador"}</span><span>{p.stockStatus==="instock"?"Disponible":p.stockStatus==="outofstock"?"Agotado":p.stockStatus}</span></div></div>
    </div>
    <div className="admin-product-fields">
     <form onSubmit={e=>{e.preventDefault();const fd=new FormData(e.currentTarget);act(p.id,{action:"price",price:Number(fd.get("price"))})}}><label>Precio USD<input name="price" type="number" min="0" step="0.01" defaultValue={p.regularPrice||p.price||"0"}/></label><button disabled={busy===p.id}>Guardar precio</button></form>
     <form onSubmit={e=>{e.preventDefault();const fd=new FormData(e.currentTarget);act(p.id,{action:"stock",quantity:Number(fd.get("stock"))})}}><label>Existencia<input name="stock" type="number" min="0" step="1" defaultValue={p.stockQuantity??0}/></label><button disabled={busy===p.id}>Guardar stock</button></form>
    </div>
    <div className="admin-product-footer"><button className="secondary" disabled={busy===p.id} onClick={()=>act(p.id,{action:"status",status:p.status==="publish"?"draft":"publish"})}>{p.status==="publish"?"Pasar a borrador":"Publicar"}</button><span>{feedback[p.id]||"WooCommerce es la fuente de verdad"}</span></div>
   </article>):<div className="admin-empty">No hay productos con este filtro.</div>}
  </section>
 </>;
}
