export type TraceArtifactKind = "report" | "prototype" | "proposal" | "media" | "code" | "export";

type TraceOptions = {
  projectId?: string | null;
  specialistId: string;
  title: string;
  kind: TraceArtifactKind;
  href?: string;
  memory?: string;
};

export function projectIdFromLocation() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("projectId");
}

export async function traceCompletedExecution(options: TraceOptions) {
  if (!options.projectId) return null;
  const runResponse = await fetch("/api/studio/runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId: options.projectId, specialistId: options.specialistId, status: "completed" }),
  });
  if (!runResponse.ok) return null;
  const runData = await runResponse.json() as { run?: { id?: string } };
  const runId = runData.run?.id;
  if (!runId) return null;
  await fetch("/api/studio/artifacts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId: options.projectId, artifact: { runId, kind: options.kind, title: options.title, href: options.href } }),
  });
  if (options.memory) {
    await fetch("/api/studio/memory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId: options.projectId, entry: { kind: "fact", text: options.memory, sourceRunId: runId } }),
    });
  }
  return runId;
}
