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
  "Inversor Solar Híbrido SUMRY 4000W 24V 120V con MPPT": {
    longDescription: "Inversor solar híbrido para sistemas de respaldo de 24 V que convierte la energía del banco de baterías en corriente alterna de 120 V. Su salida de onda sinusoidal pura permite alimentar equipos compatibles, mientras el controlador MPPT integrado gestiona el aporte de paneles solares. Puede combinar energía solar, batería y red según la configuración de la instalación. La autonomía no depende solo del inversor: debe calcularse con la capacidad de las baterías, el consumo simultáneo y la producción solar disponible.",
    keyBenefits: [
      { title: "Respaldo de alta potencia", detail: "Potencia nominal de 4000 W para cargas compatibles dentro de un sistema correctamente dimensionado." },
      { title: "Onda sinusoidal pura", detail: "Entrega una forma de onda adecuada para electrodomésticos y equipos electrónicos compatibles." },
      { title: "Gestión híbrida", detail: "Permite integrar paneles solares, baterías y alimentación de red." },
      { title: "Controlador MPPT", detail: "Aprovecha la entrada fotovoltaica y gestiona la carga solar del banco de baterías." },
    ],
    faq: [
      { question: "¿Sirve cuando se va la corriente?", answer: "Sí, cuando se instala con un banco de baterías, protecciones y cableado correctamente dimensionados." },
      { question: "¿Incluye baterías o paneles solares?", answer: "No. Esta ficha corresponde al inversor; las baterías, paneles y demás componentes se seleccionan por separado." },
      { question: "¿Cuántas horas mantiene una casa?", answer: "No existe una duración fija. Depende de la capacidad útil de las baterías, la potencia consumida y el aporte solar." },
      { question: "¿Puede alimentar un refrigerador?", answer: "Puede alimentar refrigeradores compatibles, pero deben verificarse el consumo nominal y la potencia de arranque antes de dimensionar el sistema." },
    ],
  },
  "BLUETTI Elite 100 V2 — Estación de Energía 1024Wh 1800W": {
    longDescription: "Estación de energía portátil con batería LiFePO₄ de 1024 Wh y salida de 1800 W para mantener dispositivos y equipos compatibles durante apagones, viajes o trabajo fuera de la red. Reúne batería, inversor y sistema de carga en una sola unidad, con salidas AC, USB y DC. Admite recarga mediante corriente y paneles solares compatibles. La autonomía real varía según la carga conectada y las pérdidas de conversión.",
    keyBenefits: [
      { title: "1024 Wh de capacidad", detail: "Reserva energética útil para iluminación, comunicaciones y equipos compatibles." },
      { title: "Salida de 1800 W", detail: "Permite conectar cargas de mayor demanda dentro de los límites del equipo." },
      { title: "Batería LiFePO₄", detail: "Química LFP orientada a seguridad y larga vida útil." },
      { title: "Carga rápida y solar", detail: "Puede recargarse por corriente y mediante paneles solares compatibles." },
    ],
    faq: [
      { question: "¿Puede alimentar un refrigerador?", answer: "Puede hacerlo si el consumo continuo y el pico de arranque del refrigerador están dentro de la capacidad del equipo." },
      { question: "¿Cuánto dura una carga?", answer: "Depende de los watts consumidos. Una carga de 100 W dura mucho más que una de 1000 W; también existen pérdidas de conversión." },
      { question: "¿Incluye panel solar?", answer: "No se anuncia un panel incluido en esta oferta. La estación es compatible con paneles adecuados, vendidos por separado." },
      { question: "¿Tiene tomacorrientes de 120 V?", answer: "Sí. La variante mostrada incorpora cuatro salidas AC de 120 V." },
    ],
  },
  "EcoFlow DELTA 3 Ultra — Estación de Energía 3072Wh 3600W": {
    longDescription: "Estación de energía portátil de gran capacidad para respaldo doméstico y trabajo exigente. Integra una batería LFP de 3072 Wh, salida nominal de 3600 W y transferencia UPS inferior a 10 ms. Admite carga por corriente, energía solar, generador compatible y vehículo, y permite supervisión mediante la aplicación EcoFlow. Esta ficha corresponde a DELTA 3 Ultra estándar; no debe confundirse con DELTA 3 Ultra Plus.",
    keyBenefits: [
      { title: "3072 Wh de capacidad", detail: "Mayor reserva energética para apagones prolongados y varias cargas compatibles." },
      { title: "Salida nominal de 3600 W", detail: "Gestiona electrodomésticos y herramientas dentro de los límites indicados por EcoFlow." },
      { title: "Transferencia UPS rápida", detail: "Cambio automático inferior a 10 ms para equipos compatibles." },
      { title: "Control inteligente", detail: "Monitoreo y ajustes mediante Wi‑Fi, Bluetooth y la aplicación EcoFlow." },
    ],
    faq: [
      { question: "¿Se puede ampliar con baterías adicionales?", answer: "La DELTA 3 Ultra estándar no se anuncia como ampliable. La expansión corresponde a variantes Plus; verifica siempre el nombre exacto." },
      { question: "¿Cuánto tarda en cargar?", answer: "EcoFlow publica aproximadamente 89 minutos para alcanzar 80 % mediante entrada AC en condiciones de laboratorio. El tiempo real puede variar." },
      { question: "¿Puede funcionar como UPS?", answer: "Sí. EcoFlow indica transferencia automática inferior a 10 ms para cargas compatibles." },
      { question: "¿Incluye panel solar?", answer: "No se anuncia panel incluido en esta oferta. Admite hasta 800 W de entrada solar con una configuración compatible." },
    ],
  },
  "Lámpara LED Recargable USB 30W con Gancho — 3 Modos": {
    longDescription: "Lámpara LED portátil con batería recargable por USB, gancho superior y tres modos de iluminación. Su formato permite colgarla durante apagones, en patios, campamentos o zonas de trabajo. El proveedor anuncia 30 W; no se especifican la capacidad de batería, los lúmenes, el tiempo de carga, la autonomía ni un grado IP, por lo que esas prestaciones no se presentan como garantizadas.",
    keyBenefits: [
      { title: "Recargable por USB", detail: "Puede volver a cargarse sin utilizar pilas desechables." },
      { title: "Tres modos de luz", detail: "Permite seleccionar entre las intensidades disponibles." },
      { title: "Gancho integrado", detail: "Facilita colgarla para iluminar una zona desde arriba." },
      { title: "Formato portátil", detail: "Útil como iluminación auxiliar durante apagones y actividades al aire libre." },
    ],
    faq: [
      { question: "¿Cuánto dura encendida?", answer: "La autonomía no está especificada y varía según el modo de iluminación y el estado de la batería." },
      { question: "¿Es resistente al agua?", answer: "No se informa un grado IP verificable, por lo que no debe exponerse a lluvia o inmersión." },
      { question: "¿Incluye cable de carga?", answer: "La imagen del proveedor muestra carga USB, pero el contenido exacto del paquete debe comprobarse al recibir la unidad." },
      { question: "¿Los 30 W están verificados?", answer: "Los 30 W son la potencia anunciada por el proveedor; no se dispone de una etiqueta técnica legible para validarla." },
    ],
  },
  "Fregona Giratoria O-Cedar EasyWring con Cubeta y Pedal": {
    longDescription: "Sistema de limpieza O-Cedar EasyWring con fregona de microfibra, cubeta y pedal de escurrido. El giro accionado con el pie permite controlar la humedad sin tocar la mopa con las manos. El cabezal triangular ayuda a alcanzar esquinas y el mango telescópico se ajusta hasta aproximadamente 51 pulgadas. Está diseñado para pisos duros sellados como cerámica, madera sellada, laminado y vinilo.",
    keyBenefits: [
      { title: "Escurrido sin usar las manos", detail: "El pedal activa el giro para retirar el exceso de agua." },
      { title: "Control de humedad", detail: "Cuantas más veces se acciona el pedal, más seca queda la mopa." },
      { title: "Cabezal para esquinas", detail: "La forma triangular facilita limpiar bordes y zonas difíciles." },
      { title: "Microfibra reutilizable", detail: "El cabezal se puede lavar y volver a utilizar siguiendo las instrucciones de cuidado." },
    ],
    faq: [
      { question: "¿Sirve para pisos de madera?", answer: "Sí, para madera sellada compatible con limpieza húmeda. Conviene escurrir bien la mopa y seguir las indicaciones del fabricante del piso." },
      { question: "¿Hay que escurrirla con las manos?", answer: "No. El pedal hace girar el sistema de escurrido dentro de la cubeta." },
      { question: "¿La mopa es lavable?", answer: "Sí. O-Cedar indica que el repuesto de microfibra es reutilizable y lavable; no recomienda suavizante ni lejía." },
      { question: "¿Qué incluye el sistema?", answer: "Incluye cubeta EasyWring, mango telescópico y cabezal de microfibra." },
    ],
  },
  "Contadora de Billetes LOLARAN AL1000 con Detector de Falsos": {
    longDescription: "La LOLARAN AL1000 está diseñada para agilizar el conteo diario de efectivo en tiendas, oficinas y otros negocios. Procesa hasta 1.000 billetes por minuto, permite calcular el valor de una denominación seleccionada y ofrece modos por lotes y acumulación. Sus sensores UV, MG, MT, IR y DD ayudan a detectar billetes sospechosos. La pantalla LCD y el visor externo permiten que operador y cliente consulten el resultado. No clasifica automáticamente un fajo con denominaciones mezcladas y la detección no sustituye una revisión profesional.",
    keyBenefits: [
      { title: "Conteo rápido", detail: "Procesa hasta 1.000 billetes por minuto." },
      { title: "Control de billetes", detail: "Integra detección UV, MG, MT, IR y DD." },
      { title: "Trabajo por lotes", detail: "Funciones Batch y Add para organizar y acumular conteos." },
      { title: "Resultado visible", detail: "Pantalla LCD y display externo para atención al cliente." },
    ],
    faq: [
      { question: "¿Cuenta dólares y euros?", answer: "Sí, la documentación del modelo indica compatibilidad con USD y EUR." },
      { question: "¿Reconoce denominaciones mezcladas?", answer: "No. El cálculo de valor se realiza seleccionando previamente una denominación; los billetes mezclados deben separarse." },
      { question: "¿Garantiza que un billete sea auténtico?", answer: "Sus sensores ayudan a señalar billetes sospechosos, pero no reemplazan una comprobación profesional." },
    ],
  },
  "Aspiradora de Mano Inalámbrica USB con Accesorios": {
    longDescription: "Aspiradora compacta para retirar polvo, migas y residuos ligeros en el automóvil, el hogar o la oficina. Su formato inalámbrico facilita el acceso a asientos, teclados, esquinas y otros espacios estrechos. Se recarga mediante USB e incluye las boquillas, el cepillo y la manguera flexible visibles en el conjunto. El depósito transparente permite observar la suciedad recogida y el filtro desmontable facilita el mantenimiento. La marca, potencia, batería, autonomía y fuerza de succión no están identificadas en la evidencia disponible.",
    keyBenefits: [
      { title: "Uso inalámbrico", detail: "Limpieza rápida sin depender de un cable durante el uso." },
      { title: "Carga por USB", detail: "Recarga práctica mediante una fuente USB compatible." },
      { title: "Acceso a rincones", detail: "Incluye boquillas, cepillo y manguera para zonas estrechas." },
      { title: "Formato portátil", detail: "Ligera y fácil de guardar en casa o en el automóvil." },
    ],
    faq: [
      { question: "¿Sirve para líquidos?", answer: "No hay evidencia suficiente para recomendarla como aspiradora de líquidos." },
      { question: "¿Cuánto dura la batería?", answer: "La capacidad y autonomía no aparecen especificadas." },
      { question: "¿Incluye accesorios?", answer: "Sí. Las imágenes muestran boquillas, cepillo, manguera y cable de carga." },
    ],
  },
  "Timbre Inteligente LUMIVAULT X3PRO con Cámara HD": {
    longDescription: "El LUMIVAULT X3PRO permite observar y hablar con visitantes desde un teléfono compatible. Integra cámara HD, visión nocturna, audio bidireccional y avisos mediante aplicación, además de un receptor interior incluido. Su alimentación recargable o mediante USB facilita una instalación sin cableado permanente. Para recibir alertas remotas necesita una red Wi‑Fi y conexión a Internet estables. La resolución exacta, capacidad de batería, autonomía, aplicación requerida, alcance real y grado de protección no están confirmados.",
    keyBenefits: [
      { title: "Atención desde el móvil", detail: "Permite ver y conversar con visitantes mediante una aplicación compatible." },
      { title: "Visión nocturna", detail: "Ayuda a observar la entrada cuando hay poca iluminación." },
      { title: "Audio bidireccional", detail: "Comunicación de voz entre el usuario y la persona en la puerta." },
      { title: "Instalación sencilla", detail: "Formato inalámbrico con receptor interior incluido." },
    ],
    faq: [
      { question: "¿Necesita Internet?", answer: "Sí para alertas y visualización remota desde la aplicación." },
      { question: "¿Incluye receptor interior?", answer: "Sí, el conjunto fotografiado incluye un receptor de sonido interior." },
      { question: "¿Puede instalarse a la intemperie?", answer: "No se ha confirmado un grado IP; debe protegerse de lluvia directa hasta verificarlo." },
    ],
  },
  "Módem Portátil Logic ML8 4G LTE Wi‑Fi": {
    longDescription: "El Logic ML8 convierte una tarjeta SIM compatible en una red Wi‑Fi portátil para teléfonos, tabletas y computadoras. Su batería de 2500 mAh ofrece entre 4 y 6 horas de navegación según Logic, dependiendo de la red y del número de equipos conectados. Admite hasta 10 usuarios Wi‑Fi y redes 4G LTE y 3G en las bandas indicadas por el fabricante. Antes de comprar, comprueba que las bandas del operador y la tarjeta SIM sean compatibles; el equipo comparte la conexión disponible, pero no crea saldo ni mejora una señal débil.",
    keyBenefits: [
      { title: "Internet compartido", detail: "Crea una red Wi‑Fi desde una tarjeta SIM y señal móvil compatibles." },
      { title: "Hasta 10 equipos", detail: "Permite conectar simultáneamente teléfonos, tabletas y computadoras." },
      { title: "Batería portátil", detail: "Logic publica de 4 a 6 horas de navegación según las condiciones de uso." },
      { title: "Amplia compatibilidad LTE", detail: "Admite las bandas 4G y 3G especificadas por el fabricante." },
    ],
    faq: [
      { question: "¿Incluye un plan de Internet?", answer: "No. Necesita una tarjeta SIM compatible con servicio de datos activo." },
      { question: "¿Cuántos equipos se pueden conectar?", answer: "Logic indica hasta 10 usuarios Wi‑Fi simultáneos." },
      { question: "¿Cuánto dura la batería?", answer: "El fabricante publica entre 4 y 6 horas; la duración real depende de la señal, la red y la cantidad de usuarios." },
      { question: "¿Funciona con cualquier compañía?", answer: "Depende de las bandas, la cobertura y la configuración de la tarjeta SIM del operador." },
    ],
  },
  "Impresora 3D Bambu Lab A1 Combo con AMS Lite": {
    longDescription: "La Bambu Lab A1 Combo es una impresora 3D de escritorio con calibración automática y AMS Lite incluido para trabajar con hasta cuatro colores o materiales compatibles. Su volumen de construcción de 256 × 256 × 256 mm permite producir prototipos, piezas funcionales y proyectos creativos. El fabricante declara una aceleración máxima de 10.000 mm/s², nivelación automática de la cama y funcionamiento por debajo de 48 dB en modo silencioso. El paquete fotografiado incluye la impresora, AMS Lite y kit de lámpara LED; las bobinas mostradas son ilustrativas.",
    keyBenefits: [
      { title: "Impresión multicolor", detail: "El AMS Lite admite hasta cuatro bobinas compatibles en un mismo proyecto." },
      { title: "Calibración automática", detail: "Automatiza tareas de ajuste y nivelación antes de imprimir." },
      { title: "Volumen de 256 mm", detail: "Área de construcción de 256 × 256 × 256 mm para proyectos variados." },
      { title: "Modo silencioso", detail: "Bambu Lab publica menos de 48 dB en el modo correspondiente." },
    ],
    faq: [
      { question: "¿Incluye el AMS Lite?", answer: "Sí. La oferta corresponde al conjunto A1 Combo con AMS Lite." },
      { question: "¿Incluye filamento?", answer: "Las bobinas de la fotografía son ilustrativas; el contenido exacto de filamento debe verificarse al recibir la unidad." },
      { question: "¿Qué tamaño puede imprimir?", answer: "El volumen de construcción oficial es de 256 × 256 × 256 mm." },
      { question: "¿Necesita montaje?", answer: "Requiere instalación inicial y seguir la guía oficial antes de la primera impresión." },
    ],
  },
  "Mochila Compacta de Poliéster para Viajes y Uso Diario": {
    longDescription: "Mochila compacta de diseño liso para transportar objetos personales en la escuela, el gimnasio, paseos y desplazamientos diarios. Cuenta con cierre de cremallera, asa superior, correas para los hombros y bolsillo frontal. El proveedor la describe como impermeable, pero la evidencia disponible no incluye una clasificación IP ni una prueba de inmersión; por seguridad se presenta como resistente a salpicaduras ligeras. La capacidad, dimensiones exactas y carga máxima no están especificadas.",
    keyBenefits: [
      { title: "Formato compacto", detail: "Fácil de llevar para actividades cotidianas y viajes cortos." },
      { title: "Bolsillo frontal", detail: "Permite separar objetos pequeños del compartimento principal." },
      { title: "Cierre con cremallera", detail: "Ayuda a mantener el contenido organizado durante el traslado." },
      { title: "Diseño sencillo", detail: "Acabado liso adecuado para escuela, gimnasio o uso diario." },
    ],
    faq: [
      { question: "¿Es completamente impermeable?", answer: "No se dispone de una clasificación IP; se recomienda protegerla de lluvia intensa y no sumergirla." },
      { question: "¿Qué capacidad tiene?", answer: "La capacidad en litros y las dimensiones exactas no están especificadas." },
      { question: "¿Qué colores hay disponibles?", answer: "El proveedor anuncia amarillo, azul y rosado; la disponibilidad debe elegirse al coordinar el pedido." },
    ],
  },
  "Cinturón Térmico Portátil con Calor y Vibración": {
    longDescription: "Cinturón térmico recargable para aplicar calor localizado en el abdomen o la zona lumbar. La unidad fotografiada incorpora pantalla, tres niveles anunciados de 45, 55 y 65 °C, ajuste de vibración, correa elástica y puerto USB‑C. Está pensado para aportar calor y comodidad temporal, no para diagnosticar ni tratar enfermedades. Debe utilizarse sobre la ropa, comenzar con el nivel más bajo y suspender el uso si provoca irritación, dolor o mareo. No debe usarse mientras se duerme ni sobre piel lesionada o con sensibilidad reducida.",
    keyBenefits: [
      { title: "Tres niveles de calor", detail: "Permite elegir entre 45, 55 y 65 °C según el material gráfico." },
      { title: "Vibración ajustable", detail: "Añade estimulación por vibración durante el uso." },
      { title: "Carga USB‑C", detail: "Puerto visible para recargar el dispositivo con una fuente compatible." },
      { title: "Correa regulable", detail: "Facilita colocarlo sobre el abdomen o la zona lumbar." },
    ],
    faq: [
      { question: "¿Se coloca directamente sobre la piel?", answer: "No. Debe utilizarse sobre la ropa y comenzar con la temperatura más baja." },
      { question: "¿Qué temperaturas ofrece?", answer: "El material gráfico de esta unidad muestra 45, 55 y 65 °C." },
      { question: "¿Cuánto dura la batería?", answer: "La capacidad y la autonomía no están especificadas." },
      { question: "¿Cura el dolor menstrual o de espalda?", answer: "No es un tratamiento médico. El calor puede aportar comodidad temporal, pero un dolor intenso o persistente requiere valoración profesional." },
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
  "NEXO-SUMRY-4000W-24V": product(
    "Inversor Solar Híbrido SUMRY 4000W 24V 120V con MPPT",
    "Inversor híbrido de onda sinusoidal pura para sistemas de 24 V, con salida de 120 V y controlador solar MPPT.",
    [["Marca", "SUMRY"], ["Potencia nominal", "4000 W"], ["Sistema de batería", "24 V DC"], ["Salida AC", "120 V"], ["Forma de onda", "Sinusoidal pura"], ["Controlador solar", "MPPT integrado"], ["Pantalla", "LCD"]],
    ["inversor solar", "SUMRY 4000W", "inversor 24V", "inversor 120V", "onda pura", "MPPT", "respaldo para apagones"],
    "Inversor Solar SUMRY 4000W 24V 120V | NEXO",
    "Compra el inversor solar híbrido SUMRY de 4000 W, sistema de 24 V, salida de 120 V, onda sinusoidal pura y controlador MPPT.",
  ),
  "NEXO-BLUETTI-ELITE100-V2": product(
    "BLUETTI Elite 100 V2 — Estación de Energía 1024Wh 1800W",
    "Estación portátil con batería LiFePO₄ de 1024 Wh, salida de 1800 W y carga rápida para respaldo eléctrico.",
    [["Marca", "BLUETTI"], ["Modelo", "Elite 100 V2"], ["Capacidad", "1024 Wh"], ["Potencia nominal", "1800 W"], ["Potencia pico", "3600 W"], ["Batería", "LiFePO₄"], ["Salidas AC", "4 × 120 V"], ["Carga solar", "Compatible"]],
    ["BLUETTI", "Elite 100 V2", "estacion de energia", "power station", "1024Wh", "1800W", "bateria LFP", "apagones"],
    "BLUETTI Elite 100 V2 1024Wh 1800W | NEXO",
    "Estación de energía BLUETTI Elite 100 V2 con 1024 Wh, 1800 W, batería LiFePO₄, carga rápida y compatibilidad solar.",
  ),
  "NEXO-ECOFLOW-DELTA3-ULTRA": product(
    "EcoFlow DELTA 3 Ultra — Estación de Energía 3072Wh 3600W",
    "Respaldo portátil de 3072 Wh y 3600 W con batería LFP, UPS rápida, carga solar y control mediante aplicación.",
    [["Marca", "EcoFlow"], ["Modelo", "DELTA 3 Ultra"], ["Capacidad", "3072 Wh"], ["Potencia nominal", "3600 W"], ["Sobretensión", "7200 W"], ["Batería", "LFP"], ["Salida AC", "120 V / 60 Hz"], ["Entrada solar máxima", "800 W"], ["UPS", "Menos de 10 ms"], ["Conectividad", "Wi‑Fi y Bluetooth"]],
    ["EcoFlow", "DELTA 3 Ultra", "estacion de energia", "3072Wh", "3600W", "bateria LFP", "UPS", "respaldo hogar", "apagones"],
    "EcoFlow DELTA 3 Ultra 3072Wh 3600W | NEXO",
    "EcoFlow DELTA 3 Ultra con 3072 Wh, salida de 3600 W, batería LFP, UPS rápida, entrada solar y control inteligente.",
  ),
  "NEXO-LAMPARA-LED-30W": product(
    "Lámpara LED Recargable USB 30W con Gancho — 3 Modos",
    "Lámpara portátil recargable por USB con gancho y tres modos de iluminación para apagones y actividades al aire libre.",
    [["Tipo", "Lámpara LED recargable"], ["Potencia anunciada", "30 W"], ["Carga", "USB"], ["Modos", "3"], ["Montaje", "Gancho integrado"]],
    ["lampara recargable", "luz para apagones", "lampara USB", "lampara LED 30W", "luz camping", "bombillo recargable"],
    "Lámpara LED Recargable USB 30W | NEXO",
    "Lámpara LED recargable por USB con gancho y tres modos de iluminación. Práctica para apagones, patios y camping.",
  ),
  "NEXO-OCEDAR-EASYWRING": product(
    "Fregona Giratoria O-Cedar EasyWring con Cubeta y Pedal",
    "Sistema de fregona de microfibra con cubeta y pedal para escurrir sin usar las manos.",
    [["Marca", "O-Cedar"], ["Línea", "EasyWring"], ["Tipo", "Fregona / trapeador giratorio"], ["Escurrido", "Pedal de pie"], ["Material de la mopa", "Microfibra lavable"], ["Mango", "Telescópico hasta 51 pulgadas"], ["Cabezal", "Triangular con giro de 360°"]],
    ["fregona", "trapeador", "spin mop", "O-Cedar", "EasyWring", "cubeta con pedal", "mopa giratoria", "limpieza de pisos"],
    "Fregona O-Cedar EasyWring con Cubeta | NEXO",
    "Compra la fregona giratoria O-Cedar EasyWring con cubeta, pedal de escurrido y mopa de microfibra reutilizable.",
  ),
  "NEXO-LOLARAN-AL1000": product(
    "Contadora de Billetes LOLARAN AL1000 con Detector de Falsos",
    "Contadora de hasta 1.000 billetes por minuto con cálculo de valor, sensores antifalsificación y display externo.",
    [["Marca", "LOLARAN"], ["Modelo", "AL1000"], ["Velocidad", "Hasta 1.000 billetes/min"], ["Detección", "UV, MG, MT, IR y DD"], ["Monedas admitidas", "USD y EUR"], ["Modos", "Count, Add y Batch"], ["Pantallas", "LCD principal y display externo"]],
    ["contadora de billetes", "maquina contar dinero", "LOLARAN AL1000", "detector billetes falsos", "cash counter", "USD", "EUR"],
    "Contadora de Billetes LOLARAN AL1000 | NEXO",
    "Contadora LOLARAN AL1000 de hasta 1.000 billetes por minuto, con detección UV/MG/MT/IR/DD, cálculo de valor y display externo.",
  ),
  "NEXO-ASPIRADORA-MANO-USB": product(
    "Aspiradora de Mano Inalámbrica USB con Accesorios",
    "Aspiradora portátil recargable por USB con accesorios para automóvil, hogar, oficina y espacios estrechos.",
    [["Tipo", "Aspiradora de mano inalámbrica"], ["Carga", "USB"], ["Filtro", "Desmontable"], ["Depósito", "Transparente"], ["Accesorios visibles", "Boquillas, cepillo y manguera"]],
    ["aspiradora portátil", "aspiradora para carro", "aspiradora USB", "aspiradora de mano", "limpieza automóvil"],
    "Aspiradora de Mano Inalámbrica USB | NEXO",
    "Aspiradora portátil recargable por USB con filtro desmontable y accesorios para limpiar automóvil, hogar, oficina y rincones difíciles.",
  ),
  "NEXO-LUMIVAULT-X3PRO": product(
    "Timbre Inteligente LUMIVAULT X3PRO con Cámara HD",
    "Timbre inalámbrico con cámara HD, visión nocturna, audio bidireccional, alertas por aplicación y receptor interior.",
    [["Marca", "LUMIVAULT"], ["Modelo", "X3PRO"], ["Vídeo", "HD"], ["Visión nocturna", "Sí"], ["Audio", "Bidireccional"], ["Conectividad", "Wi‑Fi"], ["Alimentación", "Batería recargable o USB"], ["Receptor interior", "Incluido"]],
    ["timbre inteligente", "videoportero WiFi", "LUMIVAULT X3PRO", "timbre con camara", "doorbell", "seguridad hogar"],
    "Timbre Inteligente LUMIVAULT X3PRO | NEXO",
    "Timbre LUMIVAULT X3PRO con cámara HD, visión nocturna, audio bidireccional, alertas por app y receptor interior incluido.",
  ),
  "NEXO-LOGIC-ML8": product(
    "Módem Portátil Logic ML8 4G LTE Wi‑Fi",
    "Punto de acceso móvil 4G LTE con batería de 2500 mAh para compartir una tarjeta SIM con hasta 10 equipos.",
    [["Marca", "Logic"], ["Modelo", "ML8"], ["Red móvil", "4G LTE / 3G"], ["Wi‑Fi", "802.11 b/g/n"], ["Usuarios", "Hasta 10"], ["Batería", "2500 mAh Li‑ion"], ["Autonomía publicada", "4 a 6 horas"], ["Carga", "Micro USB"]],
    ["modem portatil", "Logic ML8", "MiFi 4G", "router SIM", "wifi portatil", "hotspot LTE", "internet movil"],
    "Módem Portátil Logic ML8 4G LTE Wi‑Fi | NEXO",
    "Módem portátil Logic ML8 4G LTE con batería de 2500 mAh, Wi‑Fi para hasta 10 equipos y amplia compatibilidad de bandas móviles.",
  ),
  "NEXO-BAMBU-A1-COMBO": product(
    "Impresora 3D Bambu Lab A1 Combo con AMS Lite",
    "Impresora 3D multicolor con AMS Lite, calibración automática y volumen de construcción de 256 × 256 × 256 mm.",
    [["Marca", "Bambu Lab"], ["Modelo", "A1 Combo"], ["Sistema multicolor", "AMS Lite incluido"], ["Volumen de construcción", "256 × 256 × 256 mm"], ["Aceleración máxima", "10.000 mm/s²"], ["Nivelación", "Automática"], ["Ruido en modo silencioso", "Menos de 48 dB"], ["Extra anunciado", "Kit de lámpara LED"]],
    ["impresora 3D", "Bambu Lab A1", "A1 Combo", "AMS Lite", "impresion multicolor", "fabricacion digital", "prototipado"],
    "Impresora 3D Bambu Lab A1 Combo con AMS Lite | NEXO",
    "Bambu Lab A1 Combo con AMS Lite, impresión multicolor, calibración automática y volumen de 256 × 256 × 256 mm para proyectos 3D.",
  ),
  "NEXO-MOCHILA-COMPACTA": product(
    "Mochila Compacta de Poliéster para Viajes y Uso Diario",
    "Mochila ligera con cremallera, bolsillo frontal y correas para escuela, gimnasio, paseos y uso cotidiano.",
    [["Tipo", "Mochila compacta"], ["Material anunciado", "Poliéster"], ["Cierre", "Cremallera"], ["Diseño", "Color liso"], ["Bolsillo", "Frontal"], ["Colores anunciados", "Amarillo, azul y rosado"]],
    ["mochila pequena", "mochila compacta", "mochila escolar", "mochila viaje", "bolso gimnasio", "mochila poliester"],
    "Mochila Compacta de Poliéster para Viajes | NEXO",
    "Mochila compacta de poliéster con cremallera, bolsillo frontal y correas para escuela, gimnasio, viajes cortos y uso diario.",
  ),
  "NEXO-CINTURON-TERMICO": product(
    "Cinturón Térmico Portátil con Calor y Vibración",
    "Cinturón recargable con tres niveles de calor, vibración, pantalla y USB‑C para abdomen y zona lumbar.",
    [["Tipo", "Cinturón térmico portátil"], ["Temperaturas anunciadas", "45 / 55 / 65 °C"], ["Vibración", "Ajustable"], ["Carga", "USB‑C"], ["Control", "Botones y pantalla"], ["Longitud del módulo", "18,5 cm aprox."]],
    ["cinturon termico", "almohadilla termica", "calor abdominal", "calor lumbar", "masaje vibracion", "USB-C", "compresa caliente"],
    "Cinturón Térmico Portátil con Vibración | NEXO",
    "Cinturón térmico portátil con tres temperaturas, vibración ajustable, pantalla, correa elástica y carga USB‑C para uso sobre la ropa.",
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
