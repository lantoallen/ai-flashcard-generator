/**
 * Text extraction for office documents, entirely in the browser.
 * DOCX, PPTX, XLSX, ODT, ODP and EPUB are zip files of XML; RTF, HTML and
 * CSV are plain text. Nothing here is uploaded anywhere.
 */

import { FileReadError } from './errors';

export type DocUnit = 'page' | 'slide' | 'sheet' | 'chapter' | 'section';
export type ExtractedDoc = { pages: string[]; unit: DocUnit };

const MAX_ENTRY_BYTES = 40 * 1024 * 1024;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;
export const MAX_PAGES = 150;
const SECTION_CHARS = 2500;

// ---- helpers ----------------------------------------------------------------

export function tidy(text: string): string {
  return text
    .replace(/­/g, '')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Split long text into roughly equal sections at paragraph boundaries. */
export function chunkText(text: string, size = SECTION_CHARS): string[] {
  const clean = tidy(text);
  if (!clean) return [];
  if (clean.length <= size) return [clean];

  const out: string[] = [];
  let cur = '';
  const push = () => {
    if (cur.trim()) out.push(cur.trim());
    cur = '';
  };
  for (const para of clean.split(/\n/)) {
    // A single enormous paragraph is cut at sentence ends.
    const pieces =
      para.length > size ? para.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) ?? [para] : [para];
    for (const piece of pieces) {
      if (cur.length + piece.length + 1 > size) push();
      cur += (cur ? '\n' : '') + piece;
    }
  }
  push();
  return out.slice(0, MAX_PAGES);
}

async function unzip(
  file: File,
  want: (name: string) => boolean
): Promise<Record<string, Uint8Array>> {
  const { unzipSync } = await import('fflate');
  const data = new Uint8Array(await file.arrayBuffer());
  let total = 0;
  try {
    return unzipSync(data, {
      filter: (f) => {
        if (!want(f.name) || f.originalSize > MAX_ENTRY_BYTES) return false;
        total += f.originalSize;
        if (total > MAX_TOTAL_BYTES) throw new Error('too large');
        return true;
      },
    });
  } catch {
    throw new FileReadError('That file couldn’t be opened. It may be damaged or protected.');
  }
}

const utf8 = new TextDecoder('utf-8');

function xml(bytes: Uint8Array | undefined): Document | null {
  if (!bytes) return null;
  const doc = new DOMParser().parseFromString(utf8.decode(bytes), 'application/xml');
  return doc.getElementsByTagName('parsererror').length ? null : doc;
}

/** All elements with this local name, ignoring XML namespaces. */
function all(root: Document | Element, localName: string): Element[] {
  return Array.from(root.getElementsByTagNameNS('*', localName));
}

/** Text of a paragraph-like element: runs, tabs and line breaks in order. */
function runText(el: Element, textTag: string, extra: Record<string, string> = {}): string {
  let out = '';
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const name = child.localName;
      if (name === textTag) out += child.textContent ?? '';
      else if (name in extra) out += extra[name];
      else walk(child);
    }
  };
  walk(el);
  return out;
}

const numberIn = (name: string) => Number(/(\d+)\.xml$/.exec(name)?.[1] ?? 0);

// ---- formats ----------------------------------------------------------------

async function docx(file: File): Promise<ExtractedDoc> {
  const files = await unzip(file, (n) => n === 'word/document.xml');
  const doc = xml(files['word/document.xml']);
  if (!doc) throw new FileReadError('That Word file couldn’t be read.');
  const lines = all(doc, 'p')
    .map((p) => runText(p, 't', { tab: '\t', br: '\n' }))
    .map((t) => t.trim())
    .filter(Boolean);
  return { pages: chunkText(lines.join('\n')), unit: 'section' };
}

