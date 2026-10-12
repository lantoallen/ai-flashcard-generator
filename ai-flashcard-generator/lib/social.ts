/** Types and small helpers for profiles, community posts and messages. */

export type DmPolicy = 'everyone' | 'nobody';
export type Visibility = 'public' | 'private';

/** The part of a profile that other signed-in users can see. */
export type PublicProfile = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  avatarColor: string;
};

export type Profile = PublicProfile & {
  bio: string;
  interests: string[];
  accent: string | null;
  dmPolicy: DmPolicy;
  discoverable: boolean;
  createdAt: string;
};

/** A person in search results or suggestions. */
export type Person = Profile & { shared: number };

export type PostCard = { term: string; definition: string; distractors?: string[] };

export type PostSummary = {
  id: string;
  authorId: string;
  author: PublicProfile | null;
  title: string;
  description: string;
  tags: string[];
  cardCount: number;
  visibility: Visibility;
  likeCount: number;
  hidden: boolean;
  createdAt: string;
};

export type Post = PostSummary & { cards: PostCard[] };

export type Message = {
  id: number;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type Conversation = {
  partner: PublicProfile;
  lastBody: string;
  lastAt: string;
  lastFromMe: boolean;
  unread: number;
};

// ---- Limits (mirrored by the database constraints) ---------------------------

export const LIMITS = {
  username: { min: 3, max: 20 },
  displayName: 40,
  bio: 280,
  interests: 10,
  tag: 24,
  postTags: 8,
  postTitle: 100,
  postDescription: 500,
  message: 1000,
  report: 500,
  minAge: 13,
} as const;

// ---- Avatars -----------------------------------------------------------------

export const AVATAR_COLORS: { id: string; label: string; bg: string; fg: string }[] = [
  { id: 'violet', label: 'Violet', bg: '#6c47ff', fg: '#ffffff' },
  { id: 'coral', label: 'Coral', bg: '#ff5d73', fg: '#1b1033' },
  { id: 'sun', label: 'Sun', bg: '#ffc83d', fg: '#1b1033' },
  { id: 'mint', label: 'Mint', bg: '#2ed3a4', fg: '#1b1033' },
  { id: 'sky', label: 'Sky', bg: '#3ab8ff', fg: '#1b1033' },
  { id: 'pink', label: 'Pink', bg: '#f472b6', fg: '#1b1033' },
  { id: 'lime', label: 'Lime', bg: '#a3e635', fg: '#1b1033' },
  { id: 'slate', label: 'Slate', bg: '#475569', fg: '#ffffff' },
];

export function avatarColor(id: string) {
  return AVATAR_COLORS.find((c) => c.id === id) ?? AVATAR_COLORS[0];
}

export function initialOf(p: Pick<PublicProfile, 'displayName' | 'username'>): string {
  return (p.displayName.trim()[0] ?? p.username[0] ?? '?').toUpperCase();
}

export function nameOf(p: Pick<PublicProfile, 'displayName' | 'username'>): string {
  return p.displayName.trim() || `@${p.username}`;
}

// ---- Normalising user input --------------------------------------------------

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, LIMITS.username.max);
}

export function usernameProblem(username: string): string | null {
  if (username.length < LIMITS.username.min) {
    return `Usernames need at least ${LIMITS.username.min} characters.`;
  }
  if (username.length > LIMITS.username.max) {
    return `Usernames can be at most ${LIMITS.username.max} characters.`;
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return 'Use only lowercase letters, numbers and underscores.';
  }
  return null;
}

/** One interest or tag: lowercase, trimmed, safe characters only. */
export function normalizeTag(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9 +#&._-]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[^a-z0-9]+/, '')
    .trim()
    .slice(0, LIMITS.tag);
}

export function normalizeTags(input: string[], max: number): string[] {
  const out: string[] = [];
  for (const raw of input) {
    const t = normalizeTag(raw);
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

/** Age in whole years on `today`, or null if the date is not valid. */
export function ageFromBirthday(birthday: string, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  let age = today.getFullYear() - y;
  if (today.getMonth() < mo - 1 || (today.getMonth() === mo - 1 && today.getDate() < d)) age--;
  return age;
}

export function birthdayProblem(birthday: string, today: Date = new Date()): string | null {
  if (!birthday) return null;
  const age = ageFromBirthday(birthday, today);
  if (age === null) return 'Enter a valid date.';
  if (age < 0) return 'That date is in the future.';
  if (age < LIMITS.minAge) {
    return `You need to be at least ${LIMITS.minAge} to use the community.`;
  }
  if (age > 120) return 'Please check that date.';
  return null;
}

/** Interests that appear in both lists, in the order of `mine`. */
export function sharedInterests(mine: string[], theirs: string[]): string[] {
  const set = new Set(theirs);
  return mine.filter((i) => set.has(i));
}

export function timeAgo(iso: string, nowMs: number): string {
  const diff = Math.max(0, nowMs - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
