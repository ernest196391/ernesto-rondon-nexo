#!/usr/bin/env node
// Cazador NEXO, versión 0 (etapa 3 de idea-a-producto).
// Busca negocios en OpenStreetMap (Overpass) para Plaza de la Revolución / El Vedado,
// en 3 nichos (comida, belleza, móviles y electrónica), filtra, puntúa y saca:
//   - docs/productos/cazador/<fecha>-plaza-vedado.csv
//   - docs/productos/cazador/cazador-v0.html  (página para el teléfono, con los datos dentro)
// No manda nada a nadie. No lee Google Maps, Revolico, Cubísima ni Facebook.
//
// Uso:
//   node scripts/cazador/osm-negocios.mjs [--fecha 2026-10-12] [--top 50]
//        [--desde archivo.json]   (usa un JSON de Overpass ya guardado, sin consultar)
//        [--sin-red]              (solo caché o --desde; nunca consulta)
//
// Overpass: UNA sola consulta (los 3 nichos juntos), caché de 7 días, User-Agent propio,
// y si el servidor está ocupado (429/504/"too busy") espera 60 s y reintenta, máximo 3 veces.
// Datos © colaboradores de OpenStreetMap, licencia ODbL.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const OUT_DIR = path.join(REPO, 'docs', 'productos', 'cazador');
const DS_DIR = path.join(REPO, 'docs', 'sistemas-de-diseno', 'nexo');
const CACHE_DIR = path.join(os.tmpdir(), 'nexo-cazador-cache');
const CACHE_DAYS = 7;
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'NEXO-Cazador/0.1 (uso interno, pocas consultas; contacto: NEXO Cuba)';

// ---------- argumentos ----------
const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const FECHA = arg('--fecha', new Date().toISOString().slice(0, 10));
const TOP = Number(arg('--top', '50'));
const DESDE = arg('--desde', null);
const SIN_RED = args.includes('--sin-red');

// ---------- nichos ----------
const NICHOS = {
  comida: { nombre: 'Comida', beneficio: 'Tu menú en una tienda propia, con pedidos por WhatsApp.', cuota: 22 },
  belleza: { nombre: 'Belleza', beneficio: 'Un calendario de citas por WhatsApp, sin llamadas.', cuota: 14 },
  moviles: { nombre: 'Móviles', beneficio: 'Tu catálogo con precios, para que te pidan por WhatsApp.', cuota: 14 },
};
const TIPO = {
  'amenity=restaurant': ['comida', 'Restaurante', 15],
  'amenity=cafe': ['comida', 'Cafetería', 15],
  'amenity=fast_food': ['comida', 'Comida rápida', 12],
  'amenity=bar': ['comida', 'Bar', 6],
  'shop=hairdresser': ['belleza', 'Peluquería', 15],
  'shop=barber': ['belleza', 'Barbería', 15],
  'shop=beauty': ['belleza', 'Salón de belleza', 15],
  'shop=mobile_phone': ['moviles', 'Móviles y accesorios', 15],
  'shop=electronics': ['moviles', 'Electrónica', 10],
  'shop=computer': ['moviles', 'Computadoras', 10],
};

const QUERY = `[out:json][timeout:120];
area["boundary"="administrative"]["name"="Plaza de la Revolución"]->.plaza;
(
  nwr["amenity"~"^(restaurant|cafe|fast_food|bar)$"](area.plaza);
  nwr["shop"~"^(hairdresser|beauty|barber|mobile_phone|electronics|computer)$"](area.plaza);
);
out center tags;`;

