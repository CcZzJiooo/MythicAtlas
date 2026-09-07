import type { RegionReference } from '../types';
import { createRegionReference } from './regions';
import { isGate2PearlDensityMediaReady } from './gate2PearlDensityMedia';

/**
 * Gate 2 is a pressure-test manifest, not a second destination catalog.
 * Destination records remain owned by destinations.ts; this file only
 * describes representative samples, their risks, and evidence requirements.
 */
export type Gate2SampleKind =
  | 'dense_city_cluster'
  | 'neighbor_cluster'
  | 'multipolygon_boundary'
  | 'coastal_closure'
  | 'mountain_long_text'
  | 'non_guangdong_candidate'
  | 'non_guangdong_slice';

export type Gate2DataReadiness =
  | 'catalog_present'
  | 'candidate_pending_catalog';

export type Gate2GeometryReadiness =
  | 'existing_sample_geometry'
  | 'candidate_pending_geometry';

export type Gate2MediaReadiness =
  | 'provenance_pending'
  | 'catalog_approved'
  | 'candidate_pending_media';

export type Gate2CheckId =
  | 'load'
  | 'navigation'
  | 'lod_bidirectional'
  | 'city_selection'
  | 'drawer_lifecycle'
  | 'scroll_ownership'
  | 'diorama'
  | 'beast_return'
  | 'passport'
  | 'responsive'
  | 'keyboard_touch'
  | 'reduced_motion'
  | 'degraded_webgl'
  | 'invalid_media';

export interface Gate2FlowStep {
  readonly id: Gate2CheckId;
  readonly label: string;
  readonly owner: string;
  readonly evidenceBoundary: string;
}

export interface Gate2GoldenSlice {
  readonly id: string;
  readonly title: string;
  readonly kind: Gate2SampleKind;
  readonly region: RegionReference;
  readonly destinationIds: readonly string[];
  readonly evidenceProfileId?: string;
  readonly riskTags: readonly string[];
  readonly requiredChecks: readonly Gate2CheckId[];
  readonly dataReadiness: Gate2DataReadiness;
  readonly geometryReadiness: Gate2GeometryReadiness;
  readonly mediaReadiness: Gate2MediaReadiness;
  readonly notes: string;
}

const COMMON_FLOW_CHECKS = [
  'load',
  'navigation',
  'lod_bidirectional',
  'city_selection',
  'drawer_lifecycle',
  'scroll_ownership',
  'diorama',
  'beast_return',
  'passport',
  'responsive',
  'keyboard_touch',
  'reduced_motion',
  'degraded_webgl',
  'invalid_media'
] as const satisfies readonly Gate2CheckId[];

const EXISTING_SAMPLE_STATUS = {
  dataReadiness: 'catalog_present',
  geometryReadiness: 'existing_sample_geometry',
  mediaReadiness: 'provenance_pending'
} as const;

const PEARL_DENSITY_SAMPLE_STATUS = {
  ...EXISTING_SAMPLE_STATUS,
  mediaReadiness: isGate2PearlDensityMediaReady() ? 'catalog_approved' : 'provenance_pending'
} as const;

const HANGZHOU_SAMPLE_STATUS = {
  dataReadiness: 'catalog_present',
  geometryReadiness: 'existing_sample_geometry',
  mediaReadiness: 'catalog_approved'
} as const;

const JIANGNAN_SLICE_REGION = createRegionReference(
  'jiangnan_waters',
  '江南水乡 · 钱塘西湖',
  'regional_cluster',
  'china'
);

