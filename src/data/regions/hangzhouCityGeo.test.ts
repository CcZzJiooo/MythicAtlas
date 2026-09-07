import { describe, expect, it } from 'vitest';
import {
  HANGZHOU_BOUNDARY_PROVENANCE,
  HANGZHOU_CITIES_GEO
} from './hangzhouCityGeo';

describe('Hangzhou Gate 2 boundary import', () => {
  it('keeps the imported WGS84 feature non-empty and tied to the canonical adcode', () => {
    expect(HANGZHOU_CITIES_GEO).toHaveLength(1);
    expect(HANGZHOU_CITIES_GEO[0].name).toBe('杭州市');
    expect(HANGZHOU_CITIES_GEO[0].adcode).toBe(330100);
    expect(HANGZHOU_CITIES_GEO[0].rings[0].length).toBeGreaterThan(5);
  });

  it('keeps source, local snapshot, hash, and approval boundary explicit', () => {
    expect(HANGZHOU_BOUNDARY_PROVENANCE.source).toContain('OpenStreetMap');
    expect(HANGZHOU_BOUNDARY_PROVENANCE.localFile).toBe('src/data/regions/hangzhouCityBoundary.json');
    expect(HANGZHOU_BOUNDARY_PROVENANCE.sha256).toHaveLength(64);
    expect(HANGZHOU_BOUNDARY_PROVENANCE.approvalStatus).toBe('pending_cross_source_review');
  });
});
