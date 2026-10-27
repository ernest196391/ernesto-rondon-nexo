// Saldo 360 — de dónde salen las ofertas (solo servidor).
// 1) Supabase dedicado de Saldo 360 (vista pública market_offers) si está configurado.
// 2) Si no, el archivo supervisado data/saldo360/offers.json (importación revisada a mano).
// Nunca mezcla datos de demo: la demo vive aparte en /saldo360/demo.
import pilot from "../../data/saldo360/offers.json";
import { offerIsLive, type MarketOffer, type PaymentMethod } from "./market";

export const supabaseUrl = process.env.NEXT_PUBLIC_SALDO360_SUPABASE_URL?.replace(/\/$/, "") || "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SALDO360_SUPABASE_ANON_KEY || "";
export const marketSource: "supabase" | "pilot" = supabaseUrl && supabaseAnonKey ? "supabase" : "pilot";

type Row = {
  id: string; shop_slug: string; shop_name: string; locality: string; photo_path: string | null; whatsapp_e164: string;
  min_cup: number; max_cup: number; price_per_100_cup: string | number; payment_methods: PaymentMethod[];
  confirmed_at: string; expires_at: string; confirmed_ops: number; reviews_count: number; rating_avg: string | number | null;
};

function fromRow(r: Row): MarketOffer {
  return {
    id: r.id, shopSlug: r.shop_slug, shopName: r.shop_name, locality: r.locality,
    photoUrl: r.photo_path ? `${supabaseUrl}/storage/v1/object/public/shop-photos/${r.photo_path}` : null,
    whatsapp: r.whatsapp_e164, minCup: r.min_cup, maxCup: r.max_cup, pricePer100Cup: Number(r.price_per_100_cup),
    paymentMethods: r.payment_methods, confirmedAt: r.confirmed_at, expiresAt: r.expires_at,
    confirmedOps: r.confirmed_ops, reviewsCount: r.reviews_count, ratingAvg: r.rating_avg == null ? null : Number(r.rating_avg),
  };
}

/** Ofertas vigentes. Si la base falla, devuelve [] y error: mejor vacío que precios dudosos. */
export async function loadOffers(): Promise<{ offers: MarketOffer[]; error: boolean }> {
  if (marketSource === "pilot") {
    return { offers: (pilot.offers as MarketOffer[]).filter((o) => offerIsLive(o)), error: false };
  }
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/market_offers?select=*&order=price_per_100_cup.asc&limit=200`, {
      headers: { apikey: supabaseAnonKey },
      next: { revalidate: 30 },
    });
    if (!res.ok) return { offers: [], error: true };
    return { offers: ((await res.json()) as Row[]).map(fromRow).filter((o) => offerIsLive(o)), error: false };
  } catch {
    return { offers: [], error: true };
  }
}
