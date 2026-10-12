/** Helpers shared by the API routes (server only). */

// Models are tried in order; Groq retires models from time to time.
export const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

// Very small in-memory limiter so a public deployment can't burn the free quota.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, number[]>();

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
}

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
