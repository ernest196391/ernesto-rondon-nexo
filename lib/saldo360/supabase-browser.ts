"use client";
// Cliente de Supabase para el navegador (solo el proyecto dedicado de Saldo 360).
// La sesión vive en el dispositivo; los permisos los hace cumplir la base con RLS.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SALDO360_SUPABASE_URL?.replace(/\/$/, "") || "";
const key = process.env.NEXT_PUBLIC_SALDO360_SUPABASE_ANON_KEY || "";

let client: SupabaseClient | null = null;

export function saldoSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "saldo360-auth" } });
  return client;
}

export const photoUrl = (path: string | null) => (path && url ? `${url}/storage/v1/object/public/shop-photos/${path}` : null);

export type Profile = { id: string; display_name: string; role: "buyer" | "seller" | "admin"; status: "active" | "suspended" };

/** Mensajes de error de Supabase Auth traducidos a frases cortas (cuentas por número). */
export function authError(message: string | undefined): string {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login")) return "Número o clave incorrectos.";
  if (m.includes("email not confirmed")) return "Tu cuenta aún no está activada. Avisa al equipo de Saldo 360.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ese número ya tiene cuenta. Entra o pide una clave temporal.";
  if (m.includes("password") && (m.includes("characters") || m.includes("at least"))) return "La clave debe tener al menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera unos minutos.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Sin conexión. Inténtalo de nuevo.";
  return "No se pudo completar. Inténtalo de nuevo.";
}
