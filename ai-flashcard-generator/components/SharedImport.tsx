'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from './icons';
import { decodeSet } from '@/lib/share';
import { saveSet } from '@/lib/storage';
import type { StudySet } from '@/lib/types';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; set: StudySet };

/** Reads a set out of the URL hash and lets the visitor add it to their library. */
export default function SharedImport() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const hash = window.location.hash.replace(/^#/, '');
    decodeSet(hash).then((set) => {
      if (!cancelled) setState(set ? { status: 'ready', set } : { status: 'error' });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return <div className="panel h-56 animate-pulse bg-surface-2" aria-busy="true" />;
  }

  if (state.status === 'error') {
    return (
      <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
        <h2 className="font-display text-2xl font-extrabold">This link doesn’t work</h2>
        <p className="max-w-md text-muted">
          It may have been cut off when it was copied, or it was made by a
          browser that doesn’t support shared sets. Ask for a new link.
        </p>
        <Link href="/create" className="btn btn-primary">
          Create your own set
        </Link>
      </div>
    );
  }

  const { set } = state;

  function save() {
    if (saveSet(set)) router.push(`/study/${set.id}`);
    else setSaveError(true);
  }

  return (
    <div className="panel flex flex-col gap-5 p-6">
      <div>
        <span className="eyebrow bg-sun">Someone shared a set</span>
        <h2 className="font-display mt-3 text-3xl font-extrabold">{set.title}</h2>
        {set.description && <p className="mt-1 text-muted">{set.description}</p>}
        <p className="mt-2 text-sm font-semibold text-muted">{set.cards.length} cards</p>
      </div>

      <ul className="flex flex-col gap-2">
        {set.cards.slice(0, 5).map((c) => (
          <li key={c.id} className="panel-soft p-3">
            <p className="font-bold">{c.term}</p>
            <p className="text-sm text-muted">{c.definition}</p>
          </li>
        ))}
        {set.cards.length > 5 && (
          <li className="text-sm font-semibold text-muted">
            …and {set.cards.length - 5} more
          </li>
        )}
      </ul>

      {saveError && (
        <p role="alert" className="text-sm font-semibold text-danger">
          Your browser couldn’t save this set (storage is full or blocked).
        </p>
      )}

      <button type="button" onClick={save} className="btn btn-primary btn-lg w-fit">
        <Icon name="plus" />
        Add to my library
      </button>
    </div>
  );
}
