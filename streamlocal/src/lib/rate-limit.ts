// Rate limit em memória APENAS para dev/MVP (documentado no README).
// Em produção usar Redis (ex.: @upstash/ratelimit) — interface já isolada aqui.
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  b.count += 1;
  return { ok: b.count <= limit, remaining: Math.max(0, limit - b.count) };
}

export function clientKey(prefix: string, id: string) { return `${prefix}:${id}`; }
