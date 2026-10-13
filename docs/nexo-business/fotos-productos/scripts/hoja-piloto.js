// Hoja de contacto del piloto: por producto, nombre, fotos finales (verde) y descartadas (cruz roja).
// Uso: node hoja-piloto.js <carpeta-piloto>
const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/Ernesto/ernesto-rondon-nexo/node_modules/sharp');

const base = process.argv[2];
const C = { crema: '#F6F1E6', marron: '#2B2420', petroleo: '#0D3B45', ambar: '#A35A1F', rojo: '#C62828', verde: '#2E7D32' };
const W = 2400, ROW = 330, HEAD = 150, FIN = 230, REJ = 98;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const limpio = (s) => s.replace(/[\u{1F000}-\u{1FFFF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim();

function partir(texto, max) {
  const out = []; let linea = '';
  for (const w of texto.split(' ')) {
    if ((linea + ' ' + w).trim().length > max) { out.push(linea.trim()); linea = w; } else linea += ' ' + w;
  }
  if (linea.trim()) out.push(linea.trim());
  return out.slice(0, 3);
}

async function miniatura(file, lado, { borde, rechazada, etiqueta }) {
  const img = await sharp(file).flatten({ background: '#ffffff' }).resize(lado, lado, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
  const svg = `<svg width="${lado}" height="${lado}">
    <rect x="1.5" y="1.5" width="${lado - 3}" height="${lado - 3}" fill="none" stroke="${borde}" stroke-width="${rechazada ? 3 : 5}"/>
    ${rechazada ? `<line x1="8" y1="8" x2="${lado - 8}" y2="${lado - 8}" stroke="${C.rojo}" stroke-width="5" opacity="0.85"/><line x1="${lado - 8}" y1="8" x2="8" y2="${lado - 8}" stroke="${C.rojo}" stroke-width="5" opacity="0.85"/>` : ''}
    <rect x="0" y="${lado - (rechazada ? 24 : 32)}" width="${rechazada ? 46 : 92}" height="${rechazada ? 24 : 32}" fill="${borde}"/>
    <text x="6" y="${lado - (rechazada ? 6 : 9)}" font-family="Arial" font-size="${rechazada ? 17 : 22}" font-weight="bold" fill="#fff">${esc(etiqueta)}</text>
  </svg>`;
  return sharp(img).composite([{ input: Buffer.from(svg), left: 0, top: 0 }]).png().toBuffer();
}

(async () => {
  const piloto = JSON.parse(fs.readFileSync(path.join(base, 'piloto.json'), 'utf8'));
  const audit = JSON.parse(fs.readFileSync(path.join(base, 'auditoria.json'), 'utf8'));
  const norm = JSON.parse(fs.readFileSync(path.join(base, 'normalizacion.json'), 'utf8'));
  const H = HEAD + piloto.length * ROW + 60;
  const comps = [];
  const listos = piloto.filter((p) => !audit[p.short].estado.startsWith('BLOQUEADO')).length;
  comps.push({ input: Buffer.from(`<svg width="${W}" height="${HEAD}">
    <rect width="${W}" height="${HEAD}" fill="${C.petroleo}"/>
    <text x="40" y="62" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="${C.crema}">Casa Viva · Piloto de fotos de producto (Digital Store, bajo pedido)</text>
    <text x="40" y="112" font-family="Arial" font-size="27" fill="${C.crema}">12 productos · ${listos} listos para la web · ${piloto.length - listos} bloqueados (falta foto buena) · borde verde = foto final 1200x1200 · cruz roja = descartada · numero = nota 0-10</text>
  </svg>`), left: 0, top: 0 });

  for (let i = 0; i < piloto.length; i++) {
    const p = piloto[i];
    const a = audit[p.short];
    const y = HEAD + i * ROW;
    const bloqueado = a.estado.startsWith('BLOQUEADO');
    const conWeb = a.estado.includes('web');
    const finales = (norm[p.short] || []);
    const elegidas = [...a.fotos.filter((f) => f.decision === 'principal'), ...a.fotos.filter((f) => f.decision === 'galeria')];
    const rechazadas = a.fotos.filter((f) => f.decision === 'rechazada');
    const nOrig = a.fotos.filter((f) => f.archivo.startsWith('original/')).length;
    const nWeb = a.fotos.filter((f) => f.archivo.startsWith('web/')).length;
    const lineas = partir(limpio(p.nombre), 26);
    const estadoTxt = bloqueado ? 'BLOQUEADO: falta foto' : conWeb ? 'LISTO (fotos de la web)' : 'LISTO (fotos del proveedor)';
    const estadoCol = bloqueado ? C.rojo : conWeb ? C.ambar : C.verde;
    const fondoFila = i % 2 ? '#FFFFFF' : C.crema;
    comps.push({ input: Buffer.from(`<svg width="${W}" height="${ROW}">
      <rect width="${W}" height="${ROW}" fill="${fondoFila}"/>
      <line x1="0" y1="${ROW - 1}" x2="${W}" y2="${ROW - 1}" stroke="#d8cfbd" stroke-width="2"/>
      <text x="30" y="46" font-family="Arial" font-size="22" fill="${C.ambar}">${i + 1}. ${esc(p.short)} · ${esc(p.categoria)}</text>
      ${lineas.map((l, k) => `<text x="30" y="${90 + k * 38}" font-family="Arial" font-size="32" font-weight="bold" fill="${C.marron}">${esc(l)}</text>`).join('')}
      <rect x="30" y="${90 + lineas.length * 38 - 10}" width="${estadoTxt.length * 14 + 24}" height="40" rx="8" fill="${estadoCol}"/>
      <text x="42" y="${90 + lineas.length * 38 + 18}" font-family="Arial" font-size="23" font-weight="bold" fill="#fff">${esc(estadoTxt)}</text>
      <text x="30" y="${ROW - 30}" font-family="Arial" font-size="21" fill="${C.marron}">Proveedor: ${nOrig} fotos · web: ${nWeb} · usadas: ${finales.filter((f) => f.carpeta === 'final').length} · ${esc(p.precioBase + ' USD costo')}</text>
      <text x="560" y="34" font-family="Arial" font-size="20" fill="${C.petroleo}">${bloqueado ? 'PROVISIONAL (no publicar)' : 'FINALES 1200x1200'}</text>
      <text x="1550" y="34" font-family="Arial" font-size="20" fill="${C.rojo}">DESCARTADAS (${rechazadas.length})</text>
    </svg>`), left: 0, top: y });

    // Finales (o provisional)
    for (let k = 0; k < finales.length; k++) {
      const f = finales[k];
      const dir = path.join(base, p.short, f.carpeta, f.salida);
      const src = elegidas.find((e) => e.archivo === f.desde) || a.fotos.find((e) => e.archivo === f.desde);
      const nota = src ? src.nota : '?';
      const etiqueta = (k === 0 && !bloqueado ? 'P ' : '') + 'nota ' + nota;
      const t = await miniatura(dir, FIN, { borde: bloqueado ? C.ambar : C.verde, rechazada: false, etiqueta });
      comps.push({ input: t, left: 560 + k * (FIN + 12), top: y + 50 });
    }
    if (!finales.length) {
      comps.push({ input: Buffer.from(`<svg width="${FIN * 2}" height="${FIN}"><rect x="2" y="2" width="${FIN * 2 - 4}" height="${FIN - 4}" fill="#fff" stroke="${C.rojo}" stroke-width="4" stroke-dasharray="12 8"/><text x="30" y="${FIN / 2}" font-family="Arial" font-size="28" fill="${C.rojo}">Sin foto valida.</text><text x="30" y="${FIN / 2 + 40}" font-family="Arial" font-size="22" fill="${C.marron}">Pedir foto real al proveedor</text></svg>`), left: 560, top: y + 50 });
    }
    // Descartadas: 2 filas de 8
    for (let k = 0; k < rechazadas.length && k < 16; k++) {
      const f = rechazadas[k];
      const t = await miniatura(path.join(base, p.short, f.archivo), REJ, { borde: C.rojo, rechazada: true, etiqueta: String(f.nota) });
      comps.push({ input: t, left: 1550 + (k % 8) * (REJ + 7), top: y + 50 + Math.floor(k / 8) * (REJ + 8) });
    }
    // Aviso corto bajo descartadas
    const aviso = a.aviso ? limpio(a.aviso) : '';
    if (aviso) {
      const al = partir(aviso, 70).slice(0, 2);
      comps.push({ input: Buffer.from(`<svg width="830" height="70">${al.map((l, k) => `<text x="0" y="${22 + k * 28}" font-family="Arial" font-size="20" font-style="italic" fill="${C.ambar}">${esc(l)}</text>`).join('')}</svg>`), left: 1550, top: y + 50 + (rechazadas.length > 8 ? 2 : 1) * (REJ + 8) + 12 });
    }
  }
  comps.push({ input: Buffer.from(`<svg width="${W}" height="60"><rect width="${W}" height="60" fill="${C.marron}"/><text x="40" y="40" font-family="Arial" font-size="22" fill="${C.crema}">Generado el 2026-10-12 por Claude · docs/nexo-business/fotos-productos/piloto · P = foto principal · Nada se ha publicado.</text></svg>`), left: 0, top: H - 60 });

  await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
    .composite(comps).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(base, 'hoja-piloto.jpg'));
  console.log('ok', W, H);
})();
