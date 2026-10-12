import { useSyncExternalStore } from 'react';

export const THEME_KEY = 'flashly-theme';
export const ACCENT_KEY = 'flashly-accent';
const EVENT = 'flashly:theme-changed';

export type Theme = 'light' | 'dark';

export const ACCENTS = [
  { id: 'violet', label: 'Violet', color: '#6c47ff' },
  { id: 'indigo', label: 'Indigo', color: '#4f46e5' },
  { id: 'blue', label: 'Blue', color: '#2563eb' },
  { id: 'cyan', label: 'Cyan', color: '#0e7490' },
  { id: 'teal', label: 'Teal', color: '#0b8a78' },
  { id: 'green', label: 'Green', color: '#15803d' },
  { id: 'amber', label: 'Amber', color: '#b45309' },
  { id: 'orange', label: 'Orange', color: '#c2410c' },
  { id: 'coral', label: 'Coral', color: '#e8455c' },
  { id: 'rose', label: 'Rose', color: '#be185d' },
  { id: 'plum', label: 'Plum', color: '#9333ea' },
  { id: 'slate', label: 'Slate', color: '#475569' },
] as const;

/** A preset id such as "teal", or a custom colour such as "#12ab34". */
export type Accent = string;

const HEX = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX.test(value);
}

export function isValidAccent(value: string): boolean {
  return isHexColor(value) || ACCENTS.some((a) => a.id === value);
}

/** Text colour that stays readable on top of a custom accent in light mode. */
export function onAccentColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? '#1b1033' : '#ffffff';
}

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
      const root = document.documentElement;
      const a = root.dataset.accent;
      if (a === 'custom') {
        const hex = root.style.getPropertyValue('--user-accent').trim();
        return isHexColor(hex) ? hex : 'violet';
      }
      return ACCENTS.some((x) => x.id === a) ? (a as string) : 'violet';
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

/** Apply an accent to the page without remembering it (used when syncing from an account). */
export function applyAccent(accent: Accent): boolean {
  if (!isValidAccent(accent)) return false;
  const root = document.documentElement;
  if (isHexColor(accent)) {
    root.dataset.accent = 'custom';
    root.style.setProperty('--user-accent', accent.toLowerCase());
    root.style.setProperty('--user-on', onAccentColor(accent));
  } else {
    root.dataset.accent = accent;
    root.style.removeProperty('--user-accent');
    root.style.removeProperty('--user-on');
  }
  window.dispatchEvent(new Event(EVENT));
  return true;
}

export function setAccent(accent: Accent) {
  if (!applyAccent(accent)) return;
  persist(ACCENT_KEY, isHexColor(accent) ? accent.toLowerCase() : accent);
}
