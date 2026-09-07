import { describe, expect, it } from 'vitest';

import type { ExplorationProgress } from '../types';
import {
  createProgressStore,
  PROGRESS_STORAGE_KEY,
  type StorageLike,
} from './progressStore';

class TestStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class ThrowingStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('Storage is unavailable');
  }

  setItem(): void {
    throw new Error('Storage is unavailable');
  }

  removeItem(): void {
    throw new Error('Storage is unavailable');
  }
}

describe('createProgressStore', () => {
  it('uses a versioned default storage key', () => {
    expect(PROGRESS_STORAGE_KEY).toMatch(/:v1$/);
  });

  it('persists discovered destinations through its public API', () => {
    const storage = new TestStorage();
    const options = {
      storage,
      isUnlockedId: (id: string) => id === 'jiuzhaigou',
    };

    const saved = createProgressStore(options).markDiscovered('jiuzhaigou');
    const loaded = createProgressStore(options).load();

    expect(saved.discoveredIds).toEqual(['jiuzhaigou']);
    expect(loaded).toEqual(saved);
  });

  it('updates every progress field and deduplicates repeated markers', () => {
    const store = createProgressStore({
      storage: new TestStorage(),
      isUnlockedId: (id) => id === 'jiuzhaigou',
    });

    store.markDiscovered('jiuzhaigou');
    store.markDiscovered('jiuzhaigou');
    store.markStamped('jiuzhaigou');
    store.markStamped('jiuzhaigou');
    store.markLore('jiuzhaigou');
    store.markLore('jiuzhaigou');
    store.setLastVisited('jiuzhaigou');
    store.setTimeStandard('local');

    expect(store.load()).toEqual({
      version: 1,
      discoveredIds: ['jiuzhaigou'],
      stampedIds: ['jiuzhaigou'],
      loreIds: ['jiuzhaigou'],
      lastVisitedId: 'jiuzhaigou',
      timeStandard: 'local',
    });
  });

  it('returns clean defaults when persisted JSON is corrupt', () => {
    const storage = new TestStorage();
    storage.setItem(PROGRESS_STORAGE_KEY, '{not json');

    expect(createProgressStore({ storage }).load()).toEqual({
      version: 1,
      discoveredIds: [],
      stampedIds: [],
      loreIds: [],
      lastVisitedId: null,
      timeStandard: 'utc',
    });
  });

  it('sanitizes schema fields, deduplicates ids, and removes locked ids on load', () => {
    const storage = new TestStorage();
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        discoveredIds: ['past', 'past', 'future', 42, ''],
        stampedIds: 'not an array',
        loreIds: ['future', 'past', 'past'],
        lastVisitedId: 'future',
        timeStandard: 'invalid',
      }),
    );

    expect(
      createProgressStore({
        storage,
        isUnlockedId: (id) => id === 'past',
      }).load(),
    ).toEqual({
      version: 1,
      discoveredIds: ['past'],
      stampedIds: [],
      loreIds: ['past'],
      lastVisitedId: null,
      timeStandard: 'utc',
    });
  });

  it('sanitizes caller supplied progress before saving it', () => {
    const storage = new TestStorage();
    const store = createProgressStore({
      storage,
      isUnlockedId: (id) => id === 'past',
    });
    const untrusted = {
      version: 1,
      discoveredIds: ['past', 'future', 'past'],
      stampedIds: ['future'],
      loreIds: ['past', null],
      lastVisitedId: 'future',
      timeStandard: 'local',
    } as unknown as ExplorationProgress;

    expect(store.save(untrusted)).toEqual({
      version: 1,
      discoveredIds: ['past'],
      stampedIds: [],
      loreIds: ['past'],
      lastVisitedId: null,
      timeStandard: 'local',
    });
    expect(store.load()).toEqual(store.save(untrusted));
  });

  it('falls back to shared memory when browser storage throws', () => {
    const options = {
      storage: new ThrowingStorage(),
      key: 'mythic-atlas:test:private-storage:v1',
      isUnlockedId: (id: string) => id === 'past',
    };
    const firstStore = createProgressStore(options);

    expect(() => firstStore.markDiscovered('past')).not.toThrow();
    firstStore.setTimeStandard('local');

    const secondStore = createProgressStore(options);
    expect(secondStore.load()).toMatchObject({
      discoveredIds: ['past'],
      timeStandard: 'local',
    });
    secondStore.reset();
  });

  it('rechecks the unlock authority after a clock rollback', () => {
    let unlocked = true;
    const store = createProgressStore({
      storage: new TestStorage(),
      isUnlockedId: () => unlocked,
    });
    store.markDiscovered('today');
    store.setLastVisited('today');

    unlocked = false;

    expect(store.load()).toMatchObject({
      discoveredIds: [],
      lastVisitedId: null,
    });
    expect(() => store.markStamped('today')).toThrow(RangeError);
    expect(() => store.setLastVisited('today')).toThrow(RangeError);
  });

  it('treats a failed unlock authority as locked instead of leaking its error', () => {
    const storage = new TestStorage();
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        discoveredIds: ['today'],
        stampedIds: [],
        loreIds: [],
        lastVisitedId: 'today',
        timeStandard: 'utc',
      }),
    );
    const store = createProgressStore({
      storage,
      isUnlockedId: () => {
        throw new Error('Clock authority unavailable');
      },
    });

    expect(store.load()).toMatchObject({
      discoveredIds: [],
      lastVisitedId: null,
    });
    expect(() => store.markDiscovered('today')).toThrow(RangeError);
  });

  it.each([
    'null',
    '[]',
    JSON.stringify({ version: 2, discoveredIds: ['past'] }),
    JSON.stringify({ version: '1', discoveredIds: ['past'] }),
  ])('rejects unsupported persisted schema %s', (serialized) => {
    const storage = new TestStorage();
    storage.setItem(PROGRESS_STORAGE_KEY, serialized);

    expect(
      createProgressStore({
        storage,
        isUnlockedId: () => true,
      }).load(),
    ).toEqual({
      version: 1,
      discoveredIds: [],
      stampedIds: [],
      loreIds: [],
      lastVisitedId: null,
      timeStandard: 'utc',
    });
  });

  it('clears all progress and restores defaults on reset', () => {
    const store = createProgressStore({
      storage: new TestStorage(),
      isUnlockedId: () => true,
    });
    store.markDiscovered('past');
    store.markStamped('past');
    store.markLore('past');
    store.setLastVisited('past');
    store.setTimeStandard('local');

    const reset = store.reset();

    expect(reset).toEqual({
      version: 1,
      discoveredIds: [],
      stampedIds: [],
      loreIds: [],
      lastVisitedId: null,
      timeStandard: 'utc',
    });
    expect(store.load()).toEqual(reset);
  });

  it('supports clearing last visited without erasing other progress', () => {
    const store = createProgressStore({
      storage: new TestStorage(),
      isUnlockedId: () => true,
    });
    store.markDiscovered('past');
    store.setLastVisited('past');

    const progress = store.setLastVisited(null);

    expect(progress.discoveredIds).toEqual(['past']);
    expect(progress.lastVisitedId).toBeNull();
  });

  it('rejects invalid ids, invalid standards, and locked ids', () => {
    const store = createProgressStore({
      storage: new TestStorage(),
      isUnlockedId: (id) => id === 'past',
    });

    expect(() => store.markDiscovered('')).toThrow(RangeError);
    expect(() => store.markStamped('   ')).toThrow(RangeError);
    expect(() => store.markLore('future')).toThrow(RangeError);
    expect(() => store.setLastVisited('future')).toThrow(RangeError);
    expect(() => store.setTimeStandard('solar' as never)).toThrow(RangeError);
  });

  it('uses shared in-memory persistence when storage is explicitly unavailable', () => {
    const options = {
      storage: null,
      key: 'mythic-atlas:test:memory-only:v1',
      isUnlockedId: (id: string) => id === 'past',
    };
    const firstStore = createProgressStore(options);
    firstStore.reset();
    firstStore.markLore('past');

    const secondStore = createProgressStore(options);
    expect(secondStore.load().loreIds).toEqual(['past']);
    secondStore.reset();
  });
});
