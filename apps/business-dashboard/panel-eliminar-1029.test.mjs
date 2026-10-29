// Lennys 29-oct: «Una vez creado el producto no me deja eliminarlo si lo hice mal».
// «Eliminar producto» / «Eliminar este diseño»: confirma con el nombre; con pedidos o ventas en la caja se OCULTA
// (nunca se rompe un pedido); si no, a la papelera de la web. Lo que está en la papelera ya no sale en la lista.
// Prueba la lógica tal cual está escrita en index.html y en nexo-panel-web (bloques marcados con // <...>).
import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, "index.html"), "utf8").replace(/\r\n/g, "\n");
const fn = fs.readFileSync(path.join(here, "../../supabase/functions/nexo-panel-web/index.ts"), "utf8").replace(/\r\n/g, "\n");
const script = html.slice(html.indexOf('<script type="module">') + '<script type="module">'.length, html.lastIndexOf("</script>"));
const block = (src, tag) => {
  const a = src.indexOf(`// <${tag}>`), b = src.indexOf(`// </${tag}>`);
  if (a < 0 || b < a) throw new Error("falta el bloque " + tag);
  return src.slice(a, b);
};
const D = new Function(block(script, "delete-logic") + "\nreturn { deleteAsk, deleteExplain, deleteResult, withoutTrashed };")();
const { cajaSoldOf } = new Function(transformSync(block(fn, "delete-plan"), { loader: "ts" }).code + "\nreturn { cajaSoldOf };")();

test("la confirmación dice el nombre y que no se puede deshacer", () => {
  expect(D.deleteAsk("Cortina floreada — azul")).toBe("¿Eliminar «Cortina floreada — azul»? No se puede deshacer desde el panel.");
  expect(D.deleteExplain("todo")).toMatch(/^Se elimina el producto con todos sus diseños/);
  expect(D.deleteExplain("diseño")).toMatch(/^Si ya tiene pedidos o ventas en la caja, no se borra: se oculta/);
});

test("con pedidos: «Ya tiene pedidos: lo oculté en vez de borrarlo»", () => {
  const r = D.deleteResult({ result: "hidden", reason: "orders" }, "Toalla azul", "producto");
  expect(r.title).toBe("Oculto, no borrado");
  expect(r.text).toMatch(/^Ya tiene pedidos: lo oculté en vez de borrarlo\./);
  expect(D.deleteResult({ result: "hidden", reason: "caja" }, "x", "producto").text).toMatch(/^Ya tiene ventas en la caja: lo oculté/);
});

test("sin pedidos: eliminado (papelera); diseño y producto", () => {
  const p = D.deleteResult({ result: "trashed" }, "Toalla azul", "producto");
  expect(p).toMatchObject({ tone: "ok", title: "Eliminado" });
  expect(p.text).toMatch(/eliminé «Toalla azul»\. Ya no está en la web ni en la caja\. .*papelera/);
  expect(D.deleteResult({ result: "trashed" }, "Cortina · azul", "diseño").text).toMatch(/eliminé el diseño «Cortina · azul»/);
});

test("solo en la caja (no estaba en la web) y avisos si algo no llegó", () => {
  expect(D.deleteResult(null, "Vela", "producto").text).toMatch(/ya no sale en la caja\. No estaba en la web/);
  const bad = D.deleteResult({ result: "trashed", bolsaOk: false }, "MK", "producto", { cajaFail: true });
  expect(bad.tone).toBe("bad");
  expect(bad.text).toMatch(/Ojo: en la caja no se quitó.*; no pude marcarlo como retirado/);
});

test("lo que está en la papelera ya no sale en la lista (solo si en la caja está oculto)", () => {
  const rows = [
    { productId: "a", wooId: 10, active: false },                    // eliminado (papelera) → fuera
    { productId: "b", wooId: 11, active: true },                     // en la papelera pero activo en la caja → se queda (algo falló: que se vea)
    { productId: "c", wooId: 21, parentWooId: 20, active: false },   // diseño de un producto en la papelera → fuera
    { productId: "d", wooId: 30, active: false },                    // oculto normal → se queda en «Ocultos»
    { productId: "e", active: true },                                // solo en la caja
  ];
  expect(D.withoutTrashed(rows, [10, 11, 20]).map(r => r.productId)).toEqual(["b", "d", "e"]);
  expect(D.withoutTrashed(rows, undefined)).toBe(rows);
});

test("ventas de la caja: si no se puede mirar, se cuenta como vendido (se oculta, nunca se borra)", () => {
  expect(cajaSoldOf([], null)).toBe(false);
  expect(cajaSoldOf([2463], null)).toBe(true);
  expect(cajaSoldOf(null, { message: "function does not exist" })).toBe(true);
  expect(cajaSoldOf(undefined, null)).toBe(true);
});

test("los botones están donde Lennys los busca y solo para la dueña", () => {
  expect(script).toMatch(/p && isOwner\(\) \? `<button[^`]*data-delete>\$\{group \? "Eliminar este diseño" : "Eliminar producto"\}/);
  expect(script).toMatch(/isOwner\(\) \? '<button[^']*data-del>Eliminar este diseño<\/button>'/);
  expect(script).toMatch(/data-delete-all>Eliminar producto \(con todos sus diseños\)/);
  expect(script).toMatch(/data-mk-delete>Eliminar producto<\/button>/);
  expect(fn).toMatch(/if \(owner !== true\) return json\(403/);
  expect(fn).toMatch(/action === "product_delete"/);
});
