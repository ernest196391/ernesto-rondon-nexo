const required = ["WOOCOMMERCE_URL", "WOOCOMMERCE_CONSUMER_KEY", "WOOCOMMERCE_CONSUMER_SECRET"];

if (required.some((key) => !process.env[key])) {
  console.log("[nexo-seed] WooCommerce no configurado; se omite el lote piloto.");
  process.exit(0);
}

const storeUrl = process.env.WOOCOMMERCE_URL.replace(/\/$/, "");
const imageBase = "https://raw.githubusercontent.com/ernest196391/ernesto-rondon-nexo/main/public/catalog/pilot";
const warning = "<p><strong>Producto sujeto a confirmación de disponibilidad.</strong> NEXO verifica existencia y precio antes de completar la compra.</p>";

const products = [
  {
    sku: "NEXO-PH43HDCE", name: "Televisor Philco PH43HDCE LED Full HD de 43 pulgadas", price: "659.00", category: "Televisores",
    image: "01-tv-philco-ph43hdce.webp", status: "publish",
    short: "Pantalla Philco de 43 pulgadas con Full HD, HDMI, USB 2.0 y Dolby Audio.",
    description: "<p>Una pantalla amplia y práctica para disfrutar películas, series y televisión con imagen Full HD. El modelo PH43HDCE incorpora reproducción multimedia mediante USB 2.0, conexión HDMI, contraste dinámico y Dolby Audio.</p><ul><li>43 pulgadas</li><li>Resolución Full HD</li><li>HDMI y USB 2.0</li><li>Dolby Audio</li><li>Diseño delgado</li></ul>",
  },
  {
    sku: "NEXO-DIGITAL-HD", name: "Decodificador Digital HD para televisión con HDMI y USB", price: "59.00", category: "Televisión digital",
    image: "02-decodificador-digital-hd.webp", status: "publish",
    short: "Receptor compacto para televisión digital con salida HDMI, USB y control remoto.",
    description: "<p>Equipo compacto para recibir televisión digital y reproducir contenido compatible. Incluye control remoto; la fotografía confirma salida HDMI y puerto USB frontal.</p><p>Marca, modelo y estándar exacto de señal pendientes de verificación.</p>",
  },
  {
    sku: "NEXO-PARKER-SPLIT", name: "Aire acondicionado split Parker con unidad interior y exterior", price: "1045.00", category: "Aires acondicionados",
    image: "03-aire-acondicionado-parker.webp", status: "publish",
    short: "Sistema split Parker compuesto por evaporadora interior y condensadora exterior.",
    description: "<p>Solución de climatización Parker para espacios residenciales o comerciales. El conjunto incluye unidad interior tipo split y unidad exterior.</p><p>Capacidad, voltaje y tecnología inverter pendientes de confirmación antes de completar la venta.</p>",
  },
  {
    sku: "NEXO-HB-BLENDER-WHITE", name: "Licuadora Hamilton Beach blanca de 5 velocidades", price: "50.00", category: "Licuadoras",
    image: "04-licuadora-hamilton-beach.webp", status: "publish",
    short: "Licuadora Hamilton Beach con jarra transparente, base blanca y cinco controles frontales.",
    description: "<p>Una licuadora sencilla para preparar batidos, jugos y mezclas cotidianas. Su jarra transparente permite controlar la textura y sus cinco controles frontales facilitan el uso.</p>",
  },
  {
    sku: "NEXO-GF-8816", name: "Ventilador de pedestal recargable GWELL GF-8816 de 16 pulgadas con panel solar", price: "90.00", category: "Ventiladores",
    image: "05-ventilador-gwell-gf-8816.webp", status: "publish",
    short: "Ventilador AC/DC de 16 pulgadas con panel solar, control remoto y dos bombillos LED.",
    description: "<p>Ventilación, iluminación y respaldo energético en un solo conjunto. Funciona con corriente AC/DC e incluye panel solar, control remoto y dos bombillos LED.</p><ul><li>Motor DC 12 V / 15 W</li><li>Batería sellada 12 V / 7 Ah</li><li>Panel solar 16 V / 10 W</li><li>Puerto USB 5 V / 1 A</li><li>Tres velocidades y oscilación</li><li>Hasta 6 horas en velocidad alta y más de 45 horas en baja, según proveedor</li></ul>",
  },
  {
    sku: "NEXO-RA123SL", name: "Ventilador solar recargable Royal RA123SL de 12 pulgadas con bombillos LED", price: "78.00", category: "Ventiladores",
    image: "06-ventilador-royal-ra123sl.webp", status: "publish",
    short: "Ventilador Royal recargable de 12 pulgadas con panel solar y dos bombillos LED.",
    description: "<p>Solución compacta para ventilación e iluminación de respaldo. El conjunto incluye ventilador Royal RA123SL, panel solar y dos bombillos LED.</p><p>Autonomía y capacidad de batería pendientes de validación.</p>",
  },
  {
    sku: "NEXO-BERA-BR150-BLUE", name: "Motocicleta BERA BR150 azul de uso urbano", price: "", category: "Motos",
    image: "07-moto-bera-br150.webp", status: "publish", stock: "outofstock",
    short: "Motocicleta urbana BERA BR150 azul con asiento doble, respaldo y parrilla trasera.",
    description: "<p>Motocicleta urbana BERA BR150 con asiento amplio, respaldo para pasajero, parrilla trasera y freno de disco delantero.</p><p>Precio, año, documentación técnica y garantía pendientes de verificación.</p>",
  },
  {
    sku: "NEXO-FRIDGE-WD", name: "Refrigerador de dos puertas plateado con dispensador de agua", price: "879.00", category: "Refrigeradores",
    image: "08-refrigerador-dispensador.webp", status: "publish",
    short: "Refrigerador plateado con congelador superior y dispensador frontal de agua.",
    description: "<p>Refrigerador de dos puertas con congelador superior, acabado plateado y dispensador frontal de agua.</p><p>Marca, modelo, capacidad y dimensiones pendientes de confirmación.</p>",
  },
];

