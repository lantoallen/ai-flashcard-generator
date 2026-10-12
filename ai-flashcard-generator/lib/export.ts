import type { StudySet } from './types';

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function toCsv(set: StudySet): string {
  const rows = set.cards
    .filter((c) => c.term.trim() || c.definition.trim())
    .map((c) => `${csvCell(c.term)},${csvCell(c.definition)}`);
  return ['"Term","Definition"', ...rows].join('\n');
}

/** Tab-separated, ready to paste into Quizlet, Anki, Sheets, etc. */
export function toText(set: StudySet): string {
  return set.cards
    .filter((c) => c.term.trim() || c.definition.trim())
    .map((c) => `${c.term}\t${c.definition}`)
    .join('\n');
}

export function safeFileName(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'flashcards'
  );
}

export function download(fileName: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
