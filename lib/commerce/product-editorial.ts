export type EditorialProduct = {
  displayName: string;
  shortDescription: string;
  longDescription: string;
  keyBenefits: Array<{ title: string; detail: string }>;
  faq: Array<{ question: string; answer: string }>;
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
  "esta ficha reúne",
  "para que puedas compararlo",
  "disponibilidad operativa",
  "qué características están confirmadas",
];

type CustomerContent = Pick<
  EditorialProduct,
  "longDescription" | "keyBenefits" | "faq"
>;
const identityLabels = new Set(["marca", "modelo", "sku"]);
function normalizeCopy(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}
export function validateEditorial(product: EditorialProduct) {
  const errors: string[] = [];
  if (
    normalizeCopy(product.shortDescription) ===
    normalizeCopy(product.longDescription)
  )
    errors.push("La descripción breve y la larga están duplicadas.");
  if (
    product.keyBenefits.some((item) =>
      identityLabels.has(normalizeCopy(item.title)),
    )
  )
    errors.push("Marca, modelo y SKU no pueden presentarse como beneficios.");
  if (containsProhibitedCopy(product))
    errors.push("La ficha contiene lenguaje interno o meta.");
  const uniqueBenefits = new Set(
    product.keyBenefits.map((item) =>
      normalizeCopy(`${item.title} ${item.detail}`),
    ),
  );
  if (uniqueBenefits.size !== product.keyBenefits.length)
    errors.push("Hay características principales duplicadas.");
  return errors;
}
const customerContent: Record<string, CustomerContent> = {
  "Colchón KONFORT 120 × 190 cm": {
    longDescription:
      "Una opción de 120 × 190 cm para completar una cama de tres cuartos y aprovechar mejor el espacio de una habitación. Su superficie acolchada ofrece una terminación uniforme y agradable al tacto. Antes de comprar, comprueba que la base de la cama admita exactamente esta medida; la composición interna y el nivel de firmeza no se publican hasta disponer de la etiqueta técnica correspondiente.",
    keyBenefits: [
      {
        title: "Tamaño de tres cuartos",
        detail: "Medida de 120 × 190 cm para bases compatibles.",
      },
      {
        title: "Superficie acolchada",
        detail: "Terminación uniforme visible en la cubierta.",
      },
      {
        title: "Formato práctico",
        detail:
          "Adecuado cuando se busca más amplitud que una cama personal sin ocupar el espacio de una cama mayor.",
      },
    ],
    faq: [
      {
        question: "¿Qué medida debe tener la base?",
        answer: "La base debe admitir un colchón de 120 × 190 cm.",
      },
      {
        question: "¿Qué firmeza tiene?",
        answer:
          "La firmeza y la composición interna no están especificadas en la información disponible.",
      },
    ],
  },
  "Colchón KONFORT 135 × 190 cm": {
    longDescription:
      "Colchón de 135 × 190 cm pensado para una base camero o full compatible. La cubierta acolchada aporta una superficie uniforme y una presentación limpia para dormitorios principales o habitaciones con espacio suficiente. Comprueba las medidas interiores de la cama antes de pedirlo; la fotografía representa la misma línea KONFORT, mientras que la medida y el precio corresponden exclusivamente a esta variante. La composición interna y la firmeza no se indican sin una etiqueta técnica legible.",
    keyBenefits: [
      {
        title: "Formato camero",
        detail: "Medida de 135 × 190 cm para bases compatibles.",
      },
      {
        title: "Mayor superficie",
        detail: "Ofrece más ancho que la variante de 120 cm.",
      },
      {
        title: "Acabado acolchado",
        detail: "Cubierta con terminación uniforme visible.",
      },
    ],
    faq: [
      {
        question: "¿La foto corresponde a esta medida?",
        answer:
          "La imagen representa la misma línea KONFORT; esta variante mide 135 × 190 cm.",
      },
      {
        question: "¿Se conoce la firmeza?",
        answer:
          "La firmeza y la composición interna no están especificadas en la información disponible.",
      },
    ],
  },
  "Cocina de gas Royal de 2 hornillas": {
    longDescription:
      "Cocina de mesa para preparar dos alimentos a la vez en espacios donde se utiliza gas LPG. Las dos hornillas permiten distribuir recipientes de uso cotidiano y el encendido automático simplifica el inicio de la cocción. Su superficie de vidrio templado ofrece una apariencia limpia. Antes de instalarla, confirma que la conexión, el regulador y el espacio disponible sean compatibles con el equipo.",
    keyBenefits: [
      {
        title: "Cocción simultánea",
        detail: "Dos hornillas para preparar más de un alimento.",
      },
      {
        title: "Encendido automático",
        detail: "Inicio de la llama desde los controles del equipo.",
      },
      {
        title: "Formato de mesa",
        detail:
          "Diseñada para colocarse sobre una superficie estable y compatible.",
      },
      {
        title: "Cubierta de vidrio",
        detail: "Superficie de vidrio templado con acabado limpio.",
      },
    ],
    faq: [
      {
        question: "¿Qué combustible utiliza?",
        answer: "La información del modelo indica uso con gas LPG.",
      },
      {
        question: "¿Tiene encendido automático?",
        answer: "Sí, el modelo REG202V se presenta con encendido automático.",
      },
    ],
  },
  "Panel solar Boviet de 620 W": {
    longDescription:
      "Módulo fotovoltaico de alta potencia para integrar en sistemas solares diseñados por un instalador. Su construcción bifacial puede aprovechar radiación en ambas caras cuando el montaje y el entorno lo permiten, mientras el doble vidrio protege la estructura del módulo. La compatibilidad con inversor, controlador, soportes, cableado y cantidad de paneles debe calcularse para cada instalación; el panel por sí solo no constituye un sistema eléctrico completo.",
    keyBenefits: [
      {
        title: "Potencia nominal de 620 W",
        detail:
          "Capacidad del módulo bajo condiciones de ensayo especificadas por el fabricante.",
      },
      {
        title: "Tecnología bifacial",
        detail:
          "Puede captar radiación por la cara posterior en montajes compatibles.",
      },
      {
        title: "Construcción de doble vidrio",
        detail: "Diseño estructural pensado para proteger las celdas.",
      },
      {
        title: "132 medias celdas",
        detail: "Configuración interna declarada para el modelo.",
      },
    ],
    faq: [
      {
        question: "¿Incluye inversor o batería?",
        answer:
          "No. La ficha corresponde al panel; los demás componentes se seleccionan por separado.",
      },
      {
        question: "¿Puedo conectarlo directamente a un equipo?",
        answer:
          "Debe integrarse en un sistema compatible y dimensionado por una persona calificada.",
      },
    ],
  },
  "Refrigerador con dispensador de agua": {
    longDescription:
      "Refrigerador de dos puertas con congelador superior para organizar alimentos frescos y congelados en compartimentos separados. El dispensador frontal permite servir agua sin abrir la puerta principal, una función práctica para el uso diario. Su acabado plateado se adapta a cocinas contemporáneas. La capacidad, el consumo, el voltaje y el tipo de enfriamiento deben confirmarse en la placa del equipo antes de tomar una decisión basada en esos datos.",
    keyBenefits: [
      {
        title: "Dos compartimentos",
        detail: "Separa refrigeración y congelación en puertas independientes.",
      },
      {
        title: "Dispensador frontal",
        detail: "Permite acceder al agua sin abrir la puerta principal.",
      },
      {
        title: "Congelador superior",
        detail: "Mantiene la zona de congelados a una altura accesible.",
      },
    ],
    faq: [
      {
        question: "¿Es No Frost o inverter?",
        answer:
          "Esas funciones no están especificadas en la información disponible.",
      },
      {
        question: "¿Qué capacidad tiene?",
        answer:
          "La capacidad debe confirmarse en la placa o ficha exacta del equipo.",
      },
    ],
  },
  "Ventilador solar recargable Royal": {
    longDescription:
      "Ventilador compacto de 12 pulgadas pensado para mantener circulación de aire durante cortes eléctricos. Puede recargarse y utiliza el panel solar incluido como alternativa de alimentación; además incorpora dos bombillos LED para iluminación auxiliar. Su tamaño facilita colocarlo en dormitorios o espacios pequeños. La duración de la batería depende de la velocidad, el estado de carga y las condiciones de uso, por lo que no se publica una autonomía fija como garantía.",
    keyBenefits: [
      {
        title: "Respaldo recargable",
        detail: "Permite usar el ventilador cuando falta la corriente.",
      },
      {
        title: "Carga solar",
        detail: "Incluye panel para recarga en condiciones adecuadas.",
      },
      {
        title: "Iluminación auxiliar",
        detail: "Incluye dos bombillos LED para el hogar.",
      },
      {
        title: "Formato compacto",
        detail: "Diámetro de 12 pulgadas para espacios reducidos.",
      },
    ],
    faq: [
      {
        question: "¿Incluye panel solar?",
        answer: "Sí, el conjunto incluye panel solar y dos bombillos LED.",
      },
      {
        question: "¿Cuánto dura la batería?",
        answer:
          "La duración varía según la velocidad, la carga disponible y el estado de la batería.",
      },
    ],
  },
  "Ventilador recargable GWELL de pedestal": {
    longDescription:
      "Ventilador de pedestal de 16 pulgadas para mover aire a una altura cómoda en salas y habitaciones. Su batería recargable ofrece respaldo durante apagones y el panel solar incluido permite una alternativa de carga. El control remoto facilita los ajustes a distancia y los dos bombillos LED aportan iluminación auxiliar. La autonomía real depende de la velocidad seleccionada, el nivel de carga y el estado de la batería.",
    keyBenefits: [
      {
        title: "Ventilación de pedestal",
        detail: "Formato de 16 pulgadas para salas o habitaciones.",
      },
      {
        title: "Uso durante apagones",
        detail: "Batería recargable para mantener la ventilación.",
      },
      {
        title: "Carga solar incluida",
        detail: "Panel solar como alternativa de recarga.",
      },
      {
        title: "Control a distancia",
        detail: "Incluye control remoto para los ajustes disponibles.",
      },
    ],
    faq: [
      {
        question: "¿Incluye control remoto?",
        answer: "Sí, incluye control remoto, panel solar y dos bombillos LED.",
      },
      {
        question: "¿Funciona conectado a la corriente?",
        answer:
          "La información disponible indica alimentación AC/DC y mediante panel solar.",
      },
    ],
  },
  "Licuadora Hamilton Beach": {
    longDescription:
      "Licuadora de uso doméstico con jarra transparente y cinco controles frontales para seleccionar la función disponible según la preparación. La base blanca ofrece una presentación sencilla para la cocina y la jarra permite observar la mezcla durante el trabajo. Es una opción para batidos y preparaciones compatibles con una licuadora doméstica. La potencia, la capacidad exacta y los accesorios deben confirmarse mediante el número de modelo.",
    keyBenefits: [
      {
        title: "Cinco controles",
        detail: "Selección frontal de las funciones disponibles.",
      },
      {
        title: "Jarra transparente",
        detail: "Permite observar la preparación mientras se mezcla.",
      },
      {
        title: "Uso doméstico",
        detail: "Formato práctico para preparaciones cotidianas compatibles.",
      },
    ],
    faq: [
      {
        question: "¿Qué potencia tiene?",
        answer:
          "La potencia no está especificada sin identificar el modelo exacto.",
      },
      {
        question: "¿Cuántas velocidades tiene?",
        answer: "El equipo fotografiado presenta cinco controles frontales.",
      },
    ],
  },
  "Aire acondicionado split Parker": {
    longDescription:
      "Sistema de climatización tipo split compuesto por unidad interior y exterior. Este formato separa la evaporadora del compresor exterior y permite climatizar una habitación cuando la capacidad del equipo es adecuada para el espacio. Antes de comprar o instalar, es imprescindible comprobar en la placa técnica el modelo, los BTU, el voltaje, el refrigerante y el consumo; esos datos no se deducen de la apariencia del producto.",
    keyBenefits: [
      {
        title: "Configuración split",
        detail: "Unidad interior y exterior separadas para climatización fija.",
      },
      {
        title: "Instalación en pared",
        detail:
          "La unidad interior está diseñada para montaje compatible por un técnico.",
      },
      {
        title: "Conjunto completo visible",
        detail: "La presentación incluye unidad interior y unidad exterior.",
      },
    ],
    faq: [
      {
        question: "¿Cuántos BTU tiene?",
        answer:
          "La capacidad no está especificada sin consultar la placa técnica del equipo.",
      },
      {
        question: "¿Es inverter?",
        answer:
          "Esa característica no está confirmada en la información disponible.",
      },
    ],
  },
  "Decodificador digital HD": {
    longDescription:
      "Receptor compacto para conectar una señal de televisión digital a un televisor mediante HDMI. El puerto USB y el control remoto forman parte de los elementos visibles del conjunto. Puede resultar útil cuando el televisor necesita un receptor externo compatible. Antes de comprar, confirma el estándar de transmisión utilizado en tu zona y las conexiones de tu televisor, porque la marca, el modelo y los formatos compatibles no están identificados en la evidencia disponible.",
    keyBenefits: [
      {
        title: "Salida HDMI",
        detail: "Conexión digital para televisores compatibles.",
      },
      {
        title: "Puerto USB visible",
        detail: "Conector disponible en el equipo fotografiado.",
      },
      {
        title: "Control remoto",
        detail: "Permite operar el receptor a distancia.",
      },
    ],
    faq: [
      {
        question: "¿Funciona con la televisión digital de Cuba?",
        answer:
          "La compatibilidad no puede garantizarse hasta identificar el modelo y su estándar de recepción.",
      },
      {
        question: "¿Incluye control remoto?",
        answer: "Sí, el conjunto fotografiado incluye control remoto.",
      },
    ],
  },
  "Televisor Philco de 43 pulgadas": {
    longDescription:
      "Televisor de 43 pulgadas pensado para disfrutar televisión, películas y contenido de equipos compatibles en una pantalla Full HD. El tamaño puede resultar cómodo para una sala o habitación con una distancia de visualización adecuada. Las conexiones HDMI y USB 2.0 permiten enlazar dispositivos compatibles, mientras Dolby Audio aporta procesamiento de sonido integrado. No se publican funciones Smart TV, conectividad inalámbrica, cantidad de puertos ni compatibilidad de montaje hasta disponer del manual o de fotografías claras de la unidad.",
    keyBenefits: [
      {
        title: "Pantalla de 43 pulgadas",
        detail: "Formato cómodo para sala o habitación.",
      },
      {
        title: "Resolución Full HD",
        detail: "Imagen detallada para televisión y contenido compatible.",
      },
      {
        title: "Conexión HDMI",
        detail:
          "Permite conectar decodificadores, consolas o computadoras compatibles.",
      },
      {
        title: "Puerto USB 2.0",
        detail: "Conexión para dispositivos USB compatibles.",
      },
      {
        title: "Dolby Audio",
        detail: "Tecnología de procesamiento de sonido integrada.",
      },
    ],
    faq: [
      {
        question: "¿Es Smart TV?",
        answer: "Esa función no está confirmada para la unidad disponible.",
      },
      {
        question: "¿Puede instalarse en la pared?",
        answer:
          "La compatibilidad y medida VESA deben verificarse en la parte trasera o el manual del equipo.",
      },
    ],
  },
};

