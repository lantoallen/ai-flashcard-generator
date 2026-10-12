'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import Avatar from './Avatar';
import { Icon } from './icons';
import SocialGate from './SocialGate';
import { UNREAD_EVENT, useSocial } from './SocialProvider';
import {
  fetchProfileByUsername,
  isBlockedByMe,
  listConversations,
  listThread,
  markRead,
  sendMessage,
  toMessage,
  unblockUser,
} from '@/lib/community';
import {
  LIMITS,
  nameOf,
  timeAgo,
  type Conversation,
  type Message,
  type Profile,
} from '@/lib/social';
import { useQuery } from '@/lib/useQuery';
import { nowMs } from '@/lib/utils';

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// ---- Conversation list ------------------------------------------------------

function ConversationList({
  conversations,
  loading,
  error,
  active,
}: {
  conversations: Conversation[];
  loading: boolean;
  error: string;
  active: string | null;
}) {
  const now = nowMs();
  return (
    <div className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b-2 border-line px-4 py-3">
        <h1 className="font-display text-xl font-extrabold">Messages</h1>
        <Link href="/people" className="btn btn-secondary !px-3 !py-1.5 text-xs">
          <Icon name="plus" size={14} />
          New
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-2 p-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        ) : error ? (
          <p role="alert" className="p-4 text-sm font-semibold text-danger">{error}</p>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <p className="font-bold">No conversations yet</p>
            <p className="text-sm text-muted">
              Find people who like the same subjects and say hello.
            </p>
            <Link href="/people" className="btn btn-primary !py-2">Find people</Link>
          </div>
        ) : (
          <ul>
            {conversations.map((c) => {
              const isActive = c.partner.username === active;
              return (
                <li key={c.partner.id}>
                  <Link
                    href={`/messages/${c.partner.username}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 border-b border-line px-4 py-3 transition-colors duration-200 ${
                      isActive ? 'bg-primary-soft' : 'hover:bg-surface-2'
                    }`}
                  >
                    <Avatar person={c.partner} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-bold">{nameOf(c.partner)}</span>
                        <span className="shrink-0 text-[11px] font-semibold text-muted">
                          {timeAgo(c.lastAt, now)}
                        </span>
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-sm ${
                            c.unread > 0 ? 'font-bold text-fg' : 'text-muted'
                          }`}
                        >
                          {c.lastFromMe ? 'You: ' : ''}
                          {c.lastBody}
                        </span>
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-extrabold text-on-primary">
                            {c.unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---- A single conversation --------------------------------------------------

function ThreadMessages({ partner, blocked }: { partner: Profile; blocked: boolean }) {
  const social = useSocial();
  const client = social.client!;
  const me = social.userId!;

  const thread = useQuery<Message[]>(`msgs|${partner.id}`, () => listThread(client, me, partner.id));
  const [extra, setExtra] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = useEffectEvent(() => thread.reload());
  const addIncoming = useEffectEvent((m: Message) => {
    setExtra((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
  });

  // New messages: realtime when available, and a slow poll as a safety net.
  useEffect(() => {
    const channel = client
      .channel(`dm-${me}-${partner.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${me}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.sender_id === partner.id) addIncoming(toMessage(row));
        }
      )
      .subscribe();
    const timer = setInterval(() => refresh(), 6000);
    return () => {
      clearInterval(timer);
      client.removeChannel(channel);
    };
  }, [client, me, partner.id]);

  const byId = new Map<number, Message>();
  for (const m of [...(thread.data ?? []), ...extra]) byId.set(m.id, m);
  const messages = [...byId.values()].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id
  );

  // Mark what the other person sent as read.
  const unreadFromThem = messages.filter((m) => m.senderId === partner.id && !m.readAt).length;
  useEffect(() => {
    if (unreadFromThem === 0) return;
    markRead(client, partner.id).then(() => window.dispatchEvent(new Event(UNREAD_EVENT)));
  }, [client, partner.id, unreadFromThem]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const canSend = partner.dmPolicy === 'everyone' && !blocked;

  async function send() {
    const body = text.trim();
    if (!body || sending || !canSend) return;
    setSending(true);
    setError('');
    try {
      const m = await sendMessage(client, me, partner.id, body);
      setExtra((list) => [...list, m]);
      setText('');
      window.dispatchEvent(new Event(UNREAD_EVENT));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
        {thread.loading ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-surface-2" />
            <div className="ml-auto h-10 w-1/2 animate-pulse rounded-2xl bg-surface-2" />
          </div>
        ) : thread.error ? (
          <p role="alert" className="text-sm font-semibold text-danger">{thread.error}</p>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Avatar person={partner} size="lg" />
            <p className="font-bold">Say hello to {nameOf(partner)}</p>
            <p className="max-w-xs text-sm text-muted">
              Be kind and keep personal details to yourself until you know someone.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {messages.map((m, i) => {
              const mine = m.senderId === me;
              const prev = messages[i - 1];
              const newGroup = !prev || prev.senderId !== m.senderId;
              return (
                <li key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'} ${newGroup ? 'mt-3' : ''}`}>
                  <span
                    className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? 'rounded-br-md bg-primary text-on-primary'
                        : 'rounded-bl-md bg-surface-2'
                    }`}
                  >
                    {m.body}
                  </span>
                  {(i === messages.length - 1 || messages[i + 1].senderId !== m.senderId) && (
                    <span className="mt-0.5 px-1 text-[11px] font-semibold text-muted">
                      {clock(m.createdAt)}
                      {mine && i === messages.length - 1 && m.readAt ? ' · Seen' : ''}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t-2 border-line p-3">
        {blocked ? (
          <UnblockNote partner={partner} />
        ) : partner.dmPolicy === 'nobody' ? (
          <p className="px-1 py-2 text-sm font-semibold text-muted">
            {nameOf(partner)} has turned messages off.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex flex-col gap-2"
          >
            {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
            <div className="flex items-end gap-2">
              <label htmlFor="message-text" className="sr-only">Message to {nameOf(partner)}</label>
              <textarea
                id="message-text"
                value={text}
                maxLength={LIMITS.message}
                rows={1}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Write a message…"
                className="input max-h-32 min-h-[2.75rem] flex-1 resize-none !py-2.5"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="btn btn-primary !px-4 !py-2.5"
                aria-label="Send message"
              >
                <Icon name="right" size={18} />
              </button>
            </div>
            {text.length > LIMITS.message - 100 && (
              <p className="text-right text-xs text-muted">
                {text.length}/{LIMITS.message}
              </p>
            )}
          </form>
        )}
      </div>
    </>
  );
}

function UnblockNote({ partner }: { partner: Profile }) {
  const social = useSocial();
  const [busy, setBusy] = useState(false);
  async function unblock() {
    if (!social.client || !social.userId) return;
    setBusy(true);
    try {
      await unblockUser(social.client, social.userId, partner.id);
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1">
      <p className="text-sm font-semibold text-muted">You blocked {nameOf(partner)}.</p>
      <button type="button" disabled={busy} onClick={unblock} className="btn btn-secondary !py-1.5">
        Unblock
      </button>
    </div>
  );
}

function Thread({ username }: { username: string }) {
  const social = useSocial();
  const client = social.client!;
  const me = social.userId!;

  const partner = useQuery<{ profile: Profile | null; blocked: boolean }>(`partner|${username}`, async () => {
    const profile = await fetchProfileByUsername(client, username);
    if (!profile || profile.id === me) return { profile: null, blocked: false };
    return { profile, blocked: await isBlockedByMe(client, me, profile.id) };
  });

  return (
    <div className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b-2 border-line px-4 py-3">
        <Link href="/messages" className="btn btn-ghost !p-1.5 md:hidden" aria-label="Back to messages">
          <Icon name="left" size={18} />
        </Link>
        {partner.data?.profile ? (
          <Link
            href={`/u/${partner.data.profile.username}`}
            className="flex min-w-0 items-center gap-3 hover:text-primary-ink"
          >
            <Avatar person={partner.data.profile} size="sm" />
            <span className="min-w-0">
              <span className="block truncate font-bold">{nameOf(partner.data.profile)}</span>
              <span className="block truncate text-xs font-semibold text-muted">
                @{partner.data.profile.username}
              </span>
            </span>
          </Link>
        ) : (
          <span className="font-bold text-muted">{partner.loading ? 'Loading…' : `@${username}`}</span>
        )}
      </div>

      {partner.loading ? (
        <div className="flex-1 animate-pulse bg-surface-2/50" aria-busy="true" />
      ) : partner.error ? (
        <p role="alert" className="p-4 text-sm font-semibold text-danger">{partner.error}</p>
      ) : !partner.data?.profile ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-bold">We couldn’t find @{username}</p>
          <Link href="/people" className="btn btn-primary">Find people</Link>
        </div>
      ) : (
        <ThreadMessages partner={partner.data.profile} blocked={partner.data.blocked} />
      )}
    </div>
  );
}

// ---- Screen -----------------------------------------------------------------

function MessengerBody() {
  const params = useParams<{ username?: string }>();
  const username = params.username ? decodeURIComponent(params.username).toLowerCase() : null;
  const social = useSocial();
  const client = social.client!;

  const convos = useQuery<Conversation[]>('conversations', () => listConversations(client));
  const reload = useEffectEvent(() => convos.reload());

  useEffect(() => {
    const timer = setInterval(() => reload(), 15_000);
    const onChange = () => reload();
    window.addEventListener(UNREAD_EVENT, onChange);
    return () => {
      clearInterval(timer);
      window.removeEventListener(UNREAD_EVENT, onChange);
    };
  }, []);

  return (
    <div className="grid h-[calc(100dvh-13rem)] min-h-[28rem] gap-4 md:grid-cols-[20rem_1fr]">
      <aside className={`${username ? 'hidden md:flex' : 'flex'} min-h-0 flex-col`}>
        <ConversationList
          conversations={convos.data ?? []}
          loading={convos.loading}
          error={convos.error}
          active={username}
        />
      </aside>
      <section className={`${username ? 'flex' : 'hidden md:flex'} min-h-0 flex-col`}>
        {username ? (
          <Thread key={username} username={username} />
        ) : (
          <div className="panel flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-ink bg-primary-soft text-primary-ink">
              <Icon name="heart" size={26} />
            </span>
            <p className="font-display text-xl font-extrabold">Pick a conversation</p>
            <p className="max-w-xs text-sm text-muted">
              Or find someone new who shares your interests.
            </p>
            <Link href="/people" className="btn btn-primary mt-1">Find people</Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default function Messenger() {
  return (
    <SocialGate>
      <MessengerBody />
    </SocialGate>
  );
}
