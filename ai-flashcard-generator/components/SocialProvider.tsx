'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthProvider';
import {
  CommunityError,
  ensureProfile,
  unreadTotal,
  updateProfile,
  type ProfilePatch,
} from '@/lib/community';
import type { Profile } from '@/lib/social';
import { getSupabase } from '@/lib/supabase';
import { ACCENT_KEY, applyAccent, isValidAccent } from '@/lib/theme';

type Result = { ok: true; profile: Profile } | { ok: false; error: string };

type SocialValue = {
  /** Accounts are on and someone is signed in. */
  available: boolean;
  status: 'off' | 'loading' | 'ready' | 'error';
  client: SupabaseClient | null;
  userId: string | null;
  profile: Profile | null;
  error: string;
  /** The community tables have not been created on the server yet. */
  notSetUp: boolean;
  unread: number;
  saveProfile: (patch: ProfilePatch) => Promise<Result>;
  refreshUnread: () => void;
};

const SocialContext = createContext<SocialValue | null>(null);

/** Fired by the messenger after it marks a conversation as read. */
export const UNREAD_EVENT = 'flashly:unread-changed';

type Loaded = { forUser: string; profile: Profile | null; error: string; notSetUp: boolean };

export function SocialProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const client = getSupabase();
  const userId = auth.status === 'signedIn' ? (auth.user?.id ?? null) : null;
  const email = auth.user?.email ?? '';
  const name = auth.user?.name ?? '';

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [unreadState, setUnread] = useState(0);

  // Load (or create) the signed-in person's profile.
  useEffect(() => {
    if (!client || !userId) return;
    let cancelled = false;
    ensureProfile(client, userId, email, name)
      .then((profile) => {
        if (!cancelled) setLoaded({ forUser: userId, profile, error: '', notSetUp: false });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err instanceof CommunityError ? err : null;
        setLoaded({
          forUser: userId,
          profile: null,
          error: e?.message ?? 'Could not load your profile.',
          notSetUp: e?.notSetUp ?? false,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [client, userId, email, name]);

  const current = loaded && loaded.forUser === userId ? loaded : null;
  const profile = current?.profile ?? null;
  const status: SocialValue['status'] = !userId
    ? 'off'
    : !current
      ? 'loading'
      : profile
        ? 'ready'
        : 'error';
  const profileId = profile?.id ?? null;
  const profileAccent = profile?.accent ?? null;

  // The accent saved in the account wins on a new device; otherwise upload the local one once.
  useEffect(() => {
    if (!client || !profileId) return;
    if (profileAccent && isValidAccent(profileAccent)) {
      applyAccent(profileAccent);
      try {
        localStorage.setItem(ACCENT_KEY, profileAccent);
      } catch {
        /* ignore */
      }
      return;
    }
    let local: string | null = null;
    try {
      local = localStorage.getItem(ACCENT_KEY);
    } catch {
      /* ignore */
    }
    if (local && isValidAccent(local)) {
      updateProfile(client, profileId, { accent: local }).catch(() => {});
    }
  }, [client, profileId, profileAccent]);

  // Unread badge: poll, plus realtime when available.
  useEffect(() => {
    if (!client || !profileId) return;
    let cancelled = false;
    const tick = async () => {
      const n = await unreadTotal(client);
      if (!cancelled) setUnread(n);
    };
    tick();
    const timer = setInterval(tick, 30_000);
    const onChanged = () => tick();
    window.addEventListener(UNREAD_EVENT, onChanged);
    const channel = client
      .channel(`inbox-${profileId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${profileId}` },
        onChanged
      )
      .subscribe();
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(UNREAD_EVENT, onChanged);
      client.removeChannel(channel);
    };
  }, [client, profileId]);

  const saveProfile = useCallback<SocialValue['saveProfile']>(
    async (patch) => {
      if (!client || !userId) return { ok: false, error: 'You are not signed in.' };
      try {
        const next = await updateProfile(client, userId, patch);
        setLoaded({ forUser: userId, profile: next, error: '', notSetUp: false });
        if (patch.displayName !== undefined) await auth.updateName(patch.displayName);
        return { ok: true, profile: next };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Could not save your profile.',
        };
      }
    },
    [client, userId, auth]
  );

  const refreshUnread = useCallback(() => {
    window.dispatchEvent(new Event(UNREAD_EVENT));
  }, []);

  const value = useMemo<SocialValue>(
    () => ({
      available: Boolean(client && userId),
      status,
      client,
      userId,
      profile,
      error: current?.error ?? '',
      notSetUp: current?.notSetUp ?? false,
      unread: userId ? unreadState : 0,
      saveProfile,
      refreshUnread,
    }),
    [client, userId, status, profile, current, unreadState, saveProfile, refreshUnread]
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial(): SocialValue {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used inside <SocialProvider>');
  return ctx;
}
