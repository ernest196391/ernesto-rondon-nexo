// Lista las imágenes de una página web (og:image, JSON-LD, <img>, Shopify .json).
// Uso: node imagenes-de-pagina.js <url> [filtro-regex]
const url = process.argv[2];
const filtro = process.argv[3] ? new RegExp(process.argv[3], 'i') : null;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

(async () => {
  const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9', accept: 'text/html,application/json,*/*' }, redirect: 'follow' });
  const txt = await r.text();
  console.log('HTTP', r.status, r.url, txt.length, 'bytes');
  const found = new Set();
  const add = (u) => { if (!u) return; u = u.replace(/\\u002F/g, '/').replace(/\\\//g, '/').replace(/&amp;/g, '&'); if (u.startsWith('//')) u = 'https:' + u; if (/^https?:/.test(u)) found.add(u); };
  for (const m of txt.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)[^>]*content=["']([^"']+)/gi)) add(m[1]);
  for (const m of txt.matchAll(/content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)/gi)) add(m[1]);
  for (const m of txt.matchAll(/https?:\\?\/\\?\/[^"'\s<>()]+?\.(?:jpe?g|png|webp)(?:\?[^"'\s<>()]*)?/gi)) add(m[0]);
  for (const m of txt.matchAll(/"src"\s*:\s*"([^"]+)"/g)) add(m[1]);
  let list = [...found];
  if (filtro) list = list.filter((u) => filtro.test(u));
  list.slice(0, 80).forEach((u) => console.log(u));
  console.log('total', list.length);
})().catch((e) => console.error('ERROR', e.message));
