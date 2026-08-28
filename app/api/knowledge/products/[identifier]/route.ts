import { NextResponse } from "next/server";
import { buildProductKnowledgeContext } from "../../../../../lib/commerce/knowledge";
import { projectPublicKnowledge, publicKnowledgeAudience } from "../../../../../lib/commerce/knowledge-public";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request, { params }: { params: Promise<{ identifier: string }> }) {
  try {
    const { identifier } = await params;
    const url = new URL(request.url);
    const includeCommerce = url.searchParams.get("commerce") === "1";
    const result = await buildProductKnowledgeContext(decodeURIComponent(identifier), {
      audience: publicKnowledgeAudience(),
      includeCommerce,
    });
    if (!result) return NextResponse.json({ error: "Producto no encontrado en NEXO Knowledge." }, { status: 404 });
    if ("ambiguous" in result) return NextResponse.json(result, { status: 409 });
    return NextResponse.json(projectPublicKnowledge(result), {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo consultar el conocimiento del producto." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
