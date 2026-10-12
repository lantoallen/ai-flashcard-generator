# Flashly – AI flashcards & quizzes

Turn pasted notes or any topic into flashcards and quizzes, then study them six
different ways. Free to run, no accounts, no database.

## Features

- **AI generation** from pasted notes (up to 8,000 characters) or a topic, with
  any card count from 3 to 50 (large sets are generated in batches) and a
  difficulty level.
- **Six study modes**
  - *Flashcards*: flip, shuffle, star, “Got it / Still learning”, read aloud,
    keyboard shortcuts, and an **AI “Explain”** button for any card.
  - *Review*: **spaced repetition** (Leitner boxes) that schedules each card
    just before you'd forget it.
  - *Quiz*: multiple choice using AI-written distractors, review of every miss,
    retry only the missed questions, best score tracking.
  - *Test*: a practice exam mixing multiple choice, true/false and written
    questions, graded when you submit.
  - *Write*: type answers from memory; typos and punctuation are forgiven,
    and a Hint button reveals letters.
  - *Match*: timed pairing game with best-time tracking.
- **Progress**: adjustable daily goal, study streak and a 7-day chart on the
  Library page.
- **Share a set with a link**: the set is compressed into the URL hash, so
  there is no server-side storage.
- **Library**: sets are stored in the browser (localStorage), with search, sort,
  and JSON backup/restore.
- **Edit** any card, add your own, have the AI **add 5 more cards**, or
  **import** a list (paste it or upload a CSV/TXT file).
- **Duplicate** sets in the library.
- **Export** to CSV, JSON or plain text (paste into Quizlet, Anki, Sheets), or
  **print / save as PDF** a study sheet.
- Light/dark mode and five accent colors, responsive layout, confetti, and a
  built-in demo set that works without the AI.

## Getting started

```bash
npm install
```

Create `.env.local` with a free API key from [console.groq.com](https://console.groq.com):

```
GROQ_API_KEY=your_key_here
```

Then run:

```bash
npm run dev
```

Open <http://localhost:3000>.

## How it works

| Piece | Where |
| --- | --- |
| Generation and explain endpoints (validation, rate limit, model fallback) | `app/api/generate/route.ts`, `app/api/explain/route.ts` |
| Pages: landing, create, library, study, about | `app/` |
| Study modes | `components/study/` |
| Local persistence (`useSyncExternalStore` over localStorage) | `lib/storage.ts`, `lib/activity.ts` |
| Spaced repetition and share links | `lib/srs.ts`, `lib/share.ts` |
| Theme and accent colors | `lib/theme.ts`, `app/globals.css` |
| Quiz building and typed-answer checking | `lib/quiz.ts`, `lib/utils.ts` |

Models are tried in order (`openai/gpt-oss-120b`, then `openai/gpt-oss-20b`).
Groq retires models occasionally. If generation starts failing with
“model does not exist”, update the `MODELS` list in `lib/server.ts`.

## Checking a deployment

`GET /api/health` reports whether `GROQ_API_KEY` is set, whether Groq accepts
it, and which configured models are available. It never returns the key.

## Deploying

Works on any Next.js host. On Vercel's free Hobby plan, add `GROQ_API_KEY` as an
environment variable. Note that the in-memory rate limiter is per server
instance.

## Privacy

Sets, progress and streaks never leave the browser. Only the text you submit
for generation or explanation is sent to Groq. Share links carry the set in
the URL hash, which browsers don't send to servers.
