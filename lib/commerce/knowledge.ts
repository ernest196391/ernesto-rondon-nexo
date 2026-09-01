import { Pool } from "pg";
import { getWooProduct, wooConfigured } from "./woocommerce";

export type KnowledgeConfidence = "confirmed_nexo" | "confirmed_external" | "probable" | "unknown";
export type KnowledgeAudience = "customer" | "gestora" | "admin";
export type KnowledgePriority = "high" | "medium" | "low";

export type KnowledgeSpec = { name: string; value: string; unit?: string | null; confidence: KnowledgeConfidence; evidence: string };
export type KnowledgeFaq = { question: string; answer: string; audience: KnowledgeAudience; confidence: KnowledgeConfidence };
export type KnowledgeSource = {
  sourceType: "physical_photo" | "manufacturer" | "manual" | "retailer" | "distributor" | "research";
  title: string;
  url?: string | null;
  supports: string[];
  confidence: KnowledgeConfidence;
};
export type KnowledgeGap = { question: string; requiredEvidence: string; priority: KnowledgePriority };
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

type KnowledgeRow = {
  id: string;
  woocommerce_product_id: string | number | null;
  sku: string | null;
  brand: string | null;
  model: string | null;
  aliases: string[];
  alias_keys: string[];
  product_type: string;
  summary: string;
  customer_description: string;
  confidence: KnowledgeConfidence;
  specs: KnowledgeSpec[];
  faq: KnowledgeFaq[];
  sales_playbook: SalesPlaybook;
  created_at: string | Date;
  updated_at: string | Date;
  verified_at: string | Date | null;
};

type KnowledgeSourceRow = {
  source_type: string;
  title: string;
  url: string | null;
  supports: string[];
  confidence: KnowledgeConfidence;
  consulted_at: string | Date;
};

type KnowledgeGapRow = {
  question: string;
  required_evidence: string;
  priority: KnowledgePriority;
  resolved: boolean;
  resolved_at: string | Date | null;
};

export type ProductKnowledgeRecord = KnowledgeRow & { sources: KnowledgeSourceRow[]; gaps: KnowledgeGapRow[] };
export type AmbiguousKnowledgeResult = { ambiguous: true; matches: Array<{ id: string; sku: string | null; brand: string | null; model: string | null; summary: string }> };

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
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function ensureKnowledgeSchema() {
  schemaReady ??= db().query(`
    CREATE TABLE IF NOT EXISTS nexo_product_knowledge (
      id TEXT PRIMARY KEY, woocommerce_product_id BIGINT, sku TEXT, brand TEXT, model TEXT,
      aliases JSONB NOT NULL DEFAULT '[]'::jsonb, alias_keys TEXT[] NOT NULL DEFAULT '{}',
      product_type TEXT NOT NULL, summary TEXT NOT NULL, customer_description TEXT NOT NULL,
      confidence TEXT NOT NULL, specs JSONB NOT NULL DEFAULT '[]'::jsonb,
      faq JSONB NOT NULL DEFAULT '[]'::jsonb, sales_playbook JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), verified_at TIMESTAMPTZ
    );
    CREATE UNIQUE INDEX IF NOT EXISTS nexo_product_knowledge_woo_idx ON nexo_product_knowledge(woocommerce_product_id) WHERE woocommerce_product_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS nexo_product_knowledge_sku_idx ON nexo_product_knowledge(LOWER(sku)) WHERE sku IS NOT NULL;
    CREATE INDEX IF NOT EXISTS nexo_product_knowledge_alias_idx ON nexo_product_knowledge USING GIN(alias_keys);
    CREATE TABLE IF NOT EXISTS nexo_product_knowledge_sources (
      id BIGSERIAL PRIMARY KEY, product_knowledge_id TEXT NOT NULL REFERENCES nexo_product_knowledge(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL, title TEXT NOT NULL, url TEXT, supports JSONB NOT NULL DEFAULT '[]'::jsonb,
      confidence TEXT NOT NULL, consulted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS nexo_product_knowledge_gaps (
      id BIGSERIAL PRIMARY KEY, product_knowledge_id TEXT NOT NULL REFERENCES nexo_product_knowledge(id) ON DELETE CASCADE,
      question TEXT NOT NULL, required_evidence TEXT NOT NULL, priority TEXT NOT NULL,
      resolved BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), resolved_at TIMESTAMPTZ,
      UNIQUE(product_knowledge_id, question)
    );
  `).then(() => undefined);
  return schemaReady;
}

const blankPlaybook = (): SalesPlaybook => ({ benefits: [], idealCustomer: [], sellingPoints: [], objections: [], warnings: [] });

