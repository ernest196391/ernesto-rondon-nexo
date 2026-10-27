// Permisos de Saldo 360 con usuarios simulados: visitante, comprador, proveedores A y B,
// tercero y admin. Pruebas positivas y negativas sobre la base real (PGlite).
import { beforeAll, describe, expect, it } from "vitest";
import { as, signUp, startSaldo } from "./harness.mjs";

const U = {
  admin: "00000000-0000-0000-0000-0000000000ad",
  sellerA: "00000000-0000-0000-0000-00000000000a",
  sellerB: "00000000-0000-0000-0000-00000000000b",
  buyer: "00000000-0000-0000-0000-00000000000c",
  other: "00000000-0000-0000-0000-00000000000d",
};
const one = async (tx, sql, params) => (await tx.query(sql, params)).rows[0];
const rows = async (tx, sql, params) => (await tx.query(sql, params)).rows;

let db;
let shopA;
let shopB;
let offerA;

beforeAll(async () => {
  db = await startSaldo();
  await signUp(db, { [U.admin]: "Admin", [U.sellerA]: "Ana", [U.sellerB]: "Beto", [U.buyer]: "Carla", [U.other]: "Dora" });
  await db.query("UPDATE public.profiles SET role = 'admin' WHERE id = $1", [U.admin]);
}, 60_000);

describe("cuentas y roles", () => {
  it("el alta crea perfil de comprador activo", async () => {
    const p = await as(db, U.buyer, (tx) => one(tx, "SELECT role, status, display_name FROM public.profiles WHERE id = $1", [U.buyer]));
    expect(p).toEqual({ role: "buyer", status: "active", display_name: "Carla" });
  });

  it("nadie se sube de rol ni se reactiva solo", async () => {
    await expect(as(db, U.buyer, (tx) => tx.query("UPDATE public.profiles SET role = 'admin' WHERE id = $1", [U.buyer])))
      .rejects.toThrow(/permission denied/);
    await expect(as(db, U.buyer, (tx) => tx.query("UPDATE public.profiles SET status = 'active' WHERE id = $1", [U.buyer])))
      .rejects.toThrow(/permission denied/);
    const r = await as(db, U.buyer, (tx) => tx.query("UPDATE public.profiles SET display_name = 'Carla P' WHERE id = $1", [U.buyer]));
    expect(r.affectedRows).toBe(1);
  });

  it("un usuario no ve el perfil de otro; el visitante no ve perfiles", async () => {
    const r = await as(db, U.buyer, (tx) => rows(tx, "SELECT id FROM public.profiles"));
    expect(r.map((x) => x.id)).toEqual([U.buyer]);
    await expect(as(db, null, (tx) => tx.query("SELECT id FROM public.profiles"))).rejects.toThrow(/permission denied/);
  });
});

