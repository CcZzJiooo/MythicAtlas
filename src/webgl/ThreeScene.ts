import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import gsap from 'gsap';

import { 
  generateMythicEarthTexture, 
  generateEarthBumpTexture, 
  generateCloudTexture 
} from './shaders/earthTexture';
import { CinematicInkShader } from './shaders/cinematicShader';
import { GargantuaWarpShader } from './shaders/gargantuaWarpShader';
import { ArmillarySphere } from './ArmillarySphere';
import { LandmarkPins, type ProvincialBadgeConfig } from './LandmarkPins';
import { SphericalVectorOverlay } from './SphericalVectorOverlay';
import { CityElevatorMeshes } from './CityElevatorMeshes';
import { ParticleAura } from './ParticleAura';
import { MythicBeast3D } from './MythicBeast3D';
import { GuangdongTerrain3D, type DioramaProbeData } from './GuangdongTerrain3D';
import { RegionalDiorama3D } from './RegionalDiorama3D';
import type { DestinationItem } from '../types';
import { findDestinationById } from '../data/destinations';
import { SoundEngine } from '../core/SoundEngine';
import {
  EXPERIENCE_GEOMETRY,
  experienceState,
  getInteractionOwner,
  type DimensionMode
} from '../core/experienceState';
import { LunarMansionItem } from '../data/lunarMansions';
import { SolarTermItem } from '../data/solarTerms';
import { EarthlyBranchItem } from '../data/earthlyBranches';
import { DEFAULT_SCENE_CATALOG, type SceneCatalog } from '../data/sceneCatalog';

export type { DimensionMode } from '../core/experienceState';

