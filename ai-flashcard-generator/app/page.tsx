import Link from "next/link";
import DemoButton from "@/components/DemoButton";
import { Icon, type IconName } from "@/components/icons";

const STEPS = [
  {
    title: "Add your material",
    body: "Paste your notes, or just type a topic like “The French Revolution”.",
  },
  {
    title: "AI builds your set",
    body: "Get clean term and definition cards, plus smart wrong answers for quizzes.",
  },
  {
    title: "Study your way",
    body: "Flip cards, take a quiz, type answers, or race the clock in a match game.",
  },
];

const MODES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "layers",
    title: "Flashcards",
    body: "Flip, shuffle and star cards. Mark what you know and focus on what you don’t.",
  },
  {
    icon: "quiz",
    title: "Quiz",
    body: "Multiple choice with believable distractors, instant feedback and a review of every miss.",
  },
  {
    icon: "type",
    title: "Write",
    body: "Type the answer from memory. Small typos are forgiven, so you’re graded on knowledge.",
  },
  {
    icon: "grid",
    title: "Match",
    body: "Pair terms with definitions against the clock and beat your best time.",
  },
];

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "zap",
    title: "Ready in seconds",
    body: "From a wall of notes to a full study set in a few seconds.",
  },
  {
    icon: "edit",
    title: "Fully editable",
    body: "Fix, add, remove or star any card. The AI gets you 90% there, you finish the job.",
  },
  {
    icon: "lock",
    title: "Private by default",
    body: "No sign-up. Your sets are saved in your browser, not on our servers.",
  },
  {
    icon: "download",
    title: "Take it anywhere",
    body: "Export to CSV or text to use in Anki, Quizlet or a spreadsheet, or back everything up.",
  },
  {
    icon: "upload",
    title: "Bring your own cards",
    body: "Already have a list? Paste it in and study it in every mode.",
  },
  {
    icon: "heart",
    title: "Free forever",
    body: "No paywall, no trial and no limits on how many sets you make.",
  },
];

const FAQ = [
  {
    q: "Is it really free?",
    a: "Yes. There’s no subscription, no premium tier and no sign-up. The AI runs on a free-tier model.",
  },
  {
    q: "Where are my sets stored?",
    a: "In your own browser (local storage). Clearing site data removes them, so use Export to keep a backup.",
  },
  {
    q: "Can I trust the AI’s answers?",
    a: "It’s usually right, but it can make mistakes. Skim the cards and fix anything off using the editor, especially for exams.",
  },
  {
    q: "Do I have to use the AI?",
    a: "No. You can import your own list or build a set by hand and still use every study mode.",
  },
];

function HeroVisual() {
  return (
    <div className="relative mx-auto h-72 w-full max-w-sm select-none sm:h-80" aria-hidden="true">
      <div
        className="float absolute left-2 top-6 w-[78%] rounded-2xl border border-line bg-primary-soft p-5 shadow-lg"
        style={{ "--r": "-8deg" } as React.CSSProperties}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Term</p>
        <p className="mt-2 text-lg font-semibold">Mitochondria</p>
      </div>
      <div
        className="float absolute bottom-2 right-0 w-[86%] rounded-2xl border border-line bg-surface p-6 shadow-xl"
        style={{ "--r": "4deg", animationDelay: "-2s" } as React.CSSProperties}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Definition</p>
        <p className="mt-2 font-medium leading-snug">
          The organelle that produces most of a cell’s ATP through cellular respiration.
        </p>
        <div className="mt-4 flex gap-2">
          <span className="chip bg-success-soft text-success">
            <Icon name="check" size={12} /> Got it
          </span>
          <span className="chip">
            <Icon name="star" size={12} /> Starred
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div className="flex flex-col items-start gap-6">
          <span className="chip bg-primary-soft text-primary">
            <Icon name="sparkles" size={14} /> AI-powered study sets
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Turn any notes into flashcards and quizzes in{" "}
            <span className="brand-text">seconds</span>.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Paste your notes or type a topic. Flashly writes the cards, then helps
            you actually learn them with flashcards, quizzes, typing practice and a
            match game. Free, with no account.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/create" className="btn btn-primary btn-lg">
              <Icon name="sparkles" />
              Create a set
            </Link>
            <DemoButton />
          </div>
          <p className="text-sm text-muted">No sign-up · Works on phone and desktop · Dark mode</p>
        </div>
        <HeroVisual />
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-3 rounded-2xl border border-line bg-bg p-6">
                <span className="brand-bg flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Study modes */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">Four ways to study</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
          Every set works in every mode, so you can switch it up when one gets
          boring.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m) => (
            <div key={m.title} className="panel flex flex-col gap-3 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon name={m.icon} size={22} />
              </span>
              <h3 className="text-lg font-semibold">{m.title}</h3>
              <p className="text-sm text-muted">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Built to be useful, not annoying</h2>
          <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary">
                  <Icon name={f.icon} />
                </span>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">Questions</h2>
        <div className="mt-8 flex flex-col gap-3">
          {FAQ.map((item) => (
            <details key={item.q} className="panel group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {item.q}
                <Icon name="chevron" className="shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="brand-bg flex flex-col items-center gap-5 rounded-3xl px-6 py-14 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight">Ready to study smarter?</h2>
          <p className="max-w-lg text-white/85">
            Your first set takes less than a minute.
          </p>
          <Link
            href="/create"
            className="btn btn-lg bg-white !text-indigo-700 hover:bg-white/90"
          >
            Create your first set
            <Icon name="right" />
          </Link>
        </div>
      </section>
    </>
  );
}
