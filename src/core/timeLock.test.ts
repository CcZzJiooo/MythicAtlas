import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_LAUNCH_EPOCH,
  FutureUnlockError,
  getUnlockSnapshot,
  guardEpochDay,
  guardUnlockIndex,
} from './timeLock';

const originalTimezone = process.env.TZ;

afterEach(() => {
  if (originalTimezone === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTimezone;
  }
});

describe('getUnlockSnapshot', () => {
  it('uses the stable launch epoch to expose a meaningful archive on 2026-08-19', () => {
    expect(DEFAULT_LAUNCH_EPOCH).toBe('2026-01-01');

    const snapshot = getUnlockSnapshot({
      catalogSize: 365,
      now: new Date('2026-08-19T12:00:00.000Z'),
      timeStandard: 'utc',
    });

    expect(snapshot).toEqual({
      epochDay: 230,
      unlockIndex: 230,
      unlockedCount: 231,
      cycle: 0,
      nextUnlockAt: new Date('2026-08-20T00:00:00.000Z'),
      millisecondsUntilNext: 12 * 60 * 60 * 1_000,
      timeStandard: 'utc',
    });
  });

  it('uses local civil dates and the real next local midnight across DST', () => {
    process.env.TZ = 'America/New_York';
    const now = new Date(2026, 2, 8, 0, 30);

    const snapshot = getUnlockSnapshot({
      catalogSize: 365,
      now,
      timeStandard: 'local',
    });

    expect(snapshot.epochDay).toBe(66);
    expect(snapshot.unlockIndex).toBe(66);
    expect(snapshot.nextUnlockAt).toEqual(new Date(2026, 2, 9));
    expect(snapshot.millisecondsUntilNext).toBe(22.5 * 60 * 60 * 1_000);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid catalog size %s',
    (catalogSize) => {
      expect(() =>
        getUnlockSnapshot({
          catalogSize,
          now: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ).toThrow(RangeError);
    },
  );

  it('rejects an invalid injected clock value', () => {
    expect(() =>
      getUnlockSnapshot({
        catalogSize: 365,
        now: new Date(Number.NaN),
      }),
    ).toThrow(RangeError);
  });

  it('keeps the archive closed before launch and counts down to launch day', () => {
    const snapshot = getUnlockSnapshot({
      catalogSize: 365,
      now: new Date('2025-12-29T12:00:00.000Z'),
      timeStandard: 'utc',
    });

    expect(snapshot).toMatchObject({
      epochDay: -3,
      unlockIndex: -1,
      unlockedCount: 0,
      cycle: 0,
      nextUnlockAt: new Date('2026-01-01T00:00:00.000Z'),
      millisecondsUntilNext: 60 * 60 * 60 * 1_000,
    });
  });

  it('supports a custom civil launch epoch without changing time standards', () => {
    process.env.TZ = 'Asia/Shanghai';

    const snapshot = getUnlockSnapshot({
      catalogSize: 12,
      launchEpoch: '2026-08-19',
      now: new Date(2026, 7, 19, 18, 30),
      timeStandard: 'local',
    });

    expect(snapshot).toMatchObject({
      epochDay: 0,
      unlockIndex: 0,
      unlockedCount: 1,
      cycle: 0,
      nextUnlockAt: new Date(2026, 7, 20),
      millisecondsUntilNext: 5.5 * 60 * 60 * 1_000,
      timeStandard: 'local',
    });
  });

  it('keeps one current destination throughout a UTC civil day', () => {
    const morning = getUnlockSnapshot({
      catalogSize: 365,
      now: new Date('2026-01-10T00:00:00.000Z'),
      timeStandard: 'utc',
    });
    const evening = getUnlockSnapshot({
      catalogSize: 365,
      now: new Date('2026-01-10T23:59:59.999Z'),
      timeStandard: 'utc',
    });
    const tomorrow = getUnlockSnapshot({
      catalogSize: 365,
      now: new Date('2026-01-11T00:00:00.000Z'),
      timeStandard: 'utc',
    });

    expect(evening.epochDay).toBe(morning.epochDay);
    expect(evening.unlockIndex).toBe(morning.unlockIndex);
    expect(tomorrow.epochDay).toBe(morning.epochDay + 1);
    expect(tomorrow.unlockIndex).toBe(morning.unlockIndex + 1);
  });

  it('interprets a Date launch epoch in the selected local standard', () => {
    process.env.TZ = 'Asia/Shanghai';

    const snapshot = getUnlockSnapshot({
      catalogSize: 365,
      launchEpoch: new Date('2026-08-18T16:00:00.000Z'),
      now: new Date('2026-08-19T15:59:59.000Z'),
      timeStandard: 'local',
    });

    expect(snapshot.epochDay).toBe(0);
    expect(snapshot.nextUnlockAt).toEqual(new Date('2026-08-19T16:00:00.000Z'));
  });

  it.each(['2026-02-29', '2026/01/01', 'not-a-date'])(
    'rejects invalid launch epoch %s',
    (launchEpoch) => {
      expect(() =>
        getUnlockSnapshot({
          catalogSize: 365,
          launchEpoch,
          now: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ).toThrow(RangeError);
    },
  );

  it('rejects an invalid time standard received across an untyped boundary', () => {
    expect(() =>
      getUnlockSnapshot({
        catalogSize: 365,
        now: new Date('2026-01-01T00:00:00.000Z'),
        timeStandard: 'solar' as never,
      }),
    ).toThrow(RangeError);
  });

  it('handles dates before 1970 without negative modulo exposure', () => {
    const snapshot = getUnlockSnapshot({
      catalogSize: 365,
      now: new Date('1960-01-02T12:00:00.000Z'),
      timeStandard: 'utc',
    });

    expect(snapshot.epochDay).toBeLessThan(0);
    expect(snapshot.unlockIndex).toBe(-1);
    expect(snapshot.unlockedCount).toBe(0);
    expect(snapshot.cycle).toBe(0);
    expect(snapshot.nextUnlockAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(snapshot.millisecondsUntilNext).toBeGreaterThan(0);
  });
});

describe('guardUnlockIndex', () => {
  it('rejects or clamps a catalog index that has not unlocked yet', () => {
    const snapshot = getUnlockSnapshot({
      catalogSize: 365,
      now: new Date('2026-01-03T12:00:00.000Z'),
      timeStandard: 'utc',
    });

    expect(guardUnlockIndex(2, snapshot)).toBe(2);
    expect(() => guardUnlockIndex(3, snapshot)).toThrow(FutureUnlockError);
    expect(guardUnlockIndex(3, snapshot, 'clamp')).toBe(2);
  });
});

describe('guardEpochDay', () => {
  it('uses the absolute archive day even after the catalog starts another cycle', () => {
    const snapshot = getUnlockSnapshot({
      catalogSize: 3,
      now: new Date('2026-01-08T12:00:00.000Z'),
      timeStandard: 'utc',
    });

    expect(snapshot).toMatchObject({
      epochDay: 7,
      unlockIndex: 1,
      unlockedCount: 3,
      cycle: 2,
    });
    expect(guardUnlockIndex(2, snapshot)).toBe(2);
    expect(guardEpochDay(7, snapshot)).toBe(7);
    expect(() => guardEpochDay(8, snapshot)).toThrow(FutureUnlockError);
    expect(guardEpochDay(8, snapshot, 'clamp')).toBe(7);
  });

  it('reapplies the gate when an injected clock moves backward', () => {
    const laterSnapshot = getUnlockSnapshot({
      catalogSize: 365,
      now: new Date('2026-01-10T12:00:00.000Z'),
    });
    const rolledBackSnapshot = getUnlockSnapshot({
      catalogSize: 365,
      now: new Date('2026-01-04T12:00:00.000Z'),
    });

    expect(laterSnapshot.epochDay).toBe(9);
    expect(() => guardEpochDay(9, rolledBackSnapshot)).toThrow(FutureUnlockError);
    expect(guardEpochDay(9, rolledBackSnapshot, 'clamp')).toBe(3);
  });

  it('uses a closed sentinel when clamping before launch', () => {
    const snapshot = getUnlockSnapshot({
      catalogSize: 365,
      now: new Date('2025-12-31T12:00:00.000Z'),
    });

    expect(guardUnlockIndex(0, snapshot, 'clamp')).toBe(-1);
    expect(guardEpochDay(0, snapshot, 'clamp')).toBe(-1);
    expect(() => guardUnlockIndex(0, snapshot)).toThrow(FutureUnlockError);
    expect(() => guardEpochDay(0, snapshot)).toThrow(FutureUnlockError);
  });

  it('rejects malformed index and day requests', () => {
    const snapshot = getUnlockSnapshot({
      catalogSize: 365,
      now: new Date('2026-01-02T12:00:00.000Z'),
    });

    expect(() => guardUnlockIndex(-1, snapshot)).toThrow(RangeError);
    expect(() => guardUnlockIndex(1.5, snapshot)).toThrow(RangeError);
    expect(() => guardEpochDay(-1, snapshot)).toThrow(RangeError);
    expect(() => guardEpochDay(Number.NaN, snapshot)).toThrow(RangeError);
  });
});
