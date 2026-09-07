import { describe, expect, it } from 'vitest';
import { DESTINATIONS_DATA } from './destinations';
import {
  GATE2_FLOW_STEPS,
  GATE2_GOLDEN_SLICES,
  GATE2_PRESSURE_CHECKS,
  getGate2SampleById,
  getGate2SampleDestinationIds,
  getGate2SampleForDestination,
  getGate2SamplesByCheck
} from './gate2GoldenSlice';
import { getGate2RegionalEvidence } from './gate2RegionalEvidence';

describe('Gate 2 golden slice manifest', () => {
  it('keeps sample and flow identifiers unique', () => {
    const sampleIds = GATE2_GOLDEN_SLICES.map(sample => sample.id);
    const flowIds = GATE2_FLOW_STEPS.map(step => step.id);

    expect(new Set(sampleIds).size).toBe(sampleIds.length);
    expect(new Set(flowIds).size).toBe(flowIds.length);
    expect(flowIds).toEqual([...GATE2_PRESSURE_CHECKS]);
  });

  it('only references destination IDs that exist in the canonical catalog', () => {
    const catalogIds = new Set(DESTINATIONS_DATA.map(destination => destination.id));
    const referencedIds = GATE2_GOLDEN_SLICES
      .flatMap(sample => sample.destinationIds);

    expect(referencedIds.every(destinationId => catalogIds.has(destinationId))).toBe(true);
  });

  it('keeps the non-Guangdong Hangzhou slice tied to one canonical city record', () => {
    const slice = getGate2SampleById('non-gd-jiangnan-candidate');

    expect(slice?.destinationIds).toEqual(['hangzhou']);
    expect(slice?.evidenceProfileId).toBe('hangzhou-jiangnan-candidate');
    expect(getGate2RegionalEvidence(slice?.evidenceProfileId || '')?.catalogReadiness)
      .toBe('ready_for_catalog');
    expect(slice?.dataReadiness).toBe('catalog_present');
    expect(slice?.geometryReadiness).toBe('existing_sample_geometry');
    expect(slice?.mediaReadiness).toBe('catalog_approved');
  });

  it('maps checks and sample IDs through the manifest', () => {
    expect(getGate2SampleDestinationIds('gd-pearl-density')).toEqual([
      'guangzhou',
      'foshan',
      'dongguan',
      'shenzhen'
    ]);
    expect(getGate2SampleDestinationIds('unknown-sample')).toEqual([]);
    expect(getGate2SamplesByCheck('lod_bidirectional').length).toBe(
      GATE2_GOLDEN_SLICES.length
    );
    expect(getGate2SampleForDestination('guangzhou')?.id).toBe('gd-pearl-density');
    expect(getGate2SampleForDestination('non-existent-city')).toBeUndefined();
  });
});
