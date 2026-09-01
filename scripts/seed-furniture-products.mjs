const required = ["WOOCOMMERCE_URL", "WOOCOMMERCE_CONSUMER_KEY", "WOOCOMMERCE_CONSUMER_SECRET"];

if (required.some((key) => !process.env[key])) {
  console.log("[nexo-furniture-seed] WooCommerce no configurado; se omite el lote.");
  process.exit(0);
}

const storeUrl = process.env.WOOCOMMERCE_URL.replace(/\/$/, "");
const batch = "2026-09-01-furniture-v1";
const warning = "<p><strong>Disponibilidad sujeta a confirmación.</strong> NEXO confirma existencia, color y coordinación de entrega antes de completar la compra.</p>";

const shared7310 = `<p>La línea <strong>Modelo 7310</strong> combina una estructura reforzada con un asiento diseñado para conservar la comodidad y la forma durante el uso cotidiano.</p><h2>Beneficios</h2><ul><li>Espuma de densidad superior para brindar soporte y durabilidad.</li><li>Cojines cómodos elaborados con espuma sensible.</li><li>Asiento con resorte sinuoso de acero de doble enlace para mayor estabilidad y resistencia.</li><li>Lados y parte superior reforzados con madera contrachapada y espuma.</li><li>Resorte adicional en el borde para reforzar el asiento y reducir el desplazamiento hacia el brazo.</li></ul><h2>Especificaciones</h2><ul><li><strong>Modelo:</strong> 7310</li><li><strong>Tipo:</strong> Mueble tapizado</li><li><strong>Construcción del asiento:</strong> Resorte sinuoso de acero de doble enlace</li><li><strong>Refuerzo:</strong> Madera contrachapada y espuma</li><li><strong>Entrega:</strong> Tarifa de Mensajería #2</li><li><strong>Recogida:</strong> Disponible en tienda</li></ul>`;

