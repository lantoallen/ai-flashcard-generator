'use client';

import { Icon } from './icons';

export const THEME_KEY = 'flashly-theme';

export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode: theme just won't persist */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-ghost !p-2.5"
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      {/* Both icons are rendered; CSS shows the right one, so there is no hydration flash. */}
      <Icon name="moon" className="dark:hidden" />
      <Icon name="sun" className="hidden dark:block" />
    </button>
  );
}
