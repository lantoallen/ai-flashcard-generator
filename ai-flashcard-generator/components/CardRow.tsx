'use client';

import { memo } from 'react';
import { Icon } from './icons';

export type RowField = 'term' | 'definition';

type Props = {
  id: string;
  index: number;
  term: string;
  definition: string;
  isFirst: boolean;
  isLast: boolean;
  starred?: boolean;
  showStar?: boolean;
  /** Focus this row's term field when it mounts (used for newly added rows). */
  focusTerm?: boolean;
  onChange: (id: string, field: RowField, value: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onToggleStar?: (id: string) => void;
  /** Tab out of the last definition adds a new card, like Quizlet. */
  onAddAfter?: () => void;
};

/** One term / definition row. Memoised so typing in one row doesn't re-render thousands. */
const CardRow = memo(function CardRow({
  id,
  index,
  term,
  definition,
  isFirst,
  isLast,
  starred,
  showStar,
  focusTerm,
  onChange,
  onDelete,
  onMove,
  onToggleStar,
  onAddAfter,
}: Props) {
  return (
    <li className="panel-soft flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-extrabold text-muted">{index + 1}</span>
        <div className="flex gap-0.5">
          {showStar && onToggleStar && (
            <button
              type="button"
              onClick={() => onToggleStar(id)}
              className={`btn btn-ghost !p-2 ${starred ? '!text-warn' : ''}`}
              aria-label={starred ? `Unstar card ${index + 1}` : `Star card ${index + 1}`}
              aria-pressed={!!starred}
            >
              <Icon name="star" size={16} filled={!!starred} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onMove(id, -1)}
            disabled={isFirst}
            className="btn btn-ghost !p-2"
            aria-label={`Move card ${index + 1} up`}
          >
            <Icon name="chevron" size={16} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => onMove(id, 1)}
            disabled={isLast}
            className="btn btn-ghost !p-2"
            aria-label={`Move card ${index + 1} down`}
          >
            <Icon name="chevron" size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(id)}
            className="btn btn-ghost !p-2 hover:!text-danger"
            aria-label={`Delete card ${index + 1}`}
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`term-${id}`}
            className="text-xs font-extrabold uppercase tracking-wider text-muted"
          >
            Term
          </label>
          <textarea
            id={`term-${id}`}
            rows={2}
            value={term}
            autoFocus={focusTerm}
            onChange={(e) => onChange(id, 'term', e.target.value)}
            placeholder="Enter term"
            className="input resize-y"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`def-${id}`}
            className="text-xs font-extrabold uppercase tracking-wider text-muted"
          >
            Definition
          </label>
          <textarea
            id={`def-${id}`}
            rows={2}
            value={definition}
            onChange={(e) => onChange(id, 'definition', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Tab' && !e.shiftKey && isLast && onAddAfter) {
                e.preventDefault();
                onAddAfter();
              }
            }}
            placeholder="Enter definition"
            className="input resize-y"
          />
        </div>
      </div>
    </li>
  );
});

export default CardRow;