const products = [
  { sku:"NEXO-M7310-1P", slug:"mueble-modelo-7310-butaca", name:"Muebles Modelo 7310 – Butaca de 1 plaza", price:"530.00", image:"https://img.pictureserver.net/pic_storage/pic/e1/9a/undef_src_sa_picid_720736_x_3500_type_color_image.jpg?ver=19", short:"Butaca Modelo 7310 de 1 plaza con espuma de alta densidad, estructura reforzada y asiento con resortes de acero.", description:shared7310 },
  { sku:"NEXO-M7310-2P", slug:"mueble-modelo-7310-sofa-2-plazas", name:"Muebles Modelo 7310 – Sofá de 2 plazas", price:"755.00", image:"https://media.falabella.com/sodimacPE/4212517_01/public", short:"Sofá Modelo 7310 de 2 plazas con espuma de alta densidad, refuerzos interiores y asiento resistente.", description:shared7310 },
  { sku:"NEXO-M7310-3P", slug:"mueble-modelo-7310-sofa-3-plazas", name:"Muebles Modelo 7310 – Sofá de 3 plazas", price:"997.00", image:"https://www.centrohogarsanchez.es/media/catalog/product/cache/207e23213cf636ccdef205098cf3c8a3/0/1/01137001011479_u3ttufxf8goxvika.webp", short:"Sofá Modelo 7310 de 3 plazas con espuma de alta densidad, estructura reforzada y asiento de resortes.", description:shared7310 },
  { sku:"NEXO-BUTACA-ABRAZO", slug:"butaca-estilo-abrazo-de-mama", name:"Butaca Estilo Abrazo de Mamá", price:"570.65", image:"https://img2.elyerromenu.com/images/mixora/butaca-estilo-abrazo-de-mama/img.webp", short:"Butaca individual de diseño envolvente y tapizado cómodo, concebida para una sensación acogedora.", description:"<p>Una butaca de presencia original, con formas redondeadas y diseño envolvente tipo abrazo. Funciona como asiento protagonista en sala, dormitorio o rincón de lectura.</p><h2>Beneficios</h2><ul><li>Diseño envolvente y acogedor.</li><li>Formato individual para crear un rincón de descanso.</li><li>Estética distintiva para ambientes modernos.</li></ul><h2>Especificaciones</h2><ul><li><strong>Tipo:</strong> Butaca individual tapizada</li><li><strong>Estilo:</strong> Envolvente tipo abrazo</li><li><strong>Entrega:</strong> Tarifa de Mensajería #2</li><li><strong>Recogida:</strong> Disponible en tienda</li></ul>" },
  { sku:"NEXO-BUTACA-AZUL-GORDO", slug:"butaca-azul-estilo-gordo", name:"Butaca Azul Estilo Gordo", price:"593.10", image:"https://samonamestaj.com/wp-content/uploads/2024/01/fotelja-mika-blue.jpg", short:"Butaca azul amplia y mullida, ideal para descansar y aportar color a salas o dormitorios.", description:"<p>Butaca individual de formato amplio, volumen mullido y tapizado azul. Su presencia generosa está pensada para crear un asiento cómodo y llamativo.</p><h2>Beneficios</h2><ul><li>Asiento amplio para una postura relajada.</li><li>Diseño mullido de apariencia confortable.</li><li>Color azul que aporta personalidad al ambiente.</li></ul><h2>Especificaciones</h2><ul><li><strong>Tipo:</strong> Butaca individual tapizada</li><li><strong>Color:</strong> Azul</li><li><strong>Estilo:</strong> Amplio y mullido</li><li><strong>Entrega:</strong> Tarifa de Mensajería #2</li><li><strong>Recogida:</strong> Disponible en tienda</li></ul>" },
  { sku:"NEXO-BUTACA-AMARILLA", slug:"butaca-amarilla", name:"Butaca Amarilla", price:"487.65", image:"https://home.ripley.cl/store/Attachment/WOP/D360/2000400644185/2000400644185_2.jpg", short:"Butaca individual tapizada en amarillo, compacta y vistosa para sala, dormitorio o espacio de lectura.", description:"<p>Butaca individual tapizada en color amarillo, adecuada para sumar un punto de color y un asiento cómodo en espacios residenciales.</p><h2>Beneficios</h2><ul><li>Formato individual fácil de integrar.</li><li>Color amarillo para ambientes cálidos y modernos.</li><li>Adecuada para sala, dormitorio o rincón de lectura.</li></ul><h2>Especificaciones</h2><ul><li><strong>Tipo:</strong> Butaca individual tapizada</li><li><strong>Color:</strong> Amarillo</li><li><strong>Entrega:</strong> Tarifa de Mensajería #2</li><li><strong>Recogida:</strong> Disponible en tienda</li></ul>" },
  { sku:"NEXO-SOFA-3P-MODULAR", slug:"mueble-sofa-3-plazas", name:"Mueble de 3 Plazas", price:"860.50", image:"https://static.ufurnish.com/assets/product-images/swyft/model03-conf-03-epa/eco-velvet-3-seater-modular-sofa-from-swyft-paprika-model-03-quick-delivery-7589c56f.jpg?w=1080", short:"Sofá tapizado de 3 plazas con diseño cómodo y resistente para el uso cotidiano.", description:"<p>Sofá de tres plazas pensado como asiento principal de la sala. Su diseño tapizado ofrece una solución amplia y práctica para compartir.</p><h2>Beneficios</h2><ul><li>Capacidad para tres personas.</li><li>Diseño versátil para salas familiares.</li><li>Tapizado de apariencia cómoda y resistente.</li></ul><h2>Especificaciones</h2><ul><li><strong>Tipo:</strong> Sofá tapizado</li><li><strong>Capacidad:</strong> 3 plazas</li><li><strong>Entrega:</strong> Tarifa de Mensajería #2</li><li><strong>Recogida:</strong> Disponible en tienda</li></ul>" },
  { sku:"NEXO-BUTACA-BLANCA-MIN", slug:"butaca-blanca-minimalista", name:"Butaca Blanca Estilo Minimalista", price:"360.15", image:"https://www.schooloutlet.com/cdn/shop/files/jaxx-jax-19432902-540662.jpg?v=1720423588", short:"Butaca blanca de líneas simples y estilo minimalista para ambientes contemporáneos.", description:"<p>Butaca individual en color blanco con líneas limpias y una presencia visual ligera. Es una opción versátil para interiores minimalistas y contemporáneos.</p><h2>Beneficios</h2><ul><li>Diseño sencillo que combina con distintos estilos.</li><li>Color blanco que aporta luminosidad visual.</li><li>Formato individual para sala, dormitorio o recibidor.</li></ul><h2>Especificaciones</h2><ul><li><strong>Tipo:</strong> Butaca individual tapizada</li><li><strong>Color:</strong> Blanco</li><li><strong>Estilo:</strong> Minimalista</li><li><strong>Entrega:</strong> Tarifa de Mensajería #2</li><li><strong>Recogida:</strong> Disponible en tienda</li></ul>" },
  { sku:"NEXO-SOFA-2P", slug:"mueble-sofa-2-plazas", name:"Mueble de 2 Plazas", price:"710.50", image:"https://www.secretsofa.com.au/cdn/shop/files/Marie_2_Seat_VM_1.jpg?v=1757391520&width=1500", short:"Sofá tapizado de 2 plazas, cómodo y resistente, adecuado para salas y espacios compactos.", description:"<p>Sofá de dos plazas que ofrece una solución práctica para compartir sin ocupar el espacio de un mueble de mayor tamaño.</p><h2>Beneficios</h2><ul><li>Capacidad para dos personas.</li><li>Formato conveniente para espacios medianos o compactos.</li><li>Tapizado de apariencia cómoda y resistente.</li></ul><h2>Especificaciones</h2><ul><li><strong>Tipo:</strong> Sofá tapizado</li><li><strong>Capacidad:</strong> 2 plazas</li><li><strong>Entrega:</strong> Tarifa de Mensajería #2</li><li><strong>Recogida:</strong> Disponible en tienda</li></ul>" },
  { sku:"NEXO-BUTACA-COMPACTA", slug:"butaca-individual-compacta", name:"Butaca Individual Compacta", price:"319.15", image:"https://res.litfad.net/site/img/item/2022/09/29/5895331/1200x1200.jpg", short:"Butaca individual tapizada de diseño compacto, práctica para espacios pequeños o rincones de descanso.", description:"<p>Butaca individual de formato compacto para sumar un asiento adicional sin recargar el ambiente.</p><h2>Beneficios</h2><ul><li>Formato compacto y fácil de ubicar.</li><li>Útil como asiento auxiliar.</li><li>Adecuada para salas, dormitorios o rincones de lectura.</li></ul><h2>Especificaciones</h2><ul><li><strong>Tipo:</strong> Butaca individual tapizada</li><li><strong>Formato:</strong> Compacto</li><li><strong>Entrega:</strong> Tarifa de Mensajería #2</li><li><strong>Recogida:</strong> Disponible en tienda</li></ul>" }
];

