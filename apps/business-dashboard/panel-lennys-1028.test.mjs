// Lennys 28-oct (Ernesto: «haz las 3 pendientes»):
//  1) «Llegó mercancía»: con nombres de la factura que no se conocen se sigue igual (buscar el mío, «Es nuevo» o «Saltar");
//     lo reconocido entra normal y una línea saltada NUNCA toca el stock.
//  2) Fotos del producto: las nuevas se AÑADEN a las que hay, ✕ quita una, ★ elige la principal y el máximo
//     (1 principal + 8 en la galería, Core 3.14.24) se dice claro en vez de tirar fotos.
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
const R = new Function(block(script, "recv-logic") + "\nreturn { recvSuggest, recvState, recvCheck, recvPayload, recvNote, recvCount, recvPrice };")();
const P = new Function(block(script, "photo-logic") + "\nreturn { PHOTO_MAX, PHOTO_GALLERY_MAX, photoAddPlan, photoMakeMain, photoRemove, photoDirty, photoPayload, photoCountText };")();
const { photoSetPlan } = new Function(transformSync(block(fn, "photo-set"), { loader: "ts" }).code + "\nreturn { photoSetPlan };")();

const items = [
  { productId: "p1", name: "Toalla grande azul", stock: 3 },
  { productId: "p2", name: "Toallas de playa", stock: 0 },
  { productId: "p3", name: "Sábana matrimonial", stock: 5 },
  { productId: "p4", name: "Olla de presión 6 L", stock: 2 },
];
// Una factura leída por Curru: 2 reconocidas y 1 que no conoce.
const invoice = () => [
  { productId: "p1", readName: "TOALLA GDE AZUL", quantity: 4, unitCost: 3.5, currency: "USD" },
  { productId: "p4", readName: "OLLA PRESION 6L", quantity: 2, unitCost: 1800, currency: "CUP" },
  { productId: null, readName: "Cafetera italiana 6 tazas", quantity: 3, unitCost: 9, currency: "USD" },
];

test("factura con un nombre desconocido: no deja confirmar hasta decidir, pero dice qué hacer", () => {
  const lines = invoice();
  expect(R.recvState(lines[2])).toBe("pending");
  expect(R.recvCheck(lines)).toMatch(/Falta decidir 1 producto .*márcalo como nuevo o sáltalo/);
  expect(R.recvCount(lines)).toEqual({ ok: 2, new: 0, skip: 0, pending: 1 });
});

test("saltar la desconocida: lo reconocido entra normal y lo saltado no se manda (no toca el stock)", () => {
  const lines = invoice();
  lines[2].skip = true;
  expect(R.recvCheck(lines)).toBe("");
  const payload = R.recvPayload(lines);
  expect(payload).toEqual([
    { productId: "p1", quantity: 4, unitCost: 3.5, currency: "USD" },
    { productId: "p4", quantity: 2, unitCost: 1800, currency: "CUP" },
  ]);
  expect(R.recvNote("2 llegaron rotos", lines)).toBe("2 llegaron rotos · Sin entrar (saltados): 3× Cafetera italiana 6 tazas");
});

test("✕ en una línea reconocida la salta: aunque tenga producto, no entra", () => {
  const lines = invoice();
  lines[0].skip = true; lines[2].skip = true;
  expect(R.recvPayload(lines).map(l => l.productId)).toEqual(["p4"]);
  expect(R.recvNote("", lines)).toBe("Sin entrar (saltados): 4× TOALLA GDE AZUL, 3× Cafetera italiana 6 tazas");
  lines[1].skip = true;
  expect(R.recvCheck(lines)).toMatch(/Todas las líneas están saltadas/);
  expect(R.recvPayload(lines)).toEqual([]);
});

test("elegir a mano un producto existente para la desconocida", () => {
  const lines = invoice();
  lines[2].productId = "p2";
  expect(R.recvCheck(lines)).toBe("");
  expect(R.recvPayload(lines)).toHaveLength(3);
});