// ---------- estatales y clínicas ----------
// Lista Restringida (PAGOS-Y-LEGAL.md: "empresas estatales, GAESA y similares") + cadenas del Estado.
const ESTATAL = [
  'CIMEX', 'FINCIMEX', 'GAESA', 'Caribe', 'ETECSA', 'Cadeca', 'TRD', 'Palmares', 'Gaviota', 'DITU', 'Ditú',
  'Panamericana', 'Cubalse', 'Artex', 'Habaguanex', 'Correos', 'BPA', 'BANDEC', 'Banco Metropolitano',
  'Metropolitano', 'Cupet', 'El Rápido', 'Rumbos', 'Cubanacán', 'Cubanacan', 'Islazul', 'Gran Caribe',
  'Coppelia', 'Almacenes Universales', 'Puerto Carena', 'RAFIN', 'Copextel', 'Tecnotex', 'Havanatur',
  'Cubatur', 'Infotur', 'EGREM', 'Casa del Habano', 'Habanos', 'Gastronomía', 'Gastronomia', 'MINCIN',
  'MINTUR', 'MINSAP', 'Ministerio', 'Poder Popular', 'Empresa', 'Estatal', 'Sucursal', 'Hotel',
  'Meliá', 'Melia', 'Iberostar', 'Kempinski', 'Cubana de Aviación', 'Plaza Carlos III', 'La Época',
  'Telepunto', 'Agente de Telecomunicaciones', 'Agencia de Telecomunicaciones', 'Multiservicios ETECSA', 'Tiendas Caribe', 'Mercado Ideal', 'Agromercado', 'Mercado Agropecuario',
];
const ESTATAL_RE = new RegExp('(^|[^\\p{L}])(' + ESTATAL.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}])', 'iu');
const ESTATAL_FIELDS = ['name', 'official_name', 'alt_name', 'operator', 'brand', 'owner', 'network'];
const CLINICA_RE = /(cl[ií]nica|policl[ií]nic|hospital|consultorio|m[eé]dic|dental|estomatol)/iu;

function esEstatal(t) {
  if (/^(government|public|state|municipal|national)$/i.test(t['operator:type'] || t['ownership'] || '')) return 'operador público';
  for (const f of ESTATAL_FIELDS) {
    const m = (t[f] || '').match(ESTATAL_RE);
    if (m) return `${f}: ${m[2]}`;
  }
  return null;
}
function esClinica(t) {
  if (t.healthcare || /^(clinic|dentist|doctors|hospital|pharmacy)$/.test(t.amenity || '')) return true;
  return CLINICA_RE.test(t.name || '');
}

// ---------- web y redes ----------
const WEB_KEYS = ['website', 'contact:website', 'url', 'website:menu'];
const SOCIAL_KEYS = ['facebook', 'contact:facebook', 'instagram', 'contact:instagram', 'twitter', 'contact:twitter',
  'contact:telegram', 'telegram', 'contact:tiktok', 'tiktok', 'contact:youtube', 'contact:whatsapp', 'whatsapp'];

// ---------- teléfonos de Cuba ----------
// Celular: 8 cifras que empiezan por 5 o 6 → WhatsApp posible. Fijo de La Habana: 7 + 7 cifras.
function telefonos(t) {
  const raw = ['phone', 'contact:phone', 'mobile', 'contact:mobile'].map((k) => t[k]).filter(Boolean).join(';');
  const out = [];
  for (const part of raw.split(/[;,/]|\s{2,}| o /)) {
    let d = part.replace(/\D/g, '');
    if (!d) continue;
    if (d.startsWith('0053')) d = d.slice(4);
    else if (d.startsWith('53') && d.length >= 10) d = d.slice(2);
    if (d.length === 7 && !/^[56]/.test(d)) d = '7' + d; // fijo escrito sin el 7
    if (d.length !== 8) continue;
    const movil = /^[56]/.test(d);
    const fijo = /^7/.test(d);
    if (!movil && !fijo) continue;
    out.push({ national: d, movil, e164: '+53' + d, display: movil ? `+53 ${d.slice(0, 4)} ${d.slice(4)}` : `+53 7 ${d.slice(1, 4)} ${d.slice(4)}` });
  }
  const uniq = [...new Map(out.map((p) => [p.national, p])).values()];
  uniq.sort((a, b) => b.movil - a.movil);
  return uniq;
}

