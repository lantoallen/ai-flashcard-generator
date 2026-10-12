'use client';

import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { replaceActivity } from '@/lib/activity';
import {
  applySnapshot,
  deleteRemote,
  LOCAL_CHANGE_EVENTS,
  localSnapshot,
  pullRemote,
  pushRemote,
} from '@/lib/cloud';
import { hasAcceptedTerms, TERMS_VERSION, useConsent } from '@/lib/consent';
import { mergeSnapshots } from '@/lib/merge';
import { DEFAULT_NAME, replacePet } from '@/lib/pet';
import { clearPetChat } from '@/lib/petchat';
import { clearLocalLibrary } from '@/lib/storage';
import { accountsEnabled, getSupabase } from '@/lib/supabase';

export type AccountUser = {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  termsVersion?: string;
  termsAt?: number;
};

export type SyncState =
  | { state: 'idle' }
  | { state: 'syncing' }
  | { state: 'saved'; at: number }
  | { state: 'error'; message: string };

type Result = { ok: true; needsConfirmation?: boolean } | { ok: false; error: string };

type AuthContextValue = {
  enabled: boolean;
  /** 'loading' only while the stored session is being checked. */
  status: 'loading' | 'signedOut' | 'signedIn';
  user: AccountUser | null;
  sync: SyncState;
  /** True after following a password-reset email link. */
  recovering: boolean;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (email: string, password: string, name: string) => Promise<Result>;
  signOut: (clearDevice: boolean) => Promise<void>;
  syncNow: () => Promise<void>;
  sendReset: (email: string) => Promise<Result>;
  setNewPassword: (password: string) => Promise<Result>;
  updateName: (name: string) => Promise<Result>;
  deleteCloudData: () => Promise<Result>;
  deleteAccount: () => Promise<Result>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(session: Session | null): AccountUser | null {
  const u = session?.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const email = u.email ?? '';
  return {
    id: u.id,
    email,
    name:
      (typeof meta.display_name === 'string' && meta.display_name.trim()) ||
      email.split('@')[0] ||
      'Learner',
    createdAt: u.created_at,
    termsVersion: typeof meta.terms_version === 'string' ? meta.terms_version : undefined,
    termsAt: typeof meta.terms_accepted_at === 'number' ? meta.terms_accepted_at : undefined,
  };
}

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'That email and password don’t match.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'An account with that email already exists. Try signing in.';
  }
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email first. Check your inbox for the link.';
  }
  if (m.includes('password')) return message;
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (m.includes('fetch') || m.includes('network')) {
    return 'Network error. Check your connection and try again.';
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const consent = useConsent();
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(!supabase);
  const [sync, setSync] = useState<SyncState>({ state: 'idle' });
  const [recovering, setRecovering] = useState(false);
  const applying = useRef(false);
  const syncRef = useRef<() => Promise<void>>(async () => {});

  const userId = session?.user.id;

  // Session
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoaded(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoaded(true);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') setSync({ state: 'idle' });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  // Sync: merge cloud and local, apply the result, push it back.
  useEffect(() => {
    if (!supabase || !userId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let running = false;
    let again = false;

    async function run() {
      if (running) {
        again = true;
        return;
      }
      running = true;
      setSync({ state: 'syncing' });
      try {
        const remote = await pullRemote(supabase!, userId!);
        const merged = mergeSnapshots(localSnapshot(), remote);
        if (cancelled) return;
        applying.current = true;
        applySnapshot(merged);
        applying.current = false;
        await pushRemote(supabase!, userId!, merged);
        if (!cancelled) setSync({ state: 'saved', at: Date.now() });
      } catch (err) {
        applying.current = false;
        if (!cancelled) {
          setSync({
            state: 'error',
            message: err instanceof Error ? err.message : 'Could not sync.',
          });
        }
      } finally {
        running = false;
        if (again && !cancelled) {
          again = false;
          schedule(300);
        }
      }
    }

    function schedule(delay = 1500) {
      if (applying.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, delay);
    }

    syncRef.current = run;
    schedule(0);

    const onChange = () => schedule();
    const onVisible = () => {
      if (document.visibilityState === 'visible') schedule(200);
    };
    for (const e of LOCAL_CHANGE_EVENTS) window.addEventListener(e, onChange);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      for (const e of LOCAL_CHANGE_EVENTS) window.removeEventListener(e, onChange);
      document.removeEventListener('visibilitychange', onVisible);
      syncRef.current = async () => {};
    };
  }, [supabase, userId]);

  // Keep the stored terms version in the account in step with what was accepted here.
  const accepted = hasAcceptedTerms(consent);
  useEffect(() => {
    if (!supabase || !session || !accepted) return;
    const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
    if (meta.terms_version === TERMS_VERSION) return;
    supabase.auth.updateUser({
      data: { terms_version: TERMS_VERSION, terms_accepted_at: consent.terms?.at ?? Date.now() },
    });
  }, [supabase, session, accepted, consent.terms?.at]);

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password) => {
      if (!supabase) return { ok: false, error: 'Accounts are not available on this site.' };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { ok: false, error: friendly(error.message) } : { ok: true };
    },
    [supabase]
  );

  const signUp = useCallback<AuthContextValue['signUp']>(
    async (email, password, name) => {
      if (!supabase) return { ok: false, error: 'Accounts are not available on this site.' };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
          data: {
            display_name: name.trim() || undefined,
            terms_version: TERMS_VERSION,
            terms_accepted_at: Date.now(),
          },
        },
      });
      if (error) return { ok: false, error: friendly(error.message) };
      // With email confirmation on, there is no session until the link is clicked.
      return { ok: true, needsConfirmation: !data.session };
    },
    [supabase]
  );

  const signOut = useCallback<AuthContextValue['signOut']>(
    async (clearDevice) => {
      if (!supabase) return;
      if (!clearDevice) {
        // Push any last changes before the session goes away.
        try {
          await syncRef.current();
        } catch {
          /* best effort */
        }
      }
      await supabase.auth.signOut();
      if (clearDevice) {
        applying.current = true;
        clearLocalLibrary();
        replaceActivity({});
        replacePet(DEFAULT_NAME, 0);
        clearPetChat();
        applying.current = false;
      }
    },
    [supabase]
  );

  const syncNow = useCallback(async () => {
    await syncRef.current();
  }, []);

  const sendReset = useCallback<AuthContextValue['sendReset']>(
    async (email) => {
      if (!supabase) return { ok: false, error: 'Accounts are not available on this site.' };
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account`,
      });
      return error ? { ok: false, error: friendly(error.message) } : { ok: true };
    },
    [supabase]
  );

  const setNewPassword = useCallback<AuthContextValue['setNewPassword']>(
    async (password) => {
      if (!supabase) return { ok: false, error: 'Accounts are not available on this site.' };
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { ok: false, error: friendly(error.message) };
      setRecovering(false);
      return { ok: true };
    },
    [supabase]
  );

  const updateName = useCallback<AuthContextValue['updateName']>(
    async (name) => {
      if (!supabase) return { ok: false, error: 'Accounts are not available on this site.' };
      const { error } = await supabase.auth.updateUser({
        data: { display_name: name.trim().slice(0, 40) },
      });
      return error ? { ok: false, error: friendly(error.message) } : { ok: true };
    },
    [supabase]
  );

  const deleteCloudData = useCallback<AuthContextValue['deleteCloudData']>(async () => {
    if (!supabase || !userId) return { ok: false, error: 'You are not signed in.' };
    try {
      await deleteRemote(supabase, userId);
      // Sign out so the next sync doesn't immediately re-upload this device's copy.
      await supabase.auth.signOut();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Could not delete.' };
    }
  }, [supabase, userId]);

  const deleteAccount = useCallback<AuthContextValue['deleteAccount']>(async () => {
    if (!supabase || !session) return { ok: false, error: 'You are not signed in.' };
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return { ok: false, error: body.error ?? 'Could not delete the account.' };
      await supabase.auth.signOut().catch(() => {});
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error. Please try again.' };
    }
  }, [supabase, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled: accountsEnabled,
      status: !loaded ? 'loading' : session ? 'signedIn' : 'signedOut',
      user: toUser(session),
      sync,
      recovering,
      signIn,
      signUp,
      signOut,
      syncNow,
      sendReset,
      setNewPassword,
      updateName,
      deleteCloudData,
      deleteAccount,
    }),
    [
      loaded, session, sync, recovering, signIn, signUp, signOut, syncNow,
      sendReset, setNewPassword, updateName, deleteCloudData, deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
