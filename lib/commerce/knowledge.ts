import { Pool } from "pg";
import { getWooProduct, wooConfigured } from "./woocommerce";

export type KnowledgeConfidence = "confirmed_nexo" | "confirmed_external" | "probable" | "unknown";
export type KnowledgeAudience = "customer" | "gestora" | "admin";

export type KnowledgeSpec = {
  name: string;
  value: string;
  unit?: string | null;
  confidence: KnowledgeConfidence;
  evidence: string;
};

export type KnowledgeFaq = {
  question: string;
  answer: string;
  audience: KnowledgeAudience;
  confidence: KnowledgeConfidence;
};

export type KnowledgeSource = {
  sourceType: "physical_photo" | "manufacturer" | "manual" | "retailer" | "distributor" | "research";
  title: string;
  url?: string | null;
  supports: string[];
  confidence: KnowledgeConfidence;
};

export type KnowledgeGap = {
  question: string;
  requiredEvidence: string;
  priority: "high" | "medium" | "low";
};

export type SalesPlaybook = {
  benefits: string[];
  idealCustomer: string[];
  sellingPoints: string[];
  objections: Array<{ objection: string; answer: string; confidence: KnowledgeConfidence }>;
  warnings: string[];
};

export type ProductKnowledgeSeed = {
  id: string;
  woocommerceProductId: number | null;
  sku: string | null;
  brand: string | null;
  model: string | null;
  aliases: string[];
  productType: string;
  summary: string;
  customerDescription: string;
  confidence: KnowledgeConfidence;
  specs: KnowledgeSpec[];
  faq: KnowledgeFaq[];
  sources: KnowledgeSource[];
  salesPlaybook: SalesPlaybook;
  gaps: KnowledgeGap[];
};

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;
let seedsReady: Promise<void> | undefined;

function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  pool ??= new Pool({ connectionString, max: 3, idleTimeoutMillis: 30_000 });
  return pool;
}

