// Saldo 360 — reglas de la tienda del vendedor (sin dependencias del navegador; se prueban aparte).

/** Acepta «5X XXX XXX», «+53 5XXXXXXX» o «535XXXXXXX» y devuelve 53 + 8 cifras, o null. */
export function normalizeCubanMobile(input: string): string | null {
  const d = input.replace(/\D/g, "");
  const local = d.length === 10 && d.startsWith("53") ? d.slice(2) : d;
  return /^5\d{7}$/.test(local) ? "53" + local : null;
}

// Cuentas del piloto: el número es el usuario. Por dentro, Supabase guarda un correo interno
// «saldo360+<número>@casaviva.company» (Supabase exige un dominio que reciba correo).
// Con «Confirm email» apagado no se envía nada: ni correos, ni SMS, ni WhatsApp automáticos.
export const phoneLogin = (e164: string) => `saldo360+${e164}@casaviva.company`;
export function phoneFromLogin(email: string | null | undefined): string | null {
  const m = /^saldo360\+(53\d{8})@casaviva\.company$/.exec(email || "");
  return m ? m[1] : null;
}
/** «+53 5 123 4567» para mostrar. */
export const prettyPhone = (e164: string) => `+53 ${e164.slice(2, 3)} ${e164.slice(3, 6)} ${e164.slice(6)}`;

/** Dirección corta y legible de la tienda: «saldo-rapido-playa-k3x9». */
export function slugFromName(name: string, suffix: string): string {
  const base = name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30).replace(/-+$/g, "");
  return `${base || "tienda"}-${suffix.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "s360"}`;
}

/** Mensajes de la base traducidos a frases cortas para el vendedor. */
export function dbError(message: string | undefined): string {
  const m = message || "";
  if (m.includes("Máximo 5 ofertas")) return "Ya tienes 5 ofertas activas. Pausa una para publicar otra.";
  if (m.includes("Vigencia")) return "Elige una vigencia de 24, 48 o 72 horas.";
  if (m.includes("Cuenta suspendida")) return "Tu cuenta está suspendida.";
  if (m.includes("Solo el dueño") || m.includes("row-level security")) return "No tienes permiso para esta acción.";
  if (m.includes("shops_slug_key") || m.includes("duplicate key")) return "Ese nombre ya existe. Prueba con otro.";
  if (m.includes("check constraint")) return "Revisa los importes y el precio.";
  if (m.includes("no encontrada")) return "Esa oferta ya no existe.";
  if (m.toLowerCase().includes("failed to fetch")) return "Sin conexión. Inténtalo de nuevo.";
  return "No se pudo guardar. Inténtalo de nuevo.";
}

/** Horas y minutos que le quedan a una oferta, en palabras. */
export function timeLeft(expiresAt: string, now = new Date()): string {
  const min = Math.round((Date.parse(expiresAt) - now.getTime()) / 60_000);
  if (min <= 0) return "vencida";
  if (min < 60) return `vence en ${min} min`;
  return `vence en ${Math.round(min / 60)} h`;
}
