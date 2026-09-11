import {NextResponse} from "next/server";
import {currentCommercialActor} from "../../../../lib/commercial/auth";
import {getWooProduct,updateWooProduct} from "../../../../lib/commerce/woocommerce";

export async function POST(request:Request){
 const actor=await currentCommercialActor();
 if(!actor||actor.role!=="admin")return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const body=await request.json();
  const productId=Number(body.productId);
  const action=String(body.action||"");
  if(!Number.isInteger(productId)||productId<=0)throw new Error("Producto inválido.");
  const before=await getWooProduct(productId);
  if(action==="stock"){
   const quantity=Number(body.quantity);
   if(!Number.isInteger(quantity)||quantity<0||quantity>100000)throw new Error("Revisa la cantidad disponible.");
   const product=await updateWooProduct(productId,{manage_stock:true,stock_quantity:quantity,stock_status:quantity>0?"instock":"outofstock"});
   return NextResponse.json({ok:true,product:{id:product.id,stockQuantity:product.stock_quantity,stockStatus:product.stock_status,manageStock:product.manage_stock},before:{stockQuantity:before.stock_quantity,stockStatus:before.stock_status}});
  }
  if(action==="price"){
   const price=Number(body.price);
   if(!Number.isFinite(price)||price<0||price>1000000)throw new Error("Revisa el precio.");
   const product=await updateWooProduct(productId,{regular_price:price.toFixed(2)});
   return NextResponse.json({ok:true,product:{id:product.id,price:product.price,regularPrice:product.regular_price},before:{price:before.price,regularPrice:before.regular_price}});
  }
  if(action==="status"){
   const status=String(body.status||"");
   if(!["publish","draft"].includes(status))throw new Error("Estado inválido.");
   const product=await updateWooProduct(productId,{status});
   return NextResponse.json({ok:true,product:{id:product.id,status:product.status},before:{status:before.status}});
  }
  throw new Error("Acción no reconocida.");
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"No se pudo actualizar el producto."},{status:422});}
}
