const required = ["WOOCOMMERCE_URL", "WOOCOMMERCE_CONSUMER_KEY", "WOOCOMMERCE_CONSUMER_SECRET"];

if (required.some((key) => !process.env[key])) {
  console.log("[nexo-gestora-seed] WooCommerce no configurado; se omite el lote.");
  process.exit(0);
}

const storeUrl = process.env.WOOCOMMERCE_URL.replace(/\/$/, "");
const warning = "<p><strong>Producto sujeto a confirmación de disponibilidad.</strong> NEXO verifica existencia y precio antes de completar la compra.</p>";

const products = [
  {
    sku: "NEXO-BOVIET-BVM8611M-620",
    name: "Panel solar Boviet bifacial N-Type de 620 W doble vidrio",
    price: "335.00",
    category: "Energía solar",
    imageSrc: "https://ojfpsksgciejofuktpbz.supabase.co/storage/v1/object/public/product-images/boviet-620w-solar-panel-2ed7525a-00-primary.png",
    short: "Panel Boviet de 620 W, bifacial y doble vidrio, modelo BVM8611M-620R-H-HC-BF-DG, con 132 medias celdas.",
    description: "<p>Panel fotovoltaico Boviet de alta potencia para sistemas solares residenciales, comerciales u off-grid compatibles. La placa física de la unidad NEXO confirma el modelo <strong>BVM8611M-620R-H-HC-BF-DG</strong>, potencia nominal de <strong>620 W</strong>, construcción bifacial y doble vidrio.</p><ul><li>Potencia máxima (Pmax): 620 W</li><li>Voltaje a máxima potencia (Vmp): 41.54 V</li><li>Corriente a máxima potencia (Imp): 14.93 A</li><li>Voltaje de circuito abierto (Voc): 48.65 V</li><li>Corriente de cortocircuito (Isc): 15.94 A</li><li>Voltaje máximo del sistema: 1500 VDC</li><li>Fusible máximo en serie: 30 A</li><li>Temperatura de operación: -40 °C a +85 °C</li><li>132 medias celdas; tecnología bifacial de doble vidrio</li></ul><p><strong>Compatibilidad:</strong> antes de conectarlo a una estación de energía, inversor o controlador debe comprobarse que la entrada solar admita el Voc, Vmp, Isc e Imp del panel.</p><p>La unidad fotografiada es de 620 W; NEXO no la publica como 625 W porque la placa física confirma 620 W.</p>",
    sourceCost: "",
    modelConfidence: "high",
  },
  {
    sku: "NEXO-ROYAL-REG202V",
    name: "Cocina de gas Royal REG202V de 2 hornillas con encendido automático",
    price: "64.80",
    category: "Cocinas y hornos",
    imageSrc: "https://apimedias.treew.com/imgproducts/thumbs/d582273c-584a-4c66-b7bf-05f79a7e5fa7.jpg",
    short: "Cocina de mesa Royal REG202V para gas LPG, con 2 hornillas, encendido automático y cubierta de vidrio templado resistente al calor.",
    description: "<p>Cocina compacta de sobremesa <strong>Royal REG202V</strong>, pensada para espacios donde se necesita una solución sencilla y práctica de cocción a gas.</p><ul><li>2 hornillas</li><li>Encendido automático</li><li>Compatible con gas LPG</li><li>Estructura de metal</li><li>Superficie de vidrio templado resistente al calor</li><li>Controles independientes</li><li>Dimensiones de referencia: 710 × 375 × 90 mm</li><li>Garantía comercial visible en la unidad fotografiada: 3 meses</li></ul>",
    sourceCost: "39.80",
    modelConfidence: "high",
  },
  {
    sku: "NEXO-KONFORT-135X190",
    name: "Colchón KONFORT 135 × 190 cm",
    price: "305.00",
    category: "Colchones",
    imageSrc: "https://pub-768195fefb80411aa63fe4f44e4bee7b.r2.dev/12565/00af3c334176d057d96f774adfa42801.jpg",
    short: "Colchón KONFORT de medida nominal 135 × 190 cm, con acabado acolchado y formato camero/full.",
    description: "<p>Colchón <strong>KONFORT</strong> de medida nominal <strong>135 × 190 cm</strong>, pensado para cama camero/full. La marca KONFORT ofrece varias líneas con sistemas de muelles, capas de espuma y acabados acolchados.</p><p>La investigación de NEXO encontró una coincidencia fuerte con la línea Gran Antillas en esta medida; la línea exacta de la unidad disponible se confirma mediante etiqueta física antes de completar la venta.</p>",
    sourceCost: "280.00",
    modelConfidence: "medium",
  },
  {
    sku: "NEXO-KONFORT-120X190",
    name: "Colchón KONFORT 120 × 190 cm",
    price: "410.00",
    category: "Colchones",
    imageSrc: "https://konfortienda.com/wp-content/uploads/2024/07/GH-hotelero-scaled.jpg",
    short: "Colchón KONFORT de medida nominal 120 × 190 cm, formato 3/4, con acabado acolchado.",
    description: "<p>Colchón <strong>KONFORT</strong> de medida nominal <strong>120 × 190 cm</strong>, adecuado para camas de 3/4. La investigación de NEXO encontró una coincidencia muy fuerte de medida y precio observado con la línea Gran Habana 120 × 190.</p><p>La línea exacta de la unidad disponible se confirma mediante etiqueta física antes de completar la venta; por eso NEXO evita atribuir características internas no verificadas a la unidad.</p>",
    sourceCost: "385.00",
    modelConfidence: "medium",
  },
];

