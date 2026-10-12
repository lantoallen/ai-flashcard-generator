import type { Card } from './types';

/** A small Leitner-style spaced repetition scheduler. */

const MINUTE = 60_000;
const DAY = 86_400_000;

/** Days until the next review for each box (box 0 = new or just forgotten). */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30];
export const MAX_BOX = BOX_DAYS.length - 1;
/** Cards in this box or higher count as "mastered". */
export const MASTERED_BOX = 3;

export type Grade = 'again' | 'good' | 'easy';

export function isDue(card: Card, now: number): boolean {
  return card.due === undefined || card.due <= now;
}

function nextBox(card: Card, grade: Grade): number {
  const box = card.box ?? 0;
  if (grade === 'again') return 0;
  return Math.min(MAX_BOX, box + (grade === 'easy' ? 2 : 1));
}

function nextDue(box: number, grade: Grade, now: number): number {
  return grade === 'again' ? now + MINUTE : now + BOX_DAYS[box] * DAY;
}

/** The card fields to save after a review. */
export function gradeCard(card: Card, grade: Grade, now: number): Partial<Card> {
  const box = nextBox(card, grade);
  return { box, due: nextDue(box, grade, now), known: box >= MASTERED_BOX };
}

export function formatIn(ms: number): string {
  if (ms < MINUTE) return 'now';
  if (ms < 60 * MINUTE) return `${Math.round(ms / MINUTE)} min`;
  if (ms < DAY) {
    const h = Math.round(ms / (60 * MINUTE));
    return `${h} hour${h === 1 ? '' : 's'}`;
  }
  const d = Math.round(ms / DAY);
  return `${d} day${d === 1 ? '' : 's'}`;
}

/** Label for the interval a grade button will schedule, e.g. "3 days". */
export function previewInterval(card: Card, grade: Grade): string {
  const box = nextBox(card, grade);
  return formatIn(grade === 'again' ? MINUTE : BOX_DAYS[box] * DAY);
}
