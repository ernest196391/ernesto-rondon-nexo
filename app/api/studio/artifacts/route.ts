import { NextResponse } from "next/server";
import { appendArtifact } from "../../../../lib/studio/db";
import type { Artifact } from "../../../../lib/studio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedKinds = new Set(["report", "prototype", "proposal", "media", "code", "export"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { projectId?: string; artifact?: Partial<Artifact> };
    if (!body.projectId || !body.artifact?.runId || !body.artifact.title || !body.artifact.kind || !allowedKinds.has(body.artifact.kind)) {
      return NextResponse.json({ error: "Missing or invalid artifact fields" }, { status: 400 });
    }
    const artifact: Artifact = {
      id: body.artifact.id ?? `artifact-${Date.now()}`,
      runId: body.artifact.runId,
      kind: body.artifact.kind,
      title: body.artifact.title.trim(),
      createdAt: body.artifact.createdAt ?? new Date().toISOString(),
      href: body.artifact.href,
    };
    const project = await appendArtifact(body.projectId, artifact);
    if (!project) return NextResponse.json({ error: "Project or run not found" }, { status: 404 });
    return NextResponse.json({ artifact, project }, { status: 201 });
  } catch (error) {
    console.error("studio.artifacts.create failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not persist artifact" }, { status: 503 });
  }
}
