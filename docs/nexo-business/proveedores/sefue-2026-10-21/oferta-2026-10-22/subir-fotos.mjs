// Sube a Storage «mercado» las fotos arregladas (fotos/<n>.jpg) de los artículos indicados: node subir-fotos.mjs 130 72
import fs from "fs"; import { createRequire } from "module";
const require = createRequire("/root/vivabot/package.json");
require("dotenv").config({ path: "/root/vivabot/.env", quiet: true });
const { createClient } = require("@supabase/supabase-js");
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const BIZ = "8771c6ed-9dbf-497d-b3df-be6697ba2693";
const ids = JSON.parse(fs.readFileSync("bolsa-ids.json", "utf8"));
for (const n of process.argv.slice(2)) {
  const id = ids[n]; const buf = fs.readFileSync(`${process.env.DIR || "fotos"}/${n}.jpg`);
  const up = await db.storage.from("mercado").upload(`${BIZ}/${id}/limpia-1.jpg`, buf, { contentType: "image/jpeg", upsert: true });
  console.log(n, id, up.error ? "ERROR " + up.error.message : "subida");
}
