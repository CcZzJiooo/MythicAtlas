import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { DestinationItem } from '../types';
import { GUANGDONG_21_CITIES_GEO } from '../data/regions/guangdong21CitiesGeo';
import { CITY_TRADITIONAL_COLORS } from './CityElevatorMeshes';
import { CHINA_PROVINCES_GEO, RegionalGeoFeature } from './shaders/chinaRegionalGeo';
import {
  MountainBeaconRayVertexShader,
  MountainBeaconRayFragmentShader,
  createMountainLeylineTexture,
  createAscendingMoteTexture
} from './shaders/mountainBeaconShader';
import {
  buildMythicPedestalGroup
} from './shaders/mountainReliefShader';
import { ShikengkungPeak3D } from './peaks/ShikengkungPeak3D';

export type DioramaTimeMode = 'dawn' | 'noon' | 'dusk' | 'night';

export interface DioramaProbeData {
  lat: number;
  lng: number;
  elevationMeters: number;
  tierName: string;
  zoneTitle: string;
  colorHex: string;
  inGuangdong: boolean;
  timeMode: DioramaTimeMode;
}

export const DIORAMA_TIME_PRESETS: Record<DioramaTimeMode, {
  name: string;
  sunDir: [number, number, number];
  sunColor: string;
  fillDir: [number, number, number];
  fillColor: string;
  skyColor: string;
  cloudColor: string;
}> = {
  dawn: {
    name: '晨曦',
    sunDir: [-0.85, 0.28, -0.42],
    sunColor: '#FFE1B0',
    fillDir: [0.65, 0.25, 0.65],
    fillColor: '#1F2942',
    skyColor: '#5C7094',
    cloudColor: '#FFE6D5'
  },
  noon: {
    name: '正午',
    sunDir: [-0.45, 0.88, -0.32],
    sunColor: '#FFFDF5',
    fillDir: [0.60, 0.35, 0.65],
    fillColor: '#163650',
    skyColor: '#427A8C',
    cloudColor: '#FFFFFF'
  },
  dusk: {
    name: '暮色',
    sunDir: [0.85, 0.22, 0.42],
    sunColor: '#FF7538',
    fillDir: [-0.65, 0.30, -0.65],
    fillColor: '#2B1436',
    skyColor: '#804040',
    cloudColor: '#FFAE85'
  },
  night: {
    name: '月夜',
    sunDir: [0.35, 0.75, 0.55],
    sunColor: '#7098CC',
    fillDir: [-0.40, 0.20, -0.40],
    fillColor: '#091322',
    skyColor: '#0D1C30',
    cloudColor: '#425C7E'
  }
};

// 直接同步神州板块官方权威矢量：提取广东省（613点大陆主环+20海岛环，共768点）、香港特别行政区与澳门特别行政区高精多环边界
export const GUANGDONG_GEO = CHINA_PROVINCES_GEO.find(p => p.adcode === 440000)!;
export const HONG_KONG_GEO = CHINA_PROVINCES_GEO.find(p => p.adcode === 810000);
export const MACAO_GEO = CHINA_PROVINCES_GEO.find(p => p.adcode === 820000);

// 向后兼容导出高精大陆轮廓 (直接取自神州板块权威 613 点大陆环)
export const GUANGDONG_MAINLAND_OUTLINE: [number, number][] = (GUANGDONG_GEO?.rings[0] || []) as [number, number][];

interface RingBBox {
  ring: number[][];
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

// 预计算广东省 21 个行政环的包围盒，确保 97,200 个网格点在多边形判定中毫秒级瞬时完成
const GUANGDONG_RING_BBOXES: RingBBox[] = (GUANGDONG_GEO?.rings || []).map(ring => {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (let i = 0; i < ring.length; i++) {
    const x = ring[i][0];
    const y = ring[i][1];
    if (x < minLng) minLng = x;
    if (x > maxLng) maxLng = x;
    if (y < minLat) minLat = y;
    if (y > maxLat) maxLat = y;
  }
  return { ring, minLng, maxLng, minLat, maxLat };
});

export const GBA_ALL_CITIES_GEO: RegionalGeoFeature[] = [
  ...GUANGDONG_21_CITIES_GEO,
  ...(HONG_KONG_GEO ? [HONG_KONG_GEO] : []),
  ...(MACAO_GEO ? [MACAO_GEO] : [])
];

/**
 * 判定经纬度点是否在多环多边形内部 (点在多边形经典射线法)
 */
export function isPointInRings(lat: number, lng: number, rings: number[][][]): boolean {
  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r];
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

/**
 * 判定经纬度点是否属于香港特别行政区陆地领土
 */
export function isPointInHongKong(lat: number, lng: number): boolean {
  if (lng < 113.82 || lng > 114.45 || lat < 22.14 || lat > 22.58) return false;
  if (HONG_KONG_GEO && HONG_KONG_GEO.rings) {
    return isPointInRings(lat, lng, HONG_KONG_GEO.rings);
  }
  return false;
}

/**
 * 判定经纬度点是否属于澳门特别行政区陆地领土
 */
export function isPointInMacao(lat: number, lng: number): boolean {
  if (lng < 113.51 || lng > 113.62 || lat < 22.10 || lat > 22.23) return false;
  if (MACAO_GEO && MACAO_GEO.rings) {
    return isPointInRings(lat, lng, MACAO_GEO.rings);
  }
  return false;
}

// Safe SSR / Test Canvas & Texture Helpers
function createDioramaBadgeCanvas(width: number, height: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createDioramaBadgeTexture(canvas: HTMLCanvasElement | null): THREE.Texture {
  if (canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }
  return new THREE.Texture();
}

/**
 * 皇家铜鎏金二十四山八卦罗盘面高精 Canvas 纹理生成
 */
function createCompassDialTexture(): THREE.Texture {
  const canvas = createDioramaBadgeCanvas(512, 512);
  if (!canvas) return new THREE.Texture();
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  const cx = 256, cy = 256;
  ctx.fillStyle = '#22160C';
  ctx.beginPath();
  ctx.arc(cx, cy, 250, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 235, 0, Math.PI * 2);
  ctx.arc(cx, cy, 185, 0, Math.PI * 2);
  ctx.arc(cx, cy, 140, 0, Math.PI * 2);
  ctx.stroke();

  const DIRECTIONS_24 = [
    '子', '癸', '丑', '艮', '寅', '甲',
    '卯', '乙', '辰', '巽', '巳', '丙',
    '午', '丁', '未', '坤', '申', '庚',
    '酉', '辛', '戌', '乾', '亥', '壬'
  ];

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const textR = 210;
    const tx = cx + Math.cos(angle) * textR;
    const ty = cy + Math.sin(angle) * textR;

    const char = DIRECTIONS_24[i];
    const isCardinal = (i % 6 === 0);
    ctx.font = isCardinal ? 'bold 26px "Noto Serif SC", serif' : '18px "Noto Serif SC", serif';
    ctx.fillStyle = isCardinal ? '#FFE082' : 'rgba(230, 200, 140, 0.85)';

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();

    const r1 = 235;
    const r2 = isCardinal ? 185 : 195;
    ctx.strokeStyle = isCardinal ? '#FFD54F' : 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = isCardinal ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    ctx.stroke();
  }

  const TRIGRAMS = ['坎', '艮', '震', '巽', '离', '坤', '兑', '乾'];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const tx = cx + Math.cos(angle) * 162;
    const ty = cy + Math.sin(angle) * 162;
    ctx.font = 'bold 20px "Noto Serif SC", serif';
    ctx.fillStyle = '#FFE082';
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(TRIGRAMS[i], 0, 0);
    ctx.restore();
  }

  return createDioramaBadgeTexture(canvas);
}

/**
 * 确定性自然山体分形与坐标域扰动 (Domain-Warped Fractal Noise)
 */
function hash2D(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise2D(x: number, y: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const u = fx * fx * (3.0 - 2.0 * fx);
  const v = fy * fy * (3.0 - 2.0 * fy);

  const s00 = hash2D(i, j);
  const s10 = hash2D(i + 1, j);
  const s01 = hash2D(i, j + 1);
  const s11 = hash2D(i + 1, j + 1);

  return s00 * (1 - u) * (1 - v) +
         s10 * u * (1 - v) +
         s01 * (1 - u) * v +
         s11 * u * v;
}

function fbm2D(x: number, y: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    val += smoothNoise2D(x * freq, y * freq) * amp;
    freq *= 2.02;
    amp *= 0.5;
  }
  return val;
}

function ridgeFbm2D(x: number, y: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1.0;
  let prev = 1.0;
  for (let i = 0; i < octaves; i++) {
    const n = 1.0 - Math.abs(smoothNoise2D(x * freq, y * freq) * 2.0 - 1.0);
    const n2 = n * n;
    val += n2 * amp * prev;
    prev = n2;
    freq *= 2.12;
    amp *= 0.48;
  }
  return val;
}

/**
 * 广东省 21 地级市及香港、澳门特别行政区高精度权威行政中心坐标 (WGS84 经纬度)
 */
export const GD_21_CENTROIDS: Record<string, {
  lng: number;
  lat: number;
  name: string;
  ancientName: string;
  badgeElevationOffset: number;
  regionTier: 'core' | 'east' | 'west' | 'north';
}> = {
  guangzhou: { lng: 113.2644, lat: 23.1291, name: '广州', ancientName: '番禺 · 羊城', badgeElevationOffset: 0.058, regionTier: 'core' },
  shenzhen:  { lng: 114.0579, lat: 22.5431, name: '深圳', ancientName: '宝安 · 鹏城', badgeElevationOffset: 0.040, regionTier: 'core' },
  zhuhai:    { lng: 113.5767, lat: 22.2707, name: '珠海', ancientName: '香山 · 香炉湾', badgeElevationOffset: 0.030, regionTier: 'core' },
  foshan:    { lng: 113.1214, lat: 23.0215, name: '佛山', ancientName: '禅城 · 季华', badgeElevationOffset: 0.034, regionTier: 'core' },
  dongguan:  { lng: 113.7518, lat: 23.0207, name: '东莞', ancientName: '莞城 · 宝安', badgeElevationOffset: 0.048, regionTier: 'core' },
  zhongshan: { lng: 113.3928, lat: 22.5170, name: '中山', ancientName: '香山 · 铁城', badgeElevationOffset: 0.052, regionTier: 'core' },
  jiangmen:  { lng: 113.0816, lat: 22.5787, name: '江门', ancientName: '冈州 · 五邑', badgeElevationOffset: 0.038, regionTier: 'core' },
  huizhou:   { lng: 114.4162, lat: 23.1118, name: '惠州', ancientName: '鹅城 · 祯州', badgeElevationOffset: 0.038, regionTier: 'east' },
  shaoguan:  { lng: 113.5975, lat: 24.8104, name: '韶关', ancientName: '韶州 · 浈阳', badgeElevationOffset: 0.040, regionTier: 'north' },
  qingyuan:  { lng: 113.0560, lat: 23.6818, name: '清远', ancientName: '凤城 · 清湘', badgeElevationOffset: 0.038, regionTier: 'north' },
  zhaoqing:  { lng: 112.4651, lat: 23.0472, name: '肇庆', ancientName: '端州 · 高要', badgeElevationOffset: 0.038, regionTier: 'west' },
  yunfu:     { lng: 112.0444, lat: 22.9298, name: '云浮', ancientName: '东安 · 石城', badgeElevationOffset: 0.038, regionTier: 'west' },
  yangjiang: { lng: 111.9827, lat: 21.8580, name: '阳江', ancientName: '莫阳 · 恩山', badgeElevationOffset: 0.036, regionTier: 'west' },
  maoming:   { lng: 110.9255, lat: 21.6630, name: '茂名', ancientName: '高凉 · 潘州', badgeElevationOffset: 0.036, regionTier: 'west' },
  zhanjiang: { lng: 110.3594, lat: 21.2707, name: '湛江', ancientName: '广州湾 · 雷州', badgeElevationOffset: 0.036, regionTier: 'west' },
  shanwei:   { lng: 115.3753, lat: 22.7862, name: '汕尾', ancientName: '海丰 · 汕美', badgeElevationOffset: 0.036, regionTier: 'east' },
  heyuan:    { lng: 114.7004, lat: 23.7438, name: '河源', ancientName: '龙川 · 槎城', badgeElevationOffset: 0.038, regionTier: 'east' },
  meizhou:   { lng: 116.1225, lat: 24.2886, name: '梅州', ancientName: '嘉应 · 敬州', badgeElevationOffset: 0.040, regionTier: 'east' },
  chaozhou:  { lng: 116.6226, lat: 23.6569, name: '潮州', ancientName: '潮安 · 海阳', badgeElevationOffset: 0.038, regionTier: 'east' },
  jieyang:   { lng: 116.3729, lat: 23.5497, name: '揭阳', ancientName: '榕城 · 揭阳', badgeElevationOffset: 0.036, regionTier: 'east' },
  shantou:   { lng: 116.6820, lat: 23.3541, name: '汕头', ancientName: '鮀城 · 潮阳', badgeElevationOffset: 0.036, regionTier: 'east' },
  hongkong:  { lng: 114.1733, lat: 22.3200, name: '香港', ancientName: '宝安 · 香江', badgeElevationOffset: 0.045, regionTier: 'core' },
  macau:     { lng: 113.5439, lat: 22.1987, name: '澳门', ancientName: '香山 · 濠江', badgeElevationOffset: 0.038, regionTier: 'core' },
  macao:     { lng: 113.5439, lat: 22.1987, name: '澳门', ancientName: '香山 · 濠江', badgeElevationOffset: 0.038, regionTier: 'core' }
};

/**
 * 广东省真实水系干流与三角洲网络线段 (贴合真实地形经纬度)
 */
export interface RiverPathSegment {
  name: string;
  subName: string;
  widthDeg: number;
  depthMeters: number;
  pts: [number, number][];
  tagPos: [number, number];
}

export const GUANGDONG_RIVERS_GEOMETRY: RiverPathSegment[] = [
  // 1. 西江干流 (粤桂边界封开-德庆-肇庆羚羊峡-三水思贤滘-佛山顺德-江门新会-磨刀门主干)
  {
    name: '西江干流',
    subName: '八塔三峡 · 穿羚羊峡汇思贤滘出磨刀门',
    widthDeg: 0.048,
    depthMeters: 45,
    pts: [
      [111.48, 23.43], [111.78, 23.16], [112.05, 23.08], [112.45, 23.05],
      [112.72, 23.16], [112.85, 23.15], [112.96, 22.95], [113.06, 22.78],
      [113.08, 22.58], [113.22, 22.35], [113.36, 22.18], [113.45, 22.02]
    ],
    tagPos: [112.45, 23.08]
  },
  // 2. 北江干流 (浈江+武江-韶关三江口-英德浈阳峡-清远飞来峡-三水思贤滘)
  {
    name: '北江清流',
    subName: '韶关三江汇流 · 经飞来峡至三水思贤滘交汇',
    widthDeg: 0.042,
    depthMeters: 50,
    pts: [
      [114.30, 25.12], [113.88, 24.95], [113.60, 24.81], [113.55, 24.58],
      [113.40, 24.18], [113.15, 23.90], [113.05, 23.68], [112.92, 23.35],
      [112.85, 23.15]
    ],
    tagPos: [113.35, 24.15]
  },
  // 3. 东江干流 (寻乌出境-龙川-河源万绿湖-惠州博罗-东莞石龙-狮子洋虎门)
  {
    name: '东江水系',
    subName: '出万绿湖经惠州 · 至东莞石龙汇入狮子洋虎门',
    widthDeg: 0.040,
    depthMeters: 45,
    pts: [
      [115.35, 24.45], [115.10, 24.15], [114.70, 23.75], [114.45, 23.35],
      [114.38, 23.12], [114.05, 23.08], [113.82, 23.05], [113.58, 22.82]
    ],
    tagPos: [114.35, 23.22]
  },
  // 4. 珠江三角洲八门出海网络 (虎门/蕉门/洪奇门/横门/磨刀门/鸡啼门/虎跳门/崖门)
  {
    name: '三江八门入海',
    subName: '虎门/蕉门/洪奇门/横门/磨刀门/鸡啼门/虎跳门/崖门八口放射',
    widthDeg: 0.065,
    depthMeters: 38,
    pts: [
      [112.85, 23.15], [113.25, 23.10], [113.45, 23.05], [113.58, 22.82],
      [113.65, 22.55], [113.75, 22.25], [113.85, 21.95]
    ],
    tagPos: [113.68, 22.38]
  },
  // 5. 珠江口崖门与银洲湖水道 (新会崖门古战场出海水道)
  {
    name: '崖门水道',
    subName: '银洲湖通江达海 · 汇入黄茅海',
    widthDeg: 0.032,
    depthMeters: 32,
    pts: [
      [113.06, 22.58], [113.05, 22.38], [113.08, 22.12]
    ],
    tagPos: [113.06, 22.30]
  },
  // 6. 韩江干流及梅江 (梅江+汀江-大埔三河坝-高陂-潮州广济桥-汕头海湾)
  {
    name: '韩江水系',
    subName: '三河坝汇流 · 经潮州广济桥至汕头入海',
    widthDeg: 0.038,
    depthMeters: 42,
    pts: [
      [115.82, 24.15], [116.12, 24.30], [116.50, 24.38], [116.68, 24.08],
      [116.64, 23.70], [116.68, 23.50], [116.76, 23.36]
    ],
    tagPos: [116.65, 23.85]
  },
  // 7. 榕江干流 (揭阳普宁/揭西-揭阳榕城-汕头海门湾)
  {
    name: '榕江干流',
    subName: '潮客水系 · 贯穿揭阳玉都出海门湾',
    widthDeg: 0.030,
    depthMeters: 30,
    pts: [
      [115.88, 23.30], [116.15, 23.42], [116.36, 23.54], [116.62, 23.36],
      [116.74, 23.25]
    ],
    tagPos: [116.42, 23.45]
  },
  // 8. 鉴江干流 (信宜大田顶-高州水库-高州-茂名市区-化州罗江-吴川黄坡港)
  {
    name: '鉴江巨流',
    subName: '出云开大山经高州茂名 · 纳罗江至吴川入海',
    widthDeg: 0.036,
    depthMeters: 40,
    pts: [
      [111.25, 22.32], [111.02, 22.02], [110.95, 21.90], [110.90, 21.68],
      [110.80, 21.48], [110.74, 21.36]
    ],
    tagPos: [110.92, 21.85]
  },
  // 9. 漠阳江干流 (阳春凌霄岩-春湾喀斯特-阳春市区-阳江江城-北津港)
  {
    name: '漠阳江',
    subName: '穿阳春喀斯特峰丛 · 经阳江市区出北津港',
    widthDeg: 0.028,
    depthMeters: 30,
    pts: [
      [111.68, 22.42], [111.76, 22.18], [111.95, 21.90], [112.02, 21.75]
    ],
    tagPos: [111.88, 22.02]
  },
  // 10. 潭江水系 (恩平-开平赤坎碉楼-台山北-新会汇入银洲湖)
  {
    name: '潭江水系',
    subName: '流经开平世界文化遗产碉楼群 · 汇入银洲湖',
    widthDeg: 0.028,
    depthMeters: 28,
    pts: [
      [112.28, 22.25], [112.58, 22.35], [112.85, 22.45], [113.05, 22.52]
    ],
    tagPos: [112.65, 22.38]
  }
];

export const GUANGDONG_LAKES_GEOMETRY = [
  { name: '万绿湖', lng: 114.65, lat: 23.78, radiusLng: 0.09, radiusLat: 0.07, depthMeters: 55 },
  { name: '高州水库', lng: 110.95, lat: 21.92, radiusLng: 0.05, radiusLat: 0.04, depthMeters: 35 },
  { name: '鹤地水库', lng: 110.15, lat: 21.55, radiusLng: 0.05, radiusLat: 0.04, depthMeters: 30 }
];

function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function getRiverInfluence(lat: number, lng: number): { carvedDepth: number; waterFactor: number } {
  let maxFactor = 0;
  let maxCarve = 0;

  for (let i = 0; i < GUANGDONG_LAKES_GEOMETRY.length; i++) {
    const lake = GUANGDONG_LAKES_GEOMETRY[i];
    const dlng = (lng - lake.lng) / lake.radiusLng;
    const dlat = (lat - lake.lat) / lake.radiusLat;
    const distSq = dlng * dlng + dlat * dlat;
    if (distSq < 1.0) {
      const t = 1.0 - Math.sqrt(distSq);
      const factor = t * t * (3.0 - 2.0 * t);
      if (factor > maxFactor) {
        maxFactor = factor;
        maxCarve = lake.depthMeters * factor;
      }
    }
  }

  for (let r = 0; r < GUANGDONG_RIVERS_GEOMETRY.length; r++) {
    const river = GUANGDONG_RIVERS_GEOMETRY[r];
    const pts = river.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const dist = pointToSegmentDistance(lng, lat, p1[0], p1[1], p2[0], p2[1]);
      if (dist < river.widthDeg) {
        const t = 1.0 - dist / river.widthDeg;
        const factor = t * t * (3.0 - 2.0 * t);
        if (factor > maxFactor) {
          maxFactor = factor;
          maxCarve = river.depthMeters * factor;
        }
      }
    }
  }

  return { carvedDepth: maxCarve, waterFactor: maxFactor };
}

/**
 * 广东省四大真实连绵构造山系大山走廊 (Continuous Mountain System Corridors)
 * 华南板块真实大地构造走廊：
 * 连绵起伏、山脊贯通、鞍部相连，彻底告别单点孤立圆锥与CAD直线城墙！
 */
export interface MountainCorridorWaypoint {
  lng: number;
  lat: number;
  altitude: number; // 沿山脊主线标称高程 (米)
  name?: string;
}

export interface MountainCorridorDef {
  id: string;
  name: string;
  sigmaDeg: number; // 高斯主山体半宽 (度数，约 20~40km)
  waypoints: MountainCorridorWaypoint[];
}

export const CONTINUOUS_MOUNTAIN_CORRIDORS: MountainCorridorDef[] = [
  // 1. 粤北南岭东西横贯宏大山系 (巍峨屏障，连绵起伏数百里之天然巨岳，东西微拱)
  {
    id: 'nanling',
    name: '南岭横贯巨岳山系',
    sigmaDeg: 0.18,
    waypoints: [
      { lng: 112.05, lat: 24.85, altitude: 1150, name: '连州萌渚岭' },
      { lng: 112.45, lat: 24.75, altitude: 1380, name: '阳山大龙山' },
      { lng: 112.9868, lat: 24.9288, altitude: 1902, name: '乳源石坑崆(广东极巅)' },
      { lng: 113.35, lat: 25.10, altitude: 1350, name: '乐昌金鸡岭' },
      { lng: 113.7483, lat: 25.0416, altitude: 750,  name: '仁化丹霞盆地边缘' },
      { lng: 114.25, lat: 25.22, altitude: 1250, name: '南雄大庾岭/梅关' },
      { lng: 114.75, lat: 25.15, altitude: 1100, name: '始兴交界群峰' }
    ]
  },
  // 2. 粤东北东走向莲花山脉 400 公里自然斜贯主系 (大埔—丰顺—揭西千峦—海丰—惠东—深圳梧桐山)
  {
    id: 'lianhuashan',
    name: '莲花山脉400公里斜贯主系',
    sigmaDeg: 0.14,
    waypoints: [
      { lng: 116.65, lat: 24.35, altitude: 1150, name: '大埔群山' },
      { lng: 116.24, lat: 23.92, altitude: 1560, name: '丰顺铜鼓嶂(粤东第一峰)' },
      { lng: 116.05, lat: 23.72, altitude: 1180, name: '丰顺八乡山群峰' },
      { lng: 115.98, lat: 23.59, altitude: 1222, name: '揭西李望嶂(揭阳第一峰)' },
      { lng: 115.92, lat: 23.56, altitude: 1083, name: '揭西天子嶂' },
      { lng: 115.86, lat: 23.53, altitude: 1198, name: '揭西望天石' },
      { lng: 115.82, lat: 23.49, altitude: 1100, name: '揭西大北山' },
      { lng: 115.79, lat: 23.44, altitude: 1035, name: '揭西鸿娥岭' },
      { lng: 115.25, lat: 23.06, altitude: 1337, name: '海丰莲花山' },
      { lng: 114.80, lat: 22.85, altitude: 880,  name: '惠东山梁' },
      { lng: 114.2083, lat: 22.5833, altitude: 943, name: '深圳梧桐山' },
      { lng: 114.1200, lat: 22.4100, altitude: 957, name: '香港大帽山' }
    ]
  },
  // 3. 粤东平行外缘梅县阴那山—潮安凤凰山脉 (真实北东—南西走向，北起梅州东北，延至潮安，坚决杜绝纬度倒错)
  {
    id: 'fenghuang_yinna',
    name: '梅县阴那山—潮州凤凰山外侧平行系',
    sigmaDeg: 0.10,
    waypoints: [
      { lng: 116.65, lat: 24.50, altitude: 980,  name: '大埔双髻山(闽粤界山)' },
      { lng: 116.39, lat: 24.40, altitude: 1298, name: '梅县阴那山五指峰' },
      { lng: 116.55, lat: 24.15, altitude: 1050, name: '丰顺东翼群峰' },
      { lng: 116.71, lat: 23.93, altitude: 1498, name: '潮安凤凰山乌岽顶' },
      { lng: 116.71, lat: 23.88, altitude: 650,  name: '潮安凤凰山南麓' }
    ]
  },
  // 3.1 粤东南海滨海屏障大南山脉 (潮阳—潮南—普宁—惠来界山，雄扼海疆)
  {
    id: 'dananshan_range',
    name: '大南山滨海屏障山系',
    sigmaDeg: 0.09,
    waypoints: [
      { lng: 116.48, lat: 23.28, altitude: 620, name: '潮南东岭' },
      { lng: 116.32, lat: 23.18, altitude: 972, name: '大南山望天石主峰' },
      { lng: 116.12, lat: 23.08, altitude: 750, name: '惠来西延群山' }
    ]
  },
  // 4. 粤东北九连山—青云山中轴脊梁 (连平—和平—河源桂山)
  {
    id: 'jiulianshan',
    name: '九连山中轴脊梁',
    sigmaDeg: 0.13,
    waypoints: [
      { lng: 114.45, lat: 24.45, altitude: 1430, name: '连平九连山主峰' },
      { lng: 114.52, lat: 24.15, altitude: 1180, name: '和平/新丰群山' },
      { lng: 114.58, lat: 23.75, altitude: 1056, name: '河源桂山' },
      { lng: 115.15, lat: 23.65, altitude: 920,  name: '紫金武顿山' }
    ]
  },
  // 5. 罗浮山—南昆山—从化天堂顶高耸山脉群 (珠三角东北天然绿色屏障)
  {
    id: 'luofu_nankun',
    name: '罗浮南昆群岳体系',
    sigmaDeg: 0.14,
    waypoints: [
      { lng: 114.15, lat: 24.05, altitude: 1246, name: '新丰青云山' },
      { lng: 113.88, lat: 23.68, altitude: 1210, name: '从化天堂顶' },
      { lng: 113.86, lat: 23.63, altitude: 1228, name: '龙门南昆山' },
      { lng: 114.0583, lat: 23.2982, altitude: 1296, name: '博罗罗浮山飞云顶' },
      { lng: 114.30, lat: 23.12, altitude: 720,  name: '罗浮东延余脉' }
    ]
  },
  // 6. 粤西第一脊梁：云开大山宏伟褶皱山脉 (信宜大田顶—粤西极巅)
  {
    id: 'yunkai_range',
    name: '云开大山粤西第一脊梁',
    sigmaDeg: 0.14,
    waypoints: [
      { lng: 110.85, lat: 21.90, altitude: 850,  name: '高州云开山根' },
      { lng: 111.23, lat: 22.28, altitude: 1704, name: '信宜大田顶(粤西第一峰)' },
      { lng: 111.45, lat: 22.65, altitude: 1280, name: '罗定龙须顶' },
      { lng: 111.60, lat: 22.95, altitude: 850,  name: '郁南群峰' }
    ]
  },
  // 7. 粤西平行次脊梁：云雾山—天露山—鼎湖山体系 (双列平行走向，告别单一粗毛虫)
  {
    id: 'yunwu_tianlu',
    name: '云雾山天露山平行脊梁',
    sigmaDeg: 0.13,
    waypoints: [
      { lng: 111.75, lat: 22.18, altitude: 1337, name: '阳春鹅凰嶂' },
      { lng: 111.95, lat: 22.58, altitude: 980,  name: '阳春春湾峰林' },
      { lng: 112.0444, lat: 22.9298, altitude: 1251, name: '新兴天露山' },
      { lng: 112.5539, lat: 23.1678, altitude: 1000, name: '肇庆鼎湖山' },
      { lng: 111.85, lat: 23.40, altitude: 750,  name: '封开余脉' }
    ]
  },
  // 8. 香港大帽山—马鞍山主脊走廊 (香港地政总署 HM20C/5m DEM 权威高程)
  {
    id: 'hk_taimoshan_range',
    name: '香港大帽山马鞍山主脊',
    sigmaDeg: 0.08,
    waypoints: [
      { lng: 113.95, lat: 22.38, altitude: 583, name: '屯门青山' },
      { lng: 114.1200, lat: 22.4100, altitude: 957, name: '香港大帽山(香港第一峰)' },
      { lng: 114.1500, lat: 22.4100, altitude: 647, name: '新界草山' },
      { lng: 114.1600, lat: 22.3900, altitude: 532, name: '沙田针山' },
      { lng: 114.1867, lat: 22.3528, altitude: 495, name: '九龙狮子山' },
      { lng: 114.2200, lat: 22.3400, altitude: 603, name: '九龙飞鹅山' },
      { lng: 114.2500, lat: 22.4100, altitude: 702, name: '西贡马鞍山' },
      { lng: 114.2200, lat: 22.4800, altitude: 511, name: '大埔八仙岭' },
      { lng: 114.3600, lat: 22.4300, altitude: 468, name: '西贡蚺蛇尖' }
    ]
  },
  // 9. 香港大屿山雄峦走廊 (香港地政总署权威高程)
  {
    id: 'hk_lantau_range',
    name: '香港大屿山雄峦走廊',
    sigmaDeg: 0.07,
    waypoints: [
      { lng: 113.9000, lat: 22.2600, altitude: 751, name: '大屿山弥勒山' },
      { lng: 113.9200, lat: 22.2500, altitude: 934, name: '大屿山凤凰山' },
      { lng: 113.9500, lat: 22.2600, altitude: 869, name: '大屿山大东山' }
    ]
  },
  // 10. 香港岛主脊山岭 (太平山—柏架山)
  {
    id: 'hk_island_range',
    name: '香港岛主脊山岭',
    sigmaDeg: 0.06,
    waypoints: [
      { lng: 114.1400, lat: 22.2750, altitude: 552, name: '港岛太平山(扯旗山)' },
      { lng: 114.1550, lat: 22.2700, altitude: 465, name: '港岛歌赋山' },
      { lng: 114.1950, lat: 22.2700, altitude: 436, name: '港岛毕拿山' },
      { lng: 114.2150, lat: 22.2800, altitude: 532, name: '港岛柏架山' }
    ]
  },
  // 11. 澳门全境山丘地貌走廊 (澳门土地工务局/原DSCC权威高程)
  {
    id: 'macao_hills_range',
    name: '澳门全域山丘走廊',
    sigmaDeg: 0.045,
    waypoints: [
      { lng: 113.5614, lat: 22.1242, altitude: 172, name: '路环叠石塘山(澳门极巅)' },
      { lng: 113.5850, lat: 22.1350, altitude: 138, name: '路环九澳顶' },
      { lng: 113.5650, lat: 22.1580, altitude: 160, name: '氹仔大潭山' },
      { lng: 113.5450, lat: 22.1600, altitude: 111, name: '氹仔小潭山' },
      { lng: 113.5511, lat: 22.1969, altitude: 90,  name: '澳门半岛东望洋山(松山)' },
      { lng: 113.5350, lat: 22.1850, altitude: 63,  name: '澳门半岛西望洋山(主教山)' },
      { lng: 113.5410, lat: 22.1970, altitude: 57,  name: '澳门半岛大炮台山' }
    ]
  }
];

