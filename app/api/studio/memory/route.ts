import { NextResponse } from "next/server";
import { appendMemoryEntry } from "../../../../lib/studio/db";
import type { ProjectMemoryEntry } from "../../../../lib/studio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { projectId?: string; entry?: Partial<ProjectMemoryEntry> };
    if (!body.projectId || !body.entry?.text || !body.entry.kind) {
      return NextResponse.json({ error: "Missing projectId, kind or text" }, { status: 400 });
    }
    const entry: ProjectMemoryEntry = {
      id: body.entry.id ?? `memory-${Date.now()}`,
      kind: body.entry.kind,
      text: body.entry.text.trim(),
      createdAt: body.entry.createdAt ?? new Date().toISOString(),
      sourceRunId: body.entry.sourceRunId,
    };
    const project = await appendMemoryEntry(body.projectId, entry);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ entry, project }, { status: 201 });
  } catch (error) {
    console.error("studio.memory.create failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not persist memory" }, { status: 503 });
  }
}
