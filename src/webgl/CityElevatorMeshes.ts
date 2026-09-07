import * as THREE from 'three';
import { GUANGDONG_CITIES_GEO, RegionalGeoFeature } from './shaders/chinaRegionalGeo';
import { DESTINATIONS_DATA } from '../data/destinations';
import { DestinationItem } from '../types';
import { getLodVisibility } from '../core/experienceState';

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
  '澳门': 'macau',
  '澳门特别行政区': 'macau',
  '杭州市': 'hangzhou',
  '杭州': 'hangzhou',
  '宁波市': 'ningbo',
  '宁波': 'ningbo',
  '温州市': 'wenzhou',
  '温州': 'wenzhou',
  '绍兴市': 'shaoxing',
  '绍兴': 'shaoxing',
  '湖州市': 'huzhou',
  '湖州': 'huzhou',
  '嘉兴市': 'jiaxing',
  '嘉兴': 'jiaxing',
  '金华市': 'jinhua',
  '金华': 'jinhua',
  '衢州市': 'quzhou',
  '衢州': 'quzhou',
  '舟山市': 'zhoushan',
  '舟山': 'zhoushan',
  '台州市': 'taizhou',
  '台州': 'taizhou',
  '丽水市': 'lishui',
  '丽水': 'lishui'
};

export interface CityTraditionalColorConfig {
  colorName: string;
  primary: string;       // 传统主色 (天青、霁蓝、丹霞、胭脂、端砚黛紫等)
  glow: string;          // 传统辉光色 (天水碧、雨过天晴、海天霞、月白等)
  accent: string;        // 点缀色 (螺钿、青瓷、陈皮红等)
  topJadeColor: string;  // 顶面矿物玉石底色
  topEmissive: string;   // 顶面内蕴灵光色
  borderColor: string;   // 瓷胎勾线色
  cloudMistColor: string;// 环腰仙雾色
}

/**
 * 当前 Gate2 样板城市正统华夏国色谱系。
 * 广东 21 地市、香港、澳门与杭州各自沿用地域/风貌对应的东方矿物与玉石国色。
 */
