// Deja título, descripción, norm_key, costo y precio de la bolsa igual que publicar.json (solo artículos de SeFué). «hacer» para escribir.
import fs from "fs"; import { createRequire } from "module";
const require = createRequire("/root/vivabot/package.json");
require("dotenv").config({ path: "/root/vivabot/.env", quiet: true });
const { createClient } = require("@supabase/supabase-js");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const JID = "5354942950@s.whatsapp.net"; const HACER = process.argv.includes("hacer");
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const pub = JSON.parse(fs.readFileSync("publicar.json", "utf8")).productos;
const { data: rows } = await db.from("crm_market_items").select("id,title,description,norm_key,supplier_price,my_price,status,seller_jid").in("id", pub.map((p) => p.market_id));
const by = Object.fromEntries(rows.map((r) => [r.id, r])); const cambios = [];
for (const p of pub) { const r = by[p.market_id]; if (!r || r.seller_jid !== JID) { console.log("❌ falta o no es de SeFué", p.market_id); continue; }
  const want = { title: p.nombre, description: p.descripcion, norm_key: norm(p.nombre).slice(0, 80), supplier_price: p.precio_proveedor, my_price: p.precio };
  const diff = Object.fromEntries(Object.entries(want).filter(([k, v]) => String(r[k]) !== String(v)));
  if (Object.keys(diff).length) cambios.push({ id: r.id, antes: Object.fromEntries(Object.keys(diff).map((k) => [k, r[k]])), diff }); }
console.log(`${cambios.length} con diferencias`); cambios.forEach((c) => console.log(c.id, JSON.stringify(c.diff).slice(0, 160)));
if (HACER && cambios.length) { fs.writeFileSync(`bak-sincronizar-${Date.now()}.json`, JSON.stringify(cambios, null, 1));
  for (const c of cambios) { const { error } = await db.from("crm_market_items").update(c.diff).eq("id", c.id); if (error) console.log("❌", c.id, error.message); } console.log("hecho"); }
