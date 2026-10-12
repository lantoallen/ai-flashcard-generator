import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "What Flashly is, how it works, and how your data is handled.",
};

const STACK = [
  "Next.js (App Router) and React",
  "Tailwind CSS",
  "Vercel AI SDK with Groq for generation",
  "Your browser’s local storage for saving sets",
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-5xl font-extrabold tracking-tight">About Flashly</h1>
      <p className="mt-4 text-lg text-muted">
        Flashly is a free study tool. It turns your notes, or just a topic, into
        flashcards and quizzes so you spend your time learning instead of
        formatting.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-muted">
          <li>You paste notes (up to 8,000 characters) or type a topic.</li>
          <li>
            An AI model writes concise term and definition cards, along with
            believable wrong answers for the quiz.
          </li>
          <li>
            The set is saved in your browser. You can edit it, then study it in
            Flashcards, Review (spaced repetition), Quiz, Write or Match mode.
          </li>
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Privacy</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-muted">
          <li>There are no accounts. Flashly doesn’t know who you are.</li>
          <li>
            Your sets and progress are stored only in this browser. Clearing
            site data deletes them, so use <strong>Export</strong> to back up
            sets you care about.
          </li>
          <li>
            When you generate a set, add cards with AI, or use “Explain”, the
            relevant text is sent to Groq to be processed by the AI model.
            Don’t paste anything confidential.
          </li>
          <li>
            Share links contain the set itself, packed into the part of the URL
            after the “#”, which browsers never send to a server. Anyone you
            give the link to can read the set.
          </li>
          <li>
            Your streak and daily-goal counts are also kept only in this
            browser.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Good to know</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-muted">
          <li>
            AI can be wrong. Review your cards before an exam and edit anything
            that looks off.
          </li>
          <li>
            Generation is rate-limited to keep the free service available for
            everyone.
          </li>
          <li>Sets don’t sync between devices. Use Export and Import to move them.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Built with</h2>
        <ul className="mt-4 list-disc space-y-1 pl-6 text-muted">
          {STACK.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <p className="mt-12 text-muted">
        Flashly is made by <strong className="text-fg">Allen</strong>.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/create" className="btn btn-primary btn-lg">
          Create a set
        </Link>
        <Link href="/library" className="btn btn-secondary btn-lg">
          Open my library
        </Link>
      </div>
    </div>
  );
}
