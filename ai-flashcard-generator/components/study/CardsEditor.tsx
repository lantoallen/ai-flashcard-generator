'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import {
  addCard,
  deleteCard,
  updateCard,
  updateSet,
} from '@/lib/storage';
import type { StudySet } from '@/lib/types';
import { uid } from '@/lib/utils';

type ApiCard = { term: string; definition: string; distractors?: string[] };

export default function CardsEditor({ set }: { set: StudySet }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const incomplete = set.cards.filter(
    (c) => !c.term.trim() || !c.definition.trim()
  ).length;

  async function generateMore() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: set.title.trim() || 'General knowledge',
          count: 5,
          exclude: set.cards.map((c) => c.term).filter((t) => t.trim()),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: 'error', text: data.error || 'Something went wrong.' });
        return;
      }
      const added: ApiCard[] = data.cards ?? [];
      if (added.length === 0) {
        setMessage({ kind: 'error', text: 'The AI had nothing new to add. Try again.' });
        return;
      }
      updateSet(set.id, {
        cards: [
          ...set.cards,
          ...added.map((c) => ({ id: uid(), ...c })),
        ],
      });
      setMessage({
        kind: 'ok',
        text: `Added ${added.length} new card${added.length === 1 ? '' : 's'} at the bottom.`,
      });
    } catch {
      setMessage({ kind: 'error', text: 'Network error. Please try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="panel flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="set-title" className="text-sm font-bold">
            Title
          </label>
          <input
            id="set-title"
            value={set.title}
            maxLength={100}
            onChange={(e) => updateSet(set.id, { title: e.target.value })}
            className="input"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="set-desc" className="text-sm font-bold">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="set-desc"
            value={set.description ?? ''}
            maxLength={200}
            onChange={(e) => updateSet(set.id, { description: e.target.value })}
            className="input"
          />
        </div>
      </div>

      {incomplete > 0 && (
        <p className="rounded-xl border-2 border-ink bg-warn-soft px-4 py-3 text-sm font-semibold text-warn">
          {incomplete} card{incomplete === 1 ? ' is' : 's are'} missing a term or
          definition and will be skipped when studying.
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {set.cards.map((card, i) => (
          <li key={card.id} className="panel-soft flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-muted">{i + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => updateCard(set.id, card.id, { starred: !card.starred })}
                  className={`btn btn-ghost !p-2 ${card.starred ? '!text-warn' : ''}`}
                  aria-label={card.starred ? `Unstar card ${i + 1}` : `Star card ${i + 1}`}
                  aria-pressed={!!card.starred}
                >
                  <Icon name="star" size={16} filled={!!card.starred} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteCard(set.id, card.id)}
                  className="btn btn-ghost !p-2 hover:!text-danger"
                  aria-label={`Delete card ${i + 1}`}
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
              <div className="flex flex-col gap-1">
                <label htmlFor={`term-${card.id}`} className="text-xs font-bold text-muted">
                  Term
                </label>
                <textarea
                  id={`term-${card.id}`}
                  rows={2}
                  value={card.term}
                  onChange={(e) => updateCard(set.id, card.id, { term: e.target.value })}
                  className="input resize-y"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`def-${card.id}`} className="text-xs font-bold text-muted">
                  Definition
                </label>
                <textarea
                  id={`def-${card.id}`}
                  rows={2}
                  value={card.definition}
                  onChange={(e) =>
                    // Old AI distractors no longer fit an edited definition.
                    updateCard(set.id, card.id, {
                      definition: e.target.value,
                      distractors: undefined,
                    })
                  }
                  className="input resize-y"
                />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => addCard(set.id)}
          className="btn btn-secondary btn-lg"
        >
          <Icon name="plus" />
          Add a card
        </button>
        <button
          type="button"
          onClick={generateMore}
          disabled={busy}
          className="btn btn-accent btn-lg"
        >
          {busy ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Thinking…
            </>
          ) : (
            <>
              <Icon name="sparkles" />
              Add 5 more with AI
            </>
          )}
        </button>
      </div>
      {message && (
        <p
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`text-sm font-semibold ${
            message.kind === 'error' ? 'text-danger' : 'text-success'
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
