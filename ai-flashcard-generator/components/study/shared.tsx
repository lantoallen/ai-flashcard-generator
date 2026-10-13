import { Icon } from '@/components/icons';
import type { Card } from '@/lib/types';

export type Tab = 'flashcards' | 'review' | 'quiz' | 'test' | 'write' | 'match' | 'cards';

export type ModeProps = {
  setId: string;
  title: string;
  /** Cards with both sides filled in. */
  cards: Card[];
  bestQuiz?: number;
  bestMatchMs?: number;
  goTo: (tab: Tab) => void;
};

export type SourceFilter = 'all' | 'starred' | 'learning';

export function filterCards(cards: Card[], filter: SourceFilter): Card[] {
  if (filter === 'starred') return cards.filter((c) => c.starred);
  if (filter === 'learning') return cards.filter((c) => !c.known);
  return cards;
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; disabled?: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-1 rounded-xl border-2 border-ink bg-surface-2 p-1"
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-lg px-1.5 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-sm ${
              value === o.value
                ? 'bg-ink text-bg'
                : 'text-muted hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Source filter with live counts: all / starred / still learning. */
export function SourcePicker({
  cards,
  value,
  onChange,
}: {
  cards: Card[];
  value: SourceFilter;
  onChange: (v: SourceFilter) => void;
}) {
  const starred = cards.filter((c) => c.starred).length;
  const learning = cards.filter((c) => !c.known).length;
  return (
    <Segmented
      label="Cards to include"
      value={value}
      onChange={onChange}
      options={[
        { value: 'all', label: `All (${cards.length})` },
        { value: 'starred', label: `Starred (${starred})`, disabled: starred === 0 },
        { value: 'learning', label: `Still learning (${learning})`, disabled: learning === 0 },
      ]}
    />
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-surface-2"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div
        className="brand-bg h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export type ReviewItem = {
  prompt: string;
  yourAnswer: string;
  answer: string;
  correct: boolean;
};

export function Results({
  correct,
  total,
  items,
  onRetryMissed,
  onNew,
  note,
}: {
  correct: number;
  total: number;
  items: ReviewItem[];
  onRetryMissed: () => void;
  onNew: () => void;
  note?: string;
}) {
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const missed = total - correct;
  const message =
    pct === 100
      ? 'Perfect score!'
      : pct >= 80
        ? 'Great work!'
        : pct >= 50
          ? 'Getting there. Review the misses below.'
          : 'Keep at it. Try flashcards, then retry.';

  return (
    <div className="flex flex-col gap-6">
      <div className="panel flex flex-col items-center gap-2 px-6 py-10 text-center">
        <p className="brand-text text-6xl font-bold">{pct}%</p>
        <p className="text-lg font-semibold">
          {correct} of {total} correct
        </p>
        <p className="text-muted">{message}</p>
        {note && <p className="text-sm font-medium text-success">{note}</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {missed > 0 && (
            <button type="button" onClick={onRetryMissed} className="btn btn-primary">
              <Icon name="refresh" size={16} />
              Retry {missed} missed
            </button>
          )}
          <button type="button" onClick={onNew} className="btn btn-secondary">
            New round
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-semibold">Review</h3>
        {items.map((item, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 ${
              item.correct
                ? 'border-line bg-surface'
                : 'border-danger/40 bg-danger-soft'
            }`}
          >
            <p className="font-medium">{item.prompt}</p>
            <p className="mt-2 text-sm">
              <span className="text-success">✓ {item.answer}</span>
            </p>
            {!item.correct && (
              <p className="mt-1 text-sm text-danger">
                ✗ {item.yourAnswer || 'No answer'}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function NeedMore({ min, goTo }: { min: number; goTo: (t: Tab) => void }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-lg font-semibold">Add a few more cards first</p>
      <p className="text-muted">This mode needs at least {min} complete cards.</p>
      <button type="button" onClick={() => goTo('cards')} className="btn btn-primary">
        <Icon name="edit" size={16} />
        Edit cards
      </button>
    </div>
  );
}

export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable;
}