async function woo(path, init = {}) {
  const url = new URL(`${storeUrl}/wp-json/wc/v3${path}`);
  url.searchParams.set("consumer_key", process.env.WOOCOMMERCE_CONSUMER_KEY);
  url.searchParams.set("consumer_secret", process.env.WOOCOMMERCE_CONSUMER_SECRET);
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${path} (${response.status}): ${JSON.stringify(body)?.slice(0, 300)}`);
  return body;
}

async function categoryId(name) {
  const found = await woo(`/products/categories?search=${encodeURIComponent(name)}&per_page=20`);
  const exact = found.find((category) => category.name.toLowerCase() === name.toLowerCase());
  if (exact) return exact.id;
  const created = await woo("/products/categories", { method: "POST", body: JSON.stringify({ name }) });
  return created.id;
}

async function seed() {
  const categoryCache = new Map();
  for (const product of products) {
    const existing = await woo(`/products?sku=${encodeURIComponent(product.sku)}&status=any`);
    if (existing.length) {
      console.log(`[nexo-seed] ${product.sku} ya existe (${existing[0].id}); se conserva.`);
      continue;
    }
    if (!categoryCache.has(product.category)) categoryCache.set(product.category, await categoryId(product.category));
    const payload = {
      name: product.name, type: "simple", status: product.status, sku: product.sku,
      regular_price: product.price, short_description: product.short,
      description: product.description + warning, manage_stock: false,
      stock_status: product.stock || "instock", categories: [{ id: categoryCache.get(product.category) }],
      images: [{ src: `${imageBase}/${product.image}`, alt: product.name }],
      meta_data: [
        { key: "nexo_pilot_batch", value: "2026-08-26-eight-products" },
        { key: "nexo_availability_confirmation", value: "required" },
        { key: "nexo_verified_at", value: new Date().toISOString() },
      ],
    };
    const created = await woo("/products", { method: "POST", body: JSON.stringify(payload) });
    console.log(`[nexo-seed] creado ${product.sku} -> ${created.id} ${created.permalink}`);
  }
}

seed().catch((error) => {
  console.error("[nexo-seed] error:", error instanceof Error ? error.message : error);
  process.exitCode = 0;
});
