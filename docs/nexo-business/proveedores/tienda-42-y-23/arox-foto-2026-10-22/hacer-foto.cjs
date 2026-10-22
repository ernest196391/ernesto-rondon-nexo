// Foto de la cocina Arox CG-05 desde la foto real fotos/WhatsApp Image 2026-10-20 at 18.09.09.jpeg (solo sharp, sin IA).
// Paso previo: girar 270 + enderezar 7.5 grados (step1). Uso: SHARP=<ruta sharp> node hacer-foto.cjs st.png <carpeta>
const sharp = require(process.env.SHARP);
const [stPath, outDir] = process.argv.slice(2);
const W = 1133, H = 909;
const poly = [[78,200],[668,198],[672,180],[700,176],[728,186],[732,198],[890,198],[896,186],[930,180],[958,186],[962,197],[990,197],[1106,372],[1090,386],[1086,470],[45,459]];
const BG = { r: 244, g: 244, b: 242 };
(async () => {
  // 1) foto nivelada + luz/contraste suaves
  let base = await sharp(stPath).removeAlpha().modulate({ brightness: 1.06, saturation: 1.02 }).linear(1.08, -6).sharpen({ sigma: 0.8 }).toBuffer();
  // 2) tapar el texto impreso de la caja (arriba a la izquierda) con desenfoque fuerte
  const rx = 72, ry = 196, rw = 98, rh = 106;
  const patch = await sharp(base).extract({ left: rx, top: ry, width: rw, height: rh }).blur(9).toBuffer();
  const patch2 = await sharp(base).extract({ left: 166, top: 196, width: 64, height: 38 }).blur(7).toBuffer();
  base = await sharp(base).composite([{ input: patch, left: rx, top: ry }, { input: patch2, left: 166, top: 196 }]).toBuffer();
  // 3) máscara de la cocina (contorno a mano) con borde suave
  const pts = poly.map(p => p.join(',')).join(' ');
  const mask = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="black"/><polygon points="${pts}" fill="white"/></svg>`)).blur(1.6).extractChannel(0).raw().toBuffer();
  base = await sharp(base).removeAlpha().toBuffer();
  const cut = await sharp(base).joinChannel(mask, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
  // recorte al contorno
  const box = { left: 40, top: 170, width: 1072, height: 308 };
  const cocina = await sharp(cut).extract(box).png().toBuffer();
  // sombra suave debajo
  const shadow = async (w, h) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><ellipse cx="${w/2}" cy="${h/2}" rx="${w/2-10}" ry="${h/2-4}" fill="rgba(0,0,0,0.28)"/></svg>`)).blur(14).png().toBuffer();
  // IMAGEN 1: cocina completa
  {
    const tw = 1120; const th = Math.round(308 * tw / 1072);
    const c = await sharp(cocina).resize(tw, th).png().toBuffer();
    const top = Math.round((1200 - th) / 2);
    await sharp({ create: { width: 1200, height: 1200, channels: 3, background: BG } })
      .composite([{ input: await shadow(tw, 60), left: 40, top: top + th - 34 }, { input: c, left: 40, top }])
      .jpeg({ quality: 90, mozjpeg: true }).toFile(`${outDir}/arox-cg-05-1-cocina.jpg`);
  }
  // IMAGEN 2: detalle hornilla derecha + perilla
  {
    const d = await sharp(cut).extract({ left: 600, top: 170, width: 512, height: 308 }).png().toBuffer();
    const tw = 1100; const th = Math.round(308 * tw / 512);
    const c = await sharp(d).resize(tw, th).png().toBuffer();
    const top = Math.round((1200 - th) / 2);
    await sharp({ create: { width: 1200, height: 1200, channels: 3, background: BG } })
      .composite([{ input: await shadow(tw - 60, 70), left: 80, top: top + th - 40 }, { input: c, left: 50, top }])
      .jpeg({ quality: 90, mozjpeg: true }).toFile(`${outDir}/arox-cg-05-2-detalle.jpg`);
  }
  console.log('ok');
})().catch(e => { console.error(e); process.exit(1); });
