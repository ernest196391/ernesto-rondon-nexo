import {redirect} from "next/navigation";
import Link from "next/link";
import {currentCommercialActor} from "../../../../lib/commercial/auth";
import {getWooProduct,getWooProductVariationsAdmin} from "../../../../lib/commerce/woocommerce";
import AdminNav from "../../AdminNav";
import VariationInventoryClient from "./VariationInventoryClient";
import "../../admin.css";

export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{id:string}>}){
 const actor=await currentCommercialActor();if(!actor||actor.role!=="admin")redirect("/admin/login");
 const {id}=await params;const productId=Number(id);if(!Number.isInteger(productId)||productId<=0)redirect("/admin/productos");
 const [product,raw]=await Promise.all([getWooProduct(productId),getWooProductVariationsAdmin(productId)]);
 const variations=(Array.isArray(raw)?raw:[]).map((v:any)=>({id:Number(v.id),sku:String(v.sku||""),price:String(v.price||""),regularPrice:String(v.regular_price||""),stockQuantity:v.stock_quantity===null?null:Number(v.stock_quantity),stockStatus:String(v.stock_status||""),manageStock:Boolean(v.manage_stock),status:String(v.status||""),label:Array.isArray(v.attributes)&&v.attributes.length?v.attributes.map((a:any)=>`${a.name}: ${a.option}`).join(" · "):`Variante #${v.id}`,image:String(v.image?.src||product.images?.[0]?.src||"")}));
 return <main className="admin-shell"><header className="admin-top"><div><img src="/brand/nexo-logo-001g.png" alt="NEXO"/><span>ADMIN</span></div><Link href="/">Ver tienda</Link></header><AdminNav/><div className="admin-wrap"><Link className="admin-back" href="/admin/productos">← Productos</Link><section className="admin-hero compact"><span>VARIANTES</span><h1>{product.name}</h1><p>Gestiona precio, existencia y publicación de cada opción sin alterar las demás.</p></section><section className="admin-panel"><div className="admin-heading"><div><span>OPCIONES</span><h2>{variations.length} variantes</h2></div></div>{variations.length?<VariationInventoryClient productId={productId} variations={variations}/>:<div className="admin-empty">Este producto no tiene variantes configuradas.</div>}</section></div></main>;
}