const catalog: Record<string, EditorialProduct> = {
  "NEXO-KONFORT-120X190": product(
    "Colchón KONFORT 120 × 190 cm",
    "Formato de tres cuartos con superficie acolchada para una base compatible.",
    [
      ["Marca", "KONFORT"],
      ["Medida", "120 × 190 cm"],
      ["Formato", "3/4"],
      ["Acabado", "Acolchado"],
    ],
    ["colchon", "konfort", "120x190", "120 × 190", "tres cuartos"],
    "Colchón KONFORT 120 × 190 cm | NEXO",
    "Compra el colchón KONFORT de 120 × 190 cm con acabado acolchado. Elige entrega a domicilio o recogida al completar tu pedido.",
  ),
  "NEXO-KONFORT-135X190": product(
    "Colchón KONFORT 135 × 190 cm",
    "Formato camero con superficie acolchada para una base compatible.",
    [
      ["Marca", "KONFORT"],
      ["Medida", "135 × 190 cm"],
      ["Formato", "Camero / full"],
      ["Acabado", "Acolchado"],
    ],
    ["colchon", "konfort", "135x190", "135 × 190", "camero", "full"],
    "Colchón KONFORT 135 × 190 cm | NEXO",
    "Compra el colchón KONFORT de 135 × 190 cm con acabado acolchado. Elige entrega a domicilio o recogida al completar tu pedido.",
  ),
  "NEXO-ROYAL-REG202V": product(
    "Cocina de gas Royal de 2 hornillas",
    "Dos hornillas, encendido automático y superficie de vidrio templado para cocinar con gas LPG.",
    [
      ["Marca", "Royal"],
      ["Modelo", "REG202V"],
      ["Hornillas", "2"],
      ["Encendido", "Automático"],
      ["Combustible", "Gas LPG"],
      ["Superficie", "Vidrio templado"],
    ],
    ["cocina", "royal", "REG202V", "dos hornillas", "2 hornillas", "gas"],
    "Cocina Royal REG202V de 2 hornillas | NEXO",
    "Compra la cocina de gas Royal REG202V con dos hornillas, encendido automático y superficie de vidrio templado. Entrega o recogida con NEXO.",
  ),
  "NEXO-BOVIET-BVM8611M-620": product(
    "Panel solar Boviet de 620 W",
    "Módulo bifacial N-Type de 620 W, doble vidrio y 132 medias celdas para sistemas solares compatibles.",
    [
      ["Marca", "Boviet"],
      ["Modelo", "BVM8611M-620R-H-HC-BF-DG"],
      ["Potencia", "620 W"],
      ["Tecnología", "Bifacial N-Type"],
      ["Construcción", "Doble vidrio"],
      ["Celdas", "132 medias celdas"],
    ],
    [
      "panel solar",
      "boviet",
      "620w",
      "620 W",
      "bifacial",
      "n-type",
      "doble vidrio",
    ],
    "Panel solar Boviet bifacial de 620 W | NEXO",
    "Compra el panel solar Boviet bifacial N-Type de 620 W, con doble vidrio y 132 medias celdas para sistemas solares compatibles.",
  ),
  "NEXO-FRIDGE-WD": product(
    "Refrigerador con dispensador de agua",
    "Dos puertas, congelador superior y dispensador frontal para organizar alimentos y acceder al agua con facilidad.",
    [
      ["Tipo", "Dos puertas"],
      ["Congelador", "Superior"],
      ["Acabado", "Plateado"],
      ["Dispensador", "Agua"],
    ],
    [
      "refrigerador",
      "nevera",
      "dos puertas",
      "dispensador de agua",
      "plateado",
    ],
    "Refrigerador con dispensador de agua | NEXO",
    "Compra un refrigerador plateado de dos puertas con congelador superior y dispensador frontal de agua. Entrega o recogida con NEXO.",
  ),
  "NEXO-RA123SL": product(
    "Ventilador solar recargable Royal",
    "Respaldo recargable de 12 pulgadas con panel solar y dos bombillos LED incluidos.",
    [
      ["Marca", "Royal"],
      ["Modelo", "RA123SL"],
      ["Diámetro", "12 pulgadas"],
      ["Alimentación", "Batería recargable y panel solar"],
      ["Incluye", "Panel solar y 2 bombillos LED"],
    ],
    [
      "ventilador",
      "royal",
      "RA123SL",
      "12 pulgadas",
      "bombillos",
      "panel solar",
    ],
    "Ventilador solar Royal RA123SL de 12″ | NEXO",
    "Compra el ventilador solar recargable Royal RA123SL de 12 pulgadas, con panel solar y dos bombillos LED. Entrega o recogida con NEXO.",
  ),
  "NEXO-GF-8816": product(
    "Ventilador recargable GWELL de pedestal",
    "Ventilación de pedestal de 16 pulgadas con respaldo recargable, panel solar, control remoto y dos bombillos LED.",
    [
      ["Marca", "GWELL"],
      ["Modelo", "GF-8816"],
      ["Diámetro", "16 pulgadas"],
      ["Alimentación", "AC/DC y panel solar"],
      ["Incluye", "Control remoto y 2 bombillos LED"],
    ],
    [
      "ventilador",
      "gwell",
      "GF-8816",
      "16 pulgadas",
      "pedestal",
      "panel solar",
    ],
    "Ventilador GWELL GF-8816 recargable | NEXO",
    "Compra el ventilador recargable GWELL GF-8816 de pedestal, con panel solar, control remoto y dos bombillos LED. Entrega con NEXO.",
  ),
  "NEXO-HB-BLENDER-WHITE": product(
    "Licuadora Hamilton Beach",
    "Jarra transparente, base blanca y cinco controles frontales para preparaciones domésticas.",
    [
      ["Marca", "Hamilton Beach"],
      ["Color", "Blanco"],
      ["Controles", "5"],
      ["Jarra", "Transparente"],
    ],
    [
      "licuadora",
      "hamilton beach",
      "blanca",
      "5 velocidades",
      "cinco controles",
    ],
    "Licuadora Hamilton Beach blanca | NEXO",
    "Compra la licuadora Hamilton Beach blanca con jarra transparente y cinco controles frontales. Entrega o recogida con NEXO.",
  ),
  "NEXO-PARKER-SPLIT": product(
    "Aire acondicionado split Parker",
    "Sistema split compuesto por unidad interior y exterior para una instalación fija compatible.",
    [
      ["Marca", "Parker"],
      ["Tipo", "Split"],
      ["Incluye", "Unidad interior y unidad exterior"],
    ],
    [
      "aire acondicionado",
      "split",
      "parker",
      "unidad interior",
      "unidad exterior",
    ],
    "Aire acondicionado split Parker | NEXO",
    "Compra el aire acondicionado split Parker con unidad interior y unidad exterior. Elige entrega a domicilio o recogida con NEXO.",
  ),
  "NEXO-DIGITAL-HD": product(
    "Decodificador digital HD",
    "Receptor compacto para televisión digital con salida HDMI, puerto USB y control remoto.",
    [
      ["Tipo", "Receptor de televisión digital"],
      ["Conexión", "HDMI"],
      ["Puerto", "USB"],
      ["Incluye", "Control remoto"],
    ],
    [
      "decodificador",
      "digital hd",
      "television",
      "HDMI",
      "USB",
      "control remoto",
    ],
    "Decodificador digital HD con HDMI | NEXO",
    "Compra un decodificador digital HD con salida HDMI, puerto USB y control remoto. Entrega o recogida al completar tu pedido en NEXO.",
  ),
  "NEXO-PH43HDCE": product(
    "Televisor Philco de 43 pulgadas",
    "Disfruta películas, series y televisión en una pantalla Full HD de 43 pulgadas, con conexiones HDMI y USB y sonido Dolby Audio.",
    [
      ["Marca", "Philco"],
      ["Modelo", "PH43HDCE"],
      ["Pantalla", "43 pulgadas"],
      ["Resolución", "Full HD"],
      ["Conexiones", "HDMI y USB 2.0"],
      ["Audio", "Dolby Audio"],
    ],
    [
      "televisor",
      "philco",
      "PH43HDCE",
      "43 pulgadas",
      "full hd",
      "HDMI",
      "USB",
    ],
    "Televisor Philco PH43HDCE de 43″ | NEXO",
    "Compra el televisor Philco PH43HDCE de 43 pulgadas con Full HD, HDMI, USB 2.0 y Dolby Audio. Entrega o recogida con NEXO.",
  ),
};

