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

export function aiConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

export const NOT_CONFIGURED =
  'The AI service is not set up on this server yet (GROQ_API_KEY is missing).';

type AiErrorShape = {
  statusCode?: number;
  responseHeaders?: Record<string, string>;
  lastError?: AiErrorShape;
};

/** HTTP status and a "retry after N seconds" hint from a failed AI call. */
export function aiErrorInfo(err: unknown): { status?: number; retryAfter?: number } {
  const e = err as AiErrorShape | null;
  const inner = e?.statusCode === undefined ? e?.lastError : e;
  const status = inner?.statusCode;
  const h = inner?.responseHeaders ?? {};

  let retryAfter: number | undefined;
  if (h['retry-after'] && Number.isFinite(Number(h['retry-after']))) {
    retryAfter = Number(h['retry-after']);
  } else if (h['x-ratelimit-reset-tokens']) {
    // Looks like "5.5s" or "1m26.4s".
    const m = /(?:(\d+)m)?([\d.]+)s/.exec(h['x-ratelimit-reset-tokens']);
    if (m) retryAfter = Number(m[1] ?? 0) * 60 + Number(m[2]);
  }
  return { status, retryAfter: retryAfter === undefined ? undefined : Math.ceil(retryAfter) };
}

/** A user-facing message for a failed AI call, without leaking internals. */
export function describeAiError(err: unknown): string {
  const { status } = aiErrorInfo(err);
  if (status === 401 || status === 403) {
    return 'The AI service rejected this server’s API key. Check GROQ_API_KEY.';
  }
  if (status === 429) {
    return 'The AI service is busy right now. Please try again in a few seconds.';
  }
  if (status === 400) {
    return 'The AI had trouble with that request. Please try again.';
  }
  return 'Could not reach the AI service right now. Please try again in a moment.';
}

/** Standard JSON response for a failed AI call. */
export function aiFailure(err: unknown) {
  const { status, retryAfter } = aiErrorInfo(err);
  return Response.json(
    { error: describeAiError(err), retryAfter },
    { status: status === 429 ? 429 : 502 }
  );
}

/** Keep reasoning short so models spend their budget on the answer. */
export const AI_OPTIONS = { groq: { reasoningEffort: 'low' as const } };
