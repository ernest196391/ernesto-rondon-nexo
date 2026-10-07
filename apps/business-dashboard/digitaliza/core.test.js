import { describe, expect, it, vi } from "vitest";
import { STORES } from "./store-config.js";
import { newDraft } from "./domain.js";
import { classify, createCore } from "./core.js";

function ready() {
  const d = newDraft(STORES["casa-viva"], "new");
  d.photos = [{ id: "1", name: "Foto frente.JPG", type: "image/jpeg", size: 3, blob: "b1", uploadedPath: null },
    { id: "2", name: "etiqueta.jpg", type: "image/jpeg", size: 3, blob: "b2", uploadedPath: null }];
  d.product.name = "Espejo";
  d.product.price = "30";
  d.quantity = "1";
  return d;
}

function fakeClient({ rpc, upload }) {
  const calls = [];
  return {
    calls,
    rpc: async (fn, args) => { calls.push(["rpc", fn, args]); return rpc(fn, args); },
    storage: { from: (bucket) => ({ upload: async (path, blob, opts) => { calls.push(["upload", bucket, path, opts.upsert]); return upload(path); } }) },
  };
}

describe("errores de Core", () => {
  it("red caída o 5xx -> offline", () => {
    expect(classify({ message: "TypeError: Failed to fetch" }, null, 0).code).toBe("offline");
    expect(classify({ message: "x" }, null, 503).code).toBe("offline");
  });
  it("respuestas de negocio", () => {
    expect(classify(null, { error: "forbidden" }).code).toBe("forbidden");
    expect(classify(null, { error: "conflict" }).code).toBe("conflict");
    const inv = classify(null, { error: "invalid", message: "Falta el precio de venta" });
    expect(inv.code).toBe("invalid");
    expect(inv.message).toMatch(/Falta el precio de venta.*Corrígelo/);
    expect(classify(null, { ok: true })).toBeNull();
  });
});

describe("guardar en Core", () => {
  it("sube las fotos originales y luego llama al RPC con el id de la recepción", async () => {
    const client = fakeClient({ upload: () => ({ data: {}, error: null }), rpc: () => ({ data: { ok: true, lines: [] }, error: null, status: 200 }) });
    const d = ready();
    const r = await createCore(client, "casa-viva").commit(d);
    expect(r.ok).toBe(true);
    expect(client.calls.map((c) => c[0])).toEqual(["upload", "upload", "rpc"]);
    expect(client.calls[0]).toEqual(["upload", "product-intake", `casa-viva/${d.id}/1-Foto-frente.JPG`, true]);
    const payload = client.calls[2][2].p_intake;
    expect(payload.id).toBe(d.id);
    expect(payload.photos.map((p) => p.path)).toEqual([`casa-viva/${d.id}/1-Foto-frente.JPG`, `casa-viva/${d.id}/2-etiqueta.jpg`]);
  });

  it("si se corta a mitad, el reintento no vuelve a subir lo ya subido y usa el mismo id", async () => {
    let fail = true;
    const client = fakeClient({
      upload: (path) => (path.endsWith("/2-etiqueta.jpg") && fail ? { data: null, error: { message: "Failed to fetch" } } : { data: {}, error: null }),
      rpc: () => ({ data: { ok: true }, error: null, status: 200 }),
    });
    const d = ready();
    const core = createCore(client, "casa-viva");
    await expect(core.commit(d)).rejects.toMatchObject({ code: "offline" });
    expect(client.calls.some((c) => c[0] === "rpc")).toBe(false);
    fail = false;
    await core.commit(d);
    const uploads = client.calls.filter((c) => c[0] === "upload").map((c) => c[2].split("/").pop());
    expect(uploads).toEqual(["1-Foto-frente.JPG", "2-etiqueta.jpg", "2-etiqueta.jpg"]);
    expect(client.calls.find((c) => c[0] === "rpc")[2].p_intake.id).toBe(d.id);
  });

  it("subida rechazada por permisos -> forbidden", async () => {
    const client = fakeClient({ upload: () => ({ data: null, error: { statusCode: "403", message: "row-level security" } }), rpc: vi.fn() });
    await expect(createCore(client, "casa-viva").commit(ready())).rejects.toMatchObject({ code: "forbidden" });
  });

  it("una excepción de red en el RPC -> offline", async () => {
    const client = fakeClient({ upload: () => ({ data: {}, error: null }), rpc: () => { throw new TypeError("fetch failed"); } });
    await expect(createCore(client, "casa-viva").commit(ready())).rejects.toMatchObject({ code: "offline" });
  });
});
