type OrderLine = { quantity: number; name: string; subtotal: string };
type Pickup = { name: string; address: string; instructions?: string };
export type OrderWhatsappInput = {
  orderNumber: string;
  lines: OrderLine[];
  productsTotal: string;
  mode: "delivery" | "pickup";
  municipality?: string;
  locality?: string;
  address?: string;
  reference?: string;
  deliveryWindow?: string;
  latitude?: string;
  longitude?: string;
  shipping: string;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  notes?: string;
  pickup: Pickup;
};

function section(title: string, lines: Array<string | undefined>) {
  const present = lines.filter((line): line is string => Boolean(line));
  return present.length ? [`*${title}*`, ...present] : [];
}

export function buildOrderWhatsappMessage(input: OrderWhatsappInput) {
  const products = input.lines.map(
      (line) => `• ${line.quantity} × ${line.name} — ${line.subtotal}`,
    ),
    map =
      input.latitude && input.longitude
        ? `https://www.google.com/maps/search/?api=1&query=${input.latitude},${input.longitude}`
        : undefined,
    fulfillment =
      input.mode === "delivery"
        ? section("Entrega", [
            "Modalidad: A domicilio",
            input.municipality && `Municipio: ${input.municipality}`,
            input.locality && `Localidad: ${input.locality}`,
            input.address && `Dirección: ${input.address}`,
            input.reference && `Referencia: ${input.reference}`,
            input.deliveryWindow && `Horario: ${input.deliveryWindow}`,
            map && `Ubicación: ${map}`,
          ])
        : section("Recogida", [
            `Punto: ${input.pickup.name}`,
            `Dirección: ${input.pickup.address}`,
            input.pickup.instructions && `Horario e instrucciones: ${input.pickup.instructions}`,
          ]);
  return [
    `🟦 *NEXO · PEDIDO #${input.orderNumber}*`,
    "",
    ...section("Productos", products),
    "",
    ...section("Importes", [
      `Productos: ${input.productsTotal}`,
      input.mode === "pickup" ? "Recogida: Sin costo" : `Mensajería: ${input.shipping}`,
    ]),
    "",
    ...fulfillment,
    "",
    ...section("Cliente", [
      `Nombre: ${input.fullName}`,
      `Teléfono: ${input.phone}`,
      input.alternatePhone && `Alternativo: ${input.alternatePhone}`,
    ]),
    ...(input.notes ? ["", ...section("Notas", [input.notes])] : []),
    "",
    "✅ Pedido registrado en NEXO.",
    input.mode === "delivery"
      ? "🚚 Escríbenos si necesitas ayuda con la entrega."
      : "💬 Escríbenos si necesitas ayuda.",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}
