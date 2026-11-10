// Ernesto 10-nov (opción 2): «se muestra solo al reponer». Al ocultar se elige el motivo: «Se acabó» vuelve solo a la
// venta al llegar mercancía; «A propósito» no. Por defecto, «Se acabó» si no quedan unidades.
// Prueba la lógica tal cual está escrita en index.html (bloque // <reponer-logic>).
import { test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, "index.html"), "utf8").replace(/\r\n/g, "\n");
const script = html.slice(html.indexOf('<script type="module">') + '<script type="module">'.length, html.lastIndexOf("</script>"));
const a = script.indexOf("// <reponer-logic>"), b = script.indexOf("// </reponer-logic>");
const R = new Function(script.slice(a, b) + "\nreturn { retireReasonDefault, retiredTag, retiredLine, backAloneLine, backAloneToast, hiddenMix };")();

test("motivo por defecto: «Se acabó» si no quedan unidades; si queda alguna, «A propósito»", () => {
  expect(R.retireReasonDefault([{ stock: 0 }, { stock: -1 }])).toBe("agotado");
  expect(R.retireReasonDefault([{ stock: 0 }, { stock: 2 }])).toBe("manual");
  expect(R.retireReasonDefault([{ stock: 3 }])).toBe("manual");
});

test("etiqueta y línea de un oculto", () => {
  expect(R.retiredTag({ retiredReason: "agotado" })).toBe("Se acabó");
  expect(R.retiredTag({ retiredReason: "manual" })).toBe("A propósito");
  expect(R.retiredTag({})).toBe("Oculto"); // sin la migración: como antes
  expect(R.retiredLine({ retiredReason: "agotado" })).toBe("Se mostrará solo cuando llegue mercancía.");
  expect(R.retiredLine({ retiredReason: "manual" })).toMatch(/pulsa «Mostrar»/);
  expect(R.retiredLine({})).toBe("");
});

test("se mostró solo: línea en la fila y aviso", () => {
  expect(R.backAloneLine({ backAlone: { at: "2026-11-10T20:00:00Z", qty: 6 } })).toBe("✓ Se mostró solo: llegaron 6");
  expect(R.backAloneLine({ backAlone: null })).toBe("");
  expect(R.backAloneToast([{ name: "Toalla azul" }])).toBe("«Toalla azul» se mostró solo: llegó mercancía.");
  expect(R.backAloneToast([{}, {}, {}])).toBe("3 productos se mostraron solos: llegó mercancía.");
});

test("grupo con motivos mezclados", () => {
  const ag = { retiredReason: "agotado" }, ma = { retiredReason: "manual" };
  expect(R.hiddenMix([ag, ag, ma])).toBe("2 vuelven solos · 1 a propósito");
  expect(R.hiddenMix([ag])).toBe("vuelve solo al llegar mercancía");
  expect(R.hiddenMix([ma, ma])).toBe("a propósito");
  expect(R.hiddenMix([{}])).toBe("");
});
