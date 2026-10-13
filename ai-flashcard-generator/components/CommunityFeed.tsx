'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from './icons';
import Modal from './Modal';
import PostCard from './PostCard';
import PublishDialog from './PublishDialog';
import { useSocial } from './SocialProvider';
import {
  likedPostIds,
  listFeed,
  listPostsBy,
  popularTags,
  setLike,
} from '@/lib/community';
import type { PostSummary } from '@/lib/social';
import { useSets } from '@/lib/storage';
import type { StudySet } from '@/lib/types';
import { useQuery } from '@/lib/useQuery';
import { nowMs, validCards } from '@/lib/utils';

type Tab = 'explore' | 'mine';
type Sort = 'new' | 'popular';

const PAGE = 18;

function Skeletons() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="panel h-44 animate-pulse bg-surface-2" />
      ))}
    </ul>
  );
}

export default function CommunityFeed() {
  const social = useSocial();
  const client = social.client!;
  const userId = social.userId!;
  const sets = useSets();

  const [tab, setTab] = useState<Tab>('explore');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState<Sort>('new');
  const [limit, setLimit] = useState(PAGE);
  const [picking, setPicking] = useState(false);
  const [publishing, setPublishing] = useState<StudySet | null>(null);
  const [likeOverride, setLikeOverride] = useState<Record<string, boolean>>({});
  const [likeError, setLikeError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const feedKey = `${tab}|${debounced}|${tag}|${sort}|${limit}`;
  const feed = useQuery<PostSummary[]>(feedKey, () =>
    tab === 'mine'
      ? listPostsBy(client, userId, { includePrivate: true })
      : listFeed(client, { search: debounced, tag, sort, limit })
  );
  const posts = feed.data ?? [];

  const ids = posts.map((p) => p.id).join(',');
  const likes = useQuery<Set<string>>(`likes|${ids}`, () =>
    likedPostIds(client, posts.map((p) => p.id))
  );
  const tags = useQuery<string[]>('tags', () => popularTags(client));

  async function toggleLike(post: PostSummary) {
    const was = likeOverride[post.id] ?? likes.data?.has(post.id) ?? false;
    setLikeOverride((m) => ({ ...m, [post.id]: !was }));
    setLikeError('');
    try {
      await setLike(client, userId, post.id, !was);
      feed.reload();
    } catch (err) {
      setLikeOverride((m) => ({ ...m, [post.id]: was }));
      setLikeError(err instanceof Error ? err.message : 'Could not update your like.');
    }
  }

  const now = nowMs();
  const shareable = sets.filter((s) => validCards(s.cards).length > 0);
  const hasMore = tab === 'explore' && posts.length >= limit;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Community</h1>
          <p className="mt-2 max-w-xl text-muted">
            Study sets made by other learners. Save any of them to your library, or share your own.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/people" className="btn btn-secondary">
            <Icon name="heart" size={16} />
            Find people
          </Link>
          <button type="button" onClick={() => setPicking(true)} className="btn btn-primary">
            <Icon name="upload" size={16} />
            Share a set
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Community views"
          className="flex gap-1 rounded-xl border-2 border-ink bg-surface-2 p-1"
        >
          {(
            [
              ['explore', 'Explore'],
              ['mine', 'My posts'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => {
                setTab(id);
                setLimit(PAGE);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors duration-200 ${
                tab === id ? 'bg-ink text-bg' : 'text-muted hover:text-fg'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'explore' && (
          <>
            <div className="relative min-w-[12rem] flex-1">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setLimit(PAGE);
                }}
                placeholder="Search sets"
                aria-label="Search community sets"
                className="input !py-2.5 pl-10"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as Sort);
                setLimit(PAGE);
              }}
              aria-label="Sort sets"
              className="input !w-auto !py-2.5"
            >
              <option value="new">Newest</option>
              <option value="popular">Most liked</option>
            </select>
          </>
        )}
      </div>

      {tab === 'explore' && (tags.data?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Popular tags">
          {tag && (
            <button
              type="button"
              onClick={() => setTag('')}
              className="chip cursor-pointer !bg-ink !text-bg"
            >
              #{tag}
              <Icon name="x" size={12} />
            </button>
          )}
          {tags.data!
            .filter((t) => t !== tag)
            .map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTag(t);
                  setLimit(PAGE);
                }}
                className="chip cursor-pointer !border-line text-muted transition-colors duration-200 hover:!border-ink hover:text-fg"
              >
                #{t}
              </button>
            ))}
        </div>
      )}

      {likeError && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {likeError}
        </p>
      )}

      {feed.loading ? (
        <Skeletons />
      ) : feed.error ? (
        <p role="alert" className="panel p-6 font-semibold text-danger">
          {feed.error}
        </p>
      ) : posts.length === 0 ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">
            {tab === 'mine' ? 'You haven’t shared anything yet' : 'Nothing here yet'}
          </h2>
          <p className="max-w-md text-muted">
            {tab === 'mine'
              ? 'Publish one of your sets publicly, or keep it private as a cloud backup.'
              : debounced || tag
                ? 'No sets match your search. Try different words or clear the filter.'
                : 'Be the first to share a study set with the community.'}
          </p>
          <button type="button" onClick={() => setPicking(true)} className="btn btn-primary">
            Share a set
          </button>
        </div>
      ) : (
        <>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                nowMs={now}
                liked={likeOverride[p.id] ?? likes.data?.has(p.id) ?? false}
                onToggleLike={() => toggleLike(p)}
                onTag={tab === 'explore' ? setTag : undefined}
                showAuthor={tab === 'explore'}
              />
            ))}
          </ul>
          {hasMore && (
            <button
              type="button"
              onClick={() => setLimit((n) => n + PAGE)}
              className="btn btn-secondary mx-auto"
            >
              Show more
            </button>
          )}
        </>
      )}

      {picking && (
        <Modal title="Which set do you want to share?" onClose={() => setPicking(false)}>
          {shareable.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted">You don’t have any sets yet. Create one first.</p>
              <Link href="/create" className="btn btn-primary">
                Create a set
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {shareable.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicking(false);
                      setPublishing(s);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-line p-3 text-left transition-colors duration-200 hover:border-ink"
                  >
                    <span className="line-clamp-2 min-w-0 break-words font-bold">{s.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-muted">
                      {validCards(s.cards).length} cards
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {publishing && (
        <PublishDialog
          set={publishing}
          onClose={() => {
            setPublishing(null);
            feed.reload();
          }}
        />
      )}
    </div>
  );
}
