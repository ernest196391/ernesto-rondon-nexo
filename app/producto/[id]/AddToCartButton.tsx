"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddToCartButton({ productId, referral, disabled }: { productId: number; referral?: string; disabled: boolean }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function add() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/commerce/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add", productId, quantity: 1, referral }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo añadir el producto.");
      router.push(`/carrito${referral ? `?ref=${encodeURIComponent(referral)}` : ""}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo añadir el producto."); setLoading(false); }
  }
  return <><button className="buy-button" type="button" onClick={add} disabled={disabled || loading}>{disabled ? "No disponible para compra" : loading ? "Añadiendo…" : "Añadir al carrito"}</button>{error && <p className="cart-inline-error" role="alert">{error}</p>}</>;
}
