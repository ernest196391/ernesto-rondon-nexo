import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("capacidades del navegador y servidor", () => {
  it("permite micrófono y ubicación solo al propio origen", () => {
    const config = readFileSync("next.config.mjs", "utf8");
    expect(config).toContain("microphone=(self)");
    expect(config).toContain("geolocation=(self)");
    expect(config).toContain("camera=(self)");
    expect(config).not.toContain("microphone=()");
    expect(config).not.toContain("geolocation=()");
  });

  it("graba, permite cancelar y deja la transcripción editable", () => {
    const component = readFileSync("app/GlobalCommerceAssistant.tsx", "utf8");
    expect(component).toContain("getUserMedia({ audio: true })");
    expect(component).toContain("MediaRecorder.isTypeSupported");
    expect(component).toContain("cancelRecording");
    expect(component).toContain("Transcribiendo…");
    expect(component).toContain("setQuestion(data.transcript");
    expect(component).toMatch(
      /recording\s*\?\s*"Detener grabación"\s*:\s*"Grabar mensaje de voz"/,
    );
  });

  it("persiste precisión, fecha y URL de Maps en el pedido", () => {
    const client = readFileSync("app/checkout/CheckoutClient.tsx", "utf8");
    const server = readFileSync("app/api/commerce/checkout/route.ts", "utf8");
    expect(client).toContain("enableHighAccuracy: true");
    expect(client).toContain("timeout: 15000");
    expect(client).toContain("locationTimestamp");
    expect(server).toContain("_nexo_delivery_location_timestamp");
    expect(server).toContain("_nexo_delivery_maps_url");
  });

  it("no expone errores crudos del proveedor de IA", () => {
    const route = readFileSync("app/api/assistant/chat/route.ts", "utf8");
    expect(route).toContain("NEXO_ASSISTANT_COMPLETED");
    expect(route).toContain("No pude responder en este momento");
    expect(route).not.toContain("error instanceof Error ? error.message :");
    expect(route).toContain("No encontré ese producto en NEXO");
    expect(route).toContain("missingProduct");
  });
});