/**
 * 广东省平原滨海独立断块高山与古火山群 (单单高山做高山，赋准确权威数据)
 */
export interface IsolatedPeakDef {
  name: string;
  lng: number;
  lat: number;
  altitude: number;
  sigmaDeg: number;
}

export const GUANGDONG_ISOLATED_PEAKS: IsolatedPeakDef[] = [
  // 广州白云山 (平原北侧温润残丘，山南低缓直面羊城，摩星岭主峰 382m)
  { name: '白云山', lng: 113.2983, lat: 23.1783, altitude: 382, sigmaDeg: 0.080 },
  // 佛山西樵山 (南海平原古火山口平缓台地残丘，大科峰 346m)
  { name: '西樵山', lng: 112.9667, lat: 22.9333, altitude: 346, sigmaDeg: 0.070 },
  // 中山五桂山 (香山平原微隆起伏低山，大尖峰 531m)
  { name: '五桂山', lng: 113.4300, lat: 22.4200, altitude: 531, sigmaDeg: 0.090 },
  // 珠海黄杨山 (斗门水乡缓坡低山，珠海第一峰 581m)
  { name: '黄杨山', lng: 113.2167, lat: 22.2333, altitude: 581, sigmaDeg: 0.080 },
  // 江门台山古兜山 (崖门口西侧滨海连绵山体，主峰 987m)
  { name: '古兜山', lng: 112.9500, lat: 22.2500, altitude: 987, sigmaDeg: 0.095 },
  // 肇庆七星岩 (星湖平原低缓喀斯特残丘，石室岩 85m)
  { name: '七星岩', lng: 112.4800, lat: 23.0700, altitude: 85,  sigmaDeg: 0.045 },
  // 汕头南澳大尖山 (粤东海岛第一峰 588m)
  { name: '大尖山', lng: 117.0200, lat: 23.4200, altitude: 588, sigmaDeg: 0.075 },
  // 潮汕中心地标桑浦山 (汕头/潮州/揭阳三市交界中心，北回归线穿过，海蚀地貌人文名山 484m)
  { name: '桑浦山', lng: 116.6000, lat: 23.4300, altitude: 484, sigmaDeg: 0.055 },
  // 梅州平远五指石 (粤东丹霞地貌世界地质奇观，平顶赤壁秀拔 460m)
  { name: '五指石', lng: 115.9300, lat: 24.7800, altitude: 460, sigmaDeg: 0.052 },
  // 深圳梧桐山 (深圳第一峰，巍峨屹立于罗湖盐田交界东境，真实拔海 943m)
  { name: '梧桐山', lng: 114.2083, lat: 22.5833, altitude: 943, sigmaDeg: 0.070 },
  // 深圳大鹏七娘山 (大鹏半岛滨海第一奇峰 869m)
  { name: '七娘山', lng: 114.5500, lat: 22.5300, altitude: 869, sigmaDeg: 0.075 },
  // 佛山高明皂幕山 (佛山第一峰 805m)
  { name: '皂幕山', lng: 112.6300, lat: 22.7500, altitude: 805, sigmaDeg: 0.080 },
  // 香港大帽山 (香港最高峰 957m，新界之巅雄峰)
  { name: '大帽山', lng: 114.1200, lat: 22.4100, altitude: 957, sigmaDeg: 0.075 },
  // 香港大屿山凤凰山 (大屿山最高峰 934m)
  { name: '凤凰山', lng: 113.9200, lat: 22.2500, altitude: 934, sigmaDeg: 0.065 },
  // 香港狮子山 (九龙半岛名峰 495m，花岗岩雄狮奇石)
  { name: '狮子山', lng: 114.1867, lat: 22.3528, altitude: 495, sigmaDeg: 0.055 },
  // 香港太平山 (港岛之巅 552m)
  { name: '太平山', lng: 114.1400, lat: 22.2750, altitude: 552, sigmaDeg: 0.050 },
  // 澳门路环叠石塘山 (澳门官方最高峰 172.4m)
  { name: '叠石塘山', lng: 113.5614, lat: 22.1242, altitude: 172, sigmaDeg: 0.045 },
  // 澳门东望洋山 (松山 90m)
  { name: '东望洋山', lng: 113.5511, lat: 22.1969, altitude: 90,  sigmaDeg: 0.035 },
  // 澳门氹仔大潭山 (160.4m)
  { name: '大潭山', lng: 113.5650, lat: 22.1580, altitude: 160, sigmaDeg: 0.040 },
  // 揭阳黄岐山 (揭阳八景之首“黄岐夕翠”，岐山塔名岳 300m)
  { name: '黄岐山', lng: 116.3650, lat: 23.5600, altitude: 300, sigmaDeg: 0.050 },
  // 揭阳普宁铁山 (普宁古邑图腾“铁山滴翠” 520m)
  { name: '普宁铁山', lng: 116.2200, lat: 23.3200, altitude: 520, sigmaDeg: 0.060 },
  // 揭西独山 (三山国王三王神岳，一石拔地 450m)
  { name: '揭西独山', lng: 115.8450, lat: 23.4100, altitude: 450, sigmaDeg: 0.045 },
  // 揭西明山 (三山国王二王神岳 620m)
  { name: '揭西明山', lng: 115.9300, lat: 23.5100, altitude: 620, sigmaDeg: 0.052 },
  // 揭西巾山 (三山国王大王神岳，祖庙镇境 480m)
  { name: '揭西巾山', lng: 115.8800, lat: 23.4300, altitude: 480, sigmaDeg: 0.048 }
];

/**
 * 计算连绵山系走廊在任意坐标点的高程贡献 (米)
 * 采用坐标域仿射扰动 + 高斯平滑山体包络 + 刀削山脊分形
 * 严格杜绝任何直线 CAD 棱角与孤立圆锥！
 */
export function getContinuousMountainOrogeny(lng: number, lat: number): number {
  let maxMountainMeters = 0.0;

  // 坐标域自然地貌流线扰动 (模拟地壳数千万年塑性形变与断层褶皱，3km 级自然微弯)
  const warpX = smoothNoise2D(lng * 3.8, lat * 3.8) * 0.032;
  const warpY = smoothNoise2D(lat * 3.8, lng * 3.8) * 0.032;
  const qLng = lng + warpX;
  const qLat = lat + warpY;

  for (let c = 0; c < CONTINUOUS_MOUNTAIN_CORRIDORS.length; c++) {
    const corridor = CONTINUOUS_MOUNTAIN_CORRIDORS[c];
    const wps = corridor.waypoints;
    const sigma = corridor.sigmaDeg;
    const maxInfluenceDist = sigma * 2.8;

    for (let i = 0; i < wps.length - 1; i++) {
      const p0 = wps[i];
      const p1 = wps[i + 1];

      const dx = p1.lng - p0.lng;
      const dy = p1.lat - p0.lat;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 1e-6) continue;

      // 投影标量 t ∈ [0, 1]
      let t = ((qLng - p0.lng) * dx + (qLat - p0.lat) * dy) / lenSq;
      t = Math.max(0.0, Math.min(1.0, t));

      const projLng = p0.lng + t * dx;
      const projLat = p0.lat + t * dy;

      // 距山脊主轴的真实地质距离 (经度考虑纬度变形)
      const dLng = (qLng - projLng) * Math.cos(projLat * (Math.PI / 180));
      const dLat = qLat - projLat;
      const dist = Math.hypot(dLng, dLat);

      if (dist < maxInfluenceDist) {
        // 复合地质山脊函数：在山脊主梁呈锐利山梁走势，山脚平滑消隐融入大地，彻底终结死圆馒头
        const u = dist / sigma;
        const sharpRidge = Math.exp(-Math.pow(u, 1.15));
        const broadMassif = Math.exp(-0.5 * u * u);
        const compositeProfile = 0.55 * sharpRidge + 0.45 * broadMassif;

        // 沿山脊主线标称高程自然连贯插值 (鞍部保持 600~900m，峰巅高达 1500~1902m)
        const spineH = p0.altitude + t * (p1.altitude - p0.altitude);

        // 侧向分支支脉与峡谷纵深 (Lateral Branching Spurs & Ravines)
        const spurAngle = t * 24.0 * Math.PI;
        const spurModulation = 1.0 + Math.cos(spurAngle) * 0.16 * Math.sin(Math.min(1.0, u) * Math.PI);

        // 各向异性岩体山脊刀削侵蚀分形 (山梁起伏、侧生支脉与山谷深壑)
        const ridgeDetail = ridgeFbm2D(lng * 9.0 + projLat * 3.0, lat * 9.0 + projLng * 3.0, 3);
        const cragFactor = 0.88 + 0.26 * ridgeDetail;

        const elev = spineH * compositeProfile * spurModulation * cragFactor;
        if (elev > maxMountainMeters) {
          maxMountainMeters = elev;
        }
      }
    }
  }

  // 1.5. 南岭极巅 · 石坑崆断块深成花岗岩穹隆与宏伟主刃脊体系 (Shikengkung Core Batholith Uplift)
  // 在 112.9868° E, 24.9288° N 核心 18km 范围内，构筑华南第一极巅的险峻山岳地质骨架，底层山体不再是圆包
  const skDistLng = (qLng - 112.9868) * Math.cos(24.9288 * (Math.PI / 180));
  const skDistLat = qLat - 24.9288;
  const skDist = Math.hypot(skDistLng, skDistLat);
  const skRadiusDeg = 0.15;

  if (skDist < skRadiusDeg) {
    const skU = skDist / skRadiusDeg;
    const skFalloff = Math.pow(Math.cos(skU * Math.PI * 0.5), 2.0);
    // 北东—南西走向主山脉角峰脊梁
    const skParallel = (skDistLng + skDistLat) * 0.7071;
    const skPerp = (-skDistLng + skDistLat) * 0.7071;
    const skRidge = Math.exp(-Math.abs(skPerp) / 0.028);
    // 三棱角峰集中拔升
    const skHorn = Math.exp(-Math.pow(skDist / 0.038, 1.4));
    // 侵蚀冰斗谷底与悬谷起伏
    const skCirque = Math.sin(Math.atan2(skDistLat, skDistLng) * 3.0 + 1.2) * 0.08;

    const skMassifElev = 1902.0 * skFalloff * (skHorn * 0.62 + skRidge * 0.38 + skCirque);
    if (skMassifElev > maxMountainMeters) {
      maxMountainMeters = skMassifElev;
    }
  }

  // 独立残丘缓坡平滑微隆贡献：采用余弦平方平滑衰减，山脚坡度一阶导数为0，完美贴入平原，彻底杜绝尖锥！
  for (let i = 0; i < GUANGDONG_ISOLATED_PEAKS.length; i++) {
    const p = GUANGDONG_ISOLATED_PEAKS[i];
    const dLng = (lng - p.lng) * Math.cos(p.lat * (Math.PI / 180));
    const dLat = lat - p.lat;
    const dist = Math.hypot(dLng, dLat);
    if (dist < p.sigmaDeg * 1.8) {
      const u = dist / (p.sigmaDeg * 1.8);
      // 余弦缓坡平方平滑：在 u=0 时为 1，在 u=1 时平滑切入 0，绝无折角
      const falloff = 0.5 * (1.0 + Math.cos(u * Math.PI));
      const massif = falloff * falloff;
      const crag = 0.90 + 0.15 * smoothNoise2D((lng - p.lng) * 35.0, (lat - p.lat) * 35.0);
      const elev = p.altitude * massif * crag;
      if (elev > maxMountainMeters) {
        maxMountainMeters = elev;
      }
    }
  }

  return maxMountainMeters;
}

/**
 * 广东省 21 地级市全要素权威名山体系 (覆盖全省 21 地级市 30 座代表性极巅与名山)
 */
export interface FamousMountainDef {
  id: string;
  name: string;
  subName: string;
  cityId: string;
  cityName: string;
  lng: number;
  lat: number;
  altitude: number;
  element: '金' | '木' | '水' | '火' | '土';
  color: string;
  geology: string;
  peakTier: 'highest' | 'celebrated' | 'scenic';
}

export const FAMOUS_MOUNTAINS: FamousMountainDef[] = [
  // 韶关市 (粤北之巅)
  {
    id: 'shikengkung',
    name: '石坑崆',
    subName: '广东第一峰 · 南岭极巅 (1902m)',
    cityId: 'shaoguan',
    cityName: '韶关市',
    lng: 112.9868,
    lat: 24.9288,
    altitude: 1902,
    element: '金',
    color: '#F5DF88',
    geology: '古生代花岗岩深切割高山峡谷',
    peakTier: 'highest'
  },
  {
    id: 'danxia',
    name: '丹霞山',
    subName: '世界自然遗产 · 赤壁丹崖 (408m)',
    cityId: 'shaoguan',
    cityName: '韶关市',
    lng: 113.7483,
    lat: 25.0416,
    altitude: 408,
    element: '火',
    color: '#FF6B4A',
    geology: '白垩纪红色砂砾岩赤壁丹崖',
    peakTier: 'celebrated'
  },
  // 清远市
  {
    id: 'yingxi',
    name: '英西峰林',
    subName: '南粤喀斯特 · 英西峰林长廊 (380m)',
    cityId: 'qingyuan',
    cityName: '清远市',
    lng: 112.8531,
    lat: 24.1287,
    altitude: 380,
    element: '金',
    color: '#B0BEC5',
    geology: '石炭系碳酸盐岩喀斯特峰林',
    peakTier: 'celebrated'
  },
  {
    id: 'dalongshan',
    name: '连州大龙山',
    subName: '南岭雄峦 · 连阳极顶 (1380m)',
    cityId: 'qingyuan',
    cityName: '清远市',
    lng: 112.4500,
    lat: 25.1000,
    altitude: 1380,
    element: '水',
    color: '#81D4FA',
    geology: '古生代变质岩与花岗岩高耸雄峰',
    peakTier: 'highest'
  },
  // 广州市 (广州双岳: 从化天堂顶 + 羊城白云山)
  {
    id: 'tiantangding',
    name: '从化天堂顶',
    subName: '羊城之巅 · 南昆余脉 (1210m)',
    cityId: 'guangzhou',
    cityName: '广州市',
    lng: 113.8800,
    lat: 23.6800,
    altitude: 1210,
    element: '木',
    color: '#81C784',
    geology: '燕山期花岗岩巨大穹隆顶峰',
    peakTier: 'highest'
  },
  {
    id: 'baiyun',
    name: '白云山',
    subName: '羊城第一秀 · 云山叠翠 (382m)',
    cityId: 'guangzhou',
    cityName: '广州市',
    lng: 113.2983,
    lat: 23.1783,
    altitude: 382,
    element: '木',
    color: '#A5D6A7',
    geology: '古生界变质岩群及花岗岩秀峰',
    peakTier: 'celebrated'
  },
  // 佛山市
  {
    id: 'xiqiao',
    name: '西樵山',
    subName: '理学名山 · 珠江文明灯塔 (346m)',
    cityId: 'foshan',
    cityName: '佛山市',
    lng: 112.9667,
    lat: 22.9333,
    altitude: 346,
    element: '土',
    color: '#FFE082',
    geology: '白垩纪死火山锥状火山岩台地',
    peakTier: 'celebrated'
  },
  {
    id: 'zaomushan',
    name: '高明皂幕山',
    subName: '佛山第一峰 · 幽谷层峦 (805m)',
    cityId: 'foshan',
    cityName: '佛山市',
    lng: 112.6300,
    lat: 22.7500,
    altitude: 805,
    element: '木',
    color: '#81C784',
    geology: '古生代变质砂岩佛山第一极巅',
    peakTier: 'highest'
  },
  // 深圳市
  {
    id: 'wutong',
    name: '梧桐山',
    subName: '鹏城第一峰 · 雾锁云海 (943m)',
    cityId: 'shenzhen',
    cityName: '深圳市',
    lng: 114.2083,
    lat: 22.5833,
    altitude: 943,
    element: '水',
    color: '#4FC3F7',
    geology: '侏罗纪火山岩及花岗岩拔海雄峦',
    peakTier: 'highest'
  },
  {
    id: 'qiniangshan',
    name: '大鹏七娘山',
    subName: '国家地质公园 · 滨海奇观 (869m)',
    cityId: 'shenzhen',
    cityName: '深圳市',
    lng: 114.5500,
    lat: 22.5300,
    altitude: 869,
    element: '火',
    color: '#FF8A80',
    geology: '侏罗纪古火山地质遗迹与海蚀崖',
    peakTier: 'celebrated'
  },
  // 珠海市
  {
    id: 'huangyang',
    name: '黄杨山',
    subName: '珠江第一峰 · 无荫灵岩 (581m)',
    cityId: 'zhuhai',
    cityName: '珠海市',
    lng: 113.2167,
    lat: 22.2333,
    altitude: 581,
    element: '水',
    color: '#26C6DA',
    geology: '燕山期花岗岩海岛隆升山体',
    peakTier: 'celebrated'
  },
  // 惠州市
  {
    id: 'luofu',
    name: '罗浮山',
    subName: '岭南第一山 · 蓬莱第七洞天 (1296m)',
    cityId: 'huizhou',
    cityName: '惠州市',
    lng: 114.0583,
    lat: 23.2982,
    altitude: 1296,
    element: '木',
    color: '#4EEDB0',
    geology: '燕山期花岗岩巨大穹窿飞云顶',
    peakTier: 'highest'
  },
  {
    id: 'daxingshan',
    name: '大星山',
    subName: '双月湾 · 黄金海岸巨浪奇礁 (260m)',
    cityId: 'huizhou',
    cityName: '惠州市',
    lng: 114.8833,
    lat: 22.5667,
    altitude: 260,
    element: '水',
    color: '#4DD0E1',
    geology: '海蚀地貌与花岗岩分海神角',
    peakTier: 'scenic'
  },
  // 肇庆市 (肇庆双璧: 鼎湖山 + 七星岩)
  {
    id: 'dinghu',
    name: '鼎湖山',
    subName: '岭南四大名山之首 · 北回归线绿宝石 (1000m)',
    cityId: 'zhaoqing',
    cityName: '肇庆市',
    lng: 112.5539,
    lat: 23.1678,
    altitude: 1000,
    element: '水',
    color: '#26E8B6',
    geology: '泥盆纪砂页岩地层与天然原始密林',
    peakTier: 'highest'
  },
  {
    id: 'qixingyan',
    name: '肇庆七星岩',
    subName: '千年诗廊 · 喀斯特岩溶峰丛 (85m)',
    cityId: 'zhaoqing',
    cityName: '肇庆市',
    lng: 112.4800,
    lat: 23.0700,
    altitude: 85,
    element: '金',
    color: '#CFD8DC',
    geology: '石炭系纯质石灰岩水上喀斯特峰林',
    peakTier: 'scenic'
  },
  // 梅州市 (粤东极巅与客家名山)
  {
    id: 'tongguzhang',
    name: '铜鼓嶂',
    subName: '粤东第一峰 · 莲花山脉极巅 (1560m)',
    cityId: 'meizhou',
    cityName: '梅州市',
    lng: 116.2400,
    lat: 23.9200,
    altitude: 1560,
    element: '金',
    color: '#FFE082',
    geology: '华夏陆块中生代花岗岩高耸主梁',
    peakTier: 'highest'
  },
  {
    id: 'yinnashan',
    name: '阴那山',
    subName: '灵光圣境 · 粤东五指奇峰 (1298m)',
    cityId: 'meizhou',
    cityName: '梅州市',
    lng: 116.3900,
    lat: 24.4000,
    altitude: 1298,
    element: '木',
    color: '#80CBC4',
    geology: '花岗岩五指峰与千年古刹灵光寺',
    peakTier: 'celebrated'
  },
  {
    id: 'wuzhishi',
    name: '平远五指石',
    subName: '世界地质公园 · 粤东丹霞奇观 (460m)',
    cityId: 'meizhou',
    cityName: '梅州市',
    lng: 115.9300,
    lat: 24.7800,
    altitude: 460,
    element: '火',
    color: '#FF7043',
    geology: '白垩纪红色砂砾岩陡崖平顶丹霞峰丛',
    peakTier: 'celebrated'
  },
  // 河源市
  {
    id: 'guishan',
    name: '河源桂山',
    subName: '万绿湖畔第一峰 · 九里十八瀑 (1056m)',
    cityId: 'heyuan',
    cityName: '河源市',
    lng: 114.5800,
    lat: 23.6800,
    altitude: 1056,
    element: '木',
    color: '#66BB6A',
    geology: '原始次生林与花岗岩深山清泉',
    peakTier: 'celebrated'
  },
  {
    id: 'wudunshan',
    name: '紫金武顿山',
    subName: '南岭支脉 · 奇石林立 (1330m)',
    cityId: 'heyuan',
    cityName: '河源市',
    lng: 115.3500,
    lat: 23.8500,
    altitude: 1330,
    element: '土',
    color: '#D4E157',
    geology: '花岗岩巨石垒叠武顿雄姿',
    peakTier: 'celebrated'
  },
  // 潮州市
  {
    id: 'fenghuangshan',
    name: '凤凰山',
    subName: '潮汕第一峰 · 单丛茶祖乌岽天池 (1498m)',
    cityId: 'chaozhou',
    cityName: '潮州市',
    lng: 116.7100,
    lat: 23.9300,
    altitude: 1498,
    element: '木',
    color: '#81C784',
    geology: '古火山喷发口乌岽天池与单丛古茶树群',
    peakTier: 'highest'
  },
  // 汕头市 (海岛极巅 + 潮汕精神图腾桑浦山 + 革命雄关大南山)
  {
    id: 'dajianshan',
    name: '南澳大尖山',
    subName: '海岛第一峰 · 沧溟极巅 (588m)',
    cityId: 'shantou',
    cityName: '汕头市',
    lng: 117.0200,
    lat: 23.4200,
    altitude: 588,
    element: '水',
    color: '#29B6F6',
    geology: '海岛花岗岩孤拔奇峰瞰南海',
    peakTier: 'celebrated'
  },
  {
    id: 'sangpushan',
    name: '桑浦山',
    subName: '潮汕精神图腾 · 北回归线名山 (484m)',
    cityId: 'shantou',
    cityName: '汕头市',
    lng: 116.6000,
    lat: 23.4300,
    altitude: 484,
    element: '土',
    color: '#FFE082',
    geology: '海蚀地貌与摩崖石刻潮汕文明之源',
    peakTier: 'celebrated'
  },
  {
    id: 'dananshan',
    name: '大南山',
    subName: '滨海雄关 · 潮南革命老区屏障 (972m)',
    cityId: 'shantou',
    cityName: '汕头市',
    lng: 116.3200,
    lat: 23.1800,
    altitude: 972,
    element: '木',
    color: '#66BB6A',
    geology: '古生代花岗岩重峦叠嶂屏卫潮南',
    peakTier: 'celebrated'
  },
  // 揭阳市 (揭西千米群峦极巅 + 三山国王祖庭神岳 + 揭阳八景之首黄岐夕翠 + 普宁古邑名岳铁山)
  {
    id: 'liwangzhang',
    name: '李望嶂',
    subName: '揭阳第一峰 · 莲花山脉燕山期花岗岩极巅 (1222m)',
    cityId: 'jieyang',
    cityName: '揭阳市',
    lng: 115.9800,
    lat: 23.5900,
    altitude: 1222,
    element: '金',
    color: '#F5DF88',
    geology: '燕山期黑云母花岗岩高耸险峻花岗岩极巅',
    peakTier: 'highest'
  },
  {
    id: 'wangtianshi',
    name: '揭西望天石',
    subName: '揭阳第二高峰 · 嵯峨怪石仰望苍穹 (1198m)',
    cityId: 'jieyang',
    cityName: '揭阳市',
    lng: 115.8600,
    lat: 23.5300,
    altitude: 1198,
    element: '金',
    color: '#FFE082',
    geology: '高耸花岗岩巨石林立与悬崖绝壁',
    peakTier: 'celebrated'
  },
  {
    id: 'dabeishan',
    name: '揭西大北山',
    subName: '国家森林公园 · 七星峰天池与千亩茶园 (1100m)',
    cityId: 'jieyang',
    cityName: '揭阳市',
    lng: 115.8200,
    lat: 23.4900,
    altitude: 1100,
    element: '木',
    color: '#81C784',
    geology: '莲花山脉中段原始森林与七星飞瀑天池',
    peakTier: 'celebrated'
  },
  {
    id: 'tianzizhang',
    name: '揭西天子嶂',
    subName: '良田崇山雄峦 · 奇峰耸立白云生处 (1083m)',
    cityId: 'jieyang',
    cityName: '揭阳市',
    lng: 115.9200,
    lat: 23.5600,
    altitude: 1083,
    element: '土',
    color: '#DCE775',
    geology: '高山断层褶皱花岗岩雄峰奇石',
    peakTier: 'celebrated'
  },
  {
    id: 'shiduzhang',
    name: '揭西石肚嶂',
    subName: '良田深谷幽壑 · 高山茶区飞瀑垂练 (1048m)',
    cityId: 'jieyang',
    cityName: '揭阳市',
    lng: 115.8800,
    lat: 23.4600,
    altitude: 1048,
    element: '水',
    color: '#4DD0E1',
    geology: '变质砂岩深切峡谷与天然高山溪涧',
    peakTier: 'celebrated'
  },
  {
    id: 'hongeling',
    name: '揭西鸿娥岭',
    subName: '揭西高嶂翠峦 · 悬崖古木俯瞰榕江 (1035m)',
    cityId: 'jieyang',
    cityName: '揭阳市',
    lng: 115.7900,
    lat: 23.4400,
    altitude: 1035,
    element: '木',
    color: '#A5D6A7',
    geology: '燕山期花岗岩深切割高嶂险峰',
    peakTier: 'scenic'
  },
  {
    id: 'mingshan',
    name: '揭西明山',
    subName: '三山国王二王神岳 · 华夏古刹传世道场 (620m)',
    cityId: 'jieyang',
    cityName: '揭阳市',
    lng: 115.9300,
    lat: 23.5100,
    altitude: 620,
    element: '火',
    color: '#FF8A80',
    geology: '花岗岩神山古刹与林泉灵境',
    peakTier: 'celebrated'
  },
  {
    id: 'jinshan_jiexi',
    name: '揭西巾山',
    subName: '三山国王大王神岳 · 祖庙镇境千秋威灵 (480m)',
    cityId: 'jieyang',
    cityName: '揭阳市',
    lng: 115.8800,
    lat: 23.4300,
    altitude: 480,
    element: '金',
    color: '#FFE082',
    geology: '三山国王祖庙所在地秀丽名岳',
    peakTier: 'celebrated'
  },
  {
    id: 'dushan',
    name: '揭西独山',
    subName: '三山国王三王神岳 · 一石拔地千秋福地 (450m)',
    cityId: 'jieyang',
    cityName: '揭阳市',
    lng: 115.8450,
    lat: 23.4100,
    altitude: 450,
    element: '土',
    color: '#D4E157',
    geology: '莲花山脉支脉孤峰耸峙千秋神岳',
    peakTier: 'celebrated'
  },
  {
    id: 'huangqishan',
    name: '揭阳黄岐山',
    subName: '揭阳八景之首 · 黄岐夕翠塔影凌虚 (300m)',
    cityId: 'jieyang',
    cityName: '揭阳市',
    lng: 116.3650,
    lat: 23.5600,
    altitude: 300,
    element: '木',
    color: '#81C784',
    geology: '榕江北岸名岳古塔古道松风',
    peakTier: 'celebrated'
  },
  {
    id: 'tieshan_puning',
    name: '普宁铁山',
    subName: '普宁古邑名岳 · 铁山滴翠灵秀钟毓 (520m)',
    cityId: 'jieyang',
    cityName: '揭阳市',
    lng: 116.2200,
    lat: 23.3200,
    altitude: 520,
    element: '金',
    color: '#90A4AE',
    geology: '花岗岩侵蚀峰丘漫山修竹滴翠',
    peakTier: 'celebrated'
  },
  // 汕尾市
  {
    id: 'lianhuashan',
    name: '海丰莲花山',
    subName: '粤东莲花山脉主峰 · 仙人茶田 (1337m)',
    cityId: 'shanwei',
    cityName: '汕尾市',
    lng: 115.2500,
    lat: 23.0600,
    altitude: 1337,
    element: '木',
    color: '#4DB6AC',
    geology: '燕山期花岗岩层叠莲花九峰',
    peakTier: 'highest'
  },
  // 东莞市
  {
    id: 'yinpingzui',
    name: '东莞银瓶嘴',
    subName: '东莞第一峰 · 银瓶飞瀑 (898m)',
    cityId: 'dongguan',
    cityName: '东莞市',
    lng: 114.1800,
    lat: 22.9000,
    altitude: 898,
    element: '金',
    color: '#E0E0E0',
    geology: '花岗岩峭壁形如银瓶展素女',
    peakTier: 'highest'
  },
  // 中山市
  {
    id: 'wuguishan',
    name: '中山五桂山',
    subName: '香山第一峰 · 翠亨灵脉 (531m)',
    cityId: 'zhongshan',
    cityName: '中山市',
    lng: 113.4300,
    lat: 22.4200,
    altitude: 531,
    element: '土',
    color: '#FFB74D',
    geology: '花岗岩与古生代变质岩香山主脊',
    peakTier: 'highest'
  },
  // 江门市
  {
    id: 'gudoushan',
    name: '台山古兜山',
    subName: '侨乡第一名山 · 崖门雄峦 (987m)',
    cityId: 'jiangmen',
    cityName: '江门市',
    lng: 112.9500,
    lat: 22.2500,
    altitude: 987,
    element: '水',
    color: '#4FC3F7',
    geology: '濒海花岗岩崖门古战场屏障',
    peakTier: 'highest'
  },
  // 阳江市
  {
    id: 'ehuangzhang',
    name: '阳春鹅凰嶂',
    subName: '阳江第一峰 · 杜鹃云海 (1337m)',
    cityId: 'yangjiang',
    cityName: '阳江市',
    lng: 111.7500,
    lat: 22.1800,
    altitude: 1337,
    element: '木',
    color: '#81C784',
    geology: '云雾山脉花岗岩原始杜鹃云海',
    peakTier: 'highest'
  },
  // 茂名市 (粤西极巅)
  {
    id: 'datianding',
    name: '信宜大田顶',
    subName: '粤西第一峰 · 云开大山极巅 (1704m)',
    cityId: 'maoming',
    cityName: '茂名市',
    lng: 111.2300,
    lat: 22.2800,
    altitude: 1704,
    element: '土',
    color: '#FFD54F',
    geology: '前寒武纪变质岩与花岗岩粤西屋脊',
    peakTier: 'highest'
  },
  // 湛江市
  {
    id: 'huguangyan',
    name: '湛江湖光岩',
    subName: '世界地质公园 · 玛珥火山圣湖 (80m)',
    cityId: 'zhanjiang',
    cityName: '湛江市',
    lng: 110.2800,
    lat: 21.1500,
    altitude: 80,
    element: '火',
    color: '#FF7043',
    geology: '更新世玛珥火山爆发遗迹圣湖',
    peakTier: 'celebrated'
  },
  // 云浮市
  {
    id: 'tianlushang',
    name: '新兴天露山',
    subName: '禅宗祖山 · 六祖悟道灵岳 (1251m)',
    cityId: 'yunfu',
    cityName: '云浮市',
    lng: 112.0444,
    lat: 22.9298,
    altitude: 1251,
    element: '金',
    color: '#FFF176',
    geology: '花岗岩高山云海与千亩野杜鹃',
    peakTier: 'highest'
  },
  // 香港特别行政区
  {
    id: 'damaoshan',
    name: '香港大帽山',
    subName: '香港第一峰 · 云锁大帽 (957m)',
    cityId: 'hongkong',
    cityName: '香港特别行政区',
    lng: 114.1200,
    lat: 22.4100,
    altitude: 957,
    element: '金',
    color: '#FFD700',
    geology: '中生代火山岩险峰群穹隆',
    peakTier: 'highest'
  },
  {
    id: 'lionrock',
    name: '香港狮子山',
    subName: '狮子山精神 · 九龙神狮 (495m)',
    cityId: 'hongkong',
    cityName: '香港特别行政区',
    lng: 114.1867,
    lat: 22.3528,
    altitude: 495,
    element: '金',
    color: '#FF4081',
    geology: '燕山期花岗岩天然巨狮奇石',
    peakTier: 'celebrated'
  },
  {
    id: 'lantau_peak',
    name: '大屿山凤凰山',
    subName: '大屿山最高峰 · 凤凰观日 (934m)',
    cityId: 'hongkong',
    cityName: '香港特别行政区',
    lng: 113.9200,
    lat: 22.2500,
    altitude: 934,
    element: '火',
    color: '#FF8A65',
    geology: '晚侏罗世流纹质火山岩险峰穹隆',
    peakTier: 'highest'
  },
  {
    id: 'taipingshan',
    name: '香港太平山',
    subName: '扯旗山 · 维港天际极巅 (552m)',
    cityId: 'hongkong',
    cityName: '香港特别行政区',
    lng: 114.1400,
    lat: 22.2750,
    altitude: 552,
    element: '土',
    color: '#FFCA28',
    geology: '燕山期花岗岩拔海奇峰与维多利亚港全景',
    peakTier: 'celebrated'
  },
  // 澳门特别行政区
  {
    id: 'dieshitang',
    name: '澳门叠石塘山',
    subName: '澳门之巅 · 塔石塘妈祖峰 (172m)',
    cityId: 'macau',
    cityName: '澳门特别行政区',
    lng: 113.5614,
    lat: 22.1242,
    altitude: 172,
    element: '水',
    color: '#00E676',
    geology: '古生代花岗岩低丘林海与叠石奇观',
    peakTier: 'highest'
  },
  {
    id: 'dongwangyang',
    name: '澳门东望洋山',
    subName: '世界文化遗产 · 松山灯塔 (90m)',
    cityId: 'macau',
    cityName: '澳门特别行政区',
    lng: 113.5511,
    lat: 22.1969,
    altitude: 90,
    element: '木',
    color: '#80CBC4',
    geology: '花岗岩残丘与远东古老海防灯塔圣地',
    peakTier: 'celebrated'
  },
  {
    id: 'dataishan',
    name: '氹仔大潭山',
    subName: '氹仔之巅 · 鸡颈山 (160m)',
    cityId: 'macau',
    cityName: '澳门特别行政区',
    lng: 113.5650,
    lat: 22.1580,
    altitude: 160,
    element: '土',
    color: '#A5D6A7',
    geology: '中生代花岗岩山丘与澳门国际机场眺望台',
    peakTier: 'celebrated'
  }
];

