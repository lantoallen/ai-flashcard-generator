import { useSyncExternalStore } from 'react';

export const THEME_KEY = 'flashly-theme';
export const ACCENT_KEY = 'flashly-accent';
const EVENT = 'flashly:theme-changed';

export type Theme = 'light' | 'dark';

export const ACCENTS = [
  { id: 'violet', label: 'Violet', color: '#6c47ff' },
  { id: 'coral', label: 'Coral', color: '#e8455c' },
  { id: 'teal', label: 'Teal', color: '#0b8a78' },
  { id: 'blue', label: 'Blue', color: '#2563eb' },
  { id: 'amber', label: 'Amber', color: '#b45309' },
] as const;

export type Accent = (typeof ACCENTS)[number]['id'];

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'),
    () => 'light'
  );
}

export function useAccent(): Accent {
  return useSyncExternalStore(
    subscribe,
    () => {
      const a = document.documentElement.dataset.accent;
      return ACCENTS.some((x) => x.id === a) ? (a as Accent) : 'violet';
    },
    () => 'violet'
  );
}

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: it just won't persist */
  }
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  persist(THEME_KEY, theme);
  window.dispatchEvent(new Event(EVENT));
}

export function setAccent(accent: Accent) {
  document.documentElement.dataset.accent = accent;
  persist(ACCENT_KEY, accent);
  window.dispatchEvent(new Event(EVENT));
}
