import {redirect} from "next/navigation";
import Link from "next/link";
import {currentCommercialActor} from "../../../lib/commercial/auth";
import {listWooProductsAdmin} from "../../../lib/commerce/woocommerce";
import AdminNav from "../AdminNav";
import ProductInventoryClient from "./ProductInventoryClient";
import "../admin.css";

export const dynamic="force-dynamic";
export const metadata={title:"Productos e inventario | NEXO Admin"};

export default async function Page({searchParams}:{searchParams?:Promise<{q?:string;estado?:string}>}){
 const actor=await currentCommercialActor();if(!actor||actor.role!=="admin")redirect("/admin/login");
 const params=searchParams?await searchParams:{};const q=String(params?.q||"").trim();const estado=String(params?.estado||"any");const status=["publish","draft"].includes(estado)?estado as "publish"|"draft":"any";
 const raw=await listWooProductsAdmin({search:q||undefined,status,perPage:100});
 const products=(Array.isArray(raw)?raw:[]).map((p:any)=>({id:Number(p.id),name:String(p.name||"Producto"),sku:String(p.sku||""),price:String(p.price||""),regular_price:String(p.regular_price||""),stock_quantity:p.stock_quantity===null?null:Number(p.stock_quantity),stock_status:String(p.stock_status||""),manage_stock:Boolean(p.manage_stock),status:String(p.status||""),images:Array.isArray(p.images)?p.images.slice(0,1).map((x:any)=>({src:String(x.src||"")})):[]}));
 return <main className="admin-shell"><header className="admin-top"><div><img src="/brand/nexo-logo-001g.png" alt="NEXO"/><span>ADMIN</span></div><Link href="/">Ver tienda</Link></header><AdminNav/><div className="admin-wrap"><section className="admin-hero compact"><span>CATÁLOGO</span><h1>Productos e inventario</h1><p>Precio, existencia y publicación. Los cambios se guardan directamente en WooCommerce.</p></section><form className="admin-product-search" action="/admin/productos"><input name="q" defaultValue={q} placeholder="Buscar producto o SKU"/><select name="estado" defaultValue={status}><option value="any">Todos</option><option value="publish">Publicados</option><option value="draft">Borradores</option></select><button type="submit">Buscar</button></form><section className="admin-panel"><div className="admin-heading"><div><span>RESULTADOS</span><h2>{products.length} productos</h2></div></div>{products.length?<ProductInventoryClient products={products}/>:<div className="admin-empty">No encontramos productos con esos filtros.</div>}</section></div></main>;
}