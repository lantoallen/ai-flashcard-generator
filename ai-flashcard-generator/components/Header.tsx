'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon, type IconName } from './icons';
import { Logo } from './Logo';
import ThemeMenu from './ThemeMenu';
import { streakOf, useActivity } from '@/lib/activity';
import { nowMs } from '@/lib/utils';

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/create', label: 'Create', icon: 'plus' },
  { href: '/library', label: 'My Library', icon: 'library' },
  { href: '/about', label: 'About', icon: 'info' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  if (href === '/library') {
    return pathname.startsWith('/library') || pathname.startsWith('/study');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  // Remember which page the menu was opened on, so it closes itself on navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const streak = streakOf(useActivity(), nowMs());

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenOn(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Flashly home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1.5 md:flex">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  active
                    ? 'bg-ink text-bg'
                    : 'text-muted hover:bg-surface-2 hover:text-fg'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {streak > 0 && (
            <Link
              href="/library"
              className="chip bg-sun-soft"
              title={`${streak}-day study streak`}
              aria-label={`${streak}-day study streak`}
            >
              <Icon name="flame" size={14} className="text-coral" />
              {streak}
            </Link>
          )}
          <ThemeMenu />
          <Link href="/create" className="btn btn-primary hidden sm:inline-flex">
            <Icon name="sparkles" size={16} />
            New set
          </Link>
          <button
            type="button"
            className="btn btn-secondary !p-2.5 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t-2 border-ink bg-bg px-4 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-2">
            {LINKS.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpenOn(null)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold ${
                      active
                        ? 'bg-ink text-bg'
                        : 'border-2 border-line bg-surface text-fg'
                    }`}
                  >
                    <Icon name={l.icon} />
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
