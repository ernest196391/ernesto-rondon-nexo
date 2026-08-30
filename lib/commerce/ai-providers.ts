export type AICapability = "fast_chat" | "complex_reasoning" | "tool_calling" | "vision" | "transcription" | "copywriting" | "image_generation";
export type ProviderHealth = { provider: "gemini" | "openai"; configured: boolean; model?: string };
export type ProviderRequest = { instructions: string; content: unknown[]; capability: AICapability };
export type ProviderResult = { text: string; provider: "gemini" | "openai"; model: string; latencyMs: number };
export interface AIProvider {
  name: "gemini" | "openai";
  supports(capability: AICapability): boolean;
  health(): Promise<ProviderHealth>;
  generate(request: ProviderRequest): Promise<ProviderResult>;
}

function outputText(payload: any) {
  for (const item of payload.output || []) for (const part of item.content || []) if (part.type === "output_text") return part.text;
  return "";
}

class OpenAIProvider implements AIProvider {
  name = "openai" as const;
  private model = process.env.OPENAI_MODEL || process.env.NEXO_ASSISTANT_MODEL || "gpt-5.6-terra";
  supports(capability: AICapability) { return capability !== "image_generation" || Boolean(process.env.OPENAI_IMAGE_MODEL); }
  async health() { return { provider: this.name, configured: Boolean(process.env.OPENAI_API_KEY), model: this.model }; }
  async generate(request: ProviderRequest) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_NOT_CONFIGURED");
    const started = Date.now();
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, store: false, instructions: request.instructions, input: [{ role: "user", content: request.content }] }),
      signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS || 45000)),
    });
    if (!response.ok) throw new Error(`OPENAI_${response.status}`);
    const text = outputText(await response.json());
    if (!text) throw new Error("OPENAI_EMPTY");
    return { text, provider: this.name, model: this.model, latencyMs: Date.now() - started };
  }
}

class GeminiProvider implements AIProvider {
  name = "gemini" as const;
  private model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  supports(capability: AICapability) { return !["transcription", "image_generation"].includes(capability); }
  async health() { return { provider: this.name, configured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY), model: this.model }; }
  async generate(request: ProviderRequest) {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) throw new Error("GEMINI_NOT_CONFIGURED");
    if (request.content.some((part: any) => part.type !== "input_text")) throw new Error("GEMINI_UNSUPPORTED_ATTACHMENT");
    const started = Date.now();
    const text = request.content.map((part: any) => part.text || "").join("\n");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: request.instructions }] }, contents: [{ role: "user", parts: [{ text }] }] }),
      signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS || 45000)),
    });
    if (!response.ok) throw new Error(`GEMINI_${response.status}`);
    const payload = await response.json();
    const answer = payload.candidates?.[0]?.content?.parts?.map((part: any) => part.text || "").join("") || "";
    if (!answer) throw new Error("GEMINI_EMPTY");
    return { text: answer, provider: this.name, model: this.model, latencyMs: Date.now() - started };
  }
}

export class AIProviderRouter {
  private providers = { openai: new OpenAIProvider(), gemini: new GeminiProvider() };
  async health() { return Promise.all(Object.values(this.providers).map((provider) => provider.health())); }
  async generate(request: ProviderRequest) {
    const fastProvider = process.env.AI_FAST_PROVIDER === "openai" ? "openai" : "gemini";
    const preferred = request.capability === "fast_chat" ? fastProvider : "openai";
    const primary = this.providers[preferred], fallback = this.providers[preferred === "openai" ? "gemini" : "openai"];
    try { return await primary.generate(request); }
    catch (error) {
      const message = error instanceof Error ? error.message : "";
      const recoverable = /NOT_CONFIGURED|TIMEOUT|_429|_5\d\d|UNSUPPORTED_ATTACHMENT/.test(message);
      if (!recoverable || !fallback.supports(request.capability)) throw error;
      return fallback.generate(request);
    }
  }
}