export type DioramaLayerMode = 'topography' | 'landforms' | 'mountains' | 'waters' | 'roads' | 'cities';

/**
 * 广东省五大代表性地貌地质奇观全系图谱 (18处世界自然遗产与国家地质公园)
 */
export interface LandformFeatureItem {
  id: string;
  name: string;
  category: '丹霞地貌' | '喀斯特地貌' | '古火山地质' | '花岗岩峡谷' | '海蚀海岸' | '冲积平原';
  subName: string;
  cityName: string;
  lng: number;
  lat: number;
  color: string;
  description: string;
}

export const GUANGDONG_LANDFORM_FEATURES: LandformFeatureItem[] = [
  // 1. 丹霞地貌 (Danxia Landforms - 红色砂砾岩赤壁丹崖)
  {
    id: 'danxiashan',
    name: '韶关丹霞山',
    category: '丹霞地貌',
    subName: '世界自然遗产 · 全球丹霞地貌命名地 (408m)',
    cityName: '韶关市',
    lng: 113.7400,
    lat: 25.0400,
    color: '#E64A19',
    description: '白垩纪红层砂砾岩受构造抬升与流水侵蚀，形成顶平、身陡、麓缓的典型赤壁丹崖'
  },
  {
    id: 'bazhai_danxia',
    name: '仁化巴寨',
    category: '丹霞地貌',
    subName: '丹霞之巅 · 绝壁天堑城堡状峰丛 (618m)',
    cityName: '韶关市',
    lng: 113.6300,
    lat: 25.0100,
    color: '#D84315',
    description: '丹霞山群峰最高峰，四面绝壁悬崖如刀劈斧削，孤峰突起如雄伟天然城堡'
  },
  {
    id: 'jinjiling_danxia',
    name: '乐昌金鸡岭',
    category: '丹霞地貌',
    subName: '岭南门户 · 丹霞一字峰奇观 (338m)',
    cityName: '韶关市',
    lng: 113.1200,
    lat: 25.1300,
    color: '#BF360C',
    description: '北扼湖南中原要冲，丹霞峭壁绵延如展开长卷，岭巅巨石雄鸡欲鸣'
  },

  // 2. 喀斯特地貌 (Karst Landforms - 碳酸盐岩峰丛、溶洞、石林)
  {
    id: 'yingxi_karst',
    name: '英德英西峰林',
    category: '喀斯特地貌',
    subName: '南粤喀斯特长廊 · 千峰拔地穿云 (380m)',
    cityName: '清远市',
    lng: 112.8500,
    lat: 24.1500,
    color: '#607D8B',
    description: '连绵数十里的石灰岩峰丛洼地、石芽、穿洞与地下暗河，被誉为岭南小桂林'
  },
  {
    id: 'qixingyan_karst',
    name: '肇庆七星岩',
    category: '喀斯特地貌',
    subName: '水上喀斯特绝景 · 千年石灰岩峰林 (160m)',
    cityName: '肇庆市',
    lng: 112.4800,
    lat: 23.0700,
    color: '#546E7A',
    description: '石炭纪纯质石灰岩经溶蚀立于星湖碧水之中，摩崖石刻千年传颂，湖石并秀'
  },
  {
    id: 'lingxiaoyan_karst',
    name: '阳春凌霄岩',
    category: '喀斯特地貌',
    subName: '南国第一洞 · 巨型石笋溶蚀殿堂 (220m)',
    cityName: '阳江市',
    lng: 111.7500,
    lat: 22.3800,
    color: '#455A64',
    description: '四层溶洞垂直贯穿，钟乳石柱高耸通天，地下暗河波光溶蚀奇景'
  },
  {
    id: 'wanshanchaowang_karst',
    name: '连南万山朝王',
    category: '喀斯特地貌',
    subName: '瑶山喀斯特峰丛 · 千峰向东伏拜 (450m)',
    cityName: '清远市',
    lng: 112.2200,
    lat: 24.6200,
    color: '#37474F',
    description: '千余座石灰岩石峰聚集成群，形如群臣整齐朝拜王者，峰林与瑶寨梯田共生'
  },

  // 3. 古火山与火山地质 (Volcanic Landforms)
  {
    id: 'xiqiaoshan_volcano',
    name: '佛山西樵山',
    category: '古火山地质',
    subName: '白垩纪古火山口 · 珠江文明灯塔 (346m)',
    cityName: '佛山市',
    lng: 112.9667,
    lat: 22.9333,
    color: '#FF7043',
    description: '白垩纪火山强烈喷发溢流玄武岩形成的锥状火山口，孕育石燕岩古采石场'
  },
  {
    id: 'huguangyan_maar',
    name: '湛江湖光岩',
    category: '古火山地质',
    subName: '世界地质公园 · 玛珥湖火山湖泊 (23m)',
    cityName: '湛江市',
    lng: 110.2800,
    lat: 21.1500,
    color: '#F4511E',
    description: '早更新世由于玄武岩浆与地下水强烈蒸汽爆破形成的平地火山口天然湖'
  },
  {
    id: 'qiniangshan_volcano',
    name: '深圳七娘山',
    category: '古火山地质',
    subName: '大鹏国家地质公园 · 晚侏罗世古火山海蚀 (869m)',
    cityName: '深圳市',
    lng: 114.5500,
    lat: 22.5300,
    color: '#E64A19',
    description: '一亿四千万年前古火山喷发形成的火山角砾岩与流纹岩，临南海矗立火山海蚀绝壁'
  },
  {
    id: 'fenghuangshan_tianchi',
    name: '潮州凤凰山天池',
    category: '古火山地质',
    subName: '粤东古火山锥天池 · 单丛茶祖名岳 (1392m)',
    cityName: '潮州市',
    lng: 116.6500,
    lat: 23.9200,
    color: '#D84315',
    description: '破火山口洼地积水成池，古火山灰发育肥沃茶山土壤，常年云雾缭绕'
  },

  // 4. 花岗岩奇峰与深切大峡谷 (Granite & Canyon Landforms)
  {
    id: 'grand_canyon_ruyuan',
    name: '乳源广东大峡谷',
    category: '花岗岩峡谷',
    subName: '南岭地壳断裂陷落大峡谷 · 腾龙瀑布 (300m深)',
    cityName: '韶关市',
    lng: 113.1500,
    lat: 24.5200,
    color: '#00897B',
    description: '石英砂岩地层由于燕山运动地壳强烈下陷断裂形成长达15公里、深逾300米的断裂大峡谷'
  },
  {
    id: 'luofushan_granite',
    name: '博罗罗浮山',
    category: '花岗岩峡谷',
    subName: '岭南第一山 · 花岗岩穹窿侵蚀峰峦 (1296m)',
    cityName: '惠州市',
    lng: 114.0500,
    lat: 23.2667,
    color: '#00796B',
    description: '燕山期花岗岩巨大岩体受断裂与流水长期风化剥蚀形成的飞瀑深涧与四百峰峦'
  },
  {
    id: 'fengkai_dashiwei',
    name: '封开大石围',
    category: '花岗岩峡谷',
    subName: '天下第一石 · 巨型花岗岩巨石残丘 (200m)',
    cityName: '肇庆市',
    lng: 111.5800,
    lat: 23.4500,
    color: '#004D40',
    description: '整块巨型花岗岩球状风化遗留的亚洲第一巨石，如刀削石壁拔地而起'
  },

  // 5. 海蚀海岸与岬角海湾 (Coastal & Island Landforms)
  {
    id: 'shuangyuewan_cape',
    name: '惠州双月湾',
    category: '海蚀海岸',
    subName: '大星山分海岬角 · 连岛沙坝双弧海湾 (260m)',
    cityName: '惠州市',
    lng: 114.8833,
    lat: 22.5667,
    color: '#00ACC1',
    description: '花岗岩海蚀残丘岬角阻挡潮流泥沙沉积，形成左右两条对称的弧形银白沙滩海湾'
  },
  {
    id: 'hailingdao_cape',
    name: '阳江海陵岛',
    category: '海蚀海岸',
    subName: '南海丝路古港 · 花岗岩海蚀岛链 (390m)',
    cityName: '阳江市',
    lng: 111.8800,
    lat: 21.6200,
    color: '#0097A7',
    description: '南海一号古沉船出水地，花岗岩海岛与漫长岬角沙滩交替的经典滨海地貌'
  },
  {
    id: 'nanao_island',
    name: '汕头南澳岛',
    category: '海蚀海岸',
    subName: '北回归线海蚀明珠 · 粤东第一大岛 (588m)',
    cityName: '汕头市',
    lng: 117.0500,
    lat: 23.4300,
    color: '#00838F',
    description: '海蚀海积交错发育，花岗岩海蚀柱、海蚀崖与青澳湾金沙滩环抱海疆'
  },

  // 6. 冲积三角洲网河平原 (Alluvial Delta)
  {
    id: 'prd_delta_plain',
    name: '珠江三角洲冲积平原',
    category: '冲积平原',
    subName: '三江汇流八门入海 · 复合网河平原 (12m)',
    cityName: '广州市',
    lng: 113.3500,
    lat: 22.8500,
    color: '#43A047',
    description: '西江、北江、东江流水携千亿泥沙在古溺谷河口湾经两千年堆积形成的纵横网状水系平原'
  }
];

/**
 * 广东省历史地理古驿道与海上丝绸之路古航道体系
 */
export interface AncientPostRoadItem {
  id: string;
  name: string;
  subName: string;
  type: '陆上古道' | '海丝航道';
  color: string;
  points: [number, number][]; // [lng, lat]
  description: string;
}

export const GUANGDONG_POST_ROADS: AncientPostRoadItem[] = [
  {
    id: 'meiguan_road',
    name: '大庾岭梅关古道',
    subName: '张九龄开辟 · 岭南通中原第一咽喉',
    type: '陆上古道',
    color: '#E0AA3E',
    points: [
      [114.30, 25.18],
      [114.36, 25.26],
      [114.38, 25.32],
      [114.40, 25.36]
    ],
    description: '唐开元四年名相张九龄奉旨劈山拓路，凿石开径五里，南北通衢，岭南百货由此大通'
  },
  {
    id: 'xijing_road',
    name: '南岭西京古道',
    subName: '汉唐进京官道 · 梯云梯天险关隘',
    type: '陆上古道',
    color: '#E0AA3E',
    points: [
      [112.38, 24.78],
      [112.45, 24.95],
      [112.52, 25.12],
      [112.60, 25.28]
    ],
    description: '汉武帝平南越后开辟，连州翻越骑田岭通达中原长安的军事与商贸官马大道'
  },
  {
    id: 'chaohui_road',
    name: '粤东潮惠古驿道',
    subName: '潮客商道 · 贯穿韩江东江生命线',
    type: '陆上古道',
    color: '#D4AF37',
    points: [
      [116.62, 23.66],
      [116.18, 23.75],
      [115.82, 23.60],
      [115.35, 23.30],
      [114.42, 23.09]
    ],
    description: '连接潮汕平原与东江惠州的千年驿道，韩愈贬潮、客家先民迁徙商贸主干线'
  },
  {
    id: 'qiao_road',
    name: '岐澳香山古道',
    subName: '香山至澳门 · 近代西学东渐海关要道',
    type: '陆上古道',
    color: '#D4AF37',
    points: [
      [113.38, 22.52],
      [113.48, 22.38],
      [113.52, 22.28],
      [113.55, 22.20]
    ],
    description: '香山通往澳门的重要官道，林则徐禁烟巡阅澳门、孙中山早年求索的重要通道'
  },
  {
    id: 'maritime_silk_guangzhou',
    name: '广州黄埔海丝古航道',
    subName: '千年商都发祥 · 扶胥古港出南海',
    type: '海丝航道',
    color: '#38D9A9',
    points: [
      [113.31, 23.10],
      [113.50, 23.08],
      [113.62, 22.78],
      [113.75, 22.45],
      [114.05, 22.15]
    ],
    description: '从南海神庙古港扬帆启航，经虎门出大洋，直航波斯湾与罗马帝国的海上丝绸之路第一主航道'
  },
  {
    id: 'maritime_silk_xuwen',
    name: '汉代徐闻古港航道',
    subName: '汉书明载 · 海上丝绸之路最早始发港',
    type: '海丝航道',
    color: '#38D9A9',
    points: [
      [110.18, 20.32],
      [110.15, 20.20],
      [109.80, 20.00]
    ],
    description: '《汉书·地理志》记载西汉平帝时期自徐闻合浦乘楼船出海通罗马，为官方有据最早海丝始发地'
  },
  {
    id: 'maritime_silk_zhanglin',
    name: '汕头澄海樟林古港',
    subName: '通洋总汇 · 红头船下南洋始发港',
    type: '海丝航道',
    color: '#38D9A9',
    points: [
      [116.88, 23.52],
      [116.92, 23.45],
      [117.15, 23.35]
    ],
    description: '清代乾隆嘉庆年间粤东第一大港，万商云集，红头船由樟林扬帆直下南洋'
  }
];

export interface DioramaInteractableHit {
  type: 'city' | 'mountain' | 'river' | 'landform' | 'road';
  id: string;
  name: string;
  subName?: string;
  altitude?: number;
  geology?: string;
  element?: string;
  color?: string;
  dest?: DestinationItem;
}

export interface OffshoreIslandDef {
  name: string;
  lng: number;
  lat: number;
  altitude: number; // 真实最高拔海 (米)
  radiusDeg: number; // 岛屿自然坡降半径 (度数)
  subHills?: { lng: number; lat: number; altitude: number; radiusDeg: number }[];
}

/**
 * 广东省沿岸代表性离岸名岛群峰体系 (广东省自然资源厅 官方海岛地形数据)
 * 涵盖南澳岛、海陵岛、川山群岛、万山群岛、横琴岛、东海岛等，拒绝海面死黑或平地抹杀，赋准确权威海拔！
 */
export const AUTHORITATIVE_OFFSHORE_ISLANDS: OffshoreIslandDef[] = [
  // 1. 汕头南澳岛 (粤东第一大海岛，主峰大尖山 588m，果老山 425m)
  {
    name: '南澳岛',
    lng: 117.02,
    lat: 23.42,
    altitude: 588,
    radiusDeg: 0.09,
    subHills: [
      { lng: 117.07, lat: 23.44, altitude: 425, radiusDeg: 0.05 }
    ]
  },
  // 2. 阳江海陵岛 (南海丝路明珠，主峰草王山 390m)
  {
    name: '海陵岛',
    lng: 111.88,
    lat: 21.62,
    altitude: 390,
    radiusDeg: 0.075,
    subHills: [
      { lng: 111.93, lat: 21.59, altitude: 240, radiusDeg: 0.045 }
    ]
  },
  // 3. 台山上川岛 (川山群岛第一主岛，主峰车渡顶 499m)
  {
    name: '上川岛',
    lng: 112.78,
    lat: 21.68,
    altitude: 499,
    radiusDeg: 0.070
  },
  // 4. 台线下川岛 (下川岛，主峰牛塘山 317m)
  {
    name: '下川岛',
    lng: 112.58,
    lat: 21.62,
    altitude: 317,
    radiusDeg: 0.045
  },
  // 5. 珠海横琴岛 (大横琴山脑背山 437m，小横琴山 276m)
  {
    name: '横琴岛',
    lng: 113.52,
    lat: 22.10,
    altitude: 437,
    radiusDeg: 0.055,
    subHills: [
      { lng: 113.53, lat: 22.14, altitude: 276, radiusDeg: 0.038 }
    ]
  },
  // 6. 珠海万山群岛主岛 (大万山岛 436m)
  {
    name: '大万山岛',
    lng: 113.72,
    lat: 21.94,
    altitude: 436,
    radiusDeg: 0.032
  },
  // 7. 珠海担杆岛 (担杆山 322m)
  {
    name: '担杆岛',
    lng: 114.18,
    lat: 22.03,
    altitude: 322,
    radiusDeg: 0.035
  },
  // 8. 珠海外伶仃岛 (外伶仃峰 311m)
  {
    name: '外伶仃岛',
    lng: 114.03,
    lat: 22.10,
    altitude: 311,
    radiusDeg: 0.030
  },
  // 9. 珠海东澳岛 (东澳峰 285m)
  {
    name: '东澳岛',
    lng: 113.71,
    lat: 22.02,
    altitude: 285,
    radiusDeg: 0.028
  },
  // 10. 湛江东海岛 (龙水岭 111m)
  {
    name: '东海岛',
    lng: 110.45,
    lat: 21.05,
    altitude: 111,
    radiusDeg: 0.065
  },
  // 11. 湛江硇洲岛 (古火山锥 82m)
  {
    name: '硇洲岛',
    lng: 110.585,
    lat: 20.915,
    altitude: 82,
    radiusDeg: 0.018
  },
  // 12. 广东省辖 / 汕尾代管 东沙群岛 (东沙环礁)
  {
    name: '东沙群岛',
    lng: 116.72,
    lat: 20.70,
    altitude: 12,
    radiusDeg: 0.12
  }
];

/**
 * 计算权威离岸名岛群在指定经纬度的高程贡献 (米)
 * 采用余弦平方平滑衰减，山脚坡度水平切入 0m 海平面
 */
export function getOffshoreIslandOrogeny(lng: number, lat: number): number {
  let maxIslandElevation = 0.0;
  for (let i = 0; i < AUTHORITATIVE_OFFSHORE_ISLANDS.length; i++) {
    const island = AUTHORITATIVE_OFFSHORE_ISLANDS[i];
    const dLng = (lng - island.lng) * Math.cos(island.lat * (Math.PI / 180));
    const dLat = lat - island.lat;
    const dist = Math.hypot(dLng, dLat);
    if (dist < island.radiusDeg) {
      const u = dist / island.radiusDeg;
      const falloff = 0.5 * (1.0 + Math.cos(u * Math.PI));
      const elev = island.altitude * (falloff * falloff);
      if (elev > maxIslandElevation) maxIslandElevation = elev;
    }
    if (island.subHills) {
      for (let s = 0; s < island.subHills.length; s++) {
        const sub = island.subHills[s];
        const sdLng = (lng - sub.lng) * Math.cos(sub.lat * (Math.PI / 180));
        const sdLat = lat - sub.lat;
        const sDist = Math.hypot(sdLng, sdLat);
        if (sDist < sub.radiusDeg) {
          const u = sDist / sub.radiusDeg;
          const falloff = 0.5 * (1.0 + Math.cos(u * Math.PI));
          const elev = sub.altitude * (falloff * falloff);
          if (elev > maxIslandElevation) maxIslandElevation = elev;
        }
      }
    }
  }
  return maxIslandElevation;
}
/**
 * 广东省真实大陆海岸线关键折线 (从西向东高精度采样控制点)
 * 用于权威、严谨界定南部南海海域与华南大陆板块
 */
export const GUANGDONG_COASTLINE_KEYPOINTS: [number, number][] = [
  [109.50, 21.65], // 粤桂边界北部湾海面
  [109.68, 21.50], // 廉江安铺港海岸
  [109.85, 21.38], // 雷州半岛西海岸北部
  [109.66, 20.86], // 徐闻西岸
  [109.88, 20.47], // 徐闻西南角
  [110.08, 20.25], // 徐闻南极村 (大陆最南端)
  [110.45, 20.31], // 徐闻东岸
  [110.40, 20.70], // 雷州东岸
  [110.48, 21.05], // 湛江东海岛外海
  [110.93, 21.37], // 茂名水东湾
  [111.28, 21.42], // 电白博贺港沿海
  [111.65, 21.51], // 阳西沙扒沿海
  [111.94, 21.61], // 阳江海陵湾外海
  [112.20, 21.79], // 阳东大澳外海
  [112.50, 21.78], // 台山广海湾
  [113.05, 21.95], // 台山赤溪半岛
  [113.25, 21.88], // 珠海高栏港
  [113.56, 22.10], // 珠海三灶横琴外海
  [113.88, 22.20], // 珠江口外伶仃洋
  [114.38, 22.45], // 深圳大鹏半岛南端
  [114.86, 22.58], // 惠东双月湾大星山外海
  [115.35, 22.70], // 汕尾红海湾/遮浪角
  [115.88, 22.78], // 陆丰甲子港
  [116.30, 22.95], // 惠来靖海湾
  [116.65, 23.20], // 潮阳海门湾
  [117.05, 23.54], // 饶平海山岛 (闽粤交界海岸)
  [117.50, 23.65]  // 闽南外海延伸
];

/**
 * 根据经度精准计算广东省南部海岸线基准纬度
 */
export function getCoastlineLat(lng: number): number {
  const pts = GUANGDONG_COASTLINE_KEYPOINTS;
  if (lng <= pts[0][0]) return pts[0][1];
  if (lng >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    if (lng >= p0[0] && lng <= p1[0]) {
      const t = (lng - p0[0]) / (p1[0] - p0[0]);
      return p0[1] + t * (p1[1] - p0[1]);
    }
  }
  return 21.50;
}

/**
 * 判断经纬度是否属于南部南海海域 (vs 华南内陆相连板块)
 * 严格遵照真实陆海空间逻辑：雷州半岛以西为北部湾，以南为琼州海峡，以东及沿海全域为浩瀚南海！
 */
export function isSouthSeaWater(lat: number, lng: number): boolean {
  // 1. 绝对南海深海区 (徐闻以南琼州海峡及深海)
  if (lat < 20.25) return true;

  // 2. 西南部北部湾海域 (雷州半岛以西大片海域)
  if (lng < 109.70 && lat < 21.65) return true;

  // 3. 雷州半岛陆地区间 (经度 109.70~110.55，纬度 20.25~21.45)
  if (lng >= 109.70 && lng <= 110.55) {
    // 西侧北部湾水域
    if (lng < 109.90 && lat < 21.45) return true;
    // 东侧雷州湾与湛江外海水域
    if (lng > 110.45 && lat < 21.15) return true;
    if (lat < 20.25) return true;
  }

  // 4. 南部沿海广阔南海水域 (依据精准海岸线基准)
  const coastLat = getCoastlineLat(lng);
  if (lat < coastLat) {
    return true;
  }

  return false;
}

/**
 * 广东省 21 地级市华夏金碧青绿山海推演沙盘 (Guangdong Topographic Master Diorama)
 * 全要素真山河与城邑共融重构版：
 * 1. 【全景地势】：中国标准 9 段分层设色与瑞士光影法，精确呈现各市平原与名山起伏
 * 2. 【名山大川】：白云山、鼎湖山、揭西独山、揭西大北山等 30 座代表性名峰全量 3D 微雕立于地表
 * 3. 【城山共融】：在【二十一城】模式下名山模型常驻显现，彻底告别“只有城名无山水”的荒芜感
 * 4. 【江海水系】：三江八门入海网络与贴合地形流动琉璃碧波 Shader
 */
