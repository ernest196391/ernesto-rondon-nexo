import { NextResponse } from "next/server";
import { listAssistantKnowledgeBacklog } from "../../../../../lib/commerce/assistant-learning";

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
