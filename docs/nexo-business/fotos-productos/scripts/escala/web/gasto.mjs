// Gasto del piloto: búsquedas (uso-piloto.jsonl) + revisiones de fotos/textos con fotos-bolsa.mjs (uso.jsonl desde la línea base)
import fs from 'fs';
import { P, PW } from './comun.mjs';
export const BASE_USO_LINEAS = 1360; // líneas de uso.jsonl antes del piloto (2,4028 USD de la noche del 12-oct)
export const TOPE = Number(process.env.PW_TOPE || 3.0);
const lineas = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
export function gastoPiloto() {
  const b = lineas(PW + '/uso-piloto.jsonl');
  const a = lineas(P('uso.jsonl')).slice(BASE_USO_LINEAS);
  const busq = b.reduce((s, x) => s + x.usd, 0), rev = a.reduce((s, x) => s + x.usd, 0);
  return {
    busquedas_usd: +busq.toFixed(4), llamadas_busqueda: b.reduce((s, x) => s + (x.llamadas_web || 0), 0), consultas_busqueda: b.length,
    revisiones_usd: +rev.toFixed(4), consultas_revision: a.length, total_usd: +(busq + rev).toFixed(4),
  };
}
if (process.argv[1].endsWith('gasto.mjs')) console.log(JSON.stringify(gastoPiloto(), null, 1));
