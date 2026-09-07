import type { ExplorationProgress, TimeStandard } from '../types';

export const PROGRESS_STORAGE_KEY = 'mythic-atlas:exploration-progress:v1' as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ProgressStoreOptions {
  readonly storage?: StorageLike | null;
  readonly key?: string;
  /** Dynamic time authority. Omit it to reject every destination id. */
  readonly isUnlockedId?: (id: string) => boolean;
}

export interface ProgressStore {
  load(): ExplorationProgress;
  save(progress: ExplorationProgress): ExplorationProgress;
  markDiscovered(id: string): ExplorationProgress;
  markStamped(id: string): ExplorationProgress;
  markLore(id: string): ExplorationProgress;
  setLastVisited(id: string | null): ExplorationProgress;
  setTimeStandard(timeStandard: TimeStandard): ExplorationProgress;
  reset(): ExplorationProgress;
}

class MemoryStorage implements StorageLike {
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

const unavailableMemoryStorage = new MemoryStorage();
const storageFallbacks = new WeakMap<StorageLike, MemoryStorage>();

function fallbackFor(primary: StorageLike | null): MemoryStorage {
  if (primary === null) {
    return unavailableMemoryStorage;
  }

  const existing = storageFallbacks.get(primary);
  if (existing !== undefined) {
    return existing;
  }

  const fallback = new MemoryStorage();
  storageFallbacks.set(primary, fallback);
  return fallback;
}

class ResilientStorage implements StorageLike {
  private primary: StorageLike | null;
  private readonly fallback: MemoryStorage;

  constructor(primary: StorageLike | null) {
    this.primary = primary;
    this.fallback = fallbackFor(primary);
  }

  getItem(key: string): string | null {
    if (this.primary !== null) {
      try {
        const value = this.primary.getItem(key);
        if (value !== null) {
          this.fallback.setItem(key, value);
          return value;
        }
      } catch {
        this.primary = null;
      }
    }
    return this.fallback.getItem(key);
  }

  setItem(key: string, value: string): void {
    this.fallback.setItem(key, value);
    if (this.primary !== null) {
      try {
        this.primary.setItem(key, value);
      } catch {
        this.primary = null;
      }
    }
  }

  removeItem(key: string): void {
    this.fallback.removeItem(key);
    if (this.primary !== null) {
      try {
        this.primary.removeItem(key);
      } catch {
        this.primary = null;
      }
    }
  }
}

function defaultProgress(timeStandard: TimeStandard = 'utc'): ExplorationProgress {
  return {
    version: 1,
    discoveredIds: [],
    stampedIds: [],
    loreIds: [],
    lastVisitedId: null,
    timeStandard,
  };
}

function resolveStorage(storage: StorageLike | null | undefined): StorageLike {
  if (storage !== undefined) {
    return new ResilientStorage(storage);
  }

  try {
    return new ResilientStorage(globalThis.localStorage ?? null);
  } catch {
    return new ResilientStorage(null);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function canUseId(id: string, isUnlockedId: (id: string) => boolean): boolean {
  if (id.trim().length === 0) {
    return false;
  }
  try {
    return isUnlockedId(id) === true;
  } catch {
    return false;
  }
}

function sanitizeIds(value: unknown, isUnlockedId: (id: string) => boolean): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === 'string' && canUseId(id, isUnlockedId),
      ),
    ),
  ];
}

function sanitizeProgress(
  value: unknown,
  isUnlockedId: (id: string) => boolean,
): ExplorationProgress {
  if (!isRecord(value) || value.version !== 1) {
    return defaultProgress();
  }

  const lastVisitedId =
    typeof value.lastVisitedId === 'string' && canUseId(value.lastVisitedId, isUnlockedId)
      ? value.lastVisitedId
      : null;

  return {
    version: 1,
    discoveredIds: sanitizeIds(value.discoveredIds, isUnlockedId),
    stampedIds: sanitizeIds(value.stampedIds, isUnlockedId),
    loreIds: sanitizeIds(value.loreIds, isUnlockedId),
    lastVisitedId,
    timeStandard: value.timeStandard === 'local' ? 'local' : 'utc',
  };
}

/**
 * Creates a versioned progress store. Stored ids are always filtered through
 * isUnlockedId, so persistence can record access but can never grant it.
 */
export function createProgressStore({
  storage: requestedStorage,
  key = PROGRESS_STORAGE_KEY,
  isUnlockedId = () => false,
}: ProgressStoreOptions = {}): ProgressStore {
  const storage = resolveStorage(requestedStorage);

  const load = (): ExplorationProgress => {
    const stored = storage.getItem(key);
    if (stored === null) {
      return defaultProgress();
    }
    try {
      return sanitizeProgress(JSON.parse(stored) as unknown, isUnlockedId);
    } catch {
      return defaultProgress();
    }
  };

  const save = (progress: ExplorationProgress): ExplorationProgress => {
    const sanitized = sanitizeProgress(progress, isUnlockedId);
    storage.setItem(key, JSON.stringify(sanitized));
    return sanitized;
  };

  const assertUnlockedId = (id: string): void => {
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new RangeError('Destination id must be a nonempty string');
    }
    if (!canUseId(id, isUnlockedId)) {
      throw new RangeError('The destination has not unlocked yet');
    }
  };

  const mark = (
    field: 'discoveredIds' | 'stampedIds' | 'loreIds',
    id: string,
  ): ExplorationProgress => {
    assertUnlockedId(id);
    const progress = load();
    return save({
      ...progress,
      [field]: progress[field].includes(id) ? progress[field] : [...progress[field], id],
    });
  };

  const markDiscovered = (id: string): ExplorationProgress => mark('discoveredIds', id);
  const markStamped = (id: string): ExplorationProgress => mark('stampedIds', id);
  const markLore = (id: string): ExplorationProgress => mark('loreIds', id);

  const setLastVisited = (id: string | null): ExplorationProgress => {
    if (id !== null) {
      assertUnlockedId(id);
    }
    return save({ ...load(), lastVisitedId: id });
  };

  const setTimeStandard = (timeStandard: TimeStandard): ExplorationProgress => {
    if (timeStandard !== 'utc' && timeStandard !== 'local') {
      throw new RangeError('timeStandard must be utc or local');
    }
    return save({ ...load(), timeStandard });
  };

  const reset = (): ExplorationProgress => {
    storage.removeItem(key);
    return defaultProgress();
  };

  return {
    load,
    save,
    markDiscovered,
    markStamped,
    markLore,
    setLastVisited,
    setTimeStandard,
    reset,
  };
}
