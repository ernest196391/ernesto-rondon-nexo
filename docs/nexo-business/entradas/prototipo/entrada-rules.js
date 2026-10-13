// Entrada de mercancía nueva por el bot — reglas PURAS (sin red, sin base de datos, sin IA).
//
// Lee el mensaje de WhatsApp de quien da la entrada (dependienta o gestora proveedora como Maryta),
// calcula o comprueba precio y comisión, arma la ficha SOLO con los datos dados y prepara el
// resumen que aprueba Lennys o Ernesto. Pensado para copiarlo tal cual a vivabot/src/entrada.js.
//
// Diseño: docs/nexo-business/entradas/FLUJO-ENTRADA-BOT.md
// Pruebas: node --test   (en esta carpeta)

// ───────────────────────── Regla de precio (PROPUESTA, sin confirmar) ─────────────────────────
// Encaja exacta con los 3 productos de Maryta del 12-oct (38/3, 25/3, 30/3), pero con los 153
// productos de la nube que tienen costo solo acierta el precio exacto en 20 (13 %). Lennys pone el
// precio mirando el mercado. Por eso: mientras `confirmada` sea false, el precio sale «sugerido».
export const REGLA_PROPUESTA = Object.freeze({
  id: 'casa-viva-2026-10-13-propuesta',
  confirmada: false,
  // Lo que le queda a la tienda después de pagar a la dueña (costo total) y a la gestora.
  gananciaTienda: Object.freeze({ minimoUsd: 5, pctCostoTotal: 20 }),
  // Comisión fija de la gestora por tramos del precio de venta («hasta» no incluido).
  comision: Object.freeze({
    tramos: Object.freeze([
      Object.freeze({ hasta: 15, usd: 1 }),
      Object.freeze({ hasta: 20, usd: 2 }),
      Object.freeze({ hasta: 40, usd: 3 }),
      Object.freeze({ hasta: 60, usd: 4 }),
      Object.freeze({ hasta: 100, usd: 5 }),
    ]),
    pctDesde100: 10, // 100 USD o más: 10 % del precio, redondeado al dólar
  }),
  // Lennys (11-oct): si la tienda gana menos de 2–3 USD, la gestora recibe menos comisión.
  avisoGananciaMinimaUsd: 2.5,
});

// ───────────────────────── Utilidades de dinero (en centavos, sin errores de coma) ─────────────
const c = (usd) => Math.round(Number(usd) * 100);
const usd = (cents) => cents / 100;
const arribaAlDolar = (cents) => Math.ceil(cents / 100) * 100;
const fmt = (cents) => (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2));

export function comisionPorRegla(precioUsd, regla = REGLA_PROPUESTA) {
  const p = Number(precioUsd);
  for (const t of regla.comision.tramos) if (p < t.hasta) return t.usd;
  return Math.max(1, Math.round((p * regla.comision.pctDesde100) / 100));
}

// Precio sugerido desde costo + plus. Devuelve también los pasos («¿por qué cuesta esto?»).
export function calcularPrecio({ costo, plus = 0 }, regla = REGLA_PROPUESTA) {
  if (!(Number(costo) > 0)) throw new Error('Falta el costo (número mayor que 0).');
  if (Number(plus) < 0) throw new Error('El plus no puede ser negativo.');
  const ct = c(costo) + c(plus);
  const g = Math.max(c(regla.gananciaTienda.minimoUsd), Math.ceil((ct * regla.gananciaTienda.pctCostoTotal) / 100));
  let com = c(comisionPorRegla(usd(ct + g), regla));
  let precio = arribaAlDolar(ct + com + g);
  for (let i = 0; i < 5; i++) {
    const otra = c(comisionPorRegla(usd(precio), regla));
    if (otra === com) break;
    com = otra;
    precio = arribaAlDolar(ct + com + g);
  }
  const ganancia = precio - ct - com;
  return {
    costoTotal: usd(ct),
    precio: usd(precio),
    comision: usd(com),
    gananciaTienda: usd(ganancia),
    regla: regla.id,
    confirmada: Boolean(regla.confirmada),
    pasos: [
      `Costo total = costo ${fmt(c(costo))} + plus ${fmt(c(plus))} = ${fmt(ct)} USD`,
      `Ganancia mínima de la tienda = el mayor entre ${regla.gananciaTienda.minimoUsd} USD y el ${regla.gananciaTienda.pctCostoTotal} % del costo total = ${fmt(g)} USD`,
      `Comisión de la gestora por tramo de precio = ${fmt(com)} USD`,
      `Precio = ${fmt(ct)} + ${fmt(com)} + ${fmt(g)}, redondeado hacia arriba al dólar = ${fmt(precio)} USD`,
      `A la tienda le quedan ${fmt(ganancia)} USD`,
    ],
  };
}