function product(
  displayName: string,
  shortDescription: string,
  specifications: string[][],
  searchAliases: string[],
  seoTitle: string,
  metaDescription: string,
): EditorialProduct {
  const normalized = specifications.map(([label, value]) => ({ label, value }));
  const content = customerContent[displayName];
  if (!content)
    throw new Error(`Falta contenido editorial para ${displayName}`);
  const editorial: EditorialProduct = {
    displayName,
    shortDescription,
    ...content,
    specifications: normalized,
    searchAliases,
    seoTitle,
    metaDescription,
    imageAlt: displayName,
  };
  const errors = validateEditorial(editorial);
  if (errors.length) throw new Error(`${displayName}: ${errors.join(" ")}`);
  return editorial;
}

export function editorialFor(product: { sku?: string; name?: string }) {
  return product.sku ? catalog[product.sku.trim()] : undefined;
}

export function applyEditorial<
  T extends {
    sku?: string;
    name: string;
    short_description?: string;
    description?: string;
    images?: Array<Record<string, unknown>>;
  },
>(
  product: T,
): T & {
  search_text?: string;
  seo?: Pick<EditorialProduct, "seoTitle" | "metaDescription">;
} {
  const editorial = editorialFor(product);
  if (!editorial) return product;
  const description = `<p>${editorial.longDescription}</p><dl>${editorial.specifications.map(({ label, value }) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
  return {
    ...product,
    name: editorial.displayName,
    short_description: `<p>${editorial.shortDescription}</p>`,
    description,
    images: product.images?.map((image, index) =>
      index === 0 ? { ...image, alt: editorial.imageAlt } : image,
    ),
    search_text: [
      editorial.displayName,
      product.name,
      product.sku,
      ...editorial.searchAliases,
      ...editorial.specifications.flatMap((s) => [s.label, s.value]),
    ]
      .filter(Boolean)
      .join(" "),
    seo: {
      seoTitle: editorial.seoTitle,
      metaDescription: editorial.metaDescription,
    },
  };
}

export function containsProhibitedCopy(value: unknown) {
  const text = JSON.stringify(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return PROHIBITED_PUBLIC_COPY.some((phrase) =>
    text.includes(phrase.normalize("NFD").replace(/[\u0300-\u036f]/g, "")),
  );
}
