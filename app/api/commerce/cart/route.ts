import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CART_COOKIE, REFERRAL_COOKIE, requestStoreCart, StoreApiError } from "../../../../lib/commerce/store-api";

export const dynamic = "force-dynamic";
type CartAction = { action: "add"; productId: number; quantity?: number; referral?: string } | { action: "update"; key: string; quantity: number } | { action: "remove"; key: string };

function safeReferral(value: unknown) { return typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value) ? value : ""; }
function setSessionCookies(response: NextResponse, token?: string, referral?: string) {
  if (token) response.cookies.set(CART_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 48 });
  if (referral) response.cookies.set(REFERRAL_COOKIE, referral, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

async function execute(action?: CartAction) {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  let path = "/cart", method = "GET", body: unknown, referral = "";
  if (action?.action === "add") {
    if (!Number.isInteger(action.productId) || action.productId <= 0) throw new StoreApiError("Producto no válido.", 400);
    const quantity = action.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new StoreApiError("Cantidad no válida.", 400);
    path = "/cart/add-item"; method = "POST"; body = { id: action.productId, quantity }; referral = safeReferral(action.referral);
  } else if (action?.action === "update") {
    if (!action.key || !Number.isInteger(action.quantity) || action.quantity < 1 || action.quantity > 99) throw new StoreApiError("Cantidad no válida.", 400);
    path = "/cart/update-item"; method = "POST"; body = { key: action.key, quantity: action.quantity };
  } else if (action?.action === "remove") {
    if (!action.key) throw new StoreApiError("Producto no válido.", 400);
    path = "/cart/remove-item"; method = "POST"; body = { key: action.key };
  }
  const result = await requestStoreCart(path, { method, token, body });
  const response = NextResponse.json({ cart: result.cart, referral: referral || jar.get(REFERRAL_COOKIE)?.value || "" });
  setSessionCookies(response, result.token, referral);
  return response;
}
export async function GET() { try { return await execute(); } catch (error) { return failure(error); } }
export async function POST(request: Request) { try { return await execute(await request.json() as CartAction); } catch (error) { return failure(error); } }
function failure(error: unknown) {
  const status = error instanceof StoreApiError && error.status >= 400 && error.status < 500 ? error.status : 502;
  return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo conectar con WooCommerce." }, { status, headers: { "Cache-Control": "no-store" } });
}