async function woo(path, init = {}) {
  const url = new URL(`${storeUrl}/wp-json/wc/v3${path}`);
  url.searchParams.set("consumer_key", process.env.WOOCOMMERCE_CONSUMER_KEY);
  url.searchParams.set("consumer_secret", process.env.WOOCOMMERCE_CONSUMER_SECRET);
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${path} (${response.status}): ${JSON.stringify(body)?.slice(0, 500)}`);
  return body;
}

async function categoryId(name) {
  const found = await woo(`/products/categories?search=${encodeURIComponent(name)}&per_page=20`);
  const exact = found.find((category) => category.name.toLowerCase() === name.toLowerCase());
  if (exact) return exact.id;
  const created = await woo("/products/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return created.id;
}

async function seedProduct(product, categoryIdValue) {
  const payload = {
    name: product.name,
    type: "simple",
    status: "publish",
    sku: product.sku,
    regular_price: product.price,
    short_description: product.short,
    description: product.description + warning,
    manage_stock: false,
    stock_status: "instock",
    categories: [{ id: categoryIdValue }],
    images: [{ src: product.imageSrc, alt: product.name }],
    meta_data: [
      { key: "nexo_catalog_batch", value: "2026-08-27-gestora-products" },
      { key: "nexo_availability_confirmation", value: "required" },
      { key: "nexo_gestora_commission_usd", value: "10.00" },
      { key: "nexo_source_cost_observed_usd", value: product.sourceCost },
      { key: "nexo_model_confidence", value: product.modelConfidence },
      { key: "nexo_verified_at", value: new Date().toISOString() },
    ],
  };
  return woo("/products", { method: "POST", body: JSON.stringify(payload) });
}

async function seed() {
  const categoryCache = new Map();
  for (const product of products) {
    try {
      const existing = await woo(`/products?sku=${encodeURIComponent(product.sku)}&status=any`);
      if (existing.length) {
        console.log(`[nexo-gestora-seed] ${product.sku} ya existe (${existing[0].id}); se conserva.`);
        continue;
      }
      if (!categoryCache.has(product.category)) {
        categoryCache.set(product.category, await categoryId(product.category));
      }
      const created = await seedProduct(product, categoryCache.get(product.category));
      console.log(`[nexo-gestora-seed] creado ${product.sku} -> ${created.id} ${created.permalink}`);
    } catch (error) {
      console.error(`[nexo-gestora-seed] ${product.sku}:`, error instanceof Error ? error.message : error);
    }
  }
}

seed().catch((error) => {
  console.error("[nexo-gestora-seed] error:", error instanceof Error ? error.message : error);
  process.exitCode = 0;
});