test("«Es nuevo»: borrador con nombre, cantidad y costo; precio = el escrito o el sugerido", () => {
  const lines = invoice();
  Object.assign(lines[2], { isNew: true, newName: "Cafetera italiana 6 tazas", newActive: false });
  expect(R.recvState(lines[2])).toBe("new");
  expect(R.recvCheck(lines, () => null)).toMatch(/Escribe el precio de venta de «Cafetera italiana 6 tazas»/);
  expect(R.recvCheck(lines, () => 13.5)).toBe("");
  lines[2].newPrice = "15,50";
  expect(R.recvPrice(lines[2].newPrice)).toBe(15.5);
  expect(R.recvCheck(lines, () => null)).toBe("");
  lines[2].newName = "  ";
  expect(R.recvCheck(lines, () => 13.5)).toBe("Escribe el nombre del producto nuevo.");
  // Antes de crearlo no se manda nada de esa línea; al crearlo (productId) entra con su cantidad y costo.
  lines[2].newName = "Cafetera italiana 6 tazas";
  expect(R.recvPayload(lines)).toHaveLength(2);
  lines[2].productId = "nuevo-1";
  expect(R.recvPayload(lines)[2]).toEqual({ productId: "nuevo-1", quantity: 3, unitCost: 9, currency: "USD" });
});

test("el costo falta solo importa en lo que entra", () => {
  const lines = invoice();
  lines[2].unitCost = null;
  lines[2].productId = "p2";
  expect(R.recvCheck(lines)).toMatch(/Falta el costo/);
  lines[2].skip = true;
  expect(R.recvCheck(lines)).toBe("");
});

test("buscar: parecidos por palabras, sin acentos ni mayúsculas, y plural = singular", () => {
  expect(R.recvSuggest(items, "TOALLA de PLAYA 70x140").map(p => p.productId)[0]).toBe("p2");
  expect(R.recvSuggest(items, "toalla").map(p => p.productId)).toEqual(["p1", "p2"]);
  expect(R.recvSuggest(items, "sabanas").map(p => p.productId)).toEqual(["p3"]);
  expect(R.recvSuggest(items, "olla presion").map(p => p.productId)).toEqual(["p4"]);
  expect(R.recvSuggest(items, "de la")).toEqual([]);
  expect(R.recvSuggest(items, "cafetera")).toEqual([]);
});

test("la pantalla usa esta lógica: botones Es nuevo / Saltar / buscar y la entrada solo manda recvPayload", () => {
  const sheet = script.slice(script.indexOf("async function receiveSheet(done)"), script.indexOf("// ---------- Caja: cobros"));
  for (const s of ["data-skip", "data-new", "data-lq", "data-unskip", "data-skip-rest", "data-change", "No, borrador"]) expect(sheet).toContain(s);
  expect(sheet).toContain("const problem = recvCheck(lines, suggestOf);");
  expect(sheet).toContain("lines: payload");
  expect(sheet).toContain("const payload = recvPayload(lines);");
  expect(sheet).toContain("note: recvNote(form.elements.note.value, lines)");
  // Los nuevos se crean solo para líneas no saltadas.
  expect(sheet).toContain("lines.filter(x => !x.skip && x.isNew && !x.productId)");
  // Leer la factura otra vez no duplica las líneas (no se suma el stock dos veces).
  expect(sheet).toContain("for (let i = lines.length - 1; i >= 0; i--) if (lines[i].readName) lines.splice(i, 1);");
});

test("fotos: añadir respeta el máximo y lo dice claro (nunca tira fotos en silencio)", () => {
  expect(P.PHOTO_MAX).toBe(9);
  expect(P.photoAddPlan(3, 2)).toEqual({ take: 2, left: 0, msg: "" });
  const full = P.photoAddPlan(7, 4);
  expect(full.take).toBe(2);
  expect(full.left).toBe(2);
  expect(full.msg).toBe("Añadí 2 fotos, pero 2 fotos no caben: el máximo es 9 fotos (1 principal + 8 en la galería). Quita alguna con ✕ para poner otras.");
  expect(P.photoAddPlan(8, 1, P.PHOTO_GALLERY_MAX).msg).toBe("1 foto no cabe: el máximo es 8 fotos en la galería. Quita alguna con ✕ para poner otras.");
  expect(P.photoAddPlan(9, 0)).toEqual({ take: 0, left: 0, msg: "" });
});

