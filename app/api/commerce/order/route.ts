import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CONFIRMATION_COOKIE } from "../../../../lib/commerce/store-api";
import { getWooOrder } from "../../../../lib/commerce/woocommerce";

export const dynamic = "force-dynamic";
export async function GET() {
  const jar = await cookies(); const value = jar.get(CONFIRMATION_COOKIE)?.value || "";
  const separator = value.indexOf(":"); const orderId = Number(value.slice(0, separator));
  let orderKey = "";
  try { orderKey = decodeURIComponent(value.slice(separator + 1)); } catch { orderKey = ""; }
  if (!Number.isInteger(orderId) || orderId <= 0 || !orderKey) return NextResponse.json({ error: "Confirmación no disponible." }, { status: 404 });
  try {
    const order = await getWooOrder(orderId);
    if (order.order_key !== orderKey) return NextResponse.json({ error: "Confirmación no disponible." }, { status: 404 });
    const meta = Object.fromEntries((order.meta_data || []).map((entry: { key: string; value: unknown }) => [entry.key, entry.value]));
    return NextResponse.json({ order: {
      id: order.id, number: order.number, status: order.status, currency: order.currency, total: order.total,
      paymentMethod: order.payment_method, items: order.line_items?.map((item: Record<string, unknown>) => ({ id: item.product_id, name: item.name, quantity: item.quantity, total: item.total })),
      delivery: { mode: meta._cvd_fulfillment_type || "delivery", municipality: order.billing?.city || "", locality: meta._cvd_locality || "", address: order.billing?.address_1 || "", pickupAddress: meta._nexo_pickup_address_snapshot || "", shippingFeeCup: Number(meta._cvd_shipping_fee_cup || 0), shippingStatus: meta._cvd_shipping_rate_status || "pending" },
      customer: { name: `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim(), phone: order.billing?.phone || "" },
    } }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch { return NextResponse.json({ error: "No pudimos recuperar la confirmación." }, { status: 502 }); }
}
