"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Variation = { id: number; price?: string; stock_status?: string; purchasable?: boolean; attributes?: Array<{ id?: number; name: string; option: string }> };

export default function AddToCartButton({ productId, referral, disabled, variations = [] }: { productId: number; referral?: string; disabled: boolean; variations?: Variation[] }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const available = variations.filter((x) => x.stock_status === "instock" && x.purchasable !== false);
  const [variationId, setVariationId] = useState(available.length === 1 ? String(available[0].id) : "");
  async function add() {
    if (variations.length && !variationId) { setError("Selecciona una opción antes de añadir el producto."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/commerce/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add", productId: variationId ? Number(variationId) : productId, quantity: 1, referral }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo añadir el producto.");
      router.push(`/carrito${referral ? `?ref=${encodeURIComponent(referral)}` : ""}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo añadir el producto."); setLoading(false); }
  }
  return <>{variations.length > 0 && <label className="variation-picker"><span>Elige una opción</span><select value={variationId} onChange={(e) => { setVariationId(e.target.value); setError(""); }} required><option value="">Selecciona</option>{available.map((variation) => <option key={variation.id} value={variation.id}>{variation.attributes?.map((x) => `${x.name}: ${x.option}`).join(" · ") || `Opción ${variation.id}`}{variation.price ? ` — ${variation.price} USD` : ""}</option>)}</select></label>}<button className="buy-button" type="button" onClick={add} disabled={disabled || loading || (variations.length > 0 && available.length === 0)}>{disabled || (variations.length > 0 && available.length === 0) ? "No disponible para compra" : loading ? "Añadiendo…" : "Añadir al carrito"}</button>{error && <p className="cart-inline-error" role="alert">{error}</p>}</>;
}
