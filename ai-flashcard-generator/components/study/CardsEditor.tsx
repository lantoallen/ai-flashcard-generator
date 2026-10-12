'use client';

import { Icon } from '@/components/icons';
import {
  addCard,
  deleteCard,
  updateCard,
  updateSet,
} from '@/lib/storage';
import type { StudySet } from '@/lib/types';

export default function CardsEditor({ set }: { set: StudySet }) {
  const incomplete = set.cards.filter(
    (c) => !c.term.trim() || !c.definition.trim()
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="panel flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="set-title" className="text-sm font-semibold">
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
          <label htmlFor="set-desc" className="text-sm font-semibold">
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
        <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm font-medium text-warn">
          {incomplete} card{incomplete === 1 ? ' is' : 's are'} missing a term or
          definition and will be skipped when studying.
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {set.cards.map((card, i) => (
          <li key={card.id} className="panel flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted">{i + 1}</span>
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
                <label htmlFor={`term-${card.id}`} className="text-xs font-semibold text-muted">
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
                <label htmlFor={`def-${card.id}`} className="text-xs font-semibold text-muted">
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

      <button
        type="button"
        onClick={() => addCard(set.id)}
        className="btn btn-secondary btn-lg w-full border-dashed"
      >
        <Icon name="plus" />
        Add a card
      </button>
    </div>
  );
}
