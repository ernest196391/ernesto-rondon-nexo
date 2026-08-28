"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Cart, CartItem, CommercePhase } from "../../lib/commerce/cart";
import {
  formatMoney,
  itemCount,
  optimisticQuantity,
  optimisticRemove,
  productCountLabel,
} from "../../lib/commerce/cart";

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No pudimos actualizar el carrito. Revisa tu conexión e inténtalo de nuevo.";
}
export default function CartClient({
  initialReferral,
}: {
  initialReferral: string;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null),
    [referral, setReferral] = useState(initialReferral),
    [phase, setPhase] = useState<CommercePhase>("restoring"),
    [updating, setUpdating] = useState(""),
    [error, setError] = useState(""),
    [announcement, setAnnouncement] = useState(""),
    [removed, setRemoved] = useState<CartItem | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);
  const request = useCallback(
    async (action?: object) => {
      const endpoint = action
        ? "/api/commerce/cart"
        : `/api/commerce/cart?nexo_session=${Date.now()}`;
      const response = await fetch(
        endpoint,
        action
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(action),
              signal: AbortSignal.timeout(25_000),
            }
          : { cache: "no-store", signal: AbortSignal.timeout(25_000) },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error ||
            "No pudimos actualizar el carrito. Revisa tu conexión e inténtalo de nuevo.",
        );
      setCart(data.cart);
      setReferral(data.referral || initialReferral);
      return data.cart as Cart;
    },
    [initialReferral],
  );
  const restore = useCallback(async () => {
    setPhase("restoring");
    setError("");
    try {
      const next = await request();
      setPhase(next.items.length ? "ready" : "empty");
    } catch (caught) {
      setError(errorMessage(caught));
      setPhase("error");
    }
  }, [request]);
  useEffect(() => {
    const timer = window.setTimeout(() => void restore(), 0);
    return () => {
      window.clearTimeout(timer);
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
    };
  }, [restore]);
  async function updateQuantity(item: CartItem, quantity: number) {
    if (!cart) return;
    const snapshot = cart;
    setUpdating(item.key);
    setPhase("updating");
    setError("");
    setCart(optimisticQuantity(cart, item.key, quantity));
    try {
      const next = await request({ action: "update", key: item.key, quantity });
      setAnnouncement(
        `Cantidad de ${item.name}: ${quantity}. Total actualizado.`,
      );
      setPhase(next.items.length ? "ready" : "empty");
    } catch (caught) {
      setCart(snapshot);
      setError(errorMessage(caught));
      setAnnouncement(
        "No se pudo actualizar la cantidad. Se restauró el valor anterior.",
      );
      setPhase("error");
    } finally {
      setUpdating("");
    }
  }
  async function removeItem(item: CartItem) {
    if (!cart) return;
    const snapshot = cart;
    setUpdating(item.key);
    setPhase("updating");
    setError("");
    setCart(optimisticRemove(cart, item.key));
    try {
      const next = await request({ action: "remove", key: item.key });
      setRemoved(item);
      setAnnouncement("Producto eliminado del carrito.");
      setPhase(next.items.length ? "ready" : "empty");
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
      undoTimer.current = window.setTimeout(() => setRemoved(null), 7000);
    } catch (caught) {
      setCart(snapshot);
      setError(errorMessage(caught));
      setAnnouncement(
        "No se pudo eliminar el producto. El carrito fue restaurado.",
      );
      setPhase("error");
    } finally {
      setUpdating("");
    }
  }
  async function undoRemove() {
    if (!removed) return;
    const item = removed;
    setRemoved(null);
    setPhase("updating");
    try {
      const next = await request({
        action: "add",
        productId: item.id,
        quantity: item.quantity,
        referral,
      });
      setAnnouncement(`${item.name} volvió al carrito.`);
      setPhase(next.items.length ? "ready" : "empty");
    } catch (caught) {
      setError(errorMessage(caught));
      setPhase("error");
    }
  }
  const query = useMemo(
    () => (referral ? `?ref=${encodeURIComponent(referral)}` : ""),
    [referral],
  );
  if (phase === "restoring")
    return (
      <section className="cart-state" aria-live="polite">
        <div className="cart-spinner" />
        <h1>Preparando tu carrito…</h1>
        <p>Estamos comprobando tus productos.</p>
      </section>
    );
  if (phase === "error" && !cart)
    return (
      <section className="cart-state error" role="alert">
        <h1>No pudimos recuperar tu carrito</h1>
        <p>{error}</p>
        <button onClick={() => void restore()}>Reintentar</button>
      </section>
    );
  if (!cart?.items.length)
    return (
      <>
        <section className="cart-state">
          <span className="empty-cart-icon" aria-hidden="true">
            ⌑
          </span>
          <h1>Tu carrito está vacío</h1>
          <p>Explora nuestros productos y añade los que quieras comprar.</p>
          <Link href={`/marketplace${query}`}>Explorar productos</Link>
        </section>
        {removed && (
          <div className="cart-toast" role="status">
            <span>Producto eliminado del carrito.</span>
            <button onClick={() => void undoRemove()}>Deshacer</button>
          </div>
        )}
      </>
    );
  const count = itemCount(cart);
  return (
    <>
      <div className="cart-live" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <div className="cart-shell">
        <section className="cart-list">
          <header>
            <div>
              <span>TU SELECCIÓN</span>
              <h1>Carrito</h1>
            </div>
            <p>{productCountLabel(count)}</p>
          </header>
          {error && (
            <div className="cart-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => void restore()}>
                Reintentar
              </button>
            </div>
          )}
          {cart.items.map((item) => {
            const limits = item.quantity_limits ?? {
                minimum: 1,
                maximum: 99,
                multiple_of: 1,
              },
              busy = updating === item.key;
            return (
              <article
                className={`cart-item${busy ? " is-updating" : ""}`}
                key={item.key}
              >
                <Link
                  className="cart-image"
                  href={`/producto/${item.id}${query}`}
                >
                  <img
                    src={item.images?.[0]?.src || "/brand/nexo-symbol.png"}
                    alt=""
                    width="112"
                    height="112"
                  />
                </Link>
                <div className="cart-product">
                  <Link href={`/producto/${item.id}${query}`}>{item.name}</Link>
                  <span className="unit-price">
                    Precio unitario:{" "}
                    {formatMoney(item.prices.price, item.prices)}
                  </span>
                  <div className="product-actions">
                    <div
                      className="quantity-control"
                      aria-label={`Cantidad de ${item.name}`}
                    >
                      <button
                        type="button"
                        aria-label={`Reducir cantidad de ${item.name}`}
                        disabled={busy || item.quantity <= limits.minimum}
                        onClick={() =>
                          void updateQuantity(
                            item,
                            item.quantity - limits.multiple_of,
                          )
                        }
                      >
                        −
                      </button>
                      <output aria-label={`Cantidad: ${item.quantity}`}>
                        {item.quantity}
                      </output>
                      <button
                        type="button"
                        aria-label={`Aumentar cantidad de ${item.name}`}
                        disabled={busy || item.quantity >= limits.maximum}
                        onClick={() =>
                          void updateQuantity(
                            item,
                            item.quantity + limits.multiple_of,
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="remove-item"
                      type="button"
                      aria-label={`Eliminar ${item.name} del carrito`}
                      disabled={busy}
                      onClick={() => void removeItem(item)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="line-total">
                  <span>Total</span>
                  <strong>
                    {formatMoney(item.totals.line_total, item.totals)}
                  </strong>
                </div>
              </article>
            );
          })}
        </section>
        <aside className="cart-summary">
          <span>RESUMEN</span>
          <div className="summary-row">
            <p>Productos</p>
            <strong>{formatMoney(cart.totals.total_items, cart.totals)}</strong>
          </div>
          <div className="summary-row">
            <p>Mensajería</p>
            <span>Se calcula al indicar la dirección</span>
          </div>
          <div className="cart-total">
            <p>Total provisional</p>
            <strong>{formatMoney(cart.totals.total_price, cart.totals)}</strong>
          </div>
          <p className="delivery-note">
            El costo de entrega se mostrará al indicar cómo quieres recibir tu
            pedido.
          </p>
          <button
            type="button"
            disabled={phase === "updating" || Boolean(updating)}
            onClick={() => {
              setPhase("validating");
              router.push(`/checkout${query}`);
            }}
          >
            {phase === "validating"
              ? "Comprobando carrito…"
              : "Continuar al checkout"}
          </button>
        </aside>
      </div>
      {removed && (
        <div className="cart-toast" role="status">
          <span>Producto eliminado del carrito.</span>
          <button onClick={() => void undoRemove()}>Deshacer</button>
        </div>
      )}
    </>
  );
}
