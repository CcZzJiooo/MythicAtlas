/**
 * MythicAtlas · 《新山海图志 · 万国山海经》
 * Canonical type definitions.
 *
 * `src/types.ts` is intentionally only a compatibility barrel.  All feature
 * modules must resolve their types from this file so that a future national
 * or global catalog does not create a second destination model.
 */

export type ClimateElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export type TimeStandard = 'utc' | 'local';

export interface Coordinates {
  readonly lat: number;
  readonly lng: number;
  readonly altitude?: number;
  readonly mapX?: number;
  readonly mapZ?: number;
}

export type ElementType = 'gold' | 'wood' | 'water' | 'fire' | 'earth';

/**
 * A region reference is deliberately broader than the current Guangdong
 * sample.  `key` is stable data identity; `label` is presentation copy; the
 * scope tells future province/country/global records how to nest without
 * changing the destination shape.
 */
export type RegionScope =
  | 'city'
  | 'regional_cluster'
  | 'special_administrative_region'
  | 'province'
  | 'country'
  | 'global';

export interface RegionReference {
  readonly key: string;
  readonly label: string;
  readonly scope: RegionScope;
  readonly parentKey?: string;
  readonly code?: string;
}

export interface DestinationTheme {
  readonly primary: string;
  readonly secondary?: string;
  readonly accent: string;
  readonly glow: string;
}

export interface GuardianSpirit {
  name: string;              // 岭南神兽/异鸟真名 (如: 仙五羊, 鲲鹏, 夫诸, 醒狮, 毕方, 烛龙, 霸下)
  title: string;             // 神阶尊号
  classicQuote: string;      // 《山海经》/《南越志》原文引录
  domainPower: string;       // 司掌神能
  symbolIcon: string;        // 意象符号
}

export interface SealData {
  sealName: string;          // 印章名 (如: "羊城五仙之印", "大鹏扶摇之玺")
  sealScript: string;        // 四字古篆金石 (如: "穗城瑞谷", "鹏城破浪")
  inkColor: string;          // 钤印主色
  unlockedAt?: number;
}

export interface DestinationItem {
  id: string;
  cityName: string;          // 地级市名 (如: "广州市", "深圳市")
  dayIndex: number;          // 岁时序号
  dateKey: string;           // 对应日期
  solarTerm: string;         // 二十四节气 / 岁时物候 (如: "立秋 · 凉风至")
  modernName: string;        // 现代地理胜景全称 (如: "广州 · 白云仙山与镇海楼")
  ancientMythicName: string; // 岭南神话秘境古称 (如: "羊城五仙神岳")
  region: RegionReference;
  country?: string;          // 国家地区 (如: "中国 · 广东")
  coordinates: Coordinates;
  element: ElementType;      // 五行属性
  colorTheme: DestinationTheme;
  heroImage: string;         // 超高清真实风光全景摄影大图
  heroImageCaption?: string;  // 真实地标拍摄地精准标注 (如: "越秀山·广州博物馆镇海楼古建筑实景")
  galleryImages: string[];   // 多角度多季节真实摄影画廊
  galleryCaptions?: string[]; // 画廊各图片真实地标景点详细标注 (如: ["越秀公园·五羊石雕实景", "白云山·摩星岭云海实景", ...])
  bestSeason: string;        // 最佳游历岁时
  geologyType: string;       // 地质地貌与自然遗产科学分类
  mythicPoem: string;        // 古风文言赞赋 (竖排书法呈现)
  mythicLore: string;        // 《山海异志·南越录》玄秘考证
  realHistory: string;       // 真实地理人文胜迹与历史遗产纪实
  guardian: GuardianSpirit;  // 岭南守护神兽
  seal: SealData;            // 专属朱砂钤印
  landscapeTag: string;      // 胜景标签 (名山 / 海岛 / 古邑 / 溶洞 / 梯瀑)
}

export interface UserProgress {
  collectedSeals: string[];
  visitedDestinations: string[];
  customNotes: Record<string, string>;
  oracleDateOffset: number;
  isOracleMode: boolean;
}

export interface CalendarStatus {
  todayIndex: number;
  todayKey: string;
  todayDestination: DestinationItem;
  pastDestinations: DestinationItem[];
  futureDestinations: DestinationItem[];
  nextUnlockTime: number;
  countdownStr: string;
}

/**
 * Compatibility name for the legacy scene implementation.  It is an alias,
 * not a second schema: all fields resolve to the canonical DestinationItem.
 */
export type Destination = DestinationItem;

export interface UnlockSnapshot {
  readonly epochDay: number;
  readonly unlockIndex: number;
  readonly unlockedCount: number;
  readonly cycle: number;
  readonly nextUnlockAt: Date;
  readonly millisecondsUntilNext: number;
  readonly timeStandard: TimeStandard;
}

export interface ExplorationProgress {
  readonly version: 1;
  readonly discoveredIds: readonly string[];
  readonly stampedIds: readonly string[];
  readonly loreIds: readonly string[];
  readonly lastVisitedId: string | null;
  readonly timeStandard: TimeStandard;
}

export interface SceneCapabilities {
  readonly quality: 'high' | 'balanced' | 'low' | 'fallback';
  readonly pixelRatio: number;
  readonly particleCount: number;
  readonly postProcessing: boolean;
  readonly reducedMotion: boolean;
}
