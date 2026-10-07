// Core local para pruebas: Postgres real (PGlite, en memoria) con las
// migraciones de supabase/migrations aplicadas tal cual. No toca la nube.
// Supabase aporta auth, extensions, cron, net y vault: aquí son stubs
// mínimos para que las migraciones carguen. auth.uid() lee
// request.jwt.claim.sub, igual que en Supabase.
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

const STUBS = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN
  CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE OR REPLACE FUNCTION extensions.digest(data text, type text) RETURNS bytea LANGUAGE sql AS $$ SELECT public.digest(data, type) $$;
CREATE OR REPLACE FUNCTION extensions.digest(data bytea, type text) RETURNS bytea LANGUAGE sql AS $$ SELECT public.digest(data, type) $$;
CREATE OR REPLACE FUNCTION extensions.gen_random_bytes(n int) RETURNS bytea LANGUAGE sql AS $$ SELECT public.gen_random_bytes(n) $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE SCHEMA IF NOT EXISTS cron;
CREATE OR REPLACE FUNCTION cron.schedule(a text, b text, c text) RETURNS bigint LANGUAGE sql AS $$ SELECT 1::bigint $$;
CREATE SCHEMA IF NOT EXISTS net;
CREATE OR REPLACE FUNCTION net.http_post(url text, body jsonb DEFAULT '{}', params jsonb DEFAULT '{}', headers jsonb DEFAULT '{}', timeout_milliseconds int DEFAULT 1000) RETURNS bigint LANGUAGE sql AS $$ SELECT 1::bigint $$;
CREATE SCHEMA IF NOT EXISTS vault;
CREATE TABLE IF NOT EXISTS vault.secrets (id uuid DEFAULT gen_random_uuid(), name text, secret text);
CREATE OR REPLACE VIEW vault.decrypted_secrets AS SELECT id, name, secret AS decrypted_secret FROM vault.secrets;
CREATE OR REPLACE FUNCTION vault.create_secret(s text, n text DEFAULT NULL, d text DEFAULT NULL) RETURNS uuid LANGUAGE sql AS $$ INSERT INTO vault.secrets (name, secret) VALUES (n, s) RETURNING id $$;
`;

// Extensiones que PGlite no trae: se quitan de la migración (los stubs las sustituyen).
const strip = (sql) => sql.replace(/CREATE EXTENSION IF NOT EXISTS (pg_cron|pg_net)[^;]*;/g, "");

export async function startCore() {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(STUBS);
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    try {
      await db.exec(strip(readFileSync(join(MIGRATIONS, file), "utf8")));
    } catch (e) {
      throw new Error(`${file}: ${e.message}`);
    }
  }
  return db;
}

/** Llama a una función como un usuario (null = sin sesión), igual que PostgREST. */
export async function rpcAs(db, userId, fn, args) {
  const names = Object.keys(args);
  const sql = `SELECT ${fn}(${names.map((n, i) => `${n} => $${i + 1}`).join(", ")}) AS r`;
  const values = names.map((n) => (args[n] !== null && typeof args[n] === "object" ? JSON.stringify(args[n]) : args[n]));
  return db.transaction(async (tx) => {
    await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [userId ?? ""]);
    const { rows } = await tx.query(sql, values);
    return rows[0].r;
  });
}

/** Datos mínimos de una tienda: dueña, dependienta, extraña, un producto importado. */
export async function seedStore(db, business = "casa-viva") {
  const ids = {
    owner: "00000000-0000-0000-0000-00000000000a",
    staff: "00000000-0000-0000-0000-00000000000b",
    stranger: "00000000-0000-0000-0000-00000000000c",
  };
  await db.exec(`
    INSERT INTO auth.users (id, email) VALUES ('${ids.owner}', 'duena@prueba.local'), ('${ids.staff}', 'dependienta@prueba.local'), ('${ids.stranger}', 'otra@prueba.local');
    INSERT INTO nexo_business.members (user_id, business_id, role) VALUES ('${ids.owner}', '${business}', 'owner');
    INSERT INTO nexo_business.people (business_id, kind, full_name, status, user_id) VALUES ('${business}', 'staff', 'Dependienta Prueba', 'active', '${ids.staff}');
    INSERT INTO nexo_business.catalog_products (business_id, product_id, sku, name, prices, external_refs, seq)
      VALUES ('${business}', 'bc-100', 'CV-100', 'Farol solar', '{"USD": 1100}', '{"biznecubano": "100"}', 0);
  `);
  return ids;
}
