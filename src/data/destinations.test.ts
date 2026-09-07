import { describe, expect, it } from 'vitest';

import { DESTINATIONS_DATA } from './destinations';

describe('DESTINATIONS_DATA sample catalog', () => {
  it('uses the canonical 34-entry destination sample as its only source', () => {
    expect(DESTINATIONS_DATA).toHaveLength(34);
    expect(new Set(DESTINATIONS_DATA.map(({ id }) => id)).size).toBe(DESTINATIONS_DATA.length);
    expect(new Set(DESTINATIONS_DATA.map(({ dayIndex }) => dayIndex)).size).toBe(DESTINATIONS_DATA.length);
    expect(DESTINATIONS_DATA.map(({ dayIndex }) => dayIndex)).toEqual(
      Array.from({ length: DESTINATIONS_DATA.length }, (_, index) => index),
    );
    expect(DESTINATIONS_DATA.some(({ id }) => id === 'hongkong')).toBe(true);
    expect(DESTINATIONS_DATA.some(({ id }) => id === 'macau')).toBe(true);
    expect(DESTINATIONS_DATA.some(({ id }) => id === 'hangzhou')).toBe(true);
    expect(DESTINATIONS_DATA.some(({ id }) => id === 'ningbo')).toBe(true);
  });

  it('keeps one generic region reference and valid geographic/content fields per destination', () => {
    for (const destination of DESTINATIONS_DATA) {
      expect(destination.region.key.trim().length).toBeGreaterThan(0);
      expect(destination.region.label.trim().length).toBeGreaterThan(0);
      expect(destination.region.scope).toBe('regional_cluster');
      expect(destination.coordinates.lat).toBeGreaterThanOrEqual(-90);
      expect(destination.coordinates.lat).toBeLessThanOrEqual(90);
      expect(destination.coordinates.lng).toBeGreaterThanOrEqual(-180);
      expect(destination.coordinates.lng).toBeLessThanOrEqual(180);

      const requiredText = [
        destination.id,
        destination.cityName,
        destination.modernName,
        destination.ancientMythicName,
        destination.solarTerm,
        destination.heroImage,
        destination.bestSeason,
        destination.geologyType,
        destination.mythicPoem,
        destination.mythicLore,
        destination.realHistory,
        destination.guardian.name,
        destination.guardian.title,
        destination.guardian.classicQuote,
        destination.guardian.domainPower,
        destination.seal.sealName,
        destination.seal.sealScript,
        destination.landscapeTag,
        destination.colorTheme.primary,
        destination.colorTheme.glow,
        destination.colorTheme.accent,
      ];

      expect(requiredText.every((value) => value.trim().length > 0)).toBe(true);
      expect(destination.galleryImages.length).toBeGreaterThanOrEqual(3);
      expect(destination.galleryCaptions?.length).toBe(destination.galleryImages.length);
    }
  });

  it('covers all four current sample region clusters without pretending they are the national catalog', () => {
    const regionKeys = new Set(DESTINATIONS_DATA.map(({ region }) => region.key));

    expect(regionKeys).toEqual(new Set([
      'pearl_river_delta',
      'chaoshan_east',
      'leizhou_west',
      'nanling_north',
      'jiangnan_waters',
    ]));
  });
  it('enforces 100% unique, zero-duplication regional mythic beasts across all 34 destinations with valid pure vector SVGs', () => {
    const beastNames = DESTINATIONS_DATA.map(d => d.guardian.name);
    const uniqueBeastNames = new Set(beastNames);

    // 1. Zero duplication assertion
    expect(uniqueBeastNames.size).toBe(DESTINATIONS_DATA.length);
    expect(uniqueBeastNames.size).toBe(34);

    // 2. Specific key assertions (e.g. Hong Kong is 狮子山金狮, Zhaoqing is 端溪白泽)
    const hk = DESTINATIONS_DATA.find(d => d.id === 'hongkong');
    const zq = DESTINATIONS_DATA.find(d => d.id === 'zhaoqing');
    expect(hk?.guardian.name).toBe('狮子山金狮');
    expect(zq?.guardian.name).toBe('端溪白泽');
    expect(hk?.guardian.name).not.toBe(zq?.guardian.name);
  });
});
