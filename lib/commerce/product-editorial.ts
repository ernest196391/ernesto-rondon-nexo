export type EditorialProduct = {
  displayName: string;
  shortDescription: string;
  longDescription: string;
  specifications: Array<{ label: string; value: string }>;
  searchAliases: string[];
  seoTitle: string;
  metaDescription: string;
  imageAlt: string;
};

export const PROHIBITED_PUBLIC_COPY = [
  "pendiente de validación",
  "pendientes de validación",
  "pendiente de verificación",
  "pendientes de verificación",
  "pendiente de confirmación",
  "sujeto a confirmación",
  "confirmaremos disponibilidad",
  "confirmaremos existencia y precio",
  "nexo verifica",
  "coincidencia fuerte",
  "ficha verificada",
];

const catalog: Record<string, EditorialProduct> = {
  "NEXO-KONFORT-120X190": product("Colchón KONFORT 120 × 190 cm", "Colchón KONFORT de 120 × 190 cm con acabado acolchado para cama de 3/4.", [["Marca", "KONFORT"], ["Medida", "120 × 190 cm"], ["Formato", "3/4"], ["Acabado", "Acolchado"]], ["colchon", "konfort", "120x190", "120 × 190", "tres cuartos"], "Colchón KONFORT 120 × 190 cm | NEXO", "Compra el colchón KONFORT de 120 × 190 cm con acabado acolchado. Elige entrega a domicilio o recogida al completar tu pedido."),
  "NEXO-KONFORT-135X190": product("Colchón KONFORT 135 × 190 cm", "Colchón KONFORT de 135 × 190 cm con acabado acolchado para cama camero o full.", [["Marca", "KONFORT"], ["Medida", "135 × 190 cm"], ["Formato", "Camero / full"], ["Acabado", "Acolchado"]], ["colchon", "konfort", "135x190", "135 × 190", "camero", "full"], "Colchón KONFORT 135 × 190 cm | NEXO", "Compra el colchón KONFORT de 135 × 190 cm con acabado acolchado. Elige entrega a domicilio o recogida al completar tu pedido."),
  "NEXO-ROYAL-REG202V": product("Cocina de gas Royal de 2 hornillas", "Cocina de mesa Royal con dos hornillas, encendido automático y superficie de vidrio templado.", [["Marca", "Royal"], ["Modelo", "REG202V"], ["Hornillas", "2"], ["Encendido", "Automático"], ["Combustible", "Gas LPG"], ["Superficie", "Vidrio templado"]], ["cocina", "royal", "REG202V", "dos hornillas", "2 hornillas", "gas"], "Cocina Royal REG202V de 2 hornillas | NEXO", "Compra la cocina de gas Royal REG202V con dos hornillas, encendido automático y superficie de vidrio templado. Entrega o recogida con NEXO."),
  "NEXO-BOVIET-BVM8611M-620": product("Panel solar Boviet de 620 W", "Panel solar bifacial N-Type de 620 W con doble vidrio y 132 medias celdas.", [["Marca", "Boviet"], ["Modelo", "BVM8611M-620R-H-HC-BF-DG"], ["Potencia", "620 W"], ["Tecnología", "Bifacial N-Type"], ["Construcción", "Doble vidrio"], ["Celdas", "132 medias celdas"]], ["panel solar", "boviet", "620w", "620 W", "bifacial", "n-type", "doble vidrio"], "Panel solar Boviet bifacial de 620 W | NEXO", "Compra el panel solar Boviet bifacial N-Type de 620 W, con doble vidrio y 132 medias celdas para sistemas solares compatibles."),
  "NEXO-FRIDGE-WD": product("Refrigerador con dispensador de agua", "Refrigerador plateado de dos puertas con congelador superior y dispensador frontal de agua.", [["Tipo", "Dos puertas"], ["Congelador", "Superior"], ["Acabado", "Plateado"], ["Dispensador", "Agua"]], ["refrigerador", "nevera", "dos puertas", "dispensador de agua", "plateado"], "Refrigerador con dispensador de agua | NEXO", "Compra un refrigerador plateado de dos puertas con congelador superior y dispensador frontal de agua. Entrega o recogida con NEXO."),
  "NEXO-RA123SL": product("Ventilador solar recargable Royal", "Ventilador recargable de 12 pulgadas con panel solar y dos bombillos LED incluidos.", [["Marca", "Royal"], ["Modelo", "RA123SL"], ["Diámetro", "12 pulgadas"], ["Alimentación", "Batería recargable y panel solar"], ["Incluye", "Panel solar y 2 bombillos LED"]], ["ventilador", "royal", "RA123SL", "12 pulgadas", "bombillos", "panel solar"], "Ventilador solar Royal RA123SL de 12″ | NEXO", "Compra el ventilador solar recargable Royal RA123SL de 12 pulgadas, con panel solar y dos bombillos LED. Entrega o recogida con NEXO."),
  "NEXO-GF-8816": product("Ventilador recargable GWELL de pedestal", "Ventilador de pedestal de 16 pulgadas con panel solar, control remoto y dos bombillos LED.", [["Marca", "GWELL"], ["Modelo", "GF-8816"], ["Diámetro", "16 pulgadas"], ["Alimentación", "AC/DC y panel solar"], ["Incluye", "Control remoto y 2 bombillos LED"]], ["ventilador", "gwell", "GF-8816", "16 pulgadas", "pedestal", "panel solar"], "Ventilador GWELL GF-8816 recargable | NEXO", "Compra el ventilador recargable GWELL GF-8816 de pedestal, con panel solar, control remoto y dos bombillos LED. Entrega con NEXO."),
  "NEXO-HB-BLENDER-WHITE": product("Licuadora Hamilton Beach", "Licuadora Hamilton Beach con jarra transparente, base blanca y cinco controles frontales.", [["Marca", "Hamilton Beach"], ["Color", "Blanco"], ["Controles", "5"], ["Jarra", "Transparente"]], ["licuadora", "hamilton beach", "blanca", "5 velocidades", "cinco controles"], "Licuadora Hamilton Beach blanca | NEXO", "Compra la licuadora Hamilton Beach blanca con jarra transparente y cinco controles frontales. Entrega o recogida con NEXO."),
  "NEXO-PARKER-SPLIT": product("Aire acondicionado split Parker", "Sistema de climatización Parker con unidad interior tipo split y unidad exterior.", [["Marca", "Parker"], ["Tipo", "Split"], ["Incluye", "Unidad interior y unidad exterior"]], ["aire acondicionado", "split", "parker", "unidad interior", "unidad exterior"], "Aire acondicionado split Parker | NEXO", "Compra el aire acondicionado split Parker con unidad interior y unidad exterior. Elige entrega a domicilio o recogida con NEXO."),
  "NEXO-DIGITAL-HD": product("Decodificador digital HD", "Receptor compacto para televisión digital con salida HDMI, puerto USB y control remoto.", [["Tipo", "Receptor de televisión digital"], ["Conexión", "HDMI"], ["Puerto", "USB"], ["Incluye", "Control remoto"]], ["decodificador", "digital hd", "television", "HDMI", "USB", "control remoto"], "Decodificador digital HD con HDMI | NEXO", "Compra un decodificador digital HD con salida HDMI, puerto USB y control remoto. Entrega o recogida al completar tu pedido en NEXO."),
  "NEXO-PH43HDCE": product("Televisor Philco de 43 pulgadas", "Televisor Philco de 43 pulgadas con imagen Full HD, HDMI, USB 2.0 y Dolby Audio.", [["Marca", "Philco"], ["Modelo", "PH43HDCE"], ["Pantalla", "43 pulgadas"], ["Resolución", "Full HD"], ["Conexiones", "HDMI y USB 2.0"], ["Audio", "Dolby Audio"]], ["televisor", "philco", "PH43HDCE", "43 pulgadas", "full hd", "HDMI", "USB"], "Televisor Philco PH43HDCE de 43″ | NEXO", "Compra el televisor Philco PH43HDCE de 43 pulgadas con Full HD, HDMI, USB 2.0 y Dolby Audio. Entrega o recogida con NEXO."),
};

