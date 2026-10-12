import Link from 'next/link';
import { Icon } from './icons';
import { Logo } from './Logo';

const REPO = 'https://github.com/lantoallen/flashly';

export default function Footer() {
  return (
    <footer className="mt-8 border-t-2 border-ink bg-surface">
      {/* Colour stripe */}
      <div className="flex h-2" aria-hidden="true">
        {['bg-primary', 'bg-coral', 'bg-sun', 'bg-mint', 'bg-sky'].map((c) => (
          <span key={c} className={`flex-1 ${c}`} />
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Link href="/" aria-label="Flashly home" className="w-fit">
            <Logo />
          </Link>
          <p className="max-w-sm text-sm text-muted">
            Turn notes or any topic into flashcards and quizzes with AI. Free to
            use, no account needed, and your sets stay in your browser.
          </p>
          <p className="inline-flex w-fit items-center gap-2 rounded-xl border-2 border-ink bg-sun-soft px-3 py-2 text-sm font-bold">
            Made with <Icon name="heart" size={16} filled className="text-coral" /> by
            Allen
          </p>
        </div>

        <nav aria-label="Product">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider">Product</h2>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li><Link className="hover:text-fg hover:underline" href="/">Home</Link></li>
            <li><Link className="hover:text-fg hover:underline" href="/create">Create a set</Link></li>
            <li><Link className="hover:text-fg hover:underline" href="/library">My Library</Link></li>
            <li><Link className="hover:text-fg hover:underline" href="/community">Community</Link></li>
            <li><Link className="hover:text-fg hover:underline" href="/people">Find people</Link></li>
          </ul>
        </nav>

        <nav aria-label="Project">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider">Project</h2>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li><Link className="hover:text-fg hover:underline" href="/about">About</Link></li>
            <li><Link className="hover:text-fg hover:underline" href="/terms">Terms and Conditions</Link></li>
            <li><Link className="hover:text-fg hover:underline" href="/privacy">Privacy Policy</Link></li>
            <li>
              <a
                className="hover:text-fg hover:underline"
                href={REPO}
                target="_blank"
                rel="noreferrer"
              >
                Source on GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Flashly · Created by Allen · Built with Next.js and Groq</p>
          <p>AI can make mistakes. Double-check anything important.</p>
        </div>
      </div>
    </footer>
  );
}
