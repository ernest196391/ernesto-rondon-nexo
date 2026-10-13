// Busca un producto en Coolblue (tienda grande de NL/BE, fotos oficiales sobre blanco) y deja una entrada para web-bajar.
// Uso: node coolblue.mjs <entrada.json> <salida.json>   entrada: [{ id, q: "jbl clip 5", slug: ["zwart"] }]
import fs from 'fs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const H = { 'user-agent': UA, 'accept-language': 'nl-NL,nl;q=0.9' };
const [inp, out] = process.argv.slice(2);
const lista = JSON.parse(fs.readFileSync(inp, 'utf8'));
const res = [];
for (const e of lista) {
  try {
    const s = await (await fetch(`https://www.coolblue.nl/zoeken?query=${encodeURIComponent(e.q)}`, { headers: H, signal: AbortSignal.timeout(30e3) })).text();
    const links = [...new Set([...s.matchAll(/\/product\/\d{5,8}\/[a-z0-9-]+\.html/g)].map((m) => m[0]))];
    const palabras = e.q.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);
    const link = links.find((l) => palabras.every((w) => l.includes(w)) && (e.slug || []).every((w) => l.includes(w)) && !(e.no || []).some((w) => l.includes(w)));
    if (!link) { console.log(e.id, 'sin enlace', links.slice(0, 5).join(' ')); continue; }
    const pagina = 'https://www.coolblue.nl' + link;
    const p = await (await fetch(pagina, { headers: H, signal: AbortSignal.timeout(30e3) })).text();
    const ids = [...new Set([...p.matchAll(/image\.coolblue\.nl\/max\/\d+xauto\/products\/(\d+)/g)].map((m) => m[1]))].slice(0, 5);
    res.push({ id: e.id, pagina, urls: ids.map((i) => `https://image.coolblue.nl/max/1600xauto/products/${i}`) });
    console.log(e.id, pagina, ids.length);
  } catch (err) { console.log(e.id, 'error', err.message); }
}
fs.writeFileSync(out, JSON.stringify(res, null, 1));
