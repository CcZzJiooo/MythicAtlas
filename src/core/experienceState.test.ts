import { describe, expect, it } from 'vitest';

import {
  EXPERIENCE_GEOMETRY,
  ExperienceStateStore,
  getActiveNavItem,
  getGlobeViewMode,
  getInteractionOwner,
  getLodVisibility,
  getGaugeProgress,
  getGaugeDistance,
  getGaugeTier,
  getDioramaGaugeProgress,
  getDioramaGaugeDistance,
  getDioramaGaugeTier
} from './experienceState';

describe('experience state contract', () => {
  it('derives one non-overlapping globe LOD from the shared camera boundaries', () => {
    expect(EXPERIENCE_GEOMETRY.camera.provinceEntry)
      .toBeGreaterThanOrEqual(EXPERIENCE_GEOMETRY.camera.cityBoundary);
    expect(getGlobeViewMode(EXPERIENCE_GEOMETRY.camera.provinceEntry)).toBe('city');
    expect(getGlobeViewMode(EXPERIENCE_GEOMETRY.camera.min)).toBe('city');
    expect(getGlobeViewMode(EXPERIENCE_GEOMETRY.camera.cityBoundary)).toBe('city');
    expect(getGlobeViewMode(EXPERIENCE_GEOMETRY.camera.provinceMax)).toBe('province');
    expect(getGlobeViewMode(EXPERIENCE_GEOMETRY.camera.max)).toBe('macro');
    expect(getLodVisibility(EXPERIENCE_GEOMETRY.camera.cityBoundary)).toEqual({
      cityElevator: true,
      provincialBadges: false,
      macroOverlay: false
    });
  });

  it('keeps camera, scroll, navigation and interaction ownership in one store', () => {
    const store = new ExperienceStateStore();
    const snapshots: string[] = [];
    store.subscribe(state => snapshots.push(`${state.dimension}:${state.globeView}:${state.activeSection}`), false);

    store.setCameraDistance(EXPERIENCE_GEOMETRY.camera.min - 1, EXPERIENCE_GEOMETRY.camera.max + 1);
    store.setScroll(EXPERIENCE_GEOMETRY.scroll.navigationHandoff, 1200);
    store.setActiveGate2Sample('gd-pearl-density');
    store.setDimension('beast');

    const state = store.getState();
    expect(state.cameraDistance).toBe(EXPERIENCE_GEOMETRY.camera.min);
    expect(state.targetCameraDistance).toBe(EXPERIENCE_GEOMETRY.camera.max);
    expect(state.activeSection).toBe('scroll');
    expect(state.activeGate2SampleId).toBe('gd-pearl-density');
    expect(getActiveNavItem(state)).toBe('scroll');
    expect(getInteractionOwner(state)).toBe('scroll');
    expect(snapshots).toContain('globe:city:hero');
    expect(snapshots).toContain('globe:city:scroll');
    expect(snapshots).toContain('beast:city:scroll');
  });

  it('guarantees strictly monotonic equidistant mapping for globe gauge', () => {
    expect(getGaugeProgress(2.12)).toBeCloseTo(0.0, 3);
    expect(getGaugeProgress(3.20)).toBeCloseTo(1 / 3, 3);
    expect(getGaugeProgress(5.40)).toBeCloseTo(2 / 3, 3);
    expect(getGaugeProgress(11.50)).toBeCloseTo(1.0, 3);

    expect(getGaugeDistance(0.0)).toBeCloseTo(2.12, 2);
    expect(getGaugeDistance(1 / 3)).toBeCloseTo(3.20, 2);
    expect(getGaugeDistance(2 / 3)).toBeCloseTo(5.40, 2);
    expect(getGaugeDistance(1.0)).toBeCloseTo(11.50, 2);

    expect(getGaugeTier(2.12)).toBe('洞天');
    expect(getGaugeTier(3.20)).toBe('山海');
    expect(getGaugeTier(5.40)).toBe('神州');
    expect(getGaugeTier(11.50)).toBe('太虚');
  });

  it('guarantees strictly monotonic equidistant mapping for diorama gauge', () => {
    expect(getDioramaGaugeProgress(0.25)).toBeCloseTo(0.0, 3);
    expect(getDioramaGaugeProgress(0.85)).toBeCloseTo(0.25, 3);
    expect(getDioramaGaugeProgress(1.80)).toBeCloseTo(0.50, 3);
    expect(getDioramaGaugeProgress(3.80)).toBeCloseTo(0.75, 3);
    expect(getDioramaGaugeProgress(7.60)).toBeCloseTo(1.0, 3);

    expect(getDioramaGaugeDistance(0.0)).toBeCloseTo(0.25, 2);
    expect(getDioramaGaugeDistance(0.25)).toBeCloseTo(0.85, 2);
    expect(getDioramaGaugeDistance(0.50)).toBeCloseTo(1.80, 2);
    expect(getDioramaGaugeDistance(0.75)).toBeCloseTo(3.80, 2);
    expect(getDioramaGaugeDistance(1.0)).toBeCloseTo(7.60, 2);

    expect(getDioramaGaugeTier(0.25)).toBe('探微');
    expect(getDioramaGaugeTier(0.85)).toBe('城邑');
    expect(getDioramaGaugeTier(1.80)).toBe('名山');
    expect(getDioramaGaugeTier(3.80)).toBe('省域');
    expect(getDioramaGaugeTier(7.60)).toBe('大案');
  });
});
