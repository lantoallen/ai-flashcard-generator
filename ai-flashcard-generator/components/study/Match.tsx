'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { touchProgress } from '@/lib/storage';
import { formatMs, shuffle } from '@/lib/utils';
import { NeedMore, Segmented, type ModeProps } from './shared';

type Tile = { id: string; pairId: string; text: string; kind: 'term' | 'definition' };

type Run = {
  tiles: Tile[];
  pairs: number;
  selected: string | null;
  matched: string[];
  wrong: [string, string] | null;
  misses: number;
  startedAt: number;
  finishedAt: number | null;
};

const DEFAULT_PAIRS = 6;

// Kept outside the component: it is only ever called from event handlers.
const stamp = () => Date.now();

export default function Match({ setId, cards, bestMatchMs, goTo }: ModeProps) {
  const [pairs, setPairs] = useState(DEFAULT_PAIRS);
  const [run, setRun] = useState<Run | null>(null);
  const [now, setNow] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const running = run !== null && run.finishedAt === null;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const maxPairs = Math.min(8, cards.length);
  const chosen = Math.min(pairs, maxPairs);
  // The leaderboard time only counts for the default board size.
  const comparable = chosen === Math.min(DEFAULT_PAIRS, cards.length);

  function start() {
    const picked = shuffle(cards).slice(0, chosen);
    const tiles: Tile[] = picked.flatMap((c) => [
      { id: `${c.id}-t`, pairId: c.id, text: c.term, kind: 'term' as const },
      { id: `${c.id}-d`, pairId: c.id, text: c.definition, kind: 'definition' as const },
    ]);
    const t = stamp();
    setNow(t);
    setNewBest(false);
    setRun({
      tiles: shuffle(tiles),
      pairs: picked.length,
      selected: null,
      matched: [],
      wrong: null,
      misses: 0,
      startedAt: t,
      finishedAt: null,
    });
  }

  function choose(tile: Tile) {
    if (!run || run.finishedAt !== null || run.wrong) return;
    if (run.matched.includes(tile.pairId) || run.selected === tile.id) return;

    if (run.selected === null) {
      setRun({ ...run, selected: tile.id });
      return;
    }

    const first = run.tiles.find((t) => t.id === run.selected)!;
    if (first.pairId === tile.pairId && first.kind !== tile.kind) {
      const matched = [...run.matched, tile.pairId];
      if (matched.length === run.pairs) {
        const finishedAt = stamp();
        const elapsed = finishedAt - run.startedAt;
        const improved = comparable && (bestMatchMs === undefined || elapsed < bestMatchMs);
        touchProgress(setId, { bestMatchMs: improved ? elapsed : bestMatchMs });
        setNewBest(improved && bestMatchMs !== undefined);
        setNow(finishedAt);
        setRun({ ...run, matched, selected: null, finishedAt });
      } else {
        setRun({ ...run, matched, selected: null });
      }
      return;
    }

    setRun({ ...run, wrong: [first.id, tile.id], misses: run.misses + 1 });
    timer.current = setTimeout(() => {
      setRun((r) => (r ? { ...r, wrong: null, selected: null } : r));
    }, 650);
  }

  if (cards.length < 3) return <NeedMore min={3} goTo={goTo} />;

  if (!run) {
    return (
      <div className="panel flex flex-col gap-6 p-6">
        <div>
          <h2 className="text-xl font-semibold">Match</h2>
          <p className="mt-1 text-sm text-muted">
            Tap a term, then its definition. Clear the board as fast as you can.
            {bestMatchMs !== undefined && (
              <>
                {' '}
                Your best ({Math.min(DEFAULT_PAIRS, cards.length)} pairs):{' '}
                <strong>{formatMs(bestMatchMs)}</strong>.
              </>
            )}
          </p>
        </div>
        <Segmented
          label="Board size"
          value={String(chosen)}
          onChange={(v) => setPairs(Number(v))}
          options={[4, 6, 8]
            .filter((n) => n <= maxPairs || n === 4)
            .map((n) => ({
              value: String(Math.min(n, maxPairs)),
              label: `${Math.min(n, maxPairs)} pairs`,
            }))
            .filter((o, i, all) => all.findIndex((x) => x.value === o.value) === i)}
        />
        <button type="button" onClick={start} className="btn btn-primary btn-lg w-fit">
          Start match
          <Icon name="right" />
        </button>
      </div>
    );
  }

  const elapsed = (run.finishedAt ?? now) - run.startedAt;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="chip text-base tabular-nums">
            <Icon name="clock" size={16} />
            {formatMs(elapsed)}
          </span>
          <span className="text-muted">
            {run.matched.length}/{run.pairs} matched · {run.misses} miss
            {run.misses === 1 ? '' : 'es'}
          </span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={start} className="btn btn-secondary">
            <Icon name="refresh" size={16} />
            Restart
          </button>
          <button type="button" onClick={() => setRun(null)} className="btn btn-ghost">
            Quit
          </button>
        </div>
      </div>

      {run.finishedAt !== null && (
        <div role="status" className="panel flex flex-col items-center gap-1 px-6 py-8 text-center">
          <p className="brand-text text-4xl font-bold">{formatMs(elapsed)}</p>
          <p className="font-semibold">
            Board cleared with {run.misses} miss{run.misses === 1 ? '' : 'es'}.
          </p>
          {newBest && <p className="text-sm font-medium text-success">New personal best!</p>}
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={start} className="btn btn-primary">
              Play again
            </button>
            <button type="button" onClick={() => goTo('quiz')} className="btn btn-secondary">
              Take a quiz
            </button>
          </div>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {run.tiles.map((tile) => {
          const matched = run.matched.includes(tile.pairId);
          const selected = run.selected === tile.id;
          const wrong = run.wrong?.includes(tile.id) ?? false;
          let state =
            'border-line bg-surface hover:border-primary hover:bg-surface-2';
          if (matched) state = 'border-success bg-success-soft opacity-0 pointer-events-none';
          else if (wrong) state = 'border-danger bg-danger-soft shake';
          else if (selected) state = 'border-primary bg-primary-soft';
          return (
            <li key={tile.id}>
              <button
                type="button"
                disabled={matched || run.finishedAt !== null}
                onClick={() => choose(tile)}
                aria-pressed={selected}
                className={`flex min-h-24 w-full items-center justify-center rounded-xl border-2 p-3 text-center text-sm font-medium transition-all duration-300 ${
                  tile.kind === 'term' ? 'font-semibold' : ''
                } ${state}`}
              >
                {tile.text}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
