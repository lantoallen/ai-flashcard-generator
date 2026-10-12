'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Avatar from './Avatar';
import { Icon } from './icons';
import PostCard from './PostCard';
import ReportDialog from './ReportDialog';
import SocialGate from './SocialGate';
import { useSocial } from './SocialProvider';
import {
  blockUser,
  fetchProfileByUsername,
  isBlockedByMe,
  listPostsBy,
  unblockUser,
} from '@/lib/community';
import { nameOf, sharedInterests, type PostSummary, type Profile } from '@/lib/social';
import { useQuery } from '@/lib/useQuery';
import { nowMs } from '@/lib/utils';

type Loaded = { profile: Profile | null; blocked: boolean; posts: PostSummary[] };

function Body({ username }: { username: string }) {
  const social = useSocial();
  const client = social.client!;
  const me = social.userId!;

  const data = useQuery<Loaded>(`profile|${username}`, async () => {
    const profile = await fetchProfileByUsername(client, username);
    if (!profile) return { profile: null, blocked: false, posts: [] };
    const [blocked, posts] = await Promise.all([
      profile.id === me ? Promise.resolve(false) : isBlockedByMe(client, me, profile.id),
      listPostsBy(client, profile.id, { includePrivate: profile.id === me }),
    ]);
    return { profile, blocked, posts };
  });

  const [reporting, setReporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (data.loading) return <div className="panel h-64 animate-pulse bg-surface-2" aria-busy="true" />;
  if (data.error) return <p role="alert" className="panel p-6 font-semibold text-danger">{data.error}</p>;

  const { profile, blocked, posts } = data.data!;
  if (!profile) {
    return (
      <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
        <h2 className="font-display text-2xl font-extrabold">We couldn’t find @{username}</h2>
        <p className="text-muted">The username may have changed, or the account no longer exists.</p>
        <Link href="/people" className="btn btn-primary">Find people</Link>
      </div>
    );
  }

  const isMe = profile.id === me;
  const myInterests = social.profile?.interests ?? [];
  const common = sharedInterests(myInterests, profile.interests);

  async function toggleBlock() {
    setBusy(true);
    setError('');
    try {
      if (blocked) await unblockUser(client, me, profile!.id);
      else await blockUser(client, me, profile!.id);
      data.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the block.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="panel flex flex-wrap items-start gap-5 bg-primary-soft p-6">
        <Avatar person={profile} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
            {nameOf(profile)}
          </h1>
          <p className="text-sm font-semibold text-muted">@{profile.username}</p>
          {profile.bio && <p className="mt-3 max-w-xl whitespace-pre-line">{profile.bio}</p>}

          {profile.interests.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {profile.interests.map((i) => {
                const isCommon = !isMe && common.includes(i);
                return (
                  <span key={i} className={`chip ${isCommon ? '!bg-sun' : ''}`}
                    style={isCommon ? { color: '#1b1033' } : undefined}>
                    {isCommon && <Icon name="check" size={11} />}
                    {i}
                  </span>
                );
              })}
            </div>
          )}
          {!isMe && common.length > 0 && (
            <p className="mt-2 text-sm font-semibold text-muted">
              You both like {common.slice(0, 3).join(', ')}
              {common.length > 3 ? ` and ${common.length - 3} more` : ''}.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {isMe ? (
              <Link href="/profile" className="btn btn-primary">
                <Icon name="edit" size={16} />
                Edit profile
              </Link>
            ) : blocked ? (
              <button type="button" disabled={busy} onClick={toggleBlock} className="btn btn-secondary">
                Unblock
              </button>
            ) : (
              <>
                {profile.dmPolicy === 'everyone' ? (
                  <Link href={`/messages/${profile.username}`} className="btn btn-primary">
                    Message
                  </Link>
                ) : (
                  <span className="chip !bg-surface-2">Messages are turned off</span>
                )}
                <button type="button" disabled={busy} onClick={toggleBlock} className="btn btn-secondary">
                  Block
                </button>
                <button type="button" onClick={() => setReporting(true)} className="btn btn-ghost">
                  Report
                </button>
              </>
            )}
          </div>
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{error}</p>}
          {blocked && (
            <p className="mt-3 text-sm font-semibold text-muted">
              You blocked this person. They can’t message you and you won’t see each other’s posts.
            </p>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-display text-2xl font-extrabold">
          {isMe ? 'Your shared sets' : `Sets by ${nameOf(profile)}`}
        </h2>
        {posts.length === 0 ? (
          <p className="panel p-6 text-muted">
            {isMe ? 'You haven’t shared any sets yet.' : 'No public sets yet.'}
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} liked={false} nowMs={nowMs()} showAuthor={false} />
            ))}
          </ul>
        )}
      </section>

      {reporting && (
        <ReportDialog
          kind="user"
          targetId={profile.id}
          subject={`@${profile.username}`}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}

export default function ProfileView() {
  const { username } = useParams<{ username: string }>();
  return (
    <SocialGate>
      <Body username={decodeURIComponent(username).toLowerCase()} />
    </SocialGate>
  );
}
