export interface ProvincialBadgeConfig {
  readonly id: string;
  readonly provCode: string;
  readonly provName: string;
  readonly shortTag: string;
  readonly honorTitle: string;
  readonly guardianName: string;
  readonly guardianIcon: string;
  /** 省域主体内部锚点；不可复用省会城市中心坐标。 */
  readonly coords: { readonly lat: number; readonly lng: number };
  readonly themeColor: string;
  readonly glowColor: string;
  readonly sealLabel: string;
  readonly regionSummary: string;
  readonly enterHint: string;
  readonly gate2SampleId?: string;
  /** 严格匹配省域物理几何范围的世界三维尺寸，杜绝文字越出本省版图 */
  readonly worldWidth?: number;
  readonly worldHeight?: number;
}

/**
 * Provincial presentation data is separate from geometry and destinations.
 * A pending region may have a presentation record only when its pending state
 * is explicit; this file must not turn it into an approved boundary or a
 * made-up province card.
 */
export const PROVINCIAL_BADGES_DATA: Readonly<Record<string, ProvincialBadgeConfig>> = {
  guangdong: {
    id: 'guangdong',
    provCode: 'GD',
    provName: '广东省',
    shortTag: '岭南',
    honorTitle: '广东省 · 岭南',
    guardianName: '麒麟守护',
    guardianIcon: '✨',
    // 黄金正心几何中心：锁定在 (113.78E, 23.46N)，两端距粤桂、粤闽省界均留有充足安全空间
    coords: { lat: 23.46, lng: 113.78 },
    themeColor: '#D4AF37',
    glowColor: '#10B981',
    sealLabel: '✦ 华夏神州 · 岭南粤境 ✦',
    regionSummary: '✦ 广府潮客 · 雷琼山海 ✦',
    enterHint: '',
    worldWidth: 0.14,
    worldHeight: 0.098
  },
  zhejiang: {
    id: 'zhejiang',
    provCode: 'ZJ',
    provName: '浙江省',
    shortTag: '钱塘',
    honorTitle: '浙江省 · 钱塘',
    guardianName: '青鸾守护',
    guardianIcon: '🕊️',
    // 浙江省主体边界面积质心约为 120.1082E, 29.1696N
    coords: { lat: 29.1696, lng: 120.1082 },
    themeColor: '#5B8266',
    glowColor: '#B1D5C8',
    sealLabel: '✦ 江南水乡 · 诗画之境 ✦',
    regionSummary: '✦ 钱塘西子 · 诗画江南 ✦',
    enterHint: '✦ 单击进入江南水乡 · 行政边界复核中 ✦',
    gate2SampleId: 'non-gd-jiangnan-candidate',
    worldWidth: 0.11,
    worldHeight: 0.077
  }
};