export const initialKnowledgeSeeds: ProductKnowledgeSeed[] = [
  {
    id: "pk_gwell_gf8816", woocommerceProductId: 1017, sku: "NEXO-GF-8816", brand: "GWELL", model: "GF-8816",
    aliases: ["GWELL", "GF-8816", "ventilador GWELL", "ventilador recargable GWELL"], productType: "Ventilador de pedestal recargable",
    summary: "Ventilador AC/DC de 16 pulgadas con batería, panel solar, control remoto, USB y dos bombillos LED.",
    customerDescription: "Solución de ventilación e iluminación de respaldo pensada para cortes eléctricos y uso diario.", confidence: "confirmed_external",
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
      { question: "¿Cuánto dura la batería?", answer: "El proveedor publica hasta 6 horas en velocidad alta y más de 45 horas en baja, pero NEXO todavía no ha realizado una prueba propia. Debe presentarse como autonomía publicada, no garantizada.", audience: "gestora", confidence: "probable" }
    ],
    sources: [{ sourceType: "research", title: "Ficha de proveedor investigada por NEXO", supports: ["batería", "panel", "motor", "USB", "autonomía publicada"], confidence: "confirmed_external" }],
    salesPlaybook: { benefits: ["Ventilación durante apagones", "Carga solar", "Iluminación LED adicional", "Puerto USB"], idealCustomer: ["Hogares con cortes eléctricos frecuentes", "Clientes que quieren respaldo sin combustible"], sellingPoints: ["Combina ventilador, batería, panel solar e iluminación"], objections: [{ objection: "¿Dura toda la noche?", answer: "Depende de la velocidad y del estado de carga. La autonomía publicada aún está pendiente de prueba propia NEXO.", confidence: "probable" }], warnings: ["No prometer una autonomía concreta como garantía hasta completar prueba propia."] },
    gaps: [{ question: "¿Cuál es la autonomía real en alta, media y baja?", requiredEvidence: "Prueba propia NEXO con batería cargada y tiempos medidos", priority: "high" }]
  },
  {
    id: "pk_royal_ra123sl", woocommerceProductId: 1019, sku: "NEXO-RA123SL", brand: "Royal", model: "RA123SL",
    aliases: ["Royal 12", "Royal solar", "RA123SL", "RA12RSL", "ventilador Royal"], productType: "Ventilador solar recargable",
    summary: "Ventilador Royal de 12 pulgadas con panel solar y bombillos LED. Existe una discrepancia pendiente entre RA123SL y RA12RSL.",
    customerDescription: "Ventilador compacto de respaldo con carga solar e iluminación auxiliar.", confidence: "probable",
    specs: [
      { name: "Diámetro", value: "12", unit: "pulgadas", confidence: "confirmed_nexo", evidence: "Registro de producto NEXO" },
      { name: "Batería investigada", value: "6 V / 4.5 Ah", confidence: "probable", evidence: "Fuentes externas coincidentes; pendiente de etiqueta física" },
      { name: "Capacidad nominal investigada", value: "27", unit: "Wh aprox.", confidence: "probable", evidence: "Derivado de 6 V × 4.5 Ah; batería no confirmada físicamente" },
      { name: "Potencia publicada", value: "22", unit: "W aprox.", confidence: "probable", evidence: "Fuentes externas" },
      { name: "Carga por red", value: "8–12 h", confidence: "probable", evidence: "Fuentes externas" },
      { name: "Carga solar", value: "6–8 h en condiciones favorables", confidence: "probable", evidence: "Fuentes externas" },
      { name: "Autonomía publicada", value: "2–8 h aprox.", confidence: "probable", evidence: "Rango comercial; no validado físicamente" }
    ],
    faq: [{ question: "¿Cuál es el modelo exacto?", answer: "NEXO lo registró como RA123SL, mientras fuentes externas coincidentes muestran RA12RSL. Hay que verificar la etiqueta física antes de prometer especificaciones finas.", audience: "gestora", confidence: "probable" }],
    sources: [{ sourceType: "research", title: "Investigación externa NEXO sobre Royal 12 pulgadas", supports: ["batería", "potencia", "carga", "autonomía"], confidence: "probable" }],
    salesPlaybook: { ...blankPlaybook(), benefits: ["Formato compacto", "Carga solar", "Iluminación LED"], warnings: ["No afirmar RA12RSL como modelo definitivo hasta revisar la etiqueta física."] },
    gaps: [
      { question: "¿El modelo físico es RA123SL o RA12RSL?", requiredEvidence: "Foto legible de la etiqueta de modelo", priority: "high" },
      { question: "¿Qué batería monta la unidad física?", requiredEvidence: "Foto de la etiqueta de batería", priority: "high" },
      { question: "¿Qué especificaciones tiene el panel incluido?", requiredEvidence: "Foto de la etiqueta del panel", priority: "high" }
    ]
  },
  {
    id: "pk_boviet_620", woocommerceProductId: 1026, sku: "NEXO-BOVIET-BVM8611M-620", brand: "Boviet Solar", model: "BVM8611M-620R-H-HC-BF-DG",
    aliases: ["Boviet", "Boviet 620", "panel 620", "BVM8611M-620R-H-HC-BF-DG"], productType: "Panel solar bifacial",
    summary: "Panel Boviet Solar bifacial N-Type de doble vidrio y 620 W, modelo físico BVM8611M-620R-H-HC-BF-DG.",
    customerDescription: "Panel fotovoltaico de alta potencia para sistemas solares que requieran módulos bifaciales de 620 W.", confidence: "confirmed_nexo",
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
    sources: [{ sourceType: "physical_photo", title: "Placa física del panel Boviet fotografiada por NEXO", supports: ["modelo", "Pmax", "Vmp", "Imp", "Voc", "Isc", "fusible", "temperatura"], confidence: "confirmed_nexo" }, { sourceType: "research", title: "Listado técnico externo del modelo exacto contrastado por NEXO", supports: ["620 W", "bifacial", "doble vidrio", "132 medias celdas"], confidence: "confirmed_external" }],
    salesPlaybook: { ...blankPlaybook(), benefits: ["620 W por módulo", "Tecnología bifacial", "Doble vidrio"], sellingPoints: ["Modelo y valores eléctricos principales respaldados por placa física"], warnings: ["No anunciarlo como 625 W."] }, gaps: []
  },
  {
    id: "pk_royal_reg202v", woocommerceProductId: 1028, sku: "NEXO-ROYAL-REG202V", brand: "Royal", model: "REG202V",
    aliases: ["REG202V", "Royal REG202V", "cocina Royal", "cocina dos hornillas Royal"], productType: "Cocina de gas de sobremesa",
    summary: "Cocina Royal REG202V de dos hornillas para LPG, con encendido automático/electrónico y superficie de vidrio templado.",
    customerDescription: "Cocina compacta de dos hornillas para gas LPG, pensada para instalación sobre mesa o encimera.", confidence: "confirmed_external",
    specs: [
      { name: "Hornillas", value: "2", confidence: "confirmed_nexo", evidence: "Fotografía del producto" },
      { name: "Combustible", value: "LPG", confidence: "confirmed_external", evidence: "Investigación del modelo" },
      { name: "Encendido", value: "automático/electrónico", confidence: "confirmed_external", evidence: "Investigación del modelo" },
      { name: "Materiales visibles", value: "estructura metálica y vidrio templado resistente al calor", confidence: "confirmed_external", evidence: "Investigación y fotografía" },
      { name: "Dimensiones", value: "710 × 375 × 90", unit: "mm aprox.", confidence: "confirmed_external", evidence: "Fuente comercial del modelo" },
      { name: "Garantía comercial", value: "3 meses", confidence: "confirmed_nexo", evidence: "Garantía visible en información fotografiada por NEXO" }
    ],
    faq: [{ question: "¿Qué gas usa?", answer: "La información investigada para el REG202V indica LPG.", audience: "customer", confidence: "confirmed_external" }],
    sources: [{ sourceType: "physical_photo", title: "Fotografía e información comercial capturada por NEXO", supports: ["dos hornillas", "garantía 3 meses"], confidence: "confirmed_nexo" }],
    salesPlaybook: { ...blankPlaybook(), benefits: ["Dos hornillas", "Encendido automático", "Formato compacto"], warnings: ["Las dimensiones proceden de fuente externa; verificar físicamente si el cliente necesita encaje exacto."] }, gaps: []
  },
  {
    id: "pk_konfort_135x190", woocommerceProductId: 1030, sku: "NEXO-KONFORT-135X190", brand: "KONFORT", model: null,
    aliases: ["KONFORT 135x190", "colchón 135x190", "colchón KONFORT 135"], productType: "Colchón",
    summary: "Colchón KONFORT de 135 × 190 cm. La línea exacta todavía no está confirmada.", customerDescription: "Colchón KONFORT de 135 × 190 cm sujeto a confirmación de la línea y composición exactas.", confidence: "probable",
    specs: [{ name: "Medida", value: "135 × 190", unit: "cm", confidence: "confirmed_nexo", evidence: "Producto/fotografía NEXO" }],
    faq: [{ question: "¿Es Gran Antillas?", answer: "Existe una coincidencia comercial razonable con esa línea, pero NEXO todavía no ha confirmado la etiqueta física. No debe venderse como Gran Antillas hasta verificarla.", audience: "gestora", confidence: "probable" }],
    sources: [{ sourceType: "research", title: "Coincidencia comercial investigada para KONFORT 135 × 190", supports: ["posible línea Gran Antillas"], confidence: "probable" }],
    salesPlaybook: { ...blankPlaybook(), warnings: ["No afirmar composición interna ni línea Gran Antillas sin etiqueta física."] }, gaps: [{ question: "¿Cuál es la línea/modelo y composición exacta?", requiredEvidence: "Foto legible de etiqueta del colchón con línea y composición", priority: "high" }]
  },
  {
    id: "pk_konfort_120x190", woocommerceProductId: 1035, sku: "NEXO-KONFORT-120X190", brand: "KONFORT", model: null,
    aliases: ["KONFORT 120x190", "colchón 120x190", "colchón KONFORT 120"], productType: "Colchón",
    summary: "Colchón KONFORT de 120 × 190 cm. Existe una coincidencia fuerte con Gran Habana, pero la línea exacta no está confirmada.", customerDescription: "Colchón KONFORT de 120 × 190 cm sujeto a confirmación de la línea y composición exactas.", confidence: "probable",
    specs: [{ name: "Medida", value: "120 × 190", unit: "cm", confidence: "confirmed_nexo", evidence: "Producto/fotografía NEXO" }],
    faq: [{ question: "¿Es Gran Habana?", answer: "Hay una coincidencia comercial fuerte con la línea Gran Habana, pero falta confirmar la etiqueta física. Debe presentarse como posible coincidencia, no como modelo confirmado.", audience: "gestora", confidence: "probable" }],
    sources: [{ sourceType: "research", title: "Coincidencia comercial investigada para KONFORT 120 × 190", supports: ["posible línea Gran Habana"], confidence: "probable" }],
    salesPlaybook: { ...blankPlaybook(), warnings: ["No afirmar composición interna ni línea Gran Habana sin etiqueta física."] }, gaps: [{ question: "¿Cuál es la línea/modelo y composición exacta?", requiredEvidence: "Foto legible de etiqueta del colchón con línea y composición", priority: "high" }]
  },
  {
    id: "pk_philco_ph43hdce", woocommerceProductId: 1009, sku: null, brand: "Philco", model: "PH43HDCE",
    aliases: ["Philco PH43HDCE", "PH43HDCE", "televisor Philco 43", "TV Philco 43"], productType: "Televisor LED",
    summary: "Televisor Philco PH43HDCE de 43 pulgadas. NEXO tiene confirmados el modelo, tamaño y resolución Full HD; las funciones smart y conectividad exacta siguen pendientes de placa/manual.",
    customerDescription: "Televisor Philco LED de 43 pulgadas y resolución Full HD. Las funciones adicionales deben confirmarse antes de prometerlas.", confidence: "probable",
    specs: [
      { name: "Pantalla", value: "43", unit: "pulgadas", confidence: "confirmed_nexo", evidence: "Producto registrado y fotografiado por NEXO" },
      { name: "Tecnología", value: "LED", confidence: "confirmed_nexo", evidence: "Producto registrado por NEXO" },
      { name: "Resolución", value: "Full HD", confidence: "confirmed_nexo", evidence: "Producto registrado por NEXO" }
    ],
    faq: [{ question: "¿Es Smart TV?", answer: "NEXO todavía no ha confirmado esa función para la unidad PH43HDCE. Hay que verificar etiqueta, manual o conectividad antes de afirmarlo.", audience: "gestora", confidence: "unknown" }],
    sources: [{ sourceType: "physical_photo", title: "Producto Philco PH43HDCE registrado por NEXO", supports: ["marca", "modelo", "43 pulgadas", "Full HD"], confidence: "confirmed_nexo" }],
    salesPlaybook: { ...blankPlaybook(), benefits: ["Pantalla de 43 pulgadas", "Resolución Full HD"], warnings: ["No prometer Smart TV, sistema operativo, Wi‑Fi ni cantidad de puertos sin verificar la unidad."] },
    gaps: [{ question: "¿Qué conectividad y funciones smart tiene exactamente?", requiredEvidence: "Foto de etiqueta trasera, conectores y/o manual del PH43HDCE", priority: "high" }]
  },
  {
    id: "pk_decoder_hd", woocommerceProductId: 1011, sku: null, brand: null, model: null,
    aliases: ["Decodificador Digital HD", "decodificador HD", "cajita digital", "caja digital"], productType: "Decodificador de televisión digital",
    summary: "Decodificador digital HD con HDMI y USB visibles. Marca, modelo, estándar de televisión y codecs todavía no están confirmados.",
    customerDescription: "Decodificador digital con salidas/conectividad HDMI y USB visibles; compatibilidad exacta pendiente de identificación del modelo.", confidence: "probable",
    specs: [
      { name: "HDMI", value: "presente", confidence: "confirmed_nexo", evidence: "Fotografía del producto" },
      { name: "USB", value: "presente", confidence: "confirmed_nexo", evidence: "Fotografía del producto" }
    ],
    faq: [{ question: "¿Sirve para la televisión digital de Cuba?", answer: "NEXO todavía no ha confirmado el estándar del equipo. No debe garantizarse compatibilidad hasta identificar marca/modelo y especificación de recepción.", audience: "gestora", confidence: "unknown" }],
    sources: [{ sourceType: "physical_photo", title: "Fotografía del decodificador registrada por NEXO", supports: ["HDMI", "USB"], confidence: "confirmed_nexo" }],
    salesPlaybook: { ...blankPlaybook(), warnings: ["No afirmar DVB, DTMB, codecs ni compatibilidad nacional sin etiqueta/modelo."] },
    gaps: [{ question: "¿Cuál es la marca, modelo, estándar de recepción y codecs compatibles?", requiredEvidence: "Foto legible de etiqueta/modelo y especificaciones del equipo", priority: "high" }]
  },
  {
    id: "pk_parker_split", woocommerceProductId: 1013, sku: null, brand: "Parker", model: null,
    aliases: ["Split Parker", "aire Parker", "aire acondicionado Parker"], productType: "Aire acondicionado split",
    summary: "Equipo de aire acondicionado split Parker con unidad interior y exterior. Capacidad, modelo, tecnología inverter, refrigerante y consumo todavía no están confirmados.",
    customerDescription: "Aire acondicionado split Parker. La capacidad y especificaciones eléctricas se confirmarán antes de cerrar la venta.", confidence: "unknown",
    specs: [{ name: "Configuración", value: "unidad interior + unidad exterior", confidence: "confirmed_nexo", evidence: "Fotografía del producto" }],
    faq: [{ question: "¿Cuántos BTU tiene?", answer: "Ese dato todavía no está confirmado en NEXO. Hace falta la placa técnica de la unidad antes de recomendarlo por tamaño de habitación.", audience: "customer", confidence: "unknown" }],
    sources: [{ sourceType: "physical_photo", title: "Equipo Parker fotografiado por NEXO", supports: ["marca", "configuración split"], confidence: "confirmed_nexo" }],
    salesPlaybook: { ...blankPlaybook(), warnings: ["No recomendar por metros cuadrados ni afirmar BTU, inverter, refrigerante o consumo sin placa técnica."] },
    gaps: [{ question: "¿Cuál es el modelo, capacidad BTU, voltaje, refrigerante, consumo y si es inverter?", requiredEvidence: "Foto legible de la placa técnica de unidad interior/exterior", priority: "high" }]
  },
  {
    id: "pk_hamilton_beach_5_speed", woocommerceProductId: 1015, sku: null, brand: "Hamilton Beach", model: null,
    aliases: ["Hamilton Beach blanca", "batidora Hamilton Beach", "Hamilton Beach 5 velocidades"], productType: "Batidora",
    summary: "Batidora Hamilton Beach blanca de 5 velocidades. El modelo exacto y la potencia todavía no están confirmados.",
    customerDescription: "Batidora Hamilton Beach con cinco velocidades. Potencia y accesorios exactos sujetos a confirmación del modelo.", confidence: "probable",
    specs: [{ name: "Velocidades", value: "5", confidence: "confirmed_nexo", evidence: "Información visible en el producto fotografiado" }],
    faq: [{ question: "¿Qué potencia tiene?", answer: "NEXO todavía no tiene confirmada la potencia porque falta identificar el número exacto de modelo.", audience: "customer", confidence: "unknown" }],
    sources: [{ sourceType: "physical_photo", title: "Batidora Hamilton Beach fotografiada por NEXO", supports: ["marca", "5 velocidades"], confidence: "confirmed_nexo" }],
    salesPlaybook: { ...blankPlaybook(), benefits: ["Cinco velocidades"], warnings: ["No atribuir potencia, accesorios o funciones de otros modelos Hamilton Beach."] },
    gaps: [{ question: "¿Cuál es el modelo exacto, potencia y contenido de la caja?", requiredEvidence: "Foto de etiqueta inferior/trasera y caja", priority: "high" }]
  },
  {
    id: "pk_bera_br150", woocommerceProductId: 1021, sku: null, brand: "BERA", model: "BR150",
    aliases: ["BERA BR150", "moto BERA", "BR150 azul"], productType: "Motocicleta",
    summary: "Motocicleta BERA BR150. Existe un manual investigado con datos técnicos, pero NEXO todavía debe confirmar que la unidad física corresponde exactamente a esa variante.",
    customerDescription: "Motocicleta BERA BR150 pendiente de verificación final de placa y configuración antes de publicar especificaciones completas.", confidence: "probable",
    specs: [
      { name: "Motor investigado", value: "4 tiempos, 124 cc", confidence: "probable", evidence: "Manual investigado; unidad física pendiente de cotejo" },
      { name: "Potencia investigada", value: "12", unit: "HP", confidence: "probable", evidence: "Manual investigado; unidad física pendiente de cotejo" },
      { name: "Torque investigado", value: "9.5", unit: "Nm", confidence: "probable", evidence: "Manual investigado; unidad física pendiente de cotejo" },
      { name: "Transmisión investigada", value: "5 velocidades", confidence: "probable", evidence: "Manual investigado; unidad física pendiente de cotejo" },
      { name: "Arranque investigado", value: "eléctrico y pedal", confidence: "probable", evidence: "Manual investigado; unidad física pendiente de cotejo" },
      { name: "Batería investigada", value: "12 V / 6.5 Ah", confidence: "probable", evidence: "Manual investigado; unidad física pendiente de cotejo" },
      { name: "Tanque investigado", value: "12.5", unit: "L", confidence: "probable", evidence: "Manual investigado; unidad física pendiente de cotejo" },
      { name: "Peso investigado", value: "98", unit: "kg", confidence: "probable", evidence: "Manual investigado; unidad física pendiente de cotejo" }
    ],
    faq: [{ question: "¿Es 150 cc?", answer: "El nombre comercial es BR150, pero el manual investigado indica 124 cc para la variante consultada. NEXO debe verificar la placa de la unidad antes de afirmar la cilindrada.", audience: "gestora", confidence: "probable" }],
    sources: [{ sourceType: "manual", title: "Manual BERA BR150 investigado por NEXO", supports: ["motor", "potencia", "torque", "arranque", "batería", "transmisión", "tanque", "peso"], confidence: "probable" }],
    salesPlaybook: { ...blankPlaybook(), warnings: ["No publicar las especificaciones del manual como confirmadas hasta cotejar placa/VIN/modelo exacto de la unidad."] },
    gaps: [{ question: "¿La unidad física coincide exactamente con la variante del manual investigado?", requiredEvidence: "Foto legible de placa/VIN/modelo y especificaciones de la unidad", priority: "high" }]
  },
  {
    id: "pk_refrigerator_two_door", woocommerceProductId: 1023, sku: null, brand: null, model: null,
    aliases: ["Refrigerador 2 puertas", "nevera dos puertas", "refrigerador plateado", "nevera con dispensador"], productType: "Refrigerador",
    summary: "Refrigerador plateado de dos puertas con dispensador de agua visible. Marca, modelo, capacidad, tecnología de frío y consumo todavía no están confirmados.",
    customerDescription: "Refrigerador de dos puertas con dispensador de agua. Capacidad y especificaciones energéticas se confirmarán antes de la venta.", confidence: "unknown",
    specs: [
      { name: "Puertas", value: "2", confidence: "confirmed_nexo", evidence: "Fotografía del producto" },
      { name: "Dispensador de agua", value: "visible", confidence: "confirmed_nexo", evidence: "Fotografía del producto" }
    ],
    faq: [{ question: "¿Es No Frost o inverter?", answer: "NEXO todavía no ha confirmado ninguna de esas dos características. Hace falta la placa/modelo exacto.", audience: "customer", confidence: "unknown" }],
    sources: [{ sourceType: "physical_photo", title: "Refrigerador fotografiado por NEXO", supports: ["dos puertas", "dispensador visible"], confidence: "confirmed_nexo" }],
    salesPlaybook: { ...blankPlaybook(), benefits: ["Formato de dos puertas", "Dispensador de agua visible"], warnings: ["No afirmar capacidad, No Frost, inverter, consumo o voltaje sin placa técnica."] },
    gaps: [{ question: "¿Cuál es la marca, modelo, capacidad, sistema de frío, voltaje y consumo?", requiredEvidence: "Foto legible de placa técnica y etiqueta energética", priority: "high" }]
  },
  {
    id: "pk_kpremium_xpb80_188s", woocommerceProductId: null, sku: null, brand: "KPREMIUM", model: "XPB80-188S",
    aliases: ["KPREMIUM XPB80-188S", "XPB80-188S", "lavadora KPREMIUM 8kg"], productType: "Lavadora semiautomática",
    summary: "Lavadora semiautomática KPREMIUM XPB80-188S de 8 kg y doble tina, con lavado y centrifugado.",
    customerDescription: "Lavadora semiautomática de 8 kg con tina separada de centrifugado y controles mecánicos.", confidence: "confirmed_nexo",
    specs: [
      { name: "Capacidad", value: "8", unit: "kg", confidence: "confirmed_nexo", evidence: "Información de producto NEXO" },
      { name: "Configuración", value: "doble tina", confidence: "confirmed_nexo", evidence: "Información/fotografía NEXO" },
      { name: "Funciones", value: "lavado y centrifugado", confidence: "confirmed_nexo", evidence: "Información/fotografía NEXO" },
      { name: "Controles", value: "mecánicos con temporizadores", confidence: "confirmed_nexo", evidence: "Información/fotografía NEXO" }
    ],
    faq: [], sources: [{ sourceType: "physical_photo", title: "KPREMIUM XPB80-188S registrada por NEXO", supports: ["modelo", "8 kg", "doble tina", "controles"], confidence: "confirmed_nexo" }],
    salesPlaybook: { ...blankPlaybook(), benefits: ["8 kg de capacidad", "Lavado y centrifugado en tinas separadas", "Controles mecánicos sencillos"] }, gaps: []
  },
  {
    id: "pk_tonka_top_load", woocommerceProductId: null, sku: null, brand: "TONKA", model: null,
    aliases: ["TONKA automática", "lavadora TONKA", "TONKA carga superior"], productType: "Lavadora automática de carga superior",
    summary: "Lavadora TONKA automática de carga superior con panel electrónico y programas visibles. Modelo, capacidad y potencia están pendientes.",
    customerDescription: "Lavadora automática TONKA de carga superior con controles electrónicos. Capacidad y especificaciones exactas se confirmarán por modelo.", confidence: "probable",
    specs: [
      { name: "Carga", value: "superior", confidence: "confirmed_nexo", evidence: "Fotografía NEXO" },
      { name: "Control", value: "panel electrónico", confidence: "confirmed_nexo", evidence: "Fotografía NEXO" }
    ],
    faq: [], sources: [{ sourceType: "physical_photo", title: "Lavadora TONKA fotografiada por NEXO", supports: ["carga superior", "panel electrónico"], confidence: "confirmed_nexo" }],
    salesPlaybook: { ...blankPlaybook(), warnings: ["No afirmar capacidad, potencia ni programas específicos sin placa/modelo."] }, gaps: [{ question: "¿Cuál es el modelo, capacidad, potencia, voltaje y programas exactos?", requiredEvidence: "Foto legible de placa técnica y panel completo", priority: "high" }]
  },
  {
    id: "pk_decakila_kmjb023b", woocommerceProductId: null, sku: null, brand: "Decakila", model: "KMJB023B",
    aliases: ["Decakila KMJB023B", "KMJB023B", "batidora inalámbrica Decakila"], productType: "Batidora de mano inalámbrica",
    summary: "Batidora de mano inalámbrica Decakila KMJB023B de 100 W, batería de litio de 2000 mAh y carga USB.",
    customerDescription: "Batidora de mano inalámbrica recargable por USB, con componentes de acero inoxidable.", confidence: "confirmed_nexo",
    specs: [
      { name: "Potencia", value: "100", unit: "W", confidence: "confirmed_nexo", evidence: "Información de producto NEXO" },
      { name: "Batería", value: "litio 2000 mAh", confidence: "confirmed_nexo", evidence: "Información de producto NEXO" },
      { name: "Carga", value: "USB", confidence: "confirmed_nexo", evidence: "Información de producto NEXO" },
      { name: "Componentes", value: "acero inoxidable", confidence: "confirmed_nexo", evidence: "Información de producto NEXO" }
    ],
    faq: [], sources: [{ sourceType: "physical_photo", title: "Decakila KMJB023B registrada por NEXO", supports: ["modelo", "100 W", "2000 mAh", "USB", "acero inoxidable"], confidence: "confirmed_nexo" }],
    salesPlaybook: { ...blankPlaybook(), benefits: ["Uso inalámbrico", "Carga USB", "100 W", "Componentes de acero inoxidable"] }, gaps: []
  },
  {
    id: "pk_decakila_kutt006w", woocommerceProductId: null, sku: null, brand: "Decakila", model: "KUTT006W",
    aliases: ["Decakila KUTT006W", "KUTT006W", "cuchillo eléctrico Decakila"], productType: "Cuchillo eléctrico",
    summary: "Cuchillo eléctrico Decakila KUTT006W de 100 W.", customerDescription: "Cuchillo eléctrico Decakila de 100 W para facilitar cortes de alimentos.", confidence: "confirmed_nexo",
    specs: [{ name: "Potencia", value: "100", unit: "W", confidence: "confirmed_nexo", evidence: "Información de producto NEXO" }],
    faq: [], sources: [{ sourceType: "physical_photo", title: "Decakila KUTT006W registrada por NEXO", supports: ["modelo", "100 W"], confidence: "confirmed_nexo" }],
    salesPlaybook: { ...blankPlaybook(), benefits: ["Corte asistido eléctricamente", "100 W"] }, gaps: []
  },
  {
    id: "pk_sumry_4000w_24v", woocommerceProductId: 1058, sku: "NEXO-SUMRY-4000W-24V", brand: "SUMRY", model: null,
    aliases: ["SUMRY 4000W", "inversor SUMRY", "inversor 24V 120V", "inversor solar híbrido SUMRY"], productType: "Inversor solar híbrido",
    summary: "Inversor híbrido SUMRY de 4000 W para banco de baterías de 24 V, salida de 120 V, onda sinusoidal pura y controlador MPPT integrado.",
    customerDescription: "Inversor híbrido de onda pura para integrar paneles, batería y red en un sistema de respaldo correctamente dimensionado.", confidence: "probable",
    specs: [
      { name: "Potencia nominal", value: "4000", unit: "W", confidence: "confirmed_nexo", evidence: "Texto visible en el frontal del producto" },
      { name: "Tensión del banco de baterías", value: "24", unit: "V DC", confidence: "confirmed_nexo", evidence: "Texto visible en el frontal del producto" },
      { name: "Salida AC", value: "120", unit: "V AC", confidence: "confirmed_nexo", evidence: "Texto visible en el frontal del producto" },
      { name: "Forma de onda", value: "sinusoidal pura", confidence: "confirmed_external", evidence: "Ficha oficial de la familia SUMRY HGX y publicación del proveedor" },
      { name: "Controlador", value: "MPPT integrado", confidence: "confirmed_external", evidence: "Ficha oficial de la familia SUMRY HGX y publicación del proveedor" },
      { name: "Corriente MPPT anunciada", value: "140", unit: "A", confidence: "probable", evidence: "Publicación del proveedor; el modelo exacto no se observa en la fotografía" }
    ],
    faq: [
      { question: "¿Sirve durante los apagones?", answer: "Sí, como parte de un sistema con baterías, cableado y protecciones correctamente dimensionados.", audience: "customer", confidence: "confirmed_external" },
      { question: "¿Cuántas horas mantiene una casa?", answer: "La duración depende de la capacidad útil de las baterías, el consumo conectado y el aporte solar. No puede calcularse solo con los 4000 W del inversor.", audience: "customer", confidence: "confirmed_external" },
      { question: "¿Está confirmado el MPPT de 140 A?", answer: "No. El proveedor lo anuncia, pero NEXO necesita una foto de la etiqueta técnica para confirmar la variante exacta.", audience: "gestora", confidence: "probable" }
    ],
    sources: [
      { sourceType: "physical_photo", title: "Fotografía frontal SUMRY 4000W 24V 120V", supports: ["marca", "4000 W", "24 V DC", "120 V AC", "pantalla LCD"], confidence: "confirmed_nexo" },
      { sourceType: "manufacturer", title: "SUMRY HGX Series Off Grid Inverter", url: "https://www.sumryenergy.com/HGX-Series-Off-Grid-Inverter-pd49940380.html", supports: ["onda sinusoidal pura", "controlador MPPT", "gestión híbrida"], confidence: "confirmed_external" }
    ],
    salesPlaybook: { benefits: ["Respaldo de 120 V durante apagones", "Integración de paneles, batería y red", "Onda sinusoidal pura"], idealCustomer: ["Hogares y pequeños negocios que instalarán un sistema solar de 24 V", "Clientes que necesitan respaldo fijo de mayor potencia"], sellingPoints: ["Integra inversor y carga solar MPPT en un solo equipo"], objections: [{ objection: "¿Mantiene toda la casa?", answer: "Solo después de calcular las cargas, el pico de arranque y el banco de baterías.", confidence: "confirmed_external" }], warnings: ["No prometer autonomía sin cálculo de baterías y consumo.", "No afirmar 140 A ni potencia FV máxima hasta confirmar la etiqueta técnica."] },
    gaps: [{ question: "¿Cuál es el modelo y la corriente MPPT exactos de esta unidad?", requiredEvidence: "Foto legible de la etiqueta lateral o trasera", priority: "high" }]
  },
  {
    id: "pk_bluetti_elite100_v2", woocommerceProductId: 1060, sku: "NEXO-BLUETTI-ELITE100-V2", brand: "BLUETTI", model: "Elite 100 V2",
    aliases: ["BLUETTI Elite 100 V2", "Elite 100", "estación BLUETTI 1024Wh", "power station BLUETTI"], productType: "Estación de energía portátil",
    summary: "Estación portátil BLUETTI Elite 100 V2 con 1024 Wh, salida de 1800 W, pico de 3600 W y batería LiFePO₄.", customerDescription: "Respaldo portátil integrado para alimentar dispositivos y equipos compatibles durante apagones, viajes o trabajo móvil.", confidence: "confirmed_external",
    specs: [
      { name: "Capacidad", value: "1024", unit: "Wh", confidence: "confirmed_external", evidence: "BLUETTI oficial y frontal del producto" },
      { name: "Potencia nominal", value: "1800", unit: "W", confidence: "confirmed_external", evidence: "BLUETTI oficial y frontal del producto" },
      { name: "Potencia pico", value: "3600", unit: "W", confidence: "confirmed_external", evidence: "BLUETTI oficial" },
      { name: "Química de batería", value: "LiFePO₄", confidence: "confirmed_external", evidence: "BLUETTI oficial" },
      { name: "Carga a 80 % publicada", value: "45", unit: "min", confidence: "confirmed_external", evidence: "BLUETTI oficial; condiciones de laboratorio" },
      { name: "Salidas AC visibles", value: "4 × 120 V", confidence: "confirmed_nexo", evidence: "Fotografía frontal" }
    ],
    faq: [
      { question: "¿Puede alimentar un refrigerador?", answer: "Sí, si su consumo y pico de arranque están dentro de los límites del equipo.", audience: "customer", confidence: "confirmed_external" },
      { question: "¿Cuánto dura la batería?", answer: "Depende del consumo. La capacidad es 1024 Wh, pero la energía útil real varía por las pérdidas de conversión y las condiciones de uso.", audience: "customer", confidence: "confirmed_external" },
      { question: "¿Incluye panel solar?", answer: "No se anuncia panel incluido en esta oferta; admite paneles compatibles vendidos por separado.", audience: "customer", confidence: "confirmed_nexo" }
    ],
    sources: [
      { sourceType: "physical_photo", title: "Fotografía BLUETTI Elite 100 V2", supports: ["marca", "modelo visible", "1024 Wh", "1800 W", "cuatro salidas AC"], confidence: "confirmed_nexo" },
      { sourceType: "manufacturer", title: "BLUETTI Elite 100 V2", url: "https://www.bluettipower.com/", supports: ["1024 Wh", "1800 W", "LiFePO₄", "carga solar"], confidence: "confirmed_external" },
      { sourceType: "manufacturer", title: "BLUETTI Elite 100 V2 Product Page", url: "https://shop-us.bluettipower.com/", supports: ["carga a 80 %", "capacidad", "potencia"], confidence: "confirmed_external" }
    ],
    salesPlaybook: { benefits: ["Respaldo portátil en una sola unidad", "Batería LFP", "Carga rápida", "Compatibilidad solar"], idealCustomer: ["Hogares que necesitan respaldo para equipos esenciales", "Trabajo móvil y actividades fuera de red"], sellingPoints: ["Más simple de instalar y transportar que un sistema separado de inversor y batería"], objections: [{ objection: "¿Dura toda la noche?", answer: "Depende del consumo de los equipos conectados; debe calcularse por watts y tiempo de uso.", confidence: "confirmed_external" }], warnings: ["No prometer horas de autonomía sin conocer la carga."] }, gaps: []
  },
  {
    id: "pk_ecoflow_delta3_ultra", woocommerceProductId: 1062, sku: "NEXO-ECOFLOW-DELTA3-ULTRA", brand: "EcoFlow", model: "DELTA 3 Ultra",
    aliases: ["EcoFlow DELTA 3 Ultra", "DELTA 3 Ultra 3072Wh", "EcoFlow 3600W", "estación EcoFlow"], productType: "Estación de energía portátil",
    summary: "Estación EcoFlow DELTA 3 Ultra estándar con 3072 Wh, salida de 3600 W, sobretensión de 7200 W, batería LFP y UPS inferior a 10 ms.", customerDescription: "Estación de alta capacidad para respaldo doméstico, trabajo y cargas compatibles de mayor demanda.", confidence: "confirmed_external",
    specs: [
      { name: "Capacidad", value: "3072", unit: "Wh", confidence: "confirmed_external", evidence: "EcoFlow oficial" },
      { name: "Potencia nominal", value: "3600", unit: "W", confidence: "confirmed_external", evidence: "EcoFlow oficial" },
      { name: "Sobretensión", value: "7200", unit: "W", confidence: "confirmed_external", evidence: "EcoFlow oficial" },
      { name: "X-Boost", value: "hasta 4600 W en cargas compatibles", confidence: "confirmed_external", evidence: "EcoFlow oficial" },
      { name: "Batería", value: "LFP 51.2 V / 60 Ah", confidence: "confirmed_external", evidence: "EcoFlow oficial" },
      { name: "Entrada solar máxima", value: "800", unit: "W", confidence: "confirmed_external", evidence: "EcoFlow oficial" },
      { name: "Transferencia UPS", value: "menos de 10 ms", confidence: "confirmed_external", evidence: "EcoFlow oficial" },
      { name: "Conectividad", value: "Wi‑Fi y Bluetooth", confidence: "confirmed_external", evidence: "EcoFlow oficial" },
      { name: "Expansión de batería", value: "no compatible en la variante estándar", confidence: "confirmed_external", evidence: "Comparación oficial DELTA 3 Ultra vs Plus" }
    ],
    faq: [
      { question: "¿Se puede ampliar con baterías adicionales?", answer: "No en la DELTA 3 Ultra estándar. Esa función corresponde a DELTA 3 Ultra Plus.", audience: "customer", confidence: "confirmed_external" },
      { question: "¿Puede funcionar como UPS?", answer: "Sí. EcoFlow indica una transferencia inferior a 10 ms para equipos compatibles.", audience: "customer", confidence: "confirmed_external" },
      { question: "¿Cuánto tarda en cargar?", answer: "EcoFlow publica 0–80 % en aproximadamente 89 minutos mediante entrada AC bajo condiciones de laboratorio.", audience: "customer", confidence: "confirmed_external" }
    ],
    sources: [
      { sourceType: "physical_photo", title: "Fotografía EcoFlow DELTA 3 Ultra", supports: ["marca", "diseño", "salida indicada"], confidence: "confirmed_nexo" },
      { sourceType: "manufacturer", title: "EcoFlow DELTA 3 Ultra Portable Power Station", url: "https://us.ecoflow.com/products/ecoflow-delta-3-ultra-portable-power-station-3072wh", supports: ["3072 Wh", "3600 W", "LFP", "UPS", "carga", "entrada solar"], confidence: "confirmed_external" },
      { sourceType: "manufacturer", title: "EcoFlow DELTA 3 Ultra Series", url: "https://us.ecoflow.com/products/delta-3-ultra-series-portable-power-station", supports: ["diferencias entre Ultra y Ultra Plus", "expansión"], confidence: "confirmed_external" }
    ],
    salesPlaybook: { benefits: ["Gran capacidad para apagones prolongados", "Salida de 3600 W", "UPS rápida", "Control por aplicación"], idealCustomer: ["Hogares que necesitan respaldar varios equipos", "Pequeños negocios y trabajo profesional"], sellingPoints: ["Más capacidad y potencia que una estación portátil de 1 kWh"], objections: [{ objection: "¿Mantiene toda la casa?", answer: "La duración depende de las cargas conectadas; se recomienda calcular consumo y autonomía antes de comprar.", confidence: "confirmed_external" }], warnings: ["No anunciar expansión de baterías: la unidad es DELTA 3 Ultra estándar, no Plus.", "La garantía local ofrecida por el proveedor es distinta de la garantía del fabricante y debe comunicarse por separado."] }, gaps: []
  },
  {
    id: "pk_lamp_led_usb_30w", woocommerceProductId: 1064, sku: "NEXO-LAMPARA-LED-30W", brand: null, model: null,
    aliases: ["lámpara LED 30W", "bombillo recargable", "lámpara USB", "luz de emergencia con gancho"], productType: "Lámpara LED recargable",
    summary: "Lámpara LED genérica recargable por USB con gancho y tres modos. La potencia de 30 W procede del proveedor; batería, lúmenes, autonomía y grado IP son desconocidos.", customerDescription: "Iluminación portátil recargable para apagones, patios y actividades al aire libre, con gancho y tres modos de luz.", confidence: "probable",
    specs: [
      { name: "Carga", value: "USB", confidence: "confirmed_nexo", evidence: "Material gráfico y descripción del proveedor" },
      { name: "Modos de iluminación", value: "3", confidence: "confirmed_nexo", evidence: "Texto visible en la imagen" },
      { name: "Gancho", value: "integrado", confidence: "confirmed_nexo", evidence: "Fotografía del producto" },
      { name: "Potencia anunciada", value: "30", unit: "W", confidence: "probable", evidence: "Descripción del proveedor; sin etiqueta técnica" }
    ],
    faq: [
      { question: "¿Cuánto dura encendida?", answer: "La autonomía no está especificada y depende del modo seleccionado y del estado de la batería.", audience: "customer", confidence: "unknown" },
      { question: "¿Es resistente al agua?", answer: "No existe un grado IP verificable, por lo que no debe exponerse a lluvia o inmersión.", audience: "customer", confidence: "unknown" },
      { question: "¿Son 30 W reales?", answer: "Es la potencia anunciada por el proveedor; falta una etiqueta técnica para confirmarla.", audience: "gestora", confidence: "probable" }
    ],
    sources: [{ sourceType: "physical_photo", title: "Material gráfico de la lámpara LED recargable", supports: ["forma", "gancho", "carga USB", "tres modos"], confidence: "confirmed_nexo" }],
    salesPlaybook: { benefits: ["Iluminación durante apagones", "Carga USB", "Gancho para colgar", "Tres modos"], idealCustomer: ["Hogares que buscan iluminación auxiliar económica", "Camping, patios y trabajo móvil"], sellingPoints: ["Formato sencillo, ligero y recargable"], objections: [{ objection: "¿Cuántas horas dura?", answer: "El proveedor no especifica la batería ni la autonomía; no debe prometerse una duración concreta.", confidence: "unknown" }], warnings: ["No afirmar lúmenes, autonomía, capacidad de batería, resistencia al agua o golpes."] },
    gaps: [{ question: "¿Cuál es la capacidad de batería, autonomía, lúmenes, tiempo de carga y grado IP?", requiredEvidence: "Foto de la etiqueta técnica, caja o manual", priority: "high" }]
  },
  {
    id: "pk_ocedar_easywring", woocommerceProductId: 1066, sku: "NEXO-OCEDAR-EASYWRING", brand: "O-Cedar", model: "EasyWring",
    aliases: ["O-Cedar EasyWring", "fregona O-Cedar", "trapeador giratorio", "spin mop", "cubeta con pedal"], productType: "Sistema de fregona giratoria",
    summary: "Sistema O-Cedar EasyWring con cubeta, pedal de escurrido, mango telescópico de hasta 51 pulgadas y cabezal de microfibra reutilizable.", customerDescription: "Fregona giratoria con pedal para controlar la humedad sin escurrir la mopa con las manos.", confidence: "confirmed_external",
    specs: [
      { name: "Sistema", value: "cubeta con escurrido giratorio por pedal", confidence: "confirmed_external", evidence: "O-Cedar oficial" },
      { name: "Mango", value: "telescópico hasta 51 pulgadas", confidence: "confirmed_external", evidence: "O-Cedar oficial" },
      { name: "Cabezal", value: "microfibra reutilizable y lavable", confidence: "confirmed_external", evidence: "O-Cedar oficial" },
      { name: "Forma del cabezal", value: "triangular, giro de 360°", confidence: "confirmed_external", evidence: "O-Cedar oficial" },
      { name: "Pisos compatibles", value: "superficies duras selladas, incluida madera sellada, cerámica, laminado y vinilo", confidence: "confirmed_external", evidence: "O-Cedar oficial" }
    ],
    faq: [
      { question: "¿Sirve para madera?", answer: "Sí, para madera sellada compatible con limpieza húmeda. Debe escurrirse bien y seguir las instrucciones del piso.", audience: "customer", confidence: "confirmed_external" },
      { question: "¿La mopa se puede lavar?", answer: "Sí. O-Cedar indica lavado a mano o máquina, sin suavizante ni lejía, y secado en plano.", audience: "customer", confidence: "confirmed_external" },
      { question: "¿Mata el 99 % de las bacterias?", answer: "No debe afirmarse que las mata. O-Cedar declara que la microfibra retira más del 99 % de E. coli y Staph. aureus con agua bajo condiciones de laboratorio.", audience: "gestora", confidence: "confirmed_external" }
    ],
    sources: [
      { sourceType: "physical_photo", title: "Fotografías O-Cedar EasyWring", supports: ["marca", "línea", "cubeta", "pedal", "cabezal"], confidence: "confirmed_nexo" },
      { sourceType: "manufacturer", title: "O-Cedar EasyWring Spin Mop & Bucket System", url: "https://www.ocedar.com/p/mops/spin-mops/easywring-spin-mop-bucket-system/", supports: ["contenido", "mango de 51 pulgadas", "pisos compatibles", "pedal"], confidence: "confirmed_external" },
      { sourceType: "manufacturer", title: "O-Cedar EasyWring Mop Head Replacement", url: "https://www.ocedar.com/p/refills/mop-refills/easywring-spin-mop-refill/", supports: ["microfibra", "lavado", "retirada de bacterias"], confidence: "confirmed_external" }
    ],
    salesPlaybook: { benefits: ["Escurrido sin usar las manos", "Control de humedad", "Microfibra lavable", "Acceso a esquinas"], idealCustomer: ["Hogares con distintos tipos de pisos sellados", "Personas que buscan reducir el contacto con el agua sucia"], sellingPoints: ["El pedal permite decidir qué tan húmeda queda la mopa"], objections: [{ objection: "¿Sirve para madera?", answer: "Sí, sobre madera sellada y usando la mopa bien escurrida.", confidence: "confirmed_external" }], warnings: ["No decir que mata bacterias; el fabricante habla de retirar bacterias bajo condiciones de prueba."] }, gaps: []
  }
];

