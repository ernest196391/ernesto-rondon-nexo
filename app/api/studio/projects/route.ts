import { NextResponse } from "next/server";
import { listProjects, saveProject } from "@/lib/studio/db";
import type { Project } from "@/lib/studio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ projects: await listProjects() });
  } catch (error) {
    console.error("studio.projects.list failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Studio persistence unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<Project>;
    if (!body.id || !body.name || !body.businessType || !body.objective || !body.status) {
      return NextResponse.json({ error: "Missing required project fields" }, { status: 400 });
    }
    const project = await saveProject({
      ...body,
      id: body.id,
      name: body.name,
      businessType: body.businessType,
      objective: body.objective,
      status: body.status,
      createdAt: body.createdAt ?? new Date().toISOString(),
      updatedAt: body.updatedAt ?? new Date().toISOString(),
      sources: body.sources ?? [],
      runs: body.runs ?? [],
    } as Project);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("studio.projects.save failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not persist project" }, { status: 503 });
  }
}
