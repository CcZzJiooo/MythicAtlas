import * as THREE from 'three';
import { EXPERIENCE_GEOMETRY } from '../core/experienceState';
import { WORLD_COUNTRIES_GEO } from './shaders/worldCountriesGeo';
import {
  CHINA_PROVINCES_GEO,
  GUANGDONG_CITIES_GEO,
  type RegionalGeoFeature
} from './shaders/chinaRegionalGeo';
import type { DestinationItem } from '../types';
import { DESTINATIONS_DATA } from '../data/destinations';

export const CITY_NAME_TO_ID: Record<string, string> = {
  '广州市': 'guangzhou',
  '深圳市': 'shenzhen',
  '珠海市': 'zhuhai',
  '汕头市': 'shantou',
  '佛山市': 'foshan',
  '韶关市': 'shaoguan',
  '湛江市': 'zhanjiang',
  '肇庆市': 'zhaoqing',
  '江门市': 'jiangmen',
  '茂名市': 'maoming',
  '惠州市': 'huizhou',
  '梅州市': 'meizhou',
  '汕尾市': 'shanwei',
  '河源市': 'heyuan',
  '阳江市': 'yangjiang',
  '清远市': 'qingyuan',
  '东莞市': 'dongguan',
  '中山市': 'zhongshan',
  '潮州市': 'chaozhou',
  '揭阳市': 'jieyang',
  '云浮市': 'yunfu',
  '香港': 'hongkong',
  '香港特别行政区': 'hongkong',
  '香港市': 'hongkong',
  '澳门': 'macau',
  '澳门特别行政区': 'macau',
  '澳门市': 'macau',
  '杭州市': 'hangzhou',
  '杭州': 'hangzhou'
};

const CityBorderChargingShader = {
  vertexShader: `
    attribute float aProgress;
    varying float vProgress;
    void main() {
      vProgress = aProgress;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uIsHovered;
    uniform float uIsSelected;
    uniform float uBaseOpacity;
    uniform vec3 uBaseColor;
    uniform vec3 uActiveColor;
    uniform vec3 uGlowColor;
    varying float vProgress;

    void main() {
      if (uIsSelected > 0.5) {
        // 【选中锁定态：双重高能星轨循环奔涌，高亮金曜】
        float wave1 = sin((vProgress - uTime * 1.6) * 6.283185 * 2.0) * 0.5 + 0.5;
        float wave2 = sin((vProgress + uTime * 1.2) * 6.283185 * 3.0) * 0.5 + 0.5;
        float pulse = pow(wave1, 3.0) * 0.6 + pow(wave2, 4.0) * 0.4;
        vec3 col = mix(uActiveColor, uGlowColor, pulse);
        gl_FragColor = vec4(col, 0.98);
      } else if (uIsHovered > 0.5) {
        // 【悬停充能态：整圈边界环绕流动金色能量光波 (Energy Surge Wave)】
        float wave = sin((vProgress - uTime * 2.0) * 6.283185 * 3.0) * 0.5 + 0.5;
        wave = pow(wave, 3.5); // 锐利激光能量充能波
        float alpha = mix(uBaseOpacity, 0.90, wave);
        vec3 col = mix(uActiveColor * 0.7, uGlowColor, wave);
        gl_FragColor = vec4(col, max(alpha, 0.65));
      } else {
        // 【静默常态：极细微透发丝线】
        gl_FragColor = vec4(uBaseColor, uBaseOpacity);
      }
    }
  `
};

interface CityBorderMeshItem {
  cityId: string;
  cityName: string;
  mesh: THREE.Line;
  material: THREE.ShaderMaterial;
}

/**
 * 3D 球面真实矢量经纬边界与多级行政区划渲染引擎
 * 升级版：支持全量 21 地级市独立 3D 边界整圈描边流光充能动画（CityBoundaryChargeEngine）
 */
export class SphericalVectorOverlay {
  public group: THREE.Group;
  private worldBorders!: THREE.LineSegments;
  private chinaProvBorders!: THREE.LineSegments;
  private provMaterial!: THREE.LineBasicMaterial;

  private cityBorderItems: CityBorderMeshItem[] = [];
  private hoveredCityId: string | null = null;
  private selectedCityId: string | null = null;
  private isProvinceHovered = false;
  private readonly provinceFeatures: readonly RegionalGeoFeature[];
  private readonly cityFeatures: readonly RegionalGeoFeature[];
  private readonly destinations: readonly DestinationItem[];