function aliasKeys(seed: ProductKnowledgeSeed) {
  return [...new Set([seed.id, seed.sku ?? "", seed.brand ?? "", seed.model ?? "", String(seed.woocommerceProductId ?? ""), ...seed.aliases].filter(Boolean).map(normalizeKnowledgeIdentifier))];
}

async function upsertSeed(seed: ProductKnowledgeSeed) {
  await db().query(
    `INSERT INTO nexo_product_knowledge(id,woocommerce_product_id,sku,brand,model,aliases,alias_keys,product_type,summary,customer_description,confidence,specs,faq,sales_playbook)
     VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb)
     ON CONFLICT(id) DO UPDATE SET woocommerce_product_id=EXCLUDED.woocommerce_product_id,sku=EXCLUDED.sku,brand=EXCLUDED.brand,model=EXCLUDED.model,
       aliases=EXCLUDED.aliases,alias_keys=EXCLUDED.alias_keys,product_type=EXCLUDED.product_type,summary=EXCLUDED.summary,
       customer_description=EXCLUDED.customer_description,confidence=EXCLUDED.confidence,specs=EXCLUDED.specs,faq=EXCLUDED.faq,
       sales_playbook=EXCLUDED.sales_playbook,updated_at=NOW()`,
    [seed.id, seed.woocommerceProductId, seed.sku, seed.brand, seed.model, JSON.stringify(seed.aliases), aliasKeys(seed), seed.productType, seed.summary, seed.customerDescription, seed.confidence, JSON.stringify(seed.specs), JSON.stringify(seed.faq), JSON.stringify(seed.salesPlaybook)]
  );
  await db().query("DELETE FROM nexo_product_knowledge_sources WHERE product_knowledge_id=$1", [seed.id]);
  for (const source of seed.sources) await db().query("INSERT INTO nexo_product_knowledge_sources(product_knowledge_id,source_type,title,url,supports,confidence) VALUES($1,$2,$3,$4,$5::jsonb,$6)", [seed.id, source.sourceType, source.title, source.url ?? null, JSON.stringify(source.supports), source.confidence]);
  for (const gap of seed.gaps) await db().query(`INSERT INTO nexo_product_knowledge_gaps(product_knowledge_id,question,required_evidence,priority,resolved) VALUES($1,$2,$3,$4,FALSE) ON CONFLICT(product_knowledge_id,question) DO UPDATE SET required_evidence=EXCLUDED.required_evidence,priority=EXCLUDED.priority`, [seed.id, gap.question, gap.requiredEvidence, gap.priority]);
}

