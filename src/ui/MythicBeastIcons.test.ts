import { describe, expect, it } from 'vitest';
import { getBeastSvgIcon, MYTHIC_BEAST_SVG_CATALOG } from './MythicBeastIcons';
import { DESTINATIONS_DATA } from '../data/destinations';

describe('MythicBeastIcons 34 unique beasts verification', () => {
  it('verifies that every single one of the 34 destination beasts produces a UNIQUE, NON-IDENTICAL SVG icon', () => {
    const outputs = new Map<string, string>();
    for (const d of DESTINATIONS_DATA) {
      const name = d.guardian.name;
      const svg = getBeastSvgIcon(name, '#FFD700', 24);
      
      for (const [otherName, otherSvg] of outputs.entries()) {
        if (svg === otherSvg) {
          throw new Error(`DUPLICATE SVG FOUND: "${name}" has the EXACT SAME SVG as "${otherName}"!`);
        }
      }
      outputs.set(name, svg);
    }
    expect(outputs.size).toBe(34);
  });
});