async function woo(path, init = {}) {
  const url = new URL(`${storeUrl}/wp-json/wc/v3${path}`);
  url.searchParams.set("consumer_key", process.env.WOOCOMMERCE_CONSUMER_KEY);
  url.searchParams.set("consumer_secret", process.env.WOOCOMMERCE_CONSUMER_SECRET);
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) }, signal: AbortSignal.timeout(90000), cache:"no-store" });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${path} (${response.status}): ${JSON.stringify(body)?.slice(0, 500)}`);
  return body;
}

async function categoryId(name) {
  const found = await woo(`/products/categories?search=${encodeURIComponent(name)}&per_page=20`);
  const exact = found.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (exact) return exact.id;
  return (await woo("/products/categories", { method:"POST", body:JSON.stringify({name, slug:"muebles"}) })).id;
}

function valid(product) {
  const plain = (value) => String(value || "").replace(/<[^>]+>/g, "").trim();
  return plain(product.short).length >= 50 && plain(product.description).length >= 180 && /<h2>Especificaciones<\/h2>/i.test(product.description) && product.price && product.image;
}

async function seed() {
  const category = await categoryId("Muebles");
  for (const product of products) {
    try {
      if (!valid(product)) throw new Error("Ficha rechazada por control editorial");
      const found = await woo(`/products?sku=${encodeURIComponent(product.sku)}&status=any`);
      const payload = {
        name:product.name, slug:product.slug, type:"simple", status:"publish", sku:product.sku,
        regular_price:product.price, short_description:product.short, description:product.description + warning,
        manage_stock:false, stock_status:"instock", categories:[{id:category}],
        images:[{src:product.image, alt:product.name}],
        attributes:[
          {name:"Entrega", visible:true, variation:false, options:["Tarifa de Mensajería #2"]},
          {name:"Recogida", visible:true, variation:false, options:["Disponible en tienda"]}
        ],
        meta_data:[
          {key:"nexo_catalog_batch",value:batch},
          {key:"nexo_availability_confirmation",value:"required"},
          {key:"nexo_delivery_tariff",value:"2"},
          {key:"nexo_store_pickup",value:"yes"},
          {key:"nexo_description_validated",value:"yes"},
          {key:"nexo_verified_at",value:new Date().toISOString()}
        ]
      };
      const saved = found[0]
        ? await woo(`/products/${found[0].id}`, {method:"PUT", body:JSON.stringify(payload)})
        : await woo("/products", {method:"POST", body:JSON.stringify(payload)});
      console.log(`[nexo-furniture-seed] OK ${product.sku} -> ${saved.id} ${saved.permalink}`);
    } catch (error) {
      console.error(`[nexo-furniture-seed] ERROR ${product.sku}:`, error instanceof Error ? error.message : error);
    }
  }
}

seed().catch((error) => {
  console.error("[nexo-furniture-seed] error:", error instanceof Error ? error.message : error);
  process.exitCode = 0;
});