export async function seedInitialKnowledge() {
  await ensureKnowledgeSchema();
  seedsReady ??= (async () => { for (const seed of initialKnowledgeSeeds) await upsertSeed(seed); })();
  return seedsReady;
}

async function hydrate(row: KnowledgeRow): Promise<ProductKnowledgeRecord> {
  const [sources, gaps] = await Promise.all([
    db().query<KnowledgeSourceRow>("SELECT source_type,title,url,supports,confidence,consulted_at FROM nexo_product_knowledge_sources WHERE product_knowledge_id=$1 ORDER BY id", [row.id]),
    db().query<KnowledgeGapRow>("SELECT question,required_evidence,priority,resolved,resolved_at FROM nexo_product_knowledge_gaps WHERE product_knowledge_id=$1 ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,id", [row.id])
  ]);
  return { ...row, sources: sources.rows, gaps: gaps.rows };
}

export async function listProductKnowledge(limit = 50) {
  await seedInitialKnowledge();
  const result = await db().query<Pick<KnowledgeRow, "id" | "woocommerce_product_id" | "sku" | "brand" | "model" | "aliases" | "product_type" | "summary" | "confidence" | "updated_at" | "verified_at">>(`SELECT id,woocommerce_product_id,sku,brand,model,aliases,product_type,summary,confidence,updated_at,verified_at FROM nexo_product_knowledge ORDER BY brand NULLS LAST,product_type,id LIMIT $1`, [Math.min(100, Math.max(1, limit))]);
  return result.rows;
}

