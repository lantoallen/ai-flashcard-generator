import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { z } from 'zod';

// Models are tried in order; Groq retires models from time to time.
const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

const MAX_NOTES = 8000;
const MAX_TOPIC = 200;
const MIN_COUNT = 5;
const MAX_COUNT = 20;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

const setSchema = z.object({
  title: z.string(),
  cards: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
      wrongAnswers: z.array(z.string()),
    })
  ),
});

// Very small in-memory limiter so a public deployment can't burn the free quota.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
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

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (rateLimited(ip)) {
    return error('Too many requests. Please wait a minute and try again.', 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return error('Invalid request.', 400);
  }

  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
  const level = LEVELS.includes(body.level as (typeof LEVELS)[number])
    ? (body.level as (typeof LEVELS)[number])
    : 'intermediate';
  const requested = Number(body.count);
  const count = Math.min(
    MAX_COUNT,
    Math.max(MIN_COUNT, Number.isFinite(requested) ? Math.round(requested) : 10)
  );

  if (!notes && !topic) {
    return error('Please paste some notes or enter a topic.', 400);
  }
  if (notes && notes.length < 20) {
    return error('Those notes are too short. Add a few more sentences.', 400);
  }
  if (notes.length > MAX_NOTES) {
    return error(`Notes are too long. Please keep them under ${MAX_NOTES} characters.`, 400);
  }
  if (topic.length > MAX_TOPIC) {
    return error(`Topic is too long. Please keep it under ${MAX_TOPIC} characters.`, 400);
  }

  const rules = `Create exactly ${count} study flashcards at a ${level} level.
- "term": a short concept, name or question (max 8 words).
- "definition": a clear, self-contained answer (max 30 words).
- "wrongAnswers": exactly 3 plausible but incorrect definitions in the same style and length as the real one, used as quiz distractors. They must clearly be wrong.
- "title": a short title for the set (max 6 words).
- Do not repeat terms. Write in the language of the source material.`;

  const prompt = notes
    ? `${rules}\n\nUse only information from these notes:\n"""\n${notes}\n"""`
    : `${rules}\n\nTopic: "${topic}". Cover the most important concepts a student should know.`;

  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const { object } = await generateObject({
        model: groq(model),
        schema: setSchema,
        prompt,
      });

      const seen = new Set<string>();
      const cards = object.cards
        .map((c) => ({
          term: c.term.trim(),
          definition: c.definition.trim(),
          distractors: c.wrongAnswers
            .map((w) => w.trim())
            .filter((w) => w && w.toLowerCase() !== c.definition.trim().toLowerCase())
            .slice(0, 3),
        }))
        .filter((c) => {
          const key = c.term.toLowerCase();
          if (!c.term || !c.definition || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      if (cards.length < 3) {
        lastError = new Error('Too few valid cards');
        continue;
      }

      return Response.json({
        title: object.title.trim() || topic || 'Untitled set',
        cards,
      });
    } catch (err) {
      lastError = err;
      console.error(`Generation failed with ${model}:`, err);
    }
  }

  console.error('All models failed:', lastError);
  return error('Could not generate your set right now. Please try again in a moment.', 502);
}
