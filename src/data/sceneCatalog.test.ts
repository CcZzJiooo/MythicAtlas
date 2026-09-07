import { describe, expect, it } from 'vitest';
import { DESTINATIONS_DATA } from './destinations';
import {
  createSceneCatalog,
  DEFAULT_SCENE_CATALOG
} from './sceneCatalog';

describe('SceneCatalog injection boundary', () => {
  it('uses canonical destinations and existing geometry by default', () => {
    expect(DEFAULT_SCENE_CATALOG.destinations).toBe(DESTINATIONS_DATA);
    expect(DEFAULT_SCENE_CATALOG.provinceFeatures.length).toBeGreaterThan(0);
    expect(DEFAULT_SCENE_CATALOG.cityFeatures.length).toBeGreaterThan(0);
    expect(DEFAULT_SCENE_CATALOG.cityFeatures.some(feature => feature.name === '杭州市')).toBe(true);
    expect(DEFAULT_SCENE_CATALOG.provinceFeatures.some(feature => feature.name === '浙江省')).toBe(true);
    expect(DEFAULT_SCENE_CATALOG.provincialBadges.some(badge => badge.id === 'zhejiang')).toBe(true);
  });

  it('allows a future regional slice to replace data arrays without changing the shape', () => {
    const regionalSlice = createSceneCatalog({
      destinations: [],
      cityFeatures: []
    });

    expect(regionalSlice.provinceFeatures).toBe(DEFAULT_SCENE_CATALOG.provinceFeatures);
    expect(regionalSlice.destinations).toEqual([]);
    expect(regionalSlice.cityFeatures).toEqual([]);
  });
});
