export type Card = {
  id: string;
  term: string;
  definition: string;
  /** Plausible wrong answers (for definitions) used by the quiz. */
  distractors?: string[];
  starred?: boolean;
  /** "Got it" in flashcard mode, or box 3+ in spaced-repetition review. */
  known?: boolean;
  /** Spaced repetition: Leitner box (0 = new / forgotten). */
  box?: number;
  /** Spaced repetition: when the card is next due (ms since epoch). */
  due?: number;
};

export type SetSource = 'notes' | 'topic' | 'import' | 'manual' | 'demo' | 'community';

export type StudySet = {
  id: string;
  title: string;
  description?: string;
  cards: Card[];
  source: SetSource;
  createdAt: number;
  updatedAt: number;
  lastStudied?: number;
  /** Last time anything in this set changed (used when syncing between devices). */
  modifiedAt?: number;
  /** Best quiz score, 0-100. */
  bestQuiz?: number;
  /** Best match-game time in ms. */
  bestMatchMs?: number;
};

export const SOURCE_LABEL: Record<SetSource, string> = {
  notes: 'From notes',
  topic: 'From topic',
  import: 'Imported',
  manual: 'Manual',
  demo: 'Demo',
  community: 'From community',
};