test("fotos: las nuevas se suman a las que hay; ★ cambia la principal sin perder la vieja; ✕ quita solo esa", () => {
  const web = [1, 2, 3].map(id => ({ kind: "web", id, src: "https://web/" + id + ".webp" }));
  let list = [...web, { kind: "new", key: "n1" }, { kind: "new", key: "n2" }];
  expect(P.photoDirty(web, web.slice())).toBe(false);
  expect(P.photoDirty(web, list)).toBe(true);
  const urls = { n1: "https://x/storage/a.webp", n2: "https://x/storage/b.webp" };
  expect(P.photoPayload(list, urls)).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { url: urls.n1 }, { url: urls.n2 }]);
  list = P.photoMakeMain(list, 3);
  expect(P.photoPayload(list, urls)).toEqual([{ url: urls.n1 }, { id: 1 }, { id: 2 }, { id: 3 }, { url: urls.n2 }]);
  list = P.photoRemove(list, 2);
  expect(P.photoPayload(list, urls)).toEqual([{ url: urls.n1 }, { id: 1 }, { id: 3 }, { url: urls.n2 }]);
  expect(P.photoDirty(web, P.photoMakeMain(web, 2))).toBe(true);
  expect(P.photoCountText(4)).toBe("4 fotos: 1 principal + 3 en la galería. Caben 9.");
});

test("nexo-panel-web: solo fotos de ESTE producto o subidas por el panel, de 1 a 9, sin repetir", () => {
  const prefix = "https://viwwlriwlwodrfukbgbj.supabase.co/storage/v1/object/public/nexo-product-photos/";
  const mine = prefix + "casa-viva/abc.webp";
  expect(photoSetPlan([10, 11, 12], [{ url: mine }, { id: 10 }, { id: 12 }, { id: 10 }, { url: mine }], prefix))
    .toEqual({ images: [{ src: mine }, { id: 10 }, { id: 12 }] });
  expect(photoSetPlan([10], [{ id: 99 }], prefix)).toEqual({ error: "Una de las fotos ya no está en este producto. Cierra y vuelve a abrirlo." });
  expect(photoSetPlan([10], [{ url: "https://otra.web/x.webp" }], prefix)).toEqual({ error: "Foto no válida." });
  expect(photoSetPlan([10], [{ url: prefix + "../secreto.webp" }], prefix)).toEqual({ error: "Foto no válida." });
  expect(photoSetPlan([10], [{ url: mine }], "/storage/v1/object/public/nexo-product-photos/")).toEqual({ error: "Foto no válida." }); // sin SUPABASE_URL
  expect(photoSetPlan([10], [], prefix)).toEqual({ error: "Deja al menos una foto." });
  expect(photoSetPlan([10], "nada", prefix)).toEqual({ error: "Deja al menos una foto." });
  expect("error" in photoSetPlan([], Array.from({ length: 10 }, (_, i) => ({ url: prefix + i + ".webp" })), prefix)).toBe(true);
  expect(photoSetPlan([], Array.from({ length: 9 }, (_, i) => ({ url: prefix + i + ".webp" })), prefix).images).toHaveLength(9);
});

test("nexo-panel-web: guarda por la API de la web con el orden pedido y nunca borra fotos de la web", () => {
  const block = fn.slice(fn.indexOf("const productImages = async"), fn.indexOf("// Duplicar: copia en borrador"));
  expect(block).toContain("photoSetPlan(now.map(i => i.id), body.photos, GALLERY_PREFIX)");
  expect(block).toContain("wooPut(`products/${wooId}`, { images: plan.images");
  expect(block).toContain('data.type === "variation"');
  expect(block).not.toMatch(/DELETE|force|media\//i);
});

test("panel: el producto de la web enseña sus fotos; la galería de un producto nuevo suma en vez de cambiar", () => {
  expect(script).toContain('onWeb && !group ? mountPhotos(form.querySelector("[data-photos]"), Number(onWeb)) : null');
  expect(script).toContain('mountPhotos($s("[data-photos]"), Number(parentWooId), { ownButton: true');
  expect(script).not.toContain("files = [...(input.files ?? [])].slice(0, 8)"); // lo viejo: cada elección borraba la anterior
  expect(script).toContain("files.push(...picked.slice(0, plan.take));");
  expect(script).not.toContain('action: "product_main_photo"'); // la principal ya no se pisa: se elige con ★
  // En un producto de la web, «Guardar» no vuelve a mandar fotos por Core (no se duplican).
  expect(script).toContain("const galleryUrls = await uploadGallery(galleryFiles(), msg);");
  expect(script).toContain('${group || onWeb ? "" : galleryPicker(');
});
