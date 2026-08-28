import { createHash, randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { AssistantConfidence } from "./assistant";

let pool: Pool | undefined;
let schemaReady: Promise<void> | undefined;

function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  pool ??= new Pool({ connectionString, max: 2, idleTimeoutMillis: 30_000 });
  return pool;
}

export function redactAssistantQuestion(value: string) {
  return value
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/(?:\+?\d[\d\s().-]{6,}\d)/g, "[phone]")
    .replace(/\b\d{7,}\b/g, "[number]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

export function assistantQuestionFingerprint(productId: string, question: string) {
  return createHash("sha256")
    .update(`${productId}\u0000${redactAssistantQuestion(question).toLowerCase()}`)
    .digest("hex");
}

export type BacklogResolutionInput = {
  id: string;
  resolved: boolean;
  note: string | null;
  evidenceUrl: string | null;
};

export function normalizeBacklogResolutionInput(value: unknown): BacklogResolutionInput {
  if (!value || typeof value !== "object") throw new Error("Payload inválido");
  const input = value as Record<string, unknown>;
  const id = typeof input.id === "string" ? input.id.trim().slice(0, 160) : "";
  if (!id) throw new Error("id es obligatorio");
  if (typeof input.resolved !== "boolean") throw new Error("resolved debe ser booleano");

  const note = typeof input.note === "string" ? input.note.replace(/\s+/g, " ").trim().slice(0, 1000) : "";
  let evidenceUrl: string | null = null;
  if (typeof input.evidenceUrl === "string" && input.evidenceUrl.trim()) {
    const candidate = input.evidenceUrl.trim().slice(0, 1000);
    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      throw new Error("evidenceUrl no es una URL válida");
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("evidenceUrl debe usar http o https");
    }
    evidenceUrl = parsed.toString();
  }

  return {
    id,
    resolved: input.resolved,
    note: input.resolved && note ? note : null,
    evidenceUrl: input.resolved ? evidenceUrl : null,
  };
}

async function ensureSchema() {
  schemaReady ??= db().query(`
    CREATE TABLE IF NOT EXISTS nexo_assistant_knowledge_backlog (
      id TEXT PRIMARY KEY,
      product_knowledge_id TEXT NOT NULL,
      question_redacted TEXT NOT NULL,
      question_fingerprint TEXT NOT NULL UNIQUE,
      confidence TEXT NOT NULL,
      needs_human_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
      occurrences INTEGER NOT NULL DEFAULT 1,
      first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved BOOLEAN NOT NULL DEFAULT FALSE,
      resolved_at TIMESTAMPTZ,
      resolution_note TEXT,
      resolution_evidence_url TEXT
    );
    ALTER TABLE nexo_assistant_knowledge_backlog
      ADD COLUMN IF NOT EXISTS resolution_note TEXT;
    ALTER TABLE nexo_assistant_knowledge_backlog
      ADD COLUMN IF NOT EXISTS resolution_evidence_url TEXT;
    CREATE INDEX IF NOT EXISTS nexo_assistant_knowledge_backlog_product_idx
      ON nexo_assistant_knowledge_backlog(product_knowledge_id, resolved, last_seen_at DESC);
  `).then(() => undefined);
  return schemaReady;
}

export async function recordAssistantKnowledgeBacklog(input: {
  productId: string;
  question: string;
  confidence: AssistantConfidence;
  needsHumanConfirmation: boolean;
}) {
  if (input.confidence !== "unknown" && !input.needsHumanConfirmation) return false;
  const question = redactAssistantQuestion(input.question);
  if (!question) return false;

  await ensureSchema();
  const fingerprint = assistantQuestionFingerprint(input.productId, question);
  await db().query(`
    INSERT INTO nexo_assistant_knowledge_backlog(
      id, product_knowledge_id, question_redacted, question_fingerprint, confidence, needs_human_confirmation
    ) VALUES($1,$2,$3,$4,$5,$6)
    ON CONFLICT(question_fingerprint) DO UPDATE SET
      occurrences = nexo_assistant_knowledge_backlog.occurrences + 1,
      last_seen_at = NOW(),
      confidence = EXCLUDED.confidence,
      needs_human_confirmation = EXCLUDED.needs_human_confirmation
  `, [
    `aq_${randomUUID()}`,
    input.productId,
    question,
    fingerprint,
    input.confidence,
    input.needsHumanConfirmation,
  ]);
  return true;
}

export async function listAssistantKnowledgeBacklog(productId: string, limit = 50) {
  await ensureSchema();
  const result = await db().query(`
    SELECT id, product_knowledge_id, question_redacted, confidence, needs_human_confirmation,
           occurrences, first_seen_at, last_seen_at, resolved, resolved_at,
           resolution_note, resolution_evidence_url
    FROM nexo_assistant_knowledge_backlog
    WHERE product_knowledge_id=$1
    ORDER BY resolved ASC, occurrences DESC, last_seen_at DESC
    LIMIT $2
  `, [productId, Math.min(100, Math.max(1, limit))]);
  return result.rows;
}

export async function updateAssistantKnowledgeBacklogResolution(value: unknown) {
  const input = normalizeBacklogResolutionInput(value);
  await ensureSchema();
  const result = await db().query(`
    UPDATE nexo_assistant_knowledge_backlog
    SET resolved = $2,
        resolved_at = CASE WHEN $2 THEN NOW() ELSE NULL END,
        resolution_note = CASE WHEN $2 THEN $3 ELSE NULL END,
        resolution_evidence_url = CASE WHEN $2 THEN $4 ELSE NULL END
    WHERE id = $1
    RETURNING id, product_knowledge_id, question_redacted, confidence, needs_human_confirmation,
              occurrences, first_seen_at, last_seen_at, resolved, resolved_at,
              resolution_note, resolution_evidence_url
  `, [input.id, input.resolved, input.note, input.evidenceUrl]);
  return result.rows[0] ?? null;
}
