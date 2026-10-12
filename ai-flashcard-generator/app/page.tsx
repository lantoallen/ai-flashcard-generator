'use client';

import { useState } from 'react';

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type Mode = 'notes' | 'topic';

export default function Home() {
  const [mode, setMode] = useState<Mode>('notes');
  const [notes, setNotes] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setQuestions([]);
    setRevealed({});

    try {
      const body = mode === 'notes' ? { notes } : { topic };

      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }
      setQuestions(data.questions);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canGenerate =
    mode === 'notes' ? notes.trim().length > 0 : topic.trim().length > 0;

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black px-6 py-16">
      <main className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
          AI Flashcard & Quiz Generator
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Paste your notes, or just tell us the topic — we&apos;ll generate the quiz for you.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('notes')}
            className={`rounded-full px-4 py-2 text-sm font-medium border ${
              mode === 'notes'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Paste Notes
          </button>
          <button
            onClick={() => setMode('topic')}
            className={`rounded-full px-4 py-2 text-sm font-medium border ${
              mode === 'topic'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Just a Topic
          </button>
        </div>

        {mode === 'notes' ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={8000}
            rows={8}
            placeholder="Paste your notes here..."
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-black dark:text-white"
          />
        ) : (
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={200}
            placeholder="e.g. Photosynthesis, The French Revolution, Big-O Notation"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-black dark:text-white"
          />
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !canGenerate}
          className="rounded-full bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-medium disabled:opacity-40"
        >
          {loading ? 'Generating...' : 'Generate Quiz'}
        </button>

        {error && <p className="text-red-500">{error}</p>}

        {questions.length > 0 && (
          <div className="flex flex-col gap-6 mt-6">
            {questions.map((q, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 p-4"
              >
                <p className="font-medium text-black dark:text-white mb-3">
                  {i + 1}. {q.question}
                </p>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt) => (
                    <div
                      key={opt}
                      className={`rounded-md px-3 py-2 border text-sm ${
                        revealed[i] && opt === q.correctAnswer
                          ? 'border-green-500 bg-green-50 dark:bg-green-950'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}
                  className="mt-3 text-sm underline text-zinc-600 dark:text-zinc-400"
                >
                  Reveal answer
                </button>
                {revealed[i] && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}