import { clientIp, groqKey, jsonError, MODELS, rateLimited } from '@/lib/server';

export const maxDuration = 15;

/**
 * Deployment self-check: is the API key set, does Groq accept it, and are the
 * configured models available? Never returns the key itself.
 */
export async function GET(req: Request) {
  if (rateLimited(clientIp(req))) {
    return jsonError('Too many requests. Please wait a minute and try again.', 429);
  }

  const key = groqKey();
  const headers = { 'Cache-Control': 'no-store' };
  if (!key) {
    return Response.json(
      {
        ok: false,
        keyConfigured: false,
        message:
          'GROQ_API_KEY is not set on this deployment. Add it in Vercel → Settings → Environment Variables, then redeploy.',
      },
      { status: 503, headers }
    );
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return Response.json(
        {
          ok: false,
          keyConfigured: true,
          groqStatus: res.status,
          message:
            res.status === 401
              ? 'Groq rejected the API key. Check that it was copied correctly.'
              : 'Groq returned an error.',
        },
        { status: 502, headers }
      );
    }
    const data = (await res.json()) as { data?: { id: string }[] };
    const ids = new Set((data.data ?? []).map((m) => m.id));
    const models = MODELS.map((id) => ({ id, available: ids.has(id) }));
    return Response.json(
      {
        ok: models.some((m) => m.available),
        keyConfigured: true,
        models,
        message: models.some((m) => m.available)
          ? 'AI service is ready.'
          : 'The configured models are not available. Update MODELS in lib/server.ts.',
      },
      { headers }
    );
  } catch {
    return Response.json(
      { ok: false, keyConfigured: true, message: 'Could not reach Groq.' },
      { status: 503, headers }
    );
  }
}