// Cuando quien da la entrada ya trae precio y comisión (como hizo Maryta): se comprueba la cuenta.
export function comprobarPrecioDado({ costo, plus = 0, costoTotalDado = null, precio, comision }, regla = REGLA_PROPUESTA) {
  const avisos = [];
  const ct = c(costo) + c(plus);
  if (costoTotalDado != null && c(costoTotalDado) !== ct) {
    avisos.push({ tipo: 'cuenta', bloquea: true, texto: `Costo ${fmt(c(costo))} + plus ${fmt(c(plus))} = ${fmt(ct)}, no ${fmt(c(costoTotalDado))}. ¿Cuál es el bueno?` });
  }
  const p = c(precio);
  const com = comision == null ? c(comisionPorRegla(precio, regla)) : c(comision);
  const ganancia = p - ct - com;
  if (p <= ct) {
    avisos.push({ tipo: 'perdida', bloquea: true, texto: `El precio ${fmt(p)} no cubre el costo total ${fmt(ct)}: la tienda pierde.` });
  } else if (ganancia < c(regla.avisoGananciaMinimaUsd)) {
    const comMax = Math.max(0, Math.floor((p - ct - c(regla.avisoGananciaMinimaUsd)) / 100) * 100);
    avisos.push({ tipo: 'ganancia-baja', bloquea: true, texto: `A la tienda solo le quedan ${fmt(ganancia)} USD. Regla de Lennys: con menos de ${regla.avisoGananciaMinimaUsd} USD baja la comisión (máximo ${fmt(comMax)} USD) o sube el precio.` });
  }
  const sugerido = calcularPrecio({ costo, plus }, regla);
  if (comision == null) avisos.push({ tipo: 'comision-por-regla', bloquea: false, texto: `No dijo comisión: se pone la de la regla, ${fmt(com)} USD.` });
  else if (com !== c(comisionPorRegla(precio, regla))) avisos.push({ tipo: 'comision-distinta', bloquea: false, texto: `La regla daría ${comisionPorRegla(precio, regla)} USD de comisión; se usa la dada, ${fmt(com)} USD.` });
  if (c(sugerido.precio) !== p) avisos.push({ tipo: 'precio-distinto', bloquea: false, texto: `La regla daría ${sugerido.precio} USD; se usa el precio dado, ${fmt(p)} USD.` });
  return { costoTotal: usd(ct), precio: usd(p), comision: usd(com), gananciaTienda: usd(ganancia), sugerido, avisos };
}

// ───────────────────────── Lectura del mensaje ─────────────────────────
const sinTildes = (s) => String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '');
const clave = (s) => sinTildes(s).toLowerCase().trim();
const num = (s) => Number(String(s).replace(',', '.'));
const N = '(\\d+(?:[.,]\\d+)?)';

const RE = {
  costoTotal: new RegExp(`costo\\s+total\\s*(?:de\\s*)?${N}`, 'i'),
  costo: new RegExp(`costo\\s*(?:de\\s*)?${N}`, 'i'),
  plus: new RegExp(`plus\\s*(?:de\\s*)?${N}`, 'i'),
  precio: new RegExp(`precio\\s*(?:de\\s*)?${N}`, 'i'),
  comision: new RegExp(`comision\\s*(?:de\\s*)?${N}`, 'i'),
  entrada: /entrada\s*(?:de\s*)?(\d+)\s*unidad\w*(?:\s+para\s+(.+))?/i,
  unidadesPara: /^(\d+)\s*unidad\w*\s+para\s+(.+)$/i,
  paraSolo: /^para\s+([a-zñ]+)\s*$/i,
  color: /^(\d+)\s*(?:de\s+)?(?:color\s+)?([a-zñ][a-zñ ]*?)\s*$/i,
  medida: /(\d)\s*(?:cm|mm|m\b|x)|\b(ancho|alto|largo|fondo|diametro|medida|cesta|rueda|nivel)/i,
};
const COLORES = ['blanco', 'negro', 'rosa', 'rosado', 'azul', 'rojo', 'verde', 'verde agua', 'verde menta', 'gris', 'beige', 'marron', 'amarillo', 'morado', 'lila', 'naranja', 'crema', 'dorado', 'plateado', 'transparente', 'turquesa'];

