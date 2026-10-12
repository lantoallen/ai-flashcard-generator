import { useSyncExternalStore } from 'react';

/** Cards studied per local calendar day, for streaks and the daily goal. */

const KEY = 'flashly:activity:v1';
const EVENT = 'flashly:activity-changed';
const KEEP_DAYS = 120;

export const DAILY_GOAL = 20;

export type Days = Record<string, number>;
const EMPTY: Days = {};

let cachedRaw: string | null = null;
let cached: Days = EMPTY;

export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

function read(): Days {
  if (typeof window === 'undefined') return EMPTY;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    cached =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Days)
        : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useActivity(): Days {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Record that `n` cards were studied today. */
export function logActivity(n = 1): void {
  const days = { ...read() };
  const today = dayKey(new Date());
  days[today] = (days[today] ?? 0) + n;

  const keys = Object.keys(days).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) {
    delete days[k];
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(days));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Consecutive days with activity, counting back from today (or yesterday). */
export function streakOf(days: Days, nowMs: number): number {
  const d = new Date(nowMs);
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
  let streak = 0;
  while ((days[dayKey(d)] ?? 0) > 0) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function lastDays(days: Days, n: number, nowMs: number) {
  const out: { key: string; label: string; count: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(nowMs);
    d.setDate(d.getDate() - i);
    out.push({
      key: dayKey(d),
      label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
      count: days[dayKey(d)] ?? 0,
    });
  }
  return out;
}