async function pptx(file: File): Promise<ExtractedDoc> {
  const files = await unzip(file, (n) => /^ppt\/(slides|notesSlides)\/[^/]+\.xml$/.test(n));
  const slides = Object.keys(files)
    .filter((n) => n.startsWith('ppt/slides/'))
    .sort((a, b) => numberIn(a) - numberIn(b));
  const pages: string[] = [];
  for (const name of slides) {
    const doc = xml(files[name]);
    if (!doc) continue;
    const paras = all(doc, 'p')
      .map((p) => runText(p, 't', { br: '\n' }).trim())
      .filter(Boolean);
    const notesDoc = xml(files[`ppt/notesSlides/notesSlide${numberIn(name)}.xml`]);
    const notes = notesDoc
      ? all(notesDoc, 'p')
          .map((p) => runText(p, 't').trim())
          .filter((t) => t && !/^\d+$/.test(t))
      : [];
    const text = [...paras, ...(notes.length ? ['Notes: ' + notes.join(' ')] : [])].join('\n');
    pages.push(text);
  }
  return { pages: pages.slice(0, MAX_PAGES), unit: 'slide' };
}

async function xlsx(file: File): Promise<ExtractedDoc> {
  const files = await unzip(
    file,
    (n) => n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n)
  );
  const strings: string[] = [];
  const sst = xml(files['xl/sharedStrings.xml']);
  if (sst) {
    for (const si of all(sst, 'si')) {
      strings.push(all(si, 't').map((t) => t.textContent ?? '').join(''));
    }
  }
  const sheets = Object.keys(files)
    .filter((n) => n.startsWith('xl/worksheets/'))
    .sort((a, b) => numberIn(a) - numberIn(b));
  const pages: string[] = [];
  for (const name of sheets) {
    const doc = xml(files[name]);
    if (!doc) continue;
    const rows: string[] = [];
    for (const row of all(doc, 'row')) {
      const cells: string[] = [];
      for (const c of all(row, 'c')) {
        const type = c.getAttribute('t');
        const v = all(c, 'v')[0]?.textContent ?? '';
        let text = '';
        if (type === 's') text = strings[Number(v)] ?? '';
        else if (type === 'inlineStr') text = all(c, 't').map((t) => t.textContent ?? '').join('');
        else text = v;
        if (text.trim()) cells.push(text.trim());
      }
      if (cells.length) rows.push(cells.join(' | '));
    }
    pages.push(rows.join('\n'));
  }
  // A big sheet is split into sections so it fits the AI's size limit.
  const split = pages.flatMap((p) => (p.length > SECTION_CHARS * 2 ? chunkText(p) : [p]));
  return { pages: split.slice(0, MAX_PAGES), unit: split.length === pages.length ? 'sheet' : 'section' };
}

async function opendocument(file: File, kind: 'odt' | 'odp'): Promise<ExtractedDoc> {
  const files = await unzip(file, (n) => n === 'content.xml');
  const doc = xml(files['content.xml']);
  if (!doc) throw new FileReadError('That document couldn’t be read.');
  const para = (el: Element) => {
    let out = '';
    const walk = (node: Node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 3) out += child.textContent ?? '';
        else if (child.nodeType === 1) {
          const name = (child as Element).localName;
          if (name === 'tab') out += '\t';
          else if (name === 'line-break') out += '\n';
          else if (name === 's') out += ' ';
          else walk(child);
        }
      }
    };
    walk(el);
    return out.trim();
  };
  if (kind === 'odp') {
    const pages = all(doc, 'page')
      .map((pg) => all(pg, 'p').map(para).filter(Boolean).join('\n'));
    return { pages: pages.slice(0, MAX_PAGES), unit: 'slide' };
  }
  const lines = [...all(doc, 'h'), ...all(doc, 'p')]
    // Keep document order.
    .sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    )
    .map(para)
    .filter(Boolean);
  return { pages: chunkText(lines.join('\n')), unit: 'section' };
}

function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,noscript,nav,header,footer,svg').forEach((n) => n.remove());
  doc.querySelectorAll('br,p,div,li,tr,h1,h2,h3,h4,h5,h6,blockquote,section,article').forEach((n) => {
    n.append(doc.createTextNode('\n'));
  });
  return tidy(doc.body?.textContent ?? '');
}

