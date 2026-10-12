import type { Card } from './types';

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Cards that have both sides filled in. */
export function validCards(cards: Card[]): Card[] {
  return cards.filter((c) => c.term.trim() && c.definition.trim());
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

export type AnswerResult = 'correct' | 'close' | 'wrong';

/** Typed-answer check that forgives case, punctuation, accents and small typos. */
export function checkTyped(input: string, answer: string): AnswerResult {
  const a = normalize(input);
  const b = normalize(answer);
  if (!a) return 'wrong';
  if (a === b) return 'correct';
  const dist = levenshtein(a, b);
  const allowed = Math.max(1, Math.floor(b.length * 0.12));
  return dist <= allowed ? 'close' : 'wrong';
}

/** Parse "term<sep>definition" lines (tab, " - ", ";", "," or ":"). */
export function parseCards(text: string): { term: string; definition: string }[] {
  const seps = ['\t', ' - ', ' – ', ' — ', ';', ',', ':'];
  const out: { term: string; definition: string }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    for (const sep of seps) {
      const at = line.indexOf(sep);
      if (at > 0) {
        const term = line.slice(0, at).trim();
        const definition = line.slice(at + sep.length).trim();
        if (term && definition) out.push({ term, definition });
        break;
      }
    }
  }
  return out;
}

export function formatMs(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${Math.round(s - m * 60)}s`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
