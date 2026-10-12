'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from './icons';
import Modal from './Modal';
import { useSocial } from './SocialProvider';
import TagInput from './TagInput';
import { createPost } from '@/lib/community';
import { LIMITS, normalizeTags, type Visibility } from '@/lib/social';
import type { StudySet } from '@/lib/types';
import { validCards } from '@/lib/utils';

const MAX_CARDS = 300;

/** Publish one of your sets to the community, publicly or only for yourself. */
export default function PublishDialog({
  set,
  onClose,
}: {
  set: StudySet;
  onClose: () => void;
}) {
  const social = useSocial();
  const cards = validCards(set.cards);

  const [title, setTitle] = useState(set.title.slice(0, LIMITS.postTitle));
  const [description, setDescription] = useState((set.description ?? '').slice(0, LIMITS.postDescription));
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const tooMany = cards.length > MAX_CARDS;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!social.client || !social.userId || busy || tooMany || cards.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const id = await createPost(social.client, social.userId, {
        title: title.trim(),
        description: description.trim(),
        tags,
        visibility,
        // Only the content: never progress, stars or schedules.
        cards: cards.map((c) => ({
          term: c.term.trim(),
          definition: c.definition.trim(),
          ...(c.distractors?.length ? { distractors: c.distractors } : {}),
        })),
      });
      setPublishedId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish your set.');
    } finally {
      setBusy(false);
    }
  }

  if (publishedId) {
    return (
      <Modal title="Published" onClose={onClose}>
        <div className="flex flex-col items-start gap-4">
          <p className="font-semibold">
            {visibility === 'public'
              ? 'Your set is live in the community.'
              : 'Saved as private. Only you can see it.'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/community/${publishedId}`} className="btn btn-primary">
              View post
            </Link>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Share to the community" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        {tooMany && (
          <p role="alert" className="rounded-xl border-2 border-ink bg-warn-soft px-4 py-3 text-sm font-semibold text-warn">
            This set has {cards.length} cards. Shared sets can have up to {MAX_CARDS}.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="post-title" className="text-sm font-bold">Title</label>
          <input
            id="post-title"
            value={title}
            maxLength={LIMITS.postTitle}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="post-desc" className="text-sm font-bold">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="post-desc"
            value={description}
            maxLength={LIMITS.postDescription}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this set about? Who is it for?"
            className="input resize-y"
          />
        </div>

        <TagInput
          label="Tags"
          tags={tags}
          onChange={(t) => setTags(normalizeTags(t, LIMITS.postTags))}
          max={LIMITS.postTags}
          placeholder="e.g. biology, exam prep"
          hint="Tags help people find your set."
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-bold">Who can see it?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['public', 'Public', 'Anyone signed in can find, like and save it.', 'sparkles'],
                ['private', 'Private', 'Only you. A cloud backup of this set.', 'lock'],
              ] as const
            ).map(([value, label, hint, icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={visibility === value}
                onClick={() => setVisibility(value)}
                className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-colors duration-200 ${
                  visibility === value ? 'border-ink bg-primary-soft' : 'border-line hover:border-ink'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-extrabold">
                  <Icon name={icon} size={16} />
                  {label}
                </span>
                <span className="text-xs text-muted">{hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <p className="text-xs text-muted">
          Only the cards are shared, not your progress. Don’t include anything private or
          copyrighted.
        </p>

        {error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy || tooMany || cards.length === 0 || !title.trim()}
            className="btn btn-primary"
          >
            {busy ? 'Publishing…' : visibility === 'public' ? 'Publish' : 'Save privately'}
          </button>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
