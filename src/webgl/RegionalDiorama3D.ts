import * as THREE from 'three';
import type { DestinationItem } from '../types';
import type { RegionalGeoFeature } from './shaders/chinaRegionalGeo';

interface RegionalDioramaItem {
  readonly destination: DestinationItem;
  readonly feature: RegionalGeoFeature;
  readonly markerGroup: THREE.Group;
  readonly markerRing: THREE.Mesh;
  readonly markerCore: THREE.Mesh;
  readonly markerRingMaterial: THREE.MeshBasicMaterial;
  readonly markerCoreMaterial: THREE.MeshStandardMaterial;
}

interface PlaneBounds {
  readonly minLng: number;
  readonly maxLng: number;
  readonly minLat: number;
  readonly maxLat: number;
  readonly width: number;
  readonly depth: number;
}

const MAX_RENDER_RING_POINTS = 1800;

function getMainRing(feature: RegionalGeoFeature): [number, number][] {
  return feature.rings.reduce<[number, number][]>(
    (longest, ring) => ring.length > longest.length ? ring : longest,
    [],
  );
}

function samePoint(a: [number, number], b: [number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Keep the source boundary untouched while bounding the number of vertices
 * used by the display mesh. The raw WGS84 snapshot remains the audit source;
 * this deterministic stride only controls the WebGL presentation cost.
 */
function getRenderableRing(ring: [number, number][]): [number, number][] {
  if (ring.length <= MAX_RENDER_RING_POINTS) return ring;

  const stride = Math.ceil((ring.length - 1) / (MAX_RENDER_RING_POINTS - 1));
  const reduced: [number, number][] = [];
  for (let index = 0; index < ring.length; index += stride) {
    reduced.push(ring[index]);
  }

  const last = ring[ring.length - 1];
  if (!samePoint(reduced[reduced.length - 1], last)) {
    reduced.push(last);
  }
  return reduced;
}

function getDestinationColors(destination: DestinationItem) {
  return {
    primary: destination.colorTheme.primary || '#5B8266',
    glow: destination.colorTheme.glow || '#87CEEB',
    accent: destination.colorTheme.accent || '#B1D5C8'
  };
}

/**
 * Generic projected regional diorama for Gate2 slices outside the
 * Guangdong-specific relief implementation.
 *
 * The component deliberately presents imported administrative geometry as a
 * raised map plate rather than inventing elevation data that the source does
 * not provide. Cultural colors and destination copy still come from the
 * canonical destination record.
 */
export class RegionalDiorama3D {
  public readonly group: THREE.Group;
  private readonly items: RegionalDioramaItem[] = [];
  private readonly bounds: PlaneBounds | null;
  private activeDestinationId: string | null = null;

  constructor(
    features: readonly RegionalGeoFeature[],
    destinations: readonly DestinationItem[],
  ) {
    this.group = new THREE.Group();
    this.bounds = this.getBounds(features);
    if (!this.bounds) return;

    this.buildPedestal(this.bounds);
    for (const feature of features) {
      const destination = destinations.find(item =>
        item.cityName === feature.name
        || item.cityName.replace(/市$/, '') === feature.name
      );
      const ring = getMainRing(feature);
      if (!destination || ring.length < 5) continue;
      this.items.push(this.buildRegion(feature, ring, destination, this.bounds));
    }
  }

  public hasDestination(destinationId: string | null | undefined): boolean {
    return Boolean(destinationId && this.items.some(item => item.destination.id === destinationId));
  }

  public setActiveDestination(destinationId: string | null): void {
    this.activeDestinationId = destinationId;
    for (const item of this.items) {
      const isActive = item.destination.id === destinationId;
      item.markerGroup.scale.setScalar(isActive ? 1.16 : 0.92);
      item.markerRingMaterial.opacity = isActive ? 0.92 : 0.42;
      item.markerCoreMaterial.emissiveIntensity = isActive ? 1.8 : 0.72;
    }
  }

  public update(time: number, delta: number): void {
    const pulse = 1 + Math.sin(time * 2.2) * 0.08;
    for (const item of this.items) {
      const isActive = item.destination.id === this.activeDestinationId;
      const targetScale = (isActive ? 1.16 : 0.92) * pulse;
      const lerp = Math.min(1, delta * 12);
      const nextScale = THREE.MathUtils.lerp(item.markerGroup.scale.x, targetScale, lerp);
      item.markerGroup.scale.setScalar(nextScale);
      item.markerRing.rotation.y += delta * (isActive ? 0.5 : 0.22);
    }
  }

  private getBounds(features: readonly RegionalGeoFeature[]): PlaneBounds | null {
    let pointCount = 0;
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const feature of features) {
      for (const point of getMainRing(feature)) {
        pointCount += 1;
        minLng = Math.min(minLng, point[0]);
        maxLng = Math.max(maxLng, point[0]);
        minLat = Math.min(minLat, point[1]);
        maxLat = Math.max(maxLat, point[1]);
      }
    }
    if (pointCount === 0) return null;

    const lngRange = Math.max(0.001, maxLng - minLng);
    const latRange = Math.max(0.001, maxLat - minLat);
    const width = 3.7;
    const depth = THREE.MathUtils.clamp(width * latRange / lngRange, 2.1, 3.1);

    return { minLng, maxLng, minLat, maxLat, width, depth };
  }

  private toPlane(lat: number, lng: number, bounds: PlaneBounds): { x: number; z: number } {
    const x = ((lng - bounds.minLng) / Math.max(0.001, bounds.maxLng - bounds.minLng) - 0.5) * bounds.width;
    const northUp = ((lat - bounds.minLat) / Math.max(0.001, bounds.maxLat - bounds.minLat) - 0.5) * bounds.depth;
    return { x, z: -northUp };
  }

  private createShape(ring: [number, number][], bounds: PlaneBounds): THREE.Shape {
    const renderRing = getRenderableRing(ring);
    const first = this.toPlane(renderRing[0][1], renderRing[0][0], bounds);
    const shape = new THREE.Shape();
    shape.moveTo(first.x, -first.z);

    for (const point of renderRing.slice(1)) {
      const projected = this.toPlane(point[1], point[0], bounds);
      shape.lineTo(projected.x, -projected.z);
    }
    return shape;
  }

  private buildRegion(
    feature: RegionalGeoFeature,
    ring: [number, number][],
    destination: DestinationItem,
    bounds: PlaneBounds,
  ): RegionalDioramaItem {
    const colors = getDestinationColors(destination);
    const regionGroup = new THREE.Group();
    const shape = this.createShape(ring, bounds);

    const plateGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 1
    });
    plateGeometry.rotateX(-Math.PI / 2);
    const plateMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.primary),
      roughness: 0.56,
      metalness: 0.12,
      emissive: new THREE.Color(colors.accent),
      emissiveIntensity: 0.22
    });
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.position.y = 0.015;
    plate.castShadow = true;
    plate.receiveShadow = true;
    regionGroup.add(plate);

    const outlinePoints = getRenderableRing(ring).map(point => {
      const projected = this.toPlane(point[1], point[0], bounds);
      return new THREE.Vector3(projected.x, 0.155, projected.z);
    });
    const outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(outlinePoints),
      new THREE.LineBasicMaterial({
        color: new THREE.Color(colors.glow),
        transparent: true,
        opacity: 0.95
      }),
    );
    outline.renderOrder = 20;
    regionGroup.add(outline);

    const markerPoint = this.toPlane(destination.coordinates.lat, destination.coordinates.lng, bounds);
    const markerGroup = new THREE.Group();
    markerGroup.position.set(markerPoint.x, 0, markerPoint.z);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.018, 0.24, 8),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.glow),
        transparent: true,
        opacity: 0.8
      }),
    );
    stem.position.y = 0.26;
    markerGroup.add(stem);

    const markerRingMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.glow),
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const markerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.055, 0.068, 24),
      markerRingMaterial,
    );
    markerRing.rotation.x = -Math.PI / 2;
    markerRing.position.y = 0.18;
    markerGroup.add(markerRing);

    const markerCoreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.accent),
      emissive: new THREE.Color(colors.glow),
      emissiveIntensity: 0.72,
      roughness: 0.26,
      metalness: 0.24
    });
    const markerCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), markerCoreMaterial);
    markerCore.position.y = 0.34;
    markerCore.rotation.set(0.2, 0.35, 0.1);
    markerGroup.add(markerCore);
    regionGroup.add(markerGroup);

    this.group.add(regionGroup);
    return {
      destination,
      feature,
      markerGroup,
      markerRing,
      markerCore,
      markerRingMaterial,
      markerCoreMaterial
    };
  }

  private buildPedestal(bounds: PlaneBounds): void {
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(bounds.width + 0.34, 0.22, bounds.depth + 0.34),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#173B43'),
        roughness: 0.48,
        metalness: 0.42
      }),
    );
    pedestal.position.y = -0.13;
    pedestal.receiveShadow = true;
    this.group.add(pedestal);

    const waterline = new THREE.Mesh(
      new THREE.BoxGeometry(bounds.width + 0.08, 0.035, bounds.depth + 0.08),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#87CEEB'),
        roughness: 0.38,
        metalness: 0.08,
        transparent: true,
        opacity: 0.58
      }),
    );
    waterline.position.y = -0.005;
    this.group.add(waterline);
  }
}
