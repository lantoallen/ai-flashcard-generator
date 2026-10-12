'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import {
  ACCENTS,
  setAccent,
  setTheme,
  useAccent,
  useTheme,
  type Theme,
} from '@/lib/theme';

const MODES: { id: Theme; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

/** Palette button with a popover for light/dark mode and the accent colour. */
export default function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const accent = useAccent();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-secondary !p-2.5"
        aria-label="Change theme and colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Icon name="palette" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Theme"
          className="panel pop absolute right-0 top-full z-50 mt-3 w-64 p-4"
        >
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Mode</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={theme === m.id}
                onClick={() => setTheme(m.id)}
                className={`btn !py-2 ${
                  theme === m.id ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <Icon name={m.id === 'dark' ? 'moon' : 'sun'} size={16} />
                {m.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-muted">
            Accent color
          </p>
          <div className="mt-2 flex gap-2.5" role="radiogroup" aria-label="Accent color">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={accent === a.id}
                aria-label={a.label}
                title={a.label}
                onClick={() => setAccent(a.id)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform hover:scale-110"
                style={{
                  background: a.color,
                  border: '2px solid var(--ink)',
                  boxShadow: accent === a.id ? '0 0 0 3px var(--sun)' : undefined,
                }}
              >
                {accent === a.id && <Icon name="check" size={16} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
