import Link from "next/link";
import DemoButton from "@/components/DemoButton";
import { Icon, type IconName } from "@/components/icons";

const TOPICS = [
  "Biology", "Spanish verbs", "World War II", "Calculus", "Organic chemistry",
  "JavaScript", "Human anatomy", "Art history", "Constitutional law", "Psychology 101",
  "Music theory", "Macroeconomics", "Astronomy", "French vocabulary", "Data structures",
];

const STEPS = [
  {
    title: "Add your material",
    body: "Paste notes, or just type a topic like “The French Revolution”.",
    tint: "bg-sun-soft",
  },
  {
    title: "AI builds the set",
    body: "Clean term and definition cards, plus believable wrong answers for quizzes.",
    tint: "bg-coral-soft",
  },
  {
    title: "Study, repeat, win",
    body: "Six study modes, streaks and spaced repetition keep it in your head.",
    tint: "bg-mint-soft",
  },
];

const MODES: { icon: IconName; title: string; body: string; tint: string; tilt: string }[] = [
  {
    icon: "layers",
    title: "Flashcards",
    body: "Flip, shuffle, star and read aloud. Stuck? Ask the AI to explain a card.",
    tint: "bg-primary-soft",
    tilt: "md:-rotate-1",
  },
  {
    icon: "repeat",
    title: "Review",
    body: "Spaced repetition schedules each card for just before you’d forget it.",
    tint: "bg-sky-soft",
    tilt: "md:rotate-1",
  },
  {
    icon: "quiz",
    title: "Quiz",
    body: "Multiple choice with sneaky distractors and a review of every miss.",
    tint: "bg-coral-soft",
    tilt: "md:-rotate-1",
  },
  {
    icon: "list",
    title: "Test",
    body: "A real practice exam: multiple choice, true/false and written, graded when you submit.",
    tint: "bg-primary-soft",
    tilt: "md:rotate-1",
  },
  {
    icon: "type",
    title: "Write",
    body: "Type from memory. Small typos are forgiven, so you’re graded on knowledge.",
    tint: "bg-sun-soft",
    tilt: "md:-rotate-1",
  },
  {
    icon: "grid",
    title: "Match",
    body: "Pair terms with definitions against the clock and beat your best time.",
    tint: "bg-mint-soft",
    tilt: "md:rotate-1",
  },
];

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: "flame", title: "Streaks & daily goal", body: "Study a little every day and watch your streak and 7-day chart grow." },
  { icon: "link", title: "Share with a link", body: "Send a set to a friend. The cards travel in the link itself, so there’s no upload." },
  { icon: "sparkles", title: "AI explain & add more", body: "Ask for a plain-English explanation, or have the AI add more cards to a set." },
  { icon: "palette", title: "Make it yours", body: "Light or dark, plus five accent colors. Your pick is remembered." },
  { icon: "download", title: "Import, export, print", body: "Upload a CSV, export to Anki or Quizlet, or print your cards as a study sheet." },
  { icon: "edit", title: "Any number of cards", body: "Ask for 3 cards or 50. Big sets are built in steps so they stay reliable." },
  { icon: "lock", title: "Private by default", body: "No sign-up. Sets live in your browser, not on our servers." },
];

const FAQ = [
  {
    q: "Is it really free?",
    a: "Yes. No subscription, no premium tier, no sign-up. The AI runs on a free-tier model.",
  },
  {
    q: "Where are my sets stored?",
    a: "In your own browser (local storage). Clearing site data removes them, so use Backup or a share link to keep a copy.",
  },
  {
    q: "Can I trust the AI’s answers?",
    a: "It’s usually right, but it can make mistakes. Skim the cards and fix anything off with the editor, especially before an exam.",
  },
  {
    q: "Do I have to use the AI?",
    a: "No. Import your own list or build a set by hand and use every study mode.",
  },
];

