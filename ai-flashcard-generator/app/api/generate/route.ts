import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { z } from 'zod';
import {
  AI_OPTIONS,
  aiConfigured,
  aiFailure,
  clientIp,
  jsonError,
  MODELS,
  NOT_CONFIGURED,
  rateLimited,
} from '@/lib/server';

// Allow AI calls to run longer than a host's default function timeout.
export const maxDuration = 30;

const MAX_NOTES = 8000;
const MAX_TOPIC = 200;
const MIN_COUNT = 1;
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

export async function POST(req: Request) {
  if (!aiConfigured()) return jsonError(NOT_CONFIGURED, 503);
  if (rateLimited(clientIp(req))) {
    return jsonError('Too many requests. Please wait a minute and try again.', 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid request.', 400);
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
  // Terms that already exist (used when adding more cards to a set).
  const exclude = Array.isArray(body.exclude)
    ? body.exclude
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim().slice(0, 100))
        .filter(Boolean)
        .slice(0, 100)
    : [];

  if (!notes && !topic) {
    return jsonError('Please paste some notes or enter a topic.', 400);
  }
  if (notes && notes.length < 20) {
    return jsonError('Those notes are too short. Add a few more sentences.', 400);
  }
  if (notes.length > MAX_NOTES) {
    return jsonError(`Notes are too long. Please keep them under ${MAX_NOTES} characters.`, 400);
  }
  if (topic.length > MAX_TOPIC) {
    return jsonError(`Topic is too long. Please keep it under ${MAX_TOPIC} characters.`, 400);
  }

  const rules = `Create exactly ${count} study flashcards at a ${level} level.
- "term": a short concept, name or question (max 8 words).
- "definition": a clear, self-contained answer (max 30 words).
- "wrongAnswers": exactly 3 plausible but incorrect definitions in the same style and length as the real one, used as quiz distractors. They must clearly be wrong.
- "title": a short title for the set (max 6 words).
- Do not repeat terms. Write in the language of the source material.${
    exclude.length
      ? `\n- These terms already exist, so do NOT use them or close variants: ${exclude.join('; ')}.`
      : ''
  }`;

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
        providerOptions: AI_OPTIONS,
      });

      const seen = new Set(exclude.map((t) => t.toLowerCase()));
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

      if (cards.length < (exclude.length ? 1 : Math.min(3, count))) {
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
  return aiFailure(lastError);
}