export const CITY_TRADITIONAL_COLORS: Record<string, CityTraditionalColorConfig> = {
  guangzhou: {
    colorName: '木棉朱赤 · 珊瑚金芒',
    primary: '#9A2218',      // 越秀木棉朱赤
    glow: '#FFA000',         // 珊瑚金芒
    accent: '#FFD54F',       // 金芒色
    topJadeColor: '#280A08', // 赤玉
    topEmissive: '#4D120E',
    borderColor: '#FFCC80',
    cloudMistColor: '#FFF3E0'
  },
  shenzhen: {
    colorName: '景德霁蓝 · 鹏霄青金',
    primary: '#1B4B7F',      // 景德镇霁蓝
    glow: '#40C4FF',         // 东海晶蓝
    accent: '#80D8FF',       // 天霁色
    topJadeColor: '#0A1B30', // 青金石玉
    topEmissive: '#123356',
    borderColor: '#81D4FA',
    cloudMistColor: '#E1F5FE'
  },
  zhuhai: {
    colorName: '海天霞粉 · 珠江暖玉',
    primary: '#C2185B',      // 海天霞暖粉
    glow: '#FF80AB',         // 珊瑚粉
    accent: '#FF4081',       // 明珠霞
    topJadeColor: '#2B0818', // 粉晶玉
    topEmissive: '#4A0F2B',
    borderColor: '#F8BBD0',
    cloudMistColor: '#FCE4EC'
  },
  shantou: {
    colorName: '青花潮瓷 · 沧溟宝蓝',
    primary: '#006064',      // 潮瓷宝蓝
    glow: '#00E5FF',         // 南澳海波晶蓝
    accent: '#84FFFF',       // 潮瓷白青
    topJadeColor: '#001A1D', // 沧溟深翠玉
    topEmissive: '#00383D',
    borderColor: '#80DEEA',
    cloudMistColor: '#E0F7FA'
  },
  foshan: {
    colorName: '古窑石绿 · 祖庙翡翠',
    primary: '#1B7837',      // 古窑石绿
    glow: '#00E676',         // 翡翠绿
    accent: '#69F0AE',       // 嫩竹青
    topJadeColor: '#0A2412', // 碧翠玉
    topEmissive: '#134D25',
    borderColor: '#A5D6A7',
    cloudMistColor: '#E8F5E9'
  },
  shaoguan: {
    colorName: '丹霞朱砂 · 奇峰夕照',
    primary: '#AD1457',      // 丹霞朱砂赤
    glow: '#FF4081',         // 霞光粉赤
    accent: '#F8BBD0',       // 丹峰云
    topJadeColor: '#260413', // 朱砂玉
    topEmissive: '#4D0826',
    borderColor: '#F48FB1',
    cloudMistColor: '#FCE4EC'
  },
  zhanjiang: {
    colorName: '雷州红橙 · 南海珊瑚',
    primary: '#D84315',      // 雷州红土橙
    glow: '#FF6E40',         // 珊瑚暖橙
    accent: '#FFAB91',       // 火霞色
    topJadeColor: '#2C0D04', // 赤橙玉
    topEmissive: '#541A08',
    borderColor: '#FFAB91',
    cloudMistColor: '#FBE9E7'
  },
  zhaoqing: {
    colorName: '端砚端溪紫 · 七星墨玉',
    primary: '#4A148C',      // 端砚端溪紫
    glow: '#7C4DFF',         // 紫袍玉带
    accent: '#B388FF',       // 星湖紫
    topJadeColor: '#16052B', // 端溪老坑玉
    topEmissive: '#2D0B54',
    borderColor: '#D1C4E9',
    cloudMistColor: '#EDE7F6'
  },
  jiangmen: {
    colorName: '新会陈皮褐 · 侨乡古铜',
    primary: '#7A3E1D',      // 新会陈皮褐
    glow: '#FFAB40',         // 古铜金
    accent: '#FFD180',       // 金褐色
    topJadeColor: '#261208', // 沉香木玉
    topEmissive: '#4C2410',
    borderColor: '#FFCC80',
    cloudMistColor: '#EFEBE9'
  },
  maoming: {
    colorName: '高凉蜜蜡黄 · 油城琥珀',
    primary: '#E65100',      // 高凉蜜蜡黄
    glow: '#FFAB00',         // 琥珀金
    accent: '#FFD740',       // 蜜蜡辉
    topJadeColor: '#2D1000', // 琥珀玉
    topEmissive: '#592000',
    borderColor: '#FFE57F',
    cloudMistColor: '#FFF8E1'
  },
  huizhou: {
    colorName: '罗浮天水碧 · 西湖水青',
    primary: '#00897B',      // 罗浮天水碧
    glow: '#1DE9B6',         // 西湖绿
    accent: '#A7FFEB',       // 水青碧
    topJadeColor: '#04221E', // 天青石
    topEmissive: '#094840',
    borderColor: '#80CBC4',
    cloudMistColor: '#E0F2F1'
  },
  meizhou: {
    colorName: '客家蓝靛 · 梅水青黛',
    primary: '#1565C0',      // 客家蓝靛
    glow: '#448AFF',         // 客家染蓝
    accent: '#82B1FF',       // 梅江水
    topJadeColor: '#071F3B', // 青黛玉
    topEmissive: '#0F3C73',
    borderColor: '#90CAF9',
    cloudMistColor: '#E3F2FD'
  },
  shanwei: {
    colorName: '红海孔雀蓝 · 凤山苍青',
    primary: '#00838F',      // 红海湾孔雀蓝
    glow: '#00E5FF',         // 浪花蓝
    accent: '#84FFFF',       // 冰晶蓝
    topJadeColor: '#032124', // 孔雀石玉
    topEmissive: '#08444B',
    borderColor: '#80DEEA',
    cloudMistColor: '#E0F7FA'
  },
  heyuan: {
    colorName: '万绿湖翡翠 · 客家万绿',
    primary: '#00695C',      // 万绿湖翡翠
    glow: '#00BFA5',         // 万绿春深
    accent: '#64FFDA',       // 碧波色
    topJadeColor: '#00201C', // 深潭碧玉
    topEmissive: '#004038',
    borderColor: '#80CBC4',
    cloudMistColor: '#E0F2F1'
  },
  yangjiang: {
    colorName: '漠阳玄铁青 · 阳春金石',
    primary: '#37474F',      // 漠阳玄铁青
    glow: '#90A4AE',         // 金石刃光
    accent: '#CFD8DC',       // 银霜白
    topJadeColor: '#101518', // 墨玉
    topEmissive: '#212B30',
    borderColor: '#B0BEC5',
    cloudMistColor: '#ECEFF1'
  },
  qingyuan: {
    colorName: '凤城翠竹绿 · 峡谷幽翠',
    primary: '#2E7D32',      // 凤城翠竹绿
    glow: '#76FF03',         // 幽谷绿
    accent: '#CCFF90',       // 嫩芽青
    topJadeColor: '#0E260F', // 翠竹玉
    topEmissive: '#1C4D1E',
    borderColor: '#A5D6A7',
    cloudMistColor: '#E8F5E9'
  },
  dongguan: {
    colorName: '莞邑缃叶黄 · 沉香古金',
    primary: '#D49B2A',      // 莞邑缃叶黄
    glow: '#FFD700',         // 莞香金
    accent: '#FFE082',       // 秋香色
    topJadeColor: '#2A1F08', // 蜜蜡玉
    topEmissive: '#523C10',
    borderColor: '#FFE082',
    cloudMistColor: '#FFF8E1'
  },
  zhongshan: {
    colorName: '香山暮山紫 · 翠亨黛紫',
    primary: '#7B1FA2',      // 香山暮山紫
    glow: '#E040FB',         // 紫薇辉
    accent: '#EA80FC',       // 幽兰紫
    topJadeColor: '#21072C', // 紫云玉
    topEmissive: '#420F58',
    borderColor: '#E1BEE7',
    cloudMistColor: '#F3E5F5'
  },
  chaozhou: {
    colorName: '韩江秋香金 · 广济晨曦',
    primary: '#B38F38',      // 韩江秋香金
    glow: '#FFE57F',         // 广济晨曦
    accent: '#FFF59D',       // 月影金
    topJadeColor: '#261E0A', // 金丝玉
    topEmissive: '#4D3C14',
    borderColor: '#FFF59D',
    cloudMistColor: '#FFFDE7'
  },
  jieyang: {
    colorName: '玉都胭脂红 · 故宫暖玉',
    primary: '#C21F30',      // 正统故宫胭脂红
    glow: '#FF6B81',         // 胭脂红霞
    accent: '#FFE082',       // 金粉
    topJadeColor: '#2A080C', // 胭脂暖玉
    topEmissive: '#4D0E16',
    borderColor: '#FFCDD2',
    cloudMistColor: '#FFEBEE'
  },
  yunfu: {
    colorName: '石都雪浪白 · 汉白玉青',
    primary: '#546E7A',      // 石都雪浪青
    glow: '#CFD8DC',         // 汉白玉光
    accent: '#ECEFF1',       // 雪花白
    topJadeColor: '#141B1E', // 汉白玉底
    topEmissive: '#26343A',
    borderColor: '#CFD8DC',
    cloudMistColor: '#F5F5F5'
  },
  hongkong: {
    colorName: '香江紫荆赤金 · 维港星辉',
    primary: '#880E4F',      // 香江紫荆红
    glow: '#FF4081',         // 维港霓虹
    accent: '#FFD700',       // 东方之珠赤金
    topJadeColor: '#240315', // 紫荆血玉
    topEmissive: '#4A072B',
    borderColor: '#FF80AB',
    cloudMistColor: '#FCE4EC'
  },
  macau: {
    colorName: '濠镜莲花碧翠 · 妈阁春晖',
    primary: '#00796B',      // 濠镜九莲绿
    glow: '#00E676',         // 莲花宝光
    accent: '#FFE082',       // 金莲祥云
    topJadeColor: '#03241F', // 金莲翡翠玉
    topEmissive: '#07473D',
    borderColor: '#A7FFEB',
    cloudMistColor: '#E8F5E9'
  },
  hangzhou: {
    colorName: '沧浪天水碧 · 西湖竹青',
    primary: '#5B8266',      // 竹青
    glow: '#6A8E23',         // 西湖绿
    accent: '#87CEEB',       // 天水碧
    topJadeColor: '#163E35',
    topEmissive: '#2F7D65',
    borderColor: '#B1D5C8',  // 沧浪
    cloudMistColor: '#E3F4EF'
  },
  ningbo: {
    colorName: '沧溟宝蓝 · 越窑青瓷',
    primary: '#1A365D',      // 沧溟宝蓝
    glow: '#40C4FF',         // 三江晶蓝
    accent: '#80D8FF',       // 螺钿白青
    topJadeColor: '#0A1B30', // 深海青金玉
    topEmissive: '#123356',
    borderColor: '#81D4FA',
    cloudMistColor: '#E1F5FE'
  },
  wenzhou: {
    colorName: '雁荡丹青 · 瓯窑墨翠',
    primary: '#8B263E',      // 雁荡丹霞红
    glow: '#FF80AB',         // 灵岩霞彩
    accent: '#6B8E23',       // 瓯窑青
    topJadeColor: '#280A12', // 丹石赤玉
    topEmissive: '#4D1222',
    borderColor: '#F48FB1',
    cloudMistColor: '#FCE4EC'
  },
  shaoxing: {
    colorName: '古越青瓷 · 兰亭修禊',
    primary: '#2E6F40',      // 越窑碧青
    glow: '#68D391',         // 鉴湖春水
    accent: '#C08030',       // 绍兴黄酒金
    topJadeColor: '#0E2416', // 鉴湖墨玉
    topEmissive: '#1B472A',
    borderColor: '#A3C9A8',
    cloudMistColor: '#E8F5E9'
  },
  huzhou: {
    colorName: '太湖松花 · 莫干翠竹',
    primary: '#4A7C59',      // 莫干竹青
    glow: '#9AE6B4',         // 松花绿
    accent: '#68D391',       // 太湖晴碧
    topJadeColor: '#14291D', // 碧竹玉
    topEmissive: '#274F39',
    borderColor: '#C6F6D5',
    cloudMistColor: '#F0FFF4'
  },
  jiaxing: {
    colorName: '烟雨青瓦 · 秀州南湖',
    primary: '#4A5568',      // 乌镇黛瓦青
    glow: '#81E6D9',         // 南湖烟波
    accent: '#E53E3E',       // 禾城荷花红
    topJadeColor: '#1A202C', // 黛瓦玄玉
    topEmissive: '#2D3748',
    borderColor: '#CBD5E0',
    cloudMistColor: '#EDF2F7'
  },
  jinhua: {
    colorName: '婺州双星 · 佛手金华',
    primary: '#D69E2E',      // 婺女金华
    glow: '#F6E05E',         // 太阳金芒
    accent: '#3182CE',       // 双龙石青
    topJadeColor: '#3D2D0C', // 婺金暖玉
    topEmissive: '#744210',
    borderColor: '#F6AD55',
    cloudMistColor: '#FFFAF0'
  },
  quzhou: {
    colorName: '烂柯棋褐 · 南孔朱砂',
    primary: '#744210',      // 烂柯仙木褐
    glow: '#4FD1C5',         // 信安江清碧
    accent: '#C53030',       // 南孔朱砂红
    topJadeColor: '#2C1806', // 仙棋檀木玉
    topEmissive: '#4A2A0C',
    borderColor: '#D69E2E',
    cloudMistColor: '#FEFCBF'
  },
  zhoushan: {
    colorName: '普陀香金 · 潮音沧溟',
    primary: '#D97706',      // 普陀祥光金
    glow: '#FBBF24',         // 佛国金光
    accent: '#38BDF8',       // 潮音碧浪
    topJadeColor: '#451A03', // 普陀金玉
    topEmissive: '#B45309',  // 祥光内蕴
    borderColor: '#FDE68A',
    cloudMistColor: '#FEF3C7'
  },
  taizhou: {
    colorName: '赤城霞标 · 国清禅意',
    primary: '#C53030',      // 天台赤城红
    glow: '#FC8181',         // 仙居霞光
    accent: '#319795',       // 琼台碧泉
    topJadeColor: '#360D0D', // 赤城血玉
    topEmissive: '#631717',
    borderColor: '#FEB2B2',
    cloudMistColor: '#FFF5F5'
  },
  lishui: {
    colorName: '龙泉粉青 · 梅子青瓷',
    primary: '#71A88A',      // 龙泉粉青
    glow: '#9AE6B4',         // 梅子青瓷光
    accent: '#D69E2E',       // 云和梯田金
    topJadeColor: '#1F3327', // 青瓷纯玉
    topEmissive: '#385C46',
    borderColor: '#C6F6D5',
    cloudMistColor: '#E6FFFA'
  }
};

