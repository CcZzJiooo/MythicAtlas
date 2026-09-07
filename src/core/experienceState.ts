/**
 * Shared experience state for the first Gate 1 slice.
 *
 * This module is the single semantic source for dimension, camera distance,
 * globe LOD, scroll hand-off, navigation activation and interaction ownership.
 * Renderers and DOM components consume the derived values; they do not invent
 * their own distance thresholds.
 */

export type DimensionMode = 'globe' | 'diorama' | 'beast';
export type ActiveNavItem = DimensionMode | 'scroll';
export type ExperienceSection = 'hero' | 'scroll';
export type GlobeViewMode = 'macro' | 'province' | 'city';
export type InteractionOwner = 'globe' | 'province' | 'city' | 'diorama' | 'beast' | 'scroll';

export const EXPERIENCE_GEOMETRY = {
  earthRadius: 2.0,
  camera: {
    min: 2.12,
    // 市级聚焦落点定为 2.20 (硬性规定)
    focus: 2.20,
    // 省级名片点击后自动跳转到 2.40 (硬性规定)
    provinceEntry: 2.40,
    selection: 3.2,
    overview: 5.4,
    // 2.40 以下市级名片可以被感应 / 小于等于 2.40 省级名片消失 (硬性规定)
    cityBoundary: 2.40,
    // 大于 5.00 时省级名片不显示 (硬性规定)
    provinceMax: 5.00,
    max: 11.5,
    diorama: 4.0,
    beast: 3.6,
    scenicWarp: 2.8,
    warpPeakMin: 2.15,
    idleRotationMin: 3.6
  },
  scroll: {
    webglLock: 50,
    navigationHandoff: 180,
    wheelCapture: 20,
    maxCameraEpsilon: 0.2
  },
  overlay: {
    zoomStart: 2.4,
    zoomEnd: 7.2,
    provincialBadge: {
      worldWidth: 0.10,
      worldHeight: 0.05,
      nearScale: 1.0,
      farScale: 1.0,
      hitRadius: 80
    }
  },
  fade: {
    armillaryStart: 5.4,
    armillaryEnd: 3.8,
    // 2.50 到 2.40 省级名片平滑渐入渐出 (硬性规定)
    provincialCloseEnd: 2.50,
    // 大于 5.00 省级名片消失，4.60 到 5.00 平滑渐出
    provincialFarStart: 4.60
  },
  gauge: {
    tierOneEnd: 0.2,
    tierTwoEnd: 0.5,
    tierThreeEnd: 0.85
  }
} as const;

export const GAUGE_STATIONS = [
  { key: 'micro', label: '洞天', distance: EXPERIENCE_GEOMETRY.camera.min, progress: 0.0, title: '洞天福地 · 芥子微芒' },
  { key: 'province', label: '山海', distance: EXPERIENCE_GEOMETRY.camera.selection, progress: 1 / 3, title: '山海九野 · 境域全貌' },
  { key: 'nation', label: '神州', distance: EXPERIENCE_GEOMETRY.camera.overview, progress: 2 / 3, title: '神州浩土 · 坤舆万国' },
  { key: 'macro', label: '太虚', distance: EXPERIENCE_GEOMETRY.camera.max, progress: 1.0, title: '太虚无垠 · 俯瞰大荒' }
] as const;

export interface ExperienceState {
  readonly dimension: DimensionMode;
  readonly globeView: GlobeViewMode;
  readonly cameraDistance: number;
  readonly targetCameraDistance: number;
  readonly scrollY: number;
  readonly maxScroll: number;
  readonly activeSection: ExperienceSection;
  readonly activeDestinationId: string | null;
  readonly activeGate2SampleId: string | null;
  readonly selectedDestinationId: string | null;
  readonly hoveredDestinationId: string | null;
  readonly dossierOpen: boolean;
  readonly reducedMotion: boolean;
}

export type ExperienceStateListener = (state: ExperienceState) => void;

export function clampCameraDistance(distance: number): number {
  return Math.min(
    EXPERIENCE_GEOMETRY.camera.max,
    Math.max(EXPERIENCE_GEOMETRY.camera.min, distance),
  );
}

export function getGlobeViewMode(cameraDistance: number): GlobeViewMode {
  const distance = clampCameraDistance(cameraDistance);
  if (distance <= EXPERIENCE_GEOMETRY.camera.cityBoundary) return 'city';
  if (distance <= EXPERIENCE_GEOMETRY.camera.provinceMax) return 'province';
  return 'macro';
}

/**
 * 司天玉衡四层境界等距映射：确保 4 大境界站点在 220px 轨条上呈严格 33.33% 等距和谐分布
 */
