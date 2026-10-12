'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CardRow, { type RowField } from './CardRow';
import { Icon } from './icons';
import { saveSet } from '@/lib/storage';
import type { StudySet } from '@/lib/types';
import { nowMs, parseCards, uid } from '@/lib/utils';

type Row = { id: string; term: string; definition: string };

const DRAFT_KEY = 'flashly:draft:v1';
const PAGE = 100; // rows rendered at a time, so very large sets stay fast
const START_ROWS = 5;

function blankRows(n: number): Row[] {
  return Array.from({ length: n }, () => ({ id: uid(), term: '', definition: '' }));
}

type Draft = { title: string; description: string; rows: Row[] };

function loadDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (!Array.isArray(d.rows) || d.rows.length === 0) return null;
    return {
      title: typeof d.title === 'string' ? d.title : '',
      description: typeof d.description === 'string' ? d.description : '',
      rows: d.rows.map((r) => ({
        id: typeof r.id === 'string' ? r.id : uid(),
        term: String(r.term ?? ''),
        definition: String(r.definition ?? ''),
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Build a set by hand, like Quizlet: a title, then as many term/definition
 * cards as you like. The draft is saved automatically.
 */
export default function ManualBuilder() {
  const router = useRouter();
  const [draft] = useState(loadDraft);
  const [title, setTitle] = useState(draft?.title ?? '');
  const [description, setDescription] = useState(draft?.description ?? '');
  const [rows, setRows] = useState<Row[]>(() => draft?.rows ?? blankRows(START_ROWS));
  const [visible, setVisible] = useState(PAGE);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Autosave the draft shortly after the last change.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, description, rows }));
      } catch {
        /* storage full: the draft just won't survive a reload */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [title, description, rows]);

  const complete = rows.filter((r) => r.term.trim() && r.definition.trim());
  const canCreate = complete.length >= 2 && title.trim().length > 0;

  const change = useCallback((id: string, field: RowField, value: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }, []);

  const remove = useCallback((id: string) => {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  }, []);

  const move = useCallback((id: string, dir: -1 | 1) => {
    setRows((rs) => {
      const i = rs.findIndex((r) => r.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const addCard = useCallback(() => {
    const row: Row = { id: uid(), term: '', definition: '' };
    setRows((rs) => {
      setVisible((v) => Math.max(v, rs.length + 1));
      return [...rs, row];
    });
    setFocusId(row.id);
  }, []);

  function addBulk() {
    const parsed = parseCards(bulkText);
    if (parsed.length === 0) {
      setError('No cards found. Put one card per line, with the term and definition separated by a tab, “ - ”, a comma or a colon.');
      return;
    }
    setError('');
    setRows((rs) => {
      // Replace untouched blank rows rather than leaving gaps in the middle.
      const kept = rs.filter((r) => r.term.trim() || r.definition.trim());
      const next = [...kept, ...parsed.map((p) => ({ id: uid(), ...p }))];
      setVisible((v) => Math.max(v, PAGE));
      return next;
    });
    setBulkText('');
    setBulkOpen(false);
  }

  function create() {
    if (!canCreate) return;
    const now = nowMs();
    const set: StudySet = {
      id: uid(),
      title: title.trim().slice(0, 100),
      description: description.trim().slice(0, 200) || undefined,
      source: 'manual',
      createdAt: now,
      updatedAt: now,
      cards: complete.map((r) => ({
        id: uid(),
        term: r.term.trim(),
        definition: r.definition.trim(),
      })),
    };
    if (!saveSet(set)) {
      setError(
        'Your browser couldn’t save this set (its storage is full or blocked). Delete a set you no longer need, or sign in so sets are saved to your account.'
      );
      return;
    }
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    router.push(`/study/${set.id}`);
  }

  function clearAll() {
    if (!window.confirm('Clear this draft and start again?')) return;
    setTitle('');
    setDescription('');
    setRows(blankRows(START_ROWS));
    setVisible(PAGE);
  }

  const shown = rows.slice(0, visible);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="manual-title" className="font-bold">
            Title
          </label>
          <input
            id="manual-title"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title, like “Chapter 4: The Cell”"
            className="input text-lg font-bold"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="manual-desc" className="font-bold">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="manual-desc"
            value={description}
            maxLength={200}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description…"
            className="input"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl font-extrabold">
          Terms and definitions{' '}
          <span className="text-base font-bold text-muted">
            ({complete.length} ready · {rows.length} total)
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBulkOpen((o) => !o)}
            aria-expanded={bulkOpen}
            className="btn btn-secondary !py-2"
          >
            <Icon name="list" size={16} />
            Paste many
          </button>
          <button type="button" onClick={clearAll} className="btn btn-ghost !py-2">
            Clear
          </button>
        </div>
      </div>

      {bulkOpen && (
        <div className="panel-soft flex flex-col gap-3 p-4">
          <label htmlFor="bulk" className="text-sm font-bold">
            One card per line
          </label>
          <textarea
            id="bulk"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            placeholder={'mitochondria - powerhouse of the cell\nnucleus, holds the DNA\nribosome: makes proteins'}
            className="input resize-y font-mono text-sm"
          />
          <div className="flex gap-2">
            <button type="button" onClick={addBulk} className="btn btn-primary !py-2">
              Add {parseCards(bulkText).length || ''} cards
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkOpen(false);
                setBulkText('');
              }}
              className="btn btn-ghost !py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {shown.map((r, i) => (
          <CardRow
            key={r.id}
            id={r.id}
            index={i}
            term={r.term}
            definition={r.definition}
            isFirst={i === 0}
            isLast={i === rows.length - 1}
            focusTerm={focusId === r.id}
            onChange={change}
            onDelete={remove}
            onMove={move}
            onAddAfter={addCard}
          />
        ))}
      </ol>

      {rows.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE)}
          className="btn btn-secondary"
        >
          Show {Math.min(PAGE, rows.length - visible)} more ({rows.length - visible} hidden)
        </button>
      )}

      <div ref={bottomRef}>
        <button type="button" onClick={addCard} className="btn btn-secondary btn-lg w-full border-dashed">
          <Icon name="plus" />
          Add a card
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          Tip: press <kbd>Tab</kbd> in the last definition to add the next card.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border-2 border-ink bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t-2 border-dashed border-line pt-5">
        <button
          type="button"
          onClick={create}
          disabled={!canCreate}
          className="btn btn-primary btn-lg"
        >
          <Icon name="check" />
          Create set ({complete.length} cards)
        </button>
        {!canCreate && (
          <p className="text-sm text-muted">
            {title.trim().length === 0
              ? 'Add a title to continue.'
              : 'Fill in at least 2 cards (a term and a definition each).'}
          </p>
        )}
      </div>
    </div>
  );
}
