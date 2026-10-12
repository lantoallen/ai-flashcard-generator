'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icons';
import { saveSet } from '@/lib/storage';
import type { SetSource, StudySet } from '@/lib/types';
import { parseCards, uid } from '@/lib/utils';

type Tab = 'notes' | 'topic' | 'import';
type Level = 'beginner' | 'intermediate' | 'advanced';

const TABS: { id: Tab; label: string; icon: 'edit' | 'search' | 'upload' }[] = [
  { id: 'notes', label: 'Paste notes', icon: 'edit' },
  { id: 'topic', label: 'Enter a topic', icon: 'search' },
  { id: 'import', label: 'Import list', icon: 'upload' },
];

const LEVELS: { id: Level; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const IDEAS = [
  'Photosynthesis',
  'The French Revolution',
  'Big-O notation',
  'World War II causes',
  'The human heart',
  'Basic Spanish verbs',
];

const MAX_NOTES = 8000;
const MAX_TOPIC = 200;

export default function CreateForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('notes');
  const [notes, setNotes] = useState('');
  const [topic, setTopic] = useState('');
  const [importText, setImportText] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [count, setCount] = useState(10);
  const [level, setLevel] = useState<Level>('intermediate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const parsed = tab === 'import' ? parseCards(importText) : [];
  const canGenerate =
    tab === 'notes'
      ? notes.trim().length >= 20
      : tab === 'topic'
        ? topic.trim().length > 0
        : parsed.length >= 2;

  function finish(
    title: string,
    source: SetSource,
    cards: { term: string; definition: string; distractors?: string[] }[]
  ) {
    const now = Date.now();
    const set: StudySet = {
      id: uid(),
      title,
      source,
      createdAt: now,
      updatedAt: now,
      cards: cards.map((c) => ({ id: uid(), ...c })),
    };
    if (!saveSet(set)) {
      setError(
        'Your browser couldn’t save this set (storage is full or blocked). Delete old sets or allow site storage.'
      );
      return;
    }
    router.push(`/study/${set.id}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canGenerate || loading) return;
    setError('');

    if (tab === 'import') {
      finish(importTitle.trim() || 'Imported set', 'import', parsed);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          tab === 'notes'
            ? { notes, count, level }
            : { topic, count, level }
        ),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      finish(data.title || topic || 'Untitled set', tab, data.cards);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function startBlank() {
    finish('Untitled set', 'manual', [
      { term: '', definition: '' },
      { term: '', definition: '' },
      { term: '', definition: '' },
    ]);
  }

  return (
    <form onSubmit={submit} className="panel flex flex-col gap-6 p-5 sm:p-7">
      <div
        role="tablist"
        aria-label="How do you want to start?"
        className="grid grid-cols-3 gap-1 rounded-xl border-2 border-ink bg-surface-2 p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setError('');
            }}
            className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'bg-ink text-bg'
                : 'text-muted hover:text-fg'
            }`}
          >
            <Icon name={t.icon} size={16} />
            <span className="max-sm:hidden">{t.label}</span>
            <span className="sm:hidden">{t.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {tab === 'notes' && (
        <div className="flex flex-col gap-2">
          <label htmlFor="notes" className="font-semibold">
            Your notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={MAX_NOTES}
            rows={10}
            placeholder="Paste lecture notes, a textbook section, an article…"
            className="input resize-y"
          />
          <p className="text-right text-xs text-muted">
            {notes.length.toLocaleString()} / {MAX_NOTES.toLocaleString()}
          </p>
        </div>
      )}

      {tab === 'topic' && (
        <div className="flex flex-col gap-3">
          <label htmlFor="topic" className="font-semibold">
            What do you want to learn?
          </label>
          <input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={MAX_TOPIC}
            placeholder="e.g. Photosynthesis, The French Revolution, Big-O notation"
            className="input"
          />
          <div className="flex flex-wrap gap-2">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setTopic(idea)}
                className="chip cursor-pointer transition-colors hover:bg-primary-soft hover:text-primary"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'import' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="import-title" className="font-semibold">
              Set title
            </label>
            <input
              id="import-title"
              value={importTitle}
              onChange={(e) => setImportTitle(e.target.value)}
              maxLength={100}
              placeholder="Imported set"
              className="input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="import-text" className="font-semibold">
              Your cards
            </label>
            <textarea
              id="import-text"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={9}
              placeholder={'One card per line:\nmitochondria - powerhouse of the cell\nnucleus, holds the DNA'}
              className="input resize-y font-mono text-sm"
            />
            <p className="text-sm text-muted">
              Separate the term and definition with a tab, “ - ”, a comma, a
              semicolon or a colon.{' '}
              <strong className={parsed.length >= 2 ? 'text-success' : ''}>
                {parsed.length} card{parsed.length === 1 ? '' : 's'} detected.
              </strong>
            </p>
          </div>
          <button
            type="button"
            onClick={startBlank}
            className="btn btn-ghost w-fit"
          >
            <Icon name="plus" size={16} />
            Or start with a blank set
          </button>
        </div>
      )}

      {tab !== 'import' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="count" className="flex justify-between font-semibold">
              Number of cards <span className="text-primary">{count}</span>
            </label>
            <input
              id="count"
              type="range"
              min={5}
              max={20}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="accent-[var(--primary)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold" id="level-label">
              Difficulty
            </span>
            <div
              role="radiogroup"
              aria-labelledby="level-label"
              className="grid grid-cols-3 gap-1 rounded-xl border-2 border-ink bg-surface-2 p-1"
            >
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={level === l.id}
                  onClick={() => setLevel(l.id)}
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                    level === l.id
                      ? 'bg-ink text-bg'
                      : 'text-muted hover:text-fg'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!canGenerate || loading}
          className="btn btn-primary btn-lg"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Generating…
            </>
          ) : tab === 'import' ? (
            <>
              <Icon name="check" />
              Create set
            </>
          ) : (
            <>
              <Icon name="sparkles" />
              Generate flashcards
            </>
          )}
        </button>
        {loading && (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="btn btn-ghost"
          >
            Cancel
          </button>
        )}
        {loading && (
          <p className="text-sm text-muted" aria-live="polite">
            This usually takes 5–15 seconds.
          </p>
        )}
      </div>
    </form>
  );
}