function Blob({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full border-2 border-ink ${className}`}
    />
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto h-[22rem] w-full max-w-md select-none" aria-hidden="true">
      <div
        className="float panel absolute left-0 top-2 w-[70%] bg-primary-soft p-5"
        style={{ "--r": "-7deg" } as React.CSSProperties}
      >
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">Term</p>
        <p className="font-display mt-1 text-2xl font-extrabold">Mitochondria</p>
      </div>

      <div
        className="float panel absolute right-0 top-24 w-[82%] p-5"
        style={{ "--r": "3deg", animationDelay: "-2s" } as React.CSSProperties}
      >
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
          What do they do?
        </p>
        <div className="mt-3 flex flex-col gap-2 text-sm font-semibold">
          <span className="rounded-lg border-2 border-line px-3 py-2">Store DNA</span>
          <span className="flex items-center justify-between rounded-lg border-2 border-ink bg-success-soft px-3 py-2">
            Produce most of the cell’s ATP
            <Icon name="check" size={16} className="text-success" />
          </span>
          <span className="rounded-lg border-2 border-line px-3 py-2">Make proteins</span>
        </div>
      </div>

      <div
        className="float panel absolute bottom-0 left-6 flex items-center gap-2 bg-sun px-4 py-3 !text-[#1b1033]"
        style={{ "--r": "-3deg", animationDelay: "-4s" } as React.CSSProperties}
      >
        <Icon name="flame" size={20} className="text-coral" />
        <span className="font-display text-lg font-extrabold">7-day streak</span>
      </div>

      <span className="pop absolute -right-1 bottom-10 flex h-16 w-16 rotate-12 items-center justify-center rounded-full border-2 border-ink bg-mint text-center text-[11px] font-extrabold leading-tight text-[#1b1033] shadow-[3px_3px_0_var(--shadow-color)]">
        100%
        <br />
        free
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Blob className="left-[47%] top-8 hidden h-16 w-16 bg-sun md:block" />
        <Blob className="right-[8%] top-10 h-10 w-10 bg-coral" />
        <Blob className="bottom-6 left-[38%] h-6 w-6 bg-mint" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.15fr_1fr] md:py-20">
          <div className="flex flex-col items-start gap-6">
            <span className="eyebrow bg-sun">
              <Icon name="sparkles" size={14} /> AI study sets · free
            </span>
            <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Turn notes into <span className="hl">flashcards</span> that actually{" "}
              <span className="brand-text">stick</span>.
            </h1>
            <p className="max-w-xl text-lg text-muted">
              Paste your notes or name a topic. Flashly writes the cards, then
              quizzes you, schedules your reviews and tracks your streak. No
              account, no paywall.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/create" className="btn btn-primary btn-lg">
                <Icon name="sparkles" />
                Create a set
              </Link>
              <DemoButton />
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-muted">
              {["No sign-up", "Works on phones", "Dark mode & colors"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Icon name="check" size={14} className="text-success" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* Topic ticker */}
      <div
        aria-hidden="true"
        className="overflow-hidden border-y-2 border-ink bg-primary py-3 text-on-primary"
      >
        <div className="marquee-track flex gap-8 whitespace-nowrap font-display text-lg font-bold">
          {[...TOPICS, ...TOPICS].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-8">
              {t}
              <span className="text-sun">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <span className="eyebrow bg-coral">How it works</span>
          <h2 className="font-display mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            From messy notes to mastered, in three steps
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className={`panel flex flex-col gap-3 p-6 ${s.tint}`}>
              <span className="font-display flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-surface text-2xl font-extrabold">
                {i + 1}
              </span>
              <h3 className="font-display text-2xl font-extrabold">{s.title}</h3>
              <p className="text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Study modes */}
      <section className="border-y-2 border-ink bg-surface-2">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <span className="eyebrow bg-mint">Six ways to study</span>
            <h2 className="font-display mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Never get bored of the same deck
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              Every set works in every mode. Switch when one gets stale.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map((m) => (
              <div
                key={m.title}
                className={`panel flex flex-col gap-3 p-6 transition-transform hover:rotate-0 ${m.tint} ${m.tilt}`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-surface">
                  <Icon name={m.icon} size={22} />
                </span>
                <h3 className="font-display text-2xl font-extrabold">{m.title}</h3>
                <p className="text-sm text-muted">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <span className="eyebrow bg-sky">And there’s more</span>
          <h2 className="font-display mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Small things that make studying nicer
          </h2>
        </div>
        <div className="mt-12 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-primary-soft text-primary shadow-[2px_2px_0_var(--shadow-color)]">
                <Icon name={f.icon} />
              </span>
              <div>
                <h3 className="font-display text-lg font-extrabold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-6">
        <h2 className="font-display text-center text-4xl font-extrabold tracking-tight">
          Questions
        </h2>
        <div className="mt-8 flex flex-col gap-4">
          {FAQ.map((item) => (
            <details key={item.q} className="panel group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
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
        <div className="panel brand-bg relative flex flex-col items-center gap-5 overflow-hidden px-6 py-16 text-center text-white">
          <Blob className="-left-6 -top-6 h-20 w-20 bg-sun" />
          <Blob className="-bottom-5 right-10 h-14 w-14 bg-mint" />
          <h2 className="font-display relative text-4xl font-extrabold tracking-tight sm:text-5xl">
            Ready to study smarter?
          </h2>
          <p className="relative max-w-lg text-white/90">
            Your first set takes less than a minute.
          </p>
          <Link href="/create" className="btn btn-accent btn-lg relative">
            Create your first set
            <Icon name="right" />
          </Link>
        </div>
      </section>
    </>
  );
}
