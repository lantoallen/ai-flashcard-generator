import { useSyncExternalStore } from 'react';
import type { Card, StudySet } from './types';
import { uid } from './utils';

/**
 * All sets live in the browser's localStorage (no account, no server).
 * Exposed to React through useSyncExternalStore so every component stays in sync.
 */

const KEY = 'flashly:sets:v1';
const EVENT = 'flashly:sets-changed';
const EMPTY: StudySet[] = [];

let cachedRaw: string | null = null;
let cachedValue: StudySet[] = EMPTY;

function isSet(value: unknown): value is StudySet {
  const s = value as StudySet;
  return (
    !!s &&
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    Array.isArray(s.cards)
  );
}

export function getSets(): StudySet[] {
  if (typeof window === 'undefined') return EMPTY;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedValue = Array.isArray(parsed) ? parsed.filter(isSet) : EMPTY;
  } catch {
    cachedValue = EMPTY;
  }
  return cachedValue;
}

function write(sets: StudySet[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sets));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(EVENT));
  return true;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useSets(): StudySet[] {
  return useSyncExternalStore(subscribe, getSets, () => EMPTY);
}

export function useSet(id: string): StudySet | undefined {
  return useSets().find((s) => s.id === id);
}

/** False during server render and hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function saveSet(set: StudySet): boolean {
  const others = getSets().filter((s) => s.id !== set.id);
  return write([set, ...others]);
}

export function updateSet(id: string, patch: Partial<StudySet>): void {
  write(
    getSets().map((s) =>
      s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s
    )
  );
}

/** Update study progress without bumping updatedAt. */
export function touchProgress(id: string, patch: Partial<StudySet>): void {
  write(
    getSets().map((s) =>
      s.id === id ? { ...s, ...patch, lastStudied: Date.now() } : s
    )
  );
}

export function updateCard(
  setId: string,
  cardId: string,
  patch: Partial<Card>
): void {
  write(
    getSets().map((s) =>
      s.id === setId
        ? {
            ...s,
            cards: s.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
          }
        : s
    )
  );
}

export function addCard(setId: string): void {
  updateSet(setId, {
    cards: [
      ...(getSets().find((s) => s.id === setId)?.cards ?? []),
      { id: uid(), term: '', definition: '' },
    ],
  });
}

export function deleteCard(setId: string, cardId: string): void {
  const set = getSets().find((s) => s.id === setId);
  if (set) updateSet(setId, { cards: set.cards.filter((c) => c.id !== cardId) });
}

export function deleteSet(id: string): void {
  write(getSets().filter((s) => s.id !== id));
}

export function resetProgress(setId: string): void {
  const set = getSets().find((s) => s.id === setId);
  if (set) {
    updateSet(setId, { cards: set.cards.map((c) => ({ ...c, known: false })) });
  }
}

/** Merge sets from a backup file. Returns the number added. */
export function importSets(incoming: unknown): number {
  if (!Array.isArray(incoming)) return 0;
  const existing = getSets();
  const known = new Set(existing.map((s) => s.id));
  const fresh = incoming.filter(isSet).filter((s) => !known.has(s.id));
  if (fresh.length) write([...fresh, ...existing]);
  return fresh.length;
}
