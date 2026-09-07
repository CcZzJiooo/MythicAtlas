import type { TimeStandard, UnlockSnapshot } from '../types';

const MILLISECONDS_PER_DAY = 86_400_000;

/** Stable civil launch date. Day zero is 2026-01-01 in the selected standard. */
export const DEFAULT_LAUNCH_EPOCH = '2026-01-01' as const;

export type LaunchEpoch = string | Date;

export interface TimeLockOptions {
  readonly catalogSize: number;
  readonly now?: Date;
  readonly timeStandard?: TimeStandard;
  readonly launchEpoch?: LaunchEpoch;
}

export type FutureAccessPolicy = 'reject' | 'clamp';

export class FutureUnlockError extends RangeError {
  constructor(message = 'The requested destination has not unlocked yet') {
    super(message);
    this.name = 'FutureUnlockError';
  }
}

interface CivilDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function getCivilDateParts(date: Date, timeStandard: TimeStandard): CivilDateParts {
  if (timeStandard === 'local') {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
    };
  }

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

function civilOrdinal({ year, month, day }: CivilDateParts): number {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month, day);
  return Math.floor(date.getTime() / MILLISECONDS_PER_DAY);
}

function nextCivilMidnight(
  { year, month, day }: CivilDateParts,
  timeStandard: TimeStandard,
): Date {
  const date = new Date(0);

  if (timeStandard === 'local') {
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month, day + 1);
    return date;
  }

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month, day + 1);
  return date;
}

function civilMidnight(
  { year, month, day }: CivilDateParts,
  timeStandard: TimeStandard,
): Date {
  const date = new Date(0);

  if (timeStandard === 'local') {
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month, day);
    return date;
  }

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month, day);
  return date;
}

function parseLaunchEpoch(
  launchEpoch: LaunchEpoch,
  timeStandard: TimeStandard,
): CivilDateParts {
  if (launchEpoch instanceof Date) {
    if (!Number.isFinite(launchEpoch.getTime())) {
      throw new RangeError('launchEpoch must be a valid Date');
    }
    return getCivilDateParts(launchEpoch, timeStandard);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(launchEpoch);
  if (!match) {
    throw new RangeError('launchEpoch must use the YYYY-MM-DD civil date format');
  }

  const parts = {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
  const checkedDate = civilMidnight(parts, 'utc');
  if (
    checkedDate.getUTCFullYear() !== parts.year ||
    checkedDate.getUTCMonth() !== parts.month ||
    checkedDate.getUTCDate() !== parts.day
  ) {
    throw new RangeError('launchEpoch must be a real civil date');
  }

  return parts;
}

/**
 * Calculates one civil-day view of the catalog.
 *
 * epochDay is the signed number of civil days since launch. unlockIndex is -1
 * before launch and otherwise wraps through the catalog. unlockedCount counts
 * distinct accessible catalog entries and therefore never exceeds catalogSize.
 */
export function getUnlockSnapshot({
  catalogSize,
  now = new Date(),
  timeStandard = 'utc',
  launchEpoch = DEFAULT_LAUNCH_EPOCH,
}: TimeLockOptions): UnlockSnapshot {
  if (!Number.isSafeInteger(catalogSize) || catalogSize <= 0) {
    throw new RangeError('catalogSize must be a positive safe integer');
  }

  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new RangeError('now must be a valid Date');
  }

  if (timeStandard !== 'utc' && timeStandard !== 'local') {
    throw new RangeError('timeStandard must be utc or local');
  }

  const launchCivilDate = parseLaunchEpoch(launchEpoch, timeStandard);
  const currentCivilDate = getCivilDateParts(now, timeStandard);
  const epochDay = civilOrdinal(currentCivilDate) - civilOrdinal(launchCivilDate);
  const nextUnlockAt =
    epochDay < 0
      ? civilMidnight(launchCivilDate, timeStandard)
      : nextCivilMidnight(currentCivilDate, timeStandard);

  return {
    epochDay,
    unlockIndex: epochDay < 0 ? -1 : epochDay % catalogSize,
    unlockedCount: epochDay < 0 ? 0 : Math.min(epochDay + 1, catalogSize),
    cycle: epochDay < 0 ? 0 : Math.floor(epochDay / catalogSize),
    nextUnlockAt,
    millisecondsUntilNext: nextUnlockAt.getTime() - now.getTime(),
    timeStandard,
  };
}

export function guardUnlockIndex(
  requestedIndex: number,
  snapshot: UnlockSnapshot,
  policy: FutureAccessPolicy = 'reject',
): number {
  if (!Number.isSafeInteger(requestedIndex) || requestedIndex < 0) {
    throw new RangeError('requestedIndex must be a nonnegative safe integer');
  }

  const latestUnlockedIndex = snapshot.unlockedCount - 1;
  if (requestedIndex <= latestUnlockedIndex) {
    return requestedIndex;
  }

  if (policy === 'clamp') {
    return latestUnlockedIndex;
  }

  throw new FutureUnlockError();
}

/** Guards an absolute archive day, where launch day is day zero. */
export function guardEpochDay(
  requestedEpochDay: number,
  snapshot: UnlockSnapshot,
  policy: FutureAccessPolicy = 'reject',
): number {
  if (!Number.isSafeInteger(requestedEpochDay) || requestedEpochDay < 0) {
    throw new RangeError('requestedEpochDay must be a nonnegative safe integer');
  }

  if (requestedEpochDay <= snapshot.epochDay) {
    return requestedEpochDay;
  }

  if (policy === 'clamp') {
    return snapshot.epochDay < 0 ? -1 : snapshot.epochDay;
  }

  throw new FutureUnlockError('The requested archive day has not unlocked yet');
}
