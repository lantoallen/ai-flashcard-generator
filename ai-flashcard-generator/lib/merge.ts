import type { StudySet } from './types';

/** Everything that is synced to an account. */
export type Snapshot = {
  v: 1;
  /** When this snapshot was produced (ms). Used to break ties. */
  savedAt: number;
  sets: StudySet[];
  /** Deleted set ids -> when they were deleted, so deletions propagate. */
  deleted: Record<string, number>;
  /** Cards studied per day (yyyy-mm-dd). */
  activity: Record<string, number>;
  goal?: number;
  pet?: { name: string; xp: number };
};

export const EMPTY_SNAPSHOT: Snapshot = {
  v: 1,
  savedAt: 0,
  sets: [],
  deleted: {},
  activity: {},
};

/** The moment a set was last changed, for last-write-wins merging. */
export function versionOf(set: StudySet): number {
  return set.modifiedAt ?? Math.max(set.updatedAt ?? 0, set.lastStudied ?? 0);
}

/**
 * Merge two snapshots (local and cloud) without losing work:
 * - a set that exists on both sides keeps its newer version;
 * - a set deleted on one side stays deleted unless it was edited afterwards;
 * - study activity takes the larger count per day;
 * - the pet keeps the highest XP and the newer name.
 */
export function mergeSnapshots(a: Snapshot, b: Snapshot): Snapshot {
  const deleted: Record<string, number> = { ...a.deleted };
  for (const [id, ts] of Object.entries(b.deleted)) {
    deleted[id] = Math.max(deleted[id] ?? 0, ts);
  }

  const byId = new Map<string, StudySet>();
  for (const s of [...a.sets, ...b.sets]) {
    const existing = byId.get(s.id);
    if (!existing || versionOf(s) > versionOf(existing)) byId.set(s.id, s);
  }
  const sets = [...byId.values()].filter((s) => (deleted[s.id] ?? 0) < versionOf(s));
  // A set that survived has been re-created or edited after its deletion.
  for (const s of sets) delete deleted[s.id];

  const activity: Record<string, number> = { ...a.activity };
  for (const [day, n] of Object.entries(b.activity)) {
    activity[day] = Math.max(activity[day] ?? 0, n);
  }

  const newer = a.savedAt >= b.savedAt ? a : b;
  const older = newer === a ? b : a;
  const petA = a.pet;
  const petB = b.pet;
  const pet =
    petA || petB
      ? {
          name: (newer.pet ?? older.pet)!.name,
          xp: Math.max(petA?.xp ?? 0, petB?.xp ?? 0),
        }
      : undefined;

  return {
    v: 1,
    savedAt: Math.max(a.savedAt, b.savedAt),
    sets: sets.sort((x, y) => versionOf(y) - versionOf(x)),
    deleted,
    activity,
    goal: newer.goal ?? older.goal,
    pet,
  };
}
