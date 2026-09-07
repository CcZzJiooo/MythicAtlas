import './style/index.css';
import { DESTINATIONS_DATA, findDestinationById } from './data/destinations';
import {
  getGate2SampleById,
  getGate2SampleForDestination,
  type Gate2GoldenSlice
} from './data/gate2GoldenSlice';
import { getGate2RegionalEvidence } from './data/gate2RegionalEvidence';
import { TimeEngine } from './core/TimeEngine';
import { StorageManager } from './core/StorageManager';
import { SoundEngine } from './core/SoundEngine';
import { experienceState, EXPERIENCE_GEOMETRY, type DimensionMode } from './core/experienceState';
import { ThreeScene } from './webgl/ThreeScene';
import { LoadingOverlay } from './ui/LoadingOverlay';
import { Navbar } from './ui/Navbar';
import { HeroSection } from './ui/HeroSection';
import { DailyScenicStage } from './ui/DailyScenicStage';
import { GuangdongGallerySection } from './ui/GuangdongGallerySection';
import { TimelineSection } from './ui/TimelineSection';
import { PassportSection } from './ui/PassportSection';
import { OracleDrawer } from './ui/OracleDrawer';
import { LunarMansionModal } from './ui/LunarMansionModal';
import { SolarTermModal } from './ui/SolarTermModal';
import { CustomCursor } from './ui/CustomCursor';
import type { DestinationItem } from './types';

class MythicAtlasApp {
  private timeEngine: TimeEngine;
  private storage: StorageManager;
  private sound: SoundEngine;

  private scene: ThreeScene | null = null;
  private loadingOverlay: LoadingOverlay;
  private customCursor: CustomCursor | null = null;

  private navbar: Navbar | null = null;
  private heroSection: HeroSection | null = null;
  private dailyScenicStage: DailyScenicStage | null = null;
  private gallerySection: GuangdongGallerySection | null = null;
  private timelineSection: TimelineSection | null = null;
  private passportSection: PassportSection | null = null;
  private oracleDrawer: OracleDrawer | null = null;
  private lunarMansionModal: LunarMansionModal | null = null;
  private solarTermModal: SolarTermModal | null = null;

  private activeDestination: DestinationItem;
  private countdownTimerId: number | null = null;

  constructor() {
    this.loadingOverlay = new LoadingOverlay();
    this.timeEngine = TimeEngine.getInstance();
    this.storage = StorageManager.getInstance();
    this.sound = SoundEngine.getInstance();

    const status = this.timeEngine.getCalendarStatus();
    const calendarDestination = status.todayDestination || DESTINATIONS_DATA[0];
    this.activeDestination = this.resolveGate2InitialDestination(calendarDestination);
    this.setActiveDestination(this.activeDestination);

    this.init();
  }

