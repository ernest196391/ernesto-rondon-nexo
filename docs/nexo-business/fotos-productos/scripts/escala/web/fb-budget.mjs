// FB_BUDGET para fotos-bolsa.mjs: que el gasto TOTAL del trabajo de hoy (búsquedas + verificaciones + revisiones) no pase de PW_TOPE.
// fotos-bolsa.mjs se para cuando la suma de uso.jsonl llega a FB_BUDGET; uso.jsonl ya traía 2,4028 USD de anoche.
import { gastoPiloto, TOPE } from './gasto.mjs';
const g = gastoPiloto();
const BASE_ANOCHE = 2.4028;
console.log((BASE_ANOCHE + g.revisiones_usd + Math.max(0, TOPE - 0.2 - g.total_usd)).toFixed(4));
