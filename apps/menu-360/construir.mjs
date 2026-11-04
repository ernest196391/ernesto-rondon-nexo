// Fábrica /menu-360: de docs/clientes/<slug>/negocio.json a una carpeta lista para subir.
//
// Uso:   node apps/menu-360/construir.mjs <slug> [--sin-capturas]
// Sale:  apps/menu-360/dist/<slug>/            → se sube tal cual a public_html/<slug>/
//          index.html, app.js, menu.js, giros/, img/ …   (el menú 360°)
//          propuesta/                              (la página para el dueño, con video y descargas)
//        apps/menu-360/dist/<slug>-impresos/       (cartel y tarjeta en HTML, por si hay que retocar)
//
// Necesita: ffmpeg y ffprobe en el PATH, Google Chrome (o la variable CHROME) y `npm install` en apps/menu-360.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "../..");
const PLANTILLA = path.join(AQUI, "plantilla");
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const slug = process.argv[2];
const sinCapturas = process.argv.includes("--sin-capturas");
if (!slug) { console.error("Uso: node apps/menu-360/construir.mjs <slug>"); process.exit(1); }

const CLIENTE = path.join(RAIZ, "docs/clientes", slug);
const N = JSON.parse(fs.readFileSync(path.join(CLIENTE, "negocio.json"), "utf8"));
const DIST = path.join(AQUI, "dist", slug);
const IMPRESOS = path.join(AQUI, "dist", slug + "-impresos");
const avisos = [];

// ---------- utilidades ----------
function correr(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (r.status !== 0) throw new Error(cmd + " falló: " + (r.stderr || r.stdout || "").slice(-600));
  return r.stdout;
}
const ffmpeg = (...a) => correr("ffmpeg", ["-v", "error", "-y", ...a]);
function chrome(...a) {
  correr(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-pdf-header-footer",
    "--user-data-dir=" + path.join(AQUI, "dist", ".chrome"), ...a]);
}
const url = (f) => pathToFileURL(f).href;
const fuente = (rel) => path.join(CLIENTE, rel);
function copiarDir(de, a) {
  fs.mkdirSync(a, { recursive: true });
  for (const e of fs.readdirSync(de, { withFileTypes: true })) {
    const o = path.join(de, e.name), d = path.join(a, e.name);
    if (e.isDirectory()) copiarDir(o, d); else fs.copyFileSync(o, d);
  }
}
function rgb(hex) { const n = parseInt(hex.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(", "); }
function miles(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// Rellena {{CLAVE}} y quita los bloques <!--SI:x-->…<!--FIN:x--> cuando V.si_x es falso.
function llenar(texto, V, nombre) {
  texto = texto.replace(/<!--SI:(\w+)-->([\s\S]*?)<!--FIN:\1-->/g, (_, k, dentro) => (V["si_" + k] ? dentro : ""));
  texto = texto.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, k) => (k in V ? V[k] : m));
  const falta = texto.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (falta) throw new Error(nombre + ": faltan datos para " + [...new Set(falta)].join(", "));
  return texto;
}
function llenarArchivo(f, V) { fs.writeFileSync(f, llenar(fs.readFileSync(f, "utf8"), V, path.relative(AQUI, f))); }

// ---------- datos derivados ----------
const productos = N.categorias.flatMap((c) => c.productos.map((p) => ({ ...p, cat: c })));
const conGiro = productos.filter((p) => p.giro);
if (!conGiro.length) throw new Error("Ningún producto tiene \"giro\": true");
const heroe = N.fuentes.heroe || conGiro[0].id;
const lugar = N.lugar || "el local";
const lugarSin = lugar.replace(/^(el|la|los|las)\s+/i, "");
const lugarDel = /^el\s/i.test(lugar) ? "del " + lugarSin : "de " + lugar;
const grupo = N.grupo && N.grupo.enlace ? N.grupo : null;
const qr2 = grupo ? grupo.enlace : "https://api.whatsapp.com/send?phone=" + N.whatsapp;
const tieneVideo = !!(N.fuentes.video && fs.existsSync(fuente(N.fuentes.video)));
const P = N.propuesta || {};
let total = 0;
const filas = (P.valor || []).map(([etiqueta, valor]) => {
  const e = etiqueta.replace(/\{n_giros\}/g, conGiro.length);
  if (typeof valor === "number") total += valor;
  return `<div class="fila"><span>${esc(e)}</span><span>${typeof valor === "number" ? miles(valor) + " USD" : esc(valor)}</span></div>`;
}).join("\n      ");

