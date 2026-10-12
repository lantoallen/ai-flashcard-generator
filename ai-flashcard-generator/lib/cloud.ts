import type { SupabaseClient } from '@supabase/supabase-js';
import { getActivity, getStoredGoal, replaceActivity, setGoal } from './activity';
import { EMPTY_SNAPSHOT, type Snapshot } from './merge';
import { DEFAULT_NAME, getPet, replacePet } from './pet';
import { getDeleted, getSets, replaceAll } from './storage';

/** Window events fired when local data changes (see the stores in lib/). */
export const LOCAL_CHANGE_EVENTS = [
  'flashly:sets-changed',
  'flashly:activity-changed',
  'flashly:goal-changed',
  'flashly:pet-changed',
] as const;

const MAX_BYTES = 8_000_000;

export function localSnapshot(): Snapshot {
  const pet = getPet();
  const goal = getStoredGoal();
  return {
    v: 1,
    savedAt: Date.now(),
    sets: getSets(),
    deleted: getDeleted(),
    activity: getActivity(),
    goal,
    // Don't let an untouched default pet overwrite a customised one in the cloud.
    pet: pet.xp > 0 || pet.name !== DEFAULT_NAME ? { name: pet.name, xp: pet.xp } : undefined,
  };
}

export function applySnapshot(s: Snapshot): void {
  replaceAll(s.sets, s.deleted);
  replaceActivity(s.activity);
  if (s.goal !== undefined) setGoal(s.goal);
  if (s.pet) replacePet(s.pet.name, s.pet.xp);
}

function isSnapshot(value: unknown): value is Snapshot {
  const s = value as Snapshot;
  return !!s && s.v === 1 && Array.isArray(s.sets) && typeof s.activity === 'object';
}

export async function pullRemote(client: SupabaseClient, userId: string): Promise<Snapshot> {
  const { data, error } = await client
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const remote = data?.data;
  return isSnapshot(remote) ? { ...EMPTY_SNAPSHOT, ...remote } : EMPTY_SNAPSHOT;
}

export async function pushRemote(
  client: SupabaseClient,
  userId: string,
  snapshot: Snapshot
): Promise<void> {
  if (JSON.stringify(snapshot).length > MAX_BYTES) {
    throw new Error('Your library is too large to sync. Delete some sets or export a backup.');
  }
  const { error } = await client
    .from('user_data')
    .upsert(
      { user_id: userId, data: snapshot, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw new Error(error.message);
}

export async function deleteRemote(client: SupabaseClient, userId: string): Promise<void> {
  const { error } = await client.from('user_data').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
}