export function getGaugeProgress(cameraDistance: number): number {
  const d = clampCameraDistance(cameraDistance);
  const d0 = EXPERIENCE_GEOMETRY.camera.min;        // 2.12 (洞天 0.0)
  const d1 = EXPERIENCE_GEOMETRY.camera.selection;  // 3.20 (山海 0.333)
  const d2 = EXPERIENCE_GEOMETRY.camera.overview;   // 5.40 (神州 0.667)
  const d3 = EXPERIENCE_GEOMETRY.camera.max;        // 11.50 (太虚 1.0)

  if (d <= d0) return 0.0;
  if (d >= d3) return 1.0;

  if (d < d1) {
    return ((d - d0) / (d1 - d0)) * (1 / 3);
  }
  if (d < d2) {
    return (1 / 3) + ((d - d1) / (d2 - d1)) * (1 / 3);
  }
  return (2 / 3) + ((d - d2) / (d3 - d2)) * (1 / 3);
}

/**
 * 游标拖拽反向求视距
 */
export function getGaugeDistance(progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  const d0 = EXPERIENCE_GEOMETRY.camera.min;
  const d1 = EXPERIENCE_GEOMETRY.camera.selection;
  const d2 = EXPERIENCE_GEOMETRY.camera.overview;
  const d3 = EXPERIENCE_GEOMETRY.camera.max;

  if (p <= 0) return d0;
  if (p >= 1) return d3;

  if (p < 1 / 3) {
    return d0 + (p / (1 / 3)) * (d1 - d0);
  }
  if (p < 2 / 3) {
    return d1 + ((p - 1 / 3) / (1 / 3)) * (d2 - d1);
  }
  return d2 + ((p - 2 / 3) / (1 / 3)) * (d3 - d2);
}

export function getGaugeTier(cameraDistance: number): string {
  const d = clampCameraDistance(cameraDistance);
  const d0 = EXPERIENCE_GEOMETRY.camera.min;        // 2.12
  const d1 = EXPERIENCE_GEOMETRY.camera.selection;  // 3.20
  const d2 = EXPERIENCE_GEOMETRY.camera.overview;   // 5.40
  const d3 = EXPERIENCE_GEOMETRY.camera.max;        // 11.50

  const mid01 = (d0 + d1) / 2; // (2.12 + 3.20)/2 = 2.66
  const mid12 = (d1 + d2) / 2; // (3.20 + 5.40)/2 = 4.30
  const mid23 = (d2 + d3) / 2; // (5.40 + 11.50)/2 = 8.45

  if (d < mid01) return '洞天';
  if (d < mid12) return '山海';
  if (d < mid23) return '神州';
  return '太虚';
}

/**
 * 【紫檀嵌金 · 地官勘舆量地尺】五大通用地貌与微距探微境界站点
 * 黄金等距 0.25 (25%) 分割，自 0.25m 峰巅微距特写至 7.60m 大案全貌
 */
export const DIORAMA_GAUGE_STATIONS = [
  { key: 'micro', label: '探微', distance: 0.25, progress: 0.00, title: '峰巅仙境 · 凌霄探微' },
  { key: 'city', label: '城邑', distance: 0.85, progress: 0.25, title: '城邑印台 · 州府微芒' },
  { key: 'mountain', label: '名山', distance: 1.80, progress: 0.50, title: '名山水脉 · 金石奇观' },
  { key: 'province', label: '省域', distance: 3.80, progress: 0.75, title: '省域全境 · 金碧山水' },
  { key: 'table', label: '大案', distance: 7.60, progress: 1.00, title: '紫檀须弥 · 案台全貌' }
] as const;

export function clampDioramaDistance(distance: number): number {
  return Math.min(7.60, Math.max(0.20, distance));
}

export function getDioramaGaugeProgress(distance: number): number {
  const d = clampDioramaDistance(distance);
  const d0 = 0.25;
  const d1 = 0.85;
  const d2 = 1.80;
  const d3 = 3.80;
  const d4 = 7.60;

  if (d <= d0) return 0.0;
  if (d >= d4) return 1.0;

  if (d < d1) {
    return ((d - d0) / (d1 - d0)) * 0.25;
  }
  if (d < d2) {
    return 0.25 + ((d - d1) / (d2 - d1)) * 0.25;
  }
  if (d < d3) {
    return 0.50 + ((d - d2) / (d3 - d2)) * 0.25;
  }
  return 0.75 + ((d - d3) / (d4 - d3)) * 0.25;
}

export function getDioramaGaugeDistance(progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  const d0 = 0.25;
  const d1 = 0.85;
  const d2 = 1.80;
  const d3 = 3.80;
  const d4 = 7.60;

  if (p <= 0) return d0;
  if (p >= 1) return d4;

  if (p < 0.25) {
    return d0 + (p / 0.25) * (d1 - d0);
  }
  if (p < 0.50) {
    return d1 + ((p - 0.25) / 0.25) * (d2 - d1);
  }
  if (p < 0.75) {
    return d2 + ((p - 0.50) / 0.25) * (d3 - d2);
  }
  return d3 + ((p - 0.75) / 0.25) * (d4 - d3);
}

export function getDioramaGaugeTier(distance: number): string {
  const d = clampDioramaDistance(distance);
  if (d <= 0.55) return '探微';
  if (d <= 1.30) return '城邑';
  if (d <= 2.80) return '名山';
  if (d <= 5.50) return '省域';
  return '大案';
}

