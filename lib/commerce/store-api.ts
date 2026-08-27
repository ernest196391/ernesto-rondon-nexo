const CART_COOKIE = "nexo_woo_cart";
const REFERRAL_COOKIE = "nexo_referral";

function storeUrl(path: string, referral?: string) {
  const base = process.env.WOOCOMMERCE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("WooCommerce URL is not configured");
  const url = new URL(`${base}/wp-json/wc/store/v1${path}`);
  if (referral) url.searchParams.set("ref", referral);
  return url;
}

export async function requestStoreCart(path: string, options: { method?: string; token?: string; body?: unknown; referral?: string; timeoutMs?: number } = {}) {
  const url = storeUrl(path, options.referral);
  if ((options.method ?? "GET") === "GET") url.searchParams.set("nexo_session", randomUUID());
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json", ...(options.token ? { "Cart-Token": options.token } : {}) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
  });
  const cart = await response.json().catch(() => null);
  if (!response.ok) {
    const message = cart && typeof cart === "object" && "message" in cart && typeof cart.message === "string"
      ? cart.message.replace(/<[^>]*>/g, "") : "WooCommerce no pudo actualizar el carrito.";
    throw new StoreApiError(message, response.status);
  }
  return { cart, token: response.headers.get("cart-token") ?? options.token };
}

export async function requestStoreCheckout(options: { token: string; method?: "GET" | "POST"; body?: unknown; referral?: string }) {
  return requestStoreCart("/checkout", { ...options, timeoutMs: 45_000 });
}

export class StoreApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export const CONFIRMATION_COOKIE = "nexo_order_confirmation";
export { CART_COOKIE, REFERRAL_COOKIE };
import { randomUUID } from "node:crypto";
