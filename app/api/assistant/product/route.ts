import { NextResponse } from "next/server";
import { answerProductQuestion } from "@/lib/commerce/assistant";
import { assistantClientKey, consumeAssistantRateLimit } from "@/lib/commerce/assistant-rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate", ...(init?.headers ?? {}) },
  });
}

export async function POST(request: Request) {
  try {
    const limit = consumeAssistantRateLimit(assistantClientKey(request.headers));
    if (!limit.allowed) {
      const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
      return noStore({ error: "Demasiadas consultas. Inténtalo nuevamente en unos minutos." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
    }

    const body = await request.json() as { identifier?: unknown; question?: unknown };
    const identifier = typeof body.identifier === "string" ? body.identifier : "";
    const question = typeof body.question === "string" ? body.question : "";
    if (!identifier.trim() || !question.trim()) {
      return noStore({ error: "identifier y question son obligatorios" }, { status: 400 });
    }

    // Esta frontera es siempre pública/customer. Nunca aceptar audience desde el navegador.
    const result = await answerProductQuestion(identifier, question, "customer");
    if (result.status === "not_found") return noStore({ error: "Producto no encontrado" }, { status: 404 });
    if (result.status === "ambiguous") return noStore({ error: "Producto ambiguo", matches: result.matches }, { status: 409 });

    const identity = result.context.identity as { id?: unknown } | undefined;
    const productId = typeof identity?.id === "string" ? identity.id : null;
    return noStore({ status: "ok", audience: "customer", answer: { ...result.answer, productId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo responder la consulta";
    return noStore({ error: message }, { status: message.includes("vacía") || message.includes("identificado") ? 400 : 503 });
  }
}
