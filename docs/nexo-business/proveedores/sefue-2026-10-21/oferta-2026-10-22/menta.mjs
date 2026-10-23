// Fondo verde menta (decisión de colores por proveedor, 23-oct: SeFué = menta) SIN IA de pago: relleno desde los bordes
// (los píxeles del fondo claro y parejo que tocan el borde) + borde suave. Si el borde no es un fondo liso, NO se toca.
// Uso: node menta.mjs [n …]  → fotos-menta/<n>.jpg + informe menta.json (no sube nada)
import fs from "fs"; import { createRequire } from "module";
const require = createRequire("/root/vivabot/package.json"); const sharp = require("sharp");
const MINT = { r: 200, g: 240, b: 220 };
const args = process.argv.slice(2);
const files = (args.length ? args.map((n) => n + ".jpg") : fs.readdirSync("fotos").filter((f) => f.endsWith(".jpg")));
const informe = {};
for (const f of files) {
  const src = fs.existsSync("fotos-orig/" + f) ? "fotos/" + f : "fotos/" + f;
  const { data, info } = await sharp(src).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  const lum = (c) => (c[0] + c[1] + c[2]) / 3, sat = (c) => Math.max(...c) - Math.min(...c);
  // ¿borde liso y claro?
  const border = []; for (let x = 0; x < W; x++) { border.push(x, (H - 1) * W + x); } for (let y = 0; y < H; y++) { border.push(y * W, y * W + W - 1); }
  const claros = border.filter((i) => { const c = px(i); return lum(c) > 200 && sat(c) < 28; });
  const ratio = claros.length / border.length;
  if (ratio < 0.85) { informe[f] = { hecho: false, motivo: `borde no liso (${Math.round(ratio * 100)} % claro)` }; continue; }
  // relleno: vecino parecido (Δ<10) y claro/poco saturado
  const mask = new Uint8Array(N); const q = new Int32Array(N); let h = 0, t = 0;
  for (const i of claros) if (!mask[i]) { mask[i] = 1; q[t++] = i; }
  while (h < t) { const i = q[h++]; const c = px(i); const x = i % W, y = (i / W) | 0;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
      if (j < 0 || mask[j]) continue; const d = px(j);
      if (Math.abs(d[0] - c[0]) + Math.abs(d[1] - c[1]) + Math.abs(d[2] - c[2]) < 10 && lum(d) > 185 && sat(d) < 30) { mask[j] = 1; q[t++] = j; } } }
  const fondo = t / N;
  if (fondo < 0.15 || fondo > 0.93) { informe[f] = { hecho: false, motivo: `fondo ${Math.round(fondo * 100)} % (raro)` }; continue; }
  // borde suave: máscara difuminada
  const m8 = Buffer.alloc(N); for (let i = 0; i < N; i++) m8[i] = mask[i] ? 255 : 0;
  const sr = await sharp(m8, { raw: { width: W, height: H, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer({ resolveWithObject: true }); if (sr.info.channels !== 1) throw new Error("máscara con " + sr.info.channels + " canales"); const soft = sr.data;
  const out = Buffer.alloc(N * 3);
  for (let i = 0; i < N; i++) { const a = soft[i] / 255; const c = px(i);
    // el fondo conserva algo de su sombra: menta × (luz del píxel / 255)
    const l = Math.min(1, lum(c) / 245);
    out[i * 3] = Math.round(a * MINT.r * l + (1 - a) * c[0]); out[i * 3 + 1] = Math.round(a * MINT.g * l + (1 - a) * c[1]); out[i * 3 + 2] = Math.round(a * MINT.b * l + (1 - a) * c[2]); }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 90 }).toFile("fotos-menta/" + f);
  informe[f] = { hecho: true, fondo: Math.round(fondo * 100) };
}
const prev = fs.existsSync("menta.json") ? JSON.parse(fs.readFileSync("menta.json", "utf8")) : {};
fs.writeFileSync("menta.json", JSON.stringify({ ...prev, ...informe }, null, 1));
const v = Object.values(informe); console.log(`hechas ${v.filter((x) => x.hecho).length} · sin tocar ${v.filter((x) => !x.hecho).length}`);
