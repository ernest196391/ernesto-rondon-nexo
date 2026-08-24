import { NextResponse } from "next/server";
import { appendRun } from "../../../../lib/studio/db";
import type { Run } from "../../../../lib/studio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Run>;
    if (!body.projectId || !body.specialistId) {
      return NextResponse.json({ error: "Missing projectId or specialistId" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const run: Run = {
      id: body.id ?? `run-${Date.now()}`,
      projectId: body.projectId,
      specialistId: body.specialistId,
      status: body.status ?? "preparing",
      createdAt: body.createdAt ?? now,
      updatedAt: now,
      artifacts: body.artifacts ?? [],
    };
    const project = await appendRun(body.projectId, run);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ run, project }, { status: 201 });
  } catch (error) {
    console.error("studio.runs.create failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not persist run" }, { status: 503 });
  }
}