export const GATE2_FLOW_STEPS: readonly Gate2FlowStep[] = [
  {
    id: 'load',
    label: '加载',
    owner: 'experienceState',
    evidenceBoundary: '源码入口与空数据状态；运行加载表现待用户验证'
  },
  {
    id: 'navigation',
    label: '导航',
    owner: 'Navbar',
    evidenceBoundary: '导航状态写入共享状态；键盘/触摸运行表现待用户验证'
  },
  {
    id: 'lod_bidirectional',
    label: '宏观视界 ↔ 省/区域 ↔ 城市',
    owner: 'ExperienceStateStore',
    evidenceBoundary: '统一 LOD 状态与阈值入口；双向边界运行表现待用户验证'
  },
  {
    id: 'city_selection',
    label: '城市',
    owner: 'LandmarkPins',
    evidenceBoundary: '城市 ID 选择链路；密集点位可读性待用户验证'
  },
  {
    id: 'drawer_lifecycle',
    label: '详情 ↔ 画卷',
    owner: 'DestinationScrollDrawer',
    evidenceBoundary: '抽屉打开/关闭恢复父级上下文；滚动视觉表现待用户验证'
  },
  {
    id: 'scroll_ownership',
    label: '滚动输入主人',
    owner: 'ExperienceStateStore',
    evidenceBoundary: '同一时刻只有当前状态主人消费滚动；运行争用待用户验证'
  },
  {
    id: 'diorama',
    label: '沙盘',
    owner: 'DioramaTerrain / RegionalDiorama3D',
    evidenceBoundary: '广东专用地形与非广东区域切片沙盘分层；跨区域运行表现待用户验证'
  },
  {
    id: 'beast_return',
    label: '神兽 ↔ 返回城市',
    owner: 'MythicBeast3D',
    evidenceBoundary: '神兽使用当前目的地并能回到父级城市上下文；运行表现待用户验证'
  },
  {
    id: 'passport',
    label: '通关文牒',
    owner: 'ExplorationProgress',
    evidenceBoundary: '读取共享访问/盖章状态；真实用户流程待用户验证'
  },
  {
    id: 'responsive',
    label: '窄屏与最小视口',
    owner: 'Responsive layout',
    evidenceBoundary: '结构声明已纳入样本检查；实际断点表现待用户验证'
  },
  {
    id: 'keyboard_touch',
    label: '键盘与触摸',
    owner: 'Active input owner',
    evidenceBoundary: '输入归属已纳入状态矩阵；设备实测待用户验证'
  },
  {
    id: 'reduced_motion',
    label: '减少动效',
    owner: 'SceneCapabilities',
    evidenceBoundary: '能力状态有统一入口；动画降级表现待用户验证'
  },
  {
    id: 'degraded_webgl',
    label: 'WebGL 降级',
    owner: 'SceneCapabilities',
    evidenceBoundary: 'fallback 是明确状态；真实不支持环境待用户验证'
  },
  {
    id: 'invalid_media',
    label: '缺失/异常图片',
    owner: 'Media readiness',
    evidenceBoundary: '素材状态不得冒充通过；实际错误展示待用户验证'
  }
];

export const GATE2_PRESSURE_CHECKS: readonly Gate2CheckId[] = [
  'load',
  'navigation',
  'lod_bidirectional',
  'city_selection',
  'drawer_lifecycle',
  'scroll_ownership',
  'diorama',
  'beast_return',
  'passport',
  'responsive',
  'keyboard_touch',
  'reduced_motion',
  'degraded_webgl',
  'invalid_media'
];