const ARTICULOS = /^(este|esta|estos|estas|el|la|los|las|un|una|unos|unas)\s+/i;

// socias: [{ nombre: 'Dayra', alias: ['daira','daera'] }, ...]; remitente: { nombre: 'Maryta' }
function quienEs(texto, { remitente, socias = [] }) {
  const k = clave(texto).replace(/[.,;:!]+$/, '');
  if (/^(mi|mi misma|mio|mia|yo)$/.test(k)) return remitente?.nombre || 'remitente';
  if (/^(la casa|casa viva|la tienda|tienda)$/.test(k)) return 'Casa Viva';
  for (const s of socias) {
    const nombres = [s.nombre, ...(s.alias || [])].map(clave);
    if (nombres.includes(k)) return s.nombre;
  }
  return texto.trim().replace(/^./, (x) => x.toUpperCase());
}

export function parsearEntrada(texto, ctx = {}) {
  const lineas = String(texto)
    .split(/\n|\s\/\s/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const out = {
    nombre: null, costo: null, plus: null, costoTotalDado: null, precio: null, comision: null,
    entradaTotal: null, duenas: [], medidas: [], sinLeer: [], avisos: [],
  };
  let actual = null; // dueña a la que se pegan los colores que vienen debajo
  const dueña = (nombre) => {
    let d = out.duenas.find((x) => x.nombre === nombre);
    if (!d) { d = { nombre, unidades: null, colores: [] }; out.duenas.push(d); }
    return d;
  };

  for (const original of lineas) {
    const l = sinTildes(original);
    let usada = false;
    const mTotal = l.match(RE.costoTotal);
    if (mTotal) { out.costoTotalDado = num(mTotal[1]); usada = true; }
    const lSinTotal = l.replace(RE.costoTotal, '');
    const mCosto = lSinTotal.match(RE.costo);
    if (mCosto) { out.costo = num(mCosto[1]); usada = true; }
    const mPlus = l.match(RE.plus);
    if (mPlus) { out.plus = num(mPlus[1]); usada = true; }
    const mPrecio = l.match(RE.precio);
    if (mPrecio) { out.precio = num(mPrecio[1]); usada = true; }
    const mCom = l.match(RE.comision);
    if (mCom) { out.comision = num(mCom[1]); usada = true; }
    if (usada) continue;

    const mEntrada = l.match(RE.entrada);
    if (mEntrada) {
      const n = Number(mEntrada[1]);
      if (mEntrada[2]) { actual = dueña(quienEs(mEntrada[2], ctx)); actual.unidades = n; }
      else out.entradaTotal = n;
      continue;
    }
    const mPara = l.match(RE.unidadesPara);
    if (mPara) { actual = dueña(quienEs(mPara[2], ctx)); actual.unidades = Number(mPara[1]); continue; }
    const mSolo = l.match(RE.paraSolo);
    if (mSolo) { actual = dueña(quienEs(mSolo[1], ctx)); continue; }
    const mColor = l.match(RE.color);
    if (mColor && COLORES.includes(clave(mColor[2]))) {
      const d = actual || dueña(ctx.remitente?.nombre || 'remitente');
      d.colores.push({ color: clave(mColor[2]), unidades: Number(mColor[1]) });
      continue;
    }
    // El nombre es la primera línea que no es dinero, unidades ni color, salvo que sea claramente
    // una medida («Ancho 45cm»). Así «Organizador de baño de metal de 3 niveles» queda como nombre.
    const pareceMedida = /\d\s*(cm|mm)\b/i.test(l) || /^(ancho|alto|largo|fondo|diametro|medidas?)\b/i.test(l);
    if (!out.nombre && !pareceMedida) { out.nombre = original.replace(ARTICULOS, '').replace(/^./, (x) => x.toUpperCase()); continue; }
    if (RE.medida.test(l) && /\d/.test(l)) { out.medidas.push(original.replace(/(\d)\s*cm\b/gi, '$1 cm')); continue; }
    out.sinLeer.push(original);
  }

  // Unidades: «Entrada 2 / Para Dayra / 1 para mí» → a Dayra le toca lo que falta (1).
  const sinCantidad = out.duenas.filter((d) => d.unidades == null && d.colores.length === 0);
  const asignadas = out.duenas.reduce((s, d) => s + (d.unidades ?? d.colores.reduce((a, x) => a + x.unidades, 0)), 0);
  if (out.entradaTotal != null && sinCantidad.length === 1) {
    sinCantidad[0].unidades = out.entradaTotal - asignadas;
    sinCantidad[0].deducido = true;
  }
  for (const d of out.duenas) {
    const suma = d.colores.reduce((a, x) => a + x.unidades, 0);
    if (d.unidades == null && d.colores.length) d.unidades = suma;
    if (d.colores.length && suma !== d.unidades) {
      out.avisos.push({ tipo: 'unidades', bloquea: true, texto: `${d.nombre}: dice ${d.unidades} y los colores suman ${suma} (${d.colores.map((x) => `${x.unidades} ${x.color}`).join(' + ')}). ¿Son ${suma} o falta ${d.unidades - suma > 0 ? d.unidades - suma : 'quitar'}?` });
    }
  }
  if (!out.duenas.length && out.entradaTotal != null) {
    const d = dueña(ctx.remitente?.nombre || 'remitente');
    d.unidades = out.entradaTotal;
  }
  const total = out.duenas.reduce((s, d) => s + (d.colores.length ? d.colores.reduce((a, x) => a + x.unidades, 0) : d.unidades || 0), 0);
  if (out.entradaTotal != null && out.entradaTotal !== out.duenas.reduce((s, d) => s + (d.unidades || 0), 0)) {
    out.avisos.push({ tipo: 'unidades', bloquea: true, texto: `La entrada dice ${out.entradaTotal} unidades y por dueña suman ${out.duenas.reduce((s, d) => s + (d.unidades || 0), 0)}.` });
  }
  out.unidadesContadas = total;

  // Colores para la web (variantes): se suman las de todas las dueñas.
  const porColor = new Map();
  for (const d of out.duenas) for (const x of d.colores) porColor.set(x.color, (porColor.get(x.color) || 0) + x.unidades);
  out.variantes = [...porColor].map(([color, unidades]) => ({ color, unidades }));

  // Lennys (12-oct, 22:31): por ahora los productos con defecto NO van a la web (sí entran en la caja).
  if (/defect/i.test(sinTildes(texto))) {
    out.avisos.push({ tipo: 'defecto', bloquea: true, texto: 'Dice «defecto»: por orden de Lennys no va a la web. Se puede dar entrada solo en la caja.' });
  }

  // Lo que falta. Bloquea: sin nombre, sin costo o sin unidades. El plus vacío se pregunta.
  out.faltan = [];
  if (!out.nombre) out.faltan.push({ que: 'nombre', bloquea: true });
  if (out.costo == null) out.faltan.push({ que: 'costo', bloquea: true });
  if (out.plus == null) out.faltan.push({ que: 'plus', bloquea: true, texto: '¿Lleva plus? Si no lleva, escribe «plus 0».' });
  if (!total) out.faltan.push({ que: 'unidades', bloquea: true });
  if (!out.medidas.length) out.faltan.push({ que: 'medidas', bloquea: false, texto: 'Sin medidas la ficha sale sin ellas (no se inventan).' });
  return out;
}

// ───────────────────────── Ficha: solo con datos dados ─────────────────────────
export function fichaDesdeDatos(e) {
  const titulo = e.nombre || null;
  const partes = [];
  if (e.medidas.length) partes.push(`Medidas: ${e.medidas.join('; ')}.`);
  if (e.variantes.length) partes.push(`Colores: ${e.variantes.map((v) => v.color).join(', ')}.`);
  return { titulo, descripcion: partes.join('\n'), confirmado: { titulo: Boolean(titulo), medidas: e.medidas.length > 0, colores: e.variantes.length > 0 } };
}

// Para cuando la IA pule el texto: todo número del texto nuevo tiene que estar en los datos dados.
export function numerosInventados(textoNuevo, textoFuente) {
  const nums = (s) => new Set((sinTildes(s).match(/\d+(?:[.,]\d+)?/g) || []).map((x) => x.replace(',', '.')));
  const fuente = nums(textoFuente);
  return [...nums(textoNuevo)].filter((x) => !fuente.has(x));
}

// ───────────────────────── Todo junto + resumen para aprobar ─────────────────────────
export function prepararEntrada(texto, ctx = {}, regla = REGLA_PROPUESTA) {
  const e = parsearEntrada(texto, ctx);
  let dinero = null;
  if (e.costo != null && e.plus != null) {
    dinero = e.precio != null
      ? { modo: 'comprobar', ...comprobarPrecioDado({ costo: e.costo, plus: e.plus, costoTotalDado: e.costoTotalDado, precio: e.precio, comision: e.comision }, regla) }
      : { modo: 'calcular', ...calcularPrecio({ costo: e.costo, plus: e.plus }, regla), avisos: [] };
  }
  const ficha = fichaDesdeDatos(e);
  const bloqueos = [
    ...e.faltan.filter((f) => f.bloquea).map((f) => f.texto || `Falta: ${f.que}`),
    ...e.avisos.filter((a) => a.bloquea).map((a) => a.texto),
    ...(dinero?.avisos || []).filter((a) => a.bloquea).map((a) => a.texto),
  ];
  return { entrada: e, dinero, ficha, listaParaAprobar: bloqueos.length === 0, bloqueos };
}

export function resumenParaAprobar(p, id) {
  const { entrada: e, dinero: d, ficha } = p;
  const L = [`📦 *Producto nuevo E${id}*${e.duenas.length ? ` · de ${e.duenas.map((x) => x.nombre).join(' y ')}` : ''}`, `*${ficha.titulo || '(sin nombre)'}*`];
  const porDueña = e.duenas.map((x) => `${x.nombre} ${x.unidades}${x.colores.length ? ` (${x.colores.map((k) => `${k.unidades} ${k.color}`).join(', ')})` : ''}`).join(' · ');
  L.push(`• Unidades: ${e.unidadesContadas}${porDueña ? ` — ${porDueña}` : ''}`);
  if (d) {
    L.push(`• Costo ${e.costo} + plus ${e.plus} = *${d.costoTotal} USD* (lo que se le paga a la dueña)`);
    L.push(`• Precio *${d.precio} USD* · comisión gestora *${d.comision} USD* · a la tienda le quedan *${d.gananciaTienda} USD*`);
    L.push(d.modo === 'calcular' ? `• Precio ${d.confirmada ? 'por la regla de la tienda' : 'SUGERIDO por el bot (regla sin confirmar)'}` : `• Precio y comisión los dio quien hizo la entrada`);
  }
  if (e.medidas.length) L.push(`• Medidas: ${e.medidas.join('; ')}`);
  for (const a of [...e.avisos, ...(d?.avisos || [])]) L.push(`${a.bloquea ? '⚠️' : 'ℹ️'} ${a.texto}`);
  for (const f of e.faltan) L.push(`${f.bloquea ? '⚠️' : 'ℹ️'} ${f.texto || `Falta: ${f.que}`}`);
  if (p.listaParaAprobar) {
    L.push('', `Para publicar: *PUBLICA E${id}*`, `Para cambiar: *PRECIO E${id} 32* · *COMISION E${id} 4* · *NO E${id}*`);
  } else {
    L.push('', `Todavía no se puede publicar: hay que arreglar lo marcado con ⚠️. Para descartarla: *NO E${id}*`);
  }
  return L.join('\n');
}

// Órdenes de aprobación. Siempre con el número de la entrada: nunca un «sí» suelto
// (en el chat «Tú» de Ernesto un «sí» solo ya es una orden del bot).
export function leerOrden(texto) {
  const m = sinTildes(String(texto)).trim().match(/^(publica|precio|comision|no|foto)\s+e-?(\d+)(?:\s+(\d+(?:[.,]\d+)?))?\s*$/i);
  if (!m) return null;
  const accion = m[1].toLowerCase();
  const valor = m[3] != null ? num(m[3]) : null;
  if ((accion === 'precio' || accion === 'comision') && (valor == null || !(valor >= 0))) return null;
  return { accion, id: Number(m[2]), valor };
}
