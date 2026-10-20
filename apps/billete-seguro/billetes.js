// Billete Seguro — medidas de seguridad de cada billete.
// Fuentes: fichas del Banco Central de Cuba (bc.gob.cu/app/billetes), guía de
// Radio Sagua (oct-2026) para CUP; Reserva Federal (uscurrency.gov) para USD;
// Banco Central Europeo (serie Europa) para EUR. `verificado: false` = falta
// comprobarlo con la ficha oficial; la app lo dice en pantalla.
// Las series "reportadas" vienen de la prensa, no del banco.

const CUP_2026 = (valor, patriota) => ({
  luz: {
    ve: [`La cara de ${patriota} a la izquierda, suave y sin bordes duros`, `El número ${valor} claro, al lado de la cara`],
    ojo: "Si ves otra cara u otro número, lo imprimieron encima de un billete más barato.",
  },
  inclinar: {
    ve: ["La Flor Nacional, junto a la cara, cambia de color como un arcoíris", `El hilo de la derecha: las letras «BCC» y «${valor}» parecen moverse`],
    ojo: "Si la flor no cambia de color o el hilo está solo dibujado, desconfía.",
  },
  tocar: {
    ve: ["La cara de la patriota se siente rugosa, en relieve", "Arriba a la derecha se notan los puntitos de Braille", "El reverso es liso: eso es normal"],
    ojo: "Si todo el billete se siente liso, como papel de libreta, desconfía.",
  },
  uv: {
    ve: ["Pocas fibras amarillas y verdes que brillan", "Fibras rojas y azules que se ven, pero no brillan"],
    ojo: "Si todo el papel brilla azul claro, es papel común: falso.",
  },
});

const CUP_2000_5000 = (valor, patriota, colores) => ({
  luz: {
    ve: [`La cara de ${patriota}, suave y sin bordes duros`, `El número ${valor} claro, al lado de la cara`],
    ojo: "Si ves otra cara u otro número, lo imprimieron encima de un billete más barato.",
  },
  inclinar: {
    ve: ["La Flor Nacional cambia de color, entre verde y dorado", `El hilo de la derecha: las letras «BCC» y «${valor}» parecen moverse`],
    ojo: "Si la flor no cambia de color o el hilo está solo dibujado, desconfía.",
  },
  tocar: {
    ve: ["La cara de la patriota y el logotipo «BCC» se sienten rugosos, en relieve", `El color es ${colores}, vivo y parejo`],
    ojo: "Si se siente liso o el color está desteñido o raro, desconfía.",
  },
  uv: {
    ve: ["Algunas fibras pequeñas brillan", "El papel no brilla entero"],
    ojo: "Si todo el papel brilla azul claro, es papel común: falso.",
  },
});

const USD = (valor, cara, lado, colorUv, hombro) => ({
  luz: {
    ve: [`La cara de ${cara} en el espacio blanco de la derecha`, `Una franja fina, a la ${lado} de la cara, con «USA ${valor}»`],
    ojo: "Si ves otra cara o la franja dice «USA 5», es un billete de 5 lavado y reimpreso.",
  },
  inclinar: {
    ve: valor === 100
      ? ["La cinta azul del centro: las campanas y los «100» se mueven", "La campana del tintero y el «100» de abajo a la derecha cambian de cobre a verde"]
      : [`El «${valor}» de abajo a la derecha cambia de cobre a verde`],
    ojo: "Si el color no cambia al inclinarlo, desconfía.",
  },
  tocar: {
    ve: [`${hombro} se siente rugoso, en relieve`, "El papel es firme, como tela; no es papel de libreta"],
    ojo: "Si se siente liso, blando o encerado, desconfía.",
  },
  uv: {
    ve: [`La franja fina brilla ${colorUv}`, "El resto del papel no brilla"],
    ojo: "Si todo el papel brilla azul claro, o la franja no brilla, es falso.",
  },
});

const EUR = (valor) => ({
  luz: {
    ve: [`La cara de Europa y el número ${valor} en la parte sin imprimir`, "La ventana del holograma se vuelve transparente y muestra la cara de Europa"],
    ojo: "Si la ventana no se vuelve transparente o no ves la cara, desconfía.",
  },
  inclinar: {
    ve: [`El «${valor}» de abajo a la izquierda (número esmeralda) cambia de verde a azul y una luz sube y baja`, "La banda plateada muestra a Europa, el símbolo € y el valor"],
    ojo: "Si el número no cambia de color o la banda no brilla, desconfía.",
  },
  tocar: {
    ve: ["Rayas cortas en relieve en los bordes izquierdo y derecho", "La imagen principal y las letras se sienten rugosas"],
    ojo: "Si todo se siente liso, desconfía.",
  },
  uv: {
    ve: ["El papel no brilla; brillan fibritas rojas, azules y verdes", "Las estrellas de la bandera se ven amarillas"],
    ojo: "Si todo el papel brilla azul claro, es papel común: falso.",
  },
});

