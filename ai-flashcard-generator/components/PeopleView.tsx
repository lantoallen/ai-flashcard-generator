'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { Icon } from './icons';
import SocialGate from './SocialGate';
import { useSocial } from './SocialProvider';
import { searchPeople, suggestPeople } from '@/lib/community';
import { nameOf, type Person } from '@/lib/social';
import { useQuery } from '@/lib/useQuery';

export function PersonCard({ person, mine }: { person: Person; mine: string[] }) {
  return (
    <li className="panel flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <Avatar person={person} size="md" />
        <div className="min-w-0">
          <Link
            href={`/u/${person.username}`}
            className="block truncate font-display text-lg font-extrabold hover:text-primary-ink"
          >
            {nameOf(person)}
          </Link>
          <p className="truncate text-xs font-semibold text-muted">@{person.username}</p>
        </div>
      </div>

      {person.bio && <p className="line-clamp-2 text-sm text-muted">{person.bio}</p>}

      {person.interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {person.interests.slice(0, 6).map((i) => {
            const common = mine.includes(i);
            return (
              <span
                key={i}
                className={`chip ${common ? '!bg-primary-soft' : '!border-line text-muted'}`}
                title={common ? 'You both like this' : undefined}
              >
                {common && <Icon name="check" size={11} />}
                {i}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-xs font-bold text-muted">
          {person.shared > 0
            ? `${person.shared} interest${person.shared === 1 ? '' : 's'} in common`
            : ' '}
        </span>
        <div className="flex gap-2">
          <Link href={`/u/${person.username}`} className="btn btn-secondary !px-3 !py-1.5">
            Profile
          </Link>
          {person.dmPolicy === 'everyone' && (
            <Link href={`/messages/${person.username}`} className="btn btn-primary !px-3 !py-1.5">
              Message
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

function PeopleBody() {
  const social = useSocial();
  const client = social.client!;
  const mine = social.profile?.interests ?? [];

  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 350);
    return () => clearTimeout(t);
  }, [term]);

  const searching = debounced.length > 0;
  const result = useQuery<Person[]>(`people|${debounced}`, () =>
    searching ? searchPeople(client, debounced) : suggestPeople(client, 18)
  );
  const people = result.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Find people</h1>
        <p className="mt-2 max-w-xl text-muted">
          Meet learners who like the same subjects. People are ranked by how many interests you
          share.
        </p>
      </div>

      <div className="relative max-w-xl">
        <Icon
          name="search"
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by name, username or interest"
          aria-label="Search people"
          className="input pl-10"
        />
      </div>

      {mine.length === 0 && !searching && (
        <div className="panel flex flex-wrap items-center justify-between gap-3 bg-sun-soft p-4">
          <p className="text-sm font-semibold">
            Add a few interests to your profile to get better suggestions.
          </p>
          <Link href="/profile" className="btn btn-secondary !py-2">
            Add interests
          </Link>
        </div>
      )}

      {result.loading ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="panel h-48 animate-pulse bg-surface-2" />
          ))}
        </ul>
      ) : result.error ? (
        <p role="alert" className="panel p-6 font-semibold text-danger">{result.error}</p>
      ) : people.length === 0 ? (
        <div className="panel px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-extrabold">
            {searching ? 'No one matches that' : 'No suggestions yet'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            {searching
              ? 'Try a different name or an interest like “biology”.'
              : 'As more people join and add interests, they’ll show up here.'}
          </p>
        </div>
      ) : (
        <>
          <h2 className="font-display text-xl font-extrabold">
            {searching ? `Results for “${debounced}”` : 'People you may like'}
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <PersonCard key={p.id} person={p} mine={mine} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function PeopleView() {
  return (
    <SocialGate>
      <PeopleBody />
    </SocialGate>
  );
}
