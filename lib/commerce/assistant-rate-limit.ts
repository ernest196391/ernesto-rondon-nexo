type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 12;

export function assistantClientKey(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "anonymous";
}

export function consumeAssistantRateLimit(key: string, now = Date.now()) {
  if (buckets.size > 1000) {
    for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + WINDOW_MS;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
  }
  if (current.count >= MAX_REQUESTS) return { allowed: false, remaining: 0, resetAt: current.resetAt };
  current.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - current.count, resetAt: current.resetAt };
}

export function resetAssistantRateLimitsForTests() {
  buckets.clear();
}