  constructor(
    radius = 2.003,
    provinceFeatures: readonly RegionalGeoFeature[] = CHINA_PROVINCES_GEO,
    cityFeatures: readonly RegionalGeoFeature[] = GUANGDONG_CITIES_GEO,
    destinations: readonly DestinationItem[] = DESTINATIONS_DATA
  ) {
    this.provinceFeatures = provinceFeatures;
    this.cityFeatures = cityFeatures;
    this.destinations = destinations;
    this.group = new THREE.Group();
    this.initVectorLayers(radius);
  }

  /**
   * 将经纬度点转换为 3D 球面空间坐标
   */
  private latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -r * Math.cos(theta) * Math.sin(phi);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(theta) * Math.sin(phi);
    return new THREE.Vector3(x, y, z);
  }

  /**
   * 将闭合多边形环转换为连续实线 LineSegments 顶点
   */
  private polylineToLinePairs(coords: [number, number][], r: number, isClosed = true): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    if (coords.length < 2) return points;

    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = this.latLngToVec3(coords[i][1], coords[i][0], r);
      const p2 = this.latLngToVec3(coords[i + 1][1], coords[i + 1][0], r);
      points.push(p1, p2);
    }

    if (isClosed && coords.length > 2) {
      const first = this.latLngToVec3(coords[0][1], coords[0][0], r);
      const last = this.latLngToVec3(coords[coords.length - 1][1], coords[coords.length - 1][0], r);
      points.push(last, first);
    }
    return points;
  }

  /**
   * 将多边形环转换为 3D 球面【点划金丝星轨虚线】
   */
  private polylineToDashedPairs(coords: [number, number][], r: number, isClosed = true): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    if (coords.length < 2) return points;

    const fullCoords = [...coords];
    if (isClosed && coords.length > 2) {
      fullCoords.push(coords[0]);
    }

    const dashStep = 0.016;
    const gapRatio = 0.38;

    for (let i = 0; i < fullCoords.length - 1; i++) {
      const p1 = this.latLngToVec3(fullCoords[i][1], fullCoords[i][0], r);
      const p2 = this.latLngToVec3(fullCoords[i + 1][1], fullCoords[i + 1][0], r);
      const segLen = p1.distanceTo(p2);

      const subs = Math.max(1, Math.round(segLen / dashStep));
      for (let s = 0; s < subs; s++) {
        const tStart = s / subs;
        const tEnd = (s + (1.0 - gapRatio)) / subs;
        const subP1 = new THREE.Vector3().lerpVectors(p1, p2, tStart).normalize().multiplyScalar(r);
        const subP2 = new THREE.Vector3().lerpVectors(p1, p2, tEnd).normalize().multiplyScalar(r);
        points.push(subP1, subP2);
      }
    }
    return points;
  }

  /**
   * 初始化全球国界、中国省界与 21 地市独立充能边界环
   */
  private initVectorLayers(radius: number) {
    // 1. 全球 199 国国界与海岸线矢量层 (Level 1: 典雅柔和实线金丝)
    const worldPoints: THREE.Vector3[] = [];
    for (const country of WORLD_COUNTRIES_GEO) {
      if (country.name === 'China') continue; // 中国境域使用高精度省市矢量呈现，不绘制低精全球粗描边
      for (const ring of country.rings) {
        if (ring.length < 12) continue;
        const pairs = this.polylineToLinePairs(ring, radius * 1.0005, true);
        worldPoints.push(...pairs);
      }
    }
    const worldGeom = new THREE.BufferGeometry().setFromPoints(worldPoints);
    const worldMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#D4AF37'),
      transparent: true,
      opacity: 0.20,
      blending: THREE.AdditiveBlending
    });
    this.worldBorders = new THREE.LineSegments(worldGeom, worldMat);
    this.group.add(this.worldBorders);

    // 2. 中国 34 省份/特区金丝界线矢量层 (Level 2: 华美耀目省界金丝描边，含广东全省外轮廓大金边)
    const provPoints: THREE.Vector3[] = [];
    for (const prov of this.provinceFeatures) {
      for (const ring of prov.rings) {
        if (ring.length < 5) continue; // 过滤非闭合细碎点
        const pairs = this.polylineToLinePairs(ring, radius * 1.0014, true);
        provPoints.push(...pairs);
      }
    }
    const provGeom = new THREE.BufferGeometry().setFromPoints(provPoints);
    this.provMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color('#FFD700'), // 华美纯金金丝描边
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    this.chinaProvBorders = new THREE.LineSegments(provGeom, this.provMaterial);
    this.group.add(this.chinaProvBorders);

    // 3. 城市独立流光充能边界环层 (Level 3: 内部地市典雅清晰银丝细线)
    const cityRadius = radius * 1.0018;
    for (const city of this.cityFeatures) {
      const cityId = this.resolveDestinationId(city.name);
      if (!cityId) continue;

      // 为地市与港澳特区的所有有效陆地边界生成矢量充能发光线（支持多岛屿高精呈现）
      for (const ring of city.rings) {
        if (ring.length < 5) continue;

        const loopPoints: THREE.Vector3[] = [];
        const progressValues: number[] = [];
        const total = ring.length;

        for (let i = 0; i < total; i++) {
          const pt = this.latLngToVec3(ring[i][1], ring[i][0], cityRadius);
          loopPoints.push(pt);
          progressValues.push(i / (total - 1));
        }

        // 保证闭合
        if (total > 2) {
          const first = this.latLngToVec3(ring[0][1], ring[0][0], cityRadius);
          loopPoints.push(first);
          progressValues.push(1.0);
        }

        const borderGeom = new THREE.BufferGeometry().setFromPoints(loopPoints);
        borderGeom.setAttribute('aProgress', new THREE.Float32BufferAttribute(progressValues, 1));

        const borderMat = new THREE.ShaderMaterial({
          vertexShader: CityBorderChargingShader.vertexShader,
          fragmentShader: CityBorderChargingShader.fragmentShader,
          uniforms: {
            uTime: { value: 0.0 },
            uIsHovered: { value: 0.0 },
            uIsSelected: { value: 0.0 },
            uBaseOpacity: { value: 0.38 }, // 适度提升省内银丝线可见度，清晰分明
            uBaseColor: { value: new THREE.Color('#E2E8F0') }, // 静默态：典雅月白银丝发丝线
            uActiveColor: { value: new THREE.Color('#FFD700') }, // 悬停/选中态：耀目纯金
            uGlowColor: { value: new THREE.Color('#FFF9C4') }
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        const borderLine = new THREE.Line(borderGeom, borderMat);
        borderLine.renderOrder = 3000;
        this.group.add(borderLine);

        this.cityBorderItems.push({
          cityId,
          cityName: city.name,
          mesh: borderLine,
          material: borderMat
        });
      }
    }
  }

  private resolveDestinationId(featureName: string): string {
    const destinationId = CITY_NAME_TO_ID[featureName]
      || this.destinations.find(destination =>
        destination.cityName === featureName
        || destination.cityName.replace(/市$/, '') === featureName
      )?.id
      || '';

    return this.destinations.some(destination => destination.id === destinationId)
      ? destinationId
      : '';
  }

  public setProvinceHover(isHovered: boolean) {
    this.isProvinceHovered = isHovered;
  }

  public setHoveredCity(cityId: string | null) {
    this.hoveredCityId = cityId;
    this.updateCityBorderStates();
  }

  public setSelectedCity(cityId: string | null) {
    this.selectedCityId = cityId;
    this.updateCityBorderStates();
  }

  private updateCityBorderStates() {
    for (const item of this.cityBorderItems) {
      const isHovered = this.hoveredCityId === item.cityId;
      const isSelected = this.selectedCityId === item.cityId;
      item.material.uniforms.uIsHovered.value = isHovered ? 1.0 : 0.0;
      item.material.uniforms.uIsSelected.value = isSelected ? 1.0 : 0.0;
      item.mesh.renderOrder = isSelected ? 8000 : (isHovered ? 6000 : 3000);
    }
  }

  /**
   * 随相机缩放视距动态微调各层级线段明暗与边界充能动效
   */
  public update(cameraZ: number, elapsedTime = 0) {
    const { zoomStart, zoomEnd } = EXPERIENCE_GEOMETRY.overlay;
    const zoomRatio = THREE.MathUtils.clamp((cameraZ - zoomStart) / (zoomEnd - zoomStart), 0, 1);
    let targetProvOpacity = THREE.MathUtils.lerp(0.95, 0.65, zoomRatio);
    if (this.isProvinceHovered) {
      targetProvOpacity = 1.0;
      this.provMaterial.color.set('#FFF59D');
    } else {
      this.provMaterial.color.set('#FFE680');
    }
    this.provMaterial.opacity = targetProvOpacity;

    const baseCityOpacity = THREE.MathUtils.lerp(0.28, 0.08, zoomRatio);

    // 更新 21 地级市独立流光边界 Shader 时间与透明度
    for (const item of this.cityBorderItems) {
      item.material.uniforms.uTime.value = elapsedTime;
      item.material.uniforms.uBaseOpacity.value = baseCityOpacity;
    }
  }
}
