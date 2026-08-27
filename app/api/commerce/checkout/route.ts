import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { CART_COOKIE, CONFIRMATION_COOKIE, REFERRAL_COOKIE, requestStoreCart, requestStoreCheckout, StoreApiError } from "../../../../lib/commerce/store-api";
import { updateWooOrder } from "../../../../lib/commerce/woocommerce";

export const dynamic = "force-dynamic";

type CheckoutInput = {
  idempotencyKey: string;
  firstName: string;
  lastName: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  address: string;
  municipality: string;
  province: string;
  postcode: string;
  reference?: string;
  notes?: string;
  deliveryWindow?: string;
  paymentMethod: string;
};

type CompletedCheckout = { orderId: number; orderNumber: string; orderKey: string; status: string; paymentMethod: string };
const pending = new Map<string, Promise<CompletedCheckout>>();
const completed = new Map<string, { expires: number; result: CompletedCheckout }>();
const attempts = new Map<string, number[]>();

function clean(value: unknown, max = 180) {
  return typeof value === "string" ? value.replace(/[<>\u0000-\u001f]/g, " ").trim().slice(0, max) : "";
}
function safeReferral(value: string) { return /^[a-zA-Z0-9_-]{1,64}$/.test(value) ? value : ""; }
function validPhone(value: string) { return /^\+?[0-9][0-9\s()-]{6,19}$/.test(value); }
function validate(raw: unknown): CheckoutInput {
  if (!raw || typeof raw !== "object") throw new StoreApiError("Datos del pedido no válidos.", 400);
  const value = raw as Record<string, unknown>;
  const input: CheckoutInput = {
    idempotencyKey: clean(value.idempotencyKey, 80), firstName: clean(value.firstName, 80), lastName: clean(value.lastName, 80),
    phone: clean(value.phone, 24), alternatePhone: clean(value.alternatePhone, 24), email: clean(value.email, 120).toLowerCase(),
    address: clean(value.address, 180), municipality: clean(value.municipality, 90), province: clean(value.province, 90),
    postcode: clean(value.postcode, 16), reference: clean(value.reference, 180),
    notes: clean(value.notes, 500), deliveryWindow: clean(value.deliveryWindow, 80), paymentMethod: clean(value.paymentMethod, 60),
  };
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(input.idempotencyKey)) throw new StoreApiError("No se pudo identificar este intento. Recarga e inténtalo otra vez.", 400);
  if (input.firstName.length < 2 || input.lastName.length < 2) throw new StoreApiError("Escribe tu nombre y apellidos.", 400);
  if (!validPhone(input.phone) || (input.alternatePhone && !validPhone(input.alternatePhone))) throw new StoreApiError("Revisa el número de teléfono.", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new StoreApiError("Escribe un correo válido para recibir la confirmación.", 400);
  if (input.address.length < 8 || input.municipality.length < 2 || input.province.length < 2) throw new StoreApiError("Completa la dirección, el municipio y la provincia.", 400);
  if (!/^[a-zA-Z0-9 -]{3,12}$/.test(input.postcode)) throw new StoreApiError("Escribe un código postal válido.", 400);
  if (!input.paymentMethod) throw new StoreApiError("Selecciona cómo coordinarás el pago.", 400);
  return input;
}
async function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const h = await headers();
  const expected = h.get("x-forwarded-host") || h.get("host");
  if (!expected || new URL(origin).host !== expected) throw new StoreApiError("Solicitud no autorizada.", 403);
}
function rateLimit(token: string) {
  const now = Date.now(); const key = createHash("sha256").update(token).digest("hex");
  const recent = (attempts.get(key) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 6) throw new StoreApiError("Espera un momento antes de intentarlo otra vez.", 429);
  recent.push(now); attempts.set(key, recent);
}
function orderNotes(input: CheckoutInput) {
  return [input.alternatePhone && `Teléfono alternativo: ${input.alternatePhone}`, `Municipio/zona: ${input.municipality}`, input.reference && `Referencia: ${input.reference}`, input.deliveryWindow && `Franja preferida: ${input.deliveryWindow}`, input.notes && `Notas: ${input.notes}`].filter(Boolean).join("\n");
}

