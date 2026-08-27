const required = ["WOOCOMMERCE_URL", "WOOCOMMERCE_CONSUMER_KEY", "WOOCOMMERCE_CONSUMER_SECRET"];

if (required.some((key) => !process.env[key])) {
  console.log("[nexo-gestora-seed] WooCommerce no configurado; se omite el lote.");
  process.exit(0);
}

const storeUrl = process.env.WOOCOMMERCE_URL.replace(/\/$/, "");
const imageBase = "https://raw.githubusercontent.com/ernest196391/ernesto-rondon-nexo/main/public/catalog/gestora";
const warning = "<p><strong>Producto sujeto a confirmación de disponibilidad.</strong> NEXO verifica existencia y precio antes de completar la compra.</p>";
const cleanImageMetaKey = "nexo_clean_primary_image_v1";

const products = [
  {
    sku: "NEXO-BOVIET-BVM8611M-620",
    slug: "panel-solar-boviet-bifacial-620w",
    name: "Panel solar Boviet bifacial N-Type 620 W doble vidrio",
    price: "335.00",
    category: "Energía solar",
    image: "01-panel-boviet-bifacial-620w-ecommerce.webp",
    short: "Panel solar Boviet bifacial N-Type de 620 W, doble vidrio y 132 medias celdas. Alta potencia para sistemas solares compatibles.",
    description: "<p>Panel fotovoltaico <strong>Boviet BVM8611M-620R-H-HC-BF-DG</strong> de alta potencia, pensado para instalaciones solares residenciales, comerciales y sistemas off-grid compatibles.</p><h2>Características verificadas</h2><ul><li>Potencia nominal: <strong>620 W</strong></li><li>Tecnología bifacial N-Type y doble vidrio</li><li>132 medias celdas</li><li>Vmp: 41.54 V</li><li>Imp: 14.93 A</li><li>Voc: 48.65 V</li><li>Isc: 15.94 A</li><li>Voltaje máximo del sistema: 1500 VDC</li><li>Fusible máximo en serie: 30 A</li><li>Temperatura de operación: -40 °C a +85 °C</li></ul><h2>Antes de conectarlo</h2><p>Comprueba que la entrada solar de tu inversor, controlador o estación de energía admita el Voc, Vmp, Isc e Imp del panel.</p>",
    sourceCost: "",
    modelConfidence: "high",
    seoTitle: "Panel solar Boviet bifacial 620 W | NEXO",
    seoDescription: "Panel solar Boviet bifacial N-Type de 620 W y doble vidrio. Consulta disponibilidad en NEXO.",
  },
  {
    sku: "NEXO-ROYAL-REG202V",
    slug: "cocina-gas-royal-reg202v-2-hornillas",
    name: "Cocina de gas Royal REG202V de 2 hornillas",
    price: "64.80",
    category: "Cocinas y hornos",
    image: "02-cocina-royal-reg202v-ecommerce.webp",
    short: "Cocina de mesa Royal REG202V de 2 hornillas, encendido automático y superficie de vidrio templado.",
    description: "<p>La <strong>Royal REG202V</strong> es una cocina compacta de sobremesa con dos hornillas y controles independientes, adecuada para hogares que buscan una solución sencilla de cocción a gas.</p><h2>Características</h2><ul><li>2 hornillas</li><li>Encendido automático</li><li>Compatible con gas LPG</li><li>Controles independientes</li><li>Estructura metálica</li><li>Superficie de vidrio templado resistente al calor</li><li>Dimensiones de referencia: 710 × 375 × 90 mm</li><li>Garantía comercial visible en la unidad fotografiada: 3 meses</li></ul>",
    sourceCost: "39.80",
    modelConfidence: "high",
    seoTitle: "Cocina Royal REG202V de 2 hornillas | NEXO",
    seoDescription: "Cocina de gas Royal REG202V con 2 hornillas y encendido automático. Precio 64.80 USD, sujeto a disponibilidad.",
  },
  {
    sku: "NEXO-KONFORT-135X190",
    slug: "colchon-konfort-135x190",
    name: "Colchón KONFORT 135 × 190 cm",
    price: "305.00",
    category: "Colchones",
    image: "03-colchon-konfort-135x190-ecommerce.webp",
    short: "Colchón KONFORT de 135 × 190 cm con acabado acolchado. La línea exacta se confirma antes de completar la compra.",
    description: "<p>Colchón <strong>KONFORT</strong> de medida nominal <strong>135 × 190 cm</strong>, pensado para cama camero/full.</p><h2>Qué confirma NEXO</h2><ul><li>Marca: KONFORT</li><li>Medida nominal: 135 × 190 cm</li><li>Acabado acolchado</li></ul><p>La investigación encontró una coincidencia fuerte con líneas KONFORT de muelles y capas de espuma, pero la línea exacta de la unidad disponible se confirma mediante etiqueta física antes de completar la venta.</p>",
    sourceCost: "280.00",
    modelConfidence: "medium",
    seoTitle: "Colchón KONFORT 135 × 190 cm | NEXO",
    seoDescription: "Colchón KONFORT 135 × 190 cm. Precio 305 USD, sujeto a confirmación de disponibilidad y línea exacta.",
  },
  {
    sku: "NEXO-KONFORT-120X190",
    slug: "colchon-konfort-120x190",
    name: "Colchón KONFORT 120 × 190 cm",
    price: "410.00",
    category: "Colchones",
    image: "03-colchon-konfort-135x190-ecommerce.webp",
    short: "Colchón KONFORT de 120 × 190 cm, formato 3/4, con acabado acolchado. Línea exacta por confirmar.",
    description: "<p>Colchón <strong>KONFORT</strong> de medida nominal <strong>120 × 190 cm</strong>, adecuado para cama de 3/4.</p><h2>Qué confirma NEXO</h2><ul><li>Marca: KONFORT</li><li>Medida nominal: 120 × 190 cm</li><li>Acabado acolchado</li></ul><p>La investigación encontró una coincidencia fuerte con la línea Gran Habana 120 × 190, pero NEXO confirma la línea exacta mediante etiqueta física antes de completar la venta.</p>",
    sourceCost: "385.00",
    modelConfidence: "medium",
    seoTitle: "Colchón KONFORT 120 × 190 cm | NEXO",
    seoDescription: "Colchón KONFORT 120 × 190 cm. Precio 410 USD, sujeto a confirmación de disponibilidad y línea exacta.",
  },
];

