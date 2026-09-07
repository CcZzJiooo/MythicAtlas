import type { RegionReference } from '../types';

/**
 * Creates the stable region envelope used by every destination record.
 * Current data is a Guangdong/Hong Kong/Macau sample, but the shape is ready
 * for province, country and global records without another destination type.
 */
export function createRegionReference(
  key: string,
  label: string,
  scope: RegionReference['scope'] = 'regional_cluster',
  parentKey = 'china'
): RegionReference {
  return {
    key,
    label,
    scope,
    parentKey
  };
}
