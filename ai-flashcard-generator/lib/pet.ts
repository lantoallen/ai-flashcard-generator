import { useSyncExternalStore } from 'react';

/** The study buddy: a name, a level that grows with cards studied, and reactions. */

const KEY = 'flashly:pet:v1';
const EVENT = 'flashly:pet-changed';
const REACT_EVENT = 'flashly:pet-react';

export const DEFAULT_NAME = 'Pip';
export const NAME_MAX = 16;

export type PetState = { name: string; hidden: boolean; xp: number };
export type Mood = 'happy' | 'excited' | 'sad' | 'sleepy' | 'thinking';

const DEFAULT_STATE: PetState = { name: DEFAULT_NAME, hidden: false, xp: 0 };

let cachedRaw: string | null = null;
let cached: PetState = DEFAULT_STATE;

function read(): PetState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return DEFAULT_STATE;
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const p = (raw ? JSON.parse(raw) : {}) as Partial<PetState>;
    cached = {
      name:
        typeof p.name === 'string' && p.name.trim()
          ? p.name.trim().slice(0, NAME_MAX)
          : DEFAULT_NAME,
      hidden: p.hidden === true,
      xp: typeof p.xp === 'number' && p.xp >= 0 ? Math.floor(p.xp) : 0,
    };
  } catch {
    cached = DEFAULT_STATE;
  }
  return cached;
}

function write(next: PetState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function usePet(): PetState {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_STATE);
}

export function getPet(): PetState {
  return read();
}

export function renamePet(name: string): void {
  const clean = name.trim().slice(0, NAME_MAX) || DEFAULT_NAME;
  write({ ...read(), name: clean });
}

export function setPetHidden(hidden: boolean): void {
  write({ ...read(), hidden });
}

export function replacePet(name: string, xp: number): void {
  write({ ...read(), name: name.trim().slice(0, NAME_MAX) || DEFAULT_NAME, xp: Math.max(0, Math.floor(xp)) });
}

export function addPetXp(n: number): void {
  if (n <= 0) return;
  const s = read();
  write({ ...s, xp: s.xp + Math.round(n) });
}

export function setPetXp(xp: number): void {
  write({ ...read(), xp: Math.max(0, Math.floor(xp)) });
}

// ---- Levels ---------------------------------------------------------------------

export const LEVELS = [
  { level: 1, title: 'Hatchling', at: 0 },
  { level: 2, title: 'Sprout', at: 25 },
  { level: 3, title: 'Scholar', at: 100 },
  { level: 4, title: 'Graduate', at: 250 },
  { level: 5, title: 'Sage', at: 500 },
  { level: 6, title: 'Legend', at: 1000 },
] as const;

export function levelOf(xp: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.at) current = l;
  const next = LEVELS.find((l) => l.at > xp);
  return {
    ...current,
    next: next ?? null,
    progress: next ? (xp - current.at) / (next.at - current.at) : 1,
  };
}

// ---- Reactions ------------------------------------------------------------------

export type Reaction = { mood: Mood; text?: string; level?: 'cheer' | 'oops' | 'think' | 'party' };

const LINES = {
  cheer: ['Nice one!', 'Yes! Keep going!', 'You got it!', 'Brilliant!', 'That’s the way!'],
  oops: ['So close. Next one!', 'Mistakes help memory.', 'You’ll get it next time.', 'Keep at it!'],
  think: ['Hmm, thinking…', 'Working on it…', 'Cooking up cards…'],
  party: ['Amazing work!', 'Round complete!', 'Look at you go!', 'High five!'],
} as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Tell the buddy something happened. Safe to call from any client code. */
export function petReact(kind: keyof typeof LINES, text?: string): void {
  if (typeof window === 'undefined') return;
  const mood: Mood =
    kind === 'cheer' || kind === 'party' ? 'excited' : kind === 'oops' ? 'sad' : 'thinking';
  const detail: Reaction = { mood, text: text ?? pick(LINES[kind]) };
  window.dispatchEvent(new CustomEvent<Reaction>(REACT_EVENT, { detail }));
}

export function onPetReact(handler: (r: Reaction) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<Reaction>).detail);
  window.addEventListener(REACT_EVENT, listener);
  return () => window.removeEventListener(REACT_EVENT, listener);
}

export const TIPS = [
  'Short sessions every day beat one long cram.',
  'Try Write mode. Recalling beats recognising.',
  'Star the cards that keep tripping you up.',
  'Explain a card out loud in your own words.',
  'Review just before bed. Sleep locks memories in.',
  'Use Review daily. Spaced repetition does the scheduling for you.',
  'Mix it up: flashcards, then a quiz, then a test.',
];