const ElevatorSkirtShader = {
  vertexShader: `
    attribute float aIsTop;
    attribute vec3 aUnitDir;
    uniform float uElevation;
    uniform float uRadius;
    varying float vHeight;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vHeight = aIsTop;
      float r = uRadius + (aIsTop * uElevation);
      vec3 newPos = aUnitDir * r;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uElevation;
    uniform vec3 uPrimaryColor;
    uniform vec3 uGlowColor;
    uniform vec3 uAccentColor;
    uniform float uIsSelected;
    varying float vHeight;
    varying vec2 vUv;

    void main() {
      if (uElevation < 0.001) {
        discard;
      }

      // 垂直向上的青瓷水波灵脉瀑布
      float pulse = sin((vHeight * 6.0 - uTime * 3.6) * 3.14159) * 0.5 + 0.5;
      pulse = pow(pulse, 3.0);

      // 祥云水纹
      float wave = sin((vUv.x * 20.0 + uTime * 1.2) * 3.14159) * 0.5 + 0.5;
      wave = pow(wave, 3.5);

      // 顶部青瓷光刃与底部灵脉星尘
      float topEdge = pow(vHeight, 3.6) * 1.5;
      float bottomGlow = pow(1.0 - vHeight, 2.5) * 0.8;
      
      float intensity = pulse * 0.50 + topEdge * 0.90 + bottomGlow * 0.50 + wave * 0.30 + 0.35;
      float alpha = min(1.0, (uElevation / 0.012)) * (0.65 + intensity * 0.35);

      vec3 col = mix(uPrimaryColor, uGlowColor, pulse * 0.60 + topEdge * 0.5);
      col = mix(col, uAccentColor, wave * 0.35);

      if (uIsSelected > 0.5) {
        col = mix(col, vec3(0.95, 0.98, 0.96), 0.40);
        alpha = min(1.0, alpha * 1.30);
      }

      vec3 finalCol = clamp(col, 0.0, 1.0);
      float finalAlpha = clamp(alpha, 0.0, 0.95);
      gl_FragColor = vec4(finalCol, finalAlpha);
    }
  `
};

