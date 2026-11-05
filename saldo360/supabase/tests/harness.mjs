// Saldo 360 local para pruebas: Postgres real (PGlite, en memoria) con las
// migraciones de saldo360/supabase/migrations aplicadas tal cual. No toca la nube.
// auth y storage de Supabase son stubs mínimos; auth.uid() lee
// request.jwt.claim.sub, igual que en Supabase.
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

const STUBS = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE OR REPLACE FUNCTION extensions.crypt(p text, s text) RETURNS text LANGUAGE sql AS $$ SELECT public.crypt(p, s) $$;
CREATE OR REPLACE FUNCTION extensions.gen_salt(t text) RETURNS text LANGUAGE sql AS $$ SELECT public.gen_salt(t) $$;
CREATE OR REPLACE FUNCTION extensions.gen_random_bytes(n int) RETURNS bytea LANGUAGE sql AS $$ SELECT public.gen_random_bytes(n) $$;
CREATE OR REPLACE FUNCTION extensions.digest(data text, type text) RETURNS bytea LANGUAGE sql AS $$ SELECT public.digest(data, type) $$;
DO $$ BEGIN
  CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb, encrypted_password text, updated_at timestamptz);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
CREATE TABLE IF NOT EXISTS storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text, owner uuid DEFAULT auth.uid());
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
`;

export async function startSaldo() {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(STUBS);
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    try {
      await db.exec(readFileSync(join(MIGRATIONS, file), "utf8").replace(/^﻿/, ""));
    } catch (e) {
      throw new Error(`${file}: ${e.message}`);
    }
  }
  return db;
}

/** Ejecuta fn como visitante (user = null) o como usuario con sesión, igual que PostgREST. */
export async function as(db, user, fn) {
  return db.transaction(async (tx) => {
    await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [user ?? ""]);
    await tx.exec(`SET LOCAL ROLE ${user ? "authenticated" : "anon"}`);
    return fn(tx);
  });
}

/** Alta de usuarios como lo haría Supabase Auth (el disparador crea el perfil). */
export async function signUp(db, users) {
  for (const [id, name] of Object.entries(users)) {
    await db.query("INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, $3)",
      [id, `${id.slice(-4)}@prueba.local`, JSON.stringify({ display_name: name })]);
  }
}
