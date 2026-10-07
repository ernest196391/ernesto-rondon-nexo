// Conector con NEXO Business Core (Supabase, esquema nexo_business).
// Solo usa los RPC de 20261005010000_nexo_business_product_intake.sql y el
// bucket privado 'product-intake'. Nunca escribe en WooCommerce ni BizneCubano.
import { toCommitPayload } from "./domain.js";

export const BUCKET = "product-intake";

export class CoreError extends Error {
  /** @param {"offline"|"forbidden"|"invalid"|"conflict"|"unknown"} code */
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const HOW = {
  offline: "No hay conexión con Core. La recepción está guardada en este dispositivo: pulsa «Reintentar» cuando vuelva internet. No se duplicará.",
  forbidden: "Tu usuario no tiene permiso para esto en esta tienda. Pide a la dueña que te dé acceso (Equipo) o entra con otra cuenta.",
  conflict: "Esta recepción ya se guardó con otros datos. Abre una recepción nueva para el cambio.",
  unknown: "Core respondió algo inesperado. La recepción sigue guardada aquí; prueba de nuevo y, si se repite, avisa al programador.",
};

const looksOffline = (err, status) =>
  status === 0 || status >= 500 || /fetch|network|load failed|timeout|abort/i.test(String(err?.message ?? err ?? ""));

/** Convierte la respuesta de Supabase o una excepción en CoreError con el modo de seguir. */
export function classify(error, data, status) {
  if (error) return new CoreError(looksOffline(error, status) ? "offline" : "unknown", looksOffline(error, status) ? HOW.offline : HOW.unknown);
  if (data?.error === "forbidden") return new CoreError("forbidden", HOW.forbidden);
  if (data?.error === "conflict") return new CoreError("conflict", HOW.conflict);
  if (data?.error === "invalid") return new CoreError("invalid", `${data.message ?? "Datos inválidos"}. Corrígelo en «Datos» y vuelve a guardar.`);
  if (data?.error) return new CoreError("unknown", HOW.unknown);
  return null;
}

const safeName = (name) => String(name || "foto").normalize("NFD").replace(/[^\w.-]+/g, "-").slice(-60);

export function createCore(client, businessId) {
  async function rpc(fn, args) {
    let res;
    try {
      res = await client.rpc(fn, args);
    } catch (e) {
      throw classify(e, null, 0);
    }
    const err = classify(res.error, res.data, res.status);
    if (err) throw err;
    return res.data;
  }

  return {
    /** Permisos y productos activos para vincular. */
    catalog: () => rpc("nexo_business_intake_catalog", { p_business: businessId }),
    list: (limit = 30) => rpc("nexo_business_intakes", { p_business: businessId, p_limit: limit }),

    /** Sube las fotos originales sin tocarlas. Rutas fijas por recepción: reintentar sobrescribe, no duplica. */
    async uploadPhotos(draft, onProgress = () => {}) {
      const refs = [];
      for (const [i, photo] of draft.photos.entries()) {
        const path = photo.uploadedPath ?? `${businessId}/${draft.id}/${i + 1}-${safeName(photo.name)}`;
        if (!photo.uploadedPath) {
          let res;
          try {
            res = await client.storage.from(BUCKET).upload(path, photo.blob, { upsert: true, contentType: photo.type || "image/jpeg" });
          } catch (e) {
            throw classify(e, null, 0);
          }
          if (res.error) {
            const status = Number(res.error.statusCode ?? res.error.status ?? 0);
            if (status === 401 || status === 403) throw new CoreError("forbidden", HOW.forbidden);
            throw classify(res.error, null, status || 0);
          }
          photo.uploadedPath = path;
        }
        refs.push({ path, name: photo.name, size: photo.size, type: photo.type });
        onProgress(i + 1, draft.photos.length);
      }
      return refs;
    },

    /** Ficha central de conocimiento: lo único que leen plantillas e IA. */
    knowledge: (groupId) => rpc("nexo_business_knowledge", { p_business: businessId, p_group: groupId }),
    saveFact: (groupId, fact) => rpc("nexo_business_fact_save", { p_business: businessId, p_group: groupId, p_fact: fact }),
    factHistory: (groupId, key) => rpc("nexo_business_fact_history", { p_business: businessId, p_group: groupId, p_key: key }),
    saveExperience: (groupId, exp) => rpc("nexo_business_experience_save", { p_business: businessId, p_group: groupId, p_exp: exp }),

    /** Fotos -> RPC idempotente. El id del borrador es la clave de operación. */
    async commit(draft, onProgress) {
      const refs = await this.uploadPhotos(draft, onProgress);
      return rpc("nexo_business_intake_commit", { p_business: businessId, p_intake: toCommitPayload(draft, refs) });
    },
  };
}