describe("tiendas", () => {
  it("crear tienda la deja pendiente y convierte en proveedor", async () => {
    shopA = (await as(db, U.sellerA, (tx) => one(tx,
      "INSERT INTO public.shops (slug, name, locality, whatsapp_e164) VALUES ('ana-saldo', 'Ana Saldo', 'Playa', '5351111111') RETURNING id, status, owner_id"))) ;
    expect(shopA.status).toBe("pending");
    expect(shopA.owner_id).toBe(U.sellerA);
    shopA = shopA.id;
    const p = await as(db, U.sellerA, (tx) => one(tx, "SELECT role FROM public.profiles WHERE id = $1", [U.sellerA]));
    expect(p.role).toBe("seller");
    shopB = (await as(db, U.sellerB, (tx) => one(tx,
      "INSERT INTO public.shops (slug, name, whatsapp_e164) VALUES ('beto', 'Beto', '5352222222') RETURNING id"))).id;
  });

  it("una tienda pendiente no es pública", async () => {
    const r = await as(db, null, (tx) => rows(tx, "SELECT id FROM public.shops"));
    expect(r).toEqual([]);
  });

  it("el dueño no se aprueba solo ni toca campos de moderación", async () => {
    await expect(as(db, U.sellerA, (tx) => tx.query("UPDATE public.shops SET status = 'approved' WHERE id = $1", [shopA])))
      .rejects.toThrow(/Solo puedes pausar/);
    await expect(as(db, U.sellerA, (tx) => tx.query("UPDATE public.shops SET verified_at = now() WHERE id = $1", [shopA])))
      .rejects.toThrow(/permission denied/);
    await expect(as(db, U.sellerA, (tx) => tx.query("SELECT public.admin_set_shop_status($1, 'approved')", [shopA])))
      .rejects.toThrow(/Solo moderación/);
  });

  it("el admin aprueba; el público ve la tienda pero no datos internos", async () => {
    await as(db, U.admin, (tx) => tx.query("SELECT public.admin_set_shop_status($1, 'approved', 'WhatsApp comprobado')", [shopA]));
    await as(db, U.admin, (tx) => tx.query("SELECT public.admin_set_shop_status($1, 'approved')", [shopB]));
    const r = await as(db, null, (tx) => rows(tx, "SELECT slug, whatsapp_e164 FROM public.shops ORDER BY slug"));
    expect(r).toEqual([{ slug: "ana-saldo", whatsapp_e164: "5351111111" }, { slug: "beto", whatsapp_e164: "5352222222" }]);
    await expect(as(db, null, (tx) => tx.query("SELECT consent_evidence FROM public.shops"))).rejects.toThrow(/permission denied/);
    await expect(as(db, null, (tx) => tx.query("SELECT owner_id FROM public.shops"))).rejects.toThrow(/permission denied/);
  });

  it("el proveedor B no puede modificar la tienda de A", async () => {
    const r = await as(db, U.sellerB, (tx) => tx.query("UPDATE public.shops SET name = 'Hackeada' WHERE id = $1", [shopA]));
    expect(r.affectedRows).toBe(0);
    const n = await as(db, null, (tx) => one(tx, "SELECT name FROM public.shops WHERE id = $1", [shopA]));
    expect(n.name).toBe("Ana Saldo");
  });

  it("un usuario no puede tener dos tiendas", async () => {
    await expect(as(db, U.sellerA, (tx) => tx.query("INSERT INTO public.shops (slug, name) VALUES ('ana-2', 'Ana 2')")))
      .rejects.toThrow(/duplicate key|unique/);
  });
});