interface CityElevatorItem {
  cityId: string;
  cityName: string;
  dest: DestinationItem;
  feature: RegionalGeoFeature;
  colorConfig: CityTraditionalColorConfig;
  bbox: { minLng: number; maxLng: number; minLat: number; maxLat: number };
  mainRing: [number, number][];
  centroid: { lat: number; lng: number };
  centroidVec3: THREE.Vector3;
  rootGroup: THREE.Group;
  liftGroup: THREE.Group;
  topCapMesh: THREE.Mesh;
  calligraphyMesh: THREE.Mesh;
  topBorderLine: THREE.LineLoop;
  skirtMesh: THREE.Mesh;
  skirtMaterial: THREE.ShaderMaterial;
  currentElevation: number;
  targetElevation: number;
  isHovered: boolean;
  isSelected: boolean;
}

/**
 * 3D 城市地契沙盘电梯升起引擎 - 正统中国传统国色与大字金石书法版
 */
export class CityElevatorMeshes {
  public group: THREE.Group;
  private items: CityElevatorItem[] = [];
  private hoveredCityId: string | null = null;
  private selectedCityId: string | null = null;
  private radius: number;
  private readonly cityFeatures: readonly RegionalGeoFeature[];
  private readonly destinations: readonly DestinationItem[];

