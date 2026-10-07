// Recepción de un producto: estados, qué falta, siguiente paso y la carga
// que se envía a Core. Puro (sin red ni DOM) para poder probarlo.

export const KINDS = {
  new: { label: "Producto nuevo", hint: "No existe todavía en Core." },
  restock: { label: "Reposición", hint: "Llegaron más unidades de un producto que ya existe. Se suman." },
  correction: { label: "Corrección de existencias", hint: "El conteo físico no cuadra. Se fija la cifra contada." },
};

// Estado del contenido (el de la ficha y lo comercial).
export const STAGES = [
  ["reception", "Recepción"],
  ["data_pending", "Datos pendientes"],
  ["sheet_confirmed", "Ficha confirmada"],
  ["content_in_production", "Contenido en producción"],
  ["review", "Revisión"],
  ["ready", "Listo para distribuir"],
];
export const STAGE_LABEL = Object.fromEntries(STAGES);

// Estado de sincronización con Core: independiente del contenido.
export const SYNC_LABEL = {
  local: "Solo en este dispositivo",
  sending: "Enviando a Core…",
  synced: "Guardado en Core",
  failed: "Sin guardar en Core",
};

export const STEPS = ["tipo", "fotos", "datos", "revisar", "resultado"];

const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

export function newDraft(config, kind = null) {
  const now = new Date().toISOString();
  return {
    id: uid(),
    businessId: config.businessId,
    kind,
    createdAt: now,
    updatedAt: now,
    photos: [],
    product: { name: "", category: "", description: "", sku: "", price: "", currency: config.defaultCurrency },
    hasVariants: false,
    variants: [{ key: uid(), label: "", quantity: "" }],
    quantity: "",
    target: null,
    // Fuente de cada dato confirmado: "person" (lo escribió alguien) o "ai" (sugerido y aceptado).
    sources: {},
    aiSuggestions: {},
    confirmedAt: null,
    sync: { status: "local", attempts: [], result: null },
  };
}

