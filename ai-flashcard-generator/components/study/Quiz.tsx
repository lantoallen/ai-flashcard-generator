'use client';

import { useEffect, useState } from 'react';
import Confetti from '@/components/Confetti';
import { Icon } from '@/components/icons';
import { logActivity } from '@/lib/activity';
import { petReact } from '@/lib/pet';
import { buildQuiz, type Direction, type QuizQuestion } from '@/lib/quiz';
import { touchProgress } from '@/lib/storage';
import {
  filterCards,
  isTypingTarget,
  NeedMore,
  ProgressBar,
  Results,
  Segmented,
  SourcePicker,
  type ModeProps,
  type SourceFilter,
} from './shared';

type Run = {
  questions: QuizQuestion[];
  idx: number;
  picked: string | null;
  answers: string[];
  done: boolean;
};

export default function Quiz({ setId, cards, bestQuiz, goTo }: ModeProps) {
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [direction, setDirection] = useState<Direction>('term');
  const [size, setSize] = useState(10);
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState('');
  const [newBest, setNewBest] = useState(false);

  const eligible = filterCards(cards, filter);
  const active = run && !run.done ? run : null;

  function start(pool: typeof cards, count: number) {
    const questions = buildQuiz(pool, cards, count, direction);
    if (questions.length === 0) {
      setError('Not enough different cards to build answer choices.');
      return;
    }
    setError('');
    setNewBest(false);
    setRun({ questions, idx: 0, picked: null, answers: [], done: false });
  }

  function pick(option: string) {
    if (run && run.picked === null) {
      logActivity(1);
      petReact(option === run.questions[run.idx].answer ? 'cheer' : 'oops');
    }
    setRun((r) =>
      r && r.picked === null
        ? { ...r, picked: option, answers: [...r.answers, option] }
        : r
    );
  }

  function next() {
    if (!run || run.picked === null) return;
    if (run.idx + 1 < run.questions.length) {
      setRun({ ...run, idx: run.idx + 1, picked: null });
      return;
    }
    const correct = run.questions.filter((q, i) => run.answers[i] === q.answer).length;
    const pct = Math.round((correct / run.questions.length) * 100);
    const counts = run.questions.length >= Math.min(5, cards.length);
    if (counts) {
      const improved = pct > (bestQuiz ?? -1);
      touchProgress(setId, { bestQuiz: improved ? pct : bestQuiz });
      setNewBest(improved && bestQuiz !== undefined);
    } else {
      touchProgress(setId, {});
    }
    setRun({ ...run, done: true });
  }

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || !active) return;
      const n = Number(e.key);
      if (n >= 1 && n <= active.questions[active.idx].options.length) {
        pick(active.questions[active.idx].options[n - 1]);
      } else if (e.key === 'Enter' && active.picked !== null) {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  if (cards.length < 2) return <NeedMore min={2} goTo={goTo} />;

  // Results
  if (run?.done) {
    const items = run.questions.map((q, i) => ({
      prompt: q.prompt,
      answer: q.answer,
      yourAnswer: run.answers[i],
      correct: run.answers[i] === q.answer,
    }));
    const correct = items.filter((i) => i.correct).length;
    const missedIds = new Set(
      run.questions.filter((q, i) => run.answers[i] !== q.answer).map((q) => q.cardId)
    );
    return (
      <>
        {correct / items.length >= 0.8 && <Confetti />}
      <Results
        correct={correct}
        total={items.length}
        items={items}
        note={newBest ? 'New personal best!' : undefined}
        onRetryMissed={() =>
          start(cards.filter((c) => missedIds.has(c.id)), missedIds.size)
        }
        onNew={() => setRun(null)}
      />
      </>
    );
  }

  // Question
  if (active) {
    const q = active.questions[active.idx];
    const answered = active.picked !== null;
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="shrink-0 tabular-nums">
            {active.idx + 1} / {active.questions.length}
          </span>
          <ProgressBar value={active.idx + (answered ? 1 : 0)} max={active.questions.length} />
          <button type="button" onClick={() => setRun(null)} className="btn btn-ghost !px-2 !py-1">
            Quit
          </button>
        </div>

        <div className="panel p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {q.side === 'term' ? 'Choose the definition' : 'Choose the term'}
          </p>
          <p className="mt-3 text-xl font-semibold leading-snug sm:text-2xl">{q.prompt}</p>
        </div>

        <ul className="grid gap-3">
          {q.options.map((opt, i) => {
            const isAnswer = opt === q.answer;
            const isPicked = active.picked === opt;
            let state = 'border-line bg-surface hover:border-primary hover:bg-surface-2';
            if (answered) {
              if (isAnswer) state = 'border-success bg-success-soft';
              else if (isPicked) state = 'border-danger bg-danger-soft shake';
              else state = 'border-line bg-surface opacity-60';
            }
            return (
              <li key={opt}>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => pick(opt)}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors disabled:cursor-default ${state}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-sm font-bold text-muted">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{opt}</span>
                  {answered && isAnswer && (
                    <Icon name="check" className="ml-auto mt-1 shrink-0 text-success" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {answered && (
          <div className="flex items-center justify-between gap-3" aria-live="polite">
            <p
              className={`font-semibold ${
                active.picked === q.answer ? 'text-success' : 'text-danger'
              }`}
            >
              {active.picked === q.answer ? 'Correct!' : 'Not quite.'}
            </p>
            <button type="button" onClick={next} className="btn btn-primary" autoFocus>
              {active.idx + 1 < active.questions.length ? 'Next' : 'See results'}
              <Icon name="right" size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Setup
  const maxQ = eligible.length;
  const sizes = [5, 10, 20].filter((n) => n < maxQ);
  return (
    <div className="panel flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">Quiz</h2>
        <p className="mt-1 text-sm text-muted">
          Multiple choice with answer options written to be tricky.
          {bestQuiz !== undefined && (
            <>
              {' '}
              Your best: <strong>{bestQuiz}%</strong>.
            </>
          )}
        </p>
      </div>
      <SourcePicker cards={cards} value={filter} onChange={setFilter} />
      <Segmented
        label="Questions show"
        value={direction}
        onChange={setDirection}
        options={[
          { value: 'term', label: 'Term → pick definition' },
          { value: 'definition', label: 'Definition → pick term' },
          { value: 'mixed', label: 'Mixed' },
        ]}
      />
      <Segmented
        label="Number of questions"
        value={String(Math.min(size, maxQ))}
        onChange={(v) => setSize(Number(v))}
        options={[
          ...sizes.map((n) => ({ value: String(n), label: String(n) })),
          { value: String(maxQ), label: `All (${maxQ})` },
        ]}
      />
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={maxQ < 2}
        onClick={() => start(eligible, Math.min(size, maxQ))}
        className="btn btn-primary btn-lg w-fit"
      >
        Start quiz
        <Icon name="right" />
      </button>
    </div>
  );
}
