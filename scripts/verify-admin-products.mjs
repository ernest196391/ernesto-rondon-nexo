const run=String(process.env.NEXO_PRODUCT_ADMIN_SMOKE||"").trim();
if(!run)process.exit(0);
const store=String(process.env.WOOCOMMERCE_URL||"").replace(/\/$/,"");
const key=process.env.WOOCOMMERCE_CONSUMER_KEY||"";
const secret=process.env.WOOCOMMERCE_CONSUMER_SECRET||"";
if(!store||!key||!secret){console.error("NEXO_PRODUCT_ADMIN_SMOKE_RESULT",JSON.stringify({run,status:"failed",error:"WooCommerce credentials missing"}));process.exitCode=1;}else{
 const woo=async(path,init={})=>{const u=new URL(`${store}/wp-json/wc/v3${path}`);u.searchParams.set("consumer_key",key);u.searchParams.set("consumer_secret",secret);const r=await fetch(u,{...init,headers:{"Content-Type":"application/json",Accept:"application/json",...(init.headers||{})}});const data=await r.json();if(!r.ok)throw new Error(`Woo ${path} ${r.status}: ${JSON.stringify(data).slice(0,250)}`);return data;};
 try{
  const products=await woo("/products?status=publish&per_page=25&orderby=modified&order=desc");
  if(!Array.isArray(products)||!products.length)throw new Error("No published products available");
  const simple=products.find(p=>p.type==="simple"&&Number(p.id)>0&&String(p.regular_price||p.price||"").trim())||products.find(p=>p.type==="simple"&&Number(p.id)>0);
  if(!simple)throw new Error("No simple product available");
  const before={id:Number(simple.id),status:String(simple.status),regular_price:String(simple.regular_price||""),manage_stock:Boolean(simple.manage_stock),stock_quantity:simple.stock_quantity==null?null:Number(simple.stock_quantity),stock_status:String(simple.stock_status||"")};
  const same={status:before.status};
  if(before.regular_price)same.regular_price=before.regular_price;
  if(before.manage_stock&&before.stock_quantity!==null){same.manage_stock=true;same.stock_quantity=before.stock_quantity;same.stock_status=before.stock_status;}
  const updated=await woo(`/products/${before.id}`,{method:"PUT",body:JSON.stringify(same)});
  const productOk=Number(updated.id)===before.id&&String(updated.status)===before.status&&(!before.regular_price||String(updated.regular_price)===before.regular_price);
  let variation={tested:false,ok:true};
  const variable=products.find(p=>p.type==="variable"&&Number(p.id)>0);
  if(variable){const vars=await woo(`/products/${variable.id}/variations?status=any&per_page=100`);const v=Array.isArray(vars)?vars.find(x=>Number(x.id)>0):null;if(v){variation.tested=true;const input={status:String(v.status)};if(String(v.regular_price||""))input.regular_price=String(v.regular_price);if(v.manage_stock&&v.stock_quantity!=null){input.manage_stock=true;input.stock_quantity=Number(v.stock_quantity);input.stock_status=String(v.stock_status);}const vu=await woo(`/products/${variable.id}/variations/${v.id}`,{method:"PUT",body:JSON.stringify(input)});variation={tested:true,ok:Number(vu.id)===Number(v.id)&&String(vu.status)===String(v.status),productId:Number(variable.id),variationId:Number(v.id)};}}
  const result={run,status:productOk&&variation.ok?"passed":"failed",product:{id:before.id,ok:productOk},variation};
  console.log("NEXO_PRODUCT_ADMIN_SMOKE_RESULT",JSON.stringify(result));if(result.status!=="passed")process.exitCode=1;
 }catch(error){console.error("NEXO_PRODUCT_ADMIN_SMOKE_RESULT",JSON.stringify({run,status:"failed",error:error instanceof Error?error.message:String(error)}));process.exitCode=1;}
}
