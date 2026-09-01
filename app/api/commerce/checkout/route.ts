import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  CART_COOKIE,
  CONFIRMATION_COOKIE,
  REFERRAL_COOKIE,
  requestStoreCart,
  requestStoreCheckout,
  StoreApiError,
} from "../../../../lib/commerce/store-api";
import {
  deliveryCatalog,
  quoteShipping,
  validLocality,
  validMunicipality,
} from "../../../../lib/commerce/delivery";
import { getWooOrder, updateWooOrder } from "../../../../lib/commerce/woocommerce";
import { buildOrderWhatsappMessage } from "../../../../lib/commerce/order-whatsapp";
import { projectCommercialCart } from "../../../../lib/commercial/storefront";
import { createOrderSnapshot, existingOrderForIdempotency, recordReconciliationFailure, resolveAttribution } from "../../../../lib/commercial/db";
export const dynamic = "force-dynamic";
type Input = {
  idempotencyKey: string;
  fullName: string;
  phone: string;
  alternatePhone: string;
  email: string;
  postcode: string;
  mode: "delivery" | "pickup";
  municipality: string;
  locality: string;
  manualLocality: boolean;
  address: string;
  reference: string;
  notes: string;
  deliveryWindow: string;
  latitude: string;
  longitude: string;
  locationAccuracy: string;
  locationTimestamp: string;
};
type Done = {
  orderId: number;
  orderNumber: string;
  orderKey: string;
  status: string;
  whatsappUrl: string;
};
const pending = new Map<string, Promise<Done>>(),
  completed = new Map<string, { expires: number; result: Done }>(),
  attempts = new Map<string, number[]>();
const clean = (v: unknown, n = 180) =>
  typeof v === "string"
    ? v
        .replace(/[<>\u0000-\u001f]/g, " ")
        .trim()
        .slice(0, n)
    : "";