async function placeOrder(input: CheckoutInput, token: string, referral: string): Promise<CompletedCheckout> {
  const current = await requestStoreCart("/cart", { token, referral });
  const cart = current.cart as { items?: unknown[]; errors?: Array<{ message?: string }>; payment_methods?: string[] };
  if (!cart.items?.length) throw new StoreApiError("Tu carrito está vacío.", 409);
  if (cart.errors?.length) throw new StoreApiError(cart.errors[0]?.message || "El carrito necesita revisión.", 409);
  if (!cart.payment_methods?.includes(input.paymentMethod)) throw new StoreApiError("El método de pago ya no está disponible.", 409);

  const address = {
    first_name: input.firstName, last_name: input.lastName, company: "", address_1: input.address,
    address_2: input.reference || "", city: input.municipality, state: input.province, postcode: input.postcode, country: "CU", phone: input.phone,
  };
  const result = await requestStoreCheckout({
    token, method: "POST", referral,
    body: {
      billing_address: { ...address, email: input.email }, shipping_address: address,
      customer_note: orderNotes(input), payment_method: input.paymentMethod, payment_data: [],
    },
  });
  const checkout = result.cart as Record<string, unknown>;
  const orderId = Number(checkout.order_id);
  const orderKey = clean(checkout.order_key, 120);
  if (!Number.isInteger(orderId) || orderId <= 0 || !orderKey) throw new StoreApiError("WooCommerce no confirmó la creación del pedido.", 502);
  try {
    await updateWooOrder(orderId, { meta_data: [
      { key: "_nexo_marketplace_order", value: "yes" }, { key: "_nexo_checkout_idempotency_key", value: input.idempotencyKey },
      { key: "_nexo_referral_requested", value: referral || "organic" }, { key: "_nexo_alternate_phone", value: input.alternatePhone || "" },
      { key: "_nexo_delivery_zone", value: input.municipality }, { key: "_nexo_delivery_window", value: input.deliveryWindow || "" },
    ] });
  } catch { /* El pedido ya existe; la anotación se puede reconciliar sin duplicarlo. */ }
  return { orderId, orderNumber: String(checkout.order_number || orderId), orderKey, status: clean(checkout.status, 40), paymentMethod: input.paymentMethod };
}

export async function GET() {
  try {
    const jar = await cookies(); const token = jar.get(CART_COOKIE)?.value;
    if (!token) throw new StoreApiError("No encontramos una sesión de carrito activa.", 409);
    const referral = safeReferral(jar.get(REFERRAL_COOKIE)?.value || "");
    const result = await requestStoreCart("/cart", { token, referral });
    return NextResponse.json({ cart: result.cart, referral }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    await sameOrigin(request);
    const jar = await cookies(); const token = jar.get(CART_COOKIE)?.value;
    if (!token) throw new StoreApiError("Tu sesión expiró. Regresa al carrito e inténtalo nuevamente.", 409);
    rateLimit(token);
    const input = validate(await request.json());
    const referral = safeReferral(jar.get(REFERRAL_COOKIE)?.value || "");
    const key = createHash("sha256").update(`${token}:${input.idempotencyKey}`).digest("hex");
    const cached = completed.get(key);
    if (cached && cached.expires > Date.now()) return success(cached.result);
    let task = pending.get(key);
    if (!task) { task = placeOrder(input, token, referral); pending.set(key, task); }
    try {
      const result = await task;
      completed.set(key, { expires: Date.now() + 30 * 60_000, result });
      return success(result);
    } finally { pending.delete(key); }
  } catch (error) { return failure(error); }
}

function success(result: CompletedCheckout) {
  const response = NextResponse.json({ order: { id: result.orderId, number: result.orderNumber, status: result.status, paymentMethod: result.paymentMethod }, confirmationUrl: "/pedido/confirmacion" }, { headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set(CONFIRMATION_COOKIE, `${result.orderId}:${encodeURIComponent(result.orderKey)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
  return response;
}
function failure(error: unknown) {
  const status = error instanceof StoreApiError && error.status >= 400 && error.status < 500 ? error.status : 502;
  const message = error instanceof Error ? error.message : "No pudimos crear el pedido. Inténtalo otra vez.";
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
