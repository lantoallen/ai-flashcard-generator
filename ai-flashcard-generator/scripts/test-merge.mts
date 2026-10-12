// Run with: node --experimental-strip-types scripts/test-merge.mts
import assert from 'node:assert/strict';
import { mergeSnapshots, EMPTY_SNAPSHOT, type Snapshot } from '../lib/merge.ts';

const set = (id: string, over: Record<string, unknown> = {}) => ({
  id, title: id, cards: [], source: 'manual' as const, createdAt: 1, updatedAt: 1, ...over,
});
const snap = (over: Partial<Snapshot>): Snapshot => ({ ...EMPTY_SNAPSHOT, ...over });
let n = 0;
const t = (name: string, fn: () => void) => { fn(); n++; console.log('  ok -', name); };

t('keeps sets that exist on only one side', () => {
  const m = mergeSnapshots(snap({ sets: [set('a')] }), snap({ sets: [set('b')] }));
  assert.deepEqual(m.sets.map((s) => s.id).sort(), ['a', 'b']);
});
t('newer version of the same set wins', () => {
  const m = mergeSnapshots(
    snap({ sets: [set('a', { title: 'old', modifiedAt: 10 })] }),
    snap({ sets: [set('a', { title: 'new', modifiedAt: 20 })] })
  );
  assert.equal(m.sets.length, 1);
  assert.equal(m.sets[0].title, 'new');
});
t('falls back to updatedAt/lastStudied when modifiedAt is missing', () => {
  const m = mergeSnapshots(
    snap({ sets: [set('a', { title: 'local', updatedAt: 5, lastStudied: 50 })] }),
    snap({ sets: [set('a', { title: 'cloud', updatedAt: 30 })] })
  );
  assert.equal(m.sets[0].title, 'local');
});
t('a deletion on one side removes the set', () => {
  const m = mergeSnapshots(
    snap({ sets: [set('a', { modifiedAt: 10 })] }),
    snap({ deleted: { a: 20 } })
  );
  assert.equal(m.sets.length, 0);
  assert.equal(m.deleted.a, 20);
});
t('editing a set after it was deleted elsewhere brings it back', () => {
  const m = mergeSnapshots(
    snap({ sets: [set('a', { modifiedAt: 30 })] }),
    snap({ deleted: { a: 20 } })
  );
  assert.equal(m.sets.length, 1);
  assert.equal(m.deleted.a, undefined);
});
t('activity takes the larger count per day, without double counting', () => {
  const m = mergeSnapshots(
    snap({ activity: { '2026-10-01': 5, '2026-10-02': 3 } }),
    snap({ activity: { '2026-10-01': 8, '2026-10-03': 1 } })
  );
  assert.deepEqual(m.activity, { '2026-10-01': 8, '2026-10-02': 3, '2026-10-03': 1 });
});
t('pet keeps the highest xp and the newer name', () => {
  const m = mergeSnapshots(
    snap({ savedAt: 10, pet: { name: 'Old', xp: 90 } }),
    snap({ savedAt: 20, pet: { name: 'Newer', xp: 40 } })
  );
  assert.deepEqual(m.pet, { name: 'Newer', xp: 90 });
});
t('merging with an empty snapshot is a no-op', () => {
  const a = snap({ sets: [set('a', { modifiedAt: 5 })], activity: { d: 2 }, goal: 30 });
  const m = mergeSnapshots(a, EMPTY_SNAPSHOT);
  assert.equal(m.sets.length, 1);
  assert.equal(m.goal, 30);
  assert.deepEqual(m.activity, { d: 2 });
});
t('is symmetric for sets', () => {
  const a = snap({ sets: [set('x', { modifiedAt: 1 }), set('y', { modifiedAt: 9 })] });
  const b = snap({ sets: [set('x', { modifiedAt: 5, title: 'b' })], deleted: { y: 4 } });
  const ab = mergeSnapshots(a, b); const ba = mergeSnapshots(b, a);
  assert.deepEqual(ab.sets.map((s) => s.id + s.title).sort(), ba.sets.map((s) => s.id + s.title).sort());
});
console.log(`\n${n} merge tests passed`);