describe("ofertas", () => {
  it("el dueño publica y el visitante la ve en el mercado con su reputación real (0)", async () => {
    offerA = (await as(db, U.sellerA, (tx) => one(tx,
      `INSERT INTO public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods)
       VALUES ($1, 100, 5000, 42.5, '{transfermovil,efectivo}') RETURNING id, source`, [shopA])));
    expect(offerA.source).toBe("web");
    offerA = offerA.id;
    const m = await as(db, null, (tx) => rows(tx, "SELECT id, shop_name, price_per_100_cup, confirmed_ops, rating_avg FROM public.market_offers"));
    expect(m).toEqual([{ id: offerA, shop_name: "Ana Saldo", price_per_100_cup: "42.50", confirmed_ops: 0, rating_avg: null }]);
  });

  it("el proveedor B no publica ni edita ofertas en la tienda de A", async () => {
    await expect(as(db, U.sellerB, (tx) => tx.query(
      "INSERT INTO public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods) VALUES ($1, 1, 10, 1, '{efectivo}')", [shopA])))
      .rejects.toThrow(/row-level security|Solo el dueño/);
    const r = await as(db, U.sellerB, (tx) => tx.query("UPDATE public.offers SET price_per_100_cup = 1 WHERE id = $1", [offerA]));
    expect(r.affectedRows).toBe(0);
  });

  it("precios y métodos inválidos se rechazan", async () => {
    await expect(as(db, U.sellerA, (tx) => tx.query(
      "INSERT INTO public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods) VALUES ($1, 100, 50, 40, '{efectivo}')", [shopA])))
      .rejects.toThrow(/check/);
    await expect(as(db, U.sellerA, (tx) => tx.query(
      "INSERT INTO public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods) VALUES ($1, 1, 50, 0, '{efectivo}')", [shopA])))
      .rejects.toThrow(/check/);
    await expect(as(db, U.sellerA, (tx) => tx.query(
      "INSERT INTO public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods) VALUES ($1, 1, 50, 40, '{bitcoin}')", [shopA])))
      .rejects.toThrow(/check/);
  });

  it("una oferta vencida desaparece del mercado sin intervención", async () => {
    const id = (await as(db, U.sellerB, (tx) => one(tx,
      "INSERT INTO public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods) VALUES ($1, 1, 100, 39, '{enzona}') RETURNING id", [shopB]))).id;
    let m = await as(db, null, (tx) => rows(tx, "SELECT id FROM public.market_offers WHERE id = $1", [id]));
    expect(m).toHaveLength(1);
    await db.query("UPDATE public.offers SET confirmed_at = now() - interval '30 hours', expires_at = now() - interval '6 hours' WHERE id = $1", [id]);
    m = await as(db, null, (tx) => rows(tx, "SELECT id FROM public.offers WHERE id = $1", [id]));
    expect(m).toEqual([]);
    // El dueño la sigue viendo y puede reconfirmarla: vuelve con fecha de hoy.
    await as(db, U.sellerB, (tx) => tx.query("UPDATE public.offers SET confirmed_at = now(), expires_at = now() + interval '12 hours' WHERE id = $1", [id]));
    m = await as(db, null, (tx) => rows(tx, "SELECT id FROM public.market_offers WHERE id = $1", [id]));
    expect(m).toHaveLength(1);
  });

  it("vigencia máxima 72 h y máximo 5 ofertas activas", async () => {
    await expect(as(db, U.sellerA, (tx) => tx.query(
      "INSERT INTO public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods, expires_at) VALUES ($1, 1, 10, 40, '{efectivo}', now() + interval '5 days')", [shopA])))
      .rejects.toThrow(/check/);
    await as(db, U.sellerA, async (tx) => {
      for (let i = 0; i < 4; i++) {
        await tx.query("INSERT INTO public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods) VALUES ($1, 1, 10, 40, '{efectivo}')", [shopA]);
      }
    });
    await expect(as(db, U.sellerA, (tx) => tx.query(
      "INSERT INTO public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods) VALUES ($1, 1, 10, 40, '{efectivo}')", [shopA])))
      .rejects.toThrow(/Máximo 5/);
    // Pausar libera hueco; pausadas no salen al público.
    await as(db, U.sellerA, (tx) => tx.query("UPDATE public.offers SET status = 'paused' WHERE shop_id = $1 AND id <> $2", [shopA, offerA]));
    const m = await as(db, null, (tx) => rows(tx, "SELECT id FROM public.market_offers WHERE shop_id = $1", [shopA]));
    expect(m.map((x) => x.id)).toEqual([offerA]);
  });

  it("cambiar el WhatsApp obliga a verificar de nuevo y oculta las ofertas", async () => {
    await as(db, U.sellerB, (tx) => tx.query("UPDATE public.shops SET whatsapp_e164 = '5353333333' WHERE id = $1", [shopB]));
    const s = await as(db, U.sellerB, (tx) => one(tx, "SELECT status FROM public.shops WHERE id = $1", [shopB]));
    expect(s.status).toBe("pending");
    const m = await as(db, null, (tx) => rows(tx, "SELECT id FROM public.market_offers WHERE shop_id = $1", [shopB]));
    expect(m).toEqual([]);
    await as(db, U.admin, (tx) => tx.query("SELECT public.admin_set_shop_status($1, 'approved')", [shopB]));
  });
});

