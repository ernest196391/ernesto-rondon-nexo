// Piezas de redes con el logo OFICIAL de Casa Viva (manual de marca, artefacto 1hauGnpWYx6KVSNfijY6FU).
// Nunca se redibuja: se usan los SVG sacados del manual (logo-*.svg). Colores del manual:
// crema #F6F1E6 (fondo), marrón #2B2420 (logo y texto), petróleo #0D3B45 (fondo oscuro), ámbar #A35A1F (acento).
// Uso: node marca.mjs  → perfil-casa-viva.png (1080²) y portada-facebook.png (1640×624)
import sharp from 'sharp';
import fs from 'fs';

const PETROLEO = '#0D3B45';
const svgPng = (file, width) => sharp(Buffer.from(fs.readFileSync(file))).resize({ width }).png().toBuffer();

// 1) Perfil: isotipo crema sobre petróleo, con aire (≥ 1/3 de su altura por cada lado, regla del manual).
const iso = await svgPng('logo-isotipo-crema.svg', 520);
const isoMeta = await sharp(iso).metadata();
await sharp({ create: { width: 1080, height: 1080, channels: 4, background: PETROLEO } })
  .composite([{ input: iso, left: Math.round((1080 - isoMeta.width) / 2), top: Math.round((1080 - isoMeta.height) / 2) }])
  .png().toFile('perfil-casa-viva.png');

// 2) Portada de Facebook: panel petróleo con el logo horizontal en crema + foto tranquila de la tienda.
const PANEL = 760;
const hor = await svgPng('logo-horizontal-crema.svg', 600);
const horMeta = await sharp(hor).metadata();
const foto = await sharp('../escenarios/1-pasillo.png').resize({ width: 1640 - PANEL }).extract({ left: 0, top: 260, width: 1640 - PANEL, height: 624 }).toBuffer();
await sharp({ create: { width: 1640, height: 624, channels: 4, background: PETROLEO } })
  .composite([
    { input: hor, left: Math.round((PANEL - horMeta.width) / 2), top: Math.round((624 - horMeta.height) / 2) },
    { input: foto, left: PANEL, top: 0 },
  ])
  .png().toFile('portada-facebook.png');

console.log('perfil-casa-viva.png y portada-facebook.png listos');
