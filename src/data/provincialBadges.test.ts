import { describe, expect, it } from 'vitest';
import { PROVINCIAL_BADGES_DATA } from './provincialBadges';

describe('provincial badge data boundary', () => {
  it('keeps the existing Guangdong presentation record', () => {
    expect(PROVINCIAL_BADGES_DATA.guangdong.provCode).toBe('GD');
    expect(PROVINCIAL_BADGES_DATA.guangdong.gate2SampleId).toBeUndefined();
  });

  it('keeps the Jiangnan province entry explicitly tied to the Gate 2 runtime slice', () => {
    const slice = PROVINCIAL_BADGES_DATA.zhejiang;

    expect(slice.provCode).toBe('ZJ');
    expect(slice.gate2SampleId).toBe('non-gd-jiangnan-candidate');
    expect(slice.enterHint).toContain('行政边界复核中');
    expect(slice.coords.lat).toBeCloseTo(29.1696, 4);
    expect(slice.coords.lng).toBeCloseTo(120.1082, 4);
  });
});