function product(displayName: string, shortDescription: string, specifications: string[][], searchAliases: string[], seoTitle: string, metaDescription: string): EditorialProduct {
  return { displayName, shortDescription, longDescription: shortDescription, specifications: specifications.map(([label, value]) => ({ label, value })), searchAliases, seoTitle, metaDescription, imageAlt: displayName };
}

export function editorialFor(product: { sku?: string; name?: string }) {
  return product.sku ? catalog[product.sku.trim()] : undefined;
}

export function applyEditorial<T extends { sku?: string; name: string; short_description?: string; description?: string; images?: Array<Record<string, unknown>> }>(product: T): T & { search_text?: string; seo?: Pick<EditorialProduct, "seoTitle" | "metaDescription"> } {
  const editorial = editorialFor(product);
  if (!editorial) return product;
  const description = `<p>${editorial.longDescription}</p><dl>${editorial.specifications.map(({ label, value }) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
  return {
    ...product,
    name: editorial.displayName,
    short_description: `<p>${editorial.shortDescription}</p>`,
    description,
    images: product.images?.map((image, index) => index === 0 ? { ...image, alt: editorial.imageAlt } : image),
    search_text: [editorial.displayName, product.name, product.sku, ...editorial.searchAliases, ...editorial.specifications.flatMap((s) => [s.label, s.value])].filter(Boolean).join(" "),
    seo: { seoTitle: editorial.seoTitle, metaDescription: editorial.metaDescription },
  };
}

export function containsProhibitedCopy(value: unknown) {
  const text = JSON.stringify(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return PROHIBITED_PUBLIC_COPY.some((phrase) => text.includes(phrase.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
}