  constructor(
    radius = 2.000,
    cityFeatures: readonly RegionalGeoFeature[] = GUANGDONG_CITIES_GEO,
    destinations: readonly DestinationItem[] = DESTINATIONS_DATA
  ) {
    this.radius = radius;
    this.cityFeatures = cityFeatures;
    this.destinations = destinations;
    this.group = new THREE.Group();
    this.initElevatorMeshes();
  }

  private latLngToVec3(lat: number, lng: number, r: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -r * Math.cos(theta) * Math.sin(phi);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(theta) * Math.sin(phi);
    return new THREE.Vector3(x, y, z);
  }

  private isPointInPolygon(lng: number, lat: number, ring: [number, number][]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  public findCityAtLatLng(lat: number, lng: number): DestinationItem | null {
    // 1. 优先：判断是否在多边形内部（遍历全部环，包括所有海岛与飞地）
    for (const item of this.items) {
      const b = item.bbox;
      if (lng < b.minLng - 0.08 || lng > b.maxLng + 0.08 || lat < b.minLat - 0.08 || lat > b.maxLat + 0.08) {
        continue;
      }
      for (const ring of item.feature.rings) {
        if (this.isPointInPolygon(lng, lat, ring)) {
          return item.dest;
        }
      }
    }

    // 2. 次选：对于海岛较多或较细微的区域（如舟山千岛、珠海海岛），按空间距离优先命中
    let closestItem: CityElevatorItem | null = null;
    let closestDistSq = Infinity;
    for (const item of this.items) {
      const dLat = lat - item.dest.coordinates.lat;
      const dLng = lng - item.dest.coordinates.lng;
      const distSq = dLat * dLat + dLng * dLng;
      if (distSq < 0.28 * 0.28 && distSq < closestDistSq) {
        closestDistSq = distSq;
        closestItem = item;
      }
    }
    if (closestItem) {
      return closestItem.dest;
    }

    return null;
  }

  /**
   * 为市级悬停名片提供稳定的城市质心世界锚点，并跟随当前沙盘抬升量。
   * 名片不能使用鼠标坐标，否则鼠标离开城市视觉中心时会与高亮城市脱节。
   */
  public getCityTooltipAnchor(cityId: string): THREE.Vector3 | null {
    const item = this.items.find(candidate => candidate.cityId === cityId);
    if (!item) return null;

    this.group.updateWorldMatrix(true, false);
    const anchor = item.centroidVec3.clone().multiplyScalar(this.radius * 1.010);
    anchor.add(item.liftGroup.position);
    return this.group.localToWorld(anchor);
  }

  /**
   * 【高清大字行楷金石城名材质】(1024×512 视网膜超清大字，无任何圆环边框，字字如金、极致清晰)
   */
  private createCalligraphyPlateTexture(dest: DestinationItem, colorCfg: CityTraditionalColorConfig): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 512);

    const displayName = dest.cityName.replace('市', '');

    // 1. 极致大字行楷城名 (如「佛山」「东莞」「广州」「深圳」「肇庆」「韶关」等)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 240px "Noto Serif SC", "STKaiti", "KaiTi", "Songti SC", serif';

