import rawBoundary from './hangzhouCityBoundary.json';
import type { RegionalGeoFeature } from '../../webgl/shaders/chinaRegionalGeo';

type CoordinatePair = [number, number];

interface RawGeoJsonFeature {
  readonly properties?: {
    readonly osm_id?: number;
  };
  readonly geometry?: {
    readonly type?: string;
    readonly coordinates?: unknown;
  };
}

interface RawGeoJsonFeatureCollection {
  readonly features?: readonly RawGeoJsonFeature[];
}

function isCoordinatePair(value: unknown): value is CoordinatePair {
  return Array.isArray(value)
    && value.length >= 2
    && typeof value[0] === 'number'
    && typeof value[1] === 'number';
}

function toRing(value: unknown): CoordinatePair[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isCoordinatePair)
    .map(([lng, lat]) => [lng, lat]);
}

function toRings(feature: RawGeoJsonFeature | undefined): CoordinatePair[][] {
  const geometry = feature?.geometry;
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];

  const polygonCoordinates = geometry.type === 'MultiPolygon'
    ? geometry.coordinates.flatMap(value => Array.isArray(value) ? value : [])
    : geometry.coordinates;

  return polygonCoordinates
    .map(toRing)
    .filter(ring => ring.length >= 5);
}

const sourceBoundary = rawBoundary as RawGeoJsonFeatureCollection;
const hangzhouFeature = sourceBoundary.features?.find(
  feature => feature.properties?.osm_id === 3221112,
);
const hangzhouRings = toRings(hangzhouFeature);

/**
 * Imported city geometry for the first non-Guangdong Gate2 slice.
 * The source is WGS84 OSM geometry and remains subject to cross-source
 * administrative review; it is not a hand-drawn approximation.
 */
export const HANGZHOU_CITIES_GEO: readonly RegionalGeoFeature[] = hangzhouRings.length > 0
  ? [{
      name: '杭州市',
      adcode: 330100,
      rings: hangzhouRings
    }]
  : [];

export const HANGZHOU_BOUNDARY_PROVENANCE = {
  source: 'OpenStreetMap via Nominatim',
  relationId: 3221112,
  adminCode: '330100',
  retrievedAt: '2026-08-31',
  coordinateSystem: 'WGS84',
  geometryType: 'Polygon',
  sourceUrl: 'https://www.openstreetmap.org/relation/3221112',
  downloadUrl: 'https://nominatim.openstreetmap.org/search?city=Hangzhou&country=China&format=geojson&polygon_geojson=1&limit=5',
  localFile: 'src/data/regions/hangzhouCityBoundary.json',
  sha256: 'F5CE16D8EFC9AFB9AE9E00217AE0093ED55CA725854B78577151D251014A6F19',
  license: 'OpenStreetMap data © OpenStreetMap contributors, ODbL 1.0',
  pointCount: 25606,
  approvalStatus: 'pending_cross_source_review' as const
};
