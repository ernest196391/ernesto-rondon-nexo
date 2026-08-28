import { NextResponse } from "next/server";
import { listProductKnowledge } from "../../../../lib/commerce/knowledge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const products = await listProductKnowledge(Number.isFinite(limit) ? limit : 50);
    return NextResponse.json(
      { products, source: "nexo-postgres-knowledge" },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo consultar la base de conocimiento." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
