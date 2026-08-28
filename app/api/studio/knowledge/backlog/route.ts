import { NextResponse } from "next/server";
import {
  listAssistantKnowledgeBacklog,
  updateAssistantKnowledgeBacklogResolution,
} from "../../../../../lib/commerce/assistant-learning";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStore<T>(body: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return NextResponse.json(body, { ...init, headers });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const productId = (url.searchParams.get("productId") ?? "").trim().slice(0, 160);
    const requestedLimit = Number(url.searchParams.get("limit") ?? "50");
    if (!productId) return noStore({ error: "productId es obligatorio" }, { status: 400 });

    const items = await listAssistantKnowledgeBacklog(
      productId,
      Number.isFinite(requestedLimit) ? requestedLimit : 50,
    );
    return noStore({ status: "ok", audience: "admin", productId, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo consultar el backlog";
    return noStore({ error: message }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    const item = await updateAssistantKnowledgeBacklogResolution(payload);
    if (!item) return noStore({ error: "Pregunta de backlog no encontrada" }, { status: 404 });

    return noStore({
      status: "ok",
      audience: "admin",
      item,
      knowledgeUpdated: false,
      message: item.resolved
        ? "La duda quedó cerrada en el backlog. La Knowledge Base no se modifica automáticamente."
        : "La duda volvió a quedar pendiente. La Knowledge Base no se modifica automáticamente.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el backlog";
    const status = /obligatorio|booleano|URL válida|http o https|Payload inválido/i.test(message) ? 400 : 503;
    return noStore({ error: message }, { status });
  }
}
