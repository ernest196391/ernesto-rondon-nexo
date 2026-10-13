// Pruebas con los 3 productos REALES de Maryta (WhatsApp, 12-oct-2026, 19:45–19:47).
// Ejecutar: node --test   (desde esta carpeta)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  REGLA_PROPUESTA, calcularPrecio, comprobarPrecioDado, comisionPorRegla,
  parsearEntrada, prepararEntrada, fichaDesdeDatos, numerosInventados, resumenParaAprobar, leerOrden,
} from './entrada-rules.js';

const ctx = {
  remitente: { nombre: 'Maryta' },
  socias: [
    { nombre: 'Dayra', alias: ['daira', 'daera', 'dayra'] },
    { nombre: 'Maryta', alias: ['marita', 'mary'] },
    { nombre: 'Nana', alias: [] },
    { nombre: 'Joyce', alias: [] },
  ],
};

// Textos tal cual los escribió Maryta (los saltos de línea son los de WhatsApp).
const ESTANTE = `Este estante de metal y madera
Entrada 2 unidades
Para Dayra
1 unidade para mí
Costo 22 usd
Plus 7 usd
Costo  total de 29 usd
Precio de 38 usd
Con comisión de 3 usd para gestores`;

const BANO = `Organizador de Baño de metal  de 3 niveles
Entrada 10 unidades para mi
Costo  12 usd
Plus  de 5 usd
Costo total de  17 usd
Precio de 25 usd con comisión  de 3 usd para gestores`;

const RUEDAS = `Este organizador multifuncional
Entrada de 10 unidades para dayra
5 color rosa
5 color negro
10 unidades para mi
5 color blanco
4 color negro
Costo 15 usd
Con Plus de 7 usd
Costo total  22 usd
Precio 30 con comisión de 3 para gestor.
Ancho 45cm
Alto 72 cm
3ra cesta 40cm de largo y 29 de ancho
2da cesta 39 de largo y 28 de ancho
1ra 38 cm X 27 cm ancho
Ruedas de plástico 4cm de 5 de alto`;

// La prueba que pidió Lennys: solo costo + plus (sin precio ni comisión). El bot tiene que llegar solo.
const quitarPrecio = (t) => t.split('\n').filter((l) => !/precio|comisi|costo\s+total/i.test(l)).join('\n');

test('fórmula propuesta: los 3 productos de Maryta dan exactamente lo que ella puso', () => {
  const casos = [
    { costo: 22, plus: 7, precio: 38, comision: 3, ganancia: 6 },
    { costo: 12, plus: 5, precio: 25, comision: 3, ganancia: 5 },
    { costo: 15, plus: 7, precio: 30, comision: 3, ganancia: 5 },
  ];
  for (const k of casos) {
    const r = calcularPrecio({ costo: k.costo, plus: k.plus });
    assert.equal(r.costoTotal, k.costo + k.plus);
    assert.equal(r.precio, k.precio, `precio de ${k.costo}+${k.plus}`);
    assert.equal(r.comision, k.comision);
    assert.equal(r.gananciaTienda, k.ganancia);
    assert.equal(r.confirmada, false, 'mientras Lennys no la confirme, sale como sugerido');
    assert.equal(r.pasos.length, 5);
  }
});

test('comisión por tramos', () => {
  assert.equal(comisionPorRegla(10), 1);
  assert.equal(comisionPorRegla(18), 2);
  assert.equal(comisionPorRegla(38), 3);
  assert.equal(comisionPorRegla(55), 4);
  assert.equal(comisionPorRegla(80), 5);
  assert.equal(comisionPorRegla(380), 38);
});

test('el precio nunca deja a la tienda por debajo del mínimo, y sin errores de coma', () => {
  for (let costo = 1; costo <= 300; costo += 0.5) {
    for (const plus of [0, 2.5, 5, 7]) {
      const r = calcularPrecio({ costo, plus });
      assert.ok(r.gananciaTienda >= REGLA_PROPUESTA.gananciaTienda.minimoUsd, `${costo}+${plus}`);
      assert.equal(r.precio, Math.round(r.precio), 'precio en dólares enteros');
      assert.equal(r.comision, comisionPorRegla(r.precio), 'comisión del tramo del precio final');
    }
  }
});