async function woo(path, init = {}) {
  const url = new URL(`${storeUrl}/wp-json/wc/v3${path}`);
  url.searchParams.set("consumer_key", process.env.WOOCOMMERCE_CONSUMER_KEY);
  url.searchParams.set("consumer_secret", process.env.WOOCOMMERCE_CONSUMER_SECRET);
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(90_000),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${path} (${response.status}): ${JSON.stringify(body)?.slice(0, 500)}`);
  return body;
}

async function categoryId(name) {
  const found = await woo(`/products/categories?search=${encodeURIComponent(name)}&per_page=20`);
  const exact = found.find((category) => category.name.toLowerCase() === name.toLowerCase());
  if (exact) return exact.id;
  const created = await woo("/products/categories", { method: "POST", body: JSON.stringify({ name }) });
  return created.id;
}

function metaValue(product, key) {
  return product?.meta_data?.find((item) => item.key === key)?.value;
}

function payloadFor(product, categoryIdValue, includeImage) {
  const meta = [
    { key: "nexo_catalog_batch", value: "2026-08-27-gestora-products" },
    { key: "nexo_availability_confirmation", value: "required" },
    { key: "nexo_gestora_commission_usd", value: "10.00" },
    { key: "nexo_source_cost_observed_usd", value: product.sourceCost },
    { key: "nexo_model_confidence", value: product.modelConfidence },
    { key: "nexo_verified_at", value: new Date().toISOString() },
    { key: "_yoast_wpseo_title", value: product.seoTitle },
    { key: "_yoast_wpseo_metadesc", value: product.seoDescription },
  ];
  if (includeImage) meta.push({ key: cleanImageMetaKey, value: "2026-08-27-v1" });

  return {
    name: product.name,
    slug: product.slug,
    type: "simple",
    status: "publish",
    sku: product.sku,
    regular_price: product.price,
    short_description: product.short,
    description: product.description + warning,
    manage_stock: false,
    stock_status: "instock",
    categories: [{ id: categoryIdValue }],
    ...(includeImage ? { images: [{ src: `${imageBase}/${product.image}`, alt: product.name }] } : {}),
    meta_data: meta,
  };
}

async function upsertProduct(product, categoryIdValue) {
  const found = await woo(`/products?sku=${encodeURIComponent(product.sku)}&status=any`);
  const existing = found[0] || null;
  const needsCleanImage = !existing || !metaValue(existing, cleanImageMetaKey);
  const payload = payloadFor(product, categoryIdValue, needsCleanImage);

  if (existing) {
    const updated = await woo(`/products/${existing.id}`, { method: "PUT", body: JSON.stringify(payload) });
    console.log(`[nexo-gestora-seed] actualizado ${product.sku} -> ${updated.id} ${updated.permalink}`);
    return;
  }

  const created = await woo("/products", { method: "POST", body: JSON.stringify(payload) });
  console.log(`[nexo-gestora-seed] creado ${product.sku} -> ${created.id} ${created.permalink}`);
}

async function seed() {
  const categoryCache = new Map();
  for (const product of products) {
    try {
      if (!categoryCache.has(product.category)) categoryCache.set(product.category, await categoryId(product.category));
      await upsertProduct(product, categoryCache.get(product.category));
    } catch (error) {
      console.error(`[nexo-gestora-seed] ${product.sku}:`, error instanceof Error ? error.message : error);
    }
  }
}

seed().catch((error) => {
  console.error("[nexo-gestora-seed] error:", error instanceof Error ? error.message : error);
  process.exitCode = 0;
});