export async function getProductKnowledge(identifier: string): Promise<ProductKnowledgeRecord | AmbiguousKnowledgeResult | null> {
  await seedInitialKnowledge();
  const key = normalizeKnowledgeIdentifier(identifier);
  const numericId = /^\d+$/.test(identifier.trim()) ? Number(identifier.trim()) : null;
  const result = await db().query<KnowledgeRow>(`SELECT * FROM nexo_product_knowledge WHERE id=$1 OR LOWER(COALESCE(sku,''))=LOWER($2) OR $3=ANY(alias_keys) OR ($4::bigint IS NOT NULL AND woocommerce_product_id=$4) ORDER BY CASE WHEN id=$1 THEN 0 WHEN LOWER(COALESCE(sku,''))=LOWER($2) THEN 1 ELSE 2 END LIMIT 2`, [identifier, identifier, key, numericId]);
  if (!result.rowCount) return null;
  if ((result.rowCount ?? 0) > 1) return { ambiguous: true, matches: result.rows.map((row) => ({ id: row.id, sku: row.sku, brand: row.brand, model: row.model, summary: row.summary })) };
  return hydrate(result.rows[0]);
}

export async function getProductFaq(identifier: string, audience: KnowledgeAudience = "customer") {
  const knowledge = await getProductKnowledge(identifier);
  if (!knowledge || "ambiguous" in knowledge) return knowledge;
  return { id: knowledge.id, sku: knowledge.sku, audience, faq: knowledge.faq.filter((item) => item.audience === audience || (audience !== "customer" && item.audience === "customer")) };
}