    // 双重深黑外描边：确保在任何青翠/暗黑地表背景上 100% 极致对比度与锐利可读性
    ctx.lineWidth = 26;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.98)';
    ctx.strokeText(displayName, 512, 256);

    // 24K 鎏金与月白玉泽渐变
    const textGrad = ctx.createLinearGradient(200, 140, 824, 370);
    textGrad.addColorStop(0, '#FFFFFF');
    textGrad.addColorStop(0.25, '#FFF9C4');
    textGrad.addColorStop(0.60, '#FFE082');
    textGrad.addColorStop(0.85, '#FFD54F');
    textGrad.addColorStop(1.0, '#FFA000');

    ctx.fillStyle = textGrad;
    ctx.shadowColor = colorCfg.glow;
    ctx.shadowBlur = 24;
    ctx.fillText(displayName, 512, 256);
    ctx.shadowBlur = 0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  private initElevatorMeshes() {
    for (const feature of this.cityFeatures) {
      const cityId = this.resolveDestinationId(feature.name);
      if (!cityId) continue;
      const dest = this.destinations.find(d => d.id === cityId);
      if (!dest) continue;

      const colorCfg = CITY_TRADITIONAL_COLORS[cityId] || {
        colorName: '天青 · 螺钿',
        primary: '#5DA399',
        glow: '#A8DADC',
        accent: '#2E6855',
        topJadeColor: '#0E2822',
        topEmissive: '#1A4D3E',
        borderColor: '#C4E1E1',
        cloudMistColor: '#E0F2F1'
      };

      let mainRing = feature.rings[0];
      for (const ring of feature.rings) {
        if (ring.length > mainRing.length) {
          mainRing = ring;
        }
      }
      if (!mainRing || mainRing.length < 5) continue;

      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (const pt of mainRing) {
        if (pt[0] < minLng) minLng = pt[0];
        if (pt[0] > maxLng) maxLng = pt[0];
        if (pt[1] < minLat) minLat = pt[1];
        if (pt[1] > maxLat) maxLat = pt[1];
      }

      // 严谨二维多边形面积质心 (Green's Theorem / Shoelace Polygon Area Centroid)
      // 彻底解决密集海岸线/复杂边缘采样点导致算术均值偏离几何中心的问题
      let area = 0;
      let cx = 0;
      let cy = 0;
      const n = mainRing.length;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const xi = mainRing[i][0];
        const yi = mainRing[i][1];
        const xj = mainRing[j][0];
        const yj = mainRing[j][1];
        const cross = xi * yj - xj * yi;
        area += cross;
        cx += (xi + xj) * cross;
        cy += (yi + yj) * cross;
      }
      area *= 0.5;

      let cLng = (minLng + maxLng) / 2;
      let cLat = (minLat + maxLat) / 2;
      if (Math.abs(area) > 1e-7) {
        const computedLng = cx / (6 * area);
        const computedLat = cy / (6 * area);
        if (computedLng >= minLng && computedLng <= maxLng && computedLat >= minLat && computedLat <= maxLat) {
          cLng = computedLng;
          cLat = computedLat;
        }
      }
      const centroidVec3 = this.latLngToVec3(cLat, cLng, 1.0).normalize();

      const rootGroup = new THREE.Group();
      const liftGroup = new THREE.Group();
      rootGroup.add(liftGroup);

      // 1. 构建顶面地契沙盘多边形三角网格 (Top Cap Mesh - 耳切法 Ear Clipping，严格适配任何凹凸复杂行政区划)
      const topCapPositions: number[] = [];
      const topCapNormals: number[] = [];

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
      const vec3Points = ring2D.map(p => this.latLngToVec3(p[1], p[0], this.radius * 1.003));

      let faces: [number, number, number][] = [];
      try {
        faces = THREE.ShapeUtils.triangulateShape(shapePoints, []) as [number, number, number][];
      } catch (e) {
        console.warn(`[CityElevatorMeshes] Ear Clipping triangulation fallback for ${feature.name}:`, e);
      }

      if (faces && faces.length > 0) {
        for (const face of faces) {
          const i0 = face[0];
          const i1 = face[1];
          const i2 = face[2];
          const v0 = vec3Points[i0];
          const v1 = vec3Points[i1];
          const v2 = vec3Points[i2];
          if (!v0 || !v1 || !v2) continue;

          // 法线方向计算与缠绕方向自适应修正（确保三角形始终朝向球心向外）
          const faceNormal = new THREE.Vector3().crossVectors(
            new THREE.Vector3().subVectors(v1, v0),
            new THREE.Vector3().subVectors(v2, v0)
          ).normalize();

          const sphereOutward = v0.clone().normalize();
          if (faceNormal.dot(sphereOutward) < 0) {
            topCapPositions.push(v0.x, v0.y, v0.z, v2.x, v2.y, v2.z, v1.x, v1.y, v1.z);
            const n0 = v0.clone().normalize();
            const n2 = v2.clone().normalize();
            const n1 = v1.clone().normalize();
            topCapNormals.push(n0.x, n0.y, n0.z, n2.x, n2.y, n2.z, n1.x, n1.y, n1.z);
          } else {
            topCapPositions.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
            const n0 = v0.clone().normalize();
            const n1 = v1.clone().normalize();
            const n2 = v2.clone().normalize();
            topCapNormals.push(n0.x, n0.y, n0.z, n1.x, n1.y, n1.z, n2.x, n2.y, n2.z);
          }
        }
      }

      const topCapGeom = new THREE.BufferGeometry();
      topCapGeom.setAttribute('position', new THREE.Float32BufferAttribute(topCapPositions, 3));
      topCapGeom.setAttribute('normal', new THREE.Float32BufferAttribute(topCapNormals, 3));

      const topCapMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorCfg.topJadeColor),
        roughness: 0.35,
        metalness: 0.15,
        emissive: new THREE.Color(colorCfg.topEmissive),
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.95
      });

      const topCapMesh = new THREE.Mesh(topCapGeom, topCapMat);
      topCapMesh.renderOrder = 4000;
      topCapMesh.visible = false;
      topCapMesh.frustumCulled = false;
      liftGroup.add(topCapMesh);

      // 2. 贴合顶面的【独立切向大字金石书法名标】(Calligraphy Plate)
      const calligraphyTex = this.createCalligraphyPlateTexture(dest, colorCfg);
      const calligraphyGeom = new THREE.PlaneGeometry(0.048, 0.024);
      const calligraphyMat = new THREE.MeshBasicMaterial({
        map: calligraphyTex,
        transparent: true,
        opacity: 0.99,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const calligraphyMesh = new THREE.Mesh(calligraphyGeom, calligraphyMat);
      // 正交切空间切向正立对齐 (Normal = centroidVec3, Up = North)
      const normal = centroidVec3.clone().normalize();
      const northPole = new THREE.Vector3(0, 1, 0);
      const east = new THREE.Vector3().crossVectors(northPole, normal).normalize();
      const north = new THREE.Vector3().crossVectors(normal, east).normalize();
      const rotMatrix = new THREE.Matrix4().makeBasis(east, north, normal);
      calligraphyMesh.quaternion.setFromRotationMatrix(rotMatrix);
      calligraphyMesh.position.copy(centroidVec3).multiplyScalar(this.radius * 1.006);

      calligraphyMesh.renderOrder = 4300;
      calligraphyMesh.visible = false;
      calligraphyMesh.frustumCulled = false;
      liftGroup.add(calligraphyMesh);

      // 3. 顶面传统色流光闭合外框 (Top Border Line)
      const topBorderPoints: THREE.Vector3[] = [];
      for (const pt of mainRing) {
        topBorderPoints.push(this.latLngToVec3(pt[1], pt[0], this.radius * 1.004));
      }
      const topBorderGeom = new THREE.BufferGeometry().setFromPoints(topBorderPoints);
      const topBorderMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(colorCfg.borderColor),
        linewidth: 2,
        transparent: true,
        opacity: 0.98
      });
      const topBorderLine = new THREE.LineLoop(topBorderGeom, topBorderMat);
      topBorderLine.renderOrder = 4100;
      topBorderLine.visible = false;
      topBorderLine.frustumCulled = false;
      liftGroup.add(topBorderLine);

      // 4. 垂直中国传统色流光拔地光壁 (Vertical Skirt Wall)
      const skirtPositions: number[] = [];
      const skirtUnitDirs: number[] = [];
      const skirtIsTop: number[] = [];
      const skirtUvs: number[] = [];
      const totalPts = mainRing.length;

      for (let i = 0; i < totalPts; i++) {
        const nextIdx = (i + 1) % totalPts;
        const pt1 = mainRing[i];
        const pt2 = mainRing[nextIdx];

        const p1 = this.latLngToVec3(pt1[1], pt1[0], this.radius);
        const p2 = this.latLngToVec3(pt2[1], pt2[0], this.radius);
        const u1 = p1.clone().normalize();
        const u2 = p2.clone().normalize();

        const uVal1 = i / totalPts;
        const uVal2 = (i + 1) / totalPts;

        skirtPositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p2.x, p2.y, p2.z);
        skirtUnitDirs.push(u1.x, u1.y, u1.z, u2.x, u2.y, u2.z, u2.x, u2.y, u2.z);
        skirtIsTop.push(0.0, 0.0, 1.0);
        skirtUvs.push(uVal1, 0.0, uVal2, 0.0, uVal2, 1.0);

        skirtPositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p1.x, p1.y, p1.z);
        skirtUnitDirs.push(u1.x, u1.y, u1.z, u2.x, u2.y, u2.z, u1.x, u1.y, u1.z);
        skirtIsTop.push(0.0, 1.0, 1.0);
        skirtUvs.push(uVal1, 0.0, uVal2, 1.0, uVal1, 1.0);
      }

      const skirtGeom = new THREE.BufferGeometry();
      skirtGeom.setAttribute('position', new THREE.Float32BufferAttribute(skirtPositions, 3));
      skirtGeom.setAttribute('aUnitDir', new THREE.Float32BufferAttribute(skirtUnitDirs, 3));
      skirtGeom.setAttribute('aIsTop', new THREE.Float32BufferAttribute(skirtIsTop, 1));
      skirtGeom.setAttribute('uv', new THREE.Float32BufferAttribute(skirtUvs, 2));
      skirtGeom.computeBoundingSphere();

      const skirtMaterial = new THREE.ShaderMaterial({
        vertexShader: ElevatorSkirtShader.vertexShader,
        fragmentShader: ElevatorSkirtShader.fragmentShader,
        uniforms: {
          uTime: { value: 0.0 },
          uElevation: { value: 0.0 },
          uRadius: { value: this.radius * 1.001 },
          uPrimaryColor: { value: new THREE.Color(colorCfg.primary) },
          uGlowColor: { value: new THREE.Color(colorCfg.glow) },
          uAccentColor: { value: new THREE.Color(colorCfg.accent) },
          uIsSelected: { value: 0.0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const skirtMesh = new THREE.Mesh(skirtGeom, skirtMaterial);
      skirtMesh.renderOrder = 3800;
      skirtMesh.visible = false;
      skirtMesh.frustumCulled = false;
      rootGroup.add(skirtMesh);

      this.group.add(rootGroup);

      this.items.push({
        cityId,
        cityName: feature.name,
        dest,
        feature,
        colorConfig: colorCfg,
        bbox: { minLng, maxLng, minLat, maxLat },
        mainRing,
        centroid: { lat: cLat, lng: cLng },
        centroidVec3,
        rootGroup,
        liftGroup,
        topCapMesh,
        calligraphyMesh,
        topBorderLine,
        skirtMesh,
        skirtMaterial,
        currentElevation: 0.0,
        targetElevation: 0.0,
        isHovered: false,
        isSelected: false
      });
    }
  }

  private resolveDestinationId(featureName: string): string | undefined {
    return CITY_NAME_TO_ID[featureName]
      || this.destinations.find(destination =>
        destination.cityName === featureName
        || destination.cityName.replace(/市$/, '') === featureName
      )?.id;
  }

  public setHoveredCity(cityId: string | null, _localHitPoint?: THREE.Vector3) {
    this.hoveredCityId = cityId;
    for (const item of this.items) {
      item.isHovered = item.cityId === cityId;
      this.updateTargetElevation(item);
    }
  }

  public setSelectedCity(cityId: string | null) {
    this.selectedCityId = cityId;
    for (const item of this.items) {
      item.isSelected = item.cityId === cityId;
      item.skirtMaterial.uniforms.uIsSelected.value = item.isSelected ? 1.0 : 0.0;
      this.updateTargetElevation(item);
    }
  }

  private updateTargetElevation(item: CityElevatorItem) {
    if (item.isSelected) {
      item.targetElevation = 0.048;
    } else if (item.isHovered) {
      item.targetElevation = 0.036;
    } else {
      item.targetElevation = 0.000;
    }
  }

  public update(delta: number, time: number, cameraDist = 8.8) {
    // LOD 由共享体验状态派生，城市沙盘是城市视界的唯一 WebGL 主人。
    const isCityScale = getLodVisibility(cameraDist).cityElevator;
    const lerpSpeed = Math.min(1.0, delta * 14.0);

    for (const item of this.items) {
      if (!isCityScale) {
        item.currentElevation = 0.0;
        item.targetElevation = 0.0;
        item.topCapMesh.visible = false;
        item.calligraphyMesh.visible = false;
        item.topBorderLine.visible = false;
        item.skirtMesh.visible = false;
        item.liftGroup.position.set(0, 0, 0);
        item.skirtMaterial.uniforms.uElevation.value = 0.0;
        continue;
      }

      item.currentElevation += (item.targetElevation - item.currentElevation) * lerpSpeed;
      const elev = item.currentElevation;

      const isVisible = elev > 0.001;
      item.topCapMesh.visible = isVisible;
      item.calligraphyMesh.visible = isVisible;
      item.topBorderLine.visible = isVisible;
      item.skirtMesh.visible = isVisible;

      if (isVisible) {
        item.liftGroup.position.copy(item.centroidVec3).multiplyScalar(elev);
        item.skirtMaterial.uniforms.uElevation.value = elev;
        item.skirtMaterial.uniforms.uTime.value = time;
      } else {
        item.liftGroup.position.set(0, 0, 0);
        item.skirtMaterial.uniforms.uElevation.value = 0.0;
      }
    }
  }
}
