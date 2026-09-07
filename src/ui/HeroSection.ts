import type { DestinationItem } from '../types';
import {
  EXPERIENCE_GEOMETRY,
  experienceState,
  GAUGE_STATIONS,
  DIORAMA_GAUGE_STATIONS,
  getGaugeProgress,
  getGaugeDistance,
  getGaugeTier,
  getDioramaGaugeProgress,
  getDioramaGaugeDistance,
  getDioramaGaugeTier,
  clampDioramaDistance,
  type DimensionMode
} from '../core/experienceState';
import { LunarMansionItem } from '../data/lunarMansions';
import { CITY_TRADITIONAL_COLORS } from '../webgl/CityElevatorMeshes';
import { CITY_ADMINISTRATIVE_DATA } from '../webgl/LandmarkPins';
import {
  FAMOUS_MOUNTAINS,
  FamousMountainDef,
  type DioramaInteractableHit,
  type DioramaProbeData,
  type DioramaTimeMode
} from '../webgl/GuangdongTerrain3D';
import { DestinationScrollDrawer } from './DestinationScrollDrawer';
import { getBeastSvgIcon } from './MythicBeastIcons';
import { SoundEngine } from '../core/SoundEngine';

export class HeroSection {
  private element: HTMLElement;
  private currentDest: DestinationItem;
  private isStamped: boolean = false;
  private get currentDimension(): DimensionMode {
    return experienceState.getState().dimension;
  }
  private hoveredCity: DestinationItem | null = null;
  private hoveredMansion: LunarMansionItem | null = null;
  private scrollDrawer!: DestinationScrollDrawer;

  private onReturnToGlobe: () => void;
  private onStampClick: (cityId: string) => void;
  private onEnterScenic?: (dest: DestinationItem) => void;
  private onZoomIn?: () => void;
  private onZoomOut?: () => void;
  private onResetView?: () => void;
  private onDimensionSwitch?: (mode: DimensionMode) => void;
  private onSetCameraZ?: (targetZ: number, animated: boolean) => void;
  private onViewScroll?: () => void;
  private onDioramaLayerSwitch?: (layer: 'topography' | 'landforms' | 'mountains' | 'waters' | 'roads' | 'cities') => void;
  private onDioramaTimeOfDaySwitch?: (mode: DioramaTimeMode) => void;
  private onDioramaMountainSelect?: (mountainId: string) => void;
  private onDioramaMountainDeselect?: () => void;

  private minZ: number = EXPERIENCE_GEOMETRY.camera.min;
  private maxZ: number = EXPERIENCE_GEOMETRY.camera.max;
  private isDraggingGauge: boolean = false;
  private isDraggingDioramaGauge: boolean = false;
  private isLayerSelectorFolded: boolean = false;
  private isLegendFolded: boolean = false;
  private isMountainDockFolded: boolean = true;
  private currentMountainRegion: string = 'all';
  private currentCameraZ: number = EXPERIENCE_GEOMETRY.camera.overview;
  private currentDioramaDistance: number = 2.20;
  private foldLayerSelectorTimer: number | null = null;
  private foldLegendTimer: number | null = null;
  private foldMountainDockTimer: number | null = null;
  private sound: SoundEngine;
  private unsubscribeState?: () => void;

  private cachedProbeHud: HTMLElement | null = null;
  private cachedProbeTier: HTMLElement | null = null;
  private cachedProbeAlt: HTMLElement | null = null;
  private cachedProbeTitle: HTMLElement | null = null;
  private cachedProbeCoords: HTMLElement | null = null;

