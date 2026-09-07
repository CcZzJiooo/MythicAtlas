import type { DestinationItem } from '../types';
import { DESTINATIONS_DATA } from './destinations';
import {
  CHINA_PROVINCES_GEO,
  GUANGDONG_CITIES_GEO,
  type RegionalGeoFeature
} from '../webgl/shaders/chinaRegionalGeo';
import { ZHEJIANG_CITIES_GEO } from './regions/zhejiangCitiesGeo';
import {
  PROVINCIAL_BADGES_DATA,
  type ProvincialBadgeConfig
} from './provincialBadges';

/**
 * One injectable scene data source for Gate 2 and later regional expansion.
 * It deliberately contains references to canonical data; it is not a second
 * destination schema and it does not permit a feature without a destination
 * record to appear as a city.
 */
export interface SceneCatalog {
  readonly destinations: readonly DestinationItem[];
  readonly provinceFeatures: readonly RegionalGeoFeature[];
  readonly cityFeatures: readonly RegionalGeoFeature[];
  readonly provincialBadges: readonly ProvincialBadgeConfig[];
}

export const DEFAULT_SCENE_CATALOG: SceneCatalog = {
  destinations: DESTINATIONS_DATA,
  provinceFeatures: CHINA_PROVINCES_GEO,
  cityFeatures: [...GUANGDONG_CITIES_GEO, ...ZHEJIANG_CITIES_GEO],
  provincialBadges: Object.values(PROVINCIAL_BADGES_DATA)
};

export function createSceneCatalog(overrides: Partial<SceneCatalog> = {}): SceneCatalog {
  return {
    ...DEFAULT_SCENE_CATALOG,
    ...overrides
  };
}
