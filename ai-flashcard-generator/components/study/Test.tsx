'use client';

import { useState } from 'react';
import Confetti from '@/components/Confetti';
import { Icon } from '@/components/icons';
import { logActivity } from '@/lib/activity';
import { petReact } from '@/lib/pet';
import { buildQuestion } from '@/lib/quiz';
import { touchProgress } from '@/lib/storage';
import type { Card } from '@/lib/types';
import { checkTyped, shuffle } from '@/lib/utils';
import {
  filterCards,
  NeedMore,
  Results,
  Segmented,
  SourcePicker,
  type ModeProps,
  type ReviewItem,
  type SourceFilter,
} from './shared';

type Kind = 'mc' | 'tf' | 'written';

type Question =
  | { kind: 'mc'; cardId: string; prompt: string; options: string[]; answer: string }
  | { kind: 'tf'; cardId: string; term: string; shown: string; truth: boolean }
  | { kind: 'written'; cardId: string; prompt: string; answer: string };

const KINDS: { id: Kind; label: string }[] = [
  { id: 'mc', label: 'Multiple choice' },
  { id: 'tf', label: 'True / false' },
  { id: 'written', label: 'Written' },
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function buildTest(cards: Card[], pool: Card[], count: number, kinds: Kind[]): Question[] {
  const questions: Question[] = [];
  for (const card of shuffle(cards).slice(0, count)) {
    let kind = pick(kinds);

    if (kind === 'mc') {
      const q = buildQuestion(card, pool, Math.random() < 0.5 ? 'term' : 'definition');
      if (q) {
        questions.push({
          kind: 'mc',
          cardId: card.id,
          prompt: q.prompt,
          options: q.options,
          answer: q.answer,
        });
        continue;
      }
      kind = 'tf'; // not enough different cards for choices
    }

    if (kind === 'tf') {
      const others = pool.filter((c) => c.id !== card.id && c.definition !== card.definition);
      const truth = others.length === 0 || Math.random() < 0.5;
      questions.push({
        kind: 'tf',
        cardId: card.id,
        term: card.term,
        shown: truth ? card.definition : pick(others).definition,
        truth,
      });
      continue;
    }

    questions.push({
      kind: 'written',
      cardId: card.id,
      prompt: card.definition,
      answer: card.term,
    });
  }
  return questions;
}

type Taking = { questions: Question[]; answers: Record<number, string>; submitted: boolean };

export default function Test({ setId, cards, goTo }: ModeProps) {
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [size, setSize] = useState(10);
  const [kinds, setKinds] = useState<Kind[]>(['mc', 'tf', 'written']);
  const [run, setRun] = useState<Taking | null>(null);

  const eligible = filterCards(cards, filter);
  const maxQ = eligible.length;

  function start(pool: Card[], count: number) {
    setRun({ questions: buildTest(pool, cards, count, kinds), answers: {}, submitted: false });
  }

  function toggleKind(k: Kind) {
    setKinds((prev) => {
      if (prev.includes(k)) return prev.length > 1 ? prev.filter((x) => x !== k) : prev;
      return [...prev, k];
    });
  }

  if (cards.length < 2) return <NeedMore min={2} goTo={goTo} />;

  // ---- Results
  if (run?.submitted) {
    const items: (ReviewItem & { cardId: string })[] = run.questions.map((q, i) => {
      const given = (run.answers[i] ?? '').trim();
      if (q.kind === 'mc') {
        return {
          cardId: q.cardId,
          prompt: q.prompt,
          answer: q.answer,
          yourAnswer: given,
          correct: given === q.answer,
        };
      }
      if (q.kind === 'tf') {
        const answer = q.truth ? 'True' : 'False';
        return {
          cardId: q.cardId,
          prompt: `${q.term}: “${q.shown}”`,
          answer,
          yourAnswer: given,
          correct: given === answer,
        };
      }
      return {
        cardId: q.cardId,
        prompt: q.prompt,
        answer: q.answer,
        yourAnswer: given,
        correct: given !== '' && checkTyped(given, q.answer) !== 'wrong',
      };
    });
    const correct = items.filter((i) => i.correct).length;
    const missed = new Set(items.filter((i) => !i.correct).map((i) => i.cardId));
    return (
      <>
        {correct / items.length >= 0.8 && <Confetti />}
        <Results
          correct={correct}
          total={items.length}
          items={items}
          onRetryMissed={() => start(cards.filter((c) => missed.has(c.id)), missed.size)}
          onNew={() => setRun(null)}
        />
      </>
    );
  }

  // ---- Taking the test
  if (run) {
    const answered = Object.values(run.answers).filter((a) => a.trim() !== '').length;
    const setAnswer = (i: number, value: string) =>
      setRun((r) => (r ? { ...r, answers: { ...r.answers, [i]: value } } : r));

    function submit() {
      if (!run) return;
      logActivity(answered || 1);
      petReact('party', 'Test submitted. Nice work!');
      touchProgress(setId, {});
      setRun({ ...run, submitted: true });
    }

    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-muted">
            {answered} of {run.questions.length} answered
          </p>
          <button type="button" onClick={() => setRun(null)} className="btn btn-ghost !px-2 !py-1">
            Quit
          </button>
        </div>

        {run.questions.map((q, i) => (
          <fieldset key={i} className="panel flex flex-col gap-4 p-5">
            <legend className="sr-only">Question {i + 1}</legend>
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-sun text-sm font-extrabold text-[#1b1033]">
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-muted">
                  {q.kind === 'mc'
                    ? 'Multiple choice'
                    : q.kind === 'tf'
                      ? 'True or false?'
                      : 'Written: type the term'}
                </p>
                <p className="mt-1 text-lg font-bold leading-snug">
                  {q.kind === 'tf' ? (
                    <>
                      <span className="text-primary">{q.term}</span> means “{q.shown}”
                    </>
                  ) : (
                    q.prompt
                  )}
                </p>
              </div>
            </div>

            {q.kind === 'mc' && (
              <div className="grid gap-2" role="radiogroup" aria-label={`Question ${i + 1} answers`}>
                {q.options.map((opt) => {
                  const selected = run.answers[i] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setAnswer(i, opt)}
                      className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition-colors ${
                        selected
                          ? 'border-ink bg-primary-soft'
                          : 'border-line bg-surface hover:border-ink'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {q.kind === 'tf' && (
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={`Question ${i + 1} answer`}>
                {['True', 'False'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={run.answers[i] === opt}
                    onClick={() => setAnswer(i, opt)}
                    className={`btn ${run.answers[i] === opt ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.kind === 'written' && (
              <input
                aria-label={`Question ${i + 1} answer`}
                autoComplete="off"
                value={run.answers[i] ?? ''}
                onChange={(e) => setAnswer(i, e.target.value)}
                placeholder="Type your answer…"
                className="input"
              />
            )}
          </fieldset>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={submit} className="btn btn-primary btn-lg">
            <Icon name="check" />
            Submit test
          </button>
          {answered < run.questions.length && (
            <p className="text-sm font-semibold text-warn">
              {run.questions.length - answered} unanswered. They’ll count as wrong.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---- Setup
  const sizes = [5, 10, 20].filter((n) => n < maxQ);
  return (
    <div className="panel flex flex-col gap-6 p-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold">Practice test</h2>
        <p className="mt-1 text-sm text-muted">
          Like a real exam: a mix of question types, no feedback until you
          submit, then a full review.
        </p>
      </div>
      <SourcePicker cards={cards} value={filter} onChange={setFilter} />
      <Segmented
        label="Number of questions"
        value={String(Math.min(size, maxQ))}
        onChange={(v) => setSize(Number(v))}
        options={[
          ...sizes.map((n) => ({ value: String(n), label: String(n) })),
          { value: String(maxQ), label: `All (${maxQ})` },
        ]}
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold">Question types</span>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => {
            const on = kinds.includes(k.id);
            return (
              <button
                key={k.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleKind(k.id)}
                className={`btn !py-2 ${on ? 'btn-primary' : 'btn-secondary'}`}
              >
                {on && <Icon name="check" size={16} />}
                {k.label}
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        disabled={maxQ < 2}
        onClick={() => start(eligible, Math.min(size, maxQ))}
        className="btn btn-primary btn-lg w-fit"
      >
        Start test
        <Icon name="right" />
      </button>
    </div>
  );
}