export class ThreeScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public composer!: EffectComposer;
  public controls: OrbitControls;

  private container: HTMLElement;
  private sound: SoundEngine;
  private readonly sceneCatalog: SceneCatalog;

  // 1. Globe Dimension Objects
  public globePivot: THREE.Group;
  public earthMesh: THREE.Mesh;
  private cloudsMesh: THREE.Mesh;
  private innerGlowMesh: THREE.Mesh;
  public armillary: ArmillarySphere;
  private landmarkPins: LandmarkPins;
  public vectorOverlay: SphericalVectorOverlay;
  public cityElevator: CityElevatorMeshes;

  // 2. 3D Mythic Beast Guardian Dimension
  public mythicBeast: MythicBeast3D;

  // 3. 3D Topographic Diorama Dimension
  public dioramaTerrain: GuangdongTerrain3D;
  public regionalDioramaTerrain: RegionalDiorama3D;

  // 4. Global Curl-Noise Particle Vortex
  private particles: ParticleAura;

  // Post-processing passes
  private bloomPass!: UnrealBloomPass;
  private cinematicPass!: ShaderPass;
  public gargantuaWarpPass!: ShaderPass;

  private get currentDimension(): DimensionMode {
    return experienceState.getState().dimension;
  }
  private activeDestination: DestinationItem | null = null;

  // Interaction & Free 3D Trackball Engine
  private isPointerDown = false;
  private isPointerDragging = false;
  private pointerDownPos = { x: 0, y: 0 };
  private lastPointerPos = { x: 0, y: 0 };
  private pointerDownTime = 0;
  private rotVelocity = { x: 0, y: 0 };
  private readonly BASE_DRAG_SENSITIVITY = 0.0048;
  private readonly ROT_DAMPING = 0.925;

  // 智能多维物理交互：内转地球(3D)、外拨浑天仪天轨(3D)、右键/Shift(2D平面自转)
  private dragMode: 'globe' | 'armillary' | '2d_roll' = 'globe';
  private lastPointerAngle = 0;
  private armillaryAngularVelocity = 0;
  private armillaryLinearVel = { x: 0, y: 0 };
  private lastPointerTime = 0;
  private rollVelocity = 0; // 2D 平面旋转角动量惯性初速度

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);
  private pendingHoverEvent: PointerEvent | null = null;
  private hoveredCity: DestinationItem | null = null;
  private hoveredMansion: LunarMansionItem | null = null;
  public onCitySelect?: (city: DestinationItem) => void;
  public onCityDblClick?: (city: DestinationItem) => void;
  public onCityHover?: (city: DestinationItem | null, screenPos: { x: number; y: number }) => void;
  public onProvinceSelect?: (province: ProvincialBadgeConfig) => void;
  public onLunarMansionSelect?: (mansion: LunarMansionItem) => void;
  public onLunarMansionHover?: (mansion: LunarMansionItem | null, screenPos: { x: number; y: number }) => void;
  public onSolarTermSelect?: (term: SolarTermItem) => void;
  public onEarthlyBranchSelect?: (branch: EarthlyBranchItem) => void;
  public onDioramaItemSelect?: (hitData: any) => void;
  public onDioramaProbeHover?: (probeData: DioramaProbeData | null, screenPos: { x: number; y: number }) => void;
  public onDimensionChange?: (mode: DimensionMode) => void;
  public onTransitionStateChange?: (transitioning: boolean) => void;
  public onCameraDistanceChange?: (z: number, minZ: number, maxZ: number) => void;
  public isDossierOpen?: () => boolean;

  private clock = new THREE.Clock();
  private isAnimating = true;
  private isWarping = false;
  private earthRadius = EXPERIENCE_GEOMETRY.earthRadius;

  // Camera distances: 极限微距特写 (Z=2.12) 至 深邃外太空宇宙 (Z=11.5)
  public readonly overviewCameraZ = EXPERIENCE_GEOMETRY.camera.overview;
  public readonly focusCameraZ = EXPERIENCE_GEOMETRY.camera.focus;
  public readonly minCameraZ = EXPERIENCE_GEOMETRY.camera.min;
  public readonly maxCameraZ = EXPERIENCE_GEOMETRY.camera.max;

  private get targetCameraZ(): number {
    return experienceState.getState().targetCameraDistance;
  }

  private set targetCameraZ(value: number) {
    experienceState.setTargetCameraDistance(value);
  }

  private lastPublishedDist = -999;
  private publishCameraDistance(cameraDistance?: number): void {
    let dist = cameraDistance;
    if (dist === undefined) {
      if (this.currentDimension === 'diorama' || this.currentDimension === 'beast') {
        const target = this.controls?.target || new THREE.Vector3(0, 0, 0);
        dist = this.camera.position.distanceTo(target);
      } else {
        dist = this.camera.position.z;
      }
    }
    if (Math.abs(dist - this.lastPublishedDist) < 0.015) {
      return;
    }
    this.lastPublishedDist = dist;
    experienceState.setCameraDistance(dist, this.targetCameraZ);
    this.onCameraDistanceChange?.(dist, this.minCameraZ, this.maxCameraZ);
  }

  constructor(container: HTMLElement, sceneCatalog: SceneCatalog = DEFAULT_SCENE_CATALOG) {
    this.container = container;
    this.sceneCatalog = sceneCatalog;
    this.sound = SoundEngine.getInstance();

    // 1. Scene (Solid deep space background - eliminates alpha channel compositing flicker)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03070d);
    this.scene.fog = new THREE.FogExp2(0x03070d, 0.015);

    // 2. Camera (Centered, steady viewing line, near=0.05 高精度深度缓冲与近裁切安全防护)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.05, 100);
    this.camera.position.set(0, 0, this.overviewCameraZ);

    // 3. High-Performance WebGL Renderer (Solid opaque alpha, Museum-grade tone mapping, 60fps)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setClearColor(0x03070d, 1.0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = false; // Pure PBR shader lighting - zero harsh shadow cuts

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls (Secondary camera control, mainly for Diorama & Beast views)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.16; // 灵敏响应，杜绝 0.06 时的黏滞滞后与假卡顿
    this.controls.rotateSpeed = 1.25;  // 1:1 跟手旋转，极为丝滑顺畅
    this.controls.enableZoom = true;
    this.controls.minDistance = this.minCameraZ;
    this.controls.maxDistance = this.maxCameraZ;
    this.controls.target.set(0, 0, 0);
    this.controls.enabled = false; // Globe uses Free 3D Trackball engine
    this.controls.addEventListener('change', () => {
      if (this.currentDimension === 'diorama' || this.currentDimension === 'beast') {
        this.publishCameraDistance();
      }
    });

    // 5. Museum-Grade Balanced Lighting Setup
    this.setupLighting();

    // 6. Post-Processing Pipeline Setup (EffectComposer + Balanced Bloom + Safe Shader)
    this.setupPostProcessing();

    // 7. World Dimensions Initializations
    // Dimension 1: Globe Group
    this.globePivot = new THREE.Group();
    this.scene.add(this.globePivot);

    const earthGeo = new THREE.SphereGeometry(this.earthRadius, 128, 128);
    const earthTexture = generateMythicEarthTexture();
    const bumpTexture = generateEarthBumpTexture();

    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.055,
      roughness: 0.42,
      metalness: 0.22
    });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.globePivot.add(this.earthMesh);

    // Atmosphere Clouds Layer
    const cloudGeo = new THREE.SphereGeometry(this.earthRadius * 1.015, 64, 64);
    const cloudTexture = generateCloudTexture();
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
    this.globePivot.add(this.cloudsMesh);

    // Inner Glow: 东方玄金与青冥天体微光 (Subtle Ethereal Gold-Cyan Rim Glow - 100% Seamless with Starfield)
    const innerGlowGeo = new THREE.SphereGeometry(this.earthRadius * 1.006, 64, 64);
    const innerGlowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float rim = max(0.0, 1.0 - max(0.0, dot(normal, viewDir)));
          float intensity = pow(rim, 4.5);
          // Ethereal subtle gold & cyan starlight glow
          vec3 glowColor = mix(vec3(0.85, 0.72, 0.35), vec3(0.2, 0.6, 0.7), rim * 0.5);
          gl_FragColor = vec4(glowColor, 0.22) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    this.innerGlowMesh = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    this.globePivot.add(this.innerGlowMesh);

    // Landmark Pins
    this.landmarkPins = new LandmarkPins(
      this.earthRadius,
      this.sceneCatalog.destinations,
      this.sceneCatalog.provincialBadges
    );
    this.globePivot.add(this.landmarkPins.group);

    // 3D Spherical Vector Overlay (Native Infinite-Resolution Crisp Borders & Rivers)
    this.vectorOverlay = new SphericalVectorOverlay(
      this.earthRadius,
      this.sceneCatalog.provinceFeatures,
      this.sceneCatalog.cityFeatures,
      this.sceneCatalog.destinations
    );
    this.globePivot.add(this.vectorOverlay.group);

    // 3D 城市地契沙盘电梯式拔地升起引擎 (CityElevatorTerrainEngine)
    this.cityElevator = new CityElevatorMeshes(
      this.earthRadius,
      this.sceneCatalog.cityFeatures,
      this.sceneCatalog.destinations
    );
    this.globePivot.add(this.cityElevator.group);

    // Armillary Astrolabe
    this.armillary = new ArmillarySphere(this.earthRadius * 1.28);
    this.scene.add(this.armillary.group);

    // Dimension 2: 3D Topographic Diorama
    this.dioramaTerrain = new GuangdongTerrain3D(this.sceneCatalog.destinations);
    this.dioramaTerrain.group.position.set(0, -0.4, 0);
    this.dioramaTerrain.group.visible = false;
    this.scene.add(this.dioramaTerrain.group);

    // Gate2 non-Guangdong slices use imported regional geometry instead of
    // falling through to the Guangdong-specific relief implementation.
    const nonGuangdongFeatures = this.sceneCatalog.cityFeatures.filter(feature => {
      const destination = this.sceneCatalog.destinations.find(item =>
        item.cityName === feature.name
        || item.cityName.replace(/市$/, '') === feature.name
      );
      return Boolean(destination && destination.country?.includes('广东') !== true);
    });
    this.regionalDioramaTerrain = new RegionalDiorama3D(
      nonGuangdongFeatures,
      this.sceneCatalog.destinations,
    );
    this.regionalDioramaTerrain.group.position.set(0, -0.4, 0);
    this.regionalDioramaTerrain.group.visible = false;
    this.scene.add(this.regionalDioramaTerrain.group);

    // Dimension 3: 3D Mythical Beast Guardian Stage
    this.mythicBeast = new MythicBeast3D();
    this.scene.add(this.mythicBeast.group);

    // Global Curl-Noise Particle Vortex
    this.particles = new ParticleAura();
    this.scene.add(this.particles.mesh);

    // 8. Event Listeners
    this.bindEvents();

    // 8.5 标准正北正南中国广东初态对齐
    this.initGuangdongFacing();

    // 9. Animation Loop
    this.animate();
  }

  /**
   * 计算使任意经纬度正对视口、且正北朝上的精确四元数 (Upright True Geographic Quaternion)
   */
  public getUprightQuaternion(lat: number, lng: number): THREE.Quaternion {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const surfaceX = -Math.cos(theta) * Math.sin(phi);
    const surfaceY = Math.cos(phi);
    const surfaceZ = Math.sin(theta) * Math.sin(phi);
    const normal = new THREE.Vector3(surfaceX, surfaceY, surfaceZ).normalize();

    const zModel = normal.clone();
    let xModel = new THREE.Vector3(0, 1, 0).cross(zModel);
    if (xModel.lengthSq() < 0.0001) {
      xModel = new THREE.Vector3(1, 0, 0);
    } else {
      xModel.normalize();
    }
    const yModel = zModel.clone().cross(xModel).normalize();

    const mat = new THREE.Matrix4().set(
      xModel.x, xModel.y, xModel.z, 0,
      yModel.x, yModel.y, yModel.z, 0,
      zModel.x, zModel.y, zModel.z, 0,
      0, 0, 0, 1
    );
    return new THREE.Quaternion().setFromRotationMatrix(mat);
  }

  /**
   * 正南正北标准地理初态 (Standard Upright Map Orientation: North = Up)
   * 严谨将中国广东正对视口，且北极朝上，经纬正交无歪斜
   */
  public initGuangdongFacing() {
    const quat = this.getUprightQuaternion(23.13, 113.26);
    this.globePivot.quaternion.copy(quat);
  }

  /**
   * 东方典雅博物馆级光照 (Museum-Grade Balanced Lighting)
   */
  private setupLighting() {
    const ambient = new THREE.AmbientLight(0x081524, 0.95);
    this.scene.add(ambient);

    const hemiLight = new THREE.HemisphereLight(0x5A8CA8, 0x221A0F, 0.65);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xFFF3D8, 1.45);
    sunLight.position.set(6, 7, 6);
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x2D7A68, 0.95);
    rimLight.position.set(-6, 2, -5);
    this.scene.add(rimLight);

    const backLight = new THREE.DirectionalLight(0xC59A3F, 0.65);
    backLight.position.set(0, -4, -5);
    this.scene.add(backLight);
  }

  /**
   * 极速高清后处理管线 (High-Performance Post-Processing Suite)
   */
  private setupPostProcessing() {
    const renderPass = new RenderPass(this.scene, this.camera);

    // 星际穿越 · 卡冈图雅黑洞引力透镜折跃通道 (默认禁用，折跃时才激活，闲置时零开销)
    this.gargantuaWarpPass = new ShaderPass(GargantuaWarpShader);
    this.gargantuaWarpPass.enabled = false;

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.38,  // balanced bloom strength - zero whiteout glare
      0.24,  // radius
      0.92   // threshold
    );

    this.cinematicPass = new ShaderPass(CinematicInkShader);
    const outputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.gargantuaWarpPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.cinematicPass);
    this.composer.addPass(outputPass);
  }

  /**
   * 严格基于 1:1 屏幕物理投影的动态自适应拖拽灵敏度
   * (Screen-Space 1:1 Pixel-Tracking Adaptive Drag Sensitivity)
   * 彻底杜绝极限放大时的漂移、暴冲与高敏！
   */
  private getDynamicSensitivity(): number {
    const distToSurface = Math.max(0.06, this.camera.position.z - this.earthRadius);
    const vFovRad = (this.camera.fov * Math.PI) / 360;
    const halfH = window.innerHeight / 2;

    // 严格按照摄像机在地球表面投射的弧长物理计算：1 像素鼠标移动 = 1 像素地表移动，指哪打哪
    const sensitivity = (distToSurface * Math.tan(vFovRad)) / (this.earthRadius * halfH);

    return THREE.MathUtils.clamp(sensitivity * 1.05, 0.000045, 0.0045);
  }

  private onWindowResize = () => this.onResize();
  private onWheelHandler = (e: WheelEvent) => this.onSmartWheel(e);

  /**
   * 判定光标是否位于顶层浮动 UI 面板、百岳导览坞、名片列表或交互控件之上
   * 性能优化统一门控：光标在 UI 区域时全面阻断 3D 射线拾取、20 万面高程探测与场景拖拽，保障 60 FPS 性能底线
   */
  private isPointerOverUI(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    if (target === this.container || target === this.renderer.domElement) return false;
    return !!target.closest(
      '.astrolabe-floating-scale, #astrolabe-floating-scale, .celestial-observatory-hud, ' +
      '.hero-unified-cultural-card, .hero-beast-summon-bar, .hero-bottom-actions-dock, ' +
      '.diorama-mountain-dock, #diorama-mountain-dock, .mountain-cards-track, #mountain-cards-track, .mountain-card-item, ' +
      '.diorama-floating-panel, .diorama-tally-dock, #diorama-probe-hud, .dimension-switch-bar, ' +
      '.hero-chapter-banner, .audio-switch-wrapper, .view-mode-panel, .scholar-scroll-drawer-root, ' +
      '#destination-hanging-scroll, .scholar-scroll-inner, .scroll-chapter-content-body, ' +
      '.scenic-lore-card, .scenic-immersion-window, .city-hover-tooltip, ' +
      'button, a, input, select, textarea, [role="button"]'
    );
  }

  private bindEvents() {
    window.addEventListener('resize', this.onWindowResize);

    const dom = this.renderer.domElement;

    // 禁用画布原生右键菜单，释放右键用于专属 2D 平面旋转 (2D Screen Roll)
    dom.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
    });

    dom.addEventListener('pointerdown', (e: PointerEvent) => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY > EXPERIENCE_GEOMETRY.scroll.webglLock) return;

      if (this.isPointerOverUI(e.target)) {
        return;
      }

      this.isPointerDown = true;
      this.isPointerDragging = false;
      this.container.style.cursor = 'grabbing';
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
      this.lastPointerPos = { x: e.clientX, y: e.clientY };
      this.pointerDownTime = Date.now();
      this.rotVelocity = { x: 0, y: 0 };

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const screenRadius = Math.hypot(dx, dy);

      this.lastPointerAngle = Math.atan2(dy, dx);
      this.lastPointerTime = performance.now();

      // 判断交互模式：
      // ① 右键拖拽 / 按住 Shift / 按住 Alt -> 专属 2D 平面自转 (2D Screen Plane Roll)
      if (e.button === 2 || e.shiftKey || e.altKey) {
        this.dragMode = '2d_roll';
      } else {
        const halfH = window.innerHeight / 2;
        const vFovRad = (this.camera.fov * Math.PI) / 360;
        const earthPixelRadius = (this.earthRadius / (this.camera.position.z * Math.tan(vFovRad))) * halfH;

        if (screenRadius > earthPixelRadius * 0.98) {
          this.dragMode = 'armillary';
          this.armillaryAngularVelocity = 0;
        } else {
          this.dragMode = 'globe';
        }
      }
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      this.updateMouseCoords(e);

      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY > EXPERIENCE_GEOMETRY.scroll.webglLock) {
        this.clearHoverState();
        return;
      }

      if (this.isPointerOverUI(e.target)) {
        this.clearHoverState();
        return;
      }

      if (!this.isPointerDown) {
        this.pendingHoverEvent = e;
        if (this.currentDimension === 'globe') {
          this.armillary.setMouseParallax(this.mouse.x, this.mouse.y);
        }
        return;
      }

      const deltaX = e.clientX - this.lastPointerPos.x;
      const deltaY = e.clientY - this.lastPointerPos.y;
      this.lastPointerPos = { x: e.clientX, y: e.clientY };

      const totalDist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (totalDist > 4) {
        this.isPointerDragging = true;
      }

      if (this.currentDimension === 'globe') {
        if (this.dragMode === '2d_roll') {
          // 纯二维屏幕平面自转 (2D Screen Plane Roll: 顺逆时针自转，绝不发生 3D 偏航倾斜)
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
          let deltaAngle = currentAngle - this.lastPointerAngle;
          if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
          if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

          const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -deltaAngle);
          this.globePivot.quaternion.premultiply(rollQuat);

          const now = performance.now();
          const dt = Math.max(0.001, (now - this.lastPointerTime) / 1000);
          this.rollVelocity = deltaAngle / dt;
          this.lastPointerAngle = currentAngle;
          this.lastPointerTime = now;
        } else if (this.dragMode === 'armillary') {
          // 3D 空间万向多轴物理拖拽 (Full 3D Pitch/Yaw/Roll Universal Drag)
          const sensitivity = this.getDynamicSensitivity() * 1.15;
          this.armillary.apply3DDrag(deltaX, deltaY, sensitivity);

          // 环向自转角位移
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
          let deltaAngle = currentAngle - this.lastPointerAngle;
          if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
          if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
          this.armillary.applyDragDelta(deltaAngle * 0.6);

          const now = performance.now();
          const dt = Math.max(0.001, (now - this.lastPointerTime) / 1000);
          this.armillaryAngularVelocity = deltaAngle / dt;
          this.armillaryLinearVel.x = (deltaX * sensitivity) / dt;
          this.armillaryLinearVel.y = (deltaY * sensitivity) / dt;
          this.lastPointerAngle = currentAngle;
          this.lastPointerTime = now;
        } else {
          const sensitivity = this.getDynamicSensitivity();

          // 自由 3D 轨迹球旋转 (Free 360° Trackball Rotation - 自适应视距灵敏度)
          const rotY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaX * sensitivity);
          const rotX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaY * sensitivity);
          const deltaQuat = new THREE.Quaternion().multiplyQuaternions(rotX, rotY);
          
          this.globePivot.quaternion.premultiply(deltaQuat);

          // 记录旋转惯性 (随放大程度自适应平缓衰减)
          this.rotVelocity.x = deltaX * sensitivity;
          this.rotVelocity.y = deltaY * sensitivity;
        }
      }
    });

    window.addEventListener('pointerup', () => {
      if (this.dragMode === 'armillary' && this.isPointerDragging) {
        this.armillary.inject3DImpulse(
          this.armillaryLinearVel.x,
          this.armillaryLinearVel.y,
          this.armillaryAngularVelocity
        );
        if (Math.hypot(this.armillaryLinearVel.x, this.armillaryLinearVel.y) > 0.6 || Math.abs(this.armillaryAngularVelocity) > 1.2) {
          this.sound.playBronzeBell();
        }
      } else if (this.dragMode === '2d_roll' && this.isPointerDragging) {
        this.rollVelocity = THREE.MathUtils.clamp(this.rollVelocity, -10.0, 10.0);
        if (Math.abs(this.rollVelocity) > 1.2) {
          this.sound.playBronzeBell();
        }
      }
      this.isPointerDown = false;
      this.container.style.cursor = 'default';
      setTimeout(() => {
        this.isPointerDragging = false;
      }, 60);
    });

    dom.addEventListener('click', this.onPointerClick.bind(this));
    dom.addEventListener('dblclick', this.onPointerDblClick.bind(this));
    window.addEventListener('wheel', this.onWheelHandler, { passive: false });

    // 光标离开画布或窗口失焦时，立即重置悬停状态，彻底根除名片卡死悬留
    dom.addEventListener('pointerleave', () => {
      this.clearHoverState();
    });

    window.addEventListener('blur', () => {
      this.clearHoverState();
    });
  }

  private clearHoverState() {
    this.pendingHoverEvent = null;
    this.hoveredCity = null;
    experienceState.setHoveredDestination(null);
    if (this.cityElevator) this.cityElevator.setHoveredCity(null);
    if (this.vectorOverlay) this.vectorOverlay.setHoveredCity(null);
    if (this.landmarkPins) this.landmarkPins.setHoveredCity(null);
    if (this.onCityHover) this.onCityHover(null, { x: 0, y: 0 });
    if (this.dioramaTerrain) {
      this.dioramaTerrain.updateProbeReticle(null, false);
    }
    if (this.onDioramaProbeHover) {
      this.onDioramaProbeHover(null, { x: 0, y: 0 });
    }
    if (this.landmarkPins) {
      this.landmarkPins.highlightProvince('');
    }
    if (this.vectorOverlay) {
      this.vectorOverlay.setProvinceHover(false);
    }
    if (this.hoveredMansion) {
      this.hoveredMansion = null;
      this.armillary.highlightMansion(null);
      if (this.onLunarMansionHover) this.onLunarMansionHover(null, { x: 0, y: 0 });
    }
    this.container.style.cursor = 'default';
  }

  private cachedDomRect: DOMRect | null = null;

  private getDomRect(): DOMRect {
    if (!this.cachedDomRect) {
      this.cachedDomRect = this.renderer.domElement.getBoundingClientRect();
    }
    return this.cachedDomRect;
  }

  private updateMouseCoords(e: MouseEvent) {
    const rect = this.getDomRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onResize() {
    this.cachedDomRect = null;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    if (this.gargantuaWarpPass) {
      this.gargantuaWarpPass.uniforms.uAspect.value = w / h;
    }
  }

  /**
   * 像素级 2D 屏幕投影几何最近地标判定算法
   * 严格微距 LOD 门控：仅在共享 cityBoundary 以内激活地市判定，省级视角下绝对不误触
   */
  private findClosestCityPin(e: MouseEvent): { city: DestinationItem; screenPos: { x: number; y: number } } | null {
    if (!this.landmarkPins || !this.landmarkPins.animatedItems.length) return null;

    if (this.camera.position.length() >= EXPERIENCE_GEOMETRY.camera.cityBoundary) {
      return null;
    }

    const cameraPos = this.camera.position;
    const tempGround = new THREE.Vector3();

    let closestCity: DestinationItem | null = null;
    let closestDist = Infinity;
    let closestScreenPos = { x: 0, y: 0 };

    // 城市 pin 使用独立的微距命中范围，不能复用省级名片的屏幕安全区。
    const hitRadius = 48;

    for (const item of this.landmarkPins.animatedItems) {
      item.pinGroup.getWorldPosition(tempGround);

      // 严格背向与地平线剔除：必须面向摄像机正面
      const dot = tempGround.clone().normalize().dot(cameraPos.clone().normalize());
      if (dot < 0.20) continue;

      const groundScreenPos = this.worldToScreen(tempGround);
      const distGround = Math.hypot(groundScreenPos.x - e.clientX, groundScreenPos.y - e.clientY);

      if (distGround < hitRadius && distGround < closestDist) {
        closestDist = distGround;
        closestCity = item.city;
        closestScreenPos = {
          x: groundScreenPos.x,
          y: groundScreenPos.y
        };
      }
    }

    if (closestCity) {
      return { city: closestCity, screenPos: closestScreenPos };
    }
    return null;
  }

  /**
   * 像素级 2D 屏幕投影省级名片判定算法 (Provincial Landmark Badge Matcher)
   * 仅在共享省级视界 (cityBoundary <= Z <= provinceMax) 下感应，深空下保持纯净星空
   */
  private findClosestProvincialPin(e: MouseEvent): { prov: ProvincialBadgeConfig; screenPos: { x: number; y: number } } | null {
    if (!this.landmarkPins || !this.landmarkPins.provincialAnimatedItems.length) return null;
    const camDist = this.camera.position.length();
    // 严格省级视界 (共享 cityBoundary <= Z <= provinceMax)
    if (
      camDist < EXPERIENCE_GEOMETRY.camera.cityBoundary
      || camDist > EXPERIENCE_GEOMETRY.camera.provinceMax
    ) return null;

    const cameraPos = this.camera.position;
    const tempGround = new THREE.Vector3();
    const tempBadge = new THREE.Vector3();

    let closestProv: ProvincialBadgeConfig | null = null;
    let closestDist = Infinity;
    let closestScreenPos = { x: 0, y: 0 };
    const hitRadius = EXPERIENCE_GEOMETRY.overlay.provincialBadge.hitRadius;

    for (const item of this.landmarkPins.provincialAnimatedItems) {
      item.pinGroup.getWorldPosition(tempGround);
      const dot = tempGround.clone().normalize().dot(cameraPos.clone().normalize());
      if (dot < 0.35) continue;

      const groundScreenPos = this.worldToScreen(tempGround);
      item.badgeMesh.getWorldPosition(tempBadge);
      const badgeScreenPos = this.worldToScreen(tempBadge);

      const distGround = Math.hypot(groundScreenPos.x - e.clientX, groundScreenPos.y - e.clientY);
      const distBadge = Math.hypot(badgeScreenPos.x - e.clientX, badgeScreenPos.y - e.clientY);
      const dist = Math.min(distGround, distBadge);

      if (dist < hitRadius && dist < closestDist) {
        closestDist = dist;
        closestProv = item.config;
        closestScreenPos = {
          x: badgeScreenPos.x,
          y: Math.min(groundScreenPos.y, badgeScreenPos.y)
        };
      }
    }

    if (closestProv) {
      return { prov: closestProv, screenPos: closestScreenPos };
    }
    return null;
  }

  /**
   * 省份进场视距：统一落在省级可读区，绝不直接落入市级 LOD。
   * 省域跨度/边界证据在数据层维护；这里不复制第二套阈值表。
   */
  public getProvinceAdaptiveZoom(_provId: string): number {
    return EXPERIENCE_GEOMETRY.camera.provinceEntry;
  }

  /**
   * 平滑飞入指定地理经纬度坐标与视距 (Smooth Camera Flight to Geo Coordinates)
   */
  public flyToCoordinate(
    lat: number,
    lng: number,
    targetZ = EXPERIENCE_GEOMETRY.camera.provinceEntry,
    duration = 1.25,
  ) {
    const targetQuat = this.getUprightQuaternion(lat, lng);
    const startQuat = this.globePivot.quaternion.clone();

    this.targetCameraZ = targetZ;

    const animObj = { t: 0 };
    gsap.killTweensOf(animObj);
    gsap.to(animObj, {
      t: 1,
      duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.globePivot.quaternion.slerpQuaternions(startQuat, targetQuat, animObj.t);
      }
    });

    gsap.killTweensOf(this.camera.position);
    gsap.to(this.camera.position, {
      z: targetZ,
      duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.publishCameraDistance();
      }
    });
    this.sound.playBronzeBell();
  }

  /**
   * 全域高精度行政多边形 + 经纬度射线命中：鼠标滑入城市任意角落即刻 100% 毫秒级命中！
   */
  public findCityAtMouse(e: MouseEvent): { city: DestinationItem; screenPos: { x: number; y: number }; localPt?: THREE.Vector3 } | null {
    const rect = this.container.getBoundingClientRect();
    const mouseNDC = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(mouseNDC, this.camera);
    const intersects = this.raycaster.intersectObject(this.earthMesh, false);

    if (intersects.length > 0) {
      const hit = intersects[0];

      // 地平线掠射角与球体边缘安全视锥门控：严格过滤与视向夹角 > 75 度的边缘盲区 (dot < 0.22)
      // 彻底杜绝视口边缘城市因部分轮廓出屏或掠射引发的射线抖动与近裁切穿模！
      const hitWorldNormal = hit.point.clone().normalize();
      const viewDir = this.camera.position.clone().normalize();
      if (hitWorldNormal.dot(viewDir) < 0.22) {
        return null;
      }

      const invQuat = this.globePivot.quaternion.clone().invert();
      const localPt = hit.point.clone().applyQuaternion(invQuat);
      const lat = Math.asin(Math.max(-1, Math.min(1, localPt.y / this.earthRadius))) * (180 / Math.PI);
      const lng = (Math.atan2(localPt.z, -localPt.x) * (180 / Math.PI) - 180 + 540) % 360 - 180;

      const matchedCity = this.cityElevator.findCityAtLatLng(lat, lng);
      if (matchedCity) {
        return {
          city: matchedCity,
          screenPos: { x: e.clientX, y: e.clientY },
          localPt
        };
      }
    }

    return null;
  }

  private onPointerHover(e: MouseEvent) {
    if (this.isPointerDown || this.isPointerDragging) {
      if (this.hoveredCity || this.hoveredMansion) {
        this.clearHoverState();
      }
      return;
    }

    if (this.currentDimension === 'diorama') {
      // 0. 若鼠标悬停在浮动 UI 面板、百岳导览坞、名片列表、图例、切换栏或探针名片本身之上，立即抑制并隐藏 3D 探针与浮动名片
      if (this.isPointerOverUI(e.target)) {
        if (this.hoveredCity) {
          this.hoveredCity = null;
          this.container.style.cursor = 'default';
          if (this.onCityHover) this.onCityHover(null, { x: 0, y: 0 });
        }
        this.dioramaTerrain.updateProbeReticle(null, false);
        if (this.onDioramaProbeHover) this.onDioramaProbeHover(null, { x: 0, y: 0 });
        return;
      }

      this.raycaster.setFromCamera(this.mouse, this.camera);
      // 1. 仅当命中的城邑在当前图层模式下实际在场景树中全部祖先均可见时，才触发城邑微印聚焦
      const interactables = this.raycaster.intersectObjects(this.dioramaTerrain.getInteractableMeshes(), true);
      let hitDest: DestinationItem | null = null;
      let hitObj: THREE.Object3D | null = null;

      if (interactables.length > 0) {
        for (let i = 0; i < interactables.length; i++) {
          const obj = interactables[i].object;
          let isVis = true;
          let cur: THREE.Object3D | null = obj;
          while (cur) {
            if (!cur.visible) { isVis = false; break; }
            cur = cur.parent;
          }
          if (isVis && obj.userData?.hitData?.dest) {
            hitDest = obj.userData.hitData.dest as DestinationItem;
            hitObj = obj;
            break;
          }
        }
      }

      if (hitDest && hitObj) {
        this.container.style.cursor = 'pointer';
        if (this.hoveredCity?.id !== hitDest.id) {
          this.hoveredCity = hitDest;
          this.dioramaTerrain.setActiveCity(hitDest.id);
          this.sound.playGuqin(hitDest.dayIndex);
          if (this.onCityHover) {
            const screenPos = this.worldToScreen(hitObj.getWorldPosition(new THREE.Vector3()));
            this.onCityHover(hitDest, screenPos);
          }
        }
        this.dioramaTerrain.updateProbeReticle(null, false);
        if (this.onDioramaProbeHover) this.onDioramaProbeHover(null, { x: 0, y: 0 });
        return;
      } else {
        if (this.hoveredCity) {
          this.hoveredCity = null;
          this.container.style.cursor = 'default';
          if (this.onCityHover) this.onCityHover(null, { x: 0, y: 0 });
        }
      }

      // 未命中城邑印鉴时，执行三维立体沙盘地势与高程探针感应
      const terrainMesh = this.dioramaTerrain.getTerrainMesh();
      let hitPoint: THREE.Vector3 | null = null;
      if (terrainMesh) {
        const terrainHits = this.raycaster.intersectObject(terrainMesh, false);
        if (terrainHits.length > 0) {
          hitPoint = terrainHits[0].point;
        }
      }

      // 若直接地形未命中（如光标悬停在名山微雕神阁或水系琉璃带上），则穿透检测沙盘允许的探针物体
      // (严格排除紫檀须弥托盘 plinthGroup 与罗盘 compassRoseGroup，防止沙盘外太空误触发名片！)
      if (!hitPoint) {
        const probeableObjects = this.dioramaTerrain.getProbeableObjects();
        const groupHits = this.raycaster.intersectObjects(probeableObjects, true);
        for (let i = 0; i < groupHits.length; i++) {
          const obj = groupHits[i].object;
          if (obj.name === 'ProbeReticle' || obj.parent?.name === 'DioramaProbeReticle' || obj.name === 'CompassNeedle') continue;
          hitPoint = groupHits[i].point;
          break;
        }
      }

      if (hitPoint) {
        const localPt = this.dioramaTerrain.group.worldToLocal(hitPoint.clone());
        const geoBounds = this.dioramaTerrain.getGeoBounds();
        const halfW = geoBounds.width * 0.5;
        const halfD = geoBounds.depth * 0.5;

        // 严格沙盘地表面积边界约束：超出沙盘平面范围（如托盘边框、虚空外缘）一律视为空，杜绝名片飞出沙盘！
        if (Math.abs(localPt.x) > halfW - 0.015 || Math.abs(localPt.z) > halfD - 0.015) {
          hitPoint = null;
        } else {
          const geo = this.dioramaTerrain.localToGeo(localPt.x, localPt.z);
          const probeData = this.dioramaTerrain.probeLocation(geo.lat, geo.lng);
          this.dioramaTerrain.updateProbeReticle(hitPoint, true);
          if (this.onDioramaProbeHover) {
            this.onDioramaProbeHover(probeData, { x: e.clientX, y: e.clientY });
          }
          return;
        }
      }

      this.dioramaTerrain.updateProbeReticle(null, false);
      if (this.onDioramaProbeHover) this.onDioramaProbeHover(null, { x: 0, y: 0 });
      return;
    }

    if (this.currentDimension !== 'globe') {
      this.clearHoverState();
      this.container.style.cursor = 'default';
      return;
    }

    const camDist = this.camera.position.length();

    // 1. 微观郡邑视界 (Z < shared cityBoundary)：全域 21 地市多边形与沙盘升起感应
    if (getInteractionOwner(experienceState.getState()) === 'city') {
      const cityMatch = this.findCityAtMouse(e);
      if (cityMatch) {
        this.armillary.isHoveringInteractable = true;
        const city = cityMatch.city;
        if (this.hoveredCity?.id !== city.id) {
          this.hoveredCity = city;
          experienceState.setHoveredDestination(city.id);
          this.cityElevator.setHoveredCity(city.id, cityMatch.localPt);
          this.landmarkPins.setHoveredCity(city.id);
          this.vectorOverlay.setHoveredCity(city.id);
          this.container.style.cursor = 'pointer';
          this.sound.playGuqin(city.dayIndex);
        }

        this.landmarkPins.highlightProvince('');
        this.vectorOverlay.setProvinceHover(false);

        if (this.onCityHover) {
          this.onCityHover(city, cityMatch.screenPos);
        }

        if (this.hoveredMansion) {
          this.hoveredMansion = null;
          this.armillary.highlightMansion(null);
        }
        return;
      } else {
        if (this.hoveredCity) {
          this.hoveredCity = null;
          experienceState.setHoveredDestination(null);
          this.cityElevator.setHoveredCity(null);
          this.landmarkPins.setHoveredCity(null);
          this.vectorOverlay.setHoveredCity(null);
          if (this.onCityHover) this.onCityHover(null, { x: 0, y: 0 });
        }
      }
    } else {
      // 2. 宏观神州与省级视界 (Z >= shared cityBoundary)：严格判定省级名片
      if (this.hoveredCity) {
        this.hoveredCity = null;
        this.cityElevator.setHoveredCity(null);
        this.landmarkPins.setHoveredCity(null);
        this.vectorOverlay.setHoveredCity(null);
        if (this.onCityHover) this.onCityHover(null, { x: 0, y: 0 });
      }

      const provMatch = this.findClosestProvincialPin(e);
      if (provMatch) {
        this.landmarkPins.highlightProvince(provMatch.prov.id);
        this.vectorOverlay.setProvinceHover(true);
        this.container.style.cursor = 'pointer';
        return;
      } else {
        this.landmarkPins.highlightProvince('');
        this.vectorOverlay.setProvinceHover(false);
      }
    }

    // 3. 次级判定：浑天仪星宿环射线检测
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const ringIntersects = this.raycaster.intersectObjects(this.armillary.interactableMeshes, false);

    if (ringIntersects.length > 0) {
      this.armillary.isHoveringInteractable = true;
      const hit = ringIntersects[0].object;
      if (hit.userData.isLunarMansion) {
        const mansion = hit.userData.mansion as LunarMansionItem;
        if (this.hoveredMansion?.id !== mansion.id) {
          this.hoveredMansion = mansion;
          this.armillary.highlightMansion(mansion.id);
          this.container.style.cursor = 'pointer';
          const screenPos = this.worldToScreen(hit.getWorldPosition(new THREE.Vector3()));
          if (this.onLunarMansionHover) this.onLunarMansionHover(mansion, screenPos);
        }
      } else {
        this.container.style.cursor = 'pointer';
      }
      if (this.hoveredCity) {
        this.hoveredCity = null;
        this.cityElevator.setHoveredCity(null);
        this.landmarkPins.setHoveredCity(null);
        this.vectorOverlay.setHoveredCity(null);
        if (this.onCityHover) this.onCityHover(null, { x: 0, y: 0 });
      }
    } else {
      this.armillary.isHoveringInteractable = false;
      this.clearHoverState();
    }
  }

  public get selectedCity(): DestinationItem | null {
    const selectedId = experienceState.getState().selectedDestinationId;
    return selectedId ? findDestinationById(selectedId) || null : null;
  }

  public set selectedCity(city: DestinationItem | null) {
    experienceState.setSelectedDestination(city?.id || null);
  }

  private onPointerClick(e: MouseEvent) {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY > EXPERIENCE_GEOMETRY.scroll.webglLock) return;

    if (this.isPointerOverUI(e.target)) {
      return;
    }

    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    const duration = Date.now() - this.pointerDownTime;
    if (dist > 5 || duration > 350 || this.isPointerDragging) {
      return;
    }

    if (this.currentDimension === 'diorama') {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // 1. 优先命中地级市印标、名山或水系
      const interactables = this.raycaster.intersectObjects(this.dioramaTerrain.getInteractableMeshes(), true);
      if (interactables.length > 0) {
        const hit = interactables[0].object;
        const hitData = hit.userData?.hitData;
        if (hitData) {
          if (hitData.dest) {
            const dest = hitData.dest as DestinationItem;
            this.sound.playGuqin(dest.dayIndex);
            this.selectedCity = dest;
            this.activeDestination = dest;
            this.dioramaTerrain.setActiveCity(dest.id);
            
            const targetPos = hit.getWorldPosition(new THREE.Vector3());
            this.flyDioramaToFocus(targetPos.x, targetPos.z, targetPos.y, 1.85, 1.1);

            if (this.onDioramaItemSelect) this.onDioramaItemSelect(hitData);
            if (this.onCitySelect) this.onCitySelect(dest);
            return;
          } else if (hitData.type === 'mountain') {
            this.sound.playBronzeBell();
            this.flyDioramaToMountain(hitData.id);
            if (this.onDioramaItemSelect) this.onDioramaItemSelect(hitData);
            return;
          } else if (hitData.type === 'river') {
            this.sound.playBronzeBell();
            const targetPos = hit.getWorldPosition(new THREE.Vector3());
            this.flyDioramaToFocus(targetPos.x, targetPos.z, targetPos.y, 1.45, 1.1);
            if (this.onDioramaItemSelect) this.onDioramaItemSelect(hitData);
            return;
          }
        }
      }

      // 2. 单击空白沙盘地形或大洋水体：保持视角平稳中正，杜绝误触将观察视心甩至地图偏远角落
      return;
    }

    if (this.currentDimension !== 'globe') return;

    const camDist = this.camera.position.length();

    // 1. 【宏观远景/省级视界 (Z >= shared cityBoundary)】：点击省级名片，平滑飞入省域全景
    if (getInteractionOwner(experienceState.getState()) !== 'city') {
      const provMatch = this.findClosestProvincialPin(e);
      if (provMatch) {
        this.sound.playBronzeBell();
        this.onProvinceSelect?.(provMatch.prov);
        const targetZ = this.getProvinceAdaptiveZoom(provMatch.prov.id);
        this.flyToCoordinate(provMatch.prov.coords.lat, provMatch.prov.coords.lng, targetZ);
        return;
      }
    } else {
      // 2. 【微观郡邑视界 (Z < shared cityBoundary)】：已进入省域，进行 21 地市全域多边形与地标点击判定
      const cityMatch = this.findCityAtMouse(e);
      if (cityMatch) {
        const city = cityMatch.city;
        const drawerOpen = this.isDossierOpen ? this.isDossierOpen() : false;

        if (this.selectedCity?.id === city.id && drawerOpen) {
          // 再次点击已选中的市 且 详情抽屉已处于展开状态：触发 3D 破空跃迁画卷动画
          if (this.onCityDblClick) {
            this.onCityDblClick(city);
          } else {
            this.warpToScenic(city);
          }
        } else {
          // 首次单击（或抽屉当前已合上）：选中该市，平滑朝向该市，触发 3D 沙盘升起，展开左侧名片
          this.selectedCity = city;
          this.cityElevator.setSelectedCity(city.id);
          this.landmarkPins.setSelectedCity(city.id);
          this.vectorOverlay.setSelectedCity(city.id);
          if (this.onCitySelect) this.onCitySelect(city);
        }
        return;
      }
    }

    // 3. 点击空白区域：取消选中并平滑降落沙盘，收起名片
    if (this.selectedCity) {
      this.selectedCity = null;
      this.cityElevator.setSelectedCity(null);
      this.landmarkPins.setSelectedCity(null);
      this.vectorOverlay.setSelectedCity(null);
      if (this.onCitySelect) this.onCitySelect(null as any);
    }

    // 4. 次级判定浑天仪环节点点击
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const ringIntersects = this.raycaster.intersectObjects(this.armillary.interactableMeshes, false);

    if (ringIntersects.length > 0) {
      const hit = ringIntersects[0].object;
      if (hit.userData.isLunarMansion) {
        const mansion = hit.userData.mansion as LunarMansionItem;
        this.sound.playBronzeBell();
        if (this.onLunarMansionSelect) this.onLunarMansionSelect(mansion);
      } else if (hit.userData.isSolarTerm) {
        const term = hit.userData.term as SolarTermItem;
        this.sound.playBronzeBell();
        if (this.onSolarTermSelect) this.onSolarTermSelect(term);
      } else if (hit.userData.isEarthlyBranch) {
        const branch = hit.userData.branch as EarthlyBranchItem;
        this.sound.playBronzeBell();
        if (this.onEarthlyBranchSelect) this.onEarthlyBranchSelect(branch);
      }
    }
  }

  /**
   * 双击交互引擎：双击地标直接飞越聚焦，双击空白区/地球自动正向对齐平旋摆正
   */
  private onPointerDblClick(e: MouseEvent) {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY > EXPERIENCE_GEOMETRY.scroll.webglLock) return;

    if (this.currentDimension === 'diorama') {
      this.resetDioramaOverview(1.2);
      return;
    }

    if (this.currentDimension !== 'globe') return;

    const target = e.target as HTMLElement;
    if (target && target.closest('.astrolabe-floating-scale, .celestial-observatory-hud, .hero-unified-cultural-card, .hero-beast-summon-bar, button, a, input, [role="button"]')) {
      return;
    }

    const camDist = this.camera.position.length();
    if (getInteractionOwner(experienceState.getState()) === 'city') {
      const cityMatch = this.findCityAtMouse(e);
      if (cityMatch) {
        if (this.onCityDblClick) {
          this.onCityDblClick(cityMatch.city);
        } else {
          this.warpToScenic(cityMatch.city);
        }
        return;
      }
    } else {
      const provMatch = this.findClosestProvincialPin(e);
      if (provMatch) {
        this.onProvinceSelect?.(provMatch.prov);
        const targetZ = this.getProvinceAdaptiveZoom(provMatch.prov.id);
        this.flyToCoordinate(provMatch.prov.coords.lat, provMatch.prov.coords.lng, targetZ);
        return;
      }
    }

    // 双击地球/空白：平滑正立对齐
    this.autoAlignUpright();
  }

  /**
   * 万象沙盘微距俯冲聚焦 (Smooth Camera Dive to Diorama Landmark)
   * 采用 3/4 经典斜俯空中透视（俯角 ~37°，方位角西偏南 ~18° 金色微侧角），
   * 模长精准归一化：dx = 0.24, dy = 0.60, dz = 0.76 (norm = 1.00)，
   * 相机距视心绝对欧氏距离精确等于 distance，三维山形自然立体、八面汉剑切面反光分明。
   */
  public flyDioramaToFocus(targetX: number, targetZ: number, targetY = 0, distance = 1.85, duration = 1.0) {
    if (this.currentDimension !== 'diorama') return;

    // 100% 真实全域自由聚焦：飞行过程中锁定 OrbitControls，杜绝 update 循环干扰 GSAP 视心航迹
    this.controls.enabled = false;
    gsap.killTweensOf(this.controls.target);
    gsap.to(this.controls.target, {
      x: targetX,
      y: targetY,
      z: targetZ,
      duration,
      ease: 'power3.inOut'
    });

    // 计算三维黄金 3/4 斜俯视角相机位移
    const camX = targetX + distance * 0.24;
    const camY = targetY + distance * 0.60;
    const camZ = targetZ + distance * 0.76;

    gsap.killTweensOf(this.camera.position);
    gsap.to(this.camera.position, {
      x: camX,
      y: camY,
      z: camZ,
      duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.camera.lookAt(this.controls.target.x, this.controls.target.y, this.controls.target.z);
        this.publishCameraDistance();
      },
      onComplete: () => {
        this.controls.target.set(targetX, targetY, targetZ);
        this.controls.enabled = true;
        this.controls.update();
        this.publishCameraDistance();
      }
    });
  }

  /**
   * 万象沙盘一键飞向指定名山 (Smooth Flight to Famous Mountain Peak)
   * 彻底根除沙盘组位置偏移 (this.dioramaTerrain.group.position.y = -0.4) 导致的向天虚瞄 0.4m 恶性偏差！
   * 采用 0.62m 人性化黄金景深与右侧 360px 导览坞避让补偿，八面汉剑特写与连绵山川气象万千。
   */
  public flyDioramaToMountain(mountainId: string, duration = 1.15): { x: number; y: number; z: number; spec: any } | null {
    if (this.currentDimension !== 'diorama') return null;
    const coord = this.dioramaTerrain.getMountainCoordinates(mountainId);
    if (!coord) return null;

    // 严密获取世界绝对坐标：杜绝因局部坐标缺失根节点 -0.4m 偏移造成的虚空视心错误
    const worldX = coord.worldX ?? (coord.x + this.dioramaTerrain.group.position.x);
    const worldY = coord.worldY ?? (coord.y + this.dioramaTerrain.group.position.y);
    const worldZ = coord.worldZ ?? (coord.z + this.dioramaTerrain.group.position.z);

    // 瞄准神岳峰顶与八面汉剑神兵核心（石坑崆实景角峰拔起0.026m，视心精准抬升至神兵与极巅天石重心）
    const targetY = worldY + (mountainId === 'shikengkung' ? 0.048 : 0.032);

    // 视觉开阔区避让补偿：右侧常驻 360px 全景导览坞，视心轻微偏右 (+0.018m)，使神峰与道剑完美立于可视空间黄金中轴
    const targetX = worldX + 0.018;
    const targetZ = worldZ;

    // 人性化黄金视距 (0.62m 舒适景深)：兼顾华夏八面汉剑凌厉锋芒特写与巍峨山峰岩层地貌，留有充分山川连绵意境
    this.flyDioramaToFocus(targetX, targetZ, targetY, 0.62, duration);
    this.dioramaTerrain.highlightMountain(mountainId);
    return coord;
  }

  /**
   * 清除万象沙盘名山高亮接引光柱 (Extinguish Diorama Mountain Highlight Beacon)
   */
  public clearDioramaMountainHighlight() {
    if (this.currentDimension !== 'diorama') return;
    this.dioramaTerrain.highlightMountain(null);
  }

  /**
   * 万象沙盘复位全景 (Reset Diorama to Full Panoramic View)
   */
  public resetDioramaOverview(duration = 1.1) {
    if (this.currentDimension !== 'diorama') return;
    this.dioramaTerrain.highlightMountain(null);

    this.controls.enabled = false;
    gsap.killTweensOf(this.controls.target);
    gsap.to(this.controls.target, {
      x: 0,
      y: 0,
      z: 0,
      duration,
      ease: 'power3.inOut'
    });

    gsap.killTweensOf(this.camera.position);
    gsap.to(this.camera.position, {
      x: 0,
      y: 2.2,
      z: EXPERIENCE_GEOMETRY.camera.diorama,
      duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.camera.lookAt(this.controls.target.x, this.controls.target.y, this.controls.target.z);
        this.publishCameraDistance();
      },
      onComplete: () => {
        this.controls.target.set(0, 0, 0);
        this.controls.enabled = true;
        this.controls.update();
        this.publishCameraDistance();
      }
    });

    this.dioramaTerrain.setActiveCity(null);
    this.selectedCity = null;
  }

  /**
   * 智能正向对齐：将当前视界平滑正立摆正，绝不颠倒
   */
  public autoAlignUpright() {
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.globePivot.quaternion.clone().invert());
    const lat = Math.asin(forward.y) * (180 / Math.PI);
    const lng = (Math.atan2(forward.z, -forward.x) * (180 / Math.PI) - 180 + 540) % 360 - 180;

    const targetQuat = this.getUprightQuaternion(lat, lng);
    const startQuat = this.globePivot.quaternion.clone();

    const animObj = { t: 0 };
    gsap.to(animObj, {
      t: 1,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.globePivot.quaternion.slerpQuaternions(startQuat, targetQuat, animObj.t);
      }
    });
    this.sound.playBronzeBell();
  }

  private currentRenderedDimension: DimensionMode = 'globe';

  /**
   * 切换三重视界 (Dimension Mode Switcher - 搭载星际穿越黑洞折跃)
   */
  public switchDimension(mode: DimensionMode) {
    if (this.currentRenderedDimension === mode) return;
    this.currentRenderedDimension = mode;

    experienceState.setDimension(mode);
    if (this.onDimensionChange) {
      this.onDimensionChange(mode);
    }

    this.triggerGargantuaWarp({
      duration: 1.15,
      onMidpoint: () => {
        experienceState.setDimension(mode);

        if (mode === 'globe') {
          this.globePivot.visible = true;
          this.armillary.group.visible = true;
          this.dioramaTerrain.group.visible = false;
          this.regionalDioramaTerrain.group.visible = false;
          this.mythicBeast.group.visible = false;
          this.controls.enabled = false;
          this.controls.target.set(0, 0, 0);

          // 归正模型底座与浑天仪位置居中
          this.globePivot.position.set(0, 0, 0);
          this.armillary.group.position.set(0, 0, 0);
          this.camera.up.set(0, 1, 0);

          // 彻底根除从沙盘返回神州时被温州悬浮态劫持的 Bug：
          // 从沙盘切换/返回神州坤舆时，一律以神州宏观全景大观 (Z: 5.40) 与广东正南正北初态呈现，
          // 彻底清空城市单选沙盘拔高、地标针与悬浮名片。
          this.selectedCity = null;
          this.clearHoverState();

          gsap.killTweensOf(this.camera.position);
          this.camera.position.set(0, 0, this.overviewCameraZ);
          this.camera.lookAt(0, 0, 0);
          this.targetCameraZ = this.overviewCameraZ;

          this.cityElevator.setSelectedCity(null);
          this.landmarkPins.setSelectedCity(null);
          this.vectorOverlay.setSelectedCity(null);
          this.landmarkPins.highlightCity('');

          this.initGuangdongFacing();
          this.publishCameraDistance(this.overviewCameraZ);
        } else if (mode === 'diorama') {
          this.globePivot.visible = false;
          this.armillary.group.visible = false;
          this.dioramaTerrain.group.visible = true;
          this.regionalDioramaTerrain.group.visible = false;
          const isGuangdongDest = this.activeDestination && (this.activeDestination.country?.includes('广东') || this.activeDestination.region?.key?.includes('lingnan'));
          const gdCityId = isGuangdongDest ? this.activeDestination!.id : 'guangzhou';
          this.dioramaTerrain.setActiveCity(gdCityId);
          this.mythicBeast.group.visible = false;
          this.controls.enabled = true;
          this.controls.enableZoom = true;
          this.controls.enablePan = true;
          this.controls.screenSpacePanning = true;
          this.controls.panSpeed = 1.2;
          this.controls.rotateSpeed = 1.25;
          this.controls.dampingFactor = 0.16;
          this.controls.minDistance = 0.20;
          this.controls.maxDistance = 8.5;
          this.camera.near = 0.02;
          this.camera.updateProjectionMatrix();
          this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
          this.controls.minPolarAngle = 0.05;
          this.camera.position.set(0, 2.2, EXPERIENCE_GEOMETRY.camera.diorama);
          this.targetCameraZ = EXPERIENCE_GEOMETRY.camera.diorama;
          this.controls.target.set(0, 0, 0);
          this.controls.update();
        } else if (mode === 'beast') {
          this.globePivot.visible = false;
          this.armillary.group.visible = false;
          this.dioramaTerrain.group.visible = false;
          this.regionalDioramaTerrain.group.visible = false;
          this.mythicBeast.group.visible = true;
          if (this.activeDestination) {
            this.mythicBeast.summonBeast(this.activeDestination);
          }
          this.controls.enabled = true;
          this.controls.enableZoom = true;
          this.controls.minDistance = 1.0;
          this.controls.maxDistance = 8.0;
          this.controls.maxPolarAngle = Math.PI - 0.05;
          this.camera.position.set(0, 0.3, EXPERIENCE_GEOMETRY.camera.beast);
          this.targetCameraZ = EXPERIENCE_GEOMETRY.camera.beast;
          this.controls.target.set(0, 0, 0);
          this.controls.update();
        }

        this.publishCameraDistance(this.camera.position.z);

        if (this.onDimensionChange) {
          this.onDimensionChange(mode);
        }
      }
    });
  }

  public setDimensionMode(mode: DimensionMode) {
    this.switchDimension(mode);
  }

  public setDioramaLayerMode(mode: 'topography' | 'landforms' | 'mountains' | 'waters' | 'roads' | 'cities') {
    this.dioramaTerrain.setLayerMode(mode as any);
  }

  public getDimensionMode(): DimensionMode {
    return this.currentDimension;
  }

  /**
   * 选中目的地时同步更新神兽与粒子色彩
   */
  public updateActiveDestination(dest: DestinationItem) {
    this.activeDestination = dest;
    experienceState.setActiveDestination(dest.id);
    this.mythicBeast.summonBeast(dest);

    if (this.currentDimension === 'diorama') {
      this.dioramaTerrain.group.visible = true;
      this.regionalDioramaTerrain.group.visible = false;
      this.dioramaTerrain.setActiveCity(dest.id);
    }

    // Update Curl-Noise Particle theme colors
    this.particles.setThemeColors(
      dest.colorTheme.glow || '#D4AF37',
      dest.colorTheme.primary || '#38EF7D'
    );
  }

  private onSmartWheel(e: WheelEvent) {
    const target = e.target as HTMLElement | null;
    // 1. 如果鼠标位于任何可滚动的详情名片、抽屉、信息面板、名山导览坞、尺寸条或列表中，放行原生滚动，坚决不拦截
    if (target && target.closest('.scholar-scroll-drawer-root, #destination-hanging-scroll, .scholar-scroll-inner, .scroll-chapter-content-body, .ru-altitude-gauge-root, #astrolabe-floating-scale, #scale-filigree-track, #diorama-floating-scale, #diorama-filigree-track, #diorama-mountain-dock, .diorama-mountain-dock, #mountain-cards-track, .mountain-cards-track, .mountain-card-item, .city-hover-tooltip, .scenic-lore-card, .scenic-immersion-window, .scenic-lore-block, .oracle-drawer-content, .passport-card-list, .mansion-body-scroll, [data-scrollable], select, textarea, input')) {
      return;
    }

    // 2. 如果页面已经滚动离开滚轮接管区（scrollY > shared wheelCapture），恢复正常原生页面滚动
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY > EXPERIENCE_GEOMETRY.scroll.wheelCapture) {
      return;
    }

    // 3. 在 3D 主视界首屏内，彻底拦截页面滚轮滚动，杜绝因滚轮操作误触发画卷唤起
    e.preventDefault();

    if (this.currentDimension !== 'globe') {
      // 在万象沙盘与神兽真身模式下：OrbitControls 原生平滑处理 Canvas 滚轮
      return;
    }

    const currentZ = this.targetCameraZ;

    // 4. 精细微距对数分级步长：近地面极其细腻（跨度微小舒适），全景顺畅平稳
    const distToSurface = Math.max(0.04, currentZ - this.earthRadius);
    const zoomSpeed = THREE.MathUtils.clamp(distToSurface * 0.0012, 0.00045, 0.0035);
    const delta = e.deltaY * zoomSpeed;
    this.targetCameraZ = THREE.MathUtils.clamp(this.targetCameraZ + delta, this.minCameraZ, this.maxCameraZ);

    gsap.killTweensOf(this.camera.position);
    gsap.to(this.camera.position, {
      z: this.targetCameraZ,
      duration: 0.28,
      ease: 'power3.out',
      overwrite: 'auto',
      onUpdate: () => {
        this.publishCameraDistance();
      }
    });
  }

  public setCameraDistance(targetZ: number, animated = true) {
    if (this.currentDimension === 'diorama' || this.currentDimension === 'beast') {
      const target = this.controls.target || new THREE.Vector3(0, 0, 0);
      const dir = new THREE.Vector3().subVectors(this.camera.position, target);
      const currentDist = dir.length();
      if (currentDist < 0.001) dir.set(0, 2.2, 4.0);
      const minLimit = this.controls.minDistance !== undefined ? this.controls.minDistance : (this.currentDimension === 'diorama' ? 0.20 : 1.0);
      const maxLimit = this.controls.maxDistance || 10.0;
      const clampedDist = THREE.MathUtils.clamp(targetZ, minLimit, maxLimit);
      dir.normalize().multiplyScalar(clampedDist);
      const targetPos = new THREE.Vector3().addVectors(target, dir);

      if (animated) {
        gsap.killTweensOf(this.camera.position);
        gsap.to(this.camera.position, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          duration: 0.55,
          ease: 'power2.out',
          onUpdate: () => {
            this.controls.update();
            this.publishCameraDistance();
          }
        });
      } else {
        this.camera.position.copy(targetPos);
        this.controls.update();
        this.publishCameraDistance();
      }
      return;
    }

    const clampedZ = THREE.MathUtils.clamp(targetZ, this.minCameraZ, this.maxCameraZ);
    this.targetCameraZ = clampedZ;
    if (animated) {
      gsap.killTweensOf(this.camera.position);
      gsap.to(this.camera.position, {
        z: clampedZ,
        duration: 0.55,
        ease: 'power2.out',
        onUpdate: () => {
          this.publishCameraDistance();
        }
      });
    } else {
      this.camera.position.z = clampedZ;
      this.publishCameraDistance(clampedZ);
    }
  }

  public zoomIn() {
    if (this.currentDimension === 'diorama' || this.currentDimension === 'beast') {
      const target = this.controls.target || new THREE.Vector3(0, 0, 0);
      const dir = new THREE.Vector3().subVectors(this.camera.position, target);
      const currentDist = dir.length();
      const minLimit = this.controls.minDistance !== undefined ? this.controls.minDistance : (this.currentDimension === 'diorama' ? 0.20 : 1.0);
      const newDist = Math.max(minLimit, currentDist * 0.82);
      dir.normalize().multiplyScalar(newDist);
      gsap.killTweensOf(this.camera.position);
      gsap.to(this.camera.position, {
        x: target.x + dir.x,
        y: target.y + dir.y,
        z: target.z + dir.z,
        duration: 0.32,
        ease: 'power2.out',
        onUpdate: () => {
          this.controls.update();
          this.publishCameraDistance();
        }
      });
      return;
    }

    const distToSurface = Math.max(0.06, this.camera.position.z - this.earthRadius);
    const step = THREE.MathUtils.clamp(distToSurface * 0.22, 0.12, 0.45);
    this.targetCameraZ = Math.max(this.minCameraZ, this.camera.position.z - step);
    gsap.killTweensOf(this.camera.position);
    gsap.to(this.camera.position, {
      z: this.targetCameraZ,
      duration: 0.32,
      ease: 'power2.out',
      onUpdate: () => {
        this.publishCameraDistance();
      }
    });
  }

  public zoomOut() {
    if (this.currentDimension === 'diorama' || this.currentDimension === 'beast') {
      const target = this.controls.target || new THREE.Vector3(0, 0, 0);
      const dir = new THREE.Vector3().subVectors(this.camera.position, target);
      const currentDist = dir.length();
      const maxLimit = this.controls.maxDistance || 10.0;
      const newDist = Math.min(maxLimit, currentDist * 1.18);
      dir.normalize().multiplyScalar(newDist);
      gsap.killTweensOf(this.camera.position);
      gsap.to(this.camera.position, {
        x: target.x + dir.x,
        y: target.y + dir.y,
        z: target.z + dir.z,
        duration: 0.32,
        ease: 'power2.out',
        onUpdate: () => {
          this.controls.update();
          this.publishCameraDistance();
        }
      });
      return;
    }

    const distToSurface = Math.max(0.06, this.camera.position.z - this.earthRadius);
    const step = THREE.MathUtils.clamp(distToSurface * 0.25, 0.15, 0.55);
    this.targetCameraZ = Math.min(this.maxCameraZ, this.camera.position.z + step);
    gsap.killTweensOf(this.camera.position);
    gsap.to(this.camera.position, {
      z: this.targetCameraZ,
      duration: 0.32,
      ease: 'power2.out',
      onUpdate: () => {
        this.publishCameraDistance();
      }
    });
  }

  /**
   * 正南正北严谨聚焦目标城市 (North is Up, perfectly aligned)
   */
  public focusCity(city: DestinationItem) {
    this.updateActiveDestination(city);
    this.landmarkPins.highlightCity(city.id);
    this.targetCameraZ = this.focusCameraZ;

    const targetQuat = this.getUprightQuaternion(city.coordinates.lat, city.coordinates.lng);
    const startQuat = this.globePivot.quaternion.clone();

    const animObj = { t: 0 };
    gsap.to(animObj, {
      t: 1,
      duration: 1.35,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.globePivot.quaternion.slerpQuaternions(startQuat, targetQuat, animObj.t);
      }
    });

    gsap.killTweensOf(this.camera.position);
    gsap.to(this.camera.position, {
      x: 0,
      y: 0,
      z: this.focusCameraZ,
      duration: 1.35,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.publishCameraDistance();
      }
    });
  }

  /**
   * 星际穿越 · 卡冈图雅 (Gargantua) 电影级黑洞引力透镜与超空间折跃转场引擎
   * 搭载爱因斯坦引力透镜弯曲、吸积盘金色光环、超空间时空流光拉丝与相对论色散
   */
  public triggerGargantuaWarp(options: {
    epicenterScreenPos?: { x: number; y: number };
    targetCity?: DestinationItem;
    duration?: number;
    onMidpoint?: () => void;
    onComplete?: () => void;
  }) {
    const duration = options.duration || 1.15;
    this.sound.playGargantuaWarp();

    // 1. 计算黑洞引力奇点归一化屏幕坐标
    let epicX = 0.5;
    let epicY = 0.5;
    if (options.epicenterScreenPos) {
      epicX = options.epicenterScreenPos.x / window.innerWidth;
      epicY = 1.0 - (options.epicenterScreenPos.y / window.innerHeight);
    } else if (options.targetCity) {
      const pinObj = this.landmarkPins.animatedItems.find(i => i.city.id === options.targetCity?.id);
      if (pinObj) {
        const tempV = new THREE.Vector3();
        pinObj.pinGroup.getWorldPosition(tempV);
        const sp = this.worldToScreen(tempV);
        epicX = sp.x / window.innerWidth;
        epicY = 1.0 - (sp.y / window.innerHeight);
      }
    }

    if (this.gargantuaWarpPass) {
      this.gargantuaWarpPass.enabled = true;
      this.gargantuaWarpPass.uniforms.uEpicenter.value.set(
        THREE.MathUtils.clamp(epicX, 0.05, 0.95),
        THREE.MathUtils.clamp(epicY, 0.05, 0.95)
      );

      // 2. 主题吸积盘色彩自适应
      if (options.targetCity) {
        this.gargantuaWarpPass.uniforms.uAccretionColor.value.set(options.targetCity.colorTheme.primary || '#FFD700');
      } else {
        this.gargantuaWarpPass.uniforms.uAccretionColor.value.set('#FFB84D');
      }
    }

    const warpObj = { progress: 0.0 };
    let midpointFired = false;
    this.isWarping = true;
    if (this.onTransitionStateChange) {
      this.onTransitionStateChange(true);
    }

    // 3. 高帧率 GSAP 物理折跃时间轴 (含镜头 FOV 动态呼吸)
    const startZ = this.camera.position.z;
    const peakZ = Math.max(EXPERIENCE_GEOMETRY.camera.warpPeakMin, startZ * 0.48);
    const startFov = 45;
    const peakFov = 58;

    gsap.killTweensOf(warpObj);
    gsap.to(warpObj, {
      progress: 1.0,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (this.gargantuaWarpPass) {
          this.gargantuaWarpPass.uniforms.uProgress.value = warpObj.progress;
        }

        // 引力透镜视向推拉与广角镜头曲率拉伸
        if (warpObj.progress <= 0.5) {
          const inT = warpObj.progress / 0.5;
          this.camera.position.z = THREE.MathUtils.lerp(startZ, peakZ, inT * inT);
          this.camera.fov = THREE.MathUtils.lerp(startFov, peakFov, inT * inT);
        } else {
          const outT = (warpObj.progress - 0.5) / 0.5;
          this.camera.position.z = THREE.MathUtils.lerp(peakZ, this.targetCameraZ, outT);
          this.camera.fov = THREE.MathUtils.lerp(peakFov, startFov, outT);
        }
        this.camera.updateProjectionMatrix();

        // 临界点破空触发
        if (warpObj.progress >= 0.50 && !midpointFired) {
          midpointFired = true;
          if (options.onMidpoint) options.onMidpoint();
        }
      },
      onComplete: () => {
        this.isWarping = false;
        if (this.gargantuaWarpPass) {
          this.gargantuaWarpPass.uniforms.uProgress.value = 0.0;
          this.gargantuaWarpPass.enabled = false;
        }
        this.camera.position.z = this.targetCameraZ;
        this.camera.fov = startFov;
        this.camera.updateProjectionMatrix();
        this.publishCameraDistance();
        if (options.onComplete) options.onComplete();
        if (this.onTransitionStateChange) {
          this.onTransitionStateChange(false);
        }
      }
    });
  }

  public warpToScenic(city: DestinationItem, onComplete?: () => void) {
    this.isWarping = true;
    this.targetCameraZ = EXPERIENCE_GEOMETRY.camera.scenicWarp;
    this.focusCity(city);

    // 预热并提前将实景图片解码载入显存，确保破空临界点 0ms 瞬间呈现零卡顿
    if (city.heroImage) {
      const preloadImg = new Image();
      preloadImg.src = city.heroImage;
      if (preloadImg.decode) {
        preloadImg.decode().catch(() => {});
      }
    }

    this.triggerGargantuaWarp({
      targetCity: city,
      duration: 1.15,
      onMidpoint: () => {
        if (onComplete) onComplete();
      },
      onComplete: () => {
        this.isWarping = false;
      }
    });
  }

  public pullBackToGlobe() {
    this.isWarping = false;
    this.triggerGargantuaWarp({
      duration: 1.05,
      onMidpoint: () => {
        this.resetToOverview();
      }
    });
  }

  public resetToOverview() {
    this.selectedCity = null;
    this.clearHoverState();
    if (this.cityElevator) this.cityElevator.setSelectedCity(null);
    if (this.landmarkPins) this.landmarkPins.setSelectedCity(null);
    if (this.vectorOverlay) this.vectorOverlay.setSelectedCity(null);
    if (this.armillary) this.armillary.highlightMansion(null);
    this.landmarkPins.highlightCity('');
    this.resetView();
  }

  public resetView() {
    if (this.currentDimension === 'diorama') {
      gsap.killTweensOf(this.camera.position);
      this.controls.target.set(0, 0, 0);
      gsap.to(this.camera.position, {
        x: 0,
        y: 2.2,
        z: EXPERIENCE_GEOMETRY.camera.diorama,
        duration: 1.0,
        ease: 'power3.inOut',
        onUpdate: () => {
          this.controls.update();
          this.publishCameraDistance();
        }
      });
      return;
    }

    if (this.currentDimension === 'beast') {
      gsap.killTweensOf(this.camera.position);
      this.controls.target.set(0, 0, 0);
      gsap.to(this.camera.position, {
        x: 0,
        y: 0.3,
        z: EXPERIENCE_GEOMETRY.camera.beast,
        duration: 1.0,
        ease: 'power3.inOut',
        onUpdate: () => {
          this.controls.update();
          this.publishCameraDistance();
        }
      });
      return;
    }

    this.targetCameraZ = this.overviewCameraZ;
    const targetQuat = this.getUprightQuaternion(23.13, 113.26);
    const startQuat = this.globePivot.quaternion.clone();

    const animObj = { t: 0 };
    gsap.to(animObj, {
      t: 1,
      duration: 1.4,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.globePivot.quaternion.slerpQuaternions(startQuat, targetQuat, animObj.t);
      }
    });

    gsap.killTweensOf(this.camera.position);
    gsap.to(this.camera.position, {
      x: 0,
      y: 0,
      z: this.overviewCameraZ,
      duration: 1.4,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.publishCameraDistance();
      }
    });
  }

  public handleScroll(scrollY: number, maxScroll: number) {
    if (scrollY > EXPERIENCE_GEOMETRY.scroll.webglLock) {
      this.clearHoverState();
    }
    // 页面上下滚动浏览画卷内容时，保持底层 3D 地球与浑天仪平稳居中，禁止左右东西晃动偏移
    if (this.currentDimension === 'globe') {
      this.globePivot.position.set(0, 0, 0);
      this.armillary.group.position.set(0, 0, 0);
    }
  }

  public worldToScreen(worldPos: THREE.Vector3): { x: number; y: number } {
    const v = worldPos.clone().project(this.camera);
    return {
      x: ((v.x + 1) / 2) * window.innerWidth,
      y: (-(v.y - 1) / 2) * window.innerHeight
    };
  }

  private animate = () => {
    if (!this.isAnimating) return;
    requestAnimationFrame(this.animate);

    const rawDelta = this.clock.getDelta();
    const delta = Math.min(0.045, Math.max(0.001, rawDelta));
    const elapsedTime = this.clock.getElapsedTime();

    if (this.currentDimension === 'globe') {
      // 浑天仪环与大气卷云层随视距平滑淡隐淡现：
      // 远看星象环与行星云气显赫 (z >= 5.4)，放大至省市级别时平滑淡出隐藏 (z <= 3.8)，彻底消除视线与地貌遮挡
      const fadeStartDist = EXPERIENCE_GEOMETRY.fade.armillaryStart;
      const fadeEndDist = EXPERIENCE_GEOMETRY.fade.armillaryEnd;
      const camDist = this.camera.position.z;
      const armillaryOpacity = THREE.MathUtils.clamp((camDist - fadeEndDist) / (fadeStartDist - fadeEndDist), 0, 1);
      this.armillary.setOpacity(armillaryOpacity);

      // 云层随微距平滑淡出至 0，保证近景地貌与名片 100% 清晰纯净
      const cloudMat = this.cloudsMesh.material as THREE.MeshStandardMaterial;
      if (cloudMat) {
        cloudMat.opacity = armillaryOpacity * 0.32;
        this.cloudsMesh.visible = armillaryOpacity > 0.01;
      }

      // 渐进式多级细节与 3D 浮雕增强 (Progressive 3D Bump & Topography Relief LOD)
      const zoomRatio = THREE.MathUtils.clamp((camDist - this.minCameraZ) / (this.maxCameraZ - this.minCameraZ), 0, 1);
      const dynamicBump = THREE.MathUtils.lerp(0.078, 0.036, zoomRatio);
      const earthMat = this.earthMesh.material as THREE.MeshStandardMaterial;
      if (earthMat) {
        earthMat.bumpScale = dynamicBump;
      }

      if (!this.isPointerDown) {
        const distToSurface = Math.max(0.06, camDist - this.earthRadius);
        const inertiaScale = THREE.MathUtils.clamp(distToSurface / 1.8, 0.08, 1.0);

        // ① 2D 平面旋转角动量惯性物理滑行 (近景强阻尼防滑移，远景丝滑飞旋)
        if (Math.abs(this.rollVelocity) > 0.0001) {
          const rollDeltaQuat = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            -this.rollVelocity * delta * Math.min(1.0, inertiaScale + 0.3)
          );
          this.globePivot.quaternion.premultiply(rollDeltaQuat);
          this.rollVelocity *= Math.pow(0.935, delta * 60);
        }

        // ② 自由 3D 轨迹球惯性平滑阻尼 (随微距距离指数增强制动，彻底杜绝特写漂移)
        if (Math.abs(this.rotVelocity.x) > 0.00001 || Math.abs(this.rotVelocity.y) > 0.00001) {
          const currentDamping = THREE.MathUtils.lerp(0.78, this.ROT_DAMPING, inertiaScale);
          const rotY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.rotVelocity.x * inertiaScale);
          const rotX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.rotVelocity.y * inertiaScale);
          const deltaQuat = new THREE.Quaternion().multiplyQuaternions(rotX, rotY);
          this.globePivot.quaternion.premultiply(deltaQuat);

          this.rotVelocity.x *= currentDamping;
          this.rotVelocity.y *= currentDamping;
        } else if (Math.abs(this.rollVelocity) <= 0.0001 && !this.hoveredCity && !this.isWarping) {
          // 优雅缓慢常态自转 (近景微距特写时自动暂停自转，方便细细端详地貌)
          if (camDist > EXPERIENCE_GEOMETRY.camera.idleRotationMin) {
            const idleRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), delta * 0.018);
            this.globePivot.quaternion.premultiply(idleRot);
          }
        }
        this.cloudsMesh.rotation.y += delta * 0.012;
      }

      if (Math.abs(this.camera.position.z - this.targetCameraZ) > 0.0005) {
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.targetCameraZ, 0.18);
        this.publishCameraDistance();
      }

      this.armillary.update(elapsedTime, delta, this.camera);
      this.vectorOverlay.update(camDist, elapsedTime);
      this.cityElevator.update(delta, elapsedTime, camDist);
      this.landmarkPins.update(elapsedTime, delta, camDist, this.camera);
    } else {
      this.armillary.setOpacity(0);
      if (this.currentDimension === 'diorama' || this.currentDimension === 'beast') {
        this.controls.update();
        if (this.currentDimension === 'diorama') {
          this.dioramaTerrain.update(elapsedTime, delta, this.camera);
        }
        if (this.currentDimension === 'beast') {
          this.mythicBeast.update(elapsedTime, delta);
        }
      }
    }

    // 节流处理高频鼠标射线拾取 (Three.js / Babylon.js 性能优化标准：每帧最多拾取一次，彻底杜绝主线程事件洪峰)
    if (this.pendingHoverEvent && !this.isPointerDown && !this.isPointerDragging) {
      this.onPointerHover(this.pendingHoverEvent);
      this.pendingHoverEvent = null;
    }

    // 全局东方流体星尘粒子涡流驱动 (时空运转、自转起伏与呼吸灵气，贯穿所有时空维度)
    if (this.particles) {
      this.particles.update(elapsedTime);
    }

    if (this.cinematicPass) {
      this.cinematicPass.uniforms.uTime.value = elapsedTime;
    }

    if (this.gargantuaWarpPass && this.gargantuaWarpPass.enabled) {
      this.gargantuaWarpPass.uniforms.uTime.value = elapsedTime;
    }

    this.composer.render();
  };

  public destroy() {
    this.isAnimating = false;
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('wheel', this.onWheelHandler);
    this.renderer.dispose();
  }
}