export const GATE2_GOLDEN_SLICES: readonly Gate2GoldenSlice[] = [
  {
    id: 'gd-pearl-density',
    title: '珠三角高密度城市切片',
    kind: 'dense_city_cluster',
    region: createRegionReference('pearl_river_delta', '珠三角 · 高密度样板'),
    destinationIds: ['guangzhou', 'foshan', 'dongguan', 'shenzhen'],
    riskTags: ['dense-pins', 'rapid-selection', 'lod-boundary', 'long-navigation'],
    requiredChecks: COMMON_FLOW_CHECKS,
    ...PEARL_DENSITY_SAMPLE_STATUS,
    notes: '本轮已完成珠三角高密度样本当前引用 16 张图片的来源、拍摄日期、分辨率、对应性、许可和 SHA-256 台账；全部条目达到 catalog_approved，但这只关闭 media readiness，不等于 Gate2 整体通过。'
  },
  {
    id: 'gd-chaoshan-neighbor',
    title: '粤东潮汕相邻文化簇',
    kind: 'neighbor_cluster',
    region: createRegionReference('chaoshan_east', '粤东 · 潮汕相邻样板'),
    destinationIds: ['shantou', 'chaozhou', 'jieyang'],
    riskTags: ['neighbor-selection', 'regional-label', 'long-copy', 'drawer-return'],
    requiredChecks: COMMON_FLOW_CHECKS,
    ...EXISTING_SAMPLE_STATUS,
    notes: '验证相邻城市选择与区域标签切换，不新增第二套潮汕专用 UI。'
  },
  {
    id: 'gd-hk-macau-multipolygon',
    title: '港澳多环与岛屿边界切片',
    kind: 'multipolygon_boundary',
    region: createRegionReference('greater_bay_area', '大湾区 · 港澳边界样板'),
    destinationIds: ['hongkong', 'macau'],
    riskTags: ['multipolygon', 'island-boundary', 'special-administrative-region', 'narrow-viewport'],
    requiredChecks: COMMON_FLOW_CHECKS,
    ...EXISTING_SAMPLE_STATUS,
    notes: '现有边界入口必须按多环/岛屿风险接受压力检查，不能仅凭单环视觉判断。'
  },
  {
    id: 'gd-west-coast-closure',
    title: '粤西海岸闭合切片',
    kind: 'coastal_closure',
    region: createRegionReference('western_guangdong_coast', '粤西 · 海岸闭合样板'),
    destinationIds: ['zhanjiang', 'maoming'],
    riskTags: ['coast-closure', 'sea-land-adjacency', 'diorama-terrain', 'boundary-join'],
    requiredChecks: COMMON_FLOW_CHECKS,
    ...EXISTING_SAMPLE_STATUS,
    notes: '重点记录海岸闭合、海陆相邻判断和沙盘地貌表现；广东专用地形仍未通用化。'
  },
  {
    id: 'gd-mountain-longtext',
    title: '粤北山地与长文本切片',
    kind: 'mountain_long_text',
    region: createRegionReference('nanling_north', '粤北 · 山地长文本样板'),
    destinationIds: ['shaoguan', 'meizhou'],
    riskTags: ['mountain-elevation', 'long-poem', 'long-history', 'scroll-ownership'],
    requiredChecks: COMMON_FLOW_CHECKS,
    ...EXISTING_SAMPLE_STATUS,
    notes: '同时压力测试山地语义、长诗文、历史文案和详情滚动，不以截断文本掩盖布局问题。'
  },
  {
    id: 'non-gd-jiangnan-candidate',
    title: '江南水乡杭州跨区域城市切片',
    kind: 'non_guangdong_slice',
    region: JIANGNAN_SLICE_REGION,
    destinationIds: ['hangzhou'],
    evidenceProfileId: 'hangzhou-jiangnan-candidate',
    riskTags: ['non-guangdong', 'boundary-review', 'local-media', 'culture-token'],
    requiredChecks: COMMON_FLOW_CHECKS,
    ...HANGZHOU_SAMPLE_STATUS,
    notes: '杭州已进入唯一目的地目录并具备本地高清媒体与 OSM WGS84 边界样本；跨源行政边界复核、端到端运行检查和用户验收仍未完成，不能把样板称为 Gate2 通过。'
  }
];

const EMPTY_DESTINATION_IDS: readonly string[] = [];

export function getGate2SampleDestinationIds(sampleId: string): readonly string[] {
  return GATE2_GOLDEN_SLICES.find(sample => sample.id === sampleId)?.destinationIds
    ?? EMPTY_DESTINATION_IDS;
}

export function getGate2SamplesByCheck(checkId: Gate2CheckId): readonly Gate2GoldenSlice[] {
  return GATE2_GOLDEN_SLICES.filter(sample => sample.requiredChecks.includes(checkId));
}

export function getGate2SampleById(sampleId: string): Gate2GoldenSlice | undefined {
  return GATE2_GOLDEN_SLICES.find(sample => sample.id === sampleId);
}

export function getGate2SampleForDestination(destinationId: string): Gate2GoldenSlice | undefined {
  return GATE2_GOLDEN_SLICES.find(sample => sample.destinationIds.includes(destinationId));
}
