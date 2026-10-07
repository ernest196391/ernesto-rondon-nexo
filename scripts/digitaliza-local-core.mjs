// SOLO PRUEBAS. Core local para "Digitaliza tus productos": sirve el panel
// (apps/business-dashboard) y responde como Supabase a los RPC y a la subida
// de fotos, con un Postgres en memoria (PGlite) que carga las migraciones
// reales. Nada sale de este ordenador; al cerrarlo se pierde todo.
//
//   node scripts/digitaliza-local-core.mjs            (puerto 54399)
//   http://localhost:54399/digitaliza.html?core=local&como=duena|dependienta|sin-permiso
//   POST /__test/offline {"on": true}   simula que Core no responde
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join, extname, dirname, normalize } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { startCore, rpcAs, seedStore } from "../supabase/tests/core-harness.mjs";
import { OLLA_REINA_EON } from "../apps/business-dashboard/digitaliza/pilots/olla-reina-eon.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "apps", "business-dashboard");
const FILES = join(tmpdir(), "nexo-digitaliza-local-core");
const PORT = Number(process.env.PORT || 54399);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };

const db = await startCore();
const users = await seedStore(db);
// Un producto importado con variantes (como los de la web) para probar reposiciones.
await db.query("SELECT nexo_business.import_catalog('casa-viva', 'prueba-local', $1)", [JSON.stringify([
  { productId: "bc-100", sku: "CV-100", name: "Farol solar", prices: { USD: 1100 }, stockQuantity: 6, externalRefs: { biznecubano: "100" } },
  { productId: "cv-201", sku: "CV-201-A", name: "Cortina — Beige", variantOf: "cv-200", variantLabel: "Beige", prices: { USD: 2400 }, stockQuantity: 3, externalRefs: { web: 201 } },
  { productId: "cv-202", sku: "CV-201-B", name: "Cortina — Gris", variantOf: "cv-200", variantLabel: "Gris", prices: { USD: 2400 }, stockQuantity: 1, externalRefs: { web: 202 } },
])]);
// Caso piloto: Olla Reina EON con su ficha (datos confirmados por Ernesto).
const olla = await rpcAs(db, users.owner, "public.nexo_business_intake_commit", { p_business: "casa-viva",
  p_intake: { id: "0e0e0e0e-0000-4000-8000-000000000001", ...OLLA_REINA_EON.intake } });
for (const fact of OLLA_REINA_EON.facts) await rpcAs(db, users.owner, "public.nexo_business_fact_save", { p_business: "casa-viva", p_group: olla.groupId, p_fact: fact });
const WHO = { duena: users.owner, dependienta: users.staff, "sin-permiso": users.stranger };
let offline = false;

const body = (req) => new Promise((resolve) => { const chunks = []; req.on("data", (c) => chunks.push(c)); req.on("end", () => resolve(Buffer.concat(chunks))); });
const json = (res, status, data) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(data)); };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const user = WHO[req.headers["x-test-user"]] ?? null;
  try {
    if (url.pathname === "/__test/offline") {
      offline = JSON.parse((await body(req)).toString() || "{}").on === true;
      return json(res, 200, { offline });
    }
    if (url.pathname.startsWith("/rest/") || url.pathname.startsWith("/storage/")) {
      if (offline) return req.socket.destroy(); // como una red caída: sin respuesta
    }
    const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(nexo_business_[a-z_]+)$/);
    if (rpc && req.method === "POST") {
      const args = JSON.parse((await body(req)).toString() || "{}");
      return json(res, 200, await rpcAs(db, user, `public.${rpc[1]}`, args));
    }
    const up = url.pathname.match(/^\/storage\/v1\/object\/(product-intake)\/(.+)$/);
    if (up && (req.method === "POST" || req.method === "PUT")) {
      const path = decodeURIComponent(up[2]);
      const allowed = user && await rpcAs(db, user, "public.nexo_business_can_receive", { p_business: path.split("/")[0] });
      if (!allowed) return json(res, 403, { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" });
      const file = join(FILES, normalize(path).replace(/^(\.\.[\\/])+/, ""));
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, await body(req));
      return json(res, 200, { Key: `${up[1]}/${path}`, Id: path });
    }
    const file = join(ROOT, normalize(decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)).replace(/^(\.\.[\\/])+/, ""));
    if (!file.startsWith(ROOT)) return json(res, 404, {});
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(await readFile(file));
  } catch (e) {
    if (e.code === "ENOENT") return json(res, 404, { error: "not found" });
    json(res, 500, { message: String(e.message) });
  }
}).listen(PORT, () => console.log(`Core local de PRUEBA en http://localhost:${PORT}/digitaliza.html?core=local (fotos en ${FILES})`));
