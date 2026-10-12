# Flashly – AI flashcards & quizzes

Turn pasted notes or any topic into flashcards and quizzes, then study them four
different ways. Free to run, no accounts, no database.

## Features

- **AI generation** from pasted notes (up to 8,000 characters) or a topic, with
  adjustable card count (5–20) and difficulty.
- **Flashcards**: flip, shuffle, star, “Got it / Still learning”, read aloud,
  keyboard shortcuts, filter by starred or unmastered cards.
- **Quiz**: multiple choice using AI-written distractors, review of every miss,
  retry only the missed questions, best score tracking.
- **Write**: type answers from memory; typos and punctuation are forgiven.
- **Match**: timed pairing game with best-time tracking.
- **Library**: sets are stored in the browser (localStorage), with search, sort,
  and JSON backup/restore.
- **Edit** any card, add your own, or **import** a list (tab / comma / “ - ”
  separated).
- **Export** to CSV, JSON or plain text (paste into Quizlet, Anki, Sheets).
- Dark mode, responsive layout, built-in demo set that works without the AI.

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
| Generation endpoint (validation, rate limit, model fallback) | `app/api/generate/route.ts` |
| Pages: landing, create, library, study, about | `app/` |
| Study modes | `components/study/` |
| Local persistence (`useSyncExternalStore` over localStorage) | `lib/storage.ts` |
| Quiz building and typed-answer checking | `lib/quiz.ts`, `lib/utils.ts` |

Models are tried in order (`openai/gpt-oss-120b`, then `openai/gpt-oss-20b`).
Groq retires models occasionally. If generation starts failing with
“model does not exist”, update the `MODELS` list in the route.

## Deploying

Works on any Next.js host. On Vercel's free Hobby plan, add `GROQ_API_KEY` as an
environment variable. Note that the in-memory rate limiter is per server
instance.

## Privacy

Sets and progress never leave the browser. Only the text you submit for
generation is sent to Groq.