  private async init() {
    this.lockHeroScroll();
    this.loadingOverlay.setProgress(20);

    // 0. Initialize Custom Cursor
    this.customCursor = new CustomCursor();

    // 1. Initialize 3D WebGL Scene
    const webglContainer = document.getElementById('webgl-container') as HTMLElement;
    this.scene = new ThreeScene(webglContainer);
    this.scene.initGuangdongFacing();
    this.scene.updateActiveDestination(this.activeDestination);

    const requestedSampleId = new URLSearchParams(window.location.search).get('gate2');
    const requestedSample = requestedSampleId
      ? getGate2SampleById(requestedSampleId)
      : undefined;
    if (requestedSample?.destinationIds[0] === this.activeDestination.id) {
      this.scene.focusCity(this.activeDestination);
    }

    this.scene.onCitySelect = (city) => {
      if (!city) {
        this.heroSection?.closeCityDossier();
        return;
      }
      this.sound.playGuqin(city.dayIndex);
      this.setActiveDestination(city);
      this.scene?.updateActiveDestination(city);
      // 单击：平滑旋转摆正朝向该城市，保持当前视距，切换左侧名片
      this.scene?.flyToCoordinate(city.coordinates.lat, city.coordinates.lng, this.scene.camera.position.z, 0.85);
      this.heroSection?.updateDestination(city);
      this.heroSection?.openCityDossier(city);
    };

    this.scene.onCityDblClick = (city) => {
      this.handleEnterScenicWarp(city);
    };

    this.scene.isDossierOpen = () => {
      return this.heroSection?.isDossierOpen() || false;
    };

    this.scene.onCityHover = (city, screenPos) => {
      this.heroSection?.showHoverTooltip(city, screenPos);
    };

    this.scene.onProvinceSelect = (province) => {
      const sample = province.gate2SampleId
        ? getGate2SampleById(province.gate2SampleId)
        : undefined;
      if (!sample) return;

      experienceState.setActiveGate2Sample(sample.id);
      this.publishGate2RuntimeStatus(sample);
      document.documentElement.dataset.gate2Province = province.id;
    };

    this.scene.onLunarMansionHover = (mansion, screenPos) => {
      this.heroSection?.showMansionTooltip(mansion, screenPos);
    };

    this.scene.onDioramaItemSelect = (hitData) => {
      this.heroSection?.showDioramaInfoCard(hitData);
    };

    this.scene.onDioramaProbeHover = (probeData, screenPos) => {
      this.heroSection?.showDioramaProbeHUD(probeData, screenPos);
    };

    this.scene.onDimensionChange = (mode) => {
      this.heroSection?.setDimensionMode(mode);
    };

    this.scene.onTransitionStateChange = (transitioning) => {
      this.heroSection?.setTransitioning(transitioning);
    };

    this.scene.onCameraDistanceChange = (z, minZ, maxZ) => {
      this.heroSection?.updateCameraDistance(z, minZ, maxZ);
    };

    this.loadingOverlay.setProgress(55);

    // 2. Initialize UI Chapters
    const appContainer = document.getElementById('app') as HTMLElement;
    appContainer.innerHTML = '';

    const stampedIds = this.storage.getProgress().collectedSeals;
    const notes = this.storage.getProgress().customNotes;

    // Navbar
    this.navbar = new Navbar(
      () => {
        const isPlaying = this.sound.toggleMute();
        this.navbar?.setAudioState(!isPlaying);
      },
      () => {
        this.oracleDrawer?.toggle();
      },
      (mode: DimensionMode | 'scroll') => {
        if (mode === 'scroll') {
          this.scrollToScenicScroll();
        } else {
          this.handleDimensionSwitch(mode);
        }
      }
    );
    appContainer.appendChild(this.navbar.getElement());

    // Chapter 1: Hero Section (带三重视界切换与 【浑天周天度数尺 · 司天玉璇衡】)
    this.heroSection = new HeroSection(
      this.activeDestination,
      stampedIds.includes(this.activeDestination.id),
      () => {
        this.sound.playTap();
        this.scene?.pullBackToGlobe();
      },
      (cityId) => {
        this.handleSealStamped(cityId);
      },
      (dest) => {
        this.handleEnterScenicWarp(dest);
      },
      () => {
        this.sound.playTap();
        this.scene?.zoomIn();
      },
      () => {
        this.sound.playTap();
        this.scene?.zoomOut();
      },
      () => {
        this.sound.playTap();
        this.scene?.resetToOverview();
      },
      (mode: DimensionMode) => {
        this.handleDimensionSwitch(mode);
      },
      (targetZ, animated) => {
        this.scene?.setCameraDistance(targetZ, animated);
      },
      () => {
        this.scrollToScenicScroll();
      },
      (layer) => {
        this.scene?.setDioramaLayerMode(layer);
      },
      (timeMode) => {
        this.scene?.dioramaTerrain.setTimeOfDay(timeMode);
      },
      (mountainId) => {
        const hit = this.scene?.flyDioramaToMountain(mountainId);
        if (hit && hit.spec) {
          this.heroSection.showDioramaInfoCard({
            type: 'mountain',
            id: hit.spec.id,
            name: hit.spec.name,
            subName: hit.spec.subName,
            altitude: hit.spec.altitude,
            geology: hit.spec.geology,
            element: hit.spec.element,
            color: hit.spec.color
          });
        }
      },
      () => {
        this.scene?.clearDioramaMountainHighlight();
      }
    );
    appContainer.appendChild(this.heroSection.getElement());
    this.heroSection.updateCameraDistance(
      this.scene.camera.position.z,
      EXPERIENCE_GEOMETRY.camera.min,
      EXPERIENCE_GEOMETRY.camera.max,
    );

    // Chapter 2: 今日奇境 · 真实风光沉浸殿堂
    this.dailyScenicStage = new DailyScenicStage(
      this.activeDestination,
      stampedIds.includes(this.activeDestination.id),
      notes[this.activeDestination.id] || '',
      (cityId) => {
        this.handleSealStamped(cityId);
      },
      (cityId, note) => {
        this.storage.saveCustomNote(cityId, note);
        this.sound.playParchment();
      }
    );
    appContainer.appendChild(this.dailyScenicStage.getElement());

    // Chapter 3: 当前样板画廊 · 已收录地域风光
    this.gallerySection = new GuangdongGallerySection(
      DESTINATIONS_DATA,
      stampedIds,
      (dest) => {
        this.handleDestinationSelect(dest);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    );
    appContainer.appendChild(this.gallerySection.getElement());

    // Chapter 4: 往昔舆图 · 岁时星象廊
    const status = this.timeEngine.getCalendarStatus();
    this.timelineSection = new TimelineSection(
      appContainer,
      status,
      this.activeDestination.id,
      (dest) => {
        this.handleDestinationSelect(dest);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    );

    // Chapter 5: 山海通鉴 · 通关文牒印谱与海报导出
    this.passportSection = new PassportSection(DESTINATIONS_DATA, stampedIds);
    appContainer.appendChild(this.passportSection.getElement());

    // 浮动天象神谕推演器
    this.oracleDrawer = new OracleDrawer(appContainer, () => {
      this.handleDateChanged();
    });

    // 东方星象秘卷 · 二十八星宿神话图鉴与天官弹窗
    this.lunarMansionModal = new LunarMansionModal();
    this.lunarMansionModal.onFocusCity = (cityId) => {
      const city = DESTINATIONS_DATA.find(d => d.id === cityId);
      if (city) {
        this.handleDestinationSelect(city);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    this.lunarMansionModal.onSummonBeast = (beastName) => {
      this.handleDimensionSwitch('beast');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 二十四节气与十二时辰大典弹窗
    this.solarTermModal = new SolarTermModal();
    this.solarTermModal.onFocusPlace = (placeName) => {
      const foundCity = DESTINATIONS_DATA.find(d => placeName.includes(d.cityName) || placeName.includes(d.modernName));
      if (foundCity) {
        this.handleDestinationSelect(foundCity);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (this.scene) {
      this.scene.onLunarMansionSelect = (mansion) => {
        this.lunarMansionModal?.show(mansion);
      };
      this.scene.onSolarTermSelect = (term) => {
        this.solarTermModal?.showSolarTerm(term);
      };
      this.scene.onEarthlyBranchSelect = (branch) => {
        this.solarTermModal?.showEarthlyBranch(branch);
      };
    }

    // 3. 监听全局滚动联动 3D 相机
    this.bindScrollEvents();

    // 4. 启动倒计时轮询
    this.startCountdownLoop();

    this.loadingOverlay.setProgress(100);
    this.loadingOverlay.hide(() => {
      this.sound.playGuqin();
    });
  }

  private lockHeroScroll() {
    document.documentElement.classList.add('hero-scroll-locked');
    document.body.classList.add('hero-scroll-locked');
  }

  private unlockHeroScroll() {
    document.documentElement.classList.remove('hero-scroll-locked');
    document.body.classList.remove('hero-scroll-locked');
  }

  public scrollToScenicScroll() {
    this.unlockHeroScroll();
    const dailyStage = document.getElementById('daily-stage');
    if (dailyStage) {
      dailyStage.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private handleDimensionSwitch(mode: DimensionMode) {
    this.lockHeroScroll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    experienceState.setDimension(mode);
    if (mode === 'diorama') {
      // 万象沙盘模式：若当前选中的目的地不是广东地级市，则同步切换为广东核心城市（如广州）
      const isGuangdongDest = this.activeDestination && (this.activeDestination.country?.includes('广东') || this.activeDestination.region?.key?.includes('lingnan'));
      if (!isGuangdongDest) {
        const guangzhouDest = findDestinationById('guangzhou') || DESTINATIONS_DATA[0];
        this.setActiveDestination(guangzhouDest);
        this.heroSection?.updateDestination(guangzhouDest);
      }
    }
    this.heroSection?.setDimensionMode(mode);
    this.scene?.setDimensionMode(mode);
  }

  /**
   * Gate 2 sample selection is intentionally a diagnostic/runtime entry point,
   * not a second catalog.  A URL such as ?gate2=gd-pearl-density starts at the
   * first real destination in that sample; a sample without a real destination
   * falls back to the calendar record.
   */
  private resolveGate2InitialDestination(fallback: DestinationItem): DestinationItem {
    const requestedSampleId = new URLSearchParams(window.location.search).get('gate2');
    const requestedSample = requestedSampleId
      ? getGate2SampleById(requestedSampleId)
      : undefined;
    const firstDestinationId = requestedSample?.destinationIds[0];
    return firstDestinationId
      ? findDestinationById(firstDestinationId) || fallback
      : fallback;
  }

  private bindScrollEvents() {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      experienceState.setScroll(scrollY, maxScroll);
      this.scene?.handleScroll(scrollY, maxScroll);

      if (scrollY <= 5) {
        const currentDim = this.scene?.getDimensionMode() || 'globe';
        if (currentDim === 'globe' || currentDim === 'diorama' || currentDim === 'beast') {
          this.lockHeroScroll();
        }
      }
    }, { passive: true });
  }

  private handleEnterScenicWarp(dest: DestinationItem) {
    this.sound.playParchment();
    this.setActiveDestination(dest);
    const stampedIds = this.storage.getProgress().collectedSeals;
    const notes = this.storage.getProgress().customNotes;

    // 1. 立即关闭左侧名片抽屉，避免遮挡沉浸式实景画卷
    this.heroSection?.closeCityDossier();

    // 2. 同步更新所有关联面板状态
    this.heroSection?.updateDestination(dest, stampedIds.includes(dest.id));
    this.dailyScenicStage?.updateDestination(
      dest,
      stampedIds.includes(dest.id),
      notes[dest.id] || ''
    );
    const status = this.timeEngine.getCalendarStatus();
    this.timelineSection?.updateStatus(status, dest.id);

    // 3. 触发 3D 破空跃迁动画，并在中点平滑滚入实景大典
    if (this.scene) {
      this.scene.warpToScenic(dest, () => {
        this.scrollToScenicScroll();
      });
    } else {
      this.scrollToScenicScroll();
    }
  }

  private handleDestinationSelect(dest: DestinationItem) {
    this.sound.playGuqin(dest.dayIndex);
    this.setActiveDestination(dest);
    const stampedIds = this.storage.getProgress().collectedSeals;
    const notes = this.storage.getProgress().customNotes;

    this.scene?.updateActiveDestination(dest);
    if (this.scene) this.scene.selectedCity = dest;
    this.scene?.flyToCoordinate(
      dest.coordinates.lat,
      dest.coordinates.lng,
      EXPERIENCE_GEOMETRY.camera.selection,
      0.85,
    );

    this.heroSection?.updateDestination(dest, stampedIds.includes(dest.id));
    this.heroSection?.openCityDossier(dest);

    this.dailyScenicStage?.updateDestination(
      dest,
      stampedIds.includes(dest.id),
      notes[dest.id] || ''
    );

    const status = this.timeEngine.getCalendarStatus();
    this.timelineSection?.updateStatus(status, dest.id);
  }

  private handleSealStamped(cityId: string) {
    this.sound.playStamp();
    this.storage.collectSeal(cityId);

    const stampedIds = this.storage.getProgress().collectedSeals;
    this.heroSection?.setStamped(true);
    this.dailyScenicStage?.setStamped(true);
    this.gallerySection?.updateStamped(stampedIds);
    this.passportSection?.updateStamped(stampedIds);

    const status = this.timeEngine.getCalendarStatus();
    this.timelineSection?.updateStatus(status, cityId);
  }

  private handleDateChanged() {
    const status = this.timeEngine.getCalendarStatus();
    this.setActiveDestination(status.todayDestination);

    const stampedIds = this.storage.getProgress().collectedSeals;
    const notes = this.storage.getProgress().customNotes;

    this.scene?.updateActiveDestination(this.activeDestination);
    if (this.scene) this.scene.selectedCity = this.activeDestination;
    this.heroSection?.updateDestination(this.activeDestination);
    this.dailyScenicStage?.updateDestination(
      this.activeDestination,
      stampedIds.includes(this.activeDestination.id),
      notes[this.activeDestination.id] || ''
    );
    this.timelineSection?.updateStatus(status, this.activeDestination.id);
    this.scene?.focusCity(this.activeDestination);
  }

  private startCountdownLoop() {
    if (this.countdownTimerId) clearInterval(this.countdownTimerId);
    this.countdownTimerId = window.setInterval(() => {
      const status = this.timeEngine.getCalendarStatus();
      this.timelineSection?.updateCountdown(status.countdownStr);
    }, 1000);
  }

  private setActiveDestination(destination: DestinationItem) {
    this.activeDestination = destination;
    experienceState.setActiveDestination(destination.id);
    const sample = getGate2SampleForDestination(destination.id);
    experienceState.setActiveGate2Sample(sample?.id ?? null);
    this.publishGate2RuntimeStatus(sample);
  }

  private publishGate2RuntimeStatus(sample: Gate2GoldenSlice | undefined) {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.dataset.gate2Sample = sample?.id ?? 'unmapped';
    root.dataset.gate2DataReadiness = sample?.dataReadiness ?? 'unmapped';
    root.dataset.gate2GeometryReadiness = sample?.geometryReadiness ?? 'unmapped';
    root.dataset.gate2MediaReadiness = sample?.mediaReadiness ?? 'unmapped';
    root.dataset.gate2CheckCount = String(sample?.requiredChecks.length ?? 0);
    root.dataset.gate2Province = sample?.region.key ?? 'unmapped';
    const evidence = sample?.evidenceProfileId
      ? getGate2RegionalEvidence(sample.evidenceProfileId)
      : undefined;
    root.dataset.gate2Evidence = evidence?.id ?? 'unmapped';
    root.dataset.gate2EvidenceReadiness = evidence?.catalogReadiness ?? 'unmapped';
    root.dataset.gate2EvidenceBoundary = evidence?.boundary.status ?? 'unmapped';
    root.dataset.gate2EvidenceMedia = evidence
      ? evidence.media.every(media => media.catalogReadiness === 'approved')
        ? 'approved'
        : 'pending'
      : 'unmapped';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new MythicAtlasApp();
});