const safeRef = (v: string) => (/^[\w-]{1,64}$/.test(v) ? v : "");
const phone = (v: string) => /^\+?[0-9][0-9\s()-]{6,19}$/.test(v);
function validate(raw: unknown): Input {
  if (!raw || typeof raw !== "object")
    throw new StoreApiError("Datos del pedido no válidos.", 400);
  const v = raw as Record<string, unknown>,
    mode = clean(v.mode, 20) as Input["mode"],
    input: Input = {
      idempotencyKey: clean(v.idempotencyKey, 80),
      fullName: clean(v.fullName, 120),
      phone: clean(v.phone, 24),
      alternatePhone: clean(v.alternatePhone, 24),
      email: clean(v.email, 120).toLowerCase(),
      postcode: clean(v.postcode, 16),
      mode,
      municipality: clean(v.municipality, 90),
      locality: clean(v.locality, 120),
      manualLocality: Boolean(v.manualLocality),
      address: clean(v.address, 180),
      reference: clean(v.reference, 180),
      notes: clean(v.notes, 500),
      deliveryWindow: clean(v.deliveryWindow, 30),
      latitude: clean(v.latitude, 24),
      longitude: clean(v.longitude, 24),
      locationAccuracy: clean(v.locationAccuracy, 16),
      locationTimestamp: clean(v.locationTimestamp, 40),
    };
  if (!/^[\w-]{16,80}$/.test(input.idempotencyKey))
    throw new StoreApiError("Recarga el checkout e inténtalo nuevamente.", 400);
  if (input.fullName.length < 4)
    throw new StoreApiError("Escribe tu nombre y apellidos.", 400);
  if (
    !phone(input.phone) ||
    (input.alternatePhone && !phone(input.alternatePhone))
  )
    throw new StoreApiError("Revisa el número de teléfono.", 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    throw new StoreApiError(
      "Escribe un correo válido para registrar el pedido.",
      400,
    );
  if (!/^[a-zA-Z0-9 -]{3,12}$/.test(input.postcode))
    throw new StoreApiError("Escribe un código postal válido.", 400);
  if (!["delivery", "pickup"].includes(mode))
    throw new StoreApiError("Selecciona entrega o recogida.", 400);
  if (mode === "delivery") {
    if (!validMunicipality(input.municipality))
      throw new StoreApiError("Selecciona un municipio válido.", 400);
    if (
      !input.locality ||
      (!input.manualLocality &&
        !validLocality(input.municipality, input.locality))
    )
      throw new StoreApiError(
        "Selecciona una localidad válida o indica que no aparece.",
        400,
      );
    if (input.address.length < 8)
      throw new StoreApiError("Completa la dirección de entrega.", 400);
    if (
      (input.latitude || input.longitude) &&
      (!Number.isFinite(Number(input.latitude)) ||
        !Number.isFinite(Number(input.longitude)))
    )
      throw new StoreApiError("La ubicación compartida no es válida.", 400);
  }
  return input;
}
async function sameOrigin(r: Request) {
  const origin = r.headers.get("origin");
  if (!origin) return;
  const h = await headers(),
    expected = h.get("x-forwarded-host") || h.get("host");
  if (!expected || new URL(origin).host !== expected)
    throw new StoreApiError("Solicitud no autorizada.", 403);
}
function limit(token: string) {
  const now = Date.now(),
    k = createHash("sha256").update(token).digest("hex"),
    recent = (attempts.get(k) || []).filter((t) => now - t < 60000);
  if (recent.length >= 6)
    throw new StoreApiError(
      "Espera un momento antes de intentarlo otra vez.",
      429,
    );
  recent.push(now);
  attempts.set(k, recent);
}
function splitName(name: string) {
  const parts = name.split(/\s+/);
  return { first: parts.shift() || name, last: parts.join(" ") || "." };
}
async function place(
  input: Input,
  token: string,
  referral: string,
): Promise<Done> {
  const existingOrderId=await existingOrderForIdempotency(input.idempotencyKey);
  if(existingOrderId){const existing=await getWooOrder(existingOrderId);return{orderId:existingOrderId,orderNumber:String(existing.number||existingOrderId),orderKey:clean(existing.order_key,120),status:clean(existing.status,40),whatsappUrl:"https://wa.me/5354056173"};}
  const attribution = await resolveAttribution({requestedRef:referral,identity:`${input.email}|${input.phone.replace(/\D/g,"")}`,sessionRef:referral,idempotencyKey:`checkout:${input.idempotencyKey}:attribution`}),
    current = await requestStoreCart("/cart", { token, referral: attribution.effectiveRef || referral }),
    projection = await projectCommercialCart(current.cart, attribution.effectiveRef),
    cart = projection.cart as any;
  if (!cart.items?.length)
    throw new StoreApiError("Tu carrito está vacío.", 409);
  if (cart.errors?.length)
    throw new StoreApiError(
      cart.errors[0]?.message || "El carrito necesita revisión.",
      409,
    );
  const method = cart.payment_methods?.includes("cvd_whatsapp")
    ? "cvd_whatsapp"
    : cart.payment_methods?.[0];
  if (!method)
    throw new StoreApiError(
      "No hay un método de coordinación disponible.",
      409,
    );
  const quote =
      input.mode === "pickup"
        ? {
            status: "pickup" as const,
            feeCup: 0,
            label: "Recogida en tienda",
            version: deliveryCatalog().rateVersion,
            ruleId: "pickup",
            amount: 0,
            currency: "CUP" as const,
            source: "pickup" as const,
          }
        : quoteShipping(
            input.municipality,
            input.locality,
            input.manualLocality,
          ),
    name = splitName(input.fullName),
    pickup = deliveryCatalog().pickup;
  const address = {
    first_name: name.first,
    last_name: name.last,
    company: "",
    address_1: input.mode === "delivery" ? input.address : pickup.address,
    address_2: input.mode === "delivery" ? input.reference : "",
    city:
      input.mode === "delivery" ? input.municipality : "Plaza de la Revolución",
    state: "LH",
    postcode: input.postcode,
    country: "CU",
    phone: input.phone,
  };
  const notes = [
    `Modalidad: ${input.mode}`,
    input.locality && `Localidad: ${input.locality}`,
    input.alternatePhone && `Teléfono alternativo: ${input.alternatePhone}`,
    input.deliveryWindow && `Horario preferido: ${input.deliveryWindow}`,
    input.notes && `Notas: ${input.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
  const result = await requestStoreCheckout({
      token,
      method: "POST",
      referral: attribution.effectiveRef || referral,
      body: {
        billing_address: { ...address, email: input.email },
        shipping_address: address,
        customer_note: notes,
        payment_method: method,
        payment_data: [],
      },
    }),
    checkout = result.cart as any,
    orderId = Number(checkout.order_id),
    orderKey = clean(checkout.order_key, 120);
  if (!Number.isInteger(orderId) || orderId <= 0 || !orderKey)
    throw new StoreApiError(
      "WooCommerce no confirmó la creación del pedido.",
      502,
    );
  const metadata = [
    { key: "_nexo_marketplace_order", value: "yes" },
    { key: "_nexo_checkout_idempotency_key", value: input.idempotencyKey },
    { key: "_nexo_referral_requested", value: referral || "organic" },
    { key: "_nexo_referral_effective", value: attribution.effectiveRef || "organic" },
    { key: "_nexo_effective_gestora_id", value: attribution.effectiveGestoraId || "" },
    { key: "_nexo_effective_gestora_name", value: attribution.effectiveGestoraName },
    { key: "_nexo_effective_gestora_slug", value: attribution.effectiveGestoraSlug },
    { key: "_nexo_order_origin", value: attribution.effectiveGestoraId ? "gestora_store" : "nexo_store" },
    { key: "_nexo_attribution_source", value: attribution.source },
    { key: "_nexo_ledger_owner", value: "nexo" },
    { key: "_cvd_fulfillment_type", value: input.mode },
    { key: "_cvd_province_name", value: "La Habana" },
    { key: "_cvd_locality", value: input.locality },
    { key: "_cvd_reference", value: input.reference },
    { key: "_cvd_alternate_phone", value: input.alternatePhone },
    { key: "_cvd_delivery_window", value: input.deliveryWindow.toLowerCase() },
    {
      key: "_nexo_delivery_latitude",
      value: input.mode === "delivery" ? input.latitude : "",
    },
    {
      key: "_nexo_delivery_longitude",
      value: input.mode === "delivery" ? input.longitude : "",
    },
    {
      key: "_nexo_delivery_location_accuracy_m",
      value: input.mode === "delivery" ? input.locationAccuracy : "",
    },
    {
      key: "_nexo_delivery_location_timestamp",
      value: input.mode === "delivery" ? input.locationTimestamp : "",
    },
    {
      key: "_nexo_delivery_maps_url",
      value:
        input.mode === "delivery" && input.latitude && input.longitude
          ? `https://www.google.com/maps/search/?api=1&query=${input.latitude},${input.longitude}`
          : "",
    },
    { key: "_cvd_shipping_fee_cup", value: quote.feeCup },
    { key: "_cvd_shipping_rate_status", value: quote.status },
    { key: "_cvd_shipping_rate_label", value: quote.label },
    { key: "_cvd_shipping_rate_version", value: quote.version },
    { key: "_cvd_shipping_rule_id", value: quote.ruleId },
    { key: "_cvd_shipping_currency", value: quote.currency },
    { key: "_cvd_shipping_rate_source", value: quote.source },
    { key: "_nexo_shipping_quote_snapshot", value: JSON.stringify(quote) },
    {
      key: "_nexo_shipping_pending_confirmation",
      value: quote.status === "pending" ? "yes" : "no",
    },
    {
      key: "_nexo_pickup_address_snapshot",
      value: input.mode === "pickup" ? pickup.address : "",
    },
  ];
  try {
    const official = await getWooOrder(orderId), byProduct = new Map<number, any[]>();
    for (const item of official.line_items || []) { const list=byProduct.get(Number(item.product_id))||[];list.push(item);byProduct.set(Number(item.product_id),list); }
    const line_items = projection.lines.map((line) => { const officialLine=byProduct.get(line.productId)?.shift();return officialLine?{id:officialLine.id,total:(line.finalUnit*line.quantity).toFixed(2),subtotal:(line.finalUnit*line.quantity).toFixed(2)}:null; }).filter(Boolean);
    await updateWooOrder(orderId, { line_items, meta_data: metadata });
    await createOrderSnapshot({orderId,gestoraId:attribution.effectiveGestoraId,requestedRef:referral,effectiveRef:attribution.effectiveRef,currency:cart.totals?.currency_code||"USD",lines:projection.lines,baseCommission:0,shipping:quote.feeCup,idempotencyKey:input.idempotencyKey});
  } catch (error) {
    await recordReconciliationFailure(orderId,input.idempotencyKey,error).catch(()=>undefined);
  }
  const money = (amount: string | number, totals: any) =>
      `${Number(amount) / 10 ** Number(totals.currency_minor_unit || 2)} ${totals.currency_code}`,
    lines = (cart.items || []).map((x: any) => ({
      quantity: x.quantity,
      name: x.name,
      subtotal: money(x.totals.line_total, x.totals),
    })),
    shipping =
      input.mode === "pickup"
        ? "Recogida en tienda: sin costo"
        : quote.status === "zone"
          ? `${quote.feeCup.toLocaleString("es-ES")} CUP`
          : "Por confirmar",
    text = buildOrderWhatsappMessage({
      orderNumber: String(checkout.order_number || orderId),
      lines,
      productsTotal: money(cart.totals.total_items, cart.totals),
      mode: input.mode,
      municipality: input.municipality,
      locality: input.locality,
      address: input.address,
      reference: input.reference,
      deliveryWindow: input.deliveryWindow,
      latitude: input.latitude,
      longitude: input.longitude,
      shipping,
      fullName: input.fullName,
      phone: input.phone,
      alternatePhone: input.alternatePhone,
      notes: input.notes,
      attribution: attribution.effectiveGestoraId ? {
        gestoraName: attribution.effectiveGestoraName,
        referralCode: attribution.effectiveRef,
      } : undefined,
      pickup,
    });
  return {
    orderId,
    orderNumber: String(checkout.order_number || orderId),
    orderKey,
    status: clean(checkout.status, 40),
    whatsappUrl: `https://wa.me/5354056173?text=${encodeURIComponent(text)}`,
  };
}
export async function GET() {
  try {
    const jar = await cookies(),
      token = jar.get(CART_COOKIE)?.value;
    if (!token)
      throw new StoreApiError(
        "No encontramos una sesión de carrito activa.",
        409,
      );
    const referral = safeRef(jar.get(REFERRAL_COOKIE)?.value || ""),
      result = await requestStoreCart("/cart", { token, referral }),
      projection = await projectCommercialCart(result.cart, referral);
    return NextResponse.json(
      { cart: projection.cart, referral },
      { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } },
    );
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    await sameOrigin(request);
    const jar = await cookies(),
      token = jar.get(CART_COOKIE)?.value;
    if (!token)
      throw new StoreApiError("Tu sesión expiró. Regresa al carrito.", 409);
    limit(token);
    const input = validate(await request.json()),
      referral = safeRef(jar.get(REFERRAL_COOKIE)?.value || ""),
      key = createHash("sha256")
        .update(`${token}:${input.idempotencyKey}`)
        .digest("hex"),
      cached = completed.get(key);
    if (cached && cached.expires > Date.now()) return success(cached.result);
    let task = pending.get(key);
    if (!task) {
      task = place(input, token, referral);
      pending.set(key, task);
    }
    try {
      const result = await task;
      completed.set(key, { expires: Date.now() + 1800000, result });
      return success(result);
    } finally {
      pending.delete(key);
    }
  } catch (e) {
    return fail(e);
  }
}
function success(r: Done) {
  const response = NextResponse.json(
    {
      order: { id: r.orderId, number: r.orderNumber, status: r.status },
      confirmationUrl: "/pedido/confirmacion",
      whatsappUrl: r.whatsappUrl,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  response.cookies.set(
    CONFIRMATION_COOKIE,
    `${r.orderId}:${encodeURIComponent(r.orderKey)}`,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 86400,
    },
  );
  return response;
}
function fail(e: unknown) {
  const status =
    e instanceof StoreApiError && e.status >= 400 && e.status < 500
      ? e.status
      : 502;
  return NextResponse.json(
    {
      error:
        status < 500 && e instanceof Error
          ? e.message
          : "No pudimos conectar con el sistema de pedidos. Tus datos siguen guardados; inténtalo nuevamente.",
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
