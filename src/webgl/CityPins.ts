import * as THREE from 'three';
import { DestinationItem } from '../types';
import { DESTINATIONS_DATA } from '../data/destinations';

export class CityPins {
  public group: THREE.Group;
  public pinMeshes: THREE.Mesh[] = [];
  private animatedItems: {
    crystal: THREE.Mesh;
    ring: THREE.Mesh;
    beam: THREE.Mesh;
    baseY: number;
    speed: number;
  }[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.createCityPins();
  }

  private createCityPins() {
    DESTINATIONS_DATA.forEach((city, index) => {
      const x = city.coordinates.mapX || 0;
      const z = city.coordinates.mapZ || 0;
      const altitude = (city.coordinates.altitude || 200) / 2500;
      const baseY = Math.max(0.12, 0.1 + altitude);

      const cityGroup = new THREE.Group();
      cityGroup.position.set(x, 0, z);

      // 1. Interactive Cinnabar Hitbox (for raycasting)
      const hitGeom = new THREE.SphereGeometry(0.12, 12, 12);
      const hitMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.position.y = baseY + 0.15;
      hitMesh.userData = { city, isPin: true, index };
      cityGroup.add(hitMesh);
      this.pinMeshes.push(hitMesh);

      // 2. 3D Floating Cinnabar Crystal
      const crystalGeom = new THREE.OctahedronGeometry(0.06, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(city.colorTheme.primary),
        emissive: new THREE.Color(city.colorTheme.glow),
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.2
      });
      const crystal = new THREE.Mesh(crystalGeom, crystalMat);
      crystal.position.y = baseY + 0.15;
      crystal.castShadow = true;
      cityGroup.add(crystal);

      // 3. Vertical Lingqi Light Beam
      const beamHeight = 0.8 + Math.random() * 0.4;
      const beamGeom = new THREE.CylinderGeometry(0.006, 0.025, beamHeight, 8, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(city.colorTheme.glow),
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const beam = new THREE.Mesh(beamGeom, beamMat);
      beam.position.y = baseY + beamHeight / 2;
      cityGroup.add(beam);

      // 4. Ground Pulsing Ring
      const ringGeom = new THREE.RingGeometry(0.04, 0.08, 24);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(city.colorTheme.glow),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.y = baseY - 0.08;
      cityGroup.add(ring);

      this.group.add(cityGroup);

      this.animatedItems.push({
        crystal,
        ring,
        beam,
        baseY: baseY + 0.15,
        speed: 1.5 + Math.random() * 1.0
      });
    });
  }

  public update(time: number, delta: number) {
    this.animatedItems.forEach((item, i) => {
      // Bobbing crystal
      item.crystal.position.y = item.baseY + Math.sin(time * item.speed + i) * 0.025;
      item.crystal.rotation.y += delta * 1.5;
      item.crystal.rotation.x = Math.sin(time * 0.8 + i) * 0.2;

      // Pulsing ring
      const scale = 1.0 + Math.sin(time * 2.5 + i) * 0.35;
      item.ring.scale.set(scale, scale, scale);
    });
  }

  public highlightCity(cityId: string) {
    DESTINATIONS_DATA.forEach((city, index) => {
      const item = this.animatedItems[index];
      if (city.id === cityId) {
        item.crystal.scale.set(1.8, 1.8, 1.8);
        (item.crystal.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
        item.beam.scale.set(2.0, 1.5, 2.0);
      } else {
        item.crystal.scale.set(1.0, 1.0, 1.0);
        (item.crystal.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
        item.beam.scale.set(1.0, 1.0, 1.0);
      }
    });
  }
}