test('sin costo no hay precio', () => {
  assert.throws(() => calcularPrecio({ costo: 0, plus: 5 }), /costo/);
});

test('lee el estante: 2 unidades, 1 Dayra (deducida) + 1 Maryta', () => {
  const e = parsearEntrada(ESTANTE, ctx);
  assert.equal(e.nombre, 'Estante de metal y madera');
  assert.equal(e.costo, 22);
  assert.equal(e.plus, 7);
  assert.equal(e.costoTotalDado, 29);
  assert.equal(e.precio, 38);
  assert.equal(e.comision, 3);
  assert.equal(e.unidadesContadas, 2);
  assert.deepEqual(e.duenas.map((d) => [d.nombre, d.unidades]), [['Dayra', 1], ['Maryta', 1]]);
  assert.equal(e.duenas[0].deducido, true);
  assert.deepEqual(e.avisos, []);
  assert.ok(e.faltan.some((f) => f.que === 'medidas' && !f.bloquea), 'las medidas las dio Lennys aparte');
});

test('lee el organizador de baño: 10 unidades de Maryta', () => {
  const e = parsearEntrada(BANO, ctx);
  assert.equal(e.nombre, 'Organizador de Baño de metal de 3 niveles');
  assert.deepEqual([e.costo, e.plus, e.costoTotalDado, e.precio, e.comision], [12, 5, 17, 25, 3]);
  assert.deepEqual(e.duenas.map((d) => [d.nombre, d.unidades]), [['Maryta', 10]]);
});

test('lee el organizador con ruedas y AVISA que a Maryta le salen 9 y no 10', () => {
  const e = parsearEntrada(RUEDAS, ctx);
  assert.equal(e.nombre, 'Organizador multifuncional');
  assert.deepEqual([e.costo, e.plus, e.costoTotalDado, e.precio, e.comision], [15, 7, 22, 30, 3]);
  const [dayra, maryta] = e.duenas;
  assert.equal(dayra.nombre, 'Dayra');
  assert.deepEqual(dayra.colores, [{ color: 'rosa', unidades: 5 }, { color: 'negro', unidades: 5 }]);
  assert.equal(maryta.nombre, 'Maryta');
  assert.equal(maryta.unidades, 10);
  assert.deepEqual(maryta.colores, [{ color: 'blanco', unidades: 5 }, { color: 'negro', unidades: 4 }]);
  assert.equal(e.unidadesContadas, 19);
  assert.deepEqual(e.variantes, [{ color: 'rosa', unidades: 5 }, { color: 'negro', unidades: 9 }, { color: 'blanco', unidades: 5 }]);
  assert.equal(e.avisos.length, 1);
  assert.match(e.avisos[0].texto, /Maryta: dice 10 y los colores suman 9/);
  assert.equal(e.medidas.length, 6);
  assert.ok(e.medidas.includes('Ancho 45 cm'));
  assert.ok(e.medidas.includes('Alto 72 cm'));
});

test('modo comprobar: lo que dio Maryta cuadra con la regla (sin avisos de dinero)', () => {
  for (const t of [ESTANTE, BANO, RUEDAS]) {
    const p = prepararEntrada(t, ctx);
    assert.equal(p.dinero.modo, 'comprobar');
    assert.deepEqual(p.dinero.avisos, [], t.split('\n')[0]);
  }
  assert.equal(prepararEntrada(ESTANTE, ctx).listaParaAprobar, true);
  assert.equal(prepararEntrada(BANO, ctx).listaParaAprobar, true);
  assert.equal(prepararEntrada(RUEDAS, ctx).listaParaAprobar, false, 'bloqueado hasta aclarar 9 o 10');
});

test('PRUEBA DE LENNYS: sin precio ni comisión, el bot llega solo a 38/3, 25/3 y 30/3', () => {
  const esperado = [[ESTANTE, 38, 3, 6], [BANO, 25, 3, 5], [RUEDAS, 30, 3, 5]];
  for (const [t, precio, comision, ganancia] of esperado) {
    const p = prepararEntrada(quitarPrecio(t), ctx);
    assert.equal(p.dinero.modo, 'calcular');
    assert.equal(p.dinero.precio, precio);
    assert.equal(p.dinero.comision, comision);
    assert.equal(p.dinero.gananciaTienda, ganancia);
  }
});