export class GuangdongTerrain3D {
  public group: THREE.Group;
  private destinations: DestinationItem[];

  private readonly geoBounds = {
    minLng: 109.5,
    maxLng: 117.5,
    minLat: 20.1,
    maxLat: 25.6,
    width: 3.8,
    depth: 2.8
  };

  private plinthGroup!: THREE.Group;
  private terrainMesh!: THREE.Mesh;
  private terrainMaterial!: THREE.ShaderMaterial;
  private dragonLeyLineGroup!: THREE.Group;
  private leyLineMaterial!: THREE.ShaderMaterial;
  private riversGroup!: THREE.Group;
  private riverBadgesGroup!: THREE.Group;
  private riverWaterMaterial!: THREE.ShaderMaterial;
  private cloudSeaGroup!: THREE.Group;
  private cloudMaterial!: THREE.ShaderMaterial;
  private mountainGroup!: THREE.Group;
  public shikengkungPeakModel?: ShikengkungPeak3D;
  private landformsGroup!: THREE.Group;
  private postRoadsGroup!: THREE.Group;
  private postRoadMaterials: THREE.ShaderMaterial[] = [];
  private compassRoseGroup!: THREE.Group;
  private cityPillarsGroup!: THREE.Group;
  private contourLinesGroup!: THREE.Group;
  private provincialBorderGroup!: THREE.Group;

  private currentLayerMode: DioramaLayerMode = 'topography';
  private currentTimeMode: DioramaTimeMode = 'noon';
  private probeReticleGroup!: THREE.Group;

  private interactableMeshes: THREE.Object3D[] = [];
  private billboardMeshes: THREE.Mesh[] = [];
  private activeCityId: string | null = null;
  private cityPillarMap: Map<string, {
    group: THREE.Group;
    sealMesh: THREE.Mesh;
    ring: THREE.Mesh;
    badge: THREE.Mesh;
    baseY: number;
  }> = new Map();
  private mountainMeshMap: Map<string, {
    group: THREE.Group;
    peakSculpt: THREE.Object3D;
    pedestal: THREE.Mesh;
    halo?: THREE.Mesh;
    badge: THREE.Mesh;
    beacon?: THREE.Mesh;
    orb?: THREE.Mesh;
    spec: FamousMountainDef;
  }> = new Map();

  // 【仙人指路 · 华夏4K PBR神兵定岳神标与通天接引天青真光系统】(Immortal's Guiding 4K PBR Han Sword)
  private mountainFocusBeaconGroup!: THREE.Group;
  private focusRayMesh!: THREE.Mesh;
  private focusRayMaterial!: THREE.ShaderMaterial;
  private focusGroundArrayMesh!: THREE.Mesh;
  private focusGroundArrayTexture!: THREE.Texture;
  private focusPointerGroup!: THREE.Group;
  private tripoSwordMesh: THREE.Mesh | null = null;
  private focusParticles!: THREE.Points;
  private focusParticlePositions!: Float32Array;
  private focusParticleData!: Float32Array;
  private focusParticleTexture!: THREE.Texture;
  private focusSignetGroup!: THREE.Group;
  private focusSignetSprite!: THREE.Sprite;
  private focusSignetLine!: THREE.Line;
  private focusSignetTexture!: THREE.Texture;
  private focusSignetCanvas: HTMLCanvasElement | null = null;
  private beaconTimeline: gsap.core.Timeline | null = null;
  private currentFocusedMountainId: string | null = null;

  // 【神岳极巅 · 3D名山高精程序化微雕与奠基天石台座系统】
  private focusPedestalGroup!: THREE.Group;

  public getFocusPedestalGroup(): THREE.Group {
    return this.focusPedestalGroup;
  }

  public getInteractableMeshes(): THREE.Object3D[] {
    return this.interactableMeshes;
  }

  constructor(destinations: readonly DestinationItem[] | DestinationItem[]) {
    this.destinations = destinations as DestinationItem[];
    this.group = new THREE.Group();
    this.group.name = 'GuangdongTerrainDioramaMaster';

    this.initDiorama();
  }

  public geoToLocal(lat: number, lng: number): { x: number; z: number } {
    const normX = (lng - this.geoBounds.minLng) / (this.geoBounds.maxLng - this.geoBounds.minLng);
    const normZ = (lat - this.geoBounds.minLat) / (this.geoBounds.maxLat - this.geoBounds.minLat);
    const x = (normX - 0.5) * this.geoBounds.width;
    const z = (0.5 - normZ) * this.geoBounds.depth;
    return { x, z };
  }

  public isPointInGuangdong(lat: number, lng: number): boolean {
    if (lng < 109.60 || lng > 117.30 || lat < 20.20 || lat > 25.55) return false;

    for (let r = 0; r < GUANGDONG_RING_BBOXES.length; r++) {
      const b = GUANGDONG_RING_BBOXES[r];
      if (lat < b.minLat || lat > b.maxLat || lng < b.minLng || lng > b.maxLng) continue;

      const ring = b.ring;
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      if (inside) return true;
    }
    return false;
  }

  /**
   * 判定经纬度点是否属于沙盘本土领土 (广东省本土 + 香港特别行政区 + 澳门特别行政区 + 权威离岸海岛群)
   */
  public isPointInTerritory(lat: number, lng: number): boolean {
    if (this.isPointInGuangdong(lat, lng)) return true;
    if (isPointInHongKong(lat, lng)) return true;
    if (isPointInMacao(lat, lng)) return true;
    if (getOffshoreIslandOrogeny(lng, lat) > 5.0) return true;
    return false;
  }

  private initDiorama() {
    this.group.clear();
    this.interactableMeshes = [];
    this.cityPillarMap.clear();
    this.mountainMeshMap.clear();
    this.postRoadMaterials = [];

    // 1. 皇家御制紫檀雕花须弥座底盘与正南题名御印
    this.buildImperialPedestal();

    // 2. 国家标准分层设色与真实 DEM 地形 Shader
    this.buildShanshuiTerrain();

    // 2.5. 南岭千峦浮云海与灵动山川云岚层
    this.buildMountainCloudSea();

    // 3. 实时交互探针与等高微光金环
    this.buildProbeReticle();

    // 4. 广东省界高精泥金边界线
    this.buildProvincialBorder();

    // 5. 珠江五大干流立体琉璃动态水系与三江八门入海
    this.buildRiversSystem();

    // 6. 广东 21 地市 30 座权威名山立体青绿奇峰玉雕与神岳标牌
    this.buildProminentPeaks();

    // 6.8. 通天神岳接引灵光与封岳神章 (独立挂载于主根节点，全图层常驻高亮)
    this.buildMountainFocusBeacon();

    // 6.5. 广东五大代表性地貌遗迹图层 (丹霞赤壁、喀斯特水上石林、火山地质、冲积平原、海蚀海岸)
    this.buildLandformFeatures();

    // 7. 名山龙脉金丝网络
    this.buildDragonLeyLines();

    // 7.5. 南粤古道与海上丝绸之路古航道 (梅关古道、西京古道、潮惠驿道、海丝古港)
    this.buildPostRoads();

    // 8. 21 地级市汉白玉托底金石微印 (精准坐标与错层防遮挡)
    this.buildCityAltars();

    // 9. 21 地级市高精度矢量行政界线
    this.buildContourLines();

    // 默认开启【全景地势】模式
    this.setLayerMode('topography');
  }

  /**
   * 1. 皇家御制紫檀金丝须弥座承盘 (Imperial Zitan & Gilt-Edged Base Pedestal)
   * 彻底根治旧版“实体板盖住南海水体、底座一半有一半没有”的严重缺陷：
   * - 打造中正规整的四方紫檀须弥托盘：四边围框、束腰台基、铜鎏金云纹包角、深沉避光承水凹槽底盘；
   * - 绝不使用切断水体模型的实心顶板，底盘承水底面沉于 y = -0.028，确保浩瀚南海碧波与内陆山脉完整显现！
   */
  private buildImperialPedestal() {
    this.plinthGroup = new THREE.Group();
    this.plinthGroup.name = 'ImperialPlinth';

    const innerW = this.geoBounds.width;  // 3.8
    const innerD = this.geoBounds.depth;  // 2.8
    const rimT = 0.08;                   // 四边框体厚度
    const outerW = innerW + rimT * 2;     // 3.96
    const outerD = innerD + rimT * 2;     // 2.96

    // 材料定义：古法紫檀木与皇家泥金
    const zitanWoodMat = new THREE.MeshStandardMaterial({
      color: 0x1A0906, // 深沉温润沉香紫檀
      roughness: 0.55,
      metalness: 0.12
    });

    const waistWoodMat = new THREE.MeshStandardMaterial({
      color: 0x100503, // 须弥座深暗束腰
      roughness: 0.65,
      metalness: 0.15
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37, // 皇家镏金金丝
      roughness: 0.28,
      metalness: 0.85
    });

    // 1. 须弥座三级台基 (从下至上：圭脚底台、凹进束腰、上枋托台)
    // 刚性空间约束：须弥托盘上枋顶面必须止步于 y = -0.027 以下，绝不允许侵入承水凹槽 (y >= -0.024) 遮盖南海碧波！
    // 1.1 圭脚底座 (Base Plinth)
    const baseH = 0.032;
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(outerW * 1.035, baseH, outerD * 1.035),
      zitanWoodMat
    );
    baseMesh.position.y = -0.083;
    this.plinthGroup.add(baseMesh);

    // 1.2 须弥座束腰 (Waist)
    const waistH = 0.022;
    const waistMesh = new THREE.Mesh(
      new THREE.BoxGeometry(outerW * 0.975, waistH, outerD * 0.975),
      waistWoodMat
    );
    waistMesh.position.y = -0.056;
    this.plinthGroup.add(waistMesh);

    // 1.3 上枋台面 (Upper Terrace)
    const terraceH = 0.018;
    const terraceMesh = new THREE.Mesh(
      new THREE.BoxGeometry(outerW * 1.015, terraceH, outerD * 1.015),
      zitanWoodMat
    );
    terraceMesh.position.y = -0.036; // 顶面位于 -0.036 + 0.009 = -0.027，牢固托住四围边框，永不穿透水体！
    this.plinthGroup.add(terraceMesh);

    // 2. 托盘四围立道外框 (Four Perimeter Rim Bars) - 彻底替代旧版实心压扁顶板！
    const rimH = 0.044;
    const rimY = -0.005; // 上表面达到 +0.017，下表面至 -0.027，牢牢包裹沙盘边界并与上枋台面无缝咬合

    // 北立框 (North Rim)
    const northRim = new THREE.Mesh(
      new THREE.BoxGeometry(outerW, rimH, rimT),
      zitanWoodMat
    );
    northRim.position.set(0, rimY, -innerD / 2 - rimT / 2);
    this.plinthGroup.add(northRim);

    // 南立框 (South Rim)
    const southRim = new THREE.Mesh(
      new THREE.BoxGeometry(outerW, rimH, rimT),
      zitanWoodMat
    );
    southRim.position.set(0, rimY, innerD / 2 + rimT / 2);
    this.plinthGroup.add(southRim);

    // 西立框 (West Rim)
    const westRim = new THREE.Mesh(
      new THREE.BoxGeometry(rimT, rimH, innerD),
      zitanWoodMat
    );
    westRim.position.set(-innerW / 2 - rimT / 2, rimY, 0);
    this.plinthGroup.add(westRim);

    // 东立框 (East Rim)
    const eastRim = new THREE.Mesh(
      new THREE.BoxGeometry(rimT, rimH, innerD),
      zitanWoodMat
    );
    eastRim.position.set(innerW / 2 + rimT / 2, rimY, 0);
    this.plinthGroup.add(eastRim);

    // 3. 四边框顶面金线镶嵌 (Gilt Inlay Strips on Rim Tops)
    const goldStripT = 0.016;
    const goldStripH = 0.003;
    const goldStripY = rimY + rimH / 2 + goldStripH / 2;

    const northGold = new THREE.Mesh(new THREE.BoxGeometry(outerW, goldStripH, goldStripT), goldTrimMat);
    northGold.position.set(0, goldStripY, -innerD / 2 - rimT / 2);
    this.plinthGroup.add(northGold);

    const southGold = new THREE.Mesh(new THREE.BoxGeometry(outerW, goldStripH, goldStripT), goldTrimMat);
    southGold.position.set(0, goldStripY, innerD / 2 + rimT / 2);
    this.plinthGroup.add(southGold);

    const westGold = new THREE.Mesh(new THREE.BoxGeometry(goldStripT, goldStripH, innerD), goldTrimMat);
    westGold.position.set(-innerW / 2 - rimT / 2, goldStripY, 0);
    this.plinthGroup.add(westGold);

    const eastGold = new THREE.Mesh(new THREE.BoxGeometry(goldStripT, goldStripH, innerD), goldTrimMat);
    eastGold.position.set(innerW / 2 + rimT / 2, goldStripY, 0);
    this.plinthGroup.add(eastGold);

    // 4. 承水凹槽底盘 (Recessed Basin Floor) - 置于 y = -0.028，彻底避免与海水/大陆架发生穿模碰撞
    const basinGeom = new THREE.PlaneGeometry(innerW, innerD);
    basinGeom.rotateX(-Math.PI / 2);
    const basinMat = new THREE.MeshStandardMaterial({
      color: 0x0C2C4A, // 深邃沧溟玄蓝底色 (杜绝任何死黑破绽)
      roughness: 0.92,
      metalness: 0.05
    });
    const basinMesh = new THREE.Mesh(basinGeom, basinMat);
    basinMesh.position.y = -0.028;
    this.plinthGroup.add(basinMesh);

