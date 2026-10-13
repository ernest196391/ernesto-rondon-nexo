// Datos y miniaturas de la hoja del piloto, en local, a partir de lo traído del VPS (traer/).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('C:/Users/Ernesto/ernesto-rondon-nexo/node_modules/sharp');
const T = path.resolve('traer');
const BASE = path.resolve('hoja-piloto');
const res = JSON.parse(fs.readFileSync(path.join(T, 'resultado-piloto.json'), 'utf8'));
const cls = new Map(JSON.parse(fs.readFileSync(path.join(T, 'clasificacion.json'), 'utf8')).items.map((x) => [x.id, x]));
const pasan = res.productos.filter((r) => r.resultado === 'pasa');
const datos = [];
for (const r of pasan) {
  const n = JSON.parse(fs.readFileSync(path.join(T, String(r.id), 'norm.json'), 'utf8'));
  const c = cls.get(r.id);
  const dir = path.join(BASE, 'minis', String(r.id)); fs.mkdirSync(dir, { recursive: true });
  for (const [i, f] of n.fotos.entries()) {
    await sharp(path.join(T, String(r.id), 'final-web', path.basename(f.salida))).resize(i === 0 ? 440 : 150, i === 0 ? 440 : 150).jpeg({ quality: 82 }).toFile(path.join(dir, `${i + 1}.jpg`));
  }
  datos.push({ id: r.id, titulo: c.nombre, precio: c.precio, nota: n.fotos[0].nota, notas: n.fotos.map((f) => f.nota), fotos: n.fotos.length, fuente: 'web',
    dominio: r.dominio, tipo_fuente: r.tipo_fuente, avisos: [], borde: Boolean(n.fotos[0].tocaBorde), ampliada: Boolean(n.fotos[0].ampliada), categoria: c.sub, prioridad: c.prioridad,
    pagina: r.pagina, clase: c.clase });
}
datos.sort((a, b) => b.prioridad - a.prioridad);
fs.writeFileSync(path.join(BASE, 'hojas-datos.json'), JSON.stringify(datos, null, 1));
console.log(datos.map((d) => `${d.id} ${d.dominio} ${d.tipo_fuente}`).join('\n'));