const C = N.colores;
const V = {
  NOMBRE: esc(N.nombre), SLUG: slug, URL: N.url, URL_CORTA: N.url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
  MARCA_HTML: esc(N.marca.antes) + "<b>" + esc(N.marca.acento || "") + "</b>",
  MARCA_TXT: esc(N.marca.antes + (N.marca.acento || "")),
  INTRO_LETRAS: [...N.marca.antes].map((l, i) => `<span style="animation-delay:${(0.35 + i * 0.07).toFixed(2)}s">${esc(l)}</span>`).join("") +
    [...(N.marca.acento || "")].map((l, i) => `<span class="n" style="animation-delay:${(0.42 + (N.marca.antes.length + i) * 0.07).toFixed(2)}s">${esc(l)}</span>`).join(""),
  WA_VISIBLE: esc(N.whatsapp_visible), GRUPO_NOMBRE: esc(grupo ? grupo.nombre : "WhatsApp " + N.whatsapp_visible),
  HORARIO_TEXTO: esc(N.horario.texto), HORARIO_CORTO: esc(N.horario.corto || N.horario.texto),
  PIE_TARJETA: esc(N.pie_tarjeta || N.aviso || ""), AVISO: esc(N.aviso || ""),
  LUGAR: esc(lugar), LUGAR_SIN: esc(lugarSin), LUGAR_DEL: esc(lugarDel),
  PIE_DOMICILIO: N.domicilio ? "🛵 Servicio a domicilio · " : "Pide por WhatsApp · ",
  COLORES_CSS: `:root{--acento:${C.acento};--acento-claro:${C.acento_claro};--acento-brillo:${C.acento_brillo || C.acento_claro};` +
    `--acento-oscuro:${C.acento_oscuro};--papel:${C.papel};--acento-rgb:${rgb(C.acento)};--acento2-rgb:${rgb(C.acento_claro)}}`,
  SW_ESTUDIO: conGiro.map((p) => `"img/estudio/${p.id}.webp"`).join(", "),
  VERSION: new Date().toISOString().replace(/\D/g, "").slice(0, 12),
  HEROE: heroe,
  PLATO1: conGiro[0].id + ".webp", PLATO2: (conGiro[1] || conGiro[0]).id + ".webp", PLATO3: (conGiro[2] || conGiro[0]).id + ".webp",
  VALOR_FILAS: filas, VALOR_TOTAL_NUM: total, MANTENIMIENTO: esc(P.mantenimiento || "un expreso al día"),
  si_mensajeros: !!P.mensajeros, si_video: tieneVideo,
  ...(grupo ? {
    L2_TITULO: "Únete al<br><em>grupo</em>", L2_TITULO_TARJETA: "Pide por<br><em>el grupo</em>",
    L2_LINEA: N.domicilio ? "Pide a domicilio por el grupo" : "Pide por el grupo",
    L2_PASO: "<b>Escanea</b> y toca «Unirme al grupo»",
    L2_TEXTO_TARJETA: `Únete a <b>${esc(grupo.nombre)}</b>: ofertas del día${N.domicilio ? " y servicio a domicilio" : ""}.`,
    L2_NOMBRE_CORTO: "su grupo de WhatsApp", L2_NOMBRE_CORTO_HTML: `su grupo <b>${esc(grupo.nombre)}</b>`,
    L2_CAPTION: "Su grupo de WhatsApp", L2_CORTO: "el grupo",
  } : {
    L2_TITULO: "Pide por<br><em>WhatsApp</em>", L2_TITULO_TARJETA: "Pide por<br><em>WhatsApp</em>",
    L2_LINEA: N.domicilio ? "Pide a domicilio por WhatsApp" : "Pide por WhatsApp",
    L2_PASO: "<b>Escanea</b> y escríbenos", L2_TEXTO_TARJETA: "Escríbenos y te lo dejamos listo.",
    L2_NOMBRE_CORTO: "su WhatsApp", L2_NOMBRE_CORTO_HTML: "su <b>WhatsApp</b>", L2_CAPTION: "Su WhatsApp", L2_CORTO: "WhatsApp",
  }),
};

