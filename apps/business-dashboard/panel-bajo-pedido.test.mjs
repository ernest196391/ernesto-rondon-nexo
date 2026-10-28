// D121 (28-oct): Productos → «Proveedores · bajo pedido» en el panel de Lennys.
// Comprueba: el JavaScript del panel se puede leer (node --check), el cálculo de precio y mínimo (copia de la regla
// del bot y de Core) con el ejemplo del diseño, y el contrato de nexo-panel-web (sin teléfonos, comisión de la web).
import { test, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, "index.html"), "utf8");
const fn = fs.readFileSync(path.join(here, "../../supabase/functions/nexo-panel-web/index.ts"), "utf8");
const script = html.slice(html.indexOf('<script type="module">') + '<script type="module">'.length, html.lastIndexOf("</script>"));

test("el JavaScript del panel no tiene errores de sintaxis", () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "panel-")), "panel.mjs");
  fs.writeFileSync(file, script);
  const r = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  expect(r.stderr).toBe("");
  expect(r.status).toBe(0);
});

// Las funciones del panel, tal cual están escritas en index.html.
const pick = name => script.match(new RegExp(`^const ${name} = .*;$`, "m"))?.[0];
const mk = new Function(`${pick("MK")}\n${pick("mkSuggested")}\n${pick("mkShare")}\n${pick("mkFloor")}\nreturn { mkSuggested, mkShare, mkFloor };`)();

test("ejemplo del diseño: proveedor 50 USD → sugerido 67, comisión 6,80, mínimo 58,26", () => {
  const s = mk.mkSuggested(50);
  expect(s).toBe(67);
  expect(mk.mkShare(s, 50)).toBe(6.8);
  expect(mk.mkFloor(50)).toBe(58.26);
  expect(Math.round((s - 50 - mk.mkShare(s, 50)) * 100) / 100).toBe(10.2); // Ernesto / NEXO
});

test("misma tabla que el bot (myPrice / gestoraShare) y el mínimo siempre entre el costo y el sugerido", async () => {
  const table = [[4, 9, 2], [10, 15, 2], [12.5, 18, 2.2], [30, 42, 4.8], [50, 67, 6.8], [59, 76, 6.8], [59.99, 77, 6.8], [60, 80, 8],
    [100, 120, 8], [250, 270, 8], [300, 320, 8], [301, 335, 13.6], [450, 495, 18], [1000, 1100, 40]];
  for (const [cost, price, share] of table) {
    expect(mk.mkSuggested(cost)).toBe(price);
    expect(mk.mkShare(price, cost)).toBe(share);
    expect(mk.mkFloor(cost)).toBeGreaterThan(cost);
    expect(mk.mkFloor(cost)).toBeLessThanOrEqual(price);
  }
  // Si el bot está al lado (C:\Users\Ernesto\vivabot), se compara con su código de verdad.
  const bot = process.env.VIVABOT_DIR ?? path.join(os.homedir(), "vivabot");
  const file = path.join(bot, "src", "market-price.js");
  if (fs.existsSync(file)) {
    const real = await import(pathToFileURL(file).href);
    for (let c = 1; c <= 1500; c += 3.7) {
      const cost = Math.round(c * 100) / 100;
      expect(mk.mkSuggested(cost)).toBe(real.myPrice(cost, "USD"));
      expect(mk.mkShare(mk.mkSuggested(cost), cost)).toBe(real.gestoraShare(real.myPrice(cost, "USD"), cost));
    }
  }
});

test("la pestaña está en Productos y solo la ve la dueña", () => {
  expect(html).toContain('id="prod-seg"');
  expect(html).toContain('data-psub="proveedores"');
  expect(html).toContain('id="mk-list"');
  expect(script).toContain('$("#prod-seg").hidden = !isOwner();');
  expect(script).toContain('"Retirar (agotado)"');
  expect(script).toContain('"Publicar en la web"');
});

test("nexo-panel-web: lee la bolsa sin teléfonos y la comisión la pone la web", () => {
  const block = fn.slice(fn.indexOf('body.action.startsWith("market_")'), fn.indexOf("// Venta de proveedor (Core 3.14.14, D69): reparto"));
  expect(block.length).toBeGreaterThan(1000);
  const cols = block.match(/const COLS = "([^"]+)"/)?.[1] ?? "";
  for (const secret of ["seller_phone", "seller_jid", "group_jid"]) expect(cols).not.toContain(secret);
  expect(block.replace(/\/\/.*$/gm, "")).not.toMatch(/seller_phone|seller_jid|group_jid/); // fuera de los comentarios
  for (const a of ["market_list", "market_item", "market_publish", "market_unpublish"]) expect(block).toContain(`"${a}"`);
  const publish = block.slice(block.indexOf('"market_publish"'), block.indexOf('"market_unpublish"'));
  expect(publish).toContain('core("POST", "panel/market/publish"');
  expect(publish).not.toMatch(/commission\s*:/); // la comisión (40 %) la calcula la web
  expect(publish).toContain("price_locked: true");
  expect(publish).toContain('status: "publicado"');
  expect(fn).toContain('if (owner !== true) return json(403');
  expect(fn).toContain("data?.message ?? data?.error ??");
});
