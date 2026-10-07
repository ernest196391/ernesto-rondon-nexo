// Borradores en este dispositivo (IndexedDB): datos y fotos originales.
// Se guarda en cada cambio para recuperar la recepción tras cerrar la
// pestaña, quedarse sin batería o perder la conexión.

const DB = "nexo-digitaliza";
const STORE = "drafts";

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run(mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req?.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
  }));
}

/** Almacén persistente; si el navegador no lo permite (modo privado), uno en memoria que lo dice. */
export async function openDrafts() {
  try {
    await run("readonly", (s) => s.count());
    return {
      persistent: true,
      save: (d) => run("readwrite", (s) => s.put({ ...d, updatedAt: new Date().toISOString() })),
      get: (id) => run("readonly", (s) => s.get(id)),
      list: async (businessId) => ((await run("readonly", (s) => s.getAll())) ?? [])
        .filter((d) => d.businessId === businessId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      remove: (id) => run("readwrite", (s) => s.delete(id)),
    };
  } catch {
    const mem = new Map();
    return {
      persistent: false,
      save: async (d) => { mem.set(d.id, structuredClone({ ...d, updatedAt: new Date().toISOString() })); },
      get: async (id) => mem.get(id),
      list: async (businessId) => [...mem.values()].filter((d) => d.businessId === businessId),
      remove: async (id) => { mem.delete(id); },
    };
  }
}
