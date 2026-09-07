import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GUANGDONG_CITIES_GEO } from './shaders/chinaRegionalGeo';
import { ZHEJIANG_CITIES_GEO } from '../data/regions/zhejiangCitiesGeo';

describe('CityElevatorMeshes Geometry Triangulation & Ear-Clipping', () => {
  it('should successfully Ear-Clip triangulate all 34 regional geometries without polygon overflow', () => {
    const allCities = [...GUANGDONG_CITIES_GEO, ...ZHEJIANG_CITIES_GEO];
    expect(allCities.length).toBeGreaterThanOrEqual(34);

    for (const city of allCities) {
      let mainRing = city.rings[0];
      for (const ring of city.rings) {
        if (ring.length > mainRing.length) mainRing = ring;
      }
      expect(mainRing.length).toBeGreaterThan(4);

      // Clean consecutive duplicates and closing point
      const ring2D: [number, number][] = [];
      for (let i = 0; i < mainRing.length; i++) {
        const pt = mainRing[i];
        if (ring2D.length === 0 || !(ring2D[ring2D.length - 1][0] === pt[0] && ring2D[ring2D.length - 1][1] === pt[1])) {
          ring2D.push(pt);
        }
      }
      if (ring2D.length > 3 && ring2D[0][0] === ring2D[ring2D.length - 1][0] && ring2D[0][1] === ring2D[ring2D.length - 1][1]) {
        ring2D.pop();
      }

      const shapePoints = ring2D.map(p => new THREE.Vector2(p[0], p[1]));
      const faces = THREE.ShapeUtils.triangulateShape(shapePoints, []) as [number, number, number][];

      expect(faces.length).toBeGreaterThan(0);
      expect(faces.length).toBe(shapePoints.length - 2);
    }
  });
});