export async function buildProductKnowledgeContext(identifier: string, options: { includeCommerce?: boolean; audience?: KnowledgeAudience } = {}) {
  const knowledge = await getProductKnowledge(identifier);
  if (!knowledge || "ambiguous" in knowledge) return knowledge;
  const audience = options.audience ?? "customer";
  const faq = knowledge.faq.filter((item) => item.audience === audience || (audience !== "customer" && item.audience === "customer"));
  let commerce: Record<string, unknown> | null = null;
  if (options.includeCommerce && knowledge.woocommerce_product_id && wooConfigured()) {
    try {
      const product = await getWooProduct(Number(knowledge.woocommerce_product_id));
      commerce = { source: "woocommerce-live", id: product.id, sku: product.sku, name: product.name, price: product.price, regularPrice: product.regular_price, stockStatus: product.stock_status, purchasable: product.purchasable, status: product.status, checkedAt: new Date().toISOString() };
    } catch (error) {
      commerce = { source: "woocommerce-live", error: error instanceof Error ? error.message : "WooCommerce lookup failed", checkedAt: new Date().toISOString() };
    }
  }
  return {
    identity: { id: knowledge.id, woocommerceProductId: knowledge.woocommerce_product_id, sku: knowledge.sku, brand: knowledge.brand, model: knowledge.model, productType: knowledge.product_type, aliases: knowledge.aliases },
    confidence: knowledge.confidence, summary: knowledge.summary, customerDescription: knowledge.customer_description, specs: knowledge.specs, faq,
    salesPlaybook: audience === "customer" ? undefined : knowledge.sales_playbook, sources: knowledge.sources, gaps: knowledge.gaps, commerce,
    rules: { priceAndStockSource: "WooCommerce live only", probableMustNotBePresentedAsConfirmed: true, unresolvedGapsMustNotBeInvented: true }
  };
}
