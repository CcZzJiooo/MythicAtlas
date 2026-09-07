import { describe, expect, it } from 'vitest';
import {
  HANGZHOU_JIANGNAN_EVIDENCE,
  getGate2EvidenceForSample,
  isGate2RegionalEvidenceReady
} from './gate2RegionalEvidence';

describe('Gate 2 regional evidence boundary', () => {
  it('keeps the Hangzhou runtime slice separate from boundary approval', () => {
    expect(getGate2EvidenceForSample('non-gd-jiangnan-candidate')).toBe(HANGZHOU_JIANGNAN_EVIDENCE);
    expect(HANGZHOU_JIANGNAN_EVIDENCE.catalogReadiness).toBe('ready_for_catalog');
    expect(HANGZHOU_JIANGNAN_EVIDENCE.boundary.status).toBe('pending');
    expect(HANGZHOU_JIANGNAN_EVIDENCE.boundary.importStatus).toBe('imported');
    expect(isGate2RegionalEvidenceReady(HANGZHOU_JIANGNAN_EVIDENCE)).toBe(false);
  });

  it('records only high-resolution media with explicit local-ingest and approval state', () => {
    expect(HANGZHOU_JIANGNAN_EVIDENCE.media.length).toBeGreaterThanOrEqual(4);
    expect(HANGZHOU_JIANGNAN_EVIDENCE.media.every(media => media.width >= 1920 && media.height >= 1080)).toBe(true);
    expect(HANGZHOU_JIANGNAN_EVIDENCE.media.every(media => media.localAssetStatus === 'ingested')).toBe(true);
    expect(HANGZHOU_JIANGNAN_EVIDENCE.media.every(media => media.catalogReadiness === 'approved')).toBe(true);
    expect(HANGZHOU_JIANGNAN_EVIDENCE.media.every(media => media.localAssetPath && media.sha256)).toBe(true);
  });

  it('keeps the Jiangnan palette tied to the local culture database', () => {
    expect(HANGZHOU_JIANGNAN_EVIDENCE.cultureTokens.map(token => token.hex)).toEqual([
      '#B1D5C8',
      '#87CEEB',
      '#5B8266',
      '#6A8E23'
    ]);
    expect(HANGZHOU_JIANGNAN_EVIDENCE.cultureTokens.every(token => token.status === 'confirmed')).toBe(true);
  });
});
