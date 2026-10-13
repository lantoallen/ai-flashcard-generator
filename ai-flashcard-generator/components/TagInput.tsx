'use client';

import { useId, useState } from 'react';
import { Icon } from './icons';
import { LIMITS, normalizeTag } from '@/lib/social';

/** Chips plus a text box. Enter, comma or Tab adds a tag; Backspace removes the last. */
export default function TagInput({
  label,
  tags,
  onChange,
  max,
  placeholder = 'Type and press Enter',
  suggestions = [],
  hint,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  max: number;
  placeholder?: string;
  suggestions?: string[];
  hint?: string;
}) {
  const [draft, setDraft] = useState('');
  const id = useId();

  function add(raw: string) {
    const t = normalizeTag(raw);
    if (t && !tags.includes(t) && tags.length < max) onChange([...tags, t]);
    setDraft('');
  }

  const unused = suggestions.filter((s) => !tags.includes(s)).slice(0, 8);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold">
        {label}{' '}
        <span className="font-normal text-muted">
          ({tags.length}/{max})
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-ink bg-surface p-2">
        {tags.map((t) => (
          <span key={t} className="chip !bg-primary-soft">
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              aria-label={`Remove ${t}`}
              className="-mr-1 rounded-full p-1.5 hover:bg-surface sm:p-0.5"
            >
              <Icon name="x" size={12} />
            </button>
          </span>
        ))}
        {tags.length < max && (
          <input
            id={id}
            value={draft}
            maxLength={LIMITS.tag + 4}
            placeholder={tags.length === 0 ? placeholder : 'Add another'}
            onChange={(e) => {
              const v = e.target.value;
              if (v.includes(',')) add(v.split(',')[0]);
              else setDraft(v);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Tab') {
                if (draft.trim()) {
                  e.preventDefault();
                  add(draft);
                }
              } else if (e.key === 'Backspace' && !draft && tags.length) {
                onChange(tags.slice(0, -1));
              }
            }}
            onBlur={() => draft.trim() && add(draft)}
            className="min-w-[8rem] flex-1 bg-transparent px-2 py-1.5 text-sm outline-none"
          />
        )}
      </div>

      {hint && <p className="text-xs text-muted">{hint}</p>}

      {unused.length > 0 && tags.length < max && (
        <div className="flex flex-wrap gap-1.5" aria-label="Suggestions">
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="chip cursor-pointer !border-line text-muted transition-colors duration-200 hover:!border-ink hover:text-fg"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