describe("contactos y operaciones", () => {
  it("un clic a WhatsApp es un contacto, no una venta", async () => {
    await as(db, null, (tx) => tx.query("SELECT public.log_contact($1, 300)", [offerA]));
    await as(db, U.buyer, (tx) => tx.query("SELECT public.log_contact($1, 300)", [offerA]));
    await expect(as(db, null, (tx) => tx.query("SELECT * FROM public.contact_events"))).rejects.toThrow(/permission denied/);
    const own = await as(db, U.sellerA, (tx) => one(tx, "SELECT count(*)::int AS n FROM public.contact_events WHERE shop_id = $1", [shopA]));
    expect(own.n).toBe(2);
    const other = await as(db, U.sellerB, (tx) => one(tx, "SELECT count(*)::int AS n FROM public.contact_events WHERE shop_id = $1", [shopA]));
    expect(other.n).toBe(0);
    const rep = await as(db, null, (tx) => one(tx, "SELECT confirmed_ops FROM public.market_offers WHERE id = $1", [offerA]));
    expect(rep.confirmed_ops).toBe(0);
  });

  let req;
  it("el comprador abre una operación con el precio congelado; reintentos no duplican", async () => {
    req = (await as(db, U.buyer, (tx) => one(tx, "SELECT public.start_request($1, 1000) AS id", [offerA]))).id;
    const again = (await as(db, U.buyer, (tx) => one(tx, "SELECT public.start_request($1, 1000) AS id", [offerA]))).id;
    expect(again).toBe(req);
    const r = await as(db, U.buyer, (tx) => one(tx, "SELECT status, total_cup, price_per_100_cup FROM public.requests WHERE id = $1", [req]));
    expect(r).toEqual({ status: "contacted", total_cup: "425.00", price_per_100_cup: "42.50" });
    // Cambiar el precio después no altera la operación abierta.
    await as(db, U.sellerA, (tx) => tx.query("UPDATE public.offers SET price_per_100_cup = 50 WHERE id = $1", [offerA]));
    const r2 = await as(db, U.buyer, (tx) => one(tx, "SELECT total_cup FROM public.requests WHERE id = $1", [req]));
    expect(r2.total_cup).toBe("425.00");
  });

  it("importes fuera de rango, compras a uno mismo y visitantes se rechazan", async () => {
    await expect(as(db, U.buyer, (tx) => tx.query("SELECT public.start_request($1, 99999)", [offerA]))).rejects.toThrow(/Revisa el importe/);
    await expect(as(db, U.sellerA, (tx) => tx.query("SELECT public.start_request($1, 500)", [offerA]))).rejects.toThrow(/ti mismo/);
    await expect(as(db, null, (tx) => tx.query("SELECT public.start_request($1, 500)", [offerA]))).rejects.toThrow(/permission denied/);
  });

  it("un tercero no ve ni mueve la operación; nadie la edita directamente", async () => {
    const r = await as(db, U.other, (tx) => rows(tx, "SELECT id FROM public.requests"));
    expect(r).toEqual([]);
    await expect(as(db, U.other, (tx) => tx.query("SELECT public.request_action($1, 'confirm')", [req]))).rejects.toThrow(/No participas/);
    await expect(as(db, U.buyer, (tx) => tx.query("UPDATE public.requests SET status = 'confirmed' WHERE id = $1", [req])))
      .rejects.toThrow(/permission denied/);
  });

  it("no se valora sin operación confirmada por ambas partes", async () => {
    await expect(as(db, U.buyer, (tx) => tx.query("SELECT public.leave_review($1, 5)", [req]))).rejects.toThrow(/confirmadas por ambas/);
    await as(db, U.sellerA, (tx) => tx.query("SELECT public.request_action($1, 'deliver')", [req]));
    const s1 = await as(db, U.sellerA, (tx) => one(tx, "SELECT public.request_action($1, 'confirm') AS s", [req]));
    expect(s1.s).toBe("delivered");
    await expect(as(db, U.buyer, (tx) => tx.query("SELECT public.leave_review($1, 5)", [req]))).rejects.toThrow(/confirmadas por ambas/);
    const s2 = await as(db, U.buyer, (tx) => one(tx, "SELECT public.request_action($1, 'confirm') AS s", [req]));
    expect(s2.s).toBe("confirmed");
  });

  it("la operación confirmada suma reputación; una sola reseña y solo del comprador", async () => {
    await expect(as(db, U.sellerA, (tx) => tx.query("SELECT public.leave_review($1, 5)", [req]))).rejects.toThrow(/Solo el comprador/);
    await as(db, U.buyer, (tx) => tx.query("SELECT public.leave_review($1, 4, 'Rápida y seria')", [req]));
    await expect(as(db, U.buyer, (tx) => tx.query("SELECT public.leave_review($1, 5)", [req]))).rejects.toThrow(/duplicate key|unique/);
    const m = await as(db, null, (tx) => one(tx, "SELECT confirmed_ops, reviews_count, rating_avg FROM public.market_offers WHERE id = $1", [offerA]));
    expect(m).toEqual({ confirmed_ops: 1, reviews_count: 1, rating_avg: "4.0" });
    await expect(as(db, null, (tx) => tx.query("SELECT buyer_id FROM public.reviews"))).rejects.toThrow(/permission denied/);
    const pub = await as(db, null, (tx) => rows(tx, "SELECT rating, comment FROM public.reviews"));
    expect(pub).toEqual([{ rating: 4, comment: "Rápida y seria" }]);
  });

  it("una disputa no suma reputación hasta que moderación la resuelve", async () => {
    const r2 = (await as(db, U.other, (tx) => one(tx, "SELECT public.start_request($1, 200) AS id", [offerA]))).id;
    await as(db, U.other, (tx) => tx.query("SELECT public.request_action($1, 'dispute', 'No llegó el saldo')", [r2]));
    await expect(as(db, U.other, (tx) => tx.query("SELECT public.leave_review($1, 1)", [r2]))).rejects.toThrow(/confirmadas por ambas/);
    await expect(as(db, U.sellerA, (tx) => tx.query("SELECT public.admin_resolve_dispute($1, 'confirmed', 'x')", [r2]))).rejects.toThrow(/Solo moderación/);
    await as(db, U.admin, (tx) => tx.query("SELECT public.admin_resolve_dispute($1, 'cancelled', 'Sin pruebas de entrega')", [r2]));
    const m = await as(db, null, (tx) => one(tx, "SELECT confirmed_ops FROM public.market_offers WHERE id = $1", [offerA]));
    expect(m.confirmed_ops).toBe(1);
  });
});