/** "12,50" | "1.250,50" | "1,250.50" | "12" -> unidades menores (1250). null si no es válido. */
export function parseMoney(text) {
  const s = String(text ?? "").trim().replace(/\s/g, "");
  if (!/^\d[\d.,]*$/.test(s)) return null;
  // Separador decimal: el último signo si lo siguen 1 o 2 cifras; los demás son de miles.
  const dec = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
  const decimals = dec > -1 && /^\d{1,2}$/.test(s.slice(dec + 1)) ? s.slice(dec + 1) : "";
  const whole = (decimals ? s.slice(0, dec) : s).replace(/[.,]/g, "");
  const n = Math.round(Number(`${whole}.${decimals || 0}`) * 100);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatMoney(minor, currency) {
  return `${(minor / 100).toLocaleString("es", { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 })} ${currency}`;
}

/** Entero ≥ 0 o null. */
export function parseQty(text) {
  const s = String(text ?? "").trim();
  return /^\d{1,6}$/.test(s) ? Number(s) : null;
}

/** Lo que falta para poder confirmar la ficha, en frases para la persona. */
export function missing(draft) {
  const out = [];
  if (!draft.kind) return ["Elige qué llegó: producto nuevo, reposición o corrección"];
  if (draft.kind === "new") {
    if (draft.photos.length === 0) out.push("Al menos una foto del producto");
    if (draft.product.name.trim().length < 2) out.push("El nombre del producto");
    if (parseMoney(draft.product.price) === null) out.push("El precio de venta");
    if (draft.hasVariants) {
      const labels = draft.variants.map((v) => v.label.trim().toLowerCase());
      if (draft.variants.length === 0) out.push("Al menos una variante");
      if (labels.some((l) => !l)) out.push("El nombre de cada variante (color, talla…)");
      if (new Set(labels).size !== labels.length) out.push("Variantes con nombres distintos");
      if (draft.variants.some((v) => parseQty(v.quantity) === null)) out.push("La cantidad recibida de cada variante (0 si no llegó)");
      else if (draft.variants.every((v) => parseQty(v.quantity) === 0)) out.push("Al menos una unidad recibida");
    } else if (!(parseQty(draft.quantity) >= 1)) {
      out.push("La cantidad recibida");
    }
  } else {
    if (!draft.target) return ["El producto de Core al que corresponde"];
    const field = draft.kind === "restock" ? "quantity" : "counted";
    const lines = draft.target.lines;
    if (lines.some((l) => String(l[field] ?? "").trim() !== "" && parseQty(l[field]) === null)) out.push("Cantidades en números enteros");
    const filled = lines.filter((l) => parseQty(l[field]) !== null && (draft.kind === "correction" || parseQty(l[field]) > 0));
    if (filled.length === 0) out.push(draft.kind === "restock" ? "Cuántas unidades llegaron" : "La cantidad contada");
  }
  return out;
}

/** Estado del contenido según el borrador y lo que respondió Core. */
export function stage(draft) {
  if (draft.sync.status === "synced") return draft.sync.result?.contentStatus ?? "sheet_confirmed";
  if (draft.confirmedAt) return "sheet_confirmed";
  const touched = draft.kind && (draft.photos.length || draft.product.name || draft.target);
  return touched ? "data_pending" : "reception";
}

/** El siguiente paso y la única acción principal. */
export function nextStep(draft) {
  if (!draft.kind) return { step: "tipo", action: "Elegir qué llegó" };
  if (draft.sync.status === "synced") return { step: "resultado", action: "Ver qué quedó guardado" };
  const m = missing(draft);
  if (draft.kind === "new" && draft.photos.length === 0) return { step: "fotos", action: "Añadir fotos" };
  if (m.length) return { step: "datos", action: "Completar datos" };
  if (draft.sync.status === "failed") return { step: "revisar", action: "Reintentar guardar en Core" };
  return { step: "revisar", action: "Confirmar ficha y guardar en Core" };
}

/** Carga para nexo_business_intake_commit (contrato en docs/nexo-business/DIGITALIZA_CORE_CONTRACT.md). */
export function toCommitPayload(draft, photoRefs = []) {
  const m = missing(draft);
  if (m.length) throw new Error("Faltan datos: " + m.join(", "));
  const base = {
    id: draft.id,
    kind: draft.kind,
    sheet: {
      fields: {
        name: draft.product.name.trim() || draft.target?.name || null,
        category: draft.product.category.trim() || null,
        description: draft.product.description.trim() || null,
        sku: draft.product.sku.trim() || null,
        priceMinor: parseMoney(draft.product.price),
        currency: draft.product.currency,
      },
      sources: draft.sources,
      confirmedAt: draft.confirmedAt,
    },
    aiSuggestions: draft.aiSuggestions,
    photos: photoRefs,
  };
  if (draft.kind === "new") {
    return {
      ...base,
      product: {
        name: draft.product.name.trim(),
        category: draft.product.category.trim() || null,
        sku: draft.product.sku.trim() || null,
        prices: { [draft.product.currency]: parseMoney(draft.product.price) },
      },
      lines: draft.hasVariants
        ? draft.variants.map((v) => ({ label: v.label.trim(), quantity: parseQty(v.quantity) }))
        : [{ label: null, quantity: parseQty(draft.quantity) }],
    };
  }
  const field = draft.kind === "restock" ? "quantity" : "counted";
  return {
    ...base,
    lines: draft.target.lines
      .filter((l) => parseQty(l[field]) !== null && (draft.kind === "correction" || parseQty(l[field]) > 0))
      .map((l) => ({ productId: l.productId, [field]: parseQty(l[field]) })),
  };
}

/** Agrupa el catálogo de Core como lo ve la persona: un producto con sus variantes. */
export function groupCatalog(products) {
  const groups = new Map();
  for (const p of products) {
    const key = p.variantOf ?? p.productId;
    const name = p.variantOf ? p.name.split(" — ")[0] : p.name;
    if (!groups.has(key)) groups.set(key, { groupId: key, name, category: p.category, imageUrl: p.imageUrl, items: [] });
    groups.get(key).items.push(p);
  }
  return [...groups.values()];
}

/** Elige un producto de Core como destino de una reposición o corrección. */
export function targetFrom(group) {
  return {
    groupId: group.groupId,
    name: group.name,
    lines: group.items.map((p) => ({ productId: p.productId, label: p.variantLabel, stock: p.stock,
      stockAuthority: p.stockAuthority, quantity: "", counted: "" })),
  };
}

/** Lo que sigue pendiente después de guardar en Core (bloques siguientes). */
export function pendingAfterSync(draft) {
  const out = [];
  if (draft.kind === "new") {
    out.push("Imágenes comerciales (bloque 2)");
    out.push("Textos por canal: web, gestoras, Instagram/Facebook, Revolico, estados de WhatsApp (bloque 2)");
    out.push("Video vertical (bloque 3)");
    out.push("Foto y ficha en la web casaviva.company: la publica la dueña");
  }
  if (draft.sync.result?.lines?.some((l) => l.stockAuthority === "external")) {
    out.push("Registrar también la entrada en BizneCubano: la importación de cada hora vuelve a poner su cifra");
  }
  return out;
}
