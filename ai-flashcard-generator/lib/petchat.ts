import { useSyncExternalStore } from 'react';

/** The conversation with the study buddy, kept in this browser only. */

const KEY = 'flashly:pet-chat:v1';
const EVENT = 'flashly:pet-chat-changed';
const KEEP = 30;
const EMPTY: ChatMessage[] = [];

export type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };

let cachedRaw: string | null = null;
let cached: ChatMessage[] = EMPTY;

function read(): ChatMessage[] {
  if (typeof window === 'undefined') return EMPTY;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cached = Array.isArray(parsed)
      ? (parsed as ChatMessage[]).filter(
          (m) =>
            m &&
            typeof m.id === 'string' &&
            typeof m.content === 'string' &&
            (m.role === 'user' || m.role === 'assistant')
        )
      : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function write(list: ChatMessage[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-KEEP)));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function usePetChat(): ChatMessage[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function appendChat(message: ChatMessage): void {
  write([...read(), message]);
}

export function clearPetChat(): void {
  write([]);
}
