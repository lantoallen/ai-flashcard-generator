'use client';

import { useEffect, useState } from 'react';
import Confetti from '@/components/Confetti';
import { Icon } from '@/components/icons';
import { logActivity } from '@/lib/activity';
import { petReact } from '@/lib/pet';
import {
  formatIn,
  gradeCard,
  isDue,
  MASTERED_BOX,
  previewInterval,
  type Grade,
} from '@/lib/srs';
import { touchProgress, updateCard } from '@/lib/storage';
import { nowMs, shuffle } from '@/lib/utils';
import { isTypingTarget, NeedMore, ProgressBar, type ModeProps } from './shared';

const SESSION_SIZE = 20;

type Run = {
  queue: string[];
  idx: number;
  revealed: boolean;
  reviewed: number;
  again: number;
  done: boolean;
};

const GRADES: { grade: Grade; label: string; key: string; cls: string }[] = [
  { grade: 'again', label: 'Again', key: '1', cls: 'bg-danger-soft text-danger' },
  { grade: 'good', label: 'Good', key: '2', cls: 'bg-success-soft text-success' },
  { grade: 'easy', label: 'Easy', key: '3', cls: 'bg-sky-soft text-fg' },
];

export default function Review({ setId, cards, goTo }: ModeProps) {
  const [run, setRun] = useState<Run | null>(null);

  const now = nowMs();
  const due = cards.filter((c) => isDue(c, now));
  const fresh = due.filter((c) => c.due === undefined).length;
  const mastered = cards.filter((c) => (c.box ?? 0) >= MASTERED_BOX).length;
  const upcoming = cards
    .filter((c) => c.due !== undefined && c.due > now)
    .map((c) => c.due as number);
  const nextIn = upcoming.length ? Math.min(...upcoming) - now : null;

  function start(pool: typeof cards) {
    setRun({
      queue: shuffle(pool)
        .slice(0, SESSION_SIZE)
        .map((c) => c.id),
      idx: 0,
      revealed: false,
      reviewed: 0,
      again: 0,
      done: false,
    });
  }

  const current = run && !run.done ? cards.find((c) => c.id === run.queue[run.idx]) : undefined;

  function grade(g: Grade) {
    if (!run || run.done || !current) return;
    updateCard(setId, current.id, gradeCard(current, g, nowMs()));
    logActivity(1);
    if (g === 'again') petReact('oops', 'It’ll come back soon. You’ll get it!');
    else petReact('cheer');

    // Forgotten cards come back at the end of this session.
    const queue = g === 'again' ? [...run.queue, current.id] : run.queue;
    const reviewed = run.reviewed + 1;
    const again = run.again + (g === 'again' ? 1 : 0);
    if (run.idx + 1 >= queue.length) {
      touchProgress(setId, {});
      setRun({ ...run, queue, reviewed, again, done: true });
    } else {
      setRun({ ...run, queue, idx: run.idx + 1, revealed: false, reviewed, again });
    }
  }

  useEffect(() => {
    if (!run || run.done) return;
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      const onControl = (e.target as HTMLElement).closest?.('button, a, summary');
      if (!run!.revealed) {
        if ((e.key === ' ' || e.key === 'Enter') && !onControl) {
          e.preventDefault();
          setRun((r) => (r ? { ...r, revealed: true } : r));
        }
        return;
      }
      const g = GRADES.find((x) => x.key === e.key);
      if (g) grade(g.grade);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, current]);

  if (cards.length < 1) return <NeedMore min={1} goTo={goTo} />;

  // Summary
  if (run?.done) {
    const recalled = run.reviewed - run.again;
    const pct = run.reviewed ? Math.round((recalled / run.reviewed) * 100) : 0;
    return (
      <div className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
        {pct >= 70 && <Confetti />}
        <span className="pop flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-ink bg-mint text-[#1b1033]">
          <Icon name="check" size={32} />
        </span>
        <h2 className="font-display text-3xl font-extrabold">Session complete</h2>
        <p className="text-muted">
          {run.reviewed} reviews · {recalled} remembered ({pct}%)
        </p>
        <p className="text-sm text-muted">
          {nextIn !== null
            ? `Next review in about ${formatIn(nextIn)}.`
            : 'Come back tomorrow to keep the memory fresh.'}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => setRun(null)} className="btn btn-primary">
            Done
          </button>
          <button type="button" onClick={() => goTo('quiz')} className="btn btn-secondary">
            Try a quiz
          </button>
        </div>
      </div>
    );
  }

  // Card
  if (run && current) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="shrink-0 tabular-nums">
            {Math.min(run.idx + 1, run.queue.length)} / {run.queue.length}
          </span>
          <ProgressBar value={run.idx} max={run.queue.length} />
          <button type="button" onClick={() => setRun(null)} className="btn btn-ghost !px-2 !py-1">
            Quit
          </button>
        </div>

        <div className="panel flex min-h-60 flex-col items-center justify-center gap-4 p-8 text-center">
          <span className="text-xs font-extrabold uppercase tracking-wider text-muted">
            {run.revealed ? 'Definition' : 'Term'}
          </span>
          <p className="font-display text-2xl font-extrabold leading-snug sm:text-3xl">
            {current.term}
          </p>
          {run.revealed && (
            <p className="pop max-w-xl border-t-2 border-dashed border-line pt-4 text-lg">
              {current.definition}
            </p>
          )}
        </div>

        {!run.revealed ? (
          <button
            type="button"
            onClick={() => setRun({ ...run, revealed: true })}
            className="btn btn-primary btn-lg"
            autoFocus
          >
            Show answer
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-center text-sm font-semibold text-muted">
              How well did you remember it?
            </p>
            <div className="grid grid-cols-3 gap-3">
              {GRADES.map((g) => (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => grade(g.grade)}
                  className={`btn btn-lg flex-col !gap-0 ${g.cls}`}
                >
                  {g.label}
                  <span className="text-xs font-semibold opacity-80">
                    {previewInterval(current, g.grade)}
                  </span>
                </button>
              ))}
            </div>
            <p className="hidden text-center text-xs text-muted sm:block">
              Shortcuts: <kbd>1</kbd> again · <kbd>2</kbd> good · <kbd>3</kbd> easy
            </p>
          </div>
        )}
      </div>
    );
  }

  // Setup
  return (
    <div className="panel flex flex-col gap-6 p-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">Spaced review</h2>
        <p className="mt-1 text-sm text-muted">
          Cards you remember come back less often; cards you forget come back
          sooner. A few minutes a day beats one long cram.
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border-2 border-ink bg-sky-soft p-3">
          <dt className="text-xs font-bold text-muted">Due now</dt>
          <dd className="font-display text-3xl font-extrabold">{due.length}</dd>
        </div>
        <div className="rounded-xl border-2 border-ink bg-sun-soft p-3">
          <dt className="text-xs font-bold text-muted">New</dt>
          <dd className="font-display text-3xl font-extrabold">{fresh}</dd>
        </div>
        <div className="rounded-xl border-2 border-ink bg-mint-soft p-3">
          <dt className="text-xs font-bold text-muted">Mastered</dt>
          <dd className="font-display text-3xl font-extrabold">{mastered}</dd>
        </div>
      </dl>

      {due.length > 0 ? (
        <button
          type="button"
          onClick={() => start(due)}
          className="btn btn-primary btn-lg w-fit"
        >
          Review {Math.min(due.length, SESSION_SIZE)} card
          {Math.min(due.length, SESSION_SIZE) === 1 ? '' : 's'}
          <Icon name="right" />
        </button>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="font-bold text-success">You’re all caught up!</p>
          <p className="text-sm text-muted">
            {nextIn !== null
              ? `Next card is due in about ${formatIn(nextIn)}.`
              : 'Nothing scheduled yet.'}
          </p>
          <button type="button" onClick={() => start(cards)} className="btn btn-secondary">
            Review anyway
          </button>
        </div>
      )}
    </div>
  );
}