// ---------- 1. el menú 360° ----------
console.log("· " + N.nombre + ": preparando la carpeta");
fs.rmSync(DIST, { recursive: true, force: true });
fs.rmSync(IMPRESOS, { recursive: true, force: true });
copiarDir(path.join(PLANTILLA, "app"), DIST);
for (const f of ["index.html", "app.js", "sw.js", "manifest.webmanifest"]) llenarArchivo(path.join(DIST, f), V);

const menu = {
  negocio: N.nombre, whatsapp: N.whatsapp, emoji: N.emoji || "", horario: N.horario, domicilio: !!N.domicilio,
  aviso: N.aviso || "", frases: N.frases_cinta || [],
  categorias: N.categorias.map((c) => ({
    id: c.id, nombre: c.nombre, icono: c.icono, nota: c.nota,
    productos: c.productos.map((p) => {
      const o = { id: p.id, nombre: p.nombre, precio: p.precio };
      if (p.frase) o.frase = p.frase;
      if (p.icono) o.icono = p.icono;
      if (p.giro) { o.estudio = `img/estudio/${p.id}.webp`; o.giro = `giros/${p.id}.webp`; }
      return o;
    }),
  })),
};
fs.writeFileSync(path.join(DIST, "menu.js"),
  "// Generado por apps/menu-360/construir.mjs desde docs/clientes/" + slug + "/negocio.json. No editar a mano: cambia el JSON y vuelve a construir.\n" +
  "window.MENU = " + JSON.stringify(menu, null, 2) + ";\n");

console.log("· logo, iconos y fotos de estudio");
fs.mkdirSync(path.join(DIST, "img/estudio"), { recursive: true });
fs.mkdirSync(path.join(DIST, "giros"), { recursive: true });
const logo = fuente(N.fuentes.logo);
ffmpeg("-i", logo, "-vf", "scale=192:-1:flags=lanczos", "-c:v", "libwebp", "-quality", "85", path.join(DIST, "img/logo.webp"));
ffmpeg("-i", logo, "-vf", "scale=-1:176:flags=lanczos,pad=192:192:(ow-iw)/2:(oh-ih)/2:color=0x111111", path.join(DIST, "img/icono-192.png"));
ffmpeg("-i", logo, "-vf", "scale=-1:470:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x111111", path.join(DIST, "img/icono-512.png"));
for (const p of conGiro) {
  const est = path.join(fuente(N.fuentes.estudio), p.id + ".png");
  if (!fs.existsSync(est)) throw new Error("Falta la foto de estudio " + path.relative(RAIZ, est));
  ffmpeg("-i", est, "-vf", "scale=400:400:flags=lanczos", "-c:v", "libwebp", "-quality", "78", path.join(DIST, `img/estudio/${p.id}.webp`));
}