describe("moderación, importación supervisada y fotos", () => {
  it("suspender a un proveedor oculta su tienda y bloquea nuevas ofertas", async () => {
    await as(db, U.admin, (tx) => tx.query("SELECT public.admin_set_user_status($1, 'suspended', 'prueba')", [U.sellerB]));
    const m = await as(db, null, (tx) => rows(tx, "SELECT id FROM public.market_offers WHERE shop_id = $1", [shopB]));
    expect(m).toEqual([]);
    await expect(as(db, U.sellerB, (tx) => tx.query(
      "INSERT INTO public.offers (shop_id, min_cup, max_cup, price_per_100_cup, payment_methods) VALUES ($1, 1, 10, 40, '{efectivo}')", [shopB])))
      .rejects.toThrow(/row-level security|Solo el dueño/);
  });

  it("el admin publica para una tienda gestionada solo con consentimiento registrado", async () => {
    const managed = (await db.query(
      "INSERT INTO public.shops (owner_id, slug, name, status) VALUES (NULL, 'piloto-1', 'Proveedor piloto', 'approved') RETURNING id")).rows[0].id;
    await expect(as(db, U.admin, (tx) => tx.query(
      "SELECT public.admin_publish_offer($1, 100, 1000, 40, '{transfermovil}', 12)", [managed]))).rejects.toThrow(/consentimiento/);
    await db.query("UPDATE public.shops SET whatsapp_e164 = '5354444444', whatsapp_consent_at = now(), consent_evidence = 'Audio 27-oct' WHERE id = $1", [managed]);
    const id = (await as(db, U.admin, (tx) => one(tx,
      "SELECT public.admin_publish_offer($1, 100, 1000, 40, '{transfermovil}', 12, 'vivabot') AS id", [managed]))).id;
    const o = await as(db, null, (tx) => one(tx, "SELECT shop_name FROM public.market_offers WHERE id = $1", [id]));
    expect(o.shop_name).toBe("Proveedor piloto");
    await expect(as(db, U.buyer, (tx) => tx.query(
      "SELECT public.admin_publish_offer($1, 100, 1000, 40, '{transfermovil}', 12)", [managed]))).rejects.toThrow(/Solo moderación/);
  });

  it("solo el admin lee la auditoría y registra los cambios", async () => {
    await expect(as(db, null, (tx) => tx.query("SELECT * FROM public.audit_events"))).rejects.toThrow(/permission denied/);
    const none = await as(db, U.sellerA, (tx) => rows(tx, "SELECT id FROM public.audit_events"));
    expect(none).toEqual([]);
    const all = await as(db, U.admin, (tx) => one(tx, "SELECT count(*)::int AS n FROM public.audit_events WHERE action = 'moderate'"));
    expect(all.n).toBeGreaterThan(2);
  });

  it("cada proveedor sube fotos solo a su carpeta", async () => {
    await as(db, U.sellerA, (tx) => tx.query("INSERT INTO storage.objects (bucket_id, name) VALUES ('shop-photos', $1)", [`${U.sellerA}/perfil.jpg`]));
    await expect(as(db, U.sellerA, (tx) => tx.query("INSERT INTO storage.objects (bucket_id, name) VALUES ('shop-photos', $1)", [`${U.sellerB}/perfil.jpg`])))
      .rejects.toThrow(/row-level security/);
    const del = await as(db, U.sellerA, (tx) => tx.query("DELETE FROM storage.objects WHERE name = $1", [`${U.sellerB}/perfil.jpg`]));
    expect(del.affectedRows).toBe(0);
  });
});
