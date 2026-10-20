#!/usr/bin/env node
// Prepara la limpieza «caja en cero» (20-oct) con la cifra de la WEB del perchero cv-2547 (la web manda).
//   node docs/nexo-business/caja/limpieza-2026-10-20.mjs            → lee la web (WOO_URL + WOO_CK/WOO_CS o WOO_KEY/WOO_SECRET)
//   node docs/nexo-business/caja/limpieza-2026-10-20.mjs --web 3    → usa esa cifra (la que dice la web)
// Escribe junto a este archivo:
//   limpieza-2026-10-20-listo.sql         → la limpieza para pegar en nexo-production (dice lo que eligió: 1A o 1B)
//   limpieza-2026-10-20-prueba-listo.sql  → lo mismo dentro de BEGIN … ROLLBACK (enseña antes/después, no guarda)
// No toca nada por sí solo: solo lee la web y escribe esos dos archivos.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const WOO_PRODUCT = 2547;

async function webStock() {
  const i = process.argv.indexOf("--web");
  if (i > 0) {
    const n = Number(process.argv[i + 1]);
    if (!Number.isInteger(n) || n < 0) throw new Error("--web necesita un número entero (la cifra que dice la web)");
    return { stock: n, from: "--web" };
  }
  const base = (process.env.WOO_URL || "").replace(/\/$/, "");
  const key = process.env.WOO_CK || process.env.WOO_KEY;
  const secret = process.env.WOO_CS || process.env.WOO_SECRET;
  if (!base || !key || !secret) throw new Error("Faltan WOO_URL y las claves de la web (WOO_CK/WOO_CS). O usa --web <cifra>.");
  const res = await fetch(`${base}/wp-json/wc/v3/products/${WOO_PRODUCT}?_=${Date.now()}`, {
    headers: { authorization: "Basic " + Buffer.from(`${key}:${secret}`).toString("base64") },
  });
  if (!res.ok) throw new Error(`la web respondió ${res.status}`);
  const p = await res.json();
  if (!p.manage_stock || !Number.isInteger(p.stock_quantity)) throw new Error("la web no lleva existencias de este producto");
  return { stock: p.stock_quantity, from: `${base} (producto ${WOO_PRODUCT}: ${p.name})` };
}

/** Pone la cifra de la web en la plantilla. Exportado para las pruebas. */
export function fill(template, stock) {
  const marker = "v_web BIGINT := NULL; -- WEB_STOCK";
  if (!template.includes(marker)) throw new Error("plantilla sin la marca WEB_STOCK");
  return template.replace(marker, `v_web BIGINT := ${Number(stock)}; -- WEB_STOCK (leído de la web)`);
}

export function dryRun(sql) {
  return `-- PRUEBA SIN GUARDAR: hace la limpieza dentro de una transacción, enseña el resultado y la deshace.\nBEGIN;\n${sql}\nROLLBACK;\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { stock, from } = await webStock();
  const sql = fill(readFileSync(join(here, "limpieza-2026-10-20.sql"), "utf8"), stock);
  writeFileSync(join(here, "limpieza-2026-10-20-listo.sql"), sql);
  writeFileSync(join(here, "limpieza-2026-10-20-prueba-listo.sql"), dryRun(sql));
  console.log(`Web: perchero cv-2547 = ${stock} (${from}).`);
  console.log("La caja tenía 1 el 20-oct a las 16:40. Si sigue en 1:");
  console.log(stock === 1 ? "  → 1B: solo se anula el dinero (los percheros no están)." : stock === 3 ? "  → 1A: el dinero y las 2 unidades vuelven a la caja (sin sumarle 2 otra vez a la web)." : `  → 1B + la caja pasa a ${stock} como la web.`);
  console.log("La base lo vuelve a comprobar al pegarlo y lo dice en el aviso (NOTICE) «Limpieza: …».");
  console.log("Archivos: limpieza-2026-10-20-prueba-listo.sql (primero) y limpieza-2026-10-20-listo.sql.");
}