async function epub(file: File): Promise<ExtractedDoc> {
  const files = await unzip(file, (n) => /\.(x?html?)$/i.test(n) && !/(^|\/)(nav|toc)[^/]*$/i.test(n));
  const pages = Object.keys(files)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((n) => htmlToText(utf8.decode(files[n])))
    .filter((t) => t.length > 40);
  return { pages: pages.slice(0, MAX_PAGES), unit: 'chapter' };
}

/** Windows-1252 characters for the 0x80-0x9F range (curly quotes, dashes, ...). */
const CP1252: Record<number, string> = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ',
  0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž', 0x91: '‘', 0x92: '’', 0x93: '“',
  0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›',
  0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ',
};

/** Remove `{\name ...}` groups (font tables and similar), including nested braces. */
function dropGroups(text: string, names: string[]): string {
  let out = text;
  for (const name of names) {
    const marker = '{\\' + name;
    let at = out.indexOf(marker);
    while (at !== -1) {
      let depth = 0;
      let end = at;
      for (; end < out.length; end++) {
        if (out[end] === '{') depth++;
        else if (out[end] === '}' && --depth === 0) break;
      }
      out = out.slice(0, at) + out.slice(end + 1);
      at = out.indexOf(marker);
    }
  }
  return out;
}

function rtf(text: string): string {
  const stripped = dropGroups(text, ['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'generator']);
  return tidy(
    stripped
      .replace(/\{\\\*[^{}]*\}/g, '') // other destinations
      .replace(/\\'([0-9a-f]{2})/gi, (_, h: string) => {
        const code = parseInt(h, 16);
        return CP1252[code] ?? String.fromCharCode(code);
      })
      .replace(/\\u(-?\d+)\??/g, (_, n: string) =>
        String.fromCharCode(Number(n) < 0 ? Number(n) + 65536 : Number(n))
      )
      .replace(/\\(par|line|sect)\b ?/g, '\n')
      .replace(/\\tab\b ?/g, '\t')
      .replace(/\\[a-z]+-?\d* ?/gi, '')
      .replace(/\\([\\{}])/g, '$1')
      .replace(/[{}]/g, '')
  );
}

// ---- entry point ------------------------------------------------------------

const LEGACY = /\.(doc|ppt|xls|pages|key|numbers)$/i;

export const ACCEPT =
  '.pdf,.docx,.pptx,.xlsx,.odt,.odp,.rtf,.html,.htm,.epub,.csv,.tsv,.txt,.md,application/pdf';

export function isSupportedName(name: string): boolean {
  return /\.(pdf|docx|pptx|xlsx|odt|odp|rtf|html?|epub|csv|tsv|txt|md|markdown|text)$/i.test(name);
}

/** Everything except PDFs (handled in lib/pdf.ts). */
export async function readOtherFile(file: File): Promise<ExtractedDoc> {
  const name = file.name.toLowerCase();

  if (LEGACY.test(name)) {
    throw new FileReadError(
      'Older .doc, .ppt, .xls and Apple files can’t be read. Save a copy as .docx, .pptx, .xlsx or PDF and try again.'
    );
  }

  let result: ExtractedDoc;
  if (name.endsWith('.docx')) result = await docx(file);
  else if (name.endsWith('.pptx')) result = await pptx(file);
  else if (name.endsWith('.xlsx')) result = await xlsx(file);
  else if (name.endsWith('.odt')) result = await opendocument(file, 'odt');
  else if (name.endsWith('.odp')) result = await opendocument(file, 'odp');
  else if (name.endsWith('.epub')) result = await epub(file);
  else if (name.endsWith('.rtf')) result = { pages: chunkText(rtf(await file.text())), unit: 'section' };
  else if (/\.html?$/.test(name)) {
    result = { pages: chunkText(htmlToText(await file.text())), unit: 'section' };
  } else if (isSupportedName(name) || file.type.startsWith('text/')) {
    result = { pages: chunkText(await file.text()), unit: 'section' };
  } else {
    throw new FileReadError(
      'That file type isn’t supported. Try PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx), or a text file.'
    );
  }

  const pages = result.pages.map(tidy).filter(Boolean);
  if (pages.join('').length < 20) {
    throw new FileReadError('No readable text was found in that file.');
  }
  return { pages, unit: result.unit };
}
