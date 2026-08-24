export type ProjectStatus = "draft" | "active" | "paused" | "completed";

export type RunStatus =
  | "preparing"
  | "acquiring"
  | "analyzing"
  | "awaiting_review"
  | "executing"
  | "completed"
  | "needs_attention"
  | "failed";

export type SourceType = "url" | "file" | "note" | "connector";

export interface ProjectSource {
  id: string;
  type: SourceType;
  label: string;
  value: string;
}

export interface Artifact {
  id: string;
  runId: string;
  kind: "report" | "prototype" | "proposal" | "media" | "code" | "export";
  title: string;
  createdAt: string;
  href?: string;
}

export interface Run {
  id: string;
  projectId: string;
  specialistId: string;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  artifacts: Artifact[];
}

export interface Project {
  id: string;
  name: string;
  businessType: string;
  objective: string;
  context?: string;
  specialistId?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  sources: ProjectSource[];
  runs: Run[];
}

export interface Specialist {
  id: string;
  name: string;
  shortName: string;
  description: string;
  inputHint: string;
  status: "ready" | "planned";
  accent: string;
}
