import { Pool } from "pg";
import type { Artifact, Project, ProjectMemoryEntry, Run } from "./types";

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  pool ??= new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000 });
  return pool;
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS nexo_studio_projects (
        id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS nexo_studio_projects_updated_idx
        ON nexo_studio_projects (updated_at DESC);
    `).then(() => undefined);
  }
  return schemaReady;
}

export async function listProjects(): Promise<Project[]> {
  await ensureSchema();
  const result = await getPool().query<{ payload: Project }>(
    "SELECT payload FROM nexo_studio_projects ORDER BY updated_at DESC LIMIT 100"
  );
  return result.rows.map((row) => row.payload);
}

export async function getProject(id: string): Promise<Project | null> {
  await ensureSchema();
  const result = await getPool().query<{ payload: Project }>(
    "SELECT payload FROM nexo_studio_projects WHERE id = $1 LIMIT 1",
    [id]
  );
  return result.rows[0]?.payload ?? null;
}

export async function saveProject(project: Project): Promise<Project> {
  await ensureSchema();
  const now = new Date().toISOString();
  const normalized: Project = {
    ...project,
    updatedAt: now,
    createdAt: project.createdAt || now,
    sources: project.sources ?? [],
    runs: project.runs ?? [],
    memory: project.memory ?? [],
  };
  await getPool().query(
    `INSERT INTO nexo_studio_projects (id, payload, created_at, updated_at)
     VALUES ($1, $2::jsonb, $3, $4)
     ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
    [normalized.id, JSON.stringify(normalized), normalized.createdAt, normalized.updatedAt]
  );
  return normalized;
}

export async function appendRun(projectId: string, run: Run): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  return saveProject({ ...project, status: "active", runs: [...(project.runs ?? []), run] });
}

export async function appendMemoryEntry(projectId: string, entry: ProjectMemoryEntry): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  return saveProject({ ...project, memory: [...(project.memory ?? []), entry] });
}

export async function appendArtifact(projectId: string, artifact: Artifact): Promise<Project | null> {
  const project = await getProject(projectId);
  if (!project) return null;
  let foundRun = false;
  const runs = (project.runs ?? []).map((run) => {
    if (run.id !== artifact.runId) return run;
    foundRun = true;
    return { ...run, updatedAt: new Date().toISOString(), artifacts: [...(run.artifacts ?? []), artifact] };
  });
  if (!foundRun) return null;
  return saveProject({ ...project, runs });
}
