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
      resolved_at TIMESTAMPTZ
    );
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
           occurrences, first_seen_at, last_seen_at, resolved, resolved_at
    FROM nexo_assistant_knowledge_backlog
    WHERE product_knowledge_id=$1
    ORDER BY resolved ASC, occurrences DESC, last_seen_at DESC
    LIMIT $2
  `, [productId, Math.min(100, Math.max(1, limit))]);
  return result.rows;
}