// ---------- calles con mucho paso (Plaza / Vedado) ----------
const CALLES_DE_PASO = [
  /^(calle\s+)?23$/i, /^(calle\s+)?l$/i, /^(calle\s+)?g$/i, /presidentes/i, /^(calle\s+)?17$/i, /^(calle\s+)?19$/i,
  /^(calle\s+)?21$/i, /^(calle\s+)?25$/i, /^(calle\s+)?12$/i, /^(calle\s+)?26$/i, /l[ií]nea/i, /paseo/i, /malec[oó]n/i,
  /zapata/i, /infanta/i, /boyeros/i, /(avenida|calle)\s+26/i, /^(calle\s+)?b$/i, /^(calle\s+)?e$/i, /^(calle\s+)?k$/i,
];
function calleDePaso(street) {
  if (!street) return false;
  const s = street.trim();
  return CALLES_DE_PASO.some((re) => re.test(s));
}
function metros(a, b) {
  const R = 6371000, toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLon = toR(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------- Overpass con caché y reintentos ----------
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function overpass() {
  if (DESDE) {
    console.log(`Usando datos guardados: ${DESDE}`);
    return { data: JSON.parse(fs.readFileSync(DESDE, 'utf8')), fuente: `archivo ${path.basename(DESDE)}` };
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const key = crypto.createHash('sha1').update(QUERY).digest('hex').slice(0, 12);
  const cacheFile = path.join(CACHE_DIR, `plaza-${key}.json`);
  if (fs.existsSync(cacheFile)) {
    const ageDays = (Date.now() - fs.statSync(cacheFile).mtimeMs) / 86400000;
    if (ageDays < CACHE_DAYS) {
      console.log(`Caché de Overpass (${ageDays.toFixed(1)} días): ${cacheFile}`);
      return { data: JSON.parse(fs.readFileSync(cacheFile, 'utf8')), fuente: 'caché de Overpass' };
    }
  }
  if (SIN_RED) throw new Error('Sin caché válida y --sin-red activo. Usa --desde <archivo.json>.');
  let lastErr;
  for (let intento = 1; intento <= 3; intento++) {
    try {
      console.log(`Consultando Overpass (intento ${intento} de 3)…`);
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(QUERY),
      });
      const text = await res.text();
      const ocupado = res.status === 429 || res.status === 504 || /too busy|rate_limited|timed out/i.test(text.slice(0, 2000));
      if (!res.ok || ocupado || !text.trim().startsWith('{')) {
        throw Object.assign(new Error(`Overpass respondió ${res.status}${ocupado ? ' (ocupado)' : ''}`), { reintentar: true });
      }
      const data = JSON.parse(text);
      if (!Array.isArray(data.elements) || data.elements.length === 0) throw Object.assign(new Error('Overpass devolvió 0 elementos'), { reintentar: true });
      fs.writeFileSync(cacheFile, text);
      return { data, fuente: 'Overpass en vivo' };
    } catch (e) {
      lastErr = e;
      console.warn(`  Falló: ${e.message}`);
      if (intento < 3) { console.log('  Espero 60 s antes de reintentar…'); await sleep(60000); }
    }
  }
  throw lastErr;
}

// ---------- procesar ----------
function tipoDe(t) {
  for (const k of ['amenity', 'shop']) {
    const key = `${k}=${t[k]}`;
    if (TIPO[key]) {
      let [nicho, etiqueta, encaje] = TIPO[key];
      if (key === 'shop=hairdresser' && /barber/i.test(t.hairdresser || '')) etiqueta = 'Barbería';
      return { nicho, etiqueta, encaje, osmTipo: key };
    }
  }
  return null;
}

function direccion(t) {
  const street = t['addr:street'] || '';
  const num = (t['addr:housenumber'] || '').replace(/\+?53[\s\d]{6,}/g, '').trim();
  let calle = street;
  if (/^[0-9]+[A-Za-z]?$/.test(street) || /^[A-Za-z]$/.test(street)) calle = `Calle ${street}`;
  const partes = [calle && num ? `${calle} ${num}` : calle];
  if (t['addr:suburb']) partes.push(t['addr:suburb']);
  return partes.filter(Boolean).join(', ');
}
function zona(t, lat) {
  const sub = t['addr:suburb'] || t['addr:neighbourhood'] || t['addr:quarter'];
  if (sub) return sub;
  if (/nuevo vedado/i.test(t['addr:city'] || '')) return 'el Nuevo Vedado';
  return lat >= 23.127 ? 'el Vedado' : 'Plaza';
}

function procesar(elements) {
  const stats = { total: elements.length, enNicho: 0, sinNombre: 0, sinTelefono: 0, conWebORedes: 0, estatales: 0, clinicas: 0, duplicados: 0, candidatos: 0 };
  const estatalesVistos = [];
  const todos = [];
  for (const e of elements) {
    const t = e.tags || {};
    const tipo = tipoDe(t);
    if (!tipo) continue;
    const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
    if (lat == null) continue;
    todos.push({ e, t, tipo, lat, lon });
  }
  stats.enNicho = todos.length;

  const out = [];
  const vistos = new Set();
  for (const x of todos) {
    const { e, t, tipo, lat, lon } = x;
    if (!t.name) { stats.sinNombre++; continue; }
    const tels = telefonos(t);
    if (!tels.length) { stats.sinTelefono++; continue; }
    const web = WEB_KEYS.some((k) => t[k]);
    const redes = SOCIAL_KEYS.some((k) => t[k]);
    if (web || redes) { stats.conWebORedes++; continue; }
    const est = esEstatal(t);
    if (est) { stats.estatales++; estatalesVistos.push(`${t.name} (${est})`); continue; }
    if (esClinica(t)) { stats.clinicas++; continue; }
    const dupKey = tels[0].national;
    const nameKey = t.name.toLowerCase().replace(/\s+/g, ' ').trim();
    if (vistos.has(dupKey) || vistos.has(nameKey)) { stats.duplicados++; continue; }
    vistos.add(dupKey); vistos.add(nameKey);

    const tel = tels[0];
    // Señal de "calle con paso": calle principal (6) + negocios de estos nichos a menos de 200 m (hasta 4).
    const vecinos = todos.filter((o) => o !== x && metros(o, x) <= 200).length;
    const principal = calleDePaso(t['addr:street']);
    const densidad = vecinos >= 12 ? 4 : vecinos >= 8 ? 3 : vecinos >= 4 ? 2 : vecinos >= 1 ? 1 : 0;
    const pasoPts = (principal ? 6 : 0) + densidad;
    const paso = pasoPts >= 6;
    const tieneHorario = Boolean(t.opening_hours);
    const tieneDireccion = Boolean(t['addr:street'] && t['addr:housenumber']);

    let score = 0;
    const motivos = [];
    if (tel.movil) { score += 30; motivos.push({ ok: true, texto: 'Tiene celular: se le puede escribir por WhatsApp.' }); }
    else { score += 15; motivos.push({ ok: false, texto: 'Solo tiene teléfono fijo: hay que llamar, no tiene WhatsApp.' }); }
    score += 20; score += 15;
    motivos.push({ ok: true, texto: 'No tiene web ni redes en el mapa.' });
    if (tieneHorario) { score += 10; motivos.push({ ok: true, texto: 'Tiene horario publicado: señal de que está vivo.' }); }
    else if (tieneDireccion) { score += 5; motivos.push({ ok: true, texto: 'Tiene dirección completa, pero no horario.' }); }
    else motivos.push({ ok: false, texto: 'Sin horario ni dirección completa: confirma que sigue abierto.' });
    if (!t['addr:street']) { score -= 5; motivos.push({ ok: false, texto: 'Sin calle en el mapa: búscalo en Maps antes de escribir.' }); }
    score += pasoPts;
    if (principal) motivos.push({ ok: true, texto: `Está en una calle de mucho paso${vecinos >= 4 ? `, con ${vecinos} negocios cerca` : ''}.` });
    else if (vecinos >= 8) motivos.push({ ok: true, texto: `Zona con movimiento: ${vecinos} negocios parecidos cerca.` });
    else motivos.push({ ok: false, texto: 'Calle tranquila: menos gente pasa por delante.' });
    score += tipo.encaje;
    const encajeTexto = {
      'amenity=restaurant': 'Restaurante: le sirve un menú con pedidos por WhatsApp.',
      'amenity=cafe': 'Cafetería: le sirve un menú con pedidos por WhatsApp.',
      'amenity=fast_food': 'Comida rápida: un menú con pedidos le encaja, aunque vende barato.',
      'amenity=bar': 'Es un bar: encaja menos que un restaurante.',
      'shop=mobile_phone': 'Vende productos sueltos: le sirve un catálogo con precios.',
      'shop=electronics': 'Vende equipos: un catálogo le sirve, pero vende menos piezas.',
      'shop=computer': 'Vende equipos: un catálogo le sirve, pero vende menos piezas.',
    }[tipo.osmTipo] || 'Trabaja con citas: le encaja un calendario por WhatsApp.';
    motivos.push({ ok: tipo.encaje >= 15, texto: encajeTexto });
    motivos.push({ ok: false, texto: 'El dato del mapa no tiene fecha. Confirma que sigue abierto.' });
    score = Math.max(0, Math.min(100, score));

    // motivo corto para la lista y el CSV
    const corto = [];
    corto.push(tel.movil ? 'Celular con WhatsApp' : 'Solo teléfono fijo');
    corto.push('sin web ni redes');
    if (tieneHorario) corto.push('con horario');
    if (paso) corto.push('zona de mucho paso');
    corto.push(tipo.nicho === 'belleza' ? 'trabaja con citas' : tipo.osmTipo === 'amenity=bar' ? 'es un bar' : tipo.nicho === 'comida' ? 'vende comida' : 'vende productos');
    if (!t['addr:street']) corto.push('sin calle en el mapa');
    let reason = corto.join(', ') + '.';
    reason = reason.charAt(0).toUpperCase() + reason.slice(1);

    const nombre = t.name.trim();
    const z = zona(t, lat);
    const mensaje = `Hola, ¿qué tal? Soy Ernesto, de NEXO. Vi ${nombre} en ${z} y te preparé una idea. ${NICHOS[tipo.nicho].beneficio} La tienes lista en 24 horas, sin compromiso. ¿Te la mando para que la veas?`;
    const addr = direccion(t);
    out.push({
      id: `${e.type}/${e.id}`,
      name: nombre,
      niche: tipo.nicho,
      niche_label: NICHOS[tipo.nicho].nombre,
      kind: tipo.etiqueta,
      address: addr,
      zone: z,
      phone: tel.display,
      phone_e164: tel.e164,
      phone_mobile: tel.movil,
      other_phones: tels.slice(1).map((p) => p.display),
      opening_hours: t.opening_hours || '',
      score,
      reason,
      reasons: motivos,
      message: mensaje,
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
      osm_url: `https://www.openstreetmap.org/${e.type}/${e.id}`,
      maps_url: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${nombre} ${addr || ''} La Habana`.replace(/\s+/g, ' ').trim()),
      status: 'Nueva',
    });
  }
  stats.candidatos = out.length;
  return { lista: out, stats, estatalesVistos };
}

function elegirTop(lista, top) {
  const porScore = (a, b) => b.score - a.score || Number(b.phone_mobile) - Number(a.phone_mobile) || a.name.localeCompare(b.name, 'es');
  const grupos = {};
  for (const n of Object.keys(NICHOS)) grupos[n] = lista.filter((x) => x.niche === n).sort(porScore);
  const totalCuota = Object.values(NICHOS).reduce((s, n) => s + n.cuota, 0);
  const elegidos = [];
  for (const [n, cfg] of Object.entries(NICHOS)) elegidos.push(...grupos[n].slice(0, Math.round((cfg.cuota * top) / totalCuota)));
  if (elegidos.length < top) {
    const resto = lista.filter((x) => !elegidos.includes(x)).sort(porScore);
    elegidos.push(...resto.slice(0, top - elegidos.length));
  }
  return elegidos.slice(0, top).sort(porScore);
}

// ---------- salidas ----------
function csvCell(v) {
  const s = String(v ?? '');
  return '"' + s.replace(/"/g, '""') + '"';
}
function escribirCSV(file, filas) {
  const cols = ['id', 'name', 'niche', 'address', 'phone', 'opening_hours', 'score', 'reason', 'osm_url', 'maps_url', 'status'];
  const lines = [cols.join(',')];
  for (const f of filas) lines.push(cols.map((c) => csvCell(c === 'niche' ? f.niche_label : f[c])).join(','));
  fs.writeFileSync(file, '﻿' + lines.join('\r\n') + '\r\n');
}

function limpiarSVG(svg) {
  return svg.replace(/<metadata>[\s\S]*?<\/metadata>/g, '').replace(/\s*xmlns:c2pa="[^"]*"/g, '');
}
function logoSVG() {
  const raw = limpiarSVG(fs.readFileSync(path.join(DS_DIR, 'assets', 'Logo', 'nexo-horizontal-tinta.svg'), 'utf8'));
  return raw
    .replace(/fill="#121212"/g, 'fill="currentColor"')
    .replace(/\swidth="\d+"\s+height="\d+"/, '')
    .replace('<svg ', '<svg class="logo" focusable="false" ');
}
function iconos(nombres) {
  const out = {};
  for (const n of nombres) {
    const raw = limpiarSVG(fs.readFileSync(path.join(DS_DIR, 'assets', 'Iconos', `icono-${n}.svg`), 'utf8'));
    const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    out[n] = inner;
  }
  return out;
}
function fuentes() {
  return [400, 600, 700, 800].map((w) => {
    const b64 = fs.readFileSync(path.join(DS_DIR, 'fonts', `Archivo-${w}.woff2`)).toString('base64');
    return `@font-face{font-family:Archivo;font-weight:${w};font-style:normal;font-display:swap;src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
  }).join('\n');
}

function escribirHTML(file, filas, meta) {
  const plantilla = fs.readFileSync(path.join(HERE, 'plantilla-cazador.html'), 'utf8');
  const tokens = fs.readFileSync(path.join(DS_DIR, 'tokens.css'), 'utf8');
  const datos = JSON.stringify({ meta, negocios: filas }).replace(/</g, '\\u003c');
  const html = plantilla
    .replace('/*__FUENTES__*/', () => fuentes())
    .replace('/*__TOKENS__*/', () => tokens)
    .replace('<!--__LOGO__-->', () => logoSVG())
    .replace('"__ICONOS__"', () => JSON.stringify(iconos(['bien', 'aviso', 'info', 'mensaje', 'buscar', 'siguiente', 'cerrar', 'error'])))
    .replace('"__DATOS__"', () => datos);
  fs.writeFileSync(file, html);
}

// ---------- principal ----------
const { data, fuente } = await overpass();
const { lista, stats, estatalesVistos } = procesar(data.elements || []);
const top = elegirTop(lista, TOP);
fs.mkdirSync(OUT_DIR, { recursive: true });
const csvFile = path.join(OUT_DIR, `${FECHA}-plaza-vedado.csv`);
const htmlFile = path.join(OUT_DIR, 'cazador-v0.html');
escribirCSV(csvFile, top);
const meta = {
  fecha: FECHA,
  zona: 'Plaza de la Revolución / El Vedado',
  fuente,
  datos_osm: data.osm3s?.timestamp_osm_base || '',
  candidatos: stats.candidatos,
  porNicho: Object.fromEntries(Object.keys(NICHOS).map((n) => [n, top.filter((x) => x.niche === n).length])),
  clave: `cazador-v0:${FECHA}-plaza-vedado`,
};
escribirHTML(htmlFile, top, meta);

console.log('\nResumen');
console.log(`  Fuente: ${fuente} (OSM ${meta.datos_osm || 'sin fecha'})`);
console.log(`  Elementos: ${stats.total} · de los 3 nichos: ${stats.enNicho}`);
console.log(`  Fuera: sin nombre ${stats.sinNombre}, sin teléfono ${stats.sinTelefono}, con web o redes ${stats.conWebORedes}, estatales ${stats.estatales}, clínicas ${stats.clinicas}, repetidos ${stats.duplicados}`);
console.log(`  Candidatos: ${stats.candidatos} → elegidos ${top.length} (comida ${meta.porNicho.comida}, belleza ${meta.porNicho.belleza}, móviles ${meta.porNicho.moviles})`);
console.log(`  Con celular (WhatsApp): ${top.filter((x) => x.phone_mobile).length} · solo fijo: ${top.filter((x) => !x.phone_mobile).length}`);
if (args.includes('--ver-estatales')) console.log('  Estatales quitados:\n   - ' + estatalesVistos.join('\n   - '));
console.log(`  CSV:  ${path.relative(REPO, csvFile)}`);
console.log(`  HTML: ${path.relative(REPO, htmlFile)}`);
