'use client';

import Link from 'next/link';
import Avatar from './Avatar';
import { Icon } from './icons';
import { nameOf, timeAgo, type PostSummary } from '@/lib/social';

export default function PostCard({
  post,
  liked,
  onToggleLike,
  onTag,
  nowMs,
  showAuthor = true,
}: {
  post: PostSummary;
  liked: boolean;
  onToggleLike?: () => void;
  onTag?: (tag: string) => void;
  nowMs: number;
  showAuthor?: boolean;
}) {
  return (
    <li className="panel flex flex-col gap-3 p-5 transition-shadow duration-300">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/community/${post.id}`}
          className="font-display line-clamp-2 text-xl font-extrabold hover:text-primary-ink"
        >
          {post.title}
        </Link>
        {post.visibility === 'private' && (
          <span className="chip shrink-0 !bg-surface-2">
            <Icon name="lock" size={12} />
            Private
          </span>
        )}
        {post.hidden && (
          <span className="chip shrink-0 !bg-warn-soft text-warn">Hidden by reports</span>
        )}
      </div>

      {post.description && (
        <p className="line-clamp-2 text-sm text-muted">{post.description}</p>
      )}

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((t) =>
            onTag ? (
              <button
                key={t}
                type="button"
                onClick={() => onTag(t)}
                className="chip cursor-pointer !border-line text-muted transition-colors duration-200 hover:!border-ink hover:text-fg"
              >
                #{t}
              </button>
            ) : (
              <span key={t} className="chip !border-line text-muted">
                #{t}
              </span>
            )
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
        {showAuthor && post.author ? (
          <Link
            href={`/u/${post.author.username}`}
            className="flex min-w-0 items-center gap-2 text-sm font-bold hover:text-primary-ink"
          >
            <Avatar person={post.author} size="xs" />
            <span className="truncate" title={nameOf(post.author)}>{nameOf(post.author)}</span>
          </Link>
        ) : (
          <span className="text-xs font-semibold text-muted">{timeAgo(post.createdAt, nowMs)}</span>
        )}

        <div className="flex items-center gap-3 text-xs font-bold text-muted">
          <span>{post.cardCount} cards</span>
          {showAuthor && <span>{timeAgo(post.createdAt, nowMs)}</span>}
          <button
            type="button"
            onClick={onToggleLike}
            disabled={!onToggleLike}
            aria-pressed={liked}
            aria-label={`${liked ? 'Unlike' : 'Like'} (${post.likeCount})`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors duration-200 ${
              liked ? 'bg-coral-soft text-danger' : 'hover:bg-surface-2'
            }`}
          >
            <Icon name="heart" size={14} filled={liked} />
            {post.likeCount}
          </button>
        </div>
      </div>
    </li>
  );
}