export function normalizeKnowledgeIdentifier(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureKnowledgeSchema() {
  schemaReady ??= db().query(`
    CREATE TABLE IF NOT EXISTS nexo_product_knowledge (
      id TEXT PRIMARY KEY,
      woocommerce_product_id BIGINT,
      sku TEXT,
      brand TEXT,
      model TEXT,
      aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
      alias_keys TEXT[] NOT NULL DEFAULT '{}',
      product_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      customer_description TEXT NOT NULL,
      confidence TEXT NOT NULL,
      specs JSONB NOT NULL DEFAULT '[]'::jsonb,
      faq JSONB NOT NULL DEFAULT '[]'::jsonb,
      sales_playbook JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verified_at TIMESTAMPTZ
    );
    CREATE UNIQUE INDEX IF NOT EXISTS nexo_product_knowledge_woo_idx ON nexo_product_knowledge(woocommerce_product_id) WHERE woocommerce_product_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS nexo_product_knowledge_sku_idx ON nexo_product_knowledge(LOWER(sku)) WHERE sku IS NOT NULL;
    CREATE INDEX IF NOT EXISTS nexo_product_knowledge_alias_idx ON nexo_product_knowledge USING GIN(alias_keys);

    CREATE TABLE IF NOT EXISTS nexo_product_knowledge_sources (
      id BIGSERIAL PRIMARY KEY,
      product_knowledge_id TEXT NOT NULL REFERENCES nexo_product_knowledge(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      supports JSONB NOT NULL DEFAULT '[]'::jsonb,
      confidence TEXT NOT NULL,
      consulted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS nexo_product_knowledge_gaps (
      id BIGSERIAL PRIMARY KEY,
      product_knowledge_id TEXT NOT NULL REFERENCES nexo_product_knowledge(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      required_evidence TEXT NOT NULL,
      priority TEXT NOT NULL,
      resolved BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ,
      UNIQUE(product_knowledge_id, question)
    );
  `).then(() => undefined);
  return schemaReady;
}

const emptyPlaybook = (): SalesPlaybook => ({ benefits: [], idealCustomer: [], sellingPoints: [], objections: [], warnings: [] });

export const initialKnowledgeSeeds: ProductKnowledgeSeed[] = [
  {
    id: "pk_gwell_gf8816",
    woocommerceProductId: 1017,
    sku: "NEXO-GF-8816",
    brand: "GWELL",
    model: "GF-8816",
    aliases: ["GWELL", "GF-8816", "ventilador GWELL", "ventilador recargable GWELL"],
    productType: "Ventilador de pedestal recargable",
    summary: "Ventilador AC/DC de 16 pulgadas con batería, panel solar, control remoto, USB y dos bombillos LED.",
    customerDescription: "Solución de ventilación e iluminación de respaldo pensada para cortes eléctricos y uso diario.",
    confidence: "confirmed_external",
    specs: [
      { name: "Diámetro", value: "16", unit: "pulgadas", confidence: "confirmed_external", evidence: "Investigación de producto NEXO" },
      { name: "Batería", value: "12 V / 7 Ah", confidence: "confirmed_external", evidence: "Ficha de proveedor investigada" },
      { name: "Capacidad nominal de batería", value: "84", unit: "Wh aprox.", confidence: "confirmed_external", evidence: "Derivado de 12 V × 7 Ah" },
      { name: "Panel solar", value: "16 V / 10 W / 625 mA", confidence: "confirmed_external", evidence: "Ficha de proveedor investigada" },
      { name: "Motor", value: "DC brushless 12 V / 15 W", confidence: "confirmed_external", evidence: "Ficha de proveedor investigada" },
      { name: "USB", value: "5 V / 1 A", confidence: "confirmed_external", evidence: "Ficha de proveedor investigada" },
      { name: "Iluminación", value: "2 bombillos LED", confidence: "confirmed_external", evidence: "Ficha de proveedor investigada" },
      { name: "Autonomía publicada en alta", value: "hasta 6 h", confidence: "probable", evidence: "Dato comercial del proveedor; pendiente de prueba NEXO" },
      { name: "Autonomía publicada en baja", value: "más de 45 h", confidence: "probable", evidence: "Dato comercial del proveedor; pendiente de prueba NEXO" }
    ],
    faq: [
      { question: "¿Funciona durante los apagones?", answer: "Sí. Tiene batería recargable y admite carga mediante panel solar. La duración exacta depende de la velocidad y del estado de la batería.", audience: "customer", confidence: "confirmed_external" },
      { question: "¿Cuánto dura la batería?", answer: "El proveedor publica hasta 6 horas en velocidad alta y más de 45 horas en baja, pero NEXO todavía no ha realizado una prueba propia de autonomía. Debe presentarse como autonomía publicada, no garantizada.", audience: "gestora", confidence: "probable" }
    ],
    sources: [{ sourceType: "research", title: "Ficha de proveedor investigada por NEXO", supports: ["batería", "panel", "motor", "USB", "autonomía publicada"], confidence: "confirmed_external" }],
    salesPlaybook: {
      benefits: ["Ventilación durante apagones", "Carga solar", "Iluminación LED adicional", "Puerto USB"],
      idealCustomer: ["Hogares con cortes eléctricos frecuentes", "Clientes que quieren respaldo sin combustible"],
      sellingPoints: ["Combina ventilador, batería, panel solar e iluminación en un solo conjunto"],
      objections: [{ objection: "¿Dura toda la noche?", answer: "Depende de la velocidad y del estado de carga. La autonomía larga publicada corresponde a velocidad baja y aún está pendiente de prueba propia NEXO.", confidence: "probable" }],
      warnings: ["No prometer una autonomía concreta como garantía hasta completar una prueba propia NEXO."]
    },
    gaps: [{ question: "¿Cuál es la autonomía real en alta, media y baja?", requiredEvidence: "Prueba propia NEXO con batería cargada y tiempos medidos", priority: "high" }]
  },
  {
    id: "pk_royal_ra123sl",
    woocommerceProductId: 1019,
    sku: "NEXO-RA123SL",
    brand: "Royal",
    model: "RA123SL",
    aliases: ["Royal 12", "Royal solar", "RA123SL", "RA12RSL", "ventilador Royal"],
    productType: "Ventilador solar recargable",
    summary: "Ventilador Royal de 12 pulgadas con panel solar y bombillos LED. Existe una discrepancia pendiente entre RA123SL y RA12RSL.",
    customerDescription: "Ventilador compacto de respaldo con carga solar e iluminación auxiliar.",
    confidence: "probable",
    specs: [
      { name: "Diámetro", value: "12", unit: "pulgadas", confidence: "confirmed_nexo", evidence: "Registro de producto NEXO" },
      { name: "Batería investigada", value: "6 V / 4.5 Ah", confidence: "probable", evidence: "Fuentes externas coincidentes; pendiente de etiqueta física" },
      { name: "Capacidad nominal investigada", value: "27", unit: "Wh aprox.", confidence: "probable", evidence: "Derivado de 6 V × 4.5 Ah; batería pendiente de confirmación física" },
      { name: "Potencia publicada", value: "22", unit: "W aprox.", confidence: "probable", evidence: "Fuentes externas" },
      { name: "Carga por red", value: "8–12 h", confidence: "probable", evidence: "Fuentes externas" },
      { name: "Carga solar", value: "6–8 h en condiciones favorables", confidence: "probable", evidence: "Fuentes externas" },
      { name: "Autonomía publicada", value: "2–8 h aprox.", confidence: "probable", evidence: "Rango encontrado en fuentes comerciales; no validado físicamente" }
    ],
    faq: [{ question: "¿Cuál es el modelo exacto?", answer: "NEXO lo registró como RA123SL, mientras que fuentes externas coincidentes muestran RA12RSL. Antes de prometer especificaciones finas debe verificarse la etiqueta física.", audience: "gestora", confidence: "probable" }],
    sources: [{ sourceType: "research", title: "Investigación externa NEXO sobre Royal 12 pulgadas", supports: ["batería", "potencia", "carga", "autonomía"], confidence: "probable" }],
    salesPlaybook: { ...emptyPlaybook(), benefits: ["Formato compacto", "Carga solar", "Iluminación LED"], warnings: ["No afirmar RA12RSL como modelo definitivo hasta revisar la etiqueta física."] },
    gaps: [
      { question: "¿El modelo físico es RA123SL o RA12RSL?", requiredEvidence: "Foto legible de la etiqueta de modelo", priority: "high" },
      { question: "¿Qué batería monta la unidad física?", requiredEvidence: "Foto de la etiqueta de batería", priority: "high" },
      { question: "¿Qué especificaciones tiene el panel incluido?", requiredEvidence: "Foto de la etiqueta del panel", priority: "high" }
    ]
  },
  {
    id: "pk_boviet_620",
    woocommerceProductId: 1026,
    sku: "NEXO-BOVIET-BVM8611M-620",
    brand: "Boviet Solar",
    model: "BVM8611M-620R-H-HC-BF-DG",
    aliases: ["Boviet", "Boviet 620", "panel 620", "BVM8611M-620R-H-HC-BF-DG"],
    productType: "Panel solar bifacial",
    summary: "Panel Boviet Solar bifacial N-Type de doble vidrio y 620 W, modelo físico BVM8611M-620R-H-HC-BF-DG.",
    customerDescription: "Panel fotovoltaico de alta potencia para sistemas solares que requieran módulos bifaciales de 620 W.",
    confidence: "confirmed_nexo",
    specs: [
      { name: "Potencia máxima", value: "620", unit: "W", confidence: "confirmed_nexo", evidence: "Placa física fotografiada" },
      { name: "Vmp", value: "41.54", unit: "V", confidence: "confirmed_nexo", evidence: "Placa física fotografiada" },
      { name: "Imp", value: "14.93", unit: "A", confidence: "confirmed_nexo", evidence: "Placa física fotografiada" },
      { name: "Voc", value: "48.65", unit: "V", confidence: "confirmed_nexo", evidence: "Placa física fotografiada" },
      { name: "Isc", value: "15.94", unit: "A", confidence: "confirmed_nexo", evidence: "Placa física fotografiada" },
      { name: "Tensión máxima del sistema", value: "1500", unit: "VDC", confidence: "confirmed_nexo", evidence: "Placa física fotografiada" },
      { name: "Fusible máximo en serie", value: "30", unit: "A", confidence: "confirmed_nexo", evidence: "Placa física fotografiada" },
      { name: "Rango de operación", value: "-40 a +85", unit: "°C", confidence: "confirmed_nexo", evidence: "Placa física fotografiada" },
      { name: "Construcción", value: "bifacial N-Type, doble vidrio, 132 medias celdas", confidence: "confirmed_external", evidence: "Modelo exacto contrastado con ficha/listado técnico" }
    ],
    faq: [
      { question: "¿Es de 625 W?", answer: "No. La placa física del modelo BVM8611M-620R-H-HC-BF-DG confirma 620 W.", audience: "customer", confidence: "confirmed_nexo" },
      { question: "¿Es bifacial?", answer: "Sí. El modelo exacto corresponde a una construcción bifacial de doble vidrio.", audience: "customer", confidence: "confirmed_external" }
    ],
    sources: [
      { sourceType: "physical_photo", title: "Placa física del panel Boviet fotografiada por NEXO", supports: ["modelo", "Pmax", "Vmp", "Imp", "Voc", "Isc", "fusible", "temperatura"], confidence: "confirmed_nexo" },
      { sourceType: "research", title: "Listado técnico externo del modelo exacto contrastado por NEXO", supports: ["620 W", "bifacial", "doble vidrio", "132 medias celdas"], confidence: "confirmed_external" }
    ],
    salesPlaybook: { ...emptyPlaybook(), benefits: ["620 W por módulo", "Tecnología bifacial", "Doble vidrio"], sellingPoints: ["El modelo y los valores eléctricos principales están respaldados por la placa física"], warnings: ["No anunciarlo como 625 W."] },
    gaps: []
  },
  {
    id: "pk_royal_reg202v",
    woocommerceProductId: 1028,
    sku: "NEXO-ROYAL-REG202V",
    brand: "Royal",
    model: "REG202V",
    aliases: ["REG202V", "Royal REG202V", "cocina Royal", "cocina dos hornillas Royal"],
    productType: "Cocina de gas de sobremesa",
    summary: "Cocina Royal REG202V de dos hornillas para LPG, con encendido automático/electrónico y superficie de vidrio templado.",
    customerDescription: "Cocina compacta de dos hornillas para gas LPG, pensada para una instalación sencilla sobre mesa o encimera.",
    confidence: "confirmed_external",
    specs: [
      { name: "Hornillas", value: "2", confidence: "confirmed_nexo", evidence: "Fotografía del producto" },
      { name: "Combustible", value: "LPG", confidence: "confirmed_external", evidence: "Investigación del modelo" },
      { name: "Encendido", value: "automático/electrónico", confidence: "confirmed_external", evidence: "Investigación del modelo" },
      { name: "Materiales visibles", value: "estructura metálica y vidrio templado resistente al calor", confidence: "confirmed_external", evidence: "Investigación del modelo y fotografía" },
      { name: "Dimensiones", value: "710 × 375 × 90", unit: "mm aprox.", confidence: "confirmed_external", evidence: "Fuente comercial del modelo" },
      { name: "Garantía comercial", value: "3 meses", confidence: "confirmed_nexo", evidence: "Garantía visible en información fotografiada por NEXO" }
    ],
    faq: [{ question: "¿Qué gas usa?", answer: "La información investigada para el REG202V indica LPG.", audience: "customer", confidence: "confirmed_external" }],
    sources: [{ sourceType: "physical_photo", title: "Fotografía e información comercial capturada por NEXO", supports: ["dos hornillas", "garantía 3 meses"], confidence: "confirmed_nexo" }],
    salesPlaybook: { ...emptyPlaybook(), benefits: ["Dos hornillas", "Encendido automático", "Formato compacto"], warnings: ["Las dimensiones proceden de fuente externa; verificar físicamente si el cliente necesita encaje exacto."] },
    gaps: []
  },
  {
    id: "pk_konfort_135x190",
    woocommerceProductId: 1030,
    sku: "NEXO-KONFORT-135X190",
    brand: "KONFORT",
    model: null,
    aliases: ["KONFORT 135x190", "colchón 135x190", "colchón KONFORT 135"],
    productType: "Colchón",
    summary: "Colchón KONFORT de 135 × 190 cm. La línea exacta todavía no está confirmada.",
    customerDescription: "Colchón KONFORT de 135 × 190 cm sujeto a confirmación de la línea y composición exactas.",
    confidence: "probable",
    specs: [{ name: "Medida", value: "135 × 190", unit: "cm", confidence: "confirmed_nexo", evidence: "Producto/fotografía NEXO" }],
    faq: [{ question: "¿Es Gran Antillas?", answer: "Existe una coincidencia comercial razonable con esa línea, pero NEXO todavía no ha confirmado la etiqueta física. No debe venderse como Gran Antillas hasta verificarla.", audience: "gestora", confidence: "probable" }],
    sources: [{ sourceType: "research", title: "Coincidencia comercial investigada para KONFORT 135 × 190", supports: ["posible línea Gran Antillas"], confidence: "probable" }],
    salesPlaybook: { ...emptyPlaybook(), warnings: ["No afirmar composición interna ni línea Gran Antillas sin etiqueta física."] },
    gaps: [{ question: "¿Cuál es la línea/modelo y composición exacta?", requiredEvidence: "Foto legible de etiqueta del colchón con línea y composición", priority: "high" }]
  },
  {
    id: "pk_konfort_120x190",
    woocommerceProductId: 1035,
    sku: "NEXO-KONFORT-120X190",
    brand: "KONFORT",
    model: null,
    aliases: ["KONFORT 120x190", "colchón 120x190", "colchón KONFORT 120"],
    productType: "Colchón",
    summary: "Colchón KONFORT de 120 × 190 cm. Existe una coincidencia fuerte con Gran Habana, pero la línea exacta no está confirmada.",
    customerDescription: "Colchón KONFORT de 120 × 190 cm sujeto a confirmación de la línea y composición exactas.",
    confidence: "probable",
    specs: [{ name: "Medida", value: "120 × 190", unit: "cm", confidence: "confirmed_nexo", evidence: "Producto/fotografía NEXO" }],
    faq: [{ question: "¿Es Gran Habana?", answer: "Hay una coincidencia comercial fuerte con la línea Gran Habana, pero falta confirmar la etiqueta física. Debe presentarse como posible coincidencia, no como modelo confirmado.", audience: "gestora", confidence: "probable" }],
    sources: [{ sourceType: "research", title: "Coincidencia comercial investigada para KONFORT 120 × 190", supports: ["posible línea Gran Habana"], confidence: "probable" }],
    salesPlaybook: { ...emptyPlaybook(), warnings: ["No afirmar composición interna ni línea Gran Habana sin etiqueta física."] },
    gaps: [{ question: "¿Cuál es la línea/modelo y composición exacta?", requiredEvidence: "Foto legible de etiqueta del colchón con línea y composición", priority: "high" }]
  }
];

function aliasKeys(seed: ProductKnowledgeSeed) {
  const values = [seed.id, seed.sku ?? "", seed.brand ?? "", seed.model ?? "", String(seed.woocommerceProductId ?? ""), ...seed.aliases];
  return [...new Set(values.filter(Boolean).map(normalizeKnowledgeIdentifier))];
}

async function upsertSeed(seed: ProductKnowledgeSeed) {
  await db().query(
    `INSERT INTO nexo_product_knowledge(
      id,woocommerce_product_id,sku,brand,model,aliases,alias_keys,product_type,summary,customer_description,confidence,specs,faq,sales_playbook,verified_at
    ) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,NOW())
    ON CONFLICT(id) DO UPDATE SET
      woocommerce_product_id=EXCLUDED.woocommerce_product_id,sku=EXCLUDED.sku,brand=EXCLUDED.brand,model=EXCLUDED.model,
      aliases=EXCLUDED.aliases,alias_keys=EXCLUDED.alias_keys,product_type=EXCLUDED.product_type,summary=EXCLUDED.summary,
      customer_description=EXCLUDED.customer_description,confidence=EXCLUDED.confidence,specs=EXCLUDED.specs,faq=EXCLUDED.faq,
      sales_playbook=EXCLUDED.sales_playbook,updated_at=NOW(),verified_at=NOW()`,
    [seed.id, seed.woocommerceProductId, seed.sku, seed.brand, seed.model, JSON.stringify(seed.aliases), aliasKeys(seed), seed.productType, seed.summary, seed.customerDescription, seed.confidence, JSON.stringify(seed.specs), JSON.stringify(seed.faq), JSON.stringify(seed.salesPlaybook)]
  );

  await db().query("DELETE FROM nexo_product_knowledge_sources WHERE product_knowledge_id=$1", [seed.id]);
  for (const source of seed.sources) {
    await db().query(
      "INSERT INTO nexo_product_knowledge_sources(product_knowledge_id,source_type,title,url,supports,confidence) VALUES($1,$2,$3,$4,$5::jsonb,$6)",
      [seed.id, source.sourceType, source.title, source.url ?? null, JSON.stringify(source.supports), source.confidence]
    );
  }

  for (const gap of seed.gaps) {
    await db().query(
      `INSERT INTO nexo_product_knowledge_gaps(product_knowledge_id,question,required_evidence,priority,resolved)
       VALUES($1,$2,$3,$4,FALSE)
       ON CONFLICT(product_knowledge_id,question) DO UPDATE SET required_evidence=EXCLUDED.required_evidence,priority=EXCLUDED.priority`,
      [seed.id, gap.question, gap.requiredEvidence, gap.priority]
    );
  }
}

export async function seedInitialKnowledge() {
  await ensureKnowledgeSchema();
  seedsReady ??= (async () => {
    for (const seed of initialKnowledgeSeeds) await upsertSeed(seed);
  })();
  return seedsReady;
}

async function hydrate(row: Record<string, unknown>) {
  const [sources, gaps] = await Promise.all([
    db().query("SELECT source_type,title,url,supports,confidence,consulted_at FROM nexo_product_knowledge_sources WHERE product_knowledge_id=$1 ORDER BY id", [row.id]),
    db().query("SELECT question,required_evidence,priority,resolved,resolved_at FROM nexo_product_knowledge_gaps WHERE product_knowledge_id=$1 ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,id", [row.id])
  ]);
  return { ...row, sources: sources.rows, gaps: gaps.rows };
}

export async function listProductKnowledge(limit = 50) {
  await seedInitialKnowledge();
  const result = await db().query(
    `SELECT id,woocommerce_product_id,sku,brand,model,aliases,product_type,summary,confidence,updated_at,verified_at
     FROM nexo_product_knowledge ORDER BY brand NULLS LAST,product_type,id LIMIT $1`,
    [Math.min(100, Math.max(1, limit))]
  );
  return result.rows;
}

export async function getProductKnowledge(identifier: string) {
  await seedInitialKnowledge();
  const key = normalizeKnowledgeIdentifier(identifier);
  const numericId = /^\d+$/.test(identifier.trim()) ? Number(identifier.trim()) : null;
  const result = await db().query(
    `SELECT * FROM nexo_product_knowledge
     WHERE id=$1 OR LOWER(COALESCE(sku,''))=LOWER($2) OR $3=ANY(alias_keys) OR ($4::bigint IS NOT NULL AND woocommerce_product_id=$4)
     ORDER BY CASE WHEN id=$1 THEN 0 WHEN LOWER(COALESCE(sku,''))=LOWER($2) THEN 1 ELSE 2 END LIMIT 2`,
    [identifier, identifier, key, numericId]
  );
  if (!result.rowCount) return null;
  if ((result.rowCount ?? 0) > 1) return { ambiguous: true, matches: result.rows.map((row) => ({ id: row.id, sku: row.sku, brand: row.brand, model: row.model, summary: row.summary })) };
  return hydrate(result.rows[0]);
}

export async function getProductFaq(identifier: string, audience: KnowledgeAudience = "customer") {
  const knowledge = await getProductKnowledge(identifier);
  if (!knowledge || "ambiguous" in knowledge) return knowledge;
  const faq = Array.isArray(knowledge.faq) ? (knowledge.faq as KnowledgeFaq[]) : [];
  return { id: knowledge.id, sku: knowledge.sku, audience, faq: faq.filter((item) => item.audience === audience || (audience !== "customer" && item.audience === "customer")) };
}

export async function buildProductKnowledgeContext(identifier: string, options: { includeCommerce?: boolean; audience?: KnowledgeAudience } = {}) {
  const knowledge = await getProductKnowledge(identifier);
  if (!knowledge || "ambiguous" in knowledge) return knowledge;
  const audience = options.audience ?? "customer";
  const faq = Array.isArray(knowledge.faq) ? (knowledge.faq as KnowledgeFaq[]).filter((item) => item.audience === audience || (audience !== "customer" && item.audience === "customer")) : [];
  let commerce: Record<string, unknown> | null = null;

  if (options.includeCommerce && knowledge.woocommerce_product_id && wooConfigured()) {
    try {
      const product = await getWooProduct(Number(knowledge.woocommerce_product_id));
      commerce = {
        source: "woocommerce-live",
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        regularPrice: product.regular_price,
        stockStatus: product.stock_status,
        purchasable: product.purchasable,
        status: product.status,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      commerce = { source: "woocommerce-live", error: error instanceof Error ? error.message : "WooCommerce lookup failed", checkedAt: new Date().toISOString() };
    }
  }

  return {
    identity: {
      id: knowledge.id,
      woocommerceProductId: knowledge.woocommerce_product_id,
      sku: knowledge.sku,
      brand: knowledge.brand,
      model: knowledge.model,
      productType: knowledge.product_type,
      aliases: knowledge.aliases
    },
    confidence: knowledge.confidence,
    summary: knowledge.summary,
    customerDescription: knowledge.customer_description,
    specs: knowledge.specs,
    faq,
    salesPlaybook: audience === "customer" ? undefined : knowledge.sales_playbook,
    sources: knowledge.sources,
    gaps: knowledge.gaps,
    commerce,
    rules: {
      priceAndStockSource: "WooCommerce live only",
      probableMustNotBePresentedAsConfirmed: true,
      unresolvedGapsMustNotBeInvented: true
    }
  };
}
