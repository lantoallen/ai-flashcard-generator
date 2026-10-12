import Link from 'next/link';
import { Logo } from './Logo';

const REPO = 'https://github.com/lantoallen/ai-flashcard-generator';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Link href="/" aria-label="Flashly home" className="w-fit">
            <Logo />
          </Link>
          <p className="max-w-sm text-sm text-muted">
            Turn notes or any topic into flashcards and quizzes with AI.
            Free to use, no account needed, and your sets stay in your browser.
          </p>
        </div>

        <nav aria-label="Product">
          <h2 className="mb-3 text-sm font-semibold">Product</h2>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li><Link className="hover:text-fg" href="/">Home</Link></li>
            <li><Link className="hover:text-fg" href="/create">Create a set</Link></li>
            <li><Link className="hover:text-fg" href="/library">My Library</Link></li>
          </ul>
        </nav>

        <nav aria-label="Project">
          <h2 className="mb-3 text-sm font-semibold">Project</h2>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li><Link className="hover:text-fg" href="/about">About &amp; privacy</Link></li>
            <li>
              <a className="hover:text-fg" href={REPO} target="_blank" rel="noreferrer">
                Source on GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Flashly. Built with Next.js and Groq.</p>
          <p>AI can make mistakes. Double-check anything important.</p>
        </div>
      </div>
    </footer>
  );
}
