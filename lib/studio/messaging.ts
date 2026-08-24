export type OutboundMessage = { to: string; text: string };
export type MessageReceipt = { provider: string; messageId: string };

export interface MessagingProvider {
  id: string;
  isConfigured(): boolean;
  sendText(message: OutboundMessage): Promise<MessageReceipt>;
}

export class MetaWhatsAppProvider implements MessagingProvider {
  id = "meta-whatsapp";
  isConfigured() {
    return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  }
  async sendText(message: OutboundMessage): Promise<MessageReceipt> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneId) throw new Error("Meta WhatsApp provider is not configured");
    const to = message.to.replace(/[^0-9]/g, "");
    if (to.length < 8 || to.length > 15) throw new Error("Invalid destination number");
    const text = message.text.trim();
    if (!text || text.length > 4096) throw new Error("Invalid message text");
    const response = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(phoneId)}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body: text } }),
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await response.json().catch(() => ({})) as { messages?: Array<{ id?: string }>; error?: { message?: string } };
    if (!response.ok || !payload.messages?.[0]?.id) throw new Error(payload.error?.message || "Meta rejected the message");
    return { provider: this.id, messageId: payload.messages[0].id };
  }
}

export function getMessagingProvider(): MessagingProvider {
  return new MetaWhatsAppProvider();
}