console.log("· giros 360° (36 fotogramas en una hoja 6×6)");
for (const p of conGiro) {
  const mp4 = path.join(fuente(N.fuentes.giros), p.id + ".mp4");
  if (!fs.existsSync(mp4)) throw new Error("Falta el giro " + path.relative(RAIZ, mp4));
  const dur = parseFloat(correr("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]));
  ffmpeg("-i", mp4, "-vf", `fps=36/${dur},scale=400:400:flags=lanczos,tile=6x6`, "-frames:v", "1", "-c:v", "libwebp", "-quality", "68",
    path.join(DIST, `giros/${p.id}.webp`));
}

// ---------- 2. impresos: QR, cartel, tarjeta y vista previa ----------
console.log("· QR, cartel, tarjeta y vista previa");
fs.mkdirSync(IMPRESOS, { recursive: true });
for (const f of ["cartel.html", "tarjeta.html", "og.html"]) {
  fs.writeFileSync(path.join(IMPRESOS, f), llenar(fs.readFileSync(path.join(PLANTILLA, "impresos", f), "utf8"), V, f));
}
for (const f of ["anton.woff2", "inter.woff2"]) fs.copyFileSync(path.join(DIST, "fonts", f), path.join(IMPRESOS, f));
fs.copyFileSync(path.join(DIST, "img/logo.webp"), path.join(IMPRESOS, "logo.webp"));
for (const p of conGiro.slice(0, 3)) fs.copyFileSync(path.join(DIST, `img/estudio/${p.id}.webp`), path.join(IMPRESOS, p.id + ".webp"));
fs.copyFileSync(path.join(fuente(N.fuentes.estudio), heroe + ".png"), path.join(IMPRESOS, "heroe.png"));
const opcionesQR = { type: "svg", errorCorrectionLevel: "H", margin: 0, color: { dark: "#111111", light: "#ffffff" } };
fs.writeFileSync(path.join(IMPRESOS, "qr-menu.svg"), await QRCode.toString(N.url, opcionesQR));
fs.writeFileSync(path.join(IMPRESOS, "qr-grupo.svg"), await QRCode.toString(qr2, opcionesQR));

const PROP = path.join(DIST, "propuesta");
copiarDir(path.join(PLANTILLA, "propuesta"), PROP);
llenarArchivo(path.join(PROP, "index.html"), V);
fs.mkdirSync(path.join(PROP, "img"), { recursive: true });
fs.mkdirSync(path.join(PROP, "archivos"), { recursive: true });
for (const f of ["qr-menu.svg", "qr-grupo.svg"]) fs.copyFileSync(path.join(IMPRESOS, f), path.join(PROP, "img", f));

chrome("--virtual-time-budget=4000", "--print-to-pdf=" + path.join(PROP, `archivos/cartel-mesa-${slug}.pdf`), url(path.join(IMPRESOS, "cartel.html")));
chrome("--virtual-time-budget=4000", "--print-to-pdf=" + path.join(PROP, `archivos/tarjeta-regalo-${slug}.pdf`), url(path.join(IMPRESOS, "tarjeta.html")));
const tmp = path.join(IMPRESOS, "_capturas"); fs.mkdirSync(tmp, { recursive: true });
chrome("--window-size=794,2246", "--force-device-scale-factor=4", "--virtual-time-budget=4000", "--screenshot=" + path.join(tmp, "tarjeta.png"), url(path.join(IMPRESOS, "tarjeta.html")));
ffmpeg("-i", path.join(tmp, "tarjeta.png"), "-vf", "crop=1286:832:302:166", path.join(PROP, `archivos/tarjeta-${slug}-menu.png`));
ffmpeg("-i", path.join(tmp, "tarjeta.png"), "-vf", "crop=1286:832:302:4658", path.join(PROP, `archivos/tarjeta-${slug}-grupo.png`));
ffmpeg("-i", path.join(PROP, `archivos/tarjeta-${slug}-menu.png`), "-vf", "scale=700:-1", "-q:v", "3", path.join(PROP, "img/tarjeta-menu.jpg"));
ffmpeg("-i", path.join(PROP, `archivos/tarjeta-${slug}-grupo.png`), "-vf", "scale=700:-1", "-q:v", "3", path.join(PROP, "img/tarjeta-grupo.jpg"));
chrome("--window-size=794,1123", "--force-device-scale-factor=1", "--virtual-time-budget=4000", "--screenshot=" + path.join(tmp, "cartel.png"), url(path.join(IMPRESOS, "cartel.html")));
ffmpeg("-i", path.join(tmp, "cartel.png"), "-vf", "scale=700:-1", "-q:v", "3", path.join(PROP, "img/cartel.jpg"));
chrome("--window-size=1200,630", "--force-device-scale-factor=1", "--virtual-time-budget=3000", "--screenshot=" + path.join(tmp, "og.png"), url(path.join(IMPRESOS, "og.html")));
ffmpeg("-i", path.join(tmp, "og.png"), "-q:v", "3", path.join(PROP, "img/og.jpg"));
ffmpeg("-i", path.join(tmp, "og.png"), "-q:v", "4", path.join(DIST, "img/portada.jpg"));

// ---------- 3. video y capturas del menú para la página del dueño ----------
if (tieneVideo) {
  fs.copyFileSync(fuente(N.fuentes.video), path.join(PROP, `archivos/video-${slug}.mp4`));
  const portada = N.fuentes.video_portada ? fuente(N.fuentes.video_portada) : null;
  if (portada && fs.existsSync(portada)) ffmpeg("-i", portada, "-vf", "scale=700:-1", "-q:v", "4", path.join(PROP, "img/video.jpg"));
  else ffmpeg("-ss", "1", "-i", fuente(N.fuentes.video), "-frames:v", "1", "-vf", "scale=700:-1", "-q:v", "4", path.join(PROP, "img/video.jpg"));
} else avisos.push("No hay video gancho: la página del dueño sale sin la sección de video.");

if (!sinCapturas) {
  console.log("· capturas del menú (Chrome)");
  chrome("--window-size=500,1083", "--force-device-scale-factor=2", "--virtual-time-budget=9000", "--screenshot=" + path.join(tmp, "app.png"), url(path.join(DIST, "index.html")));
  ffmpeg("-i", path.join(tmp, "app.png"), "-vf", "scale=700:-1", "-q:v", "4", path.join(PROP, "img/app-holograma.jpg"));
  chrome("--window-size=500,3000", "--force-device-scale-factor=2", "--virtual-time-budget=9000", "--screenshot=" + path.join(tmp, "app-larga.png"), url(path.join(DIST, "index.html")));
  ffmpeg("-i", path.join(tmp, "app-larga.png"), "-vf", "crop=1000:1700:0:1700,scale=700:-1", "-q:v", "4", path.join(PROP, "img/app-carta.jpg"));
} else avisos.push("Sin capturas del menú (--sin-capturas): la página del dueño usará las que ya hubiera.");

// ---------- 4. comprobaciones ----------
console.log("· comprobando");
function leerQR(png) {
  const img = PNG.sync.read(fs.readFileSync(png));
  const r = jsQR(new Uint8ClampedArray(img.data), img.width, img.height);
  return r ? r.data : null;
}
const q1 = leerQR(path.join(PROP, `archivos/tarjeta-${slug}-menu.png`));
const q2 = leerQR(path.join(PROP, `archivos/tarjeta-${slug}-grupo.png`));
const errores = [];
if (q1 !== N.url) errores.push("El QR del menú de la tarjeta no lleva a " + N.url + " (leído: " + q1 + ")");
if (q2 !== qr2) errores.push("El QR de la otra cara no lleva a " + qr2 + " (leído: " + q2 + ")");
for (const f of fs.readdirSync(DIST, { recursive: true })) {
  if (!/\.(html|js|webmanifest|css)$/.test(f)) continue;
  const t = fs.readFileSync(path.join(DIST, f), "utf8");
  if (/\{\{[A-Z0-9_]+\}\}/.test(t)) errores.push("Quedó un hueco sin rellenar en " + f);
}
for (const p of productos.filter((p) => p.foto_ia)) avisos.push(`La foto de «${p.nombre}» la inventó la IA: cámbiala cuando el negocio mande la suya.`);

function peso(dir) {
  let t = 0;
  for (const f of fs.readdirSync(dir, { recursive: true })) { const s = fs.statSync(path.join(dir, f)); if (s.isFile()) t += s.size; }
  return t;
}
const entrada = ["index.html", "styles.css", "app.js", "menu.js", "fonts/anton.woff2", "fonts/inter.woff2", "img/logo.webp", `giros/${conGiro[0].id}.webp`]
  .concat(conGiro.map((p) => `img/estudio/${p.id}.webp`)).reduce((s, f) => s + fs.statSync(path.join(DIST, f)).size, 0);

console.log("\n" + (errores.length ? "✗ HAY ERRORES" : "✓ Listo") + ": " + path.relative(RAIZ, DIST));
console.log("  Peso al abrir el menú: " + (entrada / 1024).toFixed(0) + " KB · carpeta completa: " + (peso(DIST) / 1048576).toFixed(1) + " MB");
console.log("  QR tarjeta: " + (q1 === N.url ? "✓" : "✗") + " menú · " + (q2 === qr2 ? "✓" : "✗") + (grupo ? " grupo" : " WhatsApp"));
for (const e of errores) console.log("  ✗ " + e);
for (const a of avisos) console.log("  ! " + a);
console.log("  Subir (con el SÍ de Ernesto): tar czf - -C apps/menu-360/dist " + slug + " | ssh web 'cd ~/domains/casaviva.company/public_html && tar xzf -'");
if (errores.length) process.exit(2);
