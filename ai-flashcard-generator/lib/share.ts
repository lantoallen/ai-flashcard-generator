import type { StudySet } from './types';
import { uid } from './utils';

/**
 * Share a set without a server: the set is compressed into the URL hash.
 * The hash is never sent to any server, so the data only travels in the link.
 */

type Payload = {
  v: 1;
  t: string;
  d?: string;
  c: [string, string, string[]?][];
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream
): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  writer.write(bytes as BufferSource);
  writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

const canCompress = () =>
  typeof CompressionStream !== 'undefined' &&
  typeof DecompressionStream !== 'undefined';

export async function encodeSet(set: StudySet): Promise<string> {
  const payload: Payload = {
    v: 1,
    t: set.title,
    d: set.description || undefined,
    c: set.cards
      .filter((c) => c.term.trim() && c.definition.trim())
      .map((c) => [c.term, c.definition, c.distractors?.length ? c.distractors : undefined]),
  };
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  if (canCompress()) {
    return `z.${toBase64Url(await pipe(raw, new CompressionStream('deflate-raw')))}`;
  }
  return `p.${toBase64Url(raw)}`;
}

/** Returns null if the link is malformed or from an unsupported browser. */
export async function decodeSet(encoded: string): Promise<StudySet | null> {
  try {
    const [kind, body] = [encoded.slice(0, 2), encoded.slice(2)];
    let bytes = fromBase64Url(body);
    if (kind === 'z.') {
      if (!canCompress()) return null;
      bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    } else if (kind !== 'p.') {
      return null;
    }
    const p = JSON.parse(new TextDecoder().decode(bytes)) as Payload;
    if (p.v !== 1 || typeof p.t !== 'string' || !Array.isArray(p.c)) return null;

    const cards = p.c
      .filter((c) => typeof c[0] === 'string' && typeof c[1] === 'string')
      .slice(0, 200)
      .map(([term, definition, distractors]) => ({
        id: uid(),
        term,
        definition,
        distractors: Array.isArray(distractors)
          ? distractors.filter((x) => typeof x === 'string').slice(0, 3)
          : undefined,
      }));
    if (cards.length === 0) return null;

    const now = Date.now();
    return {
      id: uid(),
      title: p.t.slice(0, 100) || 'Shared set',
      description: typeof p.d === 'string' ? p.d.slice(0, 200) : undefined,
      source: 'import',
      createdAt: now,
      updatedAt: now,
      cards,
    };
  } catch {
    return null;
  }
}