export function getExperienceSection(scrollY: number): ExperienceSection {
  return scrollY < EXPERIENCE_GEOMETRY.scroll.navigationHandoff ? 'hero' : 'scroll';
}

export function getActiveNavItem(state: Pick<ExperienceState, 'dimension' | 'activeSection'>): ActiveNavItem {
  return state.activeSection === 'scroll' ? 'scroll' : state.dimension;
}

export function getInteractionOwner(
  state: Pick<ExperienceState, 'dimension' | 'globeView' | 'activeSection'>,
): InteractionOwner {
  if (state.activeSection === 'scroll') return 'scroll';
  if (state.dimension === 'diorama') return 'diorama';
  if (state.dimension === 'beast') return 'beast';
  if (state.globeView === 'city') return 'city';
  if (state.globeView === 'province') return 'province';
  return 'globe';
}

export function getLodVisibility(cameraDistance: number): {
  cityElevator: boolean;
  provincialBadges: boolean;
  macroOverlay: boolean;
} {
  const viewMode = getGlobeViewMode(cameraDistance);
  return {
    cityElevator: viewMode === 'city',
    provincialBadges: viewMode !== 'city',
    macroOverlay: viewMode === 'macro'
  };
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function statesEqual(a: ExperienceState, b: ExperienceState): boolean {
  return Object.keys(a).every(key => a[key as keyof ExperienceState] === b[key as keyof ExperienceState]);
}

export class ExperienceStateStore {
  private state: ExperienceState;
  private readonly listeners = new Set<ExperienceStateListener>();

  constructor(initial: Partial<ExperienceState> = {}) {
    const cameraDistance = clampCameraDistance(initial.cameraDistance ?? EXPERIENCE_GEOMETRY.camera.overview);
    const targetCameraDistance = clampCameraDistance(
      initial.targetCameraDistance ?? cameraDistance,
    );
    const scrollY = Math.max(0, initial.scrollY ?? 0);

    this.state = {
      dimension: initial.dimension ?? 'globe',
      globeView: getGlobeViewMode(cameraDistance),
      cameraDistance,
      targetCameraDistance,
      scrollY,
      maxScroll: Math.max(0, initial.maxScroll ?? 0),
      activeSection: getExperienceSection(scrollY),
      activeDestinationId: initial.activeDestinationId ?? null,
      activeGate2SampleId: initial.activeGate2SampleId ?? null,
      selectedDestinationId: initial.selectedDestinationId ?? null,
      hoveredDestinationId: initial.hoveredDestinationId ?? null,
      dossierOpen: initial.dossierOpen ?? false,
      reducedMotion: initial.reducedMotion ?? prefersReducedMotion()
    };
  }

  public getState(): ExperienceState {
    return this.state;
  }

  public subscribe(listener: ExperienceStateListener, emitCurrent = true): () => void {
    this.listeners.add(listener);
    if (emitCurrent) listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public setDimension(dimension: DimensionMode): void {
    this.update({ dimension });
  }

  public setCameraDistance(cameraDistance: number, targetCameraDistance = this.state.targetCameraDistance): void {
    this.update({ cameraDistance, targetCameraDistance });
  }

  public setTargetCameraDistance(targetCameraDistance: number): void {
    this.update({ targetCameraDistance });
  }

  public setScroll(scrollY: number, maxScroll: number): void {
    this.update({ scrollY, maxScroll });
  }

  public setActiveDestination(destinationId: string | null): void {
    this.update({ activeDestinationId: destinationId });
  }

  public setActiveGate2Sample(sampleId: string | null): void {
    this.update({ activeGate2SampleId: sampleId });
  }

  public setSelectedDestination(destinationId: string | null): void {
    this.update({ selectedDestinationId: destinationId });
  }

  public setHoveredDestination(destinationId: string | null): void {
    this.update({ hoveredDestinationId: destinationId });
  }

  public setDossierOpen(dossierOpen: boolean): void {
    this.update({ dossierOpen });
  }

  public update(patch: Partial<ExperienceState>): void {
    const cameraDistance = clampCameraDistance(patch.cameraDistance ?? this.state.cameraDistance);
    const targetCameraDistance = clampCameraDistance(
      patch.targetCameraDistance ?? this.state.targetCameraDistance,
    );
    const scrollY = Math.max(0, patch.scrollY ?? this.state.scrollY);
    const nextState: ExperienceState = {
      ...this.state,
      ...patch,
      globeView: getGlobeViewMode(cameraDistance),
      cameraDistance,
      targetCameraDistance,
      scrollY,
      maxScroll: Math.max(0, patch.maxScroll ?? this.state.maxScroll),
      activeSection: getExperienceSection(scrollY)
    };

    if (statesEqual(this.state, nextState)) return;
    this.state = nextState;
    this.listeners.forEach(listener => listener(this.state));
  }
}

export const experienceState = new ExperienceStateStore();