window.BILLETES = [
  { id: "cup-20000", moneda: "CUP", valor: 20000, patriota: "Vilma Espín", nota: "Serie 2026", nuevo: true, verificado: true, pruebas: CUP_2026("20000", "Vilma Espín") },
  { id: "cup-10000", moneda: "CUP", valor: 10000, patriota: "Haydée Santamaría", nota: "Serie 2026", nuevo: true, verificado: true, pruebas: CUP_2026("10000", "Haydée Santamaría") },
  { id: "cup-5000", moneda: "CUP", valor: 5000, patriota: "Celia Sánchez", nota: "Billete azul", hayFalsos: true, verificado: true,
    pruebas: CUP_2000_5000("5000", "Celia Sánchez", "azul"),
    reportadas: [{ prefijo: "LAA01", texto: "LAA-01" }, { prefijo: "LAA02", texto: "LAA-02" }] },
  { id: "cup-2000", moneda: "CUP", valor: 2000, patriota: "Mariana Grajales", nota: "Violeta y rosa", hayFalsos: true, verificado: true,
    pruebas: CUP_2000_5000("2000", "Mariana Grajales", "violeta y rosa"),
    reportadas: [{ prefijo: "KAA17", texto: "KAA-17" }] },
  { id: "cup-1000", moneda: "CUP", valor: 1000, patriota: "el patriota del billete", nota: "Serie 2021", hayFalsos: true, verificado: false,
    pruebas: {
      luz: { ve: ["La marca de agua muestra la misma cara que está impresa en el billete", "Se lee el número 1000"], ojo: "Hay falsos impresos sobre billetes de 200: a contraluz se ve el 200 o la cara del billete de 200." },
      inclinar: { ve: ["El hilo de seguridad se ve dentro del papel, no dibujado encima"], ojo: "Si el hilo está solo dibujado, desconfía." },
      tocar: { ve: ["La cara se siente rugosa, en relieve"], ojo: "Si todo se siente liso, desconfía." },
      uv: { ve: ["Algunas fibras pequeñas brillan", "El papel no brilla entero"], ojo: "Si todo el papel brilla azul claro, es papel común: falso." },
    } },
  { id: "usd-100", moneda: "USD", valor: 100, patriota: "Benjamin Franklin", nota: "Con cinta azul", hayFalsos: true, verificado: true, pruebas: USD(100, "Franklin", "izquierda", "rosa", "El hombro de Franklin") },
  { id: "usd-50", moneda: "USD", valor: 50, patriota: "Ulysses Grant", nota: "Serie 2004 en adelante", verificado: true, pruebas: USD(50, "Grant", "derecha", "amarilla", "La ropa de Grant") },
  { id: "usd-20", moneda: "USD", valor: 20, patriota: "Andrew Jackson", nota: "Serie 2004 en adelante", verificado: true, pruebas: USD(20, "Jackson", "izquierda", "verde", "La ropa de Jackson") },
  { id: "eur-50", moneda: "EUR", valor: 50, patriota: "Europa", nota: "Serie Europa", verificado: true, pruebas: EUR(50) },
  { id: "eur-20", moneda: "EUR", valor: 20, patriota: "Europa", nota: "Serie Europa", verificado: true, pruebas: EUR(20) },
];

window.PRUEBAS = [
  { id: "luz", titulo: "A contraluz", pide: "Pon el billete delante de una bombilla o del sol y míralo de frente.", foto: "contraluz", pregunta: "¿Lo ves así?", si: "Sí, se ve así", no: "No se ve" },
  { id: "inclinar", titulo: "Inclínalo", pide: "Mueve el billete despacio, hacia ti y hacia atrás, y mira estas cosas.", pregunta: "¿Lo ves así?", si: "Sí, cambia y se mueve", no: "No cambia" },
  { id: "tocar", titulo: "Tócalo", pide: "Pasa la uña despacio por el billete. Esta prueba no necesita foto.", pregunta: "¿Se siente así?", si: "Sí, se siente así", no: "Está liso" },
  { id: "uv", titulo: "Luz ultravioleta", pide: "Ponte a la sombra y alumbra el billete con la lámpara UV, de cerca.", foto: "uv", pregunta: "¿Lo ves así?", si: "Sí, se ve así", no: "No, brilla raro", sinLampara: true },
];