  constructor(
    initialDest: DestinationItem,
    isStamped: boolean = false,
    onReturnToGlobe: () => void,
    onStampClick: (cityId: string) => void,
    onEnterScenic?: (dest: DestinationItem) => void,
    onZoomIn?: () => void,
    onZoomOut?: () => void,
    onResetView?: () => void,
    onDimensionSwitch?: (mode: DimensionMode) => void,
    onSetCameraZ?: (targetZ: number, animated: boolean) => void,
    onViewScroll?: () => void,
    onDioramaLayerSwitch?: (layer: 'topography' | 'landforms' | 'mountains' | 'waters' | 'roads' | 'cities') => void,
    onDioramaTimeOfDaySwitch?: (mode: DioramaTimeMode) => void,
    onDioramaMountainSelect?: (mountainId: string) => void,
    onDioramaMountainDeselect?: () => void
  ) {
    this.currentDest = initialDest;
    this.isStamped = isStamped;
    this.onReturnToGlobe = onReturnToGlobe;
    this.onStampClick = onStampClick;
    this.onEnterScenic = onEnterScenic;
    this.onZoomIn = onZoomIn;
    this.onZoomOut = onZoomOut;
    this.onResetView = onResetView;
    this.onDimensionSwitch = onDimensionSwitch;
    this.onSetCameraZ = onSetCameraZ;
    this.onViewScroll = onViewScroll;
    this.onDioramaLayerSwitch = onDioramaLayerSwitch;
    this.onDioramaTimeOfDaySwitch = onDioramaTimeOfDaySwitch;
    this.onDioramaMountainSelect = onDioramaMountainSelect;
    this.onDioramaMountainDeselect = onDioramaMountainDeselect;
    this.sound = SoundEngine.getInstance();

    this.element = document.createElement('section');
    this.element.id = 'hero-section';
    this.element.className = 'hero-section';

    this.initDOM();
    this.renderMountainCards(this.currentMountainRegion);
    this.bindEvents();

    this.unsubscribeState = experienceState.subscribe(state => {
      this.setDimensionMode(state.dimension);
    });
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  private initDOM() {
    const initialState = experienceState.getState();
    const initialGaugeProgress = getGaugeProgress(initialState.cameraDistance);
    const [microStation, provinceStation, nationStation, macroStation] = GAUGE_STATIONS;
    const [dMicroStation, dCityStation, dMountainStation, dProvinceStation, dTableStation] = DIORAMA_GAUGE_STATIONS;
    const currentDim = initialState.dimension;

    this.element.innerHTML = `
      <!-- 3D Master World HUD & Navigation Controls Layer -->
      <div class="hero-3d-master-layer" id="hero-3d-master-layer">
        <div id="city-3d-tooltip" class="city-hover-tooltip" style="display:none;"></div>

        <!-- 1. 【汝窑天青 · 孤品无字玉衡度规】(Celestial Celadon Astrolabe Gauge - 专属于神州坤舆) -->
        <div class="astrolabe-floating-scale" id="astrolabe-floating-scale" style="display: ${currentDim === 'globe' ? 'flex' : 'none'};">
          <!-- 1. 顶部朱砂小印与天青流光微印 -->
          <div class="celadon-seal-header">
            <span class="cinnabar-talisman-dot"></span>
            <span class="celadon-seal-glyph" id="gauge-tier-label">司天 · ${getGaugeTier(initialState.cameraDistance)}</span>
          </div>

          <!-- 2. 居中步进天青玉珠：＋ -->
          <button class="celadon-stepper-bead btn-plus" id="scale-zoom-in-btn" title="步进放大 · 深入灵境">
            <span class="bead-glyph">＋</span>
          </button>

          <!-- 3. 【汝窑天青流光刻度轨】 -->
          <div class="celadon-gauge-track" id="scale-filigree-track">
            <div class="track-celadon-spine"></div>
            <div class="track-moon-glow" id="track-active-glow"></div>

            <div class="track-symmetrical-wings">
              <span class="wing-tick major" style="top: 0%;"></span>
              <span class="wing-tick minor" style="top: 8.33%;"></span>
              <span class="wing-tick minor" style="top: 16.67%;"></span>
              <span class="wing-tick minor" style="top: 25%;"></span>
              <span class="wing-tick major" style="top: 33.33%;"></span>
              <span class="wing-tick minor" style="top: 41.67%;"></span>
              <span class="wing-tick minor" style="top: 50%;"></span>
              <span class="wing-tick minor" style="top: 58.33%;"></span>
              <span class="wing-tick major" style="top: 66.67%;"></span>
              <span class="wing-tick minor" style="top: 75%;"></span>
              <span class="wing-tick minor" style="top: 83.33%;"></span>
              <span class="wing-tick minor" style="top: 91.67%;"></span>
              <span class="wing-tick major" style="top: 100%;"></span>
            </div>

            <!-- 洞天 / 山海 / 神州 / 太虚 四大境界站点：严格 33.33% 黄金等距和谐排布 -->
            <div class="celadon-station tier-micro" data-z="${microStation.distance}" style="top: 0%;" title="${microStation.title}">
              <div class="station-jade-bead"></div>
              <span class="station-seal-name">${microStation.label}</span>
            </div>

            <div class="celadon-station tier-province" data-z="${provinceStation.distance}" style="top: 33.33%;" title="${provinceStation.title}">
              <div class="station-jade-bead"></div>
              <span class="station-seal-name">${provinceStation.label}</span>
            </div>

            <div class="celadon-station tier-nation" data-z="${nationStation.distance}" style="top: 66.67%;" title="${nationStation.title}">
              <div class="station-jade-bead"></div>
              <span class="station-seal-name">${nationStation.label}</span>
            </div>

            <div class="celadon-station tier-macro" data-z="${macroStation.distance}" style="top: 100%;" title="${macroStation.title}">
              <div class="station-jade-bead"></div>
              <span class="station-seal-name">${macroStation.label}</span>
            </div>

            <!-- 4. 【天青双环璇玑流光游标】 -->
            <div class="celadon-reticle-cursor" id="jade-orb-slider-thumb" style="top: ${initialGaugeProgress * 100}%;">
              <span class="cursor-left-metric" id="cursor-realtime-z">Z: ${initialState.cameraDistance.toFixed(2)}</span>
              <div class="cursor-ring outer"></div>
              <div class="cursor-ring inner"></div>
              <div class="cursor-cinnabar-pearl"></div>
              <div class="cursor-reticle-cross"></div>
              <span class="cursor-right-tier" id="cursor-realtime-tier">${getGaugeTier(initialState.cameraDistance)}</span>
            </div>
          </div>

          <!-- 5. 居中步进天青玉珠：－ -->
          <button class="celadon-stepper-bead btn-minus" id="scale-zoom-out-btn" title="步进缩小 · 仰观寰宇">
            <span class="bead-glyph">－</span>
          </button>

          <!-- 6. 孤品天青司南星规 -->
          <button class="celadon-sinan-compass" id="scale-reset-view-btn" title="司南定极 · 归正南位">
            <svg viewBox="0 0 32 32" class="celadon-sinan-svg">
              <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(120, 165, 163, 0.4)" stroke-width="0.8" stroke-dasharray="2 2"/>
              <circle cx="16" cy="16" r="11" fill="rgba(12, 26, 24, 0.85)" stroke="rgba(120, 165, 163, 0.75)" stroke-width="0.8"/>
              <circle cx="16" cy="2" fill="#78A5A3"/>
              <g class="sinan-celadon-spoon" id="sinan-magnetic-spoon">
                <path d="M16 16 L16 7 Q16 5.5 17 4.5 Q15 5.5 16 7 Z" fill="#C84630" stroke="#E0EAE9" stroke-width="0.3"/>
                <circle cx="16" cy="17" r="2.5" fill="#5C8984" stroke="#C8D6D5" stroke-width="0.6"/>
                <circle cx="16" cy="17" r="1" fill="#E0EAE9"/>
              </g>
            </svg>
          </button>
        </div>

        <!-- 2. 【紫檀嵌金 · 地官勘舆营造量地矩尺】(Sandalwood Gold-Inlaid Topographical Surveyor's Ruler - 专属于万象沙盘) -->
        <div class="diorama-floating-scale" id="diorama-floating-scale" style="display: ${currentDim === 'diorama' ? 'flex' : 'none'};">
          <!-- 1. 顶部：紫檀朱砂方印与地官小篆铭文 -->
          <div class="sandalwood-seal-header">
            <span class="cinnabar-square-stamp">地</span>
            <span class="sandalwood-seal-glyph" id="diorama-gauge-tier-label">地官 · 省域</span>
          </div>

          <!-- 2. 居中步进紫檀金钮：＋ -->
          <button class="sandalwood-octagonal-bead btn-plus" id="diorama-zoom-in-btn" title="步进放大 · 细察城邑">
            <span class="bead-glyph">＋</span>
          </button>

          <!-- 3. 【紫檀金丝营造量地槽规】 -->
          <div class="sandalwood-gauge-track" id="diorama-filigree-track">
            <div class="track-sandalwood-spine"></div>
            <div class="track-gold-glow" id="diorama-track-active-glow"></div>

            <!-- 左侧：营造长短刻度线 (严格 25% 五阶等距营造步距) -->
            <div class="track-contour-graduations">
              <span class="ruler-tick major" style="top: 0%;"></span>
              <span class="ruler-tick minor" style="top: 6.25%;"></span>
              <span class="ruler-tick minor" style="top: 12.5%;"></span>
              <span class="ruler-tick minor" style="top: 18.75%;"></span>

              <span class="ruler-tick major" style="top: 25%;"></span>
              <span class="ruler-tick minor" style="top: 31.25%;"></span>
              <span class="ruler-tick minor" style="top: 37.5%;"></span>
              <span class="ruler-tick minor" style="top: 43.75%;"></span>

              <span class="ruler-tick major" style="top: 50%;"></span>
              <span class="ruler-tick minor" style="top: 56.25%;"></span>
              <span class="ruler-tick minor" style="top: 62.5%;"></span>
              <span class="ruler-tick minor" style="top: 68.75%;"></span>

              <span class="ruler-tick major" style="top: 75%;"></span>
              <span class="ruler-tick minor" style="top: 81.25%;"></span>
              <span class="ruler-tick minor" style="top: 87.5%;"></span>
              <span class="ruler-tick minor" style="top: 93.75%;"></span>
              <span class="ruler-tick major" style="top: 100%;"></span>
            </div>

            <!-- 五大地貌推演站点：严格 25% 黄金等距 (探微 / 城邑 / 名山 / 省域 / 大案) -->
            <div class="sandalwood-station tier-micro" data-d="${dMicroStation.distance}" style="top: 0%;" title="${dMicroStation.title}">
              <div class="station-brass-stud"></div>
              <span class="station-seal-name">${dMicroStation.label}</span>
            </div>

            <div class="sandalwood-station tier-city" data-d="${dCityStation.distance}" style="top: 25%;" title="${dCityStation.title}">
              <div class="station-brass-stud"></div>
              <span class="station-seal-name">${dCityStation.label}</span>
            </div>

            <div class="sandalwood-station tier-mountain" data-d="${dMountainStation.distance}" style="top: 50%;" title="${dMountainStation.title}">
              <div class="station-brass-stud"></div>
              <span class="station-seal-name">${dMountainStation.label}</span>
            </div>

            <div class="sandalwood-station tier-province" data-d="${dProvinceStation.distance}" style="top: 75%;" title="${dProvinceStation.title}">
              <div class="station-brass-stud"></div>
              <span class="station-seal-name">${dProvinceStation.label}</span>
            </div>

            <div class="sandalwood-station tier-table" data-d="${dTableStation.distance}" style="top: 100%;" title="${dTableStation.title}">
              <div class="station-brass-stud"></div>
              <span class="station-seal-name">${dTableStation.label}</span>
            </div>

            <!-- 4. 【紫檀金错卡尺游标 · 翡翠定水珠与左数右名】 -->
            <div class="sandalwood-reticle-cursor" id="diorama-reticle-thumb" style="top: 75%;">
              <span class="cursor-left-metric" id="diorama-realtime-d">D: 3.80</span>
              <div class="caliper-emerald-bubble">
                <span class="bubble-ruby-core"></span>
              </div>
              <span class="cursor-right-tier" id="diorama-realtime-tier">省域</span>
            </div>
          </div>

          <!-- 5. 居中步进紫檀金钮：－ -->
          <button class="sandalwood-octagonal-bead btn-minus" id="diorama-zoom-out-btn" title="步进缩小 · 俯瞰大案">
            <span class="bead-glyph">－</span>
          </button>

          <!-- 6. 【地官八卦定水罗盘】 -->
          <button class="sandalwood-bagua-compass" id="diorama-reset-view-btn" title="地官定水 · 归正大案">
            <svg viewBox="0 0 32 32" class="bagua-compass-svg">
              <polygon points="16,2 26,5.5 30,16 26,26.5 16,30 6,26.5 2,16 6,5.5" fill="rgba(24, 15, 12, 0.9)" stroke="rgba(212, 175, 55, 0.75)" stroke-width="0.8"/>
              <circle cx="16" cy="16" r="10.5" fill="rgba(38, 22, 18, 0.85)" stroke="rgba(229, 193, 88, 0.7)" stroke-width="0.6"/>
              <g class="bagua-magnetic-pointer" id="diorama-magnetic-needle">
                <path d="M16 16 L16 6 Q16 4.5 17 3.5 Q15 4.5 16 6 Z" fill="#C84630" stroke="#FFE082" stroke-width="0.3"/>
                <path d="M16 16 L16 26 Q16 27.5 15 28.5 Q17 27.5 16 26 Z" fill="#48D1CC" stroke="#E5C158" stroke-width="0.3"/>
                <circle cx="16" cy="16" r="2.2" fill="#8C6D37" stroke="#D4AF37" stroke-width="0.5"/>
                <circle cx="16" cy="16" r="0.9" fill="#FFFFFF"/>
              </g>
            </svg>
          </button>
        </div>

        <!-- 3. 【舆地透镜 · 观象图谱】(Diorama Topographic Lens & Layer Master Hub) -->
        <div class="diorama-layer-selector" id="diorama-layer-selector" style="display: ${currentDim === 'diorama' ? 'flex' : 'none'};">
          <!-- 卡片顶栏：璇玑窥镜神器徽印 + 金石尊名 + 折叠灵扣 -->
          <div class="layer-selector-header">
            <div class="header-left">
              <span class="header-emblem-badge" title="璇玑窥镜 · 浑仪天文观象图谱">
                <svg class="emblem-celestial-lens" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <defs>
                    <linearGradient id="lensGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#FFE599"/>
                      <stop offset="50%" stop-color="#D4AF37"/>
                      <stop offset="100%" stop-color="#8C6D37"/>
                    </linearGradient>
                    <radialGradient id="lensCoreGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stop-color="#81C784" stop-opacity="0.95"/>
                      <stop offset="60%" stop-color="#2E7D32" stop-opacity="0.75"/>
                      <stop offset="100%" stop-color="#1B5E20" stop-opacity="0.3"/>
                    </radialGradient>
                    <radialGradient id="lensSealBg" cx="50%" cy="50%" r="70%">
                      <stop offset="0%" stop-color="#B82E1E"/>
                      <stop offset="100%" stop-color="#6E150C"/>
                    </radialGradient>
                  </defs>
                  <rect x="1" y="1" width="22" height="22" rx="4" fill="url(#lensSealBg)" stroke="url(#lensGoldGrad)" stroke-width="1"/>
                  <circle cx="12" cy="12" r="8.5" fill="none" stroke="url(#lensGoldGrad)" stroke-width="0.8" stroke-dasharray="3 1.2"/>
                  <circle cx="12" cy="12" r="5" fill="url(#lensCoreGlow)" stroke="#FFE082" stroke-width="0.7"/>
                  <line x1="12" y1="2.5" x2="12" y2="7" stroke="#FFE082" stroke-width="0.8" stroke-linecap="round"/>
                  <line x1="12" y1="17" x2="12" y2="21.5" stroke="#FFE082" stroke-width="0.8" stroke-linecap="round"/>
                  <line x1="2.5" y1="12" x2="7" y2="12" stroke="#FFE082" stroke-width="0.8" stroke-linecap="round"/>
                  <line x1="17" y1="12" x2="21.5" y2="12" stroke="#FFE082" stroke-width="0.8" stroke-linecap="round"/>
                  <polygon points="12,10 13.2,12 12,14 10.8,12" fill="#FFFDF9"/>
                  <circle cx="3.5" cy="3.5" r="0.7" fill="#FFE082"/>
                  <circle cx="20.5" cy="3.5" r="0.7" fill="#FFE082"/>
                  <circle cx="3.5" cy="20.5" r="0.7" fill="#FFE082"/>
                  <circle cx="20.5" cy="20.5" r="0.7" fill="#FFE082"/>
                </svg>
              </span>
              <div class="header-titles">
                <span class="selector-title">舆地透镜</span>
                <span class="selector-sub">观象图谱 · 营造仪轨</span>
              </div>
            </div>
            <div class="header-right-actions">
              <span class="header-filigree-badge">✦ 粤境 ✦</span>
              <button class="panel-fold-clasp" id="fold-layer-selector-btn" title="经折收起 · 纵览山海" aria-label="经折收起透镜面板">
                <span class="clasp-halo"></span>
                <svg class="clasp-svg" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.5" fill="rgba(32,20,16,0.9)" stroke="#D4AF37" stroke-width="1"/>
                  <path d="M5.5 6.5 L7.5 5.5 L7.5 14.5 L5.5 13.5 Z" fill="none" stroke="#FFE082" stroke-width="1"/>
                  <path d="M8.5 5.5 L11.5 6.5 L11.5 13.5 L8.5 14.5 Z" fill="rgba(212,175,55,0.3)" stroke="#FFE082" stroke-width="1"/>
                  <path d="M12.5 6.5 L14.5 5.5 L14.5 14.5 L12.5 13.5 Z" fill="none" stroke="#FFE082" stroke-width="1"/>
                  <circle cx="10" cy="10" r="1.2" fill="#FFE082"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 一、四时晨昏 · 日晷仪轨 (2x2 四象方阵，宽敞大气，彻底告别逼仄挤压) -->
          <div class="sundial-sub-section">
            <div class="sundial-section-eyebrow">
              <span class="eyebrow-icon">🧭</span>
              <span class="eyebrow-text">四时晨昏 · 日晷仪轨</span>
            </div>
            <div class="sundial-buttons-grid">
              <button class="sundial-btn" data-time="dawn" title="晨曦初露 · 曙色金峦与朝雾蒸腾">
                <span class="sundial-glyph">🌅</span>
                <div class="sundial-text-block">
                  <span class="sundial-label">晨曦</span>
                  <span class="sundial-sub">破晓蒸霞</span>
                </div>
              </button>
              <button class="sundial-btn active" data-time="noon" title="正午极阳 · 碧海耀金与青山万仞">
                <span class="sundial-glyph">☀️</span>
                <div class="sundial-text-block">
                  <span class="sundial-label">正午</span>
                  <span class="sundial-sub">极阳万仞</span>
                </div>
              </button>
              <button class="sundial-btn" data-time="dusk" title="晚霞沉醉 · 日照金顶与紫霞暮色">
                <span class="sundial-glyph">🌇</span>
                <div class="sundial-text-block">
                  <span class="sundial-label">暮色</span>
                  <span class="sundial-sub">金顶紫霞</span>
                </div>
              </button>
              <button class="sundial-btn" data-time="night" title="月华如水 · 素魄寒星与沧溟幽光">
                <span class="sundial-glyph">🌙</span>
                <div class="sundial-text-block">
                  <span class="sundial-label">月夜</span>
                  <span class="sundial-sub">素魄寒星</span>
                </div>
              </button>
            </div>
          </div>

          <!-- 金丝渐变分割线 -->
          <div class="layer-selector-divider"></div>

          <!-- 二、山海专题 · 六维图谱 (2x3 中正网格，图标居左，文字居右，对齐协调) -->
          <div class="thematic-layers-section">
            <div class="thematic-section-eyebrow">
              <span class="eyebrow-icon">🗺️</span>
              <span class="eyebrow-text">山海地貌 · 六维图谱</span>
            </div>
            <div class="layer-selector-grid">
              <button class="layer-tab active" data-layer="topography" title="纯粹全景高程大势，南岭至南海阶梯倾斜">
                <span class="tab-glyph">🏔️</span>
                <span class="tab-label">全景地势</span>
              </button>
              <button class="layer-tab" data-layer="landforms" title="五大特征地貌：丹霞赤壁、喀斯特峰林、古火山海蚀">
                <span class="tab-glyph">🪨</span>
                <span class="tab-label">特征地貌</span>
              </button>
              <button class="layer-tab" data-layer="mountains" title="探秘广东三十座极巅名山与神岳洞天">
                <span class="tab-glyph">⛰️</span>
                <span class="tab-label">名山大川</span>
              </button>
              <button class="layer-tab" data-layer="waters" title="全览珠江三江汇流、八门出海与南海水镜">
                <span class="tab-glyph">🌊</span>
                <span class="tab-label">江海水系</span>
              </button>
              <button class="layer-tab" data-layer="roads" title="大庾岭梅关古道、西京古道与海上丝绸之路古航道">
                <span class="tab-glyph">🛣️</span>
                <span class="tab-label">南粤古道</span>
              </button>
              <button class="layer-tab" data-layer="cities" title="查看 21 地级市高精行政界线与金石城印">
                <span class="tab-glyph">🏛️</span>
                <span class="tab-label">二十一城</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 4. 【营造法式 · 分层设色高程与要素图例】(Hypsometric Relief Legend & Geomorphological Code) -->
        <div class="diorama-hypsometric-legend" id="diorama-hypsometric-legend" style="display: ${currentDim === 'diorama' ? 'flex' : 'none'};">
          <div class="legend-header">
            <div class="legend-header-left">
              <span class="legend-emblem-badge" title="百工营造 · 垂直高程叠嶂规尺">
                <svg class="emblem-mountain-gauge" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <defs>
                    <linearGradient id="gaugeGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#FFE599"/>
                      <stop offset="50%" stop-color="#D4AF37"/>
                      <stop offset="100%" stop-color="#8C6D37"/>
                    </linearGradient>
                    <radialGradient id="gaugeSealBg" cx="50%" cy="50%" r="70%">
                      <stop offset="0%" stop-color="#9C2718"/>
                      <stop offset="100%" stop-color="#541008"/>
                    </radialGradient>
                  </defs>
                  <rect x="1" y="1" width="22" height="22" rx="4" fill="url(#gaugeSealBg)" stroke="url(#gaugeGoldGrad)" stroke-width="1"/>
                  <path d="M12 5.5 L15.5 11.5 L8.5 11.5 Z" fill="none" stroke="#FFE082" stroke-width="0.9" stroke-linejoin="round"/>
                  <path d="M7 11.5 L10.5 16.5 L3.5 16.5 Z" fill="none" stroke="#D4AF37" stroke-width="0.8" stroke-linejoin="round"/>
                  <path d="M17 11.5 L20.5 16.5 L13.5 16.5 Z" fill="none" stroke="#D4AF37" stroke-width="0.8" stroke-linejoin="round"/>
                  <line x1="12" y1="4" x2="12" y2="19.5" stroke="#FFE082" stroke-width="0.7" stroke-dasharray="1.5 1"/>
                  <line x1="4" y1="19.5" x2="20" y2="19.5" stroke="url(#gaugeGoldGrad)" stroke-width="1" stroke-linecap="round"/>
                  <line x1="4" y1="8" x2="6" y2="8" stroke="#FFE082" stroke-width="0.6"/>
                  <line x1="4" y1="12" x2="6" y2="12" stroke="#FFE082" stroke-width="0.6"/>
                  <line x1="4" y1="16" x2="6" y2="16" stroke="#FFE082" stroke-width="0.6"/>
                  <line x1="18" y1="8" x2="20" y2="8" stroke="#FFE082" stroke-width="0.6"/>
                  <line x1="18" y1="12" x2="20" y2="12" stroke="#FFE082" stroke-width="0.6"/>
                  <line x1="18" y1="16" x2="20" y2="16" stroke="#FFE082" stroke-width="0.6"/>
                  <circle cx="12" cy="5.5" r="0.9" fill="#FFFDF9"/>
                </svg>
              </span>
              <div class="legend-header-titles">
                <span class="legend-title">分层设色 · 舆地通考</span>
                <span class="legend-sub">国家制图标准 · 垂直高程 (m)</span>
              </div>
            </div>
            <div class="legend-header-right">
              <button class="panel-fold-clasp" id="fold-legend-btn" title="经折收起 · 阔展视野" aria-label="经折收起图考面板">
                <span class="clasp-halo"></span>
                <svg class="clasp-svg" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.5" fill="rgba(32,20,16,0.9)" stroke="#D4AF37" stroke-width="1"/>
                  <path d="M5.5 6.5 L7.5 5.5 L7.5 14.5 L5.5 13.5 Z" fill="none" stroke="#FFE082" stroke-width="1"/>
                  <path d="M8.5 5.5 L11.5 6.5 L11.5 13.5 L8.5 14.5 Z" fill="rgba(212,175,55,0.3)" stroke="#FFE082" stroke-width="1"/>
                  <path d="M12.5 6.5 L14.5 5.5 L14.5 14.5 L12.5 13.5 Z" fill="none" stroke="#FFE082" stroke-width="1"/>
                  <circle cx="10" cy="10" r="1.2" fill="#FFE082"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="legend-body">
            <!-- 垂直高程立体渐变色柱与测绘微度规 -->
            <div class="legend-scale-row">
              <div class="legend-color-pillar">
                <span class="color-step step-summit" title="1500m ~ 1902m 极巅 · 泥金勾峰与矿物石青"></span>
                <span class="color-step step-high-mountain" title="800m ~ 1500m 崇山 · 苍翠石绿"></span>
                <span class="color-step step-low-mountain" title="400m ~ 800m 丘陵 · 浅翠石绿与暗赭峭壁"></span>
                <span class="color-step step-foothill" title="150m ~ 400m 山麓谷地 · 天水碧"></span>
                <span class="color-step step-plain" title="0m ~ 150m 冲积平原 · 螺钿粉青"></span>
                <span class="color-step step-coast" title="0m 海岸线 · 金沙浅滩"></span>
                <span class="color-step step-ocean" title="&lt;0m 沧溟 · 南海碧蓝水体与水下陆架"></span>
              </div>
              <div class="legend-ticks-list">
                <div class="tick-tier">
                  <span class="tick-num">1902m</span>
                  <span class="tick-tag summit">极巅</span>
                  <span class="tick-geo">南岭石坑崆</span>
                </div>
                <div class="tick-tier">
                  <span class="tick-num">1200m</span>
                  <span class="tick-tag high-mtn">崇山</span>
                  <span class="tick-geo">罗浮山 · 大田顶</span>
                </div>
                <div class="tick-tier">
                  <span class="tick-num">600m</span>
                  <span class="tick-tag hill">丘陵</span>
                  <span class="tick-geo">英西峰林 · 丹霞山</span>
                </div>
                <div class="tick-tier">
                  <span class="tick-num">150m</span>
                  <span class="tick-tag plain">平原</span>
                  <span class="tick-geo">珠三角 · 潮汕平原</span>
                </div>
                <div class="tick-tier">
                  <span class="tick-num">0m</span>
                  <span class="tick-tag coast">海岸</span>
                  <span class="tick-geo">千里金沙 · 潮汐浅滩</span>
                </div>
                <div class="tick-tier">
                  <span class="tick-num">&lt;0m</span>
                  <span class="tick-tag ocean">沧溟</span>
                  <span class="tick-geo">南海沧渊 · 浩瀚水域</span>
                </div>
              </div>
            </div>

            <!-- 陆海真实空间格局考据 -->
            <div class="legend-spatial-notes">
              <div class="spatial-card land">
                <span class="spatial-badge">华夏大陆</span>
                <span class="spatial-desc">北/西/东 · 连绵山系陆脉相连 (湘赣闽桂)</span>
              </div>
              <div class="spatial-card sea">
                <span class="spatial-badge">南海沧渊</span>
                <span class="spatial-desc">南侧 · 真实海岸线、海岛群与浩瀚南海</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. 【3D 华夏金石提梁令牌 · 唤醒舆地透镜】(Imperial Astrolabe Tally Plaque) -->
        <div class="diorama-tally-dock" id="docked-tab-layer-selector" title="展开【舆地透镜 · 观象图谱】" style="display: none;">
          <div class="tally-suspension-loop">
            <svg viewBox="0 0 24 10" width="24" height="10" aria-hidden="true">
              <path d="M4 10 Q12 0 20 10" fill="none" stroke="#FFE082" stroke-width="1.8"/>
              <circle cx="12" cy="4" r="1.5" fill="#FFE599"/>
            </svg>
          </div>
          <div class="tally-plaque-body">
            <div class="tally-emblem-halo">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <circle cx="10" cy="10" r="7.5" fill="none" stroke="#FFE082" stroke-width="1.2" stroke-dasharray="2 1"/>
                <circle cx="10" cy="10" r="4.5" fill="rgba(46,125,50,0.4)" stroke="#81C784" stroke-width="1"/>
                <line x1="10" y1="2" x2="10" y2="18" stroke="#FFE082" stroke-width="0.8"/>
                <line x1="2" y1="10" x2="18" y2="10" stroke="#FFE082" stroke-width="0.8"/>
                <circle cx="10" cy="10" r="1.8" fill="#FFFDF9"/>
              </svg>
            </div>
            <div class="tally-inscription">
              <span>透</span>
              <span>镜</span>
            </div>
            <div class="tally-kinetic-arrow">
              <svg viewBox="0 0 14 10" width="12" height="8" aria-hidden="true">
                <path d="M3 2 L8 5 L3 8" fill="none" stroke="#FFE082" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 2 L12 5 L7 8" fill="none" stroke="rgba(255,224,130,0.5)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="tally-slide-ribbon">
            <span class="ribbon-glyph">✦</span>
            <span class="ribbon-text">展开观象透镜</span>
          </div>
        </div>

        <!-- 6. 【3D 华夏金石提梁令牌 · 唤醒舆地通考】(Imperial Hypsometric Survey Tally Plaque) -->
        <div class="diorama-tally-dock tally-dock-legend" id="docked-tab-legend" title="展开【分层设色 · 舆地通考】" style="display: none;">
          <div class="tally-suspension-loop">
            <svg viewBox="0 0 24 10" width="24" height="10" aria-hidden="true">
              <path d="M4 10 Q12 0 20 10" fill="none" stroke="#FFE082" stroke-width="1.8"/>
              <circle cx="12" cy="4" r="1.5" fill="#FFE599"/>
            </svg>
          </div>
          <div class="tally-plaque-body">
            <div class="tally-emblem-halo">
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <path d="M10 3 L15 11 L5 11 Z" fill="none" stroke="#FFE082" stroke-width="1.2"/>
                <path d="M4 11 L7 16 L1 16 Z" fill="none" stroke="#D4AF37" stroke-width="1"/>
                <path d="M16 11 L19 16 L13 16 Z" fill="none" stroke="#D4AF37" stroke-width="1"/>
                <line x1="1" y1="17" x2="19" y2="17" stroke="#FFE082" stroke-width="1.2"/>
              </svg>
            </div>
            <div class="tally-inscription">
              <span>图</span>
              <span>考</span>
            </div>
            <div class="tally-kinetic-arrow">
              <svg viewBox="0 0 14 10" width="12" height="8" aria-hidden="true">
                <path d="M3 2 L8 5 L3 8" fill="none" stroke="#FFE082" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 2 L12 5 L7 8" fill="none" stroke="rgba(255,224,130,0.5)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="tally-slide-ribbon">
            <span class="ribbon-glyph">✦</span>
            <span class="ribbon-text">展开高程图考</span>
          </div>
        </div>

        <!-- 7. 【山海地契小卷】(Diorama Info Scroll Card) -->
        <div class="diorama-info-card" id="diorama-info-card" style="display: none;">
          <div class="info-card-header">
            <div class="header-seal-tag">
              <span class="seal-icon" id="diorama-info-type-tag">神岳</span>
              <span class="seal-title" id="diorama-info-title">罗浮山</span>
            </div>
            <button class="info-close-btn" id="diorama-info-close-btn" title="收起地契">✕</button>
          </div>
          <div class="info-card-body">
            <div class="info-card-subtitle" id="diorama-info-sub">岭南第一山 · 蓬莱第七洞天 (1296m)</div>
            <div class="info-card-meta-row" id="diorama-info-meta">
              <span class="meta-pill"><strong id="meta-key-1">五行</strong>: <span id="meta-val-1">木</span></span>
              <span class="meta-pill"><strong id="meta-key-2">地质</strong>: <span id="meta-val-2">花岗岩巨大穹窿</span></span>
            </div>
            <div class="info-card-desc" id="diorama-info-desc"></div>
          </div>
        </div>

        <!-- 7. 【营造法式 · 实时高程探针微缩浮动屏】(Topographic Probe Floating HUD) -->
        <div class="diorama-probe-hud" id="diorama-probe-hud" style="display: none;">
          <div class="probe-hud-glow"></div>
          <div class="probe-hud-header">
            <span class="probe-hud-badge" id="probe-hud-tier">极巅</span>
            <span class="probe-hud-alt" id="probe-hud-alt">▲ 1,902m</span>
          </div>
          <div class="probe-hud-title" id="probe-hud-title">南岭主脊 · 石坑崆极峰</div>
          <div class="probe-hud-coords" id="probe-hud-coords">112°59'E, 24°55'N</div>
        </div>

        <!-- 8. 【名山百岳 · 舆地神岳全景导览坞】(Mountain Navigator Dock) —— 告别大海捞针，一键飞跃聚焦！ -->
        <div class="diorama-mountain-dock panel-3d-folded" id="diorama-mountain-dock" style="display: none;">
          <div class="mountain-dock-header">
            <div class="mountain-dock-title-group">
              <span class="mountain-dock-emblem">⛰️</span>
              <div class="mountain-dock-titles">
                <span class="mountain-dock-title">名山百岳 · 全景导览坞</span>
                <span class="mountain-dock-sub">一键飞跃聚焦 · 告别大海捞针</span>
              </div>
            </div>
            <div class="mountain-dock-header-right">
              <button class="panel-fold-clasp" id="fold-mountain-dock-btn" title="经折收起导览坞" aria-label="经折收起名山导览坞">
                <span class="clasp-halo"></span>
                <svg class="clasp-svg" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                  <circle cx="10" cy="10" r="8.5" fill="rgba(32,20,16,0.9)" stroke="#D4AF37" stroke-width="1"/>
                  <path d="M5.5 6.5 L7.5 5.5 L7.5 14.5 L5.5 13.5 Z" fill="none" stroke="#FFE082" stroke-width="1"/>
                  <path d="M8.5 5.5 L11.5 6.5 L11.5 13.5 L8.5 14.5 Z" fill="rgba(212,175,55,0.3)" stroke="#FFE082" stroke-width="1"/>
                  <path d="M12.5 6.5 L14.5 5.5 L14.5 14.5 L12.5 13.5 Z" fill="none" stroke="#FFE082" stroke-width="1"/>
                  <circle cx="10" cy="10" r="1.2" fill="#FFE082"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 区域标签筛选条 (一碗水端平：广东权威五大地理山系圈层 + 全粤百岳全览) -->
          <div class="mountain-filter-tabs" id="mountain-filter-tabs">
            <button class="mountain-filter-btn active" data-region="all">全粤百岳 (全)</button>
            <button class="mountain-filter-btn" data-region="east">粤东 · 莲花山系</button>
            <button class="mountain-filter-btn" data-region="north">粤北 · 南岭主脊</button>
            <button class="mountain-filter-btn" data-region="bayarea">珠三角 · 环湾名岳</button>
            <button class="mountain-filter-btn" data-region="west">粤西 · 云开高凉</button>
          </div>

          <!-- 名山横向卡片滚动长卷 -->
          <div class="mountain-cards-track" id="mountain-cards-track"></div>
        </div>

        <!-- 8.5. 【3D 华夏金石提梁令牌 · 唤醒名山导览坞】(Imperial Mountain Tally Plaque) -->
        <div class="diorama-tally-dock tally-dock-mountains docked-tab-active" id="docked-tab-mountains" title="展开【名山百岳 · 全景导览坞】" style="display: none;">
          <div class="tally-suspension-loop">
            <svg viewBox="0 0 24 10" width="24" height="10" aria-hidden="true">
              <path d="M4 10 Q12 0 20 10" fill="none" stroke="#FFE082" stroke-width="1.8"/>
              <circle cx="12" cy="4" r="1.5" fill="#FFE599"/>
            </svg>
          </div>
          <div class="tally-plaque-body">
            <div class="tally-emblem-halo">
              <span style="font-size: 14px;">⛰️</span>
            </div>
            <div class="tally-inscription">
              <span>百</span>
              <span>岳</span>
            </div>
            <div class="tally-kinetic-arrow">
              <svg viewBox="0 0 14 10" width="12" height="8" aria-hidden="true">
                <path d="M3 2 L8 5 L3 8" fill="none" stroke="#FFE082" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 2 L12 5 L7 8" fill="none" stroke="rgba(255,224,130,0.5)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="tally-slide-ribbon">
            <span class="ribbon-glyph">✦</span>
            <span class="ribbon-text">展开名山百岳</span>
          </div>
        </div>

        <!-- Unified Bottom Master Actions Dock (Side-by-side: Beast Summon + View Current Scroll) -->
        <div class="hero-bottom-actions-dock" id="hero-bottom-actions-dock">
          <div class="hero-beast-summon-bar" id="hero-beast-summon-bar">
            <button class="beast-summon-talisman-btn" id="hero-summon-beast-btn" title="点击召来神兽真身 3D 全息交互">
              <span class="talisman-icon">✨</span>
              <span class="talisman-title" id="summon-btn-title">召来【${this.currentDest.guardian.name}】真身</span>
              <span class="talisman-sub">3D 全息检视</span>
            </button>
          </div>

          <!-- Bottom Master Action: Click to View Current Scroll -->
          <button class="hero-scroll-cue" id="hero-scroll-cue-btn" title="点击查看当前样板城市山海画卷巡礼">
            <div class="scroll-cue-capsule">
              <span class="cue-seal-icon">📜</span>
              <span class="cue-text">查看当前画卷</span>
              <span class="cue-sub-tag">风物巡礼</span>
              <span class="cue-arrow-anim">↓</span>
            </div>
          </button>
        </div>
      </div>
    `;

    // 实例化【文人案头 · 非对称手卷】右侧详情面板并挂载
    this.scrollDrawer = new DestinationScrollDrawer(this.currentDest, {
      onEnterScenic: (dest) => {
        this.closeCityDossier();
        if (this.onEnterScenic) {
          this.onEnterScenic(dest);
        } else {
          const dailyStage = document.getElementById('daily-stage');
          if (dailyStage) {
            dailyStage.scrollIntoView({ behavior: 'smooth' });
          }
        }
      },
      onSummonBeast: (dest) => {
        if (this.currentDimension === 'beast') {
          if (this.onDimensionSwitch) this.onDimensionSwitch('globe');
        } else {
          if (this.onDimensionSwitch) this.onDimensionSwitch('beast');
        }
      },
      onStampCity: (cityId) => {
        this.onStampClick(cityId);
        this.setStamped(true);
      },
      onClose: () => {
        this.closeCityDossier();
      },
      onStamp: (cityId) => {
        this.onStampClick(cityId);
      }
    });

    const masterLayer = this.element.querySelector('#hero-3d-master-layer');
    if (masterLayer) {
      masterLayer.appendChild(this.scrollDrawer.getElement());
    }

    this.bindEvents();
  }

  private bindEvents() {
    // 1. Dimension Switcher
    this.element.querySelectorAll('.hero-dim-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as DimensionMode;
        if (mode && this.onDimensionSwitch) {
          this.onDimensionSwitch(mode);
        }
      });
    });

    // 2. Beast Summon / Return to Globe
    this.element.querySelector('#hero-summon-beast-btn')?.addEventListener('click', () => {
      if (this.currentDimension === 'beast' || this.currentDimension === 'diorama') {
        if (this.onDimensionSwitch) this.onDimensionSwitch('globe');
      } else {
        if (this.onDimensionSwitch) this.onDimensionSwitch('beast');
      }
    });

    // 3. Globe Zoom Controls (神州坤舆)
    this.element.querySelector('#scale-zoom-in-btn')?.addEventListener('click', () => {
      if (this.onZoomIn) this.onZoomIn();
    });

    this.element.querySelector('#scale-zoom-out-btn')?.addEventListener('click', () => {
      if (this.onZoomOut) this.onZoomOut();
    });

    this.element.querySelector('#scale-reset-view-btn')?.addEventListener('click', () => {
      if (this.onResetView) this.onResetView();
    });

    // 4. Globe Station Clicks (神州坤舆)
    this.element.querySelectorAll('.celadon-station').forEach(station => {
      station.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetZ = parseFloat(
          station.getAttribute('data-z') || String(EXPERIENCE_GEOMETRY.camera.overview),
        );
        if (this.onSetCameraZ) {
          this.onSetCameraZ(targetZ, true);
        }
      });
    });

    // 5. Globe Gauge Dragging (神州坤舆)
    const track = this.element.querySelector('#scale-filigree-track') as HTMLElement;
    if (track) {
      const handleTrackPointer = (e: PointerEvent) => {
        const rect = track.getBoundingClientRect();
        const clampedY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const pct = clampedY / rect.height;
        const targetZ = getGaugeDistance(pct);
        if (this.onSetCameraZ) {
          this.onSetCameraZ(targetZ, false);
        }
      };

      track.addEventListener('pointerdown', (e: PointerEvent) => {
        this.isDraggingGauge = true;
        try { track.setPointerCapture(e.pointerId); } catch (_) {}
        handleTrackPointer(e);
      });

      track.addEventListener('pointermove', (e: PointerEvent) => {
        if (!this.isDraggingGauge) return;
        handleTrackPointer(e);
      });

      const endDrag = (e: PointerEvent) => {
        if (this.isDraggingGauge) {
          this.isDraggingGauge = false;
          try { track.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };
      track.addEventListener('pointerup', endDrag);
      track.addEventListener('pointercancel', endDrag);
    }

    // 6. Diorama Zoom Controls (万象沙盘)
    this.element.querySelector('#diorama-zoom-in-btn')?.addEventListener('click', () => {
      if (this.onZoomIn) this.onZoomIn();
    });

    this.element.querySelector('#diorama-zoom-out-btn')?.addEventListener('click', () => {
      if (this.onZoomOut) this.onZoomOut();
    });

    this.element.querySelector('#diorama-reset-view-btn')?.addEventListener('click', () => {
      if (this.onResetView) this.onResetView();
    });

    // 7. Diorama Station Clicks (万象沙盘)
    this.element.querySelectorAll('.sandalwood-station').forEach(station => {
      station.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetD = parseFloat(station.getAttribute('data-d') || '4.0');
        if (this.onSetCameraZ) {
          this.onSetCameraZ(targetD, true);
        }
      });
    });

    // 8. Diorama Gauge Dragging (万象沙盘)
    const dioramaTrack = this.element.querySelector('#diorama-filigree-track') as HTMLElement;
    if (dioramaTrack) {
      const handleDioramaTrackPointer = (e: PointerEvent) => {
        const rect = dioramaTrack.getBoundingClientRect();
        const clampedY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const pct = clampedY / rect.height;
        const targetD = getDioramaGaugeDistance(pct);
        if (this.onSetCameraZ) {
          this.onSetCameraZ(targetD, false);
        }
      };

      dioramaTrack.addEventListener('pointerdown', (e: PointerEvent) => {
        this.isDraggingDioramaGauge = true;
        try { dioramaTrack.setPointerCapture(e.pointerId); } catch (_) {}
        handleDioramaTrackPointer(e);
      });

      dioramaTrack.addEventListener('pointermove', (e: PointerEvent) => {
        if (!this.isDraggingDioramaGauge) return;
        handleDioramaTrackPointer(e);
      });

      const endDioramaDrag = (e: PointerEvent) => {
        if (this.isDraggingDioramaGauge) {
          this.isDraggingDioramaGauge = false;
          try { dioramaTrack.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };
      dioramaTrack.addEventListener('pointerup', endDioramaDrag);
      dioramaTrack.addEventListener('pointercancel', endDioramaDrag);
    }

    // 8.5. 滚轮交互：万象沙盘量地矩尺与神州浑天仪尺寸条滚轮无缝缩放 (Gauge Mouse Wheel Scaling)
    const dioramaScale = this.element.querySelector('#diorama-floating-scale') as HTMLElement;
    if (dioramaScale) {
      dioramaScale.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const currentD = this.currentDioramaDistance || 2.20;
        const step = (e.deltaY > 0 ? 1 : -1) * 0.20;
        const newD = clampDioramaDistance(currentD + step);
        if (this.onSetCameraZ) {
          this.onSetCameraZ(newD, false);
        }
      }, { passive: false });
    }

    const astrolabeScale = this.element.querySelector('#astrolabe-floating-scale') as HTMLElement;
    if (astrolabeScale) {
      astrolabeScale.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const currentZ = this.currentCameraZ || EXPERIENCE_GEOMETRY.camera.overview;
        const step = (e.deltaY > 0 ? 1 : -1) * 0.20;
        const newZ = Math.min(this.maxZ, Math.max(this.minZ, currentZ + step));
        if (this.onSetCameraZ) {
          this.onSetCameraZ(newZ, false);
        }
      }, { passive: false });
    }

    // 8.6. 百岳名片长卷滚动拦截放行与原生滚轮保障 (Mountain Cards Track Wheel)
    const mountainTrack = this.element.querySelector('#mountain-cards-track') as HTMLElement;
    if (mountainTrack) {
      mountainTrack.addEventListener('wheel', (e: WheelEvent) => {
        // 阻止向上冒泡被三维场景误捕获，保障原生滚动顺滑无阻
        e.stopPropagation();
      }, { passive: true });
    }

    // 9. Diorama Topographic Layer Tabs Click
    const layerTabs = this.element.querySelectorAll('.layer-tab');
    layerTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        const layer = tab.getAttribute('data-layer') as 'topography' | 'landforms' | 'mountains' | 'waters' | 'roads' | 'cities';
        if (layer) {
          layerTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.sound.playBronzeBell();
          this.onDioramaLayerSwitch?.(layer);
          if (layer === 'mountains') {
            this.openMountainDock(true);
          }
        }
      });
    });

    // 9.5. Diorama Sundial Time-of-Day Buttons Click (四时气象)
    const sundialBtns = this.element.querySelectorAll('.sundial-btn');
    sundialBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const timeMode = btn.getAttribute('data-time') as DioramaTimeMode;
        if (timeMode) {
          sundialBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.sound.playBronzeBell();
          this.onDioramaTimeOfDaySwitch?.(timeMode);
        }
      });
    });

    // 10. Diorama Info Card Close (联动熄灭 3D 光柱与卡片高亮)
    this.element.querySelector('#diorama-info-close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideDioramaInfoCard();
      const cards = this.element.querySelectorAll('.mountain-card-item');
      cards.forEach(c => c.classList.remove('active'));
      this.onDioramaMountainDeselect?.();
    });

    // 10.5. Diorama Panel 3D Folding & Docked Talisman Awakening (经折装收放仪轨)
    const foldLayerBtn = this.element.querySelector('#fold-layer-selector-btn');
    const dockedLayerTab = this.element.querySelector('#docked-tab-layer-selector');
    foldLayerBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playBronzeBell();
      this.foldLayerSelector(true);
    });
    dockedLayerTab?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playBronzeBell();
      this.foldLayerSelector(false);
    });

    const foldLegendBtn = this.element.querySelector('#fold-legend-btn');
    const dockedLegendTab = this.element.querySelector('#docked-tab-legend');
    foldLegendBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playBronzeBell();
      this.foldLegend(true);
    });
    dockedLegendTab?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playBronzeBell();
      this.foldLegend(false);
    });

    // 10.6. Mountain Dock Folding & Talisman Awakening (名山导览坞收放)
    const foldMtnBtn = this.element.querySelector('#fold-mountain-dock-btn');
    const dockedMtnTab = this.element.querySelector('#docked-tab-mountains');
    foldMtnBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playBronzeBell();
      this.openMountainDock(false);
    });
    dockedMtnTab?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playBronzeBell();
      this.openMountainDock(true);
    });

    // 10.7. Mountain Filter Tabs Click (区域筛选)
    const filterTabs = this.element.querySelectorAll('.mountain-filter-btn');
    filterTabs.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const region = btn.getAttribute('data-region') || 'all';
        filterTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.sound.playBronzeBell();
        this.currentMountainRegion = region;
        this.renderMountainCards(region);
      });
    });

    // 11. Bottom Action: Scroll Cue Button Click
    const scrollCueBtn = this.element.querySelector('#hero-scroll-cue-btn');
    const triggerScroll = () => {
      SoundEngine.getInstance().playParchment();
      if (this.onViewScroll) {
        this.onViewScroll();
      } else {
        const dailyStage = document.getElementById('daily-stage');
        if (dailyStage) {
          dailyStage.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    scrollCueBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerScroll();
    });
    scrollCueBtn?.addEventListener('keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') {
        ke.preventDefault();
        triggerScroll();
      }
    });
  }

  public foldLayerSelector(folded: boolean) {
    this.isLayerSelectorFolded = folded;
    const panel = this.element.querySelector('#diorama-layer-selector') as HTMLElement;
    const tab = this.element.querySelector('#docked-tab-layer-selector') as HTMLElement;
    const isDiorama = this.currentDimension === 'diorama';
    if (!panel || !tab) return;

    if (this.foldLayerSelectorTimer) {
      window.clearTimeout(this.foldLayerSelectorTimer);
      this.foldLayerSelectorTimer = null;
    }

    if (folded) {
      // 1. 绝对互斥！折叠动作开始时，展开令牌必须保持绝对隐藏，严禁提前显示
      tab.classList.remove('docked-tab-active');
      tab.style.display = 'none';

      // 2. 主面板触发 3D 经折滑匣收纳动画
      panel.classList.add('panel-3d-folded');

      // 3. 严格等待主面板彻底滑出屏幕并淡出隐藏后（300ms），唤醒令牌方才优雅破茧浮现
      this.foldLayerSelectorTimer = window.setTimeout(() => {
        if (this.isLayerSelectorFolded && this.currentDimension === 'diorama') {
          panel.style.display = 'none';
          tab.style.display = 'flex';
          void tab.offsetWidth;
          tab.classList.add('docked-tab-active');
        }
      }, 300);
    } else {
      // 唤醒流程：唤醒令牌先优雅收缩隐退
      tab.classList.remove('docked-tab-active');
      this.foldLayerSelectorTimer = window.setTimeout(() => {
        tab.style.display = 'none';
        if (!this.isLayerSelectorFolded && this.currentDimension === 'diorama') {
          panel.style.display = 'flex';
          void panel.offsetWidth;
          panel.classList.remove('panel-3d-folded');
        }
      }, 140);
    }
  }

  public foldLegend(folded: boolean) {
    this.isLegendFolded = folded;
    const panel = this.element.querySelector('#diorama-hypsometric-legend') as HTMLElement;
    const tab = this.element.querySelector('#docked-tab-legend') as HTMLElement;
    const isDiorama = this.currentDimension === 'diorama';
    if (!panel || !tab) return;

    if (this.foldLegendTimer) {
      window.clearTimeout(this.foldLegendTimer);
      this.foldLegendTimer = null;
    }

    if (folded) {
      // 1. 绝对互斥！折叠动作开始时，展开令牌必须保持绝对隐藏
      tab.classList.remove('docked-tab-active');
      tab.style.display = 'none';

      // 2. 主面板触发 3D 经折滑匣收纳动画
      panel.classList.add('panel-3d-folded');

      // 3. 严格等待主面板彻底滑出屏幕并淡出隐藏后（300ms），唤醒令牌方才破茧浮现
      this.foldLegendTimer = window.setTimeout(() => {
        if (this.isLegendFolded && this.currentDimension === 'diorama') {
          panel.style.display = 'none';
          tab.style.display = 'flex';
          void tab.offsetWidth;
          tab.classList.add('docked-tab-active');
        }
      }, 300);
    } else {
      // 唤醒流程
      tab.classList.remove('docked-tab-active');
      this.foldLegendTimer = window.setTimeout(() => {
        tab.style.display = 'none';
        if (!this.isLegendFolded && this.currentDimension === 'diorama') {
          panel.style.display = 'flex';
          void panel.offsetWidth;
          panel.classList.remove('panel-3d-folded');
        }
      }, 140);
    }
  }

  public openMountainDock(open: boolean) {
    this.isMountainDockFolded = !open;
    const panel = this.element.querySelector('#diorama-mountain-dock') as HTMLElement;
    const tab = this.element.querySelector('#docked-tab-mountains') as HTMLElement;
    const scaleBar = this.element.querySelector('#diorama-floating-scale') as HTMLElement;
    if (!panel || !tab) return;

    if (this.foldMountainDockTimer) {
      window.clearTimeout(this.foldMountainDockTimer);
      this.foldMountainDockTimer = null;
    }

    if (scaleBar) {
      scaleBar.classList.toggle('dock-expanded', open);
    }

    if (!open) {
      // 🚨 联动关闭左侧山岳案卷名片与 3D 光柱，彻底解决“右侧百岳都隐藏了，左侧山的名片还存在”的问题！
      this.hideDioramaInfoCard();
      const cards = this.element.querySelectorAll('.mountain-card-item');
      cards.forEach(c => c.classList.remove('active'));
      this.onDioramaMountainDeselect?.();

      tab.classList.remove('docked-tab-active');
      tab.style.display = 'none';
      panel.classList.add('panel-3d-folded');

      this.foldMountainDockTimer = window.setTimeout(() => {
        if (this.isMountainDockFolded && this.currentDimension === 'diorama') {
          panel.style.display = 'none';
          tab.style.display = 'flex';
          void tab.offsetWidth;
          tab.classList.add('docked-tab-active');
        }
      }, 300);
    } else {
      tab.classList.remove('docked-tab-active');
      this.foldMountainDockTimer = window.setTimeout(() => {
        tab.style.display = 'none';
        if (!this.isMountainDockFolded && this.currentDimension === 'diorama') {
          panel.style.display = 'flex';
          void panel.offsetWidth;
          panel.classList.remove('panel-3d-folded');
        }
      }, 140);
    }
  }

  public renderMountainCards(region: string) {
    const track = this.element.querySelector('#mountain-cards-track');
    if (!track) return;

    let list: FamousMountainDef[] = [];
    if (region === 'all') {
      list = [...FAMOUS_MOUNTAINS].sort((a, b) => b.altitude - a.altitude);
    } else if (region === 'east') {
      // 粤东 · 莲花山系 (揭阳11、梅州3、潮州、汕头3、汕尾、河源2)
      list = FAMOUS_MOUNTAINS.filter(m => ['jieyang', 'meizhou', 'chaozhou', 'shantou', 'shanwei', 'heyuan'].includes(m.cityId))
        .sort((a, b) => b.altitude - a.altitude);
    } else if (region === 'north') {
      // 粤北 · 南岭主脊 (韶关、清远)
      list = FAMOUS_MOUNTAINS.filter(m => ['shaoguan', 'qingyuan'].includes(m.cityId))
        .sort((a, b) => b.altitude - a.altitude);
    } else if (region === 'bayarea') {
      // 珠三角 · 环湾名岳 (广州、深圳、珠海、佛山、惠州、东莞、中山、江门、肇庆、香港、澳门)
      list = FAMOUS_MOUNTAINS.filter(m => ['guangzhou', 'shenzhen', 'zhuhai', 'foshan', 'huizhou', 'dongguan', 'zhongshan', 'jiangmen', 'zhaoqing', 'hongkong', 'macao', 'macau'].includes(m.cityId))
        .sort((a, b) => b.altitude - a.altitude);
    } else if (region === 'west') {
      // 粤西 · 云开高凉 (茂名、湛江、阳江、云浮)
      list = FAMOUS_MOUNTAINS.filter(m => ['maoming', 'zhanjiang', 'yangjiang', 'yunfu'].includes(m.cityId))
        .sort((a, b) => b.altitude - a.altitude);
    }

    if (list.length === 0) {
      list = [...FAMOUS_MOUNTAINS].sort((a, b) => b.altitude - a.altitude);
    }

    track.innerHTML = list.map(m => {
      const tierBadge = m.peakTier === 'highest' ? '极巅' : (m.peakTier === 'celebrated' ? '名岳' : '灵峰');
      const cleanCity = m.cityName.replace('市', '').replace('特别行政区', '');
      const subTitle = m.subName ? m.subName.split('(')[0].trim() : m.geology;
      return `
        <div class="mountain-card-item" data-mountain-id="${m.id}" style="--peak-theme-color: ${m.color};">
          <div class="card-item-glow"></div>
          <div class="card-item-header">
            <div class="header-left">
              <span class="card-peak-tier tier-${m.peakTier}">${tierBadge}</span>
              <span class="card-peak-city">${cleanCity}</span>
              <span class="card-peak-elem elem-${m.element}">${m.element}行</span>
            </div>
            <span class="card-peak-alt">▲ ${m.altitude.toLocaleString()}m</span>
          </div>
          <div class="card-item-title-row">
            <span class="card-item-title">${m.name}</span>
            <span class="card-item-range" title="${subTitle}">${subTitle}</span>
          </div>
          <div class="card-item-footer">
            <span class="card-item-geology" title="${m.geology}">${m.geology}</span>
            <div class="card-item-action">
              <span class="fly-icon">✦</span>
              <span class="fly-text">飞跃聚光</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const cards = track.querySelectorAll('.mountain-card-item');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const mountainId = card.getAttribute('data-mountain-id');
        if (mountainId) {
          this.sound.playBronzeBell();
          cards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          this.onDioramaMountainSelect?.(mountainId);
        }
      });
    });
  }

  public updateDestination(dest: DestinationItem, isStamped = false) {
    this.currentDest = dest;
    this.isStamped = isStamped;
    this.updateHUDValues();
    if (this.scrollDrawer) {
      this.scrollDrawer.updateDestination(dest, isStamped);
    }
  }

  public setDimensionMode(mode: DimensionMode) {
    this.element.querySelectorAll('.hero-dim-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });

    const isGlobe = mode === 'globe';
    const isBeast = mode === 'beast';
    const isDiorama = mode === 'diorama';
    const summonBar = this.element.querySelector('.hero-beast-summon-bar') as HTMLElement;
    const summonBtn = this.element.querySelector('#hero-summon-beast-btn');
    const scaleBar = this.element.querySelector('#astrolabe-floating-scale') as HTMLElement;
    const dioramaScaleBar = this.element.querySelector('#diorama-floating-scale') as HTMLElement;
    const dioramaLayerSelector = this.element.querySelector('#diorama-layer-selector') as HTMLElement;
    const dioramaLegend = this.element.querySelector('#diorama-hypsometric-legend') as HTMLElement;
    const dioramaMountainDock = this.element.querySelector('#diorama-mountain-dock') as HTMLElement;
    const dockedLayerSelector = this.element.querySelector('#docked-tab-layer-selector') as HTMLElement;
    const dockedLegend = this.element.querySelector('#docked-tab-legend') as HTMLElement;
    const dockedMountains = this.element.querySelector('#docked-tab-mountains') as HTMLElement;
    const summonTitle = this.element.querySelector('#summon-btn-title');

    // 仅在切换离开神州坤舆模式时关闭城市案卷名片
    if (!isGlobe) {
      this.closeCityDossier();
    }
    this.showHoverTooltip(null, { x: 0, y: 0 });
    this.showDioramaTooltip(null, { x: 0, y: 0 });

    if (!isDiorama) {
      this.hideDioramaInfoCard();
    }

    if (summonBar) {
      summonBar.style.display = isDiorama ? 'none' : 'flex';
    }

    if (summonBtn) {
      summonBtn.classList.toggle('active-mode', isBeast);
      if (summonTitle) {
        summonTitle.textContent = isGlobe ? `召来【${this.currentDest.guardian.name}】真身` : `返回【${this.currentDest.cityName}】坤舆大观`;
      }
    }

    // 尺寸条、舆地透镜、分层设色图例与名山导览坞按需出现：
    if (scaleBar) {
      scaleBar.style.display = isGlobe ? 'flex' : 'none';
    }
    if (dioramaScaleBar) {
      dioramaScaleBar.style.display = isDiorama ? 'flex' : 'none';
      dioramaScaleBar.classList.toggle('dock-expanded', isDiorama && !this.isMountainDockFolded);
    }
    if (dioramaLayerSelector) {
      dioramaLayerSelector.style.display = (isDiorama && !this.isLayerSelectorFolded) ? 'flex' : 'none';
      dioramaLayerSelector.classList.toggle('panel-3d-folded', this.isLayerSelectorFolded);
    }
    if (dioramaLegend) {
      dioramaLegend.style.display = (isDiorama && !this.isLegendFolded) ? 'flex' : 'none';
      dioramaLegend.classList.toggle('panel-3d-folded', this.isLegendFolded);
    }
    if (dioramaMountainDock) {
      dioramaMountainDock.style.display = (isDiorama && !this.isMountainDockFolded) ? 'flex' : 'none';
      dioramaMountainDock.classList.toggle('panel-3d-folded', this.isMountainDockFolded);
    }
    if (dockedLayerSelector) {
      dockedLayerSelector.style.display = (isDiorama && this.isLayerSelectorFolded) ? 'flex' : 'none';
      dockedLayerSelector.classList.toggle('docked-tab-active', isDiorama && this.isLayerSelectorFolded);
    }
    if (dockedLegend) {
      dockedLegend.style.display = (isDiorama && this.isLegendFolded) ? 'flex' : 'none';
      dockedLegend.classList.toggle('docked-tab-active', isDiorama && this.isLegendFolded);
    }
    if (dockedMountains) {
      dockedMountains.style.display = (isDiorama && this.isMountainDockFolded) ? 'flex' : 'none';
      dockedMountains.classList.toggle('docked-tab-active', isDiorama && this.isMountainDockFolded);
    }
    if (!isDiorama) {
      this.showDioramaProbeHUD(null, { x: 0, y: 0 });
    }
  }

  public setTransitioning(transitioning: boolean) {
    const scaleBar = this.element.querySelector('#astrolabe-floating-scale') as HTMLElement;
    const dioramaScaleBar = this.element.querySelector('#diorama-floating-scale') as HTMLElement;
    const dioramaLayerSelector = this.element.querySelector('#diorama-layer-selector') as HTMLElement;
    const dioramaLegend = this.element.querySelector('#diorama-hypsometric-legend') as HTMLElement;
    const dioramaMountainDock = this.element.querySelector('#diorama-mountain-dock') as HTMLElement;
    const dockedLayerSelector = this.element.querySelector('#docked-tab-layer-selector') as HTMLElement;
    const dockedLegend = this.element.querySelector('#docked-tab-legend') as HTMLElement;
    const dockedMountains = this.element.querySelector('#docked-tab-mountains') as HTMLElement;
    const dioramaInfo = this.element.querySelector('#diorama-info-card') as HTMLElement;
    if (scaleBar) {
      scaleBar.classList.toggle('gauge-transition-hidden', transitioning);
    }
    if (dioramaScaleBar) {
      dioramaScaleBar.classList.toggle('gauge-transition-hidden', transitioning);
    }
    if (dioramaLayerSelector) {
      dioramaLayerSelector.classList.toggle('gauge-transition-hidden', transitioning);
    }
    if (dioramaLegend) {
      dioramaLegend.classList.toggle('gauge-transition-hidden', transitioning);
    }
    if (dioramaMountainDock) {
      dioramaMountainDock.classList.toggle('gauge-transition-hidden', transitioning);
    }
    if (dockedLayerSelector) {
      dockedLayerSelector.classList.toggle('gauge-transition-hidden', transitioning);
    }
    if (dockedLegend) {
      dockedLegend.classList.toggle('gauge-transition-hidden', transitioning);
    }
    if (dockedMountains) {
      dockedMountains.classList.toggle('gauge-transition-hidden', transitioning);
    }
    if (dioramaInfo && transitioning) {
      this.hideDioramaInfoCard();
    }
  }

  public showDioramaProbeHUD(probeData: DioramaProbeData | null, screenPos: { x: number; y: number }) {
    if (!this.cachedProbeHud) {
      this.cachedProbeHud = this.element.querySelector('#diorama-probe-hud') as HTMLElement;
      if (this.cachedProbeHud) {
        this.cachedProbeTier = this.cachedProbeHud.querySelector('#probe-hud-tier') as HTMLElement;
        this.cachedProbeAlt = this.cachedProbeHud.querySelector('#probe-hud-alt') as HTMLElement;
        this.cachedProbeTitle = this.cachedProbeHud.querySelector('#probe-hud-title') as HTMLElement;
        this.cachedProbeCoords = this.cachedProbeHud.querySelector('#probe-hud-coords') as HTMLElement;
      }
    }
    const hud = this.cachedProbeHud;
    if (!hud) return;

    if (!probeData) {
      hud.style.display = 'none';
      return;
    }

    const isOcean = probeData.elevationMeters < 0 || probeData.tierName === '沧溟';

    if (this.cachedProbeTier) {
      this.cachedProbeTier.textContent = probeData.tierName;
      this.cachedProbeTier.style.borderColor = isOcean ? '#38BDF8' : probeData.colorHex;
      this.cachedProbeTier.style.color = isOcean ? '#38BDF8' : probeData.colorHex;
      this.cachedProbeTier.style.background = isOcean ? 'rgba(14, 72, 112, 0.45)' : 'rgba(0, 0, 0, 0.4)';
    }
    if (this.cachedProbeAlt) {
      if (isOcean) {
        this.cachedProbeAlt.textContent = `▼ ${Math.abs(probeData.elevationMeters).toLocaleString()}m (水深)`;
        this.cachedProbeAlt.style.color = '#38BDF8';
        this.cachedProbeAlt.style.textShadow = '0 0 8px rgba(56, 189, 248, 0.7)';
      } else {
        this.cachedProbeAlt.textContent = `▲ ${probeData.elevationMeters.toLocaleString()}m`;
        this.cachedProbeAlt.style.color = '#FFE082';
        this.cachedProbeAlt.style.textShadow = '0 0 8px rgba(212, 175, 55, 0.6)';
      }
    }
    if (this.cachedProbeTitle) {
      this.cachedProbeTitle.textContent = probeData.zoneTitle;
    }
    if (this.cachedProbeCoords) {
      this.cachedProbeCoords.textContent = `${probeData.lng.toFixed(2)}°E, ${probeData.lat.toFixed(2)}°N`;
    }

    if (isOcean) {
      hud.style.borderColor = 'rgba(56, 189, 248, 0.65)';
      hud.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.85), 0 0 16px rgba(56, 189, 248, 0.35)';
    } else {
      hud.style.borderColor = 'rgba(212, 175, 55, 0.55)';
      hud.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.85), 0 0 14px rgba(212, 175, 55, 0.2)';
    }

    const hudW = 240;
    const hudH = 88;
    const left = Math.max(16, Math.min(window.innerWidth - hudW - 16, screenPos.x + 20));
    const top = Math.max(16, Math.min(window.innerHeight - hudH - 16, screenPos.y + 20));

    // 使用 GPU 硬件加速的 translate3d 定位，彻底避免修改 left/top 引发的 CPU 重排 (Reflow)
    hud.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    hud.style.display = 'flex';
  }

  public showDioramaInfoCard(hitData: DioramaInteractableHit) {
    const card = this.element.querySelector('#diorama-info-card') as HTMLElement;
    if (!card) return;

    const typeTag = this.element.querySelector('#diorama-info-type-tag') as HTMLElement;
    const title = this.element.querySelector('#diorama-info-title') as HTMLElement;
    const sub = this.element.querySelector('#diorama-info-sub') as HTMLElement;
    const key1 = this.element.querySelector('#meta-key-1') as HTMLElement;
    const val1 = this.element.querySelector('#meta-val-1') as HTMLElement;
    const key2 = this.element.querySelector('#meta-key-2') as HTMLElement;
    const val2 = this.element.querySelector('#meta-val-2') as HTMLElement;
    const desc = this.element.querySelector('#diorama-info-desc') as HTMLElement;

    if (hitData.type === 'mountain') {
      if (typeTag) typeTag.textContent = '神岳';
      if (title) title.textContent = hitData.name;
      if (sub) sub.textContent = hitData.subName || `${hitData.altitude || ''}m`;
      if (key1) key1.textContent = '五行灵蕴';
      if (val1) val1.textContent = `${hitData.element || '灵'}气所钟`;
      if (key2) key2.textContent = '地质风貌';
      if (val2) val2.textContent = hitData.geology || '名山胜境';
      if (desc) desc.textContent = `【${hitData.name}】乃岭南名岳地脉之枢纽，高耸入云，天光贯顶，灵气浩荡，镇守一方水土文脉。`;
    } else if (hitData.type === 'river') {
      if (typeTag) typeTag.textContent = '水脉';
      if (title) title.textContent = hitData.name.split(' · ')[0];
      if (sub) sub.textContent = hitData.subName || hitData.name;
      if (key1) key1.textContent = '水系归属';
      if (val1) val1.textContent = '珠江水系';
      if (key2) key2.textContent = '入海流势';
      if (val2) val2.textContent = '三江汇海';
      if (desc) desc.textContent = `【${hitData.name}】穿山破峡，滋养千万顷岭南平原沃土，奔涌汇入浩瀚南海。`;
    } else if (hitData.type === 'city' && hitData.dest) {
      const dest = hitData.dest;
      if (typeTag) typeTag.textContent = '城邑';
      if (title) title.textContent = dest.cityName;
      if (sub) sub.textContent = dest.ancientMythicName || dest.cityName;
      if (key1) key1.textContent = '分野星次';
      if (val1) val1.textContent = dest.lunarMansion?.name || '天市垣';
      if (key2) key2.textContent = '镇境神兽';
      if (val2) val2.textContent = dest.guardian?.name || '青龙';
      if (desc) desc.textContent = `【${dest.cityName}】${dest.historicalOrigin || dest.description || '千年名城，物华天宝，人杰地灵。'}`;
    }

    card.style.display = 'flex';
  }

  public hideDioramaInfoCard() {
    const card = this.element.querySelector('#diorama-info-card') as HTMLElement;
    if (card) card.style.display = 'none';
  }

  public setStamped(stamped: boolean) {
    this.isStamped = stamped;
    if (this.scrollDrawer) {
      this.scrollDrawer.setStamped(stamped);
    }
  }

  public updateCameraDistance(currentZ: number, _minZ?: number, _maxZ?: number) {
    this.currentCameraZ = currentZ;
    if (this.currentDimension === 'diorama') {
      this.updateDioramaCameraDistance(currentZ);
      return;
    }

    const zPct = getGaugeProgress(currentZ);
    const thumb = this.element.querySelector('#jade-orb-slider-thumb') as HTMLElement;
    const activeGlow = this.element.querySelector('#track-active-glow') as HTMLElement;
    const realtimeZ = this.element.querySelector('#cursor-realtime-z');
    const realtimeTier = this.element.querySelector('#cursor-realtime-tier');
    const tierLabel = this.element.querySelector('#gauge-tier-label');

    if (thumb) thumb.style.top = `${zPct * 100}%`;
    if (activeGlow) activeGlow.style.height = `${zPct * 100}%`;
    if (realtimeZ) realtimeZ.textContent = `Z: ${currentZ.toFixed(2)}`;

    const tier = getGaugeTier(currentZ);

    if (realtimeTier) realtimeTier.textContent = tier;
    if (tierLabel) tierLabel.textContent = `司天 · ${tier}`;

    this.element.querySelectorAll('.celadon-station').forEach(station => {
      const sZ = parseFloat(station.getAttribute('data-z') || String(EXPERIENCE_GEOMETRY.camera.overview));
      const sPct = getGaugeProgress(sZ);
      const diff = Math.abs(sPct - zPct);
      station.classList.toggle('active', diff < 0.08);
    });
  }

  public updateDioramaCameraDistance(currentDist: number) {
    this.currentDioramaDistance = currentDist;
    const dPct = getDioramaGaugeProgress(currentDist);
    const thumb = this.element.querySelector('#diorama-reticle-thumb') as HTMLElement;
    const activeGlow = this.element.querySelector('#diorama-track-active-glow') as HTMLElement;
    const realtimeD = this.element.querySelector('#diorama-realtime-d');
    const realtimeTier = this.element.querySelector('#diorama-realtime-tier');
    const tierLabel = this.element.querySelector('#diorama-gauge-tier-label');

    if (thumb) thumb.style.top = `${dPct * 100}%`;
    if (activeGlow) activeGlow.style.height = `${dPct * 100}%`;
    if (realtimeD) realtimeD.textContent = `D: ${currentDist.toFixed(2)}`;

    const tier = getDioramaGaugeTier(currentDist);

    if (realtimeTier) realtimeTier.textContent = tier;
    if (tierLabel) tierLabel.textContent = `地官 · ${tier}`;

    this.element.querySelectorAll('.sandalwood-station').forEach(station => {
      const sDist = parseFloat(station.getAttribute('data-d') || '4.0');
      const sPct = getDioramaGaugeProgress(sDist);
      const diff = Math.abs(sPct - dPct);
      station.classList.toggle('active', diff < 0.08);
    });
  }

  private updateHUDValues() {
    const d = this.currentDest;
    const summonTitle = this.element.querySelector('#summon-btn-title');
    if (summonTitle) summonTitle.textContent = `召来【${d.guardian.name}】真身`;
  }

  
  public showDioramaTooltip(hit: any | null, screenPos: { x: number; y: number }) {
    const tooltip = this.element.querySelector('#city-3d-tooltip') as HTMLElement;
    if (!tooltip) return;

    if (hit && this.currentDimension === 'diorama') {
      const isMountain = hit.type === 'mountain';
      const borderColor = hit.color || (isMountain ? '#DFB143' : '#48D1CC');
      const glowColor = isMountain ? '#F6D365' : '#80D8FF';
      const displayTitle = hit.name;
      const subTitle = hit.subName || '';
      const icon = isMountain ? '⛰️' : '✦';
      const altitudeText = hit.altitude ? `海拔 ${hit.altitude} 米` : '地势灵枢';
      const elementBadge = hit.element ? `〔 五行 · ${hit.element} 〕` : '';
      const geologyText = hit.geology || '地脉奇观';

      tooltip.style.display = 'flex';
      tooltip.style.left = `${screenPos.x}px`;
      tooltip.style.top = `${screenPos.y - 24}px`;
      tooltip.style.borderColor = borderColor;
      tooltip.style.boxShadow = `0 16px 36px rgba(0, 0, 0, 0.95), 0 0 20px ${glowColor}60, inset 0 0 10px rgba(0, 0, 0, 0.6)`;
      tooltip.style.background = 'linear-gradient(135deg, rgba(8, 14, 24, 0.96) 0%, rgba(14, 22, 34, 0.94) 100%)';
      tooltip.className = 'city-hover-tooltip placement-top diorama-tooltip';

      tooltip.innerHTML = `
        <div class="jade-corner corner-tl" style="border-color: ${borderColor};"></div>
        <div class="jade-corner corner-tr" style="border-color: ${borderColor};"></div>
        <div class="jade-corner corner-bl" style="border-color: ${borderColor};"></div>
        <div class="jade-corner corner-br" style="border-color: ${borderColor};"></div>
        
        <div class="tooltip-title" style="color: #FFFDF9; text-shadow: 0 0 12px ${glowColor}70, 0 2px 5px rgba(0, 0, 0, 0.95);">
          ${displayTitle}
        </div>
        <div class="tooltip-divider" style="background: linear-gradient(90deg, transparent 0%, ${borderColor}40 25%, ${borderColor}90 50%, ${borderColor}40 75%, transparent 100%);"></div>
        <div class="tooltip-crest" style="color: ${glowColor}; text-shadow: 0 0 8px ${glowColor}80, 0 1px 4px rgba(0, 0, 0, 0.9);">
          <span class="crest-icon">${icon}</span>
          <span class="crest-name">${subTitle} ${elementBadge}</span>
        </div>
        <div class="diorama-tooltip-details" style="font-size: 11px; color: rgba(220, 235, 230, 0.85); margin-top: 5px; text-align: center; line-height: 1.4;">
          <div>${altitudeText} · ${geologyText}</div>
        </div>
      `;
    } else if (!this.hoveredCity && !this.hoveredMansion) {
      tooltip.style.display = 'none';
      tooltip.innerHTML = '';
    }
  }

  public showHoverTooltip(city: DestinationItem | null, screenPos: { x: number; y: number }) {
    this.hoveredCity = city;
    const tooltip = this.element.querySelector('#city-3d-tooltip') as HTMLElement;
    if (!tooltip) return;

    if (city && this.currentDimension === 'globe') {
      const adminCfg = CITY_ADMINISTRATIVE_DATA[city.id];
      const colorCfg = CITY_TRADITIONAL_COLORS[city.id];
      const themeColor = colorCfg?.primary || adminCfg?.themeColor || city.colorTheme?.primary || '#5B8266';
      const glowColor = colorCfg?.glow || adminCfg?.glowColor || city.colorTheme?.glow || '#87CEEB';
      const borderColor = colorCfg?.borderColor || glowColor;
      const rawColorName = colorCfg?.colorName ? colorCfg.colorName.split(' · ')[0] : '传统国色';
      const displayTitle = `${city.cityName} · ${city.ancientMythicName}`;
      const beastSvg = getBeastSvgIcon(city.guardian?.name || '', glowColor, 16);

      tooltip.style.display = 'flex';
      tooltip.style.left = `${screenPos.x}px`;
      tooltip.style.top = `${screenPos.y - 24}px`;
      tooltip.style.borderColor = borderColor;
      tooltip.style.boxShadow = `0 12px 32px rgba(0, 0, 0, 0.92), 0 0 18px ${glowColor}50, inset 0 0 10px rgba(0, 0, 0, 0.6)`;
      tooltip.style.background = 'linear-gradient(135deg, rgba(8, 14, 24, 0.96) 0%, rgba(14, 22, 34, 0.94) 100%)';
      tooltip.className = 'city-hover-tooltip placement-top';

      tooltip.innerHTML = `
        <div class="jade-corner corner-tl" style="border-color: ${borderColor};"></div>
        <div class="jade-corner corner-tr" style="border-color: ${borderColor};"></div>
        <div class="jade-corner corner-bl" style="border-color: ${borderColor};"></div>
        <div class="jade-corner corner-br" style="border-color: ${borderColor};"></div>
        
        <div class="tooltip-title" style="color: #FFFDF9; text-shadow: 0 0 12px ${glowColor}70, 0 2px 5px rgba(0, 0, 0, 0.95);">${displayTitle}</div>
        <div class="tooltip-divider" style="background: linear-gradient(90deg, transparent 0%, ${borderColor}40 25%, ${borderColor}90 50%, ${borderColor}40 75%, transparent 100%);"></div>
        <div class="tooltip-crest" style="color: ${glowColor}; text-shadow: 0 0 8px ${glowColor}80, 0 1px 4px rgba(0, 0, 0, 0.9); display: flex; align-items: center; justify-content: center; gap: 6px;">
          <span class="crest-icon" style="display: inline-flex; align-items: center;">${beastSvg}</span>
          <span class="crest-name">${city.guardian.name} · ${rawColorName}</span>
        </div>
      `;
    } else if (!this.hoveredMansion) {
      tooltip.style.display = 'none';
      tooltip.innerHTML = '';
    }
  }

  public openCityDossier(city: DestinationItem | null) {
    if (!city) {
      this.closeCityDossier();
      return;
    }
    this.currentDest = city;
    this.updateHUDValues();
    if (this.scrollDrawer) {
      this.scrollDrawer.open(city, this.isStamped);
    }
    experienceState.setDossierOpen(true);
  }

  public closeCityDossier() {
    if (this.scrollDrawer) {
      this.scrollDrawer.close();
    }
    experienceState.setDossierOpen(false);
  }

  public isDossierOpen(): boolean {
    return this.scrollDrawer?.getIsOpen() || false;
  }

  public showMansionTooltip(mansion: LunarMansionItem | null, screenPos: { x: number; y: number }) {
    this.hoveredMansion = mansion;
    const tooltip = this.element.querySelector('#city-3d-tooltip') as HTMLElement;
    if (!tooltip) return;

    if (mansion && this.currentDimension === 'globe') {
      tooltip.className = 'city-hover-tooltip placement-top';
      tooltip.style.removeProperty('--city-accent');
      tooltip.style.display = 'flex';
      tooltip.style.left = `${screenPos.x}px`;
      tooltip.style.top = `${screenPos.y - 18}px`;
      tooltip.style.borderColor = '#80D8FF';
      tooltip.style.boxShadow = `0 12px 36px rgba(0, 0, 0, 0.95), 0 0 24px rgba(128, 216, 255, 0.5)`;

      tooltip.innerHTML = `
        <div class="tooltip-header">
          <span class="tooltip-icon">✨</span>
          <span class="tooltip-elem">〔 二十八星宿 · ${mansion.beastCategoryName} 〕</span>
        </div>
        <div class="tooltip-divider" style="background: linear-gradient(90deg, transparent 0%, #80D8FF99 35%, #80D8FF99 65%, transparent 100%);"></div>
        <div class="tooltip-title">${mansion.name} · ${mansion.animal}</div>
        <div class="tooltip-footer">✦ 对应地表分野：${mansion.associatedCityName || '当前区域'} ✦</div>
      `;
    } else if (!this.hoveredCity) {
      tooltip.style.display = 'none';
      tooltip.innerHTML = '';
    }
  }
}