test('avisa de una cuenta mal hecha y de una ganancia demasiado baja', () => {
  const malSuma = comprobarPrecioDado({ costo: 22, plus: 7, costoTotalDado: 30, precio: 38, comision: 3 });
  assert.ok(malSuma.avisos.some((a) => a.tipo === 'cuenta' && a.bloquea));
  const poca = comprobarPrecioDado({ costo: 22, plus: 7, precio: 33, comision: 3 });
  assert.equal(poca.gananciaTienda, 1);
  const aviso = poca.avisos.find((a) => a.tipo === 'ganancia-baja');
  assert.ok(aviso && aviso.bloquea);
  assert.match(aviso.texto, /máximo 1 USD/);
  const perdida = comprobarPrecioDado({ costo: 22, plus: 7, precio: 28, comision: 3 });
  assert.ok(perdida.avisos.some((a) => a.tipo === 'perdida'));
});

test('con defecto no va a la web (orden de Lennys del 12-oct)', () => {
  const p = prepararEntrada('Closet con gaveta con defecto\nEntrada 1 unidad para Dayra\nCosto 20 usd\nPlus 5 usd', ctx);
  assert.equal(p.listaParaAprobar, false);
  assert.ok(p.bloqueos.some((b) => /no va a la web/.test(b)));
});

test('sin plus lo pregunta (no lo supone)', () => {
  const p = prepararEntrada('Cesto de ropa\nEntrada 4 unidades\nCosto 9 usd', ctx);
  assert.equal(p.dinero, null);
  assert.equal(p.listaParaAprobar, false);
  assert.ok(p.bloqueos.some((b) => /plus 0/.test(b)));
});

test('ficha solo con datos dados y detector de números inventados', () => {
  const e = parsearEntrada(RUEDAS, ctx);
  const f = fichaDesdeDatos(e);
  assert.equal(f.titulo, 'Organizador multifuncional');
  assert.match(f.descripcion, /Ancho 45 cm/);
  assert.match(f.descripcion, /Colores: rosa, negro, blanco/);
  assert.deepEqual(numerosInventados(f.descripcion, RUEDAS), []);
  // Si la IA «mejora» el texto y se inventa la carga máxima o el alto de la caja, se detecta.
  assert.deepEqual(numerosInventados('Organizador de 3 cestas, alto 78 cm, aguanta 15 kg', RUEDAS), ['78']);
});

test('resumen para Lennys y órdenes de aprobación con número (nunca un «sí» suelto)', () => {
  const p = prepararEntrada(quitarPrecio(BANO), ctx);
  const txt = resumenParaAprobar(p, 7);
  assert.match(txt, /Producto nuevo E7/);
  assert.match(txt, /Costo 12 \+ plus 5 = \*17 USD\*/);
  assert.match(txt, /Precio \*25 USD\* · comisión gestora \*3 USD\* · a la tienda le quedan \*5 USD\*/);
  assert.match(txt, /SUGERIDO por el bot/);
  assert.match(txt, /PUBLICA E7/);
  const bloqueado = resumenParaAprobar(prepararEntrada(RUEDAS, ctx), 8);
  assert.doesNotMatch(bloqueado, /PUBLICA E8/);
  assert.match(bloqueado, /⚠️ Maryta: dice 10/);

  assert.deepEqual(leerOrden('PUBLICA E7'), { accion: 'publica', id: 7, valor: null });
  assert.deepEqual(leerOrden('precio e7 32'), { accion: 'precio', id: 7, valor: 32 });
  assert.deepEqual(leerOrden('COMISIÓN E7 4'), { accion: 'comision', id: 7, valor: 4 });
  assert.deepEqual(leerOrden('no E7'), { accion: 'no', id: 7, valor: null });
  assert.equal(leerOrden('sí'), null);
  assert.equal(leerOrden('PUBLICA'), null);
  assert.equal(leerOrden('PRECIO E7'), null);
});
