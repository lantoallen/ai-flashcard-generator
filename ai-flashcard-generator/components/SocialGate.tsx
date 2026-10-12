'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { Icon } from './icons';
import { useSocial } from './SocialProvider';

function Message({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="panel mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-ink bg-primary-soft text-primary-ink">
        <Icon name="lock" size={26} />
      </span>
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      <p className="text-muted">{children}</p>
      {action}
    </div>
  );
}

/**
 * Wrap community pages: shows the right message when accounts are off, nobody
 * is signed in, or the community database has not been set up yet.
 */
export default function SocialGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const social = useSocial();

  if (!auth.enabled) {
    return (
      <Message title="Accounts aren’t switched on here">
        The community needs accounts. If you run this site, add your Supabase
        keys to turn them on.
      </Message>
    );
  }

  if (auth.status === 'loading' || (auth.status === 'signedIn' && social.status === 'loading')) {
    return <div className="panel h-64 animate-pulse bg-surface-2" aria-busy="true" />;
  }

  if (auth.status === 'signedOut') {
    return (
      <Message
        title="Sign in to join the community"
        action={
          <Link href="/account" className="btn btn-primary btn-lg mt-2">
            Sign in or create an account
          </Link>
        }
      >
        Share study sets, find people who like the same subjects and chat. It’s
        free, and your own sets stay private unless you publish them.
      </Message>
    );
  }

  if (social.status === 'error') {
    return (
      <Message title={social.notSetUp ? 'The community isn’t set up yet' : 'Something went wrong'}>
        {social.error}
      </Message>
    );
  }

  return <>{children}</>;
}