    // 5. 须弥座正南面立框中央：御制紫檀雕金坤舆铭牌 (Imperial Cartouche Plaque)
    const plaqueW = 0.54;
    const plaqueH = 0.034;
    const plaqueD = 0.003;
    const plaqueCanvas = createDioramaBadgeCanvas(540, 96);
    if (plaqueCanvas) {
      const pCtx = plaqueCanvas.getContext('2d')!;
      pCtx.fillStyle = '#1A0604';
      pCtx.fillRect(0, 0, 540, 96);

      // 双重泥金云纹边框
      pCtx.strokeStyle = '#D4AF37';
      pCtx.lineWidth = 3;
      pCtx.strokeRect(6, 6, 528, 84);
      pCtx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      pCtx.lineWidth = 1.5;
      pCtx.strokeRect(12, 12, 516, 72);

      // 中正金石铭文
      pCtx.fillStyle = '#FFE082';
      pCtx.font = 'bold 36px "Noto Serif SC", "STKaiti", "KaiTi", serif';
      pCtx.textAlign = 'center';
      pCtx.textBaseline = 'middle';
      pCtx.fillText('萬 象 山 海 · 粵 境 坤 輿', 270, 48);

      // 左右朱砂小方印
      pCtx.fillStyle = '#A82418';
      pCtx.fillRect(22, 24, 48, 48);
      pCtx.fillStyle = '#FFFFFF';
      pCtx.font = 'bold 16px "Noto Serif SC", serif';
      pCtx.fillText('廣東', 46, 42);
      pCtx.fillText('通志', 46, 58);

      pCtx.fillStyle = '#A82418';
      pCtx.fillRect(470, 24, 48, 48);
      pCtx.fillStyle = '#FFFFFF';
      pCtx.font = 'bold 16px "Noto Serif SC", serif';
      pCtx.fillText('乾隆', 494, 42);
      pCtx.fillText('御覽', 494, 58);
    }
    const plaqueTex = createDioramaBadgeTexture(plaqueCanvas);
    const plaqueGeom = new THREE.BoxGeometry(plaqueW, plaqueH, plaqueD);
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      roughness: 0.35,
      metalness: 0.45
    });
    const plaqueMesh = new THREE.Mesh(plaqueGeom, plaqueMat);
    plaqueMesh.position.set(0, rimY, innerD / 2 + rimT + plaqueD / 2);
    this.plinthGroup.add(plaqueMesh);

    this.group.add(this.plinthGroup);
  }

  /**
   * 1.5. 皇家铜鎏金二十四山八卦水海图罗盘仪轨 (Imperial Gilt-Bronze Feng Shui Compass Rose)
   */
  private buildImperialCompassRose() {
    this.compassRoseGroup = new THREE.Group();
    this.compassRoseGroup.name = 'ImperialCompassRose';
    // 居于浩瀚南海东南开阔深海大洋水域 (lat ~ 21.0, lng ~ 116.2)，不侵占任何海岛，与沧溟水面平整嵌合
    this.compassRoseGroup.position.set(1.28, -0.012, 0.96);

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x8C6B38,
      roughness: 0.32,
      metalness: 0.82
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.22,
      metalness: 0.90,
      emissive: 0x423208,
      emissiveIntensity: 0.25
    });

    // 1. 铜鎏金八角须弥托底台
    const baseOct = new THREE.Mesh(
      new THREE.CylinderGeometry(0.142, 0.150, 0.003, 8),
      bronzeMat
    );
    this.compassRoseGroup.add(baseOct);

    // 2. 泥金八卦同心圆环
    const outerGoldRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.138, 0.0022, 8, 36),
      goldMat
    );
    outerGoldRing.rotateX(Math.PI / 2);
    outerGoldRing.position.y = 0.002;
    this.compassRoseGroup.add(outerGoldRing);

    // 3. 二十四山与八卦罗盘面 (Canvas 高精纹理)
    const dialTex = createCompassDialTexture();
    const dialPlane = new THREE.Mesh(
      new THREE.CircleGeometry(0.132, 48),
      new THREE.MeshBasicMaterial({
        map: dialTex,
        transparent: true,
        side: THREE.DoubleSide
      })
    );
    dialPlane.rotateX(-Math.PI / 2);
    dialPlane.position.y = 0.0025;
    this.compassRoseGroup.add(dialPlane);

    // 4. 八方星芒角 (Four Cardinals + Four Corners)
    const starGroup = new THREE.Group();
    starGroup.position.y = 0.0035;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const isCardinal = (i % 2 === 0);
      const bladeLen = isCardinal ? 0.075 : 0.052;
      const bladeW = isCardinal ? 0.014 : 0.009;

      const bladeGeom = new THREE.ConeGeometry(bladeW, bladeLen, 4);
      bladeGeom.rotateX(Math.PI / 2);
      bladeGeom.rotateY(angle);

      const bladeMesh = new THREE.Mesh(bladeGeom, isCardinal ? goldMat : bronzeMat);
      bladeMesh.position.set(Math.sin(angle) * (bladeLen * 0.45), 0, -Math.cos(angle) * (bladeLen * 0.45));
      starGroup.add(bladeMesh);
    }
    this.compassRoseGroup.add(starGroup);

    // 5. 磁针 (Pointing North towards -z)
    const needleGroup = new THREE.Group();
    needleGroup.name = 'CompassNeedle';
    needleGroup.position.y = 0.006;

    // 北半针 (朱砂赤指北尖)
    const northGeom = new THREE.ConeGeometry(0.008, 0.078, 4);
    northGeom.rotateX(-Math.PI / 2);
    const northMat = new THREE.MeshStandardMaterial({
      color: 0xC42416,
      emissive: 0x821508,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.65
    });
    const northNeedle = new THREE.Mesh(northGeom, northMat);
    northNeedle.position.z = -0.038;
    needleGroup.add(northNeedle);

    // 南半针 (泥金指南尾)
    const southGeom = new THREE.ConeGeometry(0.008, 0.062, 4);
    southGeom.rotateX(Math.PI / 2);
    const southNeedle = new THREE.Mesh(southGeom, goldMat);
    southNeedle.position.z = 0.030;
    needleGroup.add(southNeedle);

    // 磁针中心红宝石盖帽 (Ruby Finial)
    const gemMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.0065, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0x8A1212,
        emissive: 0x5C0B0B,
        emissiveIntensity: 0.85,
        roughness: 0.15,
        metalness: 0.90
      })
    );
    gemMesh.position.y = 0.003;
    needleGroup.add(gemMesh);

    this.compassRoseGroup.add(needleGroup);
    this.group.add(this.compassRoseGroup);
  }

  /**
   * 2. 建造【中国标准分层设色地形图与瑞士山体阴影渲染】
   */
  private buildShanshuiTerrain() {
    const segX = 360;
    const segZ = 270;
    const gridGeom = new THREE.PlaneGeometry(
      this.geoBounds.width,
      this.geoBounds.depth,
      segX,
      segZ
    );
    gridGeom.rotateX(-Math.PI / 2);

    const pos = gridGeom.attributes.position as THREE.BufferAttribute;
    const count = pos.count;

    const attrGeoLngLat = new Float32Array(count * 2);
    const attrWaterFactor = new Float32Array(count);
    const attrInGuangdong = new Float32Array(count);
    const attrBathymetryDepth = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      const normX = (x / this.geoBounds.width) + 0.5;
      const normZ = 0.5 - (z / this.geoBounds.depth);
      const lng = this.geoBounds.minLng + normX * (this.geoBounds.maxLng - this.geoBounds.minLng);
      const lat = this.geoBounds.minLat + normZ * (this.geoBounds.maxLat - this.geoBounds.minLat);

      attrGeoLngLat[i * 2] = lng;
      attrGeoLngLat[i * 2 + 1] = lat;

      const inTerritory = this.isPointInTerritory(lat, lng);
      const height = this.getTerrainHeight(lat, lng, inTerritory);
      pos.setY(i, height);

      attrInGuangdong[i] = inTerritory ? 1.0 : 0.0;

      const { waterFactor } = getRiverInfluence(lat, lng);
      attrWaterFactor[i] = waterFactor;

      // 计算真实南海多阶水深梯度 (用于水体 Shader 高对比活态色彩映射)
      let bDepth = 0.0;
      if (height < 0.0) {
        const coast = getCoastlineLat(lng);
        const distDeg = Math.max(0.0, coast - lat);
        const distDongsha = Math.hypot(lng - 116.72, lat - 20.70);
        const isQiongzhou = lat >= 20.0 && lat <= 20.35 && lng >= 109.8 && lng <= 110.6;
        const isBeibuGulf = lng < 109.70 && lat < 21.65;

        if (distDongsha < 0.09) {
          bDepth = 0.08 + (distDongsha / 0.09) * 0.08; // 东沙环礁与潟湖浅碧 (0.08~0.16)
        } else if (distDongsha < 0.28) {
          const tSlope = (distDongsha - 0.09) / 0.19;
          bDepth = 0.16 + Math.pow(tSlope, 1.2) * 0.45;
        } else if (isQiongzhou) {
          bDepth = 0.18 + Math.min(0.15, distDeg * 0.2);
        } else if (isBeibuGulf) {
          const bgDist = Math.max(0.0, Math.min(1.0, (21.65 - lat) / 1.5));
          bDepth = 0.14 + bgDist * 0.22;
        } else {
          // 南海北部陆架—坡折—陆坡—海盆大尺度全域梯度映射 (覆盖全部 2.8° 纬度海面，永不提早饱和死色)
          if (distDeg <= 0.25) {
            bDepth = (distDeg / 0.25) * 0.20; // 0.0 ~ 0.20 (近岸浅海翠碧)
          } else if (distDeg <= 0.85) {
            bDepth = 0.20 + ((distDeg - 0.25) / 0.60) * 0.22; // 0.20 ~ 0.42 (内陆架澄碧蓝)
          } else if (distDeg <= 1.80) {
            bDepth = 0.42 + ((distDeg - 0.85) / 0.95) * 0.28; // 0.42 ~ 0.70 (外陆架与陆坡折深蓝)
          } else {
            const tDeep = Math.min(1.0, (distDeg - 1.80) / 1.10);
            bDepth = 0.70 + Math.pow(tDeep, 0.9) * 0.30; // 0.70 ~ 1.0 (南海大洋盆底玄深极蓝)
          }
        }
      }
      attrBathymetryDepth[i] = bDepth;

      // 柔和坡降收边：沙盘外缘向紫檀边框微曲过渡 (陆地保持陆地地势，海洋保持大洋水深)
      const edgeDist = Math.min(normX, 1.0 - normX, normZ, 1.0 - normZ);
      if (edgeDist < 0.035) {
        const taper = Math.sin((edgeDist / 0.035) * (Math.PI * 0.5));
        const currentY = pos.getY(i);
        // 陆地地势在边框处自然咬合于 y >= 0.024 (饱满原野翠绿)，绝不塌陷为海滩浅黄或跌破海平面
        const targetEdgeY = currentY < 0.0 ? -0.018 : Math.max(0.024, currentY * 0.82);
        pos.setY(i, currentY * taper + targetEdgeY * (1.0 - taper));
      }
    }

    gridGeom.computeVertexNormals();
    gridGeom.computeBoundingBox();
    gridGeom.computeBoundingSphere();

    gridGeom.setAttribute('aGeoLngLat', new THREE.BufferAttribute(attrGeoLngLat, 2));
    gridGeom.setAttribute('aWaterFactor', new THREE.BufferAttribute(attrWaterFactor, 1));
    gridGeom.setAttribute('aInGuangdong', new THREE.BufferAttribute(attrInGuangdong, 1));
    gridGeom.setAttribute('aBathymetryDepth', new THREE.BufferAttribute(attrBathymetryDepth, 1));

    this.terrainMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSunDir: { value: new THREE.Vector3(-0.62, 0.80, -0.52).normalize() },
        uSunColor: { value: new THREE.Color(0xFFF9EC) },
        uFillDir: { value: new THREE.Vector3(0.60, 0.35, 0.65).normalize() },
        uFillColor: { value: new THREE.Color(0x18384E) },
        uSkyColor: { value: new THREE.Color(0x426C5E) },
        uProbeCoord: { value: new THREE.Vector2(-999, -999) },
        uProbeRadius: { value: 0.08 },
        
        // 中国地图出版社国家标准 9 段分层设色
        uSeaNavy: { value: new THREE.Color(0x0E4870) }, // 沧溟深蓝 (保证基础明度与宝蓝饱和度)
        uCoastGold: { value: new THREE.Color(0xDFCE9C) },
        uPlain1: { value: new THREE.Color(0x5A8B6F) }, // 温润松石青 (绝非荧光死绿)
        uPlain2: { value: new THREE.Color(0x6E9C76) }, // 苍碧粉青
        uHill: { value: new THREE.Color(0x9EAC62) },   // 秋葵温润黄绿
        uLowMtn: { value: new THREE.Color(0xD4AF46) }, // 宣和古朴暖金
        uMidMtn: { value: new THREE.Color(0xC0883E) }, // 赭石暖褐
        uHighMtn: { value: new THREE.Color(0x9E5424) }, // 高山赤褐
        uSummit: { value: new THREE.Color(0x783214) },  // 极巅深赭
        uPeakGold: { value: new THREE.Color(0xDFBC62) }, // 南岭金顶泥金
        
        uCliffOchre: { value: new THREE.Color(0x5A2410) },
        uRiverWater: { value: new THREE.Color(0x149884) },
        uNeighborLand: { value: new THREE.Color(0x3B543D) } // 华夏邻省山川青峦国色
      },
      vertexShader: `
        attribute vec2 aGeoLngLat;
        attribute float aWaterFactor;
        attribute float aInGuangdong;
        attribute float aBathymetryDepth;

        varying vec2 vGeoLngLat;
        varying float vWaterFactor;
        varying float vInGuangdong;
        varying float vBathymetryDepth;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vElevation;

        void main() {
          vGeoLngLat = aGeoLngLat;
          vWaterFactor = aWaterFactor;
          vInGuangdong = aInGuangdong;
          vBathymetryDepth = aBathymetryDepth;
          vElevation = position.y;

          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform vec3 uFillDir;
        uniform vec3 uFillColor;
        uniform vec3 uSkyColor;
        uniform vec2 uProbeCoord;
        uniform float uProbeRadius;

        uniform vec3 uSeaNavy;
        uniform vec3 uCoastGold;
        uniform vec3 uPlain1;
        uniform vec3 uPlain2;
        uniform vec3 uHill;
        uniform vec3 uLowMtn;
        uniform vec3 uMidMtn;
        uniform vec3 uHighMtn;
        uniform vec3 uSummit;
        uniform vec3 uPeakGold;

        uniform vec3 uCliffOchre;
        uniform vec3 uRiverWater;
        uniform vec3 uNeighborLand;

        varying vec2 vGeoLngLat;
        varying float vWaterFactor;
        varying float vInGuangdong;
        varying float vBathymetryDepth;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying float vElevation;

        vec3 getStandardHypsometricColor(float h) {
          if (h < 0.005) {
            return uSeaNavy;
          } else if (h < 0.012) {
            float t = smoothstep(0.005, 0.012, h);
            return mix(uSeaNavy, uCoastGold, t);
          } else if (h < 0.016) {
            float t = smoothstep(0.012, 0.016, h);
            return mix(uCoastGold, uPlain1, t);
          } else if (h < 0.040) {
            float t = smoothstep(0.016, 0.040, h);
            return mix(uPlain1, uPlain2, t);
          } else if (h < 0.075) {
            float t = smoothstep(0.040, 0.075, h);
            return mix(uPlain2, uHill, t);
          } else if (h < 0.120) {
            float t = smoothstep(0.075, 0.120, h);
            return mix(uHill, uLowMtn, t);
          } else if (h < 0.165) {
            float t = smoothstep(0.120, 0.165, h);
            return mix(uLowMtn, uMidMtn, t);
          } else if (h < 0.198) {
            float t = smoothstep(0.165, 0.198, h);
            return mix(uMidMtn, uHighMtn, t);
          } else if (h < 0.210) {
            float t = smoothstep(0.198, 0.210, h);
            return mix(uHighMtn, uSummit, t);
          } else {
            float t = clamp((h - 0.210) / 0.010, 0.0, 1.0);
            return mix(uSummit, uPeakGold, t);
          }
        }

        // 华夏内陆相连板块纯粹大陆设色 (桂、湘、赣、闽内陆丘陵山原，绝对杜绝海滩黄边 uCoastGold)
        vec3 getContinentalHypsometricColor(float h) {
          if (h < 0.040) {
            float t = smoothstep(0.010, 0.040, h);
            return mix(uPlain1, uPlain2, t);
          } else if (h < 0.075) {
            float t = smoothstep(0.040, 0.075, h);
            return mix(uPlain2, uHill, t);
          } else if (h < 0.120) {
            float t = smoothstep(0.075, 0.120, h);
            return mix(uHill, uLowMtn, t);
          } else if (h < 0.165) {
            float t = smoothstep(0.120, 0.165, h);
            return mix(uLowMtn, uMidMtn, t);
          } else if (h < 0.198) {
            float t = smoothstep(0.165, 0.198, h);
            return mix(uMidMtn, uHighMtn, t);
          } else {
            float t = clamp((h - 0.198) / 0.020, 0.0, 1.0);
            return mix(uHighMtn, uSummit, t);
          }
        }

        void main() {
          float h = vElevation;

          if (h < 0.0) {
            // ==================== 浩瀚南海活态多阶水体色彩 (真实陆海阶梯深浅有别) ====================
            float bDepth = clamp(vBathymetryDepth, 0.0, 1.0);

            // 依据《中国传统色》活态文化水体四级阶地色彩谱系：
            // ① 浅湾潟湖 / 天水碧 (Tian Shui Bi / Turquoise Emerald): 岸滩浅湾与东沙环礁碧玉色
            vec3 tianShuiBi = vec3(0.06, 0.66, 0.62);
            // ② 内大陆架 / 沧浪碧 (Cang Lang / Vivid Azure Cerulean): 近海陆架澄碧蔚蓝
            vec3 cangLang    = vec3(0.03, 0.42, 0.74);
            // ③ 陆坡折带 / 绀宇蓝 (Gan Yu / Royal Cobalt Indigo): 200m等深线向陆坡过渡
            vec3 ganYu       = vec3(0.015, 0.18, 0.52);
            // ④ 浩瀚深渊 / 沧溟玄蓝 (Cang Ming / Deep Midnight Navy): 千仞大洋深渊
            vec3 cangMing    = vec3(0.006, 0.05, 0.20);

            vec3 waterColor;
            if (bDepth < 0.22) {
              waterColor = mix(tianShuiBi, cangLang, bDepth / 0.22);
            } else if (bDepth < 0.52) {
              waterColor = mix(cangLang, ganYu, (bDepth - 0.22) / 0.30);
            } else {
              waterColor = mix(ganYu, cangMing, (bDepth - 0.52) / 0.48);
            }

            // 金沙浅滩过渡：海岸 0m 临界带显现温润金沙与浅水反光
            float coastSand = smoothstep(-0.0035, 0.000, h);
            vec3 sandGold = vec3(0.86, 0.74, 0.50);
            waterColor = mix(waterColor, sandGold, coastSand * 0.45);

            // 活态双频水纹与阳光波光 (深海衰减，浅海粼粼)
            float swell = sin(vGeoLngLat.x * 42.0 + vGeoLngLat.y * 32.0 + uTime * 1.0) * 0.5 + 0.5;
            float ripples = sin(vGeoLngLat.x * 110.0 - vGeoLngLat.y * 85.0 + uTime * 2.0) * 0.5 + 0.5;
            float causticsMask = 1.0 - bDepth * 0.75;
            float caustics = pow(swell * 0.55 + ripples * 0.45, 2.5) * 0.09 * causticsMask;
            waterColor += vec3(caustics * 0.35, caustics * 0.75, caustics * 1.0);

            // 活态近岸浪花与潮汐碎浪 (Shoreline Foam Edge)
            float coastProximity = smoothstep(-0.0035, 0.000, h);
            if (coastProximity > 0.018) {
              float foamW1 = sin(vGeoLngLat.x * 210.0 + vGeoLngLat.y * 180.0 + uTime * 3.2);
              float foamW2 = cos(vGeoLngLat.x * 95.0 - vGeoLngLat.y * 125.0 - uTime * 2.1);
              float foamNoise = clamp(foamW1 * 0.56 + foamW2 * 0.44, 0.0, 1.0);
              float foamMask = pow(foamNoise, 2.5) * coastProximity;
              vec3 foamColor = vec3(0.96, 0.98, 1.0);
              waterColor = mix(waterColor, foamColor, foamMask * 0.70);
            }

            // 真实水体菲涅尔天光倒影 (Fresnel Sky Reflection)
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float NdotV = clamp(dot(vNormal, viewDir), 0.0, 1.0);
            float fresnel = pow(1.0 - NdotV, 3.2);
            vec3 skyReflect = vec3(0.15, 0.38, 0.60);
            waterColor = mix(waterColor, skyReflect, fresnel * 0.28);

            // 太阳镜面 Blinn-Phong 璀璨水光 (Specular Sunlight Highlight)
            vec3 halfVec = normalize(uSunDir + viewDir);
            float spec = pow(max(dot(vNormal, halfVec), 0.0), 36.0) * 0.55;

            // 避免大洋底光被死死冲淡：浅海引入微量天光，深海保持湛蓝纯粹
            vec3 ambientSea = uSkyColor * (0.04 + (1.0 - bDepth) * 0.06) + vec3(0.010, 0.025, 0.045);

            vec3 finalWater = waterColor + ambientSea + uSunColor * spec;
            gl_FragColor = vec4(finalWater, 1.0);
            return;
          }

          vec3 baseColor;
          // 高保真三维微地形岩理法线微扰 (Micro-Relief Rock & Crag Perturbation)
          // 增加坡度遮罩：平原/缓坡保持平整无波纹，绝壁陡坡才显现岩骨与沉积节理
          float slope = 1.0 - vNormal.y;
          float rockFactor = smoothstep(0.06, 0.28, slope);
          float rock1 = sin(vWorldPosition.x * 68.0 + vWorldPosition.z * 60.0);
          float rock2 = sin(vWorldPosition.x * 155.0 - vWorldPosition.z * 135.0);
          float rock3 = sin(vWorldPosition.x * 310.0 + vWorldPosition.z * 270.0);
          float rockNoise = (rock1 * 0.50 + rock2 * 0.32 + rock3 * 0.18) * 0.080 * rockFactor;

          // 陡峭山崖水平沉积岩节理与垂直解理构造 (Granite Exfoliation & Jointing Strata)
          float cliffStrata = sin(vElevation * 420.0) * 0.12;
          float verticalJoint = sin((vWorldPosition.x + vWorldPosition.z) * 190.0) * 0.08;
          vec3 rockNormal = normalize(vNormal + vec3(rockNoise + verticalJoint * smoothstep(0.14, 0.52, slope), cliffStrata * smoothstep(0.12, 0.50, slope), rockNoise));

          // 1. 基础色彩：严格遵循国家标准分层设色，境内外平滑自然衔接 (消除省界硬色差)
          vec3 stdColor = getStandardHypsometricColor(h);
          vec3 contColor = getContinentalHypsometricColor(h);
          // 邻省远景微润暮山青黛 (青绿同源，温润和谐)
          vec3 neighborHills = mix(vec3(0.30, 0.46, 0.32), vec3(0.42, 0.44, 0.30), smoothstep(0.040, 0.160, h));
          vec3 outsideColor = mix(neighborHills, contColor, 0.60);
          
          float territoryBlend = smoothstep(0.25, 0.75, vInGuangdong);
          baseColor = mix(outsideColor, stdColor, territoryBlend);

          // 2. 真实南岭与华南植被：海拔 1000m~1902m 广袤的高山草甸与常绿林海覆盖 (Alpine Meadow)
          // 彻底终结死白死灰！草甸在平缓至中等坡度（slope < 0.52）均大面积覆盖
          vec3 alpineMeadowGreen = vec3(0.35, 0.54, 0.38); // 松石青翠草甸
          vec3 alpineMeadowGold  = vec3(0.58, 0.64, 0.36); // 阳坡暖金草甸
          vec3 summitSunMeadow   = vec3(0.72, 0.68, 0.38); // 极巅受光金色草甸
          
          float meadowGrad = smoothstep(0.06, 0.22, h);
          vec3 meadowCol = mix(alpineMeadowGreen, alpineMeadowGold, meadowGrad);
          meadowCol = mix(meadowCol, summitSunMeadow, smoothstep(0.18, 0.23, h) * 0.60);

          float meadowMask = (1.0 - smoothstep(0.28, 0.54, slope)) * smoothstep(0.040, 0.120, h);
          baseColor = mix(baseColor, meadowCol, meadowMask * 0.68);

          // 3. 悬崖峭壁花岗岩露石：仅在真正陡峭断崖（slope > 0.42，即 25°~45° 以上峭壁）处显露苍黛岩骨
          if (slope > 0.40 && h > 0.035) {
            float cliffFactor = smoothstep(0.40, 0.75, slope);
            vec3 graniteRock = vec3(0.44, 0.42, 0.38); // 温润苍黛风化花岗岩
            vec3 deepFissure = vec3(0.26, 0.25, 0.23); // 节理深隙
            vec3 exposedRock = mix(graniteRock, deepFissure, smoothstep(0.55, 0.85, slope));
            float highMtnBoost = smoothstep(0.080, 0.180, h) * 0.20;
            baseColor = mix(baseColor, exposedRock, clamp(cliffFactor * (0.60 + highMtnBoost), 0.0, 0.75));
          }

          // 4. 泥金山脊微光与宣纸肌理
          float ridgeGlint = pow(max(0.0, slope), 1.4) * smoothstep(0.080, 0.22, h);
          vec3 goldLeafColor = vec3(0.92, 0.80, 0.46);
          baseColor = mix(baseColor, goldLeafColor, ridgeGlint * 0.25);

          float paperGrain = (fract(sin(dot(vGeoLngLat * 250.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.025;
          baseColor += vec3(paperGrain);

          // 峰峦极巅金石高光与朝夕金顶 (Peak Rim Alpenglow，柔和自然漫散)
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 halfVector = normalize(uSunDir + viewDir);
          float rimSpec = pow(max(dot(rockNormal, halfVector), 0.0), 12.0);
          float alpenglow = rimSpec * smoothstep(0.090, 0.22, h);
          vec3 alpenglowColor = vec3(1.0, 0.88, 0.55);
          baseColor += alpenglowColor * (alpenglow * 0.28);

          // 探针微光金环 (Hover Probe Contour Ring Glow)
          if (uProbeCoord.x > -900.0) {
            float distToProbe = length(vWorldPosition.xz - uProbeCoord);
            if (distToProbe < uProbeRadius) {
              float ringWave = sin((distToProbe / uProbeRadius) * 3.14159);
              vec3 probeGlow = vec3(0.98, 0.86, 0.36);
              baseColor = mix(baseColor, probeGlow, ringWave * 0.45);
            }
          }

          // 瑞士立体山影晕渲法 + 半球天光漫反射 (Hemispheric Sky Lighting，彻底根除背面阴坡死黑死灰)
          float cavityAO = clamp(smoothstep(0.010, 0.14, h) * 0.58 + rockNormal.y * 0.42, 0.50, 1.0);

          float NdotL_sun = max(0.0, dot(rockNormal, uSunDir));
          float sunSculpt = pow(NdotL_sun, 1.15) * 1.05;

          float shadowMask = 1.0 - NdotL_sun;
          float NdotL_fill = max(0.0, dot(rockNormal, uFillDir));
          vec3 shadowTint = uFillColor * (NdotL_fill * 0.40 + shadowMask * 0.30);

          // 半球天顶环境光 (即使在背面背光坡，也具有清新通透的漫反射微光，正面背面浑然天成)
          float hemiSky = clamp(rockNormal.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 ambient = (vec3(0.25, 0.28, 0.29) + uSkyColor * (hemiSky * 0.32)) * cavityAO;

          vec3 light = ambient + uSunColor * sunSculpt + shadowTint;

          vec3 finalColor = baseColor * light;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });

    this.terrainMesh = new THREE.Mesh(gridGeom, this.terrainMaterial);
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);
  }

  /**
   * 2.5. 建造【南岭千峦浮云海与灵动山川云岚层】(Atmospheric Mountain Cloud Sea Layer)
   */
  private buildMountainCloudSea() {
    this.cloudSeaGroup = new THREE.Group();
    this.cloudSeaGroup.name = 'MountainCloudSeaGroup';

    this.cloudMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCloudColor: { value: new THREE.Color(DIORAMA_TIME_PRESETS[this.currentTimeMode].cloudColor) },
        uSunDir: { value: new THREE.Vector3(...DIORAMA_TIME_PRESETS[this.currentTimeMode].sunDir).normalize() },
        uSunColor: { value: new THREE.Color(DIORAMA_TIME_PRESETS[this.currentTimeMode].sunColor) },
        uSkyColor: { value: new THREE.Color(DIORAMA_TIME_PRESETS[this.currentTimeMode].skyColor) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        uniform float uTime;

        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.z += sin(pos.x * 12.0 + uTime * 0.35) * 0.004;
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCloudColor;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform vec3 uSkyColor;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          float dist = length(vUv - 0.5) * 2.0;
          if (dist > 1.0) discard;
          float edgeMask = smoothstep(1.0, 0.20, dist);

          vec2 p = (vUv - 0.5) * 5.0;
          float w1 = sin(p.x * 2.8 + p.y * 1.9 + uTime * 0.40);
          float w2 = cos(p.x * 4.6 - p.y * 3.2 - uTime * 0.30);
          float w3 = sin(p.x * 8.2 + p.y * 6.5 + uTime * 0.18);
          float cloudNoise = (w1 * 0.52 + w2 * 0.32 + w3 * 0.16) * 0.5 + 0.5;

          float density = pow(cloudNoise, 1.7) * edgeMask;
          if (density < 0.03) discard;

          vec3 lightDir = normalize(uSunDir);
          float sunDot = max(0.0, dot(vec3(0.0, 1.0, 0.0), lightDir)) * 0.5 + 0.5;
          vec3 lit = mix(uCloudColor, uSunColor, sunDot * 0.35);
          vec3 shadow = mix(uSkyColor * 0.6, uCloudColor * 0.7, 0.5);
          vec3 col = mix(shadow, lit, cloudNoise);

          float alpha = clamp(density * 0.62, 0.0, 0.72);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const CLOUD_CENTERS: { lat: number; lng: number; radius: number; altitudeY: number }[] = [
      { lat: 24.85, lng: 113.40, radius: 0.28, altitudeY: 0.072 },
      { lat: 24.50, lng: 112.50, radius: 0.24, altitudeY: 0.062 },
      { lat: 24.20, lng: 115.80, radius: 0.25, altitudeY: 0.066 },
      { lat: 23.65, lng: 114.20, radius: 0.22, altitudeY: 0.060 },
      { lat: 23.85, lng: 116.40, radius: 0.20, altitudeY: 0.058 },
      { lat: 23.35, lng: 112.30, radius: 0.21, altitudeY: 0.056 },
      { lat: 22.35, lng: 111.25, radius: 0.22, altitudeY: 0.064 }
    ];

    CLOUD_CENTERS.forEach((c, idx) => {
      const { x, z } = this.geoToLocal(c.lat, c.lng);
      const geom = new THREE.PlaneGeometry(c.radius * 2, c.radius * 2, 16, 16);
      geom.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geom, this.cloudMaterial);
      mesh.position.set(x, c.altitudeY, z);
      mesh.rotation.y = idx * 0.8;
      this.cloudSeaGroup.add(mesh);
    });

    this.group.add(this.cloudSeaGroup);
  }

  /**
   * 3. 建造【三维微缩沙盘实时高程探针微光金环】
   */
  private buildProbeReticle() {
    this.probeReticleGroup = new THREE.Group();
    this.probeReticleGroup.name = 'DioramaProbeReticle';
    this.probeReticleGroup.visible = false;

    // 外圈细金丝环
    const outerRingGeom = new THREE.RingGeometry(0.040, 0.046, 36);
    outerRingGeom.rotateX(-Math.PI / 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xE5C158,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    });
    const outerRing = new THREE.Mesh(outerRingGeom, outerMat);
    this.probeReticleGroup.add(outerRing);

    // 内圈翡翠微光环
    const innerRingGeom = new THREE.RingGeometry(0.018, 0.022, 28);
    innerRingGeom.rotateX(-Math.PI / 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x48D1CC,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    });
    const innerRing = new THREE.Mesh(innerRingGeom, innerMat);
    this.probeReticleGroup.add(innerRing);

    // 中心朱砂瞄准微珠
    const centerGeom = new THREE.SphereGeometry(0.005, 12, 12);
    const centerMat = new THREE.MeshBasicMaterial({ color: 0xC84630 });
    const centerDot = new THREE.Mesh(centerGeom, centerMat);
    centerDot.position.y = 0.003;
    this.probeReticleGroup.add(centerDot);

    this.group.add(this.probeReticleGroup);
  }

  /**
   * 4. 建造【广东省界高精泥金边界线】(1:1 同步神州板块权威 21 多环矢量边界)
   */
  private buildProvincialBorder() {
    this.provincialBorderGroup = new THREE.Group();
    this.provincialBorderGroup.name = 'GuangdongProvincialBorder';

    const featuresToRender = [
      ...(GUANGDONG_GEO ? [GUANGDONG_GEO] : []),
      ...(HONG_KONG_GEO ? [HONG_KONG_GEO] : []),
      ...(MACAO_GEO ? [MACAO_GEO] : [])
    ];

    const points: THREE.Vector3[] = [];

    for (const feat of featuresToRender) {
      for (const ring of feat.rings) {
        if (ring.length < 3) continue;
        for (let i = 0; i < ring.length - 1; i++) {
          const lng1 = ring[i][0];
          const lat1 = ring[i][1];
          const lng2 = ring[i + 1][0];
          const lat2 = ring[i + 1][1];

          const p1 = this.geoToLocal(lat1, lng1);
          const p2 = this.geoToLocal(lat2, lng2);
          const y1 = this.getTerrainHeight(lat1, lng1, true) + 0.003;
          const y2 = this.getTerrainHeight(lat2, lng2, true) + 0.003;
          points.push(
            new THREE.Vector3(p1.x, y1, p1.z),
            new THREE.Vector3(p2.x, y2, p2.z)
          );
        }
      }
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xF5E08A,
      linewidth: 2,
      transparent: true,
      opacity: 0.90
    });

    const borderLines = new THREE.LineSegments(geom, mat);
    this.provincialBorderGroup.add(borderLines);
    this.group.add(this.provincialBorderGroup);
  }

  /**
   * 中国国家标准 DEM 解析高程场函数 (National Standard Topographic DEM Engine)
   * 彻底推翻旧版“三个孤立土包”错误算法，依据真实广东“七山一水二分田”宏观地貌重构：
   * 1. 粤北横向南岭主脊带（东西贯穿连州-阳山-乳源-曲江-乐昌-仁化-南雄，最高峰石坑崆 1902m 雄奇连绵）；
   * 2. 粤东新华夏系北东走向褶皱带（大埔-丰顺-梅州-揭西-河源-陆河-惠州-深圳-香港大帽山，连绵山丘）；
   * 3. 粤西新华夏系北东走向褶皱带（信宜大田顶 1704m-阳春鹅凰嶂-罗定-新兴天露山-云浮-肇庆鼎湖山-封开）；
   * 4. 覆盖全省 70% 陆地的连续低山丘陵谷地矩阵（绝无惨白死板大平板！）；
   * 5. 精准珠江三角洲网河冲积平原与潮汕韩江三角洲沃野（仅在此核心沉积区低平如镜）；
   * 6. 雷州半岛平缓低丘火山熔岩台地（海拔 25~80m 自然微波入海）。
   */
  public getTerrainHeight(lat: number, lng: number, inTerritory = true): number {
    // 0. 优先检测权威离岸名岛群峰 (南澳岛、海陵岛、川山群岛、万山群岛、横琴岛、东海岛等)
    // 确保若本土/特区山脉高程更高时，以本土真实山系地势为准，避免海岛平滑衰减裙边误裁特区山岳
    const islandMeters = getOffshoreIslandOrogeny(lng, lat);
    const continuousMountains = getContinuousMountainOrogeny(lng, lat);
    if (islandMeters > 0.5 && islandMeters > continuousMountains && !isPointInMacao(lat, lng) && !isPointInHongKong(lat, lng)) {
      const normalizedH = Math.min(1950.0, islandMeters) / 1950.0;
      const elevProfile = Math.pow(normalizedH, 0.92);
      return Math.max(0.005, 0.012 + elevProfile * 0.205);
    }

    // 1. 优先判定真实南部南海海域：大海就是浩瀚深邃大洋，绝不允许在海面上凭空拔起外星孤峰巨山！
    if (!inTerritory && isSouthSeaWater(lat, lng)) {
      const coast = getCoastlineLat(lng);
      // 真实南海大陆架水深梯度：从海岸浅滩 (-0.002) 自然向南海深渊平滑过渡到 (-0.018)
      // 采用 Hermite smoothstep 平滑过渡，彻底消除硬截断造成的死板折痕与突兀台阶
      const rawDist = Math.max(0.0, Math.min(1.0, (coast - lat) / 0.95));
      const distSouth = rawDist * rawDist * (3.0 - 2.0 * rawDist);
      return -0.002 - distSouth * 0.016;
    }

    // 2. 宏观真实平行山系造山 (华夏构造系东北—西南走向与粤北南岭横贯弧)

    // 3. 全省广袤低山丘陵与宏观北高南低大势 (“七山一水二分田”的真实地理画卷)
    // 北部南岭山麓高丘 (180~380m)，向南自然阶梯坡降至低丘 (80~200m)
    const northMacro = Math.max(0.0, (lat - 21.2) / 4.0);
    const macroSlope = Math.pow(northMacro, 1.35) * 150.0;
    
    // 华夏构造系约 48° 东北—西南走向的自然岭谷褶皱波纹 (消除光滑死平板)
    const cosA = 0.669;
    const sinA = 0.743;
    const uTrend = (lng - 113.5) * cosA + (lat - 23.5) * sinA;
    const vCross = -(lng - 113.5) * sinA + (lat - 23.5) * cosA;
    const tectonicHills = (Math.sin(vCross * 14.0) * 0.5 + 0.5) * (fbm2D(uTrend * 2.5, vCross * 6.5, 3) * 55.0);

    const baseHills = fbm2D(lng * 2.8, lat * 2.8, 3) * 70.0;
    const microHills = smoothNoise2D(lng * 7.0, lat * 7.0) * 18.0;
    const rollingHills = 50.0 + macroSlope + tectonicHills + baseHills + microHills;

    // 4. 珠江三角洲、深圳湾与潮汕冲积平原 (平畴绿野，海拔 14~28m)
    const dPrd = Math.pow((lng - 113.35) / 0.46, 2.0) + Math.pow((lat - 22.80) / 0.40, 2.0);
    const prdBasin = Math.exp(-0.5 * dPrd);

    const dShenzhenPlain = Math.pow((lng - 113.98) / 0.16, 2.0) + Math.pow((lat - 22.58) / 0.16, 2.0);
    const shenzhenBasin = Math.exp(-0.5 * dShenzhenPlain);

    // 韩江与榕江、练江冲积三角洲平原，涵盖潮州古城、汕头、揭阳平畴绿野
    const dChaoshan = Math.pow((lng - 116.55) / 0.32, 2.0) + Math.pow((lat - 23.55) / 0.28, 2.0);
    const chaoshanBasin = Math.exp(-0.5 * dChaoshan);

    const alluvialBasinFactor = Math.max(prdBasin, chaoshanBasin, shenzhenBasin);

    // 5. 雷州半岛平缓低丘火山熔岩台地 (海拔 25~55m 自然微波入海)
    let leizhouWeight = 0.0;
    if (lng >= 109.65 && lng <= 110.65 && lat < 21.50) {
      const latTaper = Math.min(1.0, (21.50 - lat) / 0.45);
      const lngDist = Math.abs(lng - 110.15) / 0.50;
      leizhouWeight = Math.max(0.0, latTaper * (1.0 - lngDist * lngDist));
    }

    // 6. 平原平展如砥 (16~26m)，丘陵与连绵大山系相依相融
    const plainBase = 16.0 + microHills * 0.25;
    let backgroundLand = rollingHills * (1.0 - alluvialBasinFactor * 0.80) + plainBase * (alluvialBasinFactor * 0.80);

    if (leizhouWeight > 0.01) {
      backgroundLand = (34.0 + microHills * 0.35) * leizhouWeight + backgroundLand * (1.0 - leizhouWeight);
    }

    // 采用平滑联合 (Smooth Union)，使大山原自然扎根于广袤低山丘陵与冲积平原之中，彻底告别悬空垄沟感
    const diff = continuousMountains - backgroundLand;
    const kSmooth = 36.0;
    let totalElevMeters = Math.max(backgroundLand, continuousMountains);
    if (Math.abs(diff) <= kSmooth) {
      const t = (diff + kSmooth) / (2.0 * kSmooth);
      totalElevMeters = (1.0 - t) * backgroundLand + t * continuousMountains + kSmooth * t * (1.0 - t) * 0.5;
    }

    // 7. 真实珠江各大干流水系微侵蚀下切
    const { carvedDepth } = getRiverInfluence(lat, lng);
    const erodedMeters = Math.max(8.0, totalElevMeters - carvedDepth * 0.35);

    // 8. 陆地保持真实山川丘陵高程：绝不在边界处将内陆山脉生硬下压至海平面(14m)
    const finalMeters = Math.max(18.0, erodedMeters);

    // 9. 真实自然高程立体缩放：低山丘陵舒展温润，极巅挺拔雄伟，平原广阔平展
    const normalizedH = Math.min(1950.0, finalMeters) / 1950.0;
    const elevProfile = Math.pow(normalizedH, 0.92);
    const elev = 0.014 + elevProfile * 0.205;

    // 严格遵循大纲《真实陆海空间逻辑铁律》：
    // 北面、东面、西面与内陆邻省（桂、湘、赣、闽）相连区域属于华夏大陆山系自然延伸（如南岭、武夷、云开等连绵山系），
    // 陆地全域高程平滑连续，彻底消除境内外 elev * 0.78 造成的 400 米人造垂直断崖地裂与石坑崆北侧悬空露馅！
    return Math.max(0.010, elev);
  }

  /**
   * 5. 建造【珠江五大干流立体琉璃动态水系与三江八门入海】
   */
  private buildRiversSystem() {
    this.riversGroup = new THREE.Group();
    this.riversGroup.name = 'PearlRiver3DWaterSystem';

    this.riverBadgesGroup = new THREE.Group();
    this.riverBadgesGroup.name = 'PearlRiverBadgesGroup';

    this.riverWaterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRiverColor: { value: new THREE.Color(0x109B82) }, // 沧浪翡翠碧水
        uGlowColor: { value: new THREE.Color(0x78F6E8) },  // 琉璃天青活水
        uSunColor: { value: new THREE.Color(0xFFF9EC) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uRiverColor;
        uniform vec3 uGlowColor;
        uniform vec3 uSunColor;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          // 双频自然流水涟漪
          float flow1 = fract(vUv.x * 12.0 - uTime * 1.6);
          float flow2 = fract(vUv.x * 22.0 - uTime * 2.5 + vUv.y * 2.8);
          float wave1 = smoothstep(0.0, 0.45, flow1) * smoothstep(1.0, 0.55, flow1);
          float wave2 = smoothstep(0.0, 0.40, flow2) * smoothstep(1.0, 0.60, flow2);

          // 岸线水深淡入淡出
          float center = 1.0 - abs(vUv.y - 0.5) * 2.0;
          center = pow(max(0.0, center), 1.6);

          vec3 col = mix(uRiverColor, uGlowColor, (wave1 * 0.40 + wave2 * 0.28 + center * 0.32));

          // 阳光镜面反光微粼
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float spec = pow(max(dot(vec3(0.0, 1.0, 0.0), normalize(vec3(-0.6, 0.8, -0.5) + viewDir)), 0.0), 32.0);
          col += uSunColor * spec * 0.45 * center;

          float alpha = 0.86 * center + 0.12;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    GUANGDONG_RIVERS_GEOMETRY.forEach(river => {
      const pts = river.pts;
      if (pts.length < 2) return;

      const positions: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      const halfW = river.widthDeg * 0.5;

      for (let i = 0; i < pts.length; i++) {
        const [lng, lat] = pts[i];
        let dirX = 0, dirZ = 0;

        if (i < pts.length - 1) {
          dirX = pts[i + 1][0] - lng;
          dirZ = pts[i + 1][1] - lat;
        } else {
          dirX = lng - pts[i - 1][0];
          dirZ = lat - pts[i - 1][1];
        }

        const len = Math.hypot(dirX, dirZ) || 1;
        const normX = -dirZ / len;
        const normZ = dirX / len;

        const leftLng = lng + normX * halfW;
        const leftLat = lat + normZ * halfW;
        const rightLng = lng - normX * halfW;
        const rightLat = lat - normZ * halfW;

        const pLeft = this.geoToLocal(leftLat, leftLng);
        const yLeft = this.getTerrainHeight(leftLat, leftLng, true) + 0.0025;
        const pRight = this.geoToLocal(rightLat, rightLng);
        const yRight = this.getTerrainHeight(rightLat, rightLng, true) + 0.0025;

        positions.push(pLeft.x, yLeft, pLeft.z);
        positions.push(pRight.x, yRight, pRight.z);

        const uVal = i / (pts.length - 1);
        uvs.push(uVal, 0.0);
        uvs.push(uVal, 1.0);

        if (i < pts.length - 1) {
          const idx = i * 2;
          indices.push(idx, idx + 1, idx + 2);
          indices.push(idx + 1, idx + 3, idx + 2);
        }
      }

      const ribbonGeom = new THREE.BufferGeometry();
      ribbonGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      ribbonGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      ribbonGeom.setIndex(indices);
      ribbonGeom.computeVertexNormals();

      const ribbonMesh = new THREE.Mesh(ribbonGeom, this.riverWaterMaterial);
      ribbonMesh.userData = {
        isDioramaInteractable: true,
        hitData: {
          type: 'river',
          id: river.name,
          name: river.name,
          subName: river.subName,
          color: '#12A086'
        } as DioramaInteractableHit
      };
      this.riversGroup.add(ribbonMesh);

      const tagLng = river.tagPos[0];
      const tagLat = river.tagPos[1];
      const { x, z } = this.geoToLocal(tagLat, tagLng);
      const y = this.getTerrainHeight(tagLat, tagLng, true) + 0.028;

      const badgeCanvas = createDioramaBadgeCanvas(320, 88);
      if (badgeCanvas) {
        const ctx = badgeCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, 320, 88);
        ctx.fillStyle = 'rgba(6, 22, 26, 0.92)';
        ctx.roundRect(8, 8, 304, 72, 10);
        ctx.fill();
        ctx.strokeStyle = '#2DE2A6';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#E0F7FA';
        ctx.font = 'bold 34px "Noto Serif SC", "STKaiti", "KaiTi", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(river.name, 160, 44);
      }
      const badgeTex = createDioramaBadgeTexture(badgeCanvas);
      const badgeGeom = new THREE.PlaneGeometry(0.18, 0.05);
      const badgeMat = new THREE.MeshBasicMaterial({
        map: badgeTex,
        transparent: true,
        side: THREE.DoubleSide
      });
      const badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
      badgeMesh.position.set(x, y, z);
      this.billboardMeshes.push(badgeMesh);
      this.riverBadgesGroup.add(badgeMesh);
    });

    this.riversGroup.add(this.riverBadgesGroup);
    this.group.add(this.riversGroup);
  }

  /**
   * 6. 建造【广东 21 地市 30 座权威名山立体名岳金顶神阁与极巅神符】
   * 彻底告别旧版简陋塑料圆锥玩具！名山真身由真实高程网格巍峨隆起，
   * 极巅之上依华夏岳渎古制，雕琢【汉白玉八角须弥云台 + 飞檐翘角攒尖金阁 + 五行灵气环 + 悬浮金石神牌】！
   */
  private buildProminentPeaks() {
    this.mountainGroup = new THREE.Group();
    this.mountainGroup.name = 'FamousMountainPeaks';

    FAMOUS_MOUNTAINS.forEach(m => {
      const { x, z } = this.geoToLocal(m.lat, m.lng);
      const groundY = this.getTerrainHeight(m.lat, m.lng, true);
      const mountainSubGroup = new THREE.Group();
      mountainSubGroup.position.set(x, groundY, z);

      const peakScale = m.peakTier === 'highest' ? 1.30 : (m.peakTier === 'celebrated' ? 1.05 : 0.85);

      // 1. 山麓叠嶂地质基座与烟岚流光 (Tiered Bedrock Footing & Mountain Mist Layer)
      // 彻底废除突兀生硬的汉白玉八角圆柱与金箍圈！以天然山岳玄武青黛基岩与流岚相映
      const pedestalGeom = new THREE.CylinderGeometry(0.016 * peakScale, 0.022 * peakScale, 0.004 * peakScale, 7);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x2A3234, // 天然深灰青黛玄武基岩
        roughness: 0.88,
        metalness: 0.12
      });
      const pedestalMesh = new THREE.Mesh(pedestalGeom, pedestalMat);
      pedestalMesh.position.y = 0.002 * peakScale;
      mountainSubGroup.add(pedestalMesh);

      // 2. 真实华夏地质自然峰峦微雕群 (Authentic Geological Mountain Peak Sculptures)
      // 彻底清理粗糙的红木盒殿身、黄铜斗笠飞檐与金球玩具！依地质属性构建真正自然峰峦：
      const peakSculptGroup = new THREE.Group();
      peakSculptGroup.name = `PeakSculpt_${m.id}`;

      if (m.geology.includes('丹霞')) {
        // 【A. 白垩纪丹霞赤壁地貌：顶平身陡、赤壁丹崖、孤峰石柱】(如丹霞山、平远五指石)
        const danxiaMat = new THREE.MeshStandardMaterial({
          color: 0xA83424, // 朱砂赤褐
          roughness: 0.78,
          metalness: 0.15
        });
        const danxiaCapMat = new THREE.MeshStandardMaterial({
          color: 0x3E5432, // 顶平植被墨绿微顶
          roughness: 0.85,
          metalness: 0.10
        });

        if (m.id === 'wuzhishi') {
          // 平远五指石：并立耸峙的五座秀拔指状丹霞石柱
          const fingerHeights = [0.018, 0.023, 0.027, 0.022, 0.016];
          const fingerOffsets = [-0.010, -0.005, 0.0, 0.005, 0.010];
          for (let f = 0; f < 5; f++) {
            const h = fingerHeights[f] * peakScale;
            const fgGeom = new THREE.CylinderGeometry(0.0018 * peakScale, 0.0024 * peakScale, h, 6);
            const fgMesh = new THREE.Mesh(fgGeom, danxiaMat);
            fgMesh.position.set(fingerOffsets[f] * peakScale, h * 0.5 + 0.003 * peakScale, (Math.sin(f * 1.5) * 0.002) * peakScale);
            peakSculptGroup.add(fgMesh);

            const capGeom = new THREE.CylinderGeometry(0.0019 * peakScale, 0.0018 * peakScale, 0.0015 * peakScale, 6);
            const capMesh = new THREE.Mesh(capGeom, danxiaCapMat);
            capMesh.position.set(fingerOffsets[f] * peakScale, h + 0.0035 * peakScale, (Math.sin(f * 1.5) * 0.002) * peakScale);
            peakSculptGroup.add(capMesh);
          }
        } else {
          // 丹霞山：赤壁陡崖主峰 + 姊妹峰
          const mainButteGeom = new THREE.CylinderGeometry(0.007 * peakScale, 0.009 * peakScale, 0.023 * peakScale, 6);
          const mainButteMesh = new THREE.Mesh(mainButteGeom, danxiaMat);
          mainButteMesh.position.y = 0.0145 * peakScale;
          peakSculptGroup.add(mainButteMesh);

          const mainCapGeom = new THREE.CylinderGeometry(0.0072 * peakScale, 0.007 * peakScale, 0.002 * peakScale, 6);
          const mainCapMesh = new THREE.Mesh(mainCapGeom, danxiaCapMat);
          mainCapMesh.position.y = 0.0265 * peakScale;
          peakSculptGroup.add(mainCapMesh);

          // 侧生峭壁护卫峰
          const subButteGeom = new THREE.CylinderGeometry(0.0045 * peakScale, 0.006 * peakScale, 0.015 * peakScale, 5);
          const subButteMesh = new THREE.Mesh(subButteGeom, danxiaMat);
          subButteMesh.position.set(0.008 * peakScale, 0.0105 * peakScale, -0.004 * peakScale);
          peakSculptGroup.add(subButteMesh);
        }
      } else if (m.geology.includes('火山') || m.id === 'fenghuangshan' || m.id === 'xiqiao') {
        // 【B. 古火山口天池与熔岩奇峰：环形火山脊环抱天镜】(如潮安凤凰山乌岽顶、西樵山)
        const volcanoMat = new THREE.MeshStandardMaterial({
          color: 0x4A5852, // 火山喷发凝灰岩与古茶山玄墨色
          roughness: 0.82,
          metalness: 0.18
        });
        // 环形火山脊
        const coneGeom = new THREE.ConeGeometry(0.015 * peakScale, 0.024 * peakScale, 7, 1, true);
        const coneMesh = new THREE.Mesh(coneGeom, volcanoMat);
        coneMesh.position.y = 0.015 * peakScale;
        peakSculptGroup.add(coneMesh);

        // 乌岽天池水镜：清冽通透天水碧圆盘，嵌于火山口微凹中心
        const lakeGeom = new THREE.CircleGeometry(0.0065 * peakScale, 16);
        lakeGeom.rotateX(-Math.PI / 2);
        const lakeMat = new THREE.MeshStandardMaterial({
          color: 0x0EA892, // 天水碧池水
          emissive: 0x075449,
          emissiveIntensity: 0.45,
          roughness: 0.15,
          metalness: 0.80
        });
        const lakeMesh = new THREE.Mesh(lakeGeom, lakeMat);
        lakeMesh.position.y = 0.0205 * peakScale;
        peakSculptGroup.add(lakeMesh);

        // 天池环周乌岽茶祖高山峰脊微凸
        const ridgeGeom = new THREE.TorusGeometry(0.0075 * peakScale, 0.0016 * peakScale, 4, 12);
        ridgeGeom.rotateX(Math.PI / 2);
        const ridgeMesh = new THREE.Mesh(ridgeGeom, volcanoMat);
        ridgeMesh.position.y = 0.0215 * peakScale;
        peakSculptGroup.add(ridgeMesh);
      } else if (m.geology.includes('喀斯特') || m.geology.includes('石灰岩')) {
        // 【C. 喀斯特溶岩拔地峰林：玲珑石笋玉柱、奇石耸立】(如英西峰林、肇庆七星岩)
        const karstMat = new THREE.MeshStandardMaterial({
          color: 0x8E9FA5, // 浅灰云石白青色
          roughness: 0.72,
          metalness: 0.20
        });
        const pHeights = [0.026, 0.018, 0.014];
        const pRadius = [0.0035, 0.0028, 0.0022];
        const pOffsets = [[0, 0], [0.006, -0.004], [-0.005, 0.005]];
        for (let k = 0; k < 3; k++) {
          const kh = pHeights[k] * peakScale;
          const kGeom = new THREE.ConeGeometry(pRadius[k] * peakScale, kh, 5);
          const kMesh = new THREE.Mesh(kGeom, karstMat);
          kMesh.position.set(pOffsets[k][0] * peakScale, kh * 0.5 + 0.003 * peakScale, pOffsets[k][1] * peakScale);
          peakSculptGroup.add(kMesh);
        }
      } else if (m.id === 'shikengkung') {
        // 【第一标杆 · 广东第一峰 · 南岭极巅石坑崆 (1902m) 实景级 3D 花岗岩名山标杆模型】
        // 深度还原古生代花岗岩三棱角峰（Horn Peak）、北东—南西主刃脊（Arête）、南坡节理断崖与深扎 45mm 闭合地质底座
        this.shikengkungPeakModel = new ShikengkungPeak3D({
          baseElevation: groundY,
          centerLocalX: x,
          centerLocalZ: z,
          scale: 1.0,
          getTerrainHeight: (lat, lng) => this.getTerrainHeight(lat, lng, true),
          localToGeo: (lx, lz) => this.localToGeo(x + lx, z + lz),
          terrainUniforms: this.terrainMaterial.uniforms
        });
        peakSculptGroup.add(this.shikengkungPeakModel.group);
        pedestalMesh.visible = false; // 实体封闭花岗岩基底已深扎沙盘地下 45mm，无需人工粗糙圆柱

        // 支持直接点击石坑崆 3D 实体山体进行射线拾取与聚焦交互
        this.shikengkungPeakModel.mountainMesh.userData = {
          isDioramaInteractable: true,
          hitData: {
            type: 'mountain',
            id: m.id,
            name: m.name,
            subName: m.subName,
            altitude: m.altitude,
            geology: m.geology,
            element: m.element,
            color: m.color
          } as DioramaInteractableHit
        };
        this.interactableMeshes.push(this.shikengkungPeakModel.mountainMesh);
      } else {
        // 【D. 华夏花岗岩与变质岩高耸雄峰：巍峨主峰拔地、左右卫峰拱卫】(如铜鼓嶂、李望嶂、罗浮山、梧桐山等)
        const graniteMat = new THREE.MeshStandardMaterial({
          color: 0x3E4B50, // 苍苍云山深黛青色
          roughness: 0.80,
          metalness: 0.22
        });
        const peakRidgeMat = new THREE.MeshStandardMaterial({
          color: 0x566870, // 山脊受光刀削苍岩色
          roughness: 0.65,
          metalness: 0.35,
          emissive: new THREE.Color(m.color),
          emissiveIntensity: 0.15
        });

        // 巍峨主峰挺立
        const mainPeakGeom = new THREE.ConeGeometry(0.009 * peakScale, 0.027 * peakScale, 5);
        const mainPeakMesh = new THREE.Mesh(mainPeakGeom, graniteMat);
        mainPeakMesh.position.y = 0.0165 * peakScale;
        mainPeakMesh.rotation.y = Math.PI / 5;
        peakSculptGroup.add(mainPeakMesh);

        // 主峰尖削受光山脊棱
        const ridgeGeom = new THREE.CylinderGeometry(0.0008 * peakScale, 0.0055 * peakScale, 0.024 * peakScale, 3);
        const ridgeMesh = new THREE.Mesh(ridgeGeom, peakRidgeMat);
        ridgeMesh.position.set(0.0018 * peakScale, 0.015 * peakScale, 0.0018 * peakScale);
        ridgeMesh.rotation.y = Math.PI / 4;
        peakSculptGroup.add(ridgeMesh);

        // 错落东翼卫峰
        const sub1Geom = new THREE.ConeGeometry(0.006 * peakScale, 0.017 * peakScale, 5);
        const sub1Mesh = new THREE.Mesh(sub1Geom, graniteMat);
        sub1Mesh.position.set(0.0075 * peakScale, 0.011 * peakScale, -0.004 * peakScale);
        peakSculptGroup.add(sub1Mesh);

        // 错落西翼卫峰
        const sub2Geom = new THREE.ConeGeometry(0.005 * peakScale, 0.013 * peakScale, 4);
        const sub2Mesh = new THREE.Mesh(sub2Geom, graniteMat);
        sub2Mesh.position.set(-0.0065 * peakScale, 0.009 * peakScale, 0.005 * peakScale);
        peakSculptGroup.add(sub2Mesh);
      }

      mountainSubGroup.add(peakSculptGroup);

      // 4. 五行灵气光晕环 (Five-Elements Auric Halo)
      // 🚨 严禁对石坑崆等实景微雕名山添加平躺穿模光晕环！平面的 RingGeometry 直接在山腰穿模，切出一道极其割裂的黑色圆圈
      let auraMesh: THREE.Mesh | undefined;
      if (m.id !== 'shikengkung') {
        const auraGeom = new THREE.RingGeometry(0.020 * peakScale, 0.034 * peakScale, 32);
        auraGeom.rotateX(-Math.PI / 2);
        const auraMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(m.color),
          transparent: true,
          opacity: 0.50,
          side: THREE.DoubleSide
        });
        auraMesh = new THREE.Mesh(auraGeom, auraMat);
        auraMesh.position.y = 0.002;
        mountainSubGroup.add(auraMesh);
      }

      // 4.5. 通透五行玉质灵光标柱 (Luminous Beacon Pillar) —— 告别“大海捞针”，群岳直观显化！
      const peakSummitY = m.id === 'shikengkung' ? 0.026 : 0.004 * peakScale;
      const beaconHeight = 0.085 * peakScale;
      const beaconGeom = new THREE.CylinderGeometry(0.0014 * peakScale, 0.0022 * peakScale, beaconHeight, 6);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(m.color),
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
      beaconMesh.position.y = beaconHeight * 0.5 + peakSummitY;
      mountainSubGroup.add(beaconMesh);

      // 柱顶悬浮五行微光灵珠 (Floating Celestial Orb)
      const orbGeom = new THREE.SphereGeometry(0.0035 * peakScale, 8, 8);
      const orbMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(m.color),
        transparent: true,
        opacity: 0.92
      });
      const orbMesh = new THREE.Mesh(orbGeom, orbMat);
      orbMesh.position.y = beaconHeight + peakSummitY + 0.002 * peakScale;
      mountainSubGroup.add(orbMesh);

      // 5. 悬浮金石神岳名牌
      const badgeCanvas = createDioramaBadgeCanvas(320, 100);
      if (badgeCanvas) {
        const bCtx = badgeCanvas.getContext('2d')!;
        bCtx.clearRect(0, 0, 320, 100);
        bCtx.fillStyle = 'rgba(16, 12, 10, 0.92)';
        bCtx.roundRect(6, 6, 308, 88, 10);
        bCtx.fill();
        bCtx.strokeStyle = '#D4AF37';
        bCtx.lineWidth = 2.5;
        bCtx.stroke();

        bCtx.fillStyle = '#FFE082';
        bCtx.font = 'bold 30px "Noto Serif SC", "STKaiti", "KaiTi", serif';
        bCtx.textAlign = 'center';
        bCtx.textBaseline = 'middle';
        bCtx.fillText(m.name, 160, 34);

        bCtx.fillStyle = '#81D4FA';
        bCtx.font = '19px "Noto Serif SC", serif';
        bCtx.fillText(`${m.altitude}m · ${m.element}行`, 160, 70);
      }
      const badgeTex = createDioramaBadgeTexture(badgeCanvas);

      const badgePlaneGeom = new THREE.PlaneGeometry(0.15, 0.048);
      const badgePlaneMat = new THREE.MeshBasicMaterial({
        map: badgeTex,
        transparent: true,
        side: THREE.DoubleSide
      });
      const badgeMesh = new THREE.Mesh(badgePlaneGeom, badgePlaneMat);
      badgeMesh.position.y = beaconHeight + peakSummitY + 0.020 * peakScale;
      badgeMesh.userData = {
        isDioramaInteractable: true,
        hitData: {
          type: 'mountain',
          id: m.id,
          name: m.name,
          subName: m.subName,
          altitude: m.altitude,
          geology: m.geology,
          element: m.element,
          color: m.color
        } as DioramaInteractableHit
      };
      this.interactableMeshes.push(badgeMesh);
      this.billboardMeshes.push(badgeMesh);
      mountainSubGroup.add(badgeMesh);

      this.mountainMeshMap.set(m.id, {
        group: mountainSubGroup,
        peakSculpt: peakSculptGroup,
        pedestal: pedestalMesh,
        halo: auraMesh,
        badge: badgeMesh,
        beacon: beaconMesh,
        orb: orbMesh,
        spec: m
      });

      this.mountainGroup.add(mountainSubGroup);
    });

    this.group.add(this.mountainGroup);
  }



  /**
   * 6.8. 建造【通天神岳接引真光与仙人指路 · 华夏八面汉剑定岳神标】
   * 融合 Three.js 全家桶、Babylon.js PBR 材质标准与 GSAP 全家桶时间轴，
   * 严格遵循 cn-culture-atlas《weapons.json》百兵之君八大形制，彻底根除死白发光！
   */
  private buildMountainFocusBeacon() {
    this.mountainFocusBeaconGroup = new THREE.Group();
    this.mountainFocusBeaconGroup.name = 'MountainFocusBeacon';
    this.mountainFocusBeaconGroup.visible = false;

    // 0. 【极巅华夏奠基天石台座与崩解碎石群】(Mythic Pedestal Rock & Scree Field)
    this.focusPedestalGroup = new THREE.Group();
    this.focusPedestalGroup.name = 'FocusPedestalGroup';
    this.focusPedestalGroup.scale.set(0.001, 0.001, 0.001);
    this.mountainFocusBeaconGroup.add(this.focusPedestalGroup);

    // 1. 通天太清天青真光流柱 (Slender Celestial Cyan God Ray - 剑身上方虚化发散，绝不遮盖剑身)
    const rayGeom = new THREE.CylinderGeometry(0.016, 0.005, 0.46, 32, 1, true);
    rayGeom.translate(0, 0.23, 0);

    this.focusRayMaterial = new THREE.ShaderMaterial({
      vertexShader: MountainBeaconRayVertexShader,
      fragmentShader: MountainBeaconRayFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorCore: { value: new THREE.Color('#FFFFFF') },
        uColorEdge: { value: new THREE.Color('#00F5FF') },
        uIntensity: { value: 0.50 },
        uProgress: { value: 1.0 },
        uTopViewDamp: { value: 0.85 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.focusRayMesh = new THREE.Mesh(rayGeom, this.focusRayMaterial);
    this.mountainFocusBeaconGroup.add(this.focusRayMesh);

    // 2. 仙人指路 · 八角定岳金刚印 (彻底消除死白中心光团，采用 NormalBlending 清晰通透规尺)
    this.focusGroundArrayTexture = createMountainLeylineTexture();
    const arrayGeom = new THREE.PlaneGeometry(0.076, 0.076);
    arrayGeom.rotateX(-Math.PI / 2);
    const arrayMat = new THREE.MeshBasicMaterial({
      map: this.focusGroundArrayTexture,
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.80,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.focusGroundArrayMesh = new THREE.Mesh(arrayGeom, arrayMat);
    this.focusGroundArrayMesh.position.y = 0.0018;
    this.mountainFocusBeaconGroup.add(this.focusGroundArrayMesh);

    // 3. 太虚天青冰晶星尘粒子群 (轻灵微光，数量适度)
    const particleCount = 60;
    const pGeom = new THREE.BufferGeometry();
    this.focusParticlePositions = new Float32Array(particleCount * 3);
    this.focusParticleData = new Float32Array(particleCount * 4);

    for (let i = 0; i < particleCount; i++) {
      const r = 0.003 + Math.random() * 0.018;
      const angle = Math.random() * Math.PI * 2;
      const y = 0.006 + Math.random() * 0.45;
      const speedY = 0.04 + Math.random() * 0.10;
      const rotSpeed = 0.3 + Math.random() * 0.6;

      this.focusParticlePositions[i * 3 + 0] = Math.cos(angle) * r;
      this.focusParticlePositions[i * 3 + 1] = y;
      this.focusParticlePositions[i * 3 + 2] = Math.sin(angle) * r;

      this.focusParticleData[i * 4 + 0] = r;
      this.focusParticleData[i * 4 + 1] = angle;
      this.focusParticleData[i * 4 + 2] = speedY;
      this.focusParticleData[i * 4 + 3] = rotSpeed;
    }

    pGeom.setAttribute('position', new THREE.BufferAttribute(this.focusParticlePositions, 3));
    this.focusParticleTexture = createAscendingMoteTexture();

    const pMat = new THREE.PointsMaterial({
      size: 0.0045,
      map: this.focusParticleTexture,
      color: 0x00F5FF,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.focusParticles = new THREE.Points(pGeom, pMat);
    this.mountainFocusBeaconGroup.add(this.focusParticles);

    // 4. 【仙人指路 · 华夏4K PBR神兵定岳神标】(Tripo 4K PBR神兵资产，高精起脊开锋，法线光泽流转)
    this.focusPointerGroup = new THREE.Group();
    this.focusPointerGroup.name = 'FocusImmortalPointer';
    this.focusPointerGroup.position.set(0, 0.008, 0);

    // 预置标准 PBR 占位网格，确保在同步初始化、无头测试与异步加载前结构完整且稳定
    const placeholderMat = new THREE.MeshStandardMaterial({
      color: 0xE8F0F8,
      metalness: 0.90,
      roughness: 0.28,
      envMapIntensity: 1.35,
      side: THREE.DoubleSide
    });
    // 采用极简微型盒体，彻底杜绝无属性空 BufferGeometry 导致的 WebGL 崩溃/黑屏
    this.tripoSwordMesh = new THREE.Mesh(new THREE.BoxGeometry(0.001, 0.001, 0.001), placeholderMat);
    this.tripoSwordMesh.name = 'TripoHanSwordMesh';
    this.tripoSwordMesh.visible = false; // 加载完成前保持隐形，避免生硬瞬现
    this.focusPointerGroup.add(this.tripoSwordMesh);

    // 引入三维 GLTFLoader 与 MeshoptDecoder 解码加载 Tripo 4K PBR 华夏神兵高精资产 (仅在浏览器环境加载)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        MeshoptDecoder.ready.then(() => {
          const gltfLoader = new GLTFLoader();
          gltfLoader.setMeshoptDecoder(MeshoptDecoder);
          const modelUrl = '/models/han_sword_pbr_meshopt.glb';

          gltfLoader.load(
            modelUrl,
            (gltf) => {
              let loadedMesh: THREE.Mesh | null = null;
              gltf.scene.traverse((child) => {
                if ((child as THREE.Mesh).isMesh && !loadedMesh) {
                  loadedMesh = child as THREE.Mesh;
                }
              });

              if (!loadedMesh || !this.tripoSwordMesh) return;

              // 精确几何归一化数学计算：
              // 原始剑尖端 pB = (-0.45868, 0.48937, -0.40341), 剑首端 pA = (0.45240, -0.36840, 0.38800)
              // 剑体主轴方向向量 dir = (pA - pB).normalize() = (0.61543, -0.57937, 0.53454)
              // 目标竖直方向 up = (0, 1, 0)
              const pB = new THREE.Vector3(-0.45868, 0.48937, -0.40341);
              const dir = new THREE.Vector3(0.61543, -0.57937, 0.53454).normalize();
              const up = new THREE.Vector3(0, 1, 0);
              const Q = new THREE.Quaternion().setFromUnitVectors(dir, up);

              const geom = (loadedMesh as THREE.Mesh).geometry.clone();
              geom.applyQuaternion(Q);

              // 将剑尖精准对齐至局部原点 (0, 0, 0)
              const pB_rot = pB.clone().applyQuaternion(Q);
              geom.translate(-pB_rot.x, -pB_rot.y, -pB_rot.z);

              // 统一沙盘尺度：缩放系数 0.048，剑体总高归一为 0.072m，剑格宽 0.036m，完美契合神岳焦点
              const swordScale = 0.048;
              geom.scale(swordScale, swordScale, swordScale);
              // 严禁在此调用 geom.computeVertexNormals()！该模型自带 KHR_mesh_quantization 压缩法线，
              // 重新计算会将极微小棱角法线截断为零，并在 GLSL normalize(vec3(0)) 下产生 NaN 造成全屏黑屏！

              // 替换占位几何体与 4K PBR 材质
              this.tripoSwordMesh.geometry.dispose();
              this.tripoSwordMesh.geometry = geom;

              if ((loadedMesh as THREE.Mesh).material) {
                const rawMat = (loadedMesh as THREE.Mesh).material;
                const pbrMat = (Array.isArray(rawMat) ? rawMat[0] : rawMat) as THREE.MeshStandardMaterial;
                pbrMat.envMapIntensity = 1.35;
                pbrMat.roughness = 0.28;
                pbrMat.metalness = 0.88;
                pbrMat.emissive = new THREE.Color(0x2A2012); // 温润青铜黄金折叠微光
                pbrMat.emissiveIntensity = 0.35;
                pbrMat.side = THREE.DoubleSide;
                pbrMat.needsUpdate = true;
                this.tripoSwordMesh.material = pbrMat;
              }
              this.tripoSwordMesh.visible = true;
            },
            undefined,
            (err) => {
              console.warn('[GuangdongTerrain3D] Han Sword 4K PBR model loading notice:', err);
            }
          );
        }).catch((err) => {
          console.warn('[GuangdongTerrain3D] MeshoptDecoder ready notice:', err);
        });
      } catch (err) {
        // 静默保护
      }
    }

    this.mountainFocusBeaconGroup.add(this.focusPointerGroup);

    // 6. 悬浮封岳神章金匮铭牌组 (Floating Mountain Signet Group & Silk Thread)
    this.focusSignetGroup = new THREE.Group();
    this.focusSignetGroup.position.set(0.042, 0.092, 0.0);

    this.focusSignetCanvas = createDioramaBadgeCanvas(512, 140);
    this.focusSignetTexture = createDioramaBadgeTexture(this.focusSignetCanvas);
    if (this.focusSignetTexture instanceof THREE.CanvasTexture) {
      this.focusSignetTexture.minFilter = THREE.LinearFilter;
      this.focusSignetTexture.magFilter = THREE.LinearFilter;
    }

    const spriteMat = new THREE.SpriteMaterial({
      map: this.focusSignetTexture,
      transparent: true,
      depthWrite: false
    });
    this.focusSignetSprite = new THREE.Sprite(spriteMat);
    this.focusSignetSprite.scale.set(0.14, 0.038, 1);
    this.focusSignetGroup.add(this.focusSignetSprite);
    this.mountainFocusBeaconGroup.add(this.focusSignetGroup);

    // 金丝引线：自山巅连接至悬浮神章
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.002, 0),
      new THREE.Vector3(0.042, 0.092, 0.0)
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    this.focusSignetLine = new THREE.Line(lineGeom, lineMat);
    this.mountainFocusBeaconGroup.add(this.focusSignetLine);

    this.group.add(this.mountainFocusBeaconGroup);
  }

  /**
   * 绘制悬浮 3D 封岳神章高清微缩标牌
   */
  private renderFocusSignetCanvas(m: FamousMountainDef) {
    if (!this.focusSignetCanvas) return;
    const ctx = this.focusSignetCanvas.getContext('2d');
    if (!ctx) return;

    const w = this.focusSignetCanvas.width;
    const h = this.focusSignetCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. 半透明玄漆金丝边底框 (Lacquer plaque with golden filigree)
    const pad = 8;
    ctx.fillStyle = 'rgba(18, 12, 10, 0.90)';
    ctx.beginPath();
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 16);
    ctx.fill();

    // 双重金丝外框
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 224, 130, 0.40)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pad + 4, pad + 4, w - (pad + 4) * 2, h - (pad + 4) * 2, 12);
    ctx.stroke();

    // 2. 极巅/名岳朱砂印章 (Cinnabar seal badge)
    const tierText = m.peakTier === 'highest' ? '极巅' : (m.peakTier === 'celebrated' ? '名岳' : '灵峰');
    const sealX = 24;
    const sealY = 22;
    ctx.fillStyle = m.peakTier === 'highest' ? 'rgba(184, 46, 30, 0.95)' : 'rgba(212, 175, 55, 0.95)';
    ctx.beginPath();
    ctx.roundRect(sealX, sealY, 68, 30, 6);
    ctx.fill();
    ctx.fillStyle = '#FFFDF9';
    ctx.font = 'bold 18px "Noto Serif SC", "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tierText, sealX + 34, sealY + 15);

    // 3. 城市与五行印章 (City & Element)
    const cityX = 100;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(cityX, sealY, 120, 30, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.stroke();
    ctx.fillStyle = '#FFE082';
    ctx.font = '15px "Noto Serif SC", "SimSun", serif';
    ctx.textAlign = 'center';
    const cleanCity = m.cityName.replace('市', '').replace('特别行政区', '');
    ctx.fillText(`${cleanCity} · ${m.element}行`, cityX + 60, sealY + 15);

    // 4. 高程标尺 (Elevation text)
    ctx.fillStyle = '#81D4FA';
    ctx.font = 'bold 22px "Cinzel", "Noto Serif SC", serif';
    ctx.textAlign = 'right';
    ctx.fillText(`▲ ${m.altitude.toLocaleString()}m`, w - 24, sealY + 15);

    // 5. 名山主标题 (Mountain Main Name)
    ctx.fillStyle = '#FFFDF9';
    ctx.font = 'bold 36px "Noto Serif SC", "SimSun", serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(255, 224, 130, 0.7)';
    ctx.shadowBlur = 10;
    ctx.fillText(m.name, 26, 94);
    ctx.shadowBlur = 0;

    // 6. 山脉/地貌副题 (Mountain Subtitle / Range)
    ctx.fillStyle = 'rgba(240, 230, 210, 0.75)';
    ctx.font = '16px "Noto Serif SC", "SimSun", serif';
    ctx.textAlign = 'right';
    const sub = m.subName ? m.subName.split('(')[0].trim() : m.geology;
    ctx.fillText(sub, w - 24, 94);

    this.focusSignetTexture.needsUpdate = true;
  }

  /**
   * 6.5. 建造【广东五大特征地貌地质遗迹图谱】
   * 专门聚焦：韶关丹霞山（赤壁丹崖）、肇庆七星岩（水上石林）、英西峰林（喀斯特峰丛）、
   * 佛山西樵山（古火山）、湛江湖光岩（玛珥湖）、珠江三角洲（冲积平原）、惠州双月湾（海蚀岬角）
   */
  private buildLandformFeatures() {
    this.landformsGroup = new THREE.Group();
    this.landformsGroup.name = 'LandformFeaturesGroup';

    GUANGDONG_LANDFORM_FEATURES.forEach(feature => {
      const { x, z } = this.geoToLocal(feature.lat, feature.lng);
      const groundY = this.getTerrainHeight(feature.lat, feature.lng, true);
      const featureGroup = new THREE.Group();
      featureGroup.position.set(x, groundY, z);

      // 1. 专属地质基座微雕
      let sculptGeom: THREE.BufferGeometry;
      const colorHex = parseInt(feature.color.replace('#', '0x'), 16);
      const sculptMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.35,
        metalness: 0.60
      });

      if (feature.category === '丹霞地貌') {
        // 赤壁层叠方台
        sculptGeom = new THREE.BoxGeometry(0.08, 0.05, 0.08);
      } else if (feature.category === '喀斯特地貌') {
        // 拔地而起的奇峰石笋
        sculptGeom = new THREE.ConeGeometry(0.035, 0.07, 6);
      } else if (feature.category === '古火山地质') {
        // 火山口环礁
        sculptGeom = new THREE.TorusGeometry(0.04, 0.015, 8, 16);
        sculptGeom.rotateX(Math.PI / 2);
      } else if (feature.category === '冲积平原') {
        // 平原水网玉碟
        sculptGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
      } else {
        // 海蚀岬角
        sculptGeom = new THREE.ConeGeometry(0.04, 0.06, 4);
      }

      const sculptMesh = new THREE.Mesh(sculptGeom, sculptMat);
      sculptMesh.position.y = 0.025;
      featureGroup.add(sculptMesh);

      // 2. 地貌类型光轮
      const ringGeom = new THREE.RingGeometry(0.045, 0.065, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.y = 0.003;
      featureGroup.add(ringMesh);

      // 3. 悬浮金石地貌标牌
      const badgeCanvas = createDioramaBadgeCanvas(340, 108);
      if (badgeCanvas) {
        const ctx = badgeCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, 340, 108);
        ctx.fillStyle = 'rgba(10, 16, 18, 0.94)';
        ctx.roundRect(8, 8, 324, 92, 10);
        ctx.fill();
        ctx.strokeStyle = feature.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = feature.color;
        ctx.font = 'bold 22px "Noto Serif SC", "STKaiti", serif';
        ctx.textAlign = 'center';
        ctx.fillText(`【${feature.category}】`, 170, 38);

        ctx.fillStyle = '#FFFDF8';
        ctx.font = 'bold 30px "Noto Serif SC", "STKaiti", serif';
        ctx.fillText(feature.name, 170, 78);
      }
      const badgeTex = createDioramaBadgeTexture(badgeCanvas);
      const badgePlaneGeom = new THREE.PlaneGeometry(0.18, 0.058);
      const badgeMat = new THREE.MeshBasicMaterial({
        map: badgeTex,
        transparent: true,
        side: THREE.DoubleSide
      });
      const badgeMesh = new THREE.Mesh(badgePlaneGeom, badgeMat);
      badgeMesh.position.set(0, 0.088, 0);
      badgeMesh.userData = {
        isDioramaInteractable: true,
        hitData: {
          type: 'mountain',
          id: feature.id,
          name: feature.name,
          subName: feature.subName,
          altitude: 0,
          geology: feature.description,
          element: '土',
          color: feature.color
        } as DioramaInteractableHit
      };
      this.billboardMeshes.push(badgeMesh);
      this.interactableMeshes.push(badgeMesh);
      featureGroup.add(badgeMesh);

      this.landformsGroup.add(featureGroup);
    });

    this.landformsGroup.visible = false;
    this.group.add(this.landformsGroup);
  }

  /**
   * 7. 建造【名山龙脉金丝相连网络】
   */
  private buildDragonLeyLines() {
    this.dragonLeyLineGroup = new THREE.Group();
    this.dragonLeyLineGroup.name = 'MountainDragonLeyLines';

    const dragonChains: string[][] = [
      ['shikengkung', 'dalongshan', 'yingxi', 'danxia'],
      ['wuzhishi', 'yinnashan', 'tongguzhang', 'fenghuangshan', 'liwangzhang', 'dabeishan', 'sangpushan', 'dananshan', 'lianhuashan'],
      ['tiantangding', 'luofu', 'wutong', 'qiniangshan', 'daxingshan'],
      ['datianding', 'ehuangzhang', 'tianlushang', 'dinghu', 'xiqiao', 'baiyun']
    ];

    this.leyLineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xF5DF7E) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float pulse = sin(vUv.x * 20.0 - uTime * 3.5) * 0.5 + 0.5;
          float alpha = smoothstep(0.2, 0.9, pulse) * 0.85;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    dragonChains.forEach(chain => {
      const v3s: THREE.Vector3[] = [];
      chain.forEach(mountainId => {
        const m = FAMOUS_MOUNTAINS.find(item => item.id === mountainId);
        if (!m) return;
        const { x, z } = this.geoToLocal(m.lat, m.lng);
        const y = this.getTerrainHeight(m.lat, m.lng, true) + 0.025;
        v3s.push(new THREE.Vector3(x, y, z));
      });

      if (v3s.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(v3s);
        const tubeGeom = new THREE.TubeGeometry(curve, 64, 0.004, 6, false);
        const tubeMesh = new THREE.Mesh(tubeGeom, this.leyLineMaterial);
        this.dragonLeyLineGroup.add(tubeMesh);
      }
    });

    this.group.add(this.dragonLeyLineGroup);
  }

  /**
   * 7.5. 建造【南粤古道与海上丝绸之路古航道系统】
   * 包含：大庾岭梅关古道、西京古道、潮惠古驿道、岐澳古道、广州黄埔海丝航道、徐闻古港航道、樟林古港航道
   */
  private buildPostRoads() {
    this.postRoadsGroup = new THREE.Group();
    this.postRoadsGroup.name = 'GuangdongPostRoadsGroup';

    GUANGDONG_POST_ROADS.forEach(road => {
      const isSeaRoad = road.type === '海丝航道';
      const pts3D: THREE.Vector3[] = [];

      road.points.forEach(([lng, lat]) => {
        const { x, z } = this.geoToLocal(lat, lng);
        const y = this.getTerrainHeight(lat, lng, !isSeaRoad) + (isSeaRoad ? 0.005 : 0.004);
        pts3D.push(new THREE.Vector3(x, y, z));
      });

      if (pts3D.length < 2) return;

      const curve = new THREE.CatmullRomCurve3(pts3D, false, 'catmullrom', 0.25);
      const tubeGeom = new THREE.TubeGeometry(curve, 48, isSeaRoad ? 0.0035 : 0.0030, 8, false);
      const tubeMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uRoadColor: { value: new THREE.Color(road.color) },
          uGlowColor: { value: isSeaRoad ? new THREE.Color(0xFFE082) : new THREE.Color(0xFFF3B0) },
          uIsSea: { value: isSeaRoad ? 1.0 : 0.0 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uRoadColor;
          uniform vec3 uGlowColor;
          uniform float uIsSea;
          varying vec2 vUv;

          void main() {
            float speed = uIsSea > 0.5 ? 1.0 : 1.6;
            float freq = uIsSea > 0.5 ? 8.0 : 14.0;
            float pulse = fract(vUv.x * freq - uTime * speed);
            float spark = smoothstep(0.68, 0.96, pulse);

            vec3 col = mix(uRoadColor, uGlowColor, spark * 0.72);
            float alpha = 0.78 + spark * 0.22;
            gl_FragColor = vec4(col, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide
      });
      this.postRoadMaterials.push(tubeMat);
      const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
      this.postRoadsGroup.add(tubeMesh);

      // 古道关隘 / 港口铭牌 (取中点位置)
      const midIdx = Math.floor(road.points.length / 2);
      const headPt = road.points[midIdx];
      const { x: hx, z: hz } = this.geoToLocal(headPt[1], headPt[0]);
      const hy = this.getTerrainHeight(headPt[1], headPt[0], !isSeaRoad) + 0.045;

      const badgeCanvas = createDioramaBadgeCanvas(320, 96);
      if (badgeCanvas) {
        const ctx = badgeCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, 320, 96);
        ctx.fillStyle = isSeaRoad ? 'rgba(6, 28, 36, 0.94)' : 'rgba(28, 20, 8, 0.94)';
        ctx.roundRect(6, 6, 308, 84, 10);
        ctx.fill();
        ctx.strokeStyle = road.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = road.color;
        ctx.font = 'bold 20px "Noto Serif SC", "STKaiti", serif';
        ctx.textAlign = 'center';
        ctx.fillText(`【${road.type}】`, 160, 34);

        ctx.fillStyle = '#FFFDF6';
        ctx.font = 'bold 26px "Noto Serif SC", "STKaiti", serif';
        ctx.fillText(road.name, 160, 68);
      }
      const badgeTex = createDioramaBadgeTexture(badgeCanvas);
      const badgePlaneGeom = new THREE.PlaneGeometry(0.16, 0.048);
      const badgeMat = new THREE.MeshBasicMaterial({
        map: badgeTex,
        transparent: true,
        side: THREE.DoubleSide
      });
      const badgeMesh = new THREE.Mesh(badgePlaneGeom, badgeMat);
      badgeMesh.position.set(hx, hy, hz);
      badgeMesh.userData = {
        isDioramaInteractable: true,
        hitData: {
          type: 'road',
          id: road.id,
          name: road.name,
          subName: road.subName,
          geology: road.description,
          color: road.color
        } as DioramaInteractableHit
      };
      this.billboardMeshes.push(badgeMesh);
      this.interactableMeshes.push(badgeMesh);
      this.postRoadsGroup.add(badgeMesh);
    });

    this.postRoadsGroup.visible = false;
    this.group.add(this.postRoadsGroup);
  }

  /**
   * 8. 建造【21 地级市汉白玉托底金石微印】
   */
  private buildCityAltars() {
    this.cityPillarsGroup = new THREE.Group();
    this.cityPillarsGroup.name = 'CityAltars21';

    this.destinations.forEach(dest => {
      const centroid = GD_21_CENTROIDS[dest.id];
      if (!centroid) return;

      const { x, z } = this.geoToLocal(centroid.lat, centroid.lng);
      const groundY = this.getTerrainHeight(centroid.lat, centroid.lng, true);
      const colorCfg = CITY_TRADITIONAL_COLORS[dest.id] || {
        colorName: '天青 · 螺钿',
        primary: '#5DA399',
        glow: '#A8DADC',
        accent: '#2E6855',
        topJadeColor: '#0E2822'
      };

      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(x, groundY + 0.001, z);

      const baseGeom = new THREE.CylinderGeometry(0.020, 0.024, 0.006, 8);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0xF8F9FA,
        roughness: 0.35,
        metalness: 0.20
      });
      const baseMesh = new THREE.Mesh(baseGeom, baseMat);
      baseMesh.position.y = 0.003;
      pillarGroup.add(baseMesh);

      const sealGeom = new THREE.BoxGeometry(0.022, 0.010, 0.022);
      const sealMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorCfg.primary),
        roughness: 0.28,
        metalness: 0.65,
        emissive: new THREE.Color(colorCfg.glow),
        emissiveIntensity: 0.45
      });
      const sealMesh = new THREE.Mesh(sealGeom, sealMat);
      sealMesh.position.y = 0.009;
      sealMesh.userData = {
        isDioramaInteractable: true,
        hitData: {
          type: 'city',
          id: dest.id,
          name: dest.cityName,
          subName: centroid.ancientName || dest.ancientMythicName,
          element: (dest as any).element || '灵',
          color: colorCfg.glow,
          dest
        } as DioramaInteractableHit
      };
      this.interactableMeshes.push(sealMesh);
      pillarGroup.add(sealMesh);

      const ringGeom = new THREE.RingGeometry(0.024, 0.042, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorCfg.glow),
        transparent: true,
        opacity: 0.50,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.y = 0.001;
      pillarGroup.add(ringMesh);

      const displayName = dest.cityName.replace('特别行政区', '').replace('市', '');
      const badgeTex = this.createCalligraphyTexture(displayName, colorCfg);
      // 精巧古典印章尺寸：缩小至 0.078 x 0.032，优雅精致，彻底杜绝大黑方块遮挡
      const badgeGeom = new THREE.PlaneGeometry(0.078, 0.032);
      const badgeMat = new THREE.MeshBasicMaterial({
        map: badgeTex,
        transparent: true,
        side: THREE.DoubleSide
      });
      const badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
      badgeMesh.position.y = centroid.badgeElevationOffset || 0.035;
      badgeMesh.userData = sealMesh.userData;
      this.interactableMeshes.push(badgeMesh);
      this.billboardMeshes.push(badgeMesh);
      pillarGroup.add(badgeMesh);

      this.cityPillarMap.set(dest.id, {
        group: pillarGroup,
        sealMesh,
        ring: ringMesh,
        badge: badgeMesh,
        baseY: groundY + 0.001
      });

      this.cityPillarsGroup.add(pillarGroup);
    });

    this.group.add(this.cityPillarsGroup);
  }

  private createCalligraphyTexture(cityName: string, colorCfg: typeof CITY_TRADITIONAL_COLORS.guangzhou): THREE.CanvasTexture | THREE.Texture {
    const canvas = createDioramaBadgeCanvas(192, 80);
    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 192, 80);

      // 古雅玄青底衬与朱砂金丝勾边
      ctx.fillStyle = 'rgba(14, 20, 24, 0.93)';
      ctx.roundRect(4, 4, 184, 72, 8);
      ctx.fill();

      ctx.strokeStyle = colorCfg.glow || '#D4AF37';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 内层细金线
      ctx.strokeStyle = 'rgba(255, 240, 180, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, 176, 64);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Noto Serif SC", "STKaiti", "KaiTi", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = colorCfg.glow || '#D4AF37';
      ctx.shadowBlur = 8;
      ctx.fillText(cityName, 96, 40);
    }
    return createDioramaBadgeTexture(canvas);
  }

  /**
   * 9. 建造【粤港澳大湾区城市高精度矢量行政界线】
   */
  private buildContourLines() {
    this.contourLinesGroup = new THREE.Group();
    this.contourLinesGroup.name = 'ContourLines21';

    const points: THREE.Vector3[] = [];

    GBA_ALL_CITIES_GEO.forEach(city => {
      city.rings.forEach(ring => {
        for (let i = 0; i < ring.length - 1; i++) {
          const p1 = this.geoToLocal(ring[i][1], ring[i][0]);
          const p2 = this.geoToLocal(ring[i + 1][1], ring[i + 1][0]);
          const y1 = this.getTerrainHeight(ring[i][1], ring[i][0], true) + 0.002;
          const y2 = this.getTerrainHeight(ring[i + 1][1], ring[i + 1][0], true) + 0.002;
          points.push(
            new THREE.Vector3(p1.x, y1, p1.z),
            new THREE.Vector3(p2.x, y2, p2.z)
          );
        }
      });
    });

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.55
    });

    const lineSegments = new THREE.LineSegments(geom, mat);
    this.contourLinesGroup.add(lineSegments);
    this.group.add(this.contourLinesGroup);
  }

  /**
   * 图层切换核心调度器 (城山共融，名山大川自然实体常驻显示于大地之上)
   */
  public setLayerMode(mode: DioramaLayerMode) {
    this.currentLayerMode = mode;

    // 名山大川自然实体（如石坑崆 3D 标杆角峰模型）作为自然地理骨骼常驻大地之上
    // 仅在各图层模式下精确调度悬浮 UI 名牌、冲天光柱与环绕光晕
    if (this.mountainGroup) {
      this.mountainGroup.visible = true;
      const isMountainsMode = (mode === 'mountains');
      this.mountainMeshMap.forEach(m => {
        // 唯有已完成第一标杆实景级 3D 深度重构的石坑崆（广东第一峰）常驻展示其真实山川地貌实体；
        // 其余未深度建模的名山坚决不在大地上展示粗糙刺眼的黑圆锥与人工圆柱底座，保持纯净大美连绵山川！
        const isBenchmark = (m.spec.id === 'shikengkung');
        m.peakSculpt.visible = isBenchmark;
        m.pedestal.visible = false; // 彻底废弃所有生硬突兀的暗黑圆柱底盘
        m.badge.visible = isMountainsMode;
        if (m.beacon) m.beacon.visible = isMountainsMode;
        if (m.orb) m.orb.visible = isMountainsMode;
        if (m.halo) m.halo.visible = isMountainsMode;
      });
    }

    switch (mode) {
      case 'topography':
        // 1. 全景地势：纯净宏观地理分层设色地形与真实峰峦，不叠加河网流光与云雾斑块
        if (this.landformsGroup) this.landformsGroup.visible = false;
        if (this.postRoadsGroup) this.postRoadsGroup.visible = false;
        if (this.dragonLeyLineGroup) this.dragonLeyLineGroup.visible = false;
        if (this.cityPillarsGroup) this.cityPillarsGroup.visible = false;
        if (this.contourLinesGroup) this.contourLinesGroup.visible = false;
        if (this.riversGroup) this.riversGroup.visible = false;
        if (this.riverBadgesGroup) this.riverBadgesGroup.visible = false;
        if (this.cloudSeaGroup) this.cloudSeaGroup.visible = false;
        if (this.provincialBorderGroup) this.provincialBorderGroup.visible = true;
        break;

      case 'landforms':
        // 2. 特征地貌：18处代表性地质地貌奇观（丹霞赤壁、喀斯特水上石林、火山遗迹、大峡谷、海蚀岬角）
        if (this.landformsGroup) this.landformsGroup.visible = true;
        if (this.postRoadsGroup) this.postRoadsGroup.visible = false;
        if (this.dragonLeyLineGroup) this.dragonLeyLineGroup.visible = false;
        if (this.cityPillarsGroup) this.cityPillarsGroup.visible = false;
        if (this.contourLinesGroup) this.contourLinesGroup.visible = false;
        if (this.riversGroup) this.riversGroup.visible = false;
        if (this.riverBadgesGroup) this.riverBadgesGroup.visible = false;
        if (this.cloudSeaGroup) this.cloudSeaGroup.visible = false;
        if (this.provincialBorderGroup) this.provincialBorderGroup.visible = true;
        break;

      case 'mountains':
        // 3. 名山大川：名山青绿玉雕 + 完整神山铭牌 + 龙脉金丝网络 + 南岭千峦浮云海
        if (this.landformsGroup) this.landformsGroup.visible = false;
        if (this.postRoadsGroup) this.postRoadsGroup.visible = false;
        if (this.dragonLeyLineGroup) this.dragonLeyLineGroup.visible = true;
        if (this.cityPillarsGroup) this.cityPillarsGroup.visible = false;
        if (this.contourLinesGroup) this.contourLinesGroup.visible = false;
        if (this.riversGroup) this.riversGroup.visible = false;
        if (this.riverBadgesGroup) this.riverBadgesGroup.visible = false;
        if (this.cloudSeaGroup) this.cloudSeaGroup.visible = true;
        if (this.provincialBorderGroup) this.provincialBorderGroup.visible = true;
        break;

      case 'waters':
        // 4. 江海水系：珠江五大干流立体琉璃水系与八门入海流光 + 水系考据铭牌
        if (this.landformsGroup) this.landformsGroup.visible = false;
        if (this.postRoadsGroup) this.postRoadsGroup.visible = false;
        if (this.dragonLeyLineGroup) this.dragonLeyLineGroup.visible = false;
        if (this.cityPillarsGroup) this.cityPillarsGroup.visible = false;
        if (this.contourLinesGroup) this.contourLinesGroup.visible = false;
        if (this.riversGroup) this.riversGroup.visible = true;
        if (this.riverBadgesGroup) this.riverBadgesGroup.visible = true;
        if (this.cloudSeaGroup) this.cloudSeaGroup.visible = false;
        if (this.provincialBorderGroup) this.provincialBorderGroup.visible = true;
        break;

      case 'roads':
        // 5. 南粤古道：梅关古道、西京古道、潮惠驿道、海丝古港出海航道动态流光
        if (this.landformsGroup) this.landformsGroup.visible = false;
        if (this.postRoadsGroup) this.postRoadsGroup.visible = true;
        if (this.dragonLeyLineGroup) this.dragonLeyLineGroup.visible = false;
        if (this.cityPillarsGroup) this.cityPillarsGroup.visible = false;
        if (this.contourLinesGroup) this.contourLinesGroup.visible = false;
        if (this.riversGroup) this.riversGroup.visible = false;
        if (this.riverBadgesGroup) this.riverBadgesGroup.visible = false;
        if (this.cloudSeaGroup) this.cloudSeaGroup.visible = false;
        if (this.provincialBorderGroup) this.provincialBorderGroup.visible = true;
        break;

      case 'cities':
        // 6. 二十一城：专属展示 21 地级市高精行政金丝与汉白玉金石微印
        if (this.landformsGroup) this.landformsGroup.visible = false;
        if (this.postRoadsGroup) this.postRoadsGroup.visible = false;
        if (this.dragonLeyLineGroup) this.dragonLeyLineGroup.visible = false;
        if (this.cityPillarsGroup) this.cityPillarsGroup.visible = true;
        if (this.contourLinesGroup) this.contourLinesGroup.visible = true;
        if (this.riversGroup) this.riversGroup.visible = false;
        if (this.riverBadgesGroup) this.riverBadgesGroup.visible = false;
        if (this.cloudSeaGroup) this.cloudSeaGroup.visible = false;
        if (this.provincialBorderGroup) this.provincialBorderGroup.visible = true;
        break;
    }
  }

  public getLayerMode(): DioramaLayerMode {
    return this.currentLayerMode;
  }

  public update(time: number, delta: number = 0.016, camera?: THREE.Camera) {
    if (camera && camera.quaternion) {
      for (let i = 0; i < this.billboardMeshes.length; i++) {
        const m = this.billboardMeshes[i];
        if (m.parent && m.parent.visible) {
          m.quaternion.copy(camera.quaternion);
        }
      }
    }

    if (this.terrainMaterial && this.terrainMaterial.uniforms) {
      this.terrainMaterial.uniforms.uTime.value = time;
    }
    if (this.riverWaterMaterial && this.riverWaterMaterial.uniforms) {
      this.riverWaterMaterial.uniforms.uTime.value = time;
    }
    if (this.leyLineMaterial && this.leyLineMaterial.uniforms) {
      this.leyLineMaterial.uniforms.uTime.value = time;
    }
    if (this.cloudMaterial && this.cloudMaterial.uniforms) {
      this.cloudMaterial.uniforms.uTime.value = time;
    }
    if (this.postRoadMaterials && this.postRoadMaterials.length > 0) {
      for (let i = 0; i < this.postRoadMaterials.length; i++) {
        this.postRoadMaterials[i].uniforms.uTime.value = time;
      }
    }

    if (this.compassRoseGroup) {
      const needle = this.compassRoseGroup.getObjectByName('CompassNeedle');
      if (needle) {
        needle.rotation.y = Math.sin(time * 3.6) * 0.012;
      }
    }

    if (this.currentLayerMode === 'mountains') {
      this.mountainMeshMap.forEach(m => {
        if (m.halo && m.halo.visible) {
          const pulse = 1.0 + Math.sin(time * 2.5 + m.spec.altitude * 0.01) * 0.15;
          m.halo.scale.set(pulse, pulse, pulse);
        }
      });
    }

    if (this.currentLayerMode === 'cities') {
      this.cityPillarMap.forEach(p => {
        if (p.ring && p.ring.visible) {
          const pulse = 1.0 + Math.sin(time * 2.6 + p.group.position.x * 5.0) * 0.12;
          p.ring.scale.set(pulse, pulse, pulse);
        }
      });
    }

    // 通天名山接引真光与紫微璇玑阵法动效 (Celestial God Ray & Leyline Array Animation)
    if (this.mountainFocusBeaconGroup && this.mountainFocusBeaconGroup.visible) {
      // 1. 传递时间与视角给自定义着色器
      if (this.focusRayMaterial) {
        this.focusRayMaterial.uniforms.uTime.value = time;
      }

      // 2. 地面璇玑金册法阵慢速神圣回旋
      if (this.focusGroundArrayMesh) {
        this.focusGroundArrayMesh.rotation.z += delta * 0.16;
      }

      // 3. 太虚天青星尘灵气粒子螺旋升腾流转
      if (this.focusParticles && this.focusParticleData) {
        const posAttr = this.focusParticles.geometry.attributes.position as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;
        const count = posArr.length / 3;

        for (let i = 0; i < count; i++) {
          const dIdx = i * 4;
          let r = this.focusParticleData[dIdx + 0];
          let angle = this.focusParticleData[dIdx + 1];
          const speedY = this.focusParticleData[dIdx + 2];
          const rotSpeed = this.focusParticleData[dIdx + 3];

          angle += rotSpeed * delta;
          this.focusParticleData[dIdx + 1] = angle;

          let y = posArr[i * 3 + 1] + speedY * delta;
          if (y > 0.46) {
            y = 0.005;
            r = 0.0025 + Math.random() * 0.020;
            this.focusParticleData[dIdx + 0] = r;
          }
          posArr[i * 3 + 0] = Math.cos(angle) * r;
          posArr[i * 3 + 1] = y;
          posArr[i * 3 + 2] = Math.sin(angle) * r;
        }
        posAttr.needsUpdate = true;
      }

      // 4. 【仙人指路 · 华夏4K PBR神兵微浮动悬停律动与优雅自转】
      if (this.focusPointerGroup) {
        const hoverY = 0.008 + Math.sin(time * 2.2) * 0.0016;
        this.focusPointerGroup.position.y = hoverY;
        this.focusPointerGroup.rotation.y += delta * 0.28; // 优雅沉稳的慢速自转，让刃脊在沙盘光照下徐徐流转金属光泽
      }

      // 6. 悬浮封岳神章微波浮沉与金丝引线同步
      if (this.focusSignetGroup && this.focusSignetLine) {
        const floatY = 0.092 + Math.sin(time * 2.2) * 0.004;
        this.focusSignetGroup.position.y = floatY;
        const lineAttr = this.focusSignetLine.geometry.attributes.position as THREE.BufferAttribute;
        lineAttr.setXYZ(1, this.focusSignetGroup.position.x, floatY, this.focusSignetGroup.position.z);
        lineAttr.needsUpdate = true;
      }
    }
  }

  public setActiveCity(cityId: string | null) {
    this.activeCityId = cityId;

    this.cityPillarMap.forEach((pillar, id) => {
      const isActive = id === cityId;
      const targetScale = isActive ? 1.35 : 1.0;
      pillar.group.scale.set(targetScale, targetScale, targetScale);
      (pillar.sealMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = isActive ? 0.9 : 0.45;
      pillar.group.position.y = isActive ? pillar.baseY + 0.012 : pillar.baseY;
    });
  }

  public getActiveCityId(): string | null {
    return this.activeCityId;
  }

  public getTerrainMesh(): THREE.Mesh {
    return this.terrainMesh;
  }

  public getGeoBounds() {
    return this.geoBounds;
  }

  /**
   * 获取沙盘中允许高程探针感应的有效物体集合
   * (严格排除紫檀须弥座底座 plinthGroup、罗盘 compassRoseGroup、云海与探针微光环，杜绝沙盘外误触发！)
   */
  public getProbeableObjects(): THREE.Object3D[] {
    const list: THREE.Object3D[] = [];
    if (this.terrainMesh) list.push(this.terrainMesh);
    if (this.mountainGroup && this.mountainGroup.visible) list.push(this.mountainGroup);
    if (this.riversGroup && this.riversGroup.visible) list.push(this.riversGroup);
    if (this.landformsGroup && this.landformsGroup.visible) list.push(this.landformsGroup);
    if (this.cityPillarsGroup && this.cityPillarsGroup.visible) list.push(this.cityPillarsGroup);
    if (this.dragonLeyLineGroup && this.dragonLeyLineGroup.visible) list.push(this.dragonLeyLineGroup);
    if (this.postRoadsGroup && this.postRoadsGroup.visible) list.push(this.postRoadsGroup);
    return list;
  }

  public localToGeo(x: number, z: number): { lat: number; lng: number } {
    const normX = (x / this.geoBounds.width) + 0.5;
    const normZ = 0.5 - (z / this.geoBounds.depth);
    const lng = this.geoBounds.minLng + normX * (this.geoBounds.maxLng - this.geoBounds.minLng);
    const lat = this.geoBounds.minLat + normZ * (this.geoBounds.maxLat - this.geoBounds.minLat);
    return { lat, lng };
  }

  public probeLocation(lat: number, lng: number): DioramaProbeData {
    lat = THREE.MathUtils.clamp(lat, this.geoBounds.minLat, this.geoBounds.maxLat);
    lng = THREE.MathUtils.clamp(lng, this.geoBounds.minLng, this.geoBounds.maxLng);

    const inTerritory = this.isPointInTerritory(lat, lng);
    const h = this.getTerrainHeight(lat, lng, inTerritory);

    let elevationMeters = 0;
    let tierName = '平原';
    let zoneTitle = '南粤原野';
    let colorHex = '#52A66C';

    if (h < 0.0) {
      tierName = '沧溟';
      colorHex = '#38BDF8';

      const coast = getCoastlineLat(lng);
      const distDeg = Math.max(0.0, coast - lat);

      // 依据权威南海北部地貌与水文测绘，构建活态南海五阶真实水深模型：
      // 1. 东沙环礁特殊水文区 (环礁礁坪浅滩 8~35m，向外缘陆坡陡降至数百米)
      const distDongsha = Math.hypot(lng - 116.72, lat - 20.70);

      // 2. 琼州海峡水道 (平均水深 25m ~ 75m，深水潮槽达 110m)
      const isQiongzhou = lat >= 20.0 && lat <= 20.35 && lng >= 109.8 && lng <= 110.6;

      // 3. 北部湾浅海半封闭陆架海区 (水深 20m ~ 72m)
      const isBeibuGulf = lng < 109.70 && lat < 21.65;

      let depthMeters = 0;
      if (distDongsha < 0.09) {
        // 东沙环礁内部潟湖与外环礁坪浅水
        depthMeters = Math.round(12 + (distDongsha / 0.09) * 26);
      } else if (distDongsha < 0.28) {
        // 东沙水下台地向大洋深海斜坡陡降
        const tSlope = (distDongsha - 0.09) / 0.19;
        depthMeters = Math.round(38 + Math.pow(tSlope, 1.4) * 620);
      } else if (isQiongzhou) {
        depthMeters = Math.round(32 + Math.sin(lng * 9.0) * 15 + Math.cos(lat * 12.0) * 8);
      } else if (isBeibuGulf) {
        const bgDist = Math.max(0.0, Math.min(1.0, (21.65 - lat) / 1.5));
        depthMeters = Math.round(22 + bgDist * 46);
      } else {
        // 权威南海北部陆架—陆坡—海盆梯度标准测绘映射：
        // ① 近岸潮汐浅湾带 (0 ~ 0.20°, ~0-22km): 5m ~ 32m
        // ② 内大陆架平缓带 (0.20° ~ 0.80°, ~22-88km): 32m ~ 92m
        // ③ 外大陆架坡折带 (0.80° ~ 1.60°, ~88-177km): 92m ~ 210m (200m等深线陆架坡折)
        // ④ 陆坡陡深海槽带 (1.60° ~ 2.50°, ~177-277km): 210m ~ 1380m
        // ⑤ 南海大洋深海盆底 (> 2.50°, >277km): 1380m ~ 2850m+
        if (distDeg <= 0.20) {
          const t = distDeg / 0.20;
          depthMeters = Math.round(6 + t * 26);
        } else if (distDeg <= 0.80) {
          const t = (distDeg - 0.20) / (0.80 - 0.20);
          depthMeters = Math.round(32 + t * 60);
        } else if (distDeg <= 1.60) {
          const t = (distDeg - 0.80) / (1.60 - 0.80);
          depthMeters = Math.round(92 + t * 118);
        } else if (distDeg <= 2.50) {
          const t = (distDeg - 1.60) / (2.50 - 1.60);
          depthMeters = Math.round(210 + Math.pow(t, 1.4) * 1170);
        } else {
          const t = Math.min(1.0, (distDeg - 2.50) / 1.0);
          depthMeters = Math.round(1380 + t * 1470);
        }
      }

      // 叠加海底微地形与起伏波纹 (消除死板直线，呈现自然测绘质感)
      const seabedNoise = Math.sin(lng * 16.8 + lat * 14.5) * 2.6 + Math.cos(lng * 31.4 - lat * 25.2) * 1.6;
      depthMeters = Math.max(5, Math.round(depthMeters + seabedNoise));

      elevationMeters = -depthMeters;

      let nearestIsland = '';
      let minIslandDist = Infinity;
      for (const isl of AUTHORITATIVE_OFFSHORE_ISLANDS) {
        const d = Math.hypot(isl.lng - lng, isl.lat - lat);
        if (d < minIslandDist) {
          minIslandDist = d;
          nearestIsland = isl.name;
        }
      }

      if (minIslandDist < 0.18 && nearestIsland) {
        zoneTitle = `南海海域 · ${nearestIsland}近海`;
      } else if (lat < 21.4 && lng > 116.0) {
        zoneTitle = '南海海域 · 东沙群岛海域';
      } else if (lat < 21.6 && lng < 111.0) {
        zoneTitle = '琼州海峡 · 北部湾外海';
      } else if (lat < 22.4 && lng >= 113.5 && lng <= 114.2) {
        zoneTitle = '珠江口水域 · 伶仃洋碧波';
      } else if (lat < 22.8 && lng > 114.2 && lng < 115.0) {
        zoneTitle = '大鹏湾 · 大亚湾蔚蓝水镜';
      } else if (lat < 23.0 && lng >= 115.0 && lng <= 116.0) {
        zoneTitle = '红海湾 · 粤东碣石湾海面';
      } else if (lat < 23.5 && lng > 116.5) {
        zoneTitle = '潮阳海门湾 · 粤闽交界洋面';
      } else {
        zoneTitle = '浩瀚南海 · 沧溟水境深渊';
      }
    } else {
      // 自然高程精确数学逆映射 (真实还原 14m ~ 1902m 华夏自然山川台阶)：
      // 正向多项式：elev = 0.014 + Math.pow(finalMeters / 1950.0, 0.92) * 0.205
      const normalizedElev = Math.max(0.0, (h - 0.014) / 0.205);
      elevationMeters = Math.round(1950.0 * Math.pow(normalizedElev, 1.0 / 0.92));

      if (elevationMeters >= 1500) {
        tierName = '极巅';
        colorHex = '#783214';
      } else if (elevationMeters >= 800) {
        tierName = '崇山';
        colorHex = '#9E5424';
      } else if (elevationMeters >= 400) {
        tierName = '低山';
        colorHex = '#C0883E';
      } else if (elevationMeters >= 200) {
        tierName = '丘陵';
        colorHex = '#9EAC62';
      } else if (elevationMeters >= 60) {
        tierName = '台地';
        colorHex = '#6E9C76';
      } else if (elevationMeters > 0) {
        tierName = '平原';
        colorHex = '#5A8B6F';
      } else {
        tierName = '海岸';
        colorHex = '#DFCE9C';
      }

      let nearestMountain: FamousMountainDef | null = null;
      let minMtnDist = Infinity;
      for (const m of FAMOUS_MOUNTAINS) {
        const d = Math.hypot(m.lng - lng, m.lat - lat);
        if (d < minMtnDist) {
          minMtnDist = d;
          nearestMountain = m;
        }
      }

      let nearestLandform: LandformFeatureItem | null = null;
      let minLfDist = Infinity;
      for (const lf of GUANGDONG_LANDFORM_FEATURES) {
        const d = Math.hypot(lf.lng - lng, lf.lat - lat);
        if (d < minLfDist) {
          minLfDist = d;
          nearestLandform = lf;
        }
      }

      let nearestRiver: typeof GUANGDONG_RIVERS_GEOMETRY[0] | null = null;
      let minRiverDist = Infinity;
      for (const r of GUANGDONG_RIVERS_GEOMETRY) {
        for (const pt of r.pts) {
          const d = Math.hypot(pt[0] - lng, pt[1] - lat);
          if (d < minRiverDist) {
            minRiverDist = d;
            nearestRiver = r;
          }
        }
      }

      // 1. 精确名山峰顶判定：收窄至 0.040° (~4.4km)，且当前地形高程与山峰高程差异合理
      // 彻底消除浮点微偏导致的 1957m vs 1902m 矛盾，强制精准对齐国家法定名山海拔与中心坐标
      let isSpecificPeak = false;
      if (nearestMountain && minMtnDist <= 0.040) {
        const altDiff = Math.abs(elevationMeters - nearestMountain.altitude);
        if (altDiff <= 380 || (nearestMountain.altitude >= 1000 && elevationMeters >= 750)) {
          zoneTitle = `${nearestMountain.cityName} · ${nearestMountain.name}`;
          elevationMeters = nearestMountain.altitude;
          lat = nearestMountain.lat;
          lng = nearestMountain.lng;
          tierName = nearestMountain.altitude >= 1500 ? '极巅' : (nearestMountain.altitude >= 800 ? '崇山' : (nearestMountain.altitude >= 400 ? '低山' : '丘陵'));
          colorHex = nearestMountain.altitude >= 1500 ? '#783214' : (nearestMountain.altitude >= 800 ? '#9E5424' : (nearestMountain.altitude >= 400 ? '#C0883E' : '#9EAC62'));
          isSpecificPeak = true;
        }
      }

      if (!isSpecificPeak) {
        if (nearestLandform && minLfDist < 0.075) {
          zoneTitle = `${nearestLandform.cityName} · ${nearestLandform.name}`;
        } else if (nearestRiver && minRiverDist < 0.045) {
          zoneTitle = `${nearestRiver.name} · ${nearestRiver.subName.split(' · ')[0]}`;
        } else {
          // 2. 宏观山系走廊与区域地貌智能归属
          if (!inTerritory) {
            if (lat > 24.8 && lng < 113.0) zoneTitle = '华夏腹地 · 湘粤交界骑田岭连脉';
            else if (lat > 24.5 && lng >= 113.5 && lng <= 115.0) zoneTitle = '华夏腹地 · 赣粤交界大庾岭连脉';
            else if (lng > 116.8) zoneTitle = '华夏腹地 · 闽粤交界博平岭连脉';
            else if (lng < 110.2) zoneTitle = '华夏腹地 · 桂东南十万大山余脉';
            else zoneTitle = '华夏相连大陆 · 青山绿水延绵';
          } else {
            // 处于高程 >= 350m 的山系区域
            if (elevationMeters >= 350) {
              if (lng >= 115.65 && lng <= 116.35 && lat >= 23.35 && lat <= 23.75) {
                // 揭阳 / 揭西山脉核心区
                zoneTitle = elevationMeters >= 850 ? '揭阳市 · 莲花山脉中段千峰主脊' : '揭阳市 · 揭西大北山脉叠翠层峦';
              } else if (lng >= 115.8 && lat >= 23.8) {
                zoneTitle = elevationMeters >= 1000 ? '梅州市 · 莲花山脉铜鼓嶂主梁' : '梅州市 · 阴那凤凰连绵群峰';
              } else if (lng >= 116.5 && lat >= 23.8) {
                zoneTitle = '潮州市 · 凤凰山脉高山茶祖峰峦';
              } else if (lng >= 115.0 && lng < 115.65 && lat >= 22.8 && lat <= 23.35) {
                zoneTitle = '汕尾市 · 莲花山脉西南主脊';
              } else if (lat >= 24.4) {
                zoneTitle = '粤北韶关 · 南岭横贯巨岳高耸主脉';
              } else if (lng <= 111.8 && lat >= 21.8) {
                zoneTitle = '粤西茂名 · 云开大山大田顶脊梁';
              } else if (lng >= 113.7 && lng <= 114.3 && lat >= 23.2 && lat <= 23.8) {
                zoneTitle = '惠州广州 · 罗浮南昆群岳主梁';
              } else {
                zoneTitle = '粤东莲花山脉 · 奇峰丘陵带';
              }
            } else {
              // 平原与丘陵盆地
              if (lat >= 22.2 && lat <= 23.5 && lng >= 112.5 && lng <= 114.5) {
                zoneTitle = '珠江三角洲 · 三江汇流沃野冲积平原';
              } else if (lng >= 116.0 && lng <= 116.9 && lat >= 23.2 && lat <= 23.65) {
                zoneTitle = '潮汕平原 · 榕江练江韩江冲积沃野';
              } else if (lat <= 21.5 && lng <= 110.6) {
                zoneTitle = '雷州半岛 · 古火山玄武岩红土台地';
              } else {
                zoneTitle = '岭南南粤大地 · 锦绣丘陵原野';
              }
            }
          }
        }
      }
    }

    return {
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      elevationMeters,
      tierName,
      zoneTitle,
      colorHex,
      inGuangdong: inTerritory,
      timeMode: this.currentTimeMode
    };
  }

  public updateProbeReticle(worldPt: THREE.Vector3 | null, visible: boolean) {
    if (!this.probeReticleGroup) return;
    if (!visible || !worldPt) {
      this.probeReticleGroup.visible = false;
      if (this.terrainMaterial && this.terrainMaterial.uniforms.uProbeCoord) {
        this.terrainMaterial.uniforms.uProbeCoord.value.set(-999, -999);
      }
      return;
    }

    this.probeReticleGroup.visible = true;
    this.probeReticleGroup.position.set(worldPt.x, worldPt.y + 0.003, worldPt.z);

    if (this.terrainMaterial && this.terrainMaterial.uniforms.uProbeCoord) {
      this.terrainMaterial.uniforms.uProbeCoord.value.set(worldPt.x, worldPt.z);
    }
  }

  public setTimeOfDay(mode: DioramaTimeMode, animate: boolean = true) {
    this.currentTimeMode = mode;
    const preset = DIORAMA_TIME_PRESETS[mode];
    if (!preset || !this.terrainMaterial) return;

    const targetSunDir = new THREE.Vector3(...preset.sunDir).normalize();
    const targetSunColor = new THREE.Color(preset.sunColor);
    const targetFillDir = new THREE.Vector3(...preset.fillDir).normalize();
    const targetFillColor = new THREE.Color(preset.fillColor);
    const targetSkyColor = new THREE.Color(preset.skyColor);
    const targetCloudColor = new THREE.Color(preset.cloudColor);

    if (!animate) {
      this.terrainMaterial.uniforms.uSunDir.value.copy(targetSunDir);
      this.terrainMaterial.uniforms.uSunColor.value.copy(targetSunColor);
      this.terrainMaterial.uniforms.uFillDir.value.copy(targetFillDir);
      this.terrainMaterial.uniforms.uFillColor.value.copy(targetFillColor);
      this.terrainMaterial.uniforms.uSkyColor.value.copy(targetSkyColor);

      if (this.cloudMaterial) {
        this.cloudMaterial.uniforms.uCloudColor.value.copy(targetCloudColor);
        this.cloudMaterial.uniforms.uSunDir.value.copy(targetSunDir);
        this.cloudMaterial.uniforms.uSunColor.value.copy(targetSunColor);
        this.cloudMaterial.uniforms.uSkyColor.value.copy(targetSkyColor);
      }
      if (this.riverWaterMaterial && this.riverWaterMaterial.uniforms.uSunColor) {
        this.riverWaterMaterial.uniforms.uSunColor.value.copy(targetSunColor);
      }
      return;
    }

    const curSunDir = this.terrainMaterial.uniforms.uSunDir.value.clone();
    const curSunCol = this.terrainMaterial.uniforms.uSunColor.value.clone();
    const curFillDir = this.terrainMaterial.uniforms.uFillDir.value.clone();
    const curFillCol = this.terrainMaterial.uniforms.uFillColor.value.clone();
    const curSkyCol = this.terrainMaterial.uniforms.uSkyColor.value.clone();
    const curCloudCol = this.cloudMaterial ? this.cloudMaterial.uniforms.uCloudColor.value.clone() : targetCloudColor;

    const anim = { t: 0 };
    gsap.killTweensOf(anim);
    gsap.to(anim, {
      t: 1,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => {
        this.terrainMaterial.uniforms.uSunDir.value.lerpVectors(curSunDir, targetSunDir, anim.t).normalize();
        this.terrainMaterial.uniforms.uSunColor.value.copy(curSunCol).lerp(targetSunColor, anim.t);
        this.terrainMaterial.uniforms.uFillDir.value.lerpVectors(curFillDir, targetFillDir, anim.t).normalize();
        this.terrainMaterial.uniforms.uFillColor.value.copy(curFillCol).lerp(targetFillColor, anim.t);
        this.terrainMaterial.uniforms.uSkyColor.value.copy(curSkyCol).lerp(targetSkyColor, anim.t);

        if (this.cloudMaterial) {
          this.cloudMaterial.uniforms.uCloudColor.value.copy(curCloudCol).lerp(targetCloudColor, anim.t);
          this.cloudMaterial.uniforms.uSunDir.value.copy(this.terrainMaterial.uniforms.uSunDir.value);
          this.cloudMaterial.uniforms.uSunColor.value.copy(this.terrainMaterial.uniforms.uSunColor.value);
          this.cloudMaterial.uniforms.uSkyColor.value.copy(this.terrainMaterial.uniforms.uSkyColor.value);
        }
        if (this.riverWaterMaterial && this.riverWaterMaterial.uniforms.uSunColor) {
          this.riverWaterMaterial.uniforms.uSunColor.value.copy(this.terrainMaterial.uniforms.uSunColor.value);
        }
      }
    });
  }

  public getTimeOfDay(): DioramaTimeMode {
    return this.currentTimeMode;
  }

  public getMountainList(): FamousMountainDef[] {
    return FAMOUS_MOUNTAINS;
  }

  public getMountainCoordinates(mountainId: string): {
    x: number;
    y: number;
    z: number;
    worldX: number;
    worldY: number;
    worldZ: number;
    spec: FamousMountainDef;
  } | null {
    const item = this.mountainMeshMap.get(mountainId);
    if (!item) return null;
    const pos = item.group.position;

    try {
      item.group.updateWorldMatrix(true, false);
    } catch (_) {}

    const worldPos = new THREE.Vector3();
    item.group.getWorldPosition(worldPos);

    const worldX = (worldPos.x !== 0 || worldPos.z !== 0) ? worldPos.x : (pos.x + this.group.position.x);
    const worldY = worldPos.y !== 0 ? worldPos.y : (pos.y + this.group.position.y);
    const worldZ = (worldPos.z !== 0 || worldPos.x !== 0) ? worldPos.z : (pos.z + this.group.position.z);

    return {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      worldX,
      worldY,
      worldZ,
      spec: item.spec
    };
  }

  public highlightMountain(mountainId: string | null) {
    this.currentFocusedMountainId = mountainId;

    if (this.beaconTimeline) {
      this.beaconTimeline.kill();
      this.beaconTimeline = null;
    }

    if (!mountainId) {
      if (this.shikengkungPeakModel) {
        this.shikengkungPeakModel.setSummitPedestalVisible(true);
      }
      if (this.mountainFocusBeaconGroup && this.mountainFocusBeaconGroup.visible) {
        this.beaconTimeline = gsap.timeline({
          onComplete: () => {
            this.mountainFocusBeaconGroup.visible = false;
          }
        });

        if (this.focusPointerGroup) {
          this.beaconTimeline.to(this.focusPointerGroup.position, {
            y: 0.16,
            duration: 0.28,
            ease: 'power2.in'
          }, 0);
          this.beaconTimeline.to(this.focusPointerGroup.scale, {
            x: 0.01,
            y: 0.01,
            z: 0.01,
            duration: 0.24,
            ease: 'power2.in'
          }, 0);
        }

        if (this.focusPedestalGroup) {
          this.beaconTimeline.to(this.focusPedestalGroup.scale, {
            x: 0.001,
            y: 0.001,
            z: 0.001,
            duration: 0.22,
            ease: 'power2.in'
          }, 0);
        }

        this.beaconTimeline.to(this.focusRayMaterial.uniforms.uProgress, {
          value: 0.0,
          duration: 0.32,
          ease: 'power3.in'
        }, 0);
        this.beaconTimeline.to(this.focusRayMaterial.uniforms.uIntensity, {
          value: 0.0,
          duration: 0.28,
          ease: 'power2.in'
        }, 0);
        this.beaconTimeline.to(this.focusGroundArrayMesh.scale, {
          x: 0.01,
          y: 0.01,
          z: 0.01,
          duration: 0.28,
          ease: 'power2.in'
        }, 0.04);
        this.beaconTimeline.to(this.focusSignetGroup.scale, {
          x: 0.01,
          y: 0.01,
          z: 0.01,
          duration: 0.24,
          ease: 'power2.in'
        }, 0);
      }

      // 重置各山岳自身的标牌与光晕
      this.mountainMeshMap.forEach(entry => {
        if (entry.beacon) {
          (entry.beacon.material as THREE.MeshBasicMaterial).opacity = 0.65;
          entry.beacon.scale.set(1.0, 1.0, 1.0);
        }
        if (entry.halo) {
          (entry.halo.material as THREE.MeshBasicMaterial).opacity = 0.50;
          entry.halo.scale.set(1.0, 1.0, 1.0);
        }
        if (entry.badge) {
          entry.badge.scale.set(1.0, 1.0, 1.0);
        }
      });
      return;
    }

    const m = FAMOUS_MOUNTAINS.find(item => item.id === mountainId);
    if (m && this.mountainFocusBeaconGroup) {
      const { x, z } = this.geoToLocal(m.lat, m.lng);
      const groundY = this.getTerrainHeight(m.lat, m.lng, true);
      const summitOffsetY = (m.id === 'shikengkung') ? (this.shikengkungPeakModel?.apexHeight ?? 0.038) : 0.0;

      this.mountainFocusBeaconGroup.position.set(x, groundY + summitOffsetY, z);

      if (this.shikengkungPeakModel) {
        this.shikengkungPeakModel.setSummitPedestalVisible(m.id !== 'shikengkung');
      }

      // 【仙人指路 · 高对比度天青苍玉与纯阳白金配相】
      // 彻底根除金橙色背景粒子同色隐形问题！天青与纯白在暗夜金星背景下具有极高对比度
      const celestialCyan = new THREE.Color('#00F5FF');
      const radiantWhite = new THREE.Color('#FFFFFF');

      this.focusRayMaterial.uniforms.uColorEdge.value.copy(celestialCyan);
      this.focusRayMaterial.uniforms.uColorCore.value.copy(radiantWhite);
      this.focusRayMaterial.uniforms.uProgress.value = 0.0;
      this.focusRayMaterial.uniforms.uIntensity.value = 0.0;

      (this.focusGroundArrayMesh.material as THREE.MeshBasicMaterial).color.set('#FFFFFF');
      (this.focusSignetLine.material as THREE.LineBasicMaterial).color.copy(celestialCyan);
      (this.focusParticles.material as THREE.PointsMaterial).color.copy(celestialCyan);

      // 动态重构极巅华夏奠基天石台座
      if (this.focusPedestalGroup) {
        while (this.focusPedestalGroup.children.length > 0) {
          const child = this.focusPedestalGroup.children[0] as THREE.Mesh;
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material?.dispose();
          }
          this.focusPedestalGroup.remove(child);
        }
        const newPedestal = buildMythicPedestalGroup(m);
        while (newPedestal.children.length > 0) {
          this.focusPedestalGroup.add(newPedestal.children[0]);
        }
        this.focusPedestalGroup.scale.set(0.001, 0.001, 0.001);
      }

      this.renderFocusSignetCanvas(m);

      this.mountainFocusBeaconGroup.visible = true;
      this.mountainFocusBeaconGroup.scale.set(1, 1, 1);
      this.focusGroundArrayMesh.scale.set(0.01, 0.01, 0.01);
      this.focusSignetGroup.scale.set(0.01, 0.01, 0.01);
      this.focusRayMesh.scale.set(0.10, 1.0, 0.10);
      if (this.focusPointerGroup) {
        this.focusPointerGroup.scale.set(0.01, 0.01, 0.01);
        this.focusPointerGroup.position.set(0, 0.16, 0);
      }

      // GSAP 全家桶时间轴：仙人指路 · 华夏神兵破九天而降 · 八角金刚印扩散
      this.beaconTimeline = gsap.timeline();

      // 0.5. 极巅华夏奠基玄石台座破土拔升 (Back.out 坚若磐石)
      if (this.focusPedestalGroup) {
        this.beaconTimeline.to(this.focusPedestalGroup.scale, {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 0.52,
          ease: 'back.out(1.8)'
        }, 0.04);
      }

      // 1. 神兵自九天轻盈俯冲直刺奠基玄石中央 (Back.out 强力定岳)
      if (this.focusPointerGroup) {
        this.beaconTimeline.to(this.focusPointerGroup.position, {
          y: 0.008,
          duration: 0.58,
          ease: 'back.out(1.5)'
        }, 0.08);
        this.beaconTimeline.to(this.focusPointerGroup.scale, {
          x: 1.0,
          y: 1.0,
          z: 1.0,
          duration: 0.52,
          ease: 'back.out(1.6)'
        }, 0.08);
      }

      // 2. 地面璇玑阵法盘回旋弹入 (Back.out)
      this.beaconTimeline.to(this.focusGroundArrayMesh.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.48,
        ease: 'back.out(2.4)'
      }, 0.06);
      this.beaconTimeline.fromTo(this.focusGroundArrayMesh.rotation,
        { z: -Math.PI * 0.75 },
        { z: 0, duration: 0.60, ease: 'power2.out' }, 0);

      // 3. 通天紫微真光自九霄倾泻垂照 (uProgress 0 -> 1, Power4.out)
      this.beaconTimeline.to(this.focusRayMaterial.uniforms.uProgress, {
        value: 1.0,
        duration: 0.68,
        ease: 'power4.out'
      }, 0.10);

      // 4. 天光神圣轻闪 (柔和雅致，绝不过曝)
      this.beaconTimeline.to(this.focusRayMaterial.uniforms.uIntensity, {
        value: 0.75,
        duration: 0.28,
        ease: 'power2.out'
      }, 0.10);
      this.beaconTimeline.to(this.focusRayMaterial.uniforms.uIntensity, {
        value: 0.45,
        duration: 0.50,
        ease: 'sine.inOut'
      }, 0.38);

      // 5. 光束半径从细束展开至黄金比例
      this.beaconTimeline.to(this.focusRayMesh.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.58,
        ease: 'back.out(1.8)'
      }, 0.14);

      // 6. 悬浮封岳金章弹入显现
      this.beaconTimeline.to(this.focusSignetGroup.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.62,
        ease: 'elastic.out(1.1, 0.65)'
      }, 0.32);
    }

    this.mountainMeshMap.forEach((entry, id) => {
      const isCurrent = id === mountainId;
      if (entry.beacon) {
        (entry.beacon.material as THREE.MeshBasicMaterial).opacity = isCurrent ? 0.98 : 0.65;
        entry.beacon.scale.set(isCurrent ? 1.6 : 1.0, isCurrent ? 1.25 : 1.0, isCurrent ? 1.6 : 1.0);
      }
      if (entry.halo) {
        (entry.halo.material as THREE.MeshBasicMaterial).opacity = isCurrent ? 0.95 : 0.50;
        entry.halo.scale.set(isCurrent ? 1.4 : 1.0, isCurrent ? 1.4 : 1.0, isCurrent ? 1.4 : 1.0);
      }
      if (entry.badge) {
        entry.badge.scale.set(isCurrent ? 1.35 : 1.0, isCurrent ? 1.35 : 1.0, isCurrent ? 1.35 : 1.0);
      }
    });
  }

  public dispose() {
    this.group.clear();
    this.interactableMeshes = [];
    this.cityPillarMap.clear();
    this.mountainMeshMap.clear();
    this.postRoadMaterials = [];
    if (this.beaconTimeline) {
      this.beaconTimeline.kill();
      this.beaconTimeline = null;
    }
    if (this.focusSignetTexture) {
      this.focusSignetTexture.dispose();
    }
    if (this.focusGroundArrayTexture) {
      this.focusGroundArrayTexture.dispose();
    }
    if (this.focusParticleTexture) {
      this.focusParticleTexture.dispose();
    }
    if (this.focusRayMaterial) {
      this.focusRayMaterial.dispose();
    }
    if (this.focusPedestalGroup) {
      this.focusPedestalGroup.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).geometry?.dispose();
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach(m => m.dispose());
          else mat?.dispose();
        }
      });
    }
    if (this.tripoSwordMesh) {
      this.tripoSwordMesh.geometry?.dispose();
      if (Array.isArray(this.tripoSwordMesh.material)) {
        this.tripoSwordMesh.material.forEach(m => m.dispose());
      } else {
        this.tripoSwordMesh.material?.dispose();
      }
    }
    if (this.shikengkungPeakModel) {
      this.shikengkungPeakModel.dispose();
      this.shikengkungPeakModel = undefined;
    }
  }

  /**
   * 获取石坑崆实景级 3D 花岗岩名山标杆模型实例
   */
  public getShikengkungPeakModel(): ShikengkungPeak3D | undefined {
    return this.shikengkungPeakModel;
  }
}
