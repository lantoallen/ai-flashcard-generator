/** Read text out of a PDF (or plain text file) entirely in the browser. */

export class FileReadError extends Error {}

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_PAGES = 150;

export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function tidy(text: string): string {
  return text
    .replace(/­/g, '') // soft hyphens
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/** One string per page. Text files come back as a single page. */
export async function readFilePages(file: File): Promise<string[]> {
  if (file.size > MAX_BYTES) {
    throw new FileReadError('That file is too large. Please use one under 20 MB.');
  }

  if (!isPdf(file)) {
    if (!/\.(txt|md|markdown|text)$/i.test(file.name) && !file.type.startsWith('text/')) {
      throw new FileReadError('Please choose a PDF or a text file (.txt or .md).');
    }
    const text = tidy(await file.text());
    if (!text) throw new FileReadError('That file is empty.');
    return [text];
  }

  // Loaded on demand: the PDF reader is large and most visits never need it.
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  let doc;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === 'PasswordException') {
      throw new FileReadError('That PDF is password-protected. Remove the password and try again.');
    }
    throw new FileReadError('That PDF couldn’t be read. It may be damaged.');
  }

  const pages: string[] = [];
  const count = Math.min(doc.numPages, MAX_PAGES);
  for (let i = 1; i <= count; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let line = '';
    let text = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        text += `${line}\n`;
        line = '';
      } else if (item.str && !item.str.endsWith(' ')) {
        line += ' ';
      }
    }
    pages.push(tidy(text + line));
  }
  void doc.cleanup?.();

  if (pages.join('').length < 20) {
    throw new FileReadError(
      'No readable text found. This looks like a scanned PDF (pictures of pages). Try a PDF with selectable text.'
    );
  }
  return pages;
}

/** Pages `from`..`to` (1-based, inclusive) joined and cut to `max` characters. */
export function joinPages(pages: string[], from: number, to: number, max: number) {
  const text = pages
    .slice(Math.max(0, from - 1), Math.max(from, to))
    .filter(Boolean)
    .join('\n\n');
  return { text: text.slice(0, max), truncated: text.length > max };
}

/** Last page such that pages 1..n fit in `max` characters (at least page 1). */
export function pagesThatFit(pages: string[], max: number): number {
  let total = 0;
  for (let i = 0; i < pages.length; i++) {
    total += pages[i].length + 2;
    if (total > max) return Math.max(1, i);
  }
  return Math.max(1, pages.length);
}
