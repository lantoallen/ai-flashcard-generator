'use client';

import { Icon } from './icons';
import { ACCENTS, isHexColor } from '@/lib/theme';

/** Preset accent colours plus a custom colour picker. */
export default function AccentPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const custom = isHexColor(value);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-6 gap-2.5" role="radiogroup" aria-label="Accent color">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={value === a.id}
            aria-label={a.label}
            title={a.label}
            onClick={() => onChange(a.id)}
            className="flex aspect-square w-full max-w-10 items-center justify-center justify-self-center rounded-full text-white transition-transform duration-200 hover:scale-105"
            style={{
              background: a.color,
              border: '2px solid var(--ink)',
              boxShadow: value === a.id ? '0 0 0 3px var(--sun)' : undefined,
            }}
          >
            {value === a.id && <Icon name="check" size={16} />}
          </button>
        ))}
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-line px-3 py-2 text-sm font-bold transition-colors duration-200 hover:border-ink">
        <span className="flex items-center gap-2">
          <span
            className="h-6 w-6 rounded-full border-2 border-ink"
            style={{
              background: custom
                ? value
                : 'conic-gradient(#ff5d73, #ffc83d, #2ed3a4, #3ab8ff, #6c47ff, #ff5d73)',
            }}
          />
          Custom color
        </span>
        <input
          type="color"
          aria-label="Pick a custom accent color"
          value={custom ? value : '#6c47ff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      </label>
    </div>
  );
}
