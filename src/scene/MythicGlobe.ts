import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';

import type { Destination, SceneCapabilities } from '../types';
import {
  filmGrainVignetteShader,
  mistFragmentShader,
  mistVertexShader,
  mythicGlobeFragmentShader,
  mythicGlobeVertexShader,
  spiritParticleFragmentShader,
  spiritParticleVertexShader,
} from './shaders';

const GLOBE_RADIUS = 2;
const MAX_PARTICLES = 8_000;
const HIGH_PARTICLES = 7_600;
const BALANCED_PARTICLES = 4_600;
const LOW_PARTICLES = 2_200;
const INTERACTION_LAYER = 2;
const DRAG_THRESHOLD_SQUARED = 64;
const KEYBOARD_ROTATION_STEP = THREE.MathUtils.degToRad(7.5);
const MAX_GLOBE_PITCH = THREE.MathUtils.degToRad(68);
const DEFAULT_CAMERA_RADIUS = 5.72;
const MIN_CAMERA_RADIUS = 4.8;
const MAX_CAMERA_RADIUS = 8.2;
const KEYBOARD_TARGET_RADIUS_SQUARED = 0.18;

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const WORLD_RIGHT = new THREE.Vector3(1, 0, 0);
const IDENTITY_QUATERNION = new THREE.Quaternion();

type RenderQuality = Exclude<SceneCapabilities['quality'], 'fallback'>;

interface NavigatorHints extends Navigator {
  readonly deviceMemory?: number;
  readonly connection?: {
    readonly saveData?: boolean;
  };
}

export interface MythicGlobeCallbacks {
  readonly onDestinationSelect?: (destination: Destination) => void;
  readonly onCapabilitiesChange?: (capabilities: SceneCapabilities) => void;
  readonly onReady?: (capabilities: SceneCapabilities) => void;
  readonly onError?: (error: Error) => void;
}

export interface MythicGlobeOptions {
  readonly canvas: HTMLCanvasElement;
  readonly container: HTMLElement;
  readonly fallback: HTMLElement;
  readonly callbacks?: MythicGlobeCallbacks;
  readonly destinations?: readonly Destination[];
}

/**
 * Owns every Three.js resource associated with the MythicAtlas hero scene.
 * UI code only supplies unlocked destinations; this class never determines
 * whether a destination is allowed by the daily gate.
 */
export class MythicGlobe {
  private readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLElement;
  private readonly fallback: HTMLElement;
  private callbacks: MythicGlobeCallbacks;

  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  private readonly globeRoot = new THREE.Group();
  private readonly atmosphereRoot = new THREE.Group();
  private readonly armillaryRoot = new THREE.Group();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private readonly globeOccluder = new THREE.Sphere(new THREE.Vector3(), GLOBE_RADIUS);

  private renderer: THREE.WebGLRenderer | null = null;
  private composer: EffectComposer | null = null;
  private renderPass: RenderPass | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private grainPass: ShaderPass | null = null;
  private outputPass: OutputPass | null = null;

  private globeMesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> | null = null;
  private globeMaterial: THREE.ShaderMaterial | null = null;
  private mistGeometry: THREE.SphereGeometry | null = null;
  private readonly mistMeshes: Array<THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>> = [];
  private readonly mistMaterials: THREE.ShaderMaterial[] = [];
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particleMaterial: THREE.ShaderMaterial | null = null;
  private particles: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null = null;
  private armillaryGeometry: THREE.BufferGeometry | null = null;
  private armillaryMaterial: THREE.LineBasicMaterial | null = null;
  private armillaryLines: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial> | null = null;
  private pinMesh: THREE.InstancedMesh<THREE.OctahedronGeometry, THREE.MeshBasicMaterial> | null = null;

  private unlockedDestinations: Destination[] = [];
  private readonly pinNormals: THREE.Vector3[] = [];
  private activeDestination: Destination | null = null;

  private capabilityState: SceneCapabilities = {
    quality: 'fallback',
    pixelRatio: 1,
    particleCount: 0,
    postProcessing: false,
    reducedMotion: false,
  };
  private qualityCeiling: RenderQuality = 'high';
  private runtimeQuality: RenderQuality = 'high';
  private reducedMotionQuery: MediaQueryList | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private initialized = false;
  private disposed = false;
  private pausedByUser = false;
  private hiddenByDocument = false;
  private contextLost = false;
  private shaderCompilationError: Error | null = null;
  private animationFrame = 0;
  private lastFrameTime = 0;
  private elapsedTime = 0;
  private sampledFrameTime = 0;
  private sampledFrames = 0;
  private lastRenderedTime = 0;

  private cameraTween: gsap.core.Tween | null = null;
  private transitionResolve: (() => void) | null = null;
  private readonly transitionState = { progress: 0 };
  private readonly startCameraDirection = new THREE.Vector3();
  private readonly endCameraDirection = new THREE.Vector3();
  private readonly startCameraTarget = new THREE.Vector3();
  private readonly endCameraTarget = new THREE.Vector3();
  private readonly cameraTarget = new THREE.Vector3();
  private readonly startCameraUp = new THREE.Vector3();
  private readonly endCameraUp = new THREE.Vector3();
  private readonly sweepQuaternion = new THREE.Quaternion();
  private readonly transitionQuaternion = new THREE.Quaternion();
  private startCameraRadius = 6.2;
  private endCameraRadius = DEFAULT_CAMERA_RADIUS;
  private preferredCameraRadius = DEFAULT_CAMERA_RADIUS;
  private globeYaw = 0;
  private globePitch = 0;
  private pendingGlobeYaw = 0;
  private pendingGlobePitch = 0;
  private readonly globePitchQuaternion = new THREE.Quaternion();

  private pointerId = -1;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private pointerLastX = 0;
  private pointerLastY = 0;
  private pointerYawScale = 0;
  private pointerPitchScale = 0;
  private pointerDragged = false;

  private readonly scratchVectorA = new THREE.Vector3();
  private readonly scratchVectorB = new THREE.Vector3();
  private readonly instanceObject = new THREE.Object3D();
  private readonly scratchColor = new THREE.Color();

  private readonly initialCanvasHidden: HTMLElement['hidden'];
  private readonly initialFallbackHidden: HTMLElement['hidden'];
  private readonly initialFallbackAriaHidden: string | null;
  private insertedFallbackText = false;

  public constructor(options: MythicGlobeOptions);
  public constructor(
    canvas: HTMLCanvasElement,
    container: HTMLElement,
    fallback: HTMLElement,
    callbacks?: MythicGlobeCallbacks,
    destinations?: readonly Destination[],
  );
  public constructor(
    optionsOrCanvas: MythicGlobeOptions | HTMLCanvasElement,
    container?: HTMLElement,
    fallback?: HTMLElement,
    callbacks: MythicGlobeCallbacks = {},
    destinations: readonly Destination[] = [],
  ) {
    if (optionsOrCanvas instanceof HTMLCanvasElement) {
      if (!container || !fallback) {
        throw new Error('MythicGlobe requires a canvas, container, and fallback element.');
      }
      this.canvas = optionsOrCanvas;
      this.container = container;
      this.fallback = fallback;
      this.callbacks = callbacks;
      this.unlockedDestinations = this.uniqueDestinations(destinations);
    } else {
      this.canvas = optionsOrCanvas.canvas;
      this.container = optionsOrCanvas.container;
      this.fallback = optionsOrCanvas.fallback;
      this.callbacks = optionsOrCanvas.callbacks ?? {};
      this.unlockedDestinations = this.uniqueDestinations(optionsOrCanvas.destinations ?? []);
    }

    this.initialCanvasHidden = this.canvas.hidden;
    this.initialFallbackHidden = this.fallback.hidden;
    this.initialFallbackAriaHidden = this.fallback.getAttribute('aria-hidden');
  }

  public get capabilities(): SceneCapabilities {
    return this.getCapabilities();
  }

  public get isInitialized(): boolean {
    return this.initialized;
  }

  public initialize(destinations: readonly Destination[] = this.unlockedDestinations): SceneCapabilities {
    this.assertUsable();
    if (this.initialized) {
      this.setUnlockedDestinations(destinations);
      return this.getCapabilities();
    }

    try {
      this.unlockedDestinations = this.uniqueDestinations(destinations);
      this.reducedMotionQuery = typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
      this.qualityCeiling = this.detectQualityCeiling();
      if (this.reducedMotionQuery?.matches) {
        this.qualityCeiling = 'low';
      }
      this.runtimeQuality = this.qualityCeiling;
      this.createRenderer();
      this.refineQualityFromRenderer();
      this.configureScene();
      this.buildSceneObjects();
      if (this.activeDestination) {
        this.applyDestinationTheme(this.activeDestination);
        this.setParticleFocus(this.activeDestination);
        this.positionCameraAtDestination(this.activeDestination);
      }
      this.createPostProcessing();
      this.bindEvents();
      this.initialized = true;
      this.contextLost = false;
      this.updateCapabilities(false);
      this.renderer?.compile(this.scene, this.camera);
      this.resize();
      this.setFallbackVisible(false);
      this.renderOnce();
      if (this.shaderCompilationError) {
        throw this.shaderCompilationError;
      }
      this.synchronizeActivityState();
    } catch (reason: unknown) {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      const reducedMotion = this.reducedMotionQuery?.matches ?? false;
      this.stopAnimationLoop();
      this.initialized = false;
      this.contextLost = false;
      this.unbindEvents();
      this.cleanupGraphics();
      this.capabilityState = this.fallbackCapabilities(reducedMotion);
      this.setFallbackVisible(true, '此设备无法启用三维星图，已切换为静态浏览模式。');
      const capabilities = this.getCapabilities();
      this.invokeConsumerCallback('onCapabilitiesChange', () => this.callbacks.onCapabilitiesChange?.(capabilities));
      this.invokeConsumerCallback('onError', () => this.callbacks.onError?.(error));
      return this.getCapabilities();
    }

    const capabilities = this.getCapabilities();
    this.invokeConsumerCallback('onCapabilitiesChange', () => this.callbacks.onCapabilitiesChange?.(capabilities));
    this.invokeConsumerCallback('onReady', () => this.callbacks.onReady?.(capabilities));
    return capabilities;
  }

  /** Replace the raycastable pin set. Callers should only provide unlocked data. */
  public setUnlockedDestinations(destinations: readonly Destination[]): void {
    this.assertUsable();
    const nextDestinations = this.uniqueDestinations(destinations);
    if (this.activeDestination && !nextDestinations.some(({ id }) => id === this.activeDestination?.id)) {
      this.finishCameraTransition();
      this.activeDestination = null;
    }
    this.unlockedDestinations = nextDestinations;
    if (this.initialized) {
      this.buildLandmarkPins();
      this.renderOnce();
    }
  }

  public setDestination(destination: Destination, animated = true): Promise<void> {
    this.assertUsable();
    const unlockedDestination = this.requireUnlockedDestination(destination);
    return animated ? this.transitionTo(unlockedDestination) : this.applyDestinationImmediately(unlockedDestination);
  }

  /** Animate a quaternion-safe spherical camera sweep to a destination. */
  public transitionTo(destination: Destination): Promise<void> {
    this.assertUsable();
    destination = this.requireUnlockedDestination(destination);
    this.releaseActivePointer();
    this.applyPendingGlobeRotation();
    this.activeDestination = destination;
    this.applyDestinationTheme(destination);
    this.setParticleFocus(destination);
    this.refreshPinColors();

    if (!this.initialized || this.capabilityState.quality === 'fallback') {
      return Promise.resolve();
    }

    this.finishCameraTransition();
    if (this.capabilityState.reducedMotion) {
      this.positionCameraAtDestination(destination);
      this.renderOnce();
      return Promise.resolve();
    }

    this.prepareCameraTransition(destination);
    this.transitionState.progress = 0;

    return new Promise<void>((resolve) => {
      this.transitionResolve = resolve;
      this.cameraTween = gsap.to(this.transitionState, {
        progress: 1,
        duration: 1.8,
        ease: 'power3.inOut',
        overwrite: true,
        onUpdate: this.updateCameraTransition,
        onComplete: this.completeCameraTransition,
        onInterrupt: this.completeCameraTransition,
      });
      this.synchronizeActivityState();
    });
  }

  public resize(width?: number, height?: number): void {
    if (!this.renderer || !this.initialized) {
      return;
    }

    const measuredWidth = width ?? this.container.clientWidth;
    const measuredHeight = height ?? this.container.clientHeight;
    const effectiveWidth = measuredWidth > 0 ? measuredWidth : this.canvas.clientWidth;
    const effectiveHeight = measuredHeight > 0 ? measuredHeight : this.canvas.clientHeight;
    const nextWidth = Math.max(1, Math.floor(effectiveWidth));
    const nextHeight = Math.max(1, Math.floor(effectiveHeight));
    this.camera.aspect = nextWidth / nextHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(nextWidth, nextHeight, false);
    this.composer?.setSize(nextWidth, nextHeight);
    this.renderOnce();
  }

  public setPaused(paused: boolean): void {
    this.assertUsable();
    this.pausedByUser = paused;
    if (paused) {
      this.releaseActivePointer(true);
    }
    this.synchronizeActivityState();
  }

  public getCapabilities(): SceneCapabilities {
    return { ...this.capabilityState };
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    const reducedMotion = this.capabilityState.reducedMotion;
    this.stopAnimationLoop();
    this.finishCameraTransition();
    this.unbindEvents();
    this.cleanupGraphics();
    this.unlockedDestinations = [];
    this.pinNormals.length = 0;
    this.activeDestination = null;
    this.callbacks = {};
    this.initialized = false;
    this.contextLost = false;
    this.capabilityState = this.fallbackCapabilities(reducedMotion);

    this.canvas.hidden = this.initialCanvasHidden;
    this.fallback.hidden = this.initialFallbackHidden;
    if (this.initialFallbackAriaHidden === null) {
      this.fallback.removeAttribute('aria-hidden');
    } else {
      this.fallback.setAttribute('aria-hidden', this.initialFallbackAriaHidden);
    }
    if (this.insertedFallbackText) {
      this.fallback.textContent = '';
      this.insertedFallbackText = false;
    }
  }

  private createRenderer(): void {
    const antialias = this.qualityCeiling === 'high';
    this.shaderCompilationError = null;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias,
      alpha: false,
      depth: true,
      stencil: false,
      powerPreference: this.qualityCeiling === 'low' ? 'default' : 'high-performance',
      preserveDrawingBuffer: false,
    });

    const context = this.renderer.getContext();
    if (!context || context.isContextLost()) {
      throw new Error('WebGL context is unavailable.');
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = false;
    this.renderer.setClearColor(0x0b0c10, 1);
    this.renderer.debug.checkShaderErrors = true;
    this.renderer.debug.onShaderError = (gl, program, vertexShader, fragmentShader): void => {
      if (this.shaderCompilationError) {
        return;
      }
      const diagnostics = [
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertexShader),
        gl.getShaderInfoLog(fragmentShader),
      ].filter((entry): entry is string => Boolean(entry?.trim())).join(' ');
      this.shaderCompilationError = new Error(
        diagnostics.length > 0
          ? `WebGL shader compilation failed: ${diagnostics.slice(0, 600)}`
          : 'WebGL shader compilation failed.',
      );
    };
  }

  private configureScene(): void {
    this.scene.background = new THREE.Color(0x0b0c10);
    this.scene.fog = new THREE.FogExp2(0x0b0c10, 0.033);
    this.globeYaw = 0;
    this.globePitch = 0;
    this.pendingGlobeYaw = 0;
    this.pendingGlobePitch = 0;
    this.preferredCameraRadius = DEFAULT_CAMERA_RADIUS;
    this.applyGlobeOrientation();
    this.camera.position.set(0.18, 0.72, 6.16);
    this.camera.up.copy(WORLD_UP);
    this.cameraTarget.set(0, 0.02, 0);
    this.camera.lookAt(this.cameraTarget);
    this.scene.add(this.globeRoot, this.atmosphereRoot, this.armillaryRoot);
  }

  private buildSceneObjects(): void {
    this.buildGlobe();
    this.buildMistLayers();
    this.buildSpiritParticles();
    this.buildArmillaryLines();
    this.buildLandmarkPins();
  }

  private buildGlobe(): void {
    const segments: readonly [number, number] = this.qualityCeiling === 'high'
      ? [128, 96]
      : this.qualityCeiling === 'balanced'
        ? [96, 64]
        : [64, 48];
    const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, segments[0], segments[1]);
    this.globeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDisplacement: { value: this.qualityCeiling === 'low' ? 0.11 : 0.16 },
        uInkBloom: { value: 0 },
        uInkColor: { value: new THREE.Color(0x081114) },
        uMineralColor: { value: new THREE.Color(0x1e5f74) },
        uPaperColor: { value: new THREE.Color(0xe8dec8) },
        uGlowColor: { value: new THREE.Color(0x2d8f7b) },
      },
      vertexShader: mythicGlobeVertexShader,
      fragmentShader: mythicGlobeFragmentShader,
      depthWrite: true,
      depthTest: true,
    });
    this.globeMesh = new THREE.Mesh(geometry, this.globeMaterial);
    this.globeMesh.name = 'mythic-celestial-globe';
    this.globeMesh.renderOrder = 0;
    this.globeRoot.add(this.globeMesh);
  }

  private buildMistLayers(): void {
    const widthSegments = this.qualityCeiling === 'high' ? 80 : 56;
    const heightSegments = this.qualityCeiling === 'high' ? 56 : 40;
    this.mistGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, widthSegments, heightSegments);

    const layerSettings = [
      { scale: 1.045, speed: 0.022, opacity: 0.22, seed: 0.6, color: 0x83b9b0 },
      { scale: 1.088, speed: -0.014, opacity: 0.13, seed: 2.1, color: 0x658da4 },
    ] as const;

    for (const setting of layerSettings) {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: setting.speed },
          uMotion: { value: 1 },
          uOpacity: { value: setting.opacity },
          uSeed: { value: setting.seed },
          uMistColor: { value: new THREE.Color(setting.color) },
        },
        vertexShader: mistVertexShader,
        fragmentShader: mistFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending,
        side: THREE.FrontSide,
      });
      const mesh = new THREE.Mesh(this.mistGeometry, material);
      mesh.scale.setScalar(setting.scale);
      mesh.renderOrder = 2 + this.mistMeshes.length;
      mesh.frustumCulled = true;
      this.mistMaterials.push(material);
      this.mistMeshes.push(mesh);
      this.atmosphereRoot.add(mesh);
    }
  }

  private buildSpiritParticles(): void {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    const phases = new Float32Array(MAX_PARTICLES);
    const drifts = new Float32Array(MAX_PARTICLES);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    let randomState = 0x76_51_9d_23;
    const random = (): number => {
      randomState ^= randomState << 13;
      randomState ^= randomState >>> 17;
      randomState ^= randomState << 5;
      return (randomState >>> 0) / 4_294_967_296;
    };

    for (let index = 0; index < MAX_PARTICLES; index += 1) {
      const normalizedIndex = (index + 0.5) / MAX_PARTICLES;
      const y = 1 - normalizedIndex * 2;
      const horizontalRadius = Math.sqrt(Math.max(0, 1 - y * y));
      const angle = index * goldenAngle + random() * 0.34;
      const radius = 2.48 + Math.pow(random(), 1.7) * 2.25;
      const positionIndex = index * 3;
      positions[positionIndex] = Math.cos(angle) * horizontalRadius * radius;
      positions[positionIndex + 1] = y * radius;
      positions[positionIndex + 2] = Math.sin(angle) * horizontalRadius * radius;
      sizes[index] = 0.72 + random() * 1.55;
      phases[index] = random();
      drifts[index] = random();
    }

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.particleGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    this.particleGeometry.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 1));
    this.particleGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 5.2);

    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uMotion: { value: 1 },
        uFocus: { value: new THREE.Vector3(0.32, 0.45, 0.83).normalize() },
      },
      vertexShader: spiritParticleVertexShader,
      fragmentShader: spiritParticleFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      vertexColors: false,
    });
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particles.name = 'mythic-spirit-flow';
    this.particles.frustumCulled = false;
    this.particles.renderOrder = 5;
    this.scene.add(this.particles);
  }

  private buildArmillaryLines(): void {
    const segments = 128;
    const radius = 2.43;
    const ringCount = 3;
    const positions = new Float32Array(segments * ringCount * 2 * 3);
    let offset = 0;

    const writePoint = (ring: number, angle: number): void => {
      const cosine = Math.cos(angle) * radius;
      const sine = Math.sin(angle) * radius;
      if (ring === 0) {
        positions[offset] = cosine;
        positions[offset + 1] = sine;
        positions[offset + 2] = 0;
      } else if (ring === 1) {
        positions[offset] = cosine;
        positions[offset + 1] = 0;
        positions[offset + 2] = sine;
      } else {
        positions[offset] = cosine;
        positions[offset + 1] = sine * 0.58;
        positions[offset + 2] = sine * 0.815;
      }
      offset += 3;
    };

    for (let ring = 0; ring < ringCount; ring += 1) {
      for (let segment = 0; segment < segments; segment += 1) {
        writePoint(ring, (segment / segments) * Math.PI * 2);
        writePoint(ring, ((segment + 1) / segments) * Math.PI * 2);
      }
    }

    this.armillaryGeometry = new THREE.BufferGeometry();
    this.armillaryGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.armillaryMaterial = new THREE.LineBasicMaterial({
      color: 0xd8b96b,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.armillaryLines = new THREE.LineSegments(this.armillaryGeometry, this.armillaryMaterial);
    this.armillaryLines.renderOrder = 4;
    this.armillaryRoot.add(this.armillaryLines);
  }

  private buildLandmarkPins(): void {
    if (this.pinMesh) {
      this.globeRoot.remove(this.pinMesh);
      this.pinMesh.dispose();
      this.pinMesh.geometry.dispose();
      this.pinMesh.material.dispose();
      this.pinMesh = null;
    }
    this.pinNormals.length = 0;

    if (this.unlockedDestinations.length === 0) {
      return;
    }

    const geometry = new THREE.OctahedronGeometry(0.036, 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, this.unlockedDestinations.length);
    mesh.name = 'unlocked-landmark-pins';
    mesh.layers.enable(INTERACTION_LAYER);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.renderOrder = 6;

    for (let index = 0; index < this.unlockedDestinations.length; index += 1) {
      const destination = this.unlockedDestinations[index];
      if (!destination) {
        continue;
      }
      const normal = this.destinationDirection(destination, new THREE.Vector3());
      this.pinNormals.push(normal);
      this.writePinMatrix(mesh, index, normal, destination.id === this.activeDestination?.id);
      mesh.setColorAt(index, this.pinColor(destination, destination.id === this.activeDestination?.id));
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
      mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }
    mesh.computeBoundingSphere();
    this.pinMesh = mesh;
    this.globeRoot.add(mesh);
  }

  private createPostProcessing(): void {
    if (!this.renderer || this.qualityCeiling === 'low') {
      return;
    }
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.34, 0.76);
    this.composer.addPass(this.bloomPass);

    this.grainPass = new ShaderPass(filmGrainVignetteShader);
    this.composer.addPass(this.grainPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  private bindEvents(): void {
    this.hiddenByDocument = document.hidden;
    this.canvas.addEventListener('pointerdown', this.handlePointerDown, { passive: true });
    this.canvas.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    this.canvas.addEventListener('lostpointercapture', this.handleLostPointerCapture, { passive: true });
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('pointerup', this.handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', this.handlePointerCancel, { passive: true });
    window.addEventListener('blur', this.handleWindowBlur, { passive: true });
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.reducedMotionQuery?.addEventListener('change', this.handleReducedMotionChange);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.handleObservedResize);
      this.resizeObserver.observe(this.container);
    } else {
      window.addEventListener('resize', this.handleWindowResize, { passive: true });
    }
  }

  private unbindEvents(): void {
    this.releaseActivePointer(true);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('lostpointercapture', this.handleLostPointerCapture);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerCancel);
    window.removeEventListener('blur', this.handleWindowBlur);
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.reducedMotionQuery?.removeEventListener('change', this.handleReducedMotionChange);
    window.removeEventListener('resize', this.handleWindowResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.reducedMotionQuery = null;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.pointerId !== -1) {
      this.pointerDragged = true;
      return;
    }
    if (event.button !== 0 || !event.isPrimary || !this.canInteract()) {
      return;
    }
    try {
      this.canvas.focus({ preventScroll: true });
    } catch {
      this.canvas.focus();
    }
    this.pointerId = event.pointerId;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.pointerLastX = event.clientX;
    this.pointerLastY = event.clientY;
    const bounds = this.canvas.getBoundingClientRect();
    this.pointerYawScale = Math.PI * 1.1 / Math.max(bounds.width, 320);
    this.pointerPitchScale = Math.PI * 0.9 / Math.max(bounds.height, 240);
    this.pointerDragged = false;
    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional on older embedded browsers.
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    if (!this.canInteract() || (event.pointerType === 'mouse' && (event.buttons & 1) === 0)) {
      this.releaseActivePointer(true);
      return;
    }

    const deltaX = event.clientX - this.pointerLastX;
    const deltaY = event.clientY - this.pointerLastY;
    this.pointerLastX = event.clientX;
    this.pointerLastY = event.clientY;

    if (!this.pointerDragged) {
      const movedX = event.clientX - this.pointerStartX;
      const movedY = event.clientY - this.pointerStartY;
      if (movedX * movedX + movedY * movedY <= DRAG_THRESHOLD_SQUARED) {
        return;
      }
      this.pointerDragged = true;
    }

    this.rotateGlobe(deltaX * this.pointerYawScale, deltaY * this.pointerPitchScale);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    const wasDragged = this.pointerDragged;
    this.pointerId = -1;
    this.pointerDragged = false;
    this.releasePointerCaptureSafely(event.pointerId);
    const movedX = event.clientX - this.pointerStartX;
    const movedY = event.clientY - this.pointerStartY;
    if (wasDragged || movedX * movedX + movedY * movedY > DRAG_THRESHOLD_SQUARED || !this.canInteract()) {
      return;
    }
    this.selectPinAt(event.clientX, event.clientY);
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    if (event.pointerId === this.pointerId) {
      this.releaseActivePointer(true);
    }
  };

  private readonly handleLostPointerCapture = (event: PointerEvent): void => {
    if (event.pointerId === this.pointerId) {
      this.pointerId = -1;
      this.pointerDragged = false;
      this.discardPendingGlobeRotation();
    }
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    if (!this.canInteract() || event.deltaY === 0 || event.ctrlKey || event.metaKey) {
      return;
    }
    event.preventDefault();
    const deltaScale = event.deltaMode === 1
      ? 18
      : event.deltaMode === 2
        ? Math.max(this.canvas.clientHeight, 1)
        : 1;
    const deltaPixels = THREE.MathUtils.clamp(event.deltaY * deltaScale, -240, 240);
    this.finishCameraTransition();
    const currentRadius = Math.max(this.camera.position.length(), MIN_CAMERA_RADIUS);
    this.preferredCameraRadius = THREE.MathUtils.clamp(
      currentRadius * Math.exp(deltaPixels * 0.0012),
      MIN_CAMERA_RADIUS,
      MAX_CAMERA_RADIUS,
    );
    this.camera.position.setLength(this.preferredCameraRadius);
    this.camera.lookAt(this.cameraTarget);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.canInteract() || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    let yawDelta = 0;
    let pitchDelta = 0;
    switch (event.key) {
      case 'ArrowLeft':
        yawDelta = -KEYBOARD_ROTATION_STEP;
        break;
      case 'ArrowRight':
        yawDelta = KEYBOARD_ROTATION_STEP;
        break;
      case 'ArrowUp':
        pitchDelta = -KEYBOARD_ROTATION_STEP;
        break;
      case 'ArrowDown':
        pitchDelta = KEYBOARD_ROTATION_STEP;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!event.repeat) {
          const destination = this.findKeyboardTarget();
          if (destination) {
            this.activateDestination(destination);
          }
        }
        return;
      default:
        return;
    }

    event.preventDefault();
    this.rotateGlobe(yawDelta, pitchDelta);
  };

  private readonly handleWindowBlur = (): void => {
    this.releaseActivePointer(true);
  };

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.releaseActivePointer(true);
    this.contextLost = true;
    this.synchronizeActivityState();
    this.capabilityState = this.fallbackCapabilities();
    this.setFallbackVisible(true, '三维星图暂时失去连接，请稍后重试。');
    const capabilities = this.getCapabilities();
    this.invokeConsumerCallback('onCapabilitiesChange', () => this.callbacks.onCapabilitiesChange?.(capabilities));
    this.invokeConsumerCallback('onError', () => this.callbacks.onError?.(new Error('WebGL context was lost.')));
  };

  private readonly handleContextRestored = (): void => {
    if (this.disposed) {
      return;
    }
    this.contextLost = false;
    this.updateCapabilities();
    this.setFallbackVisible(false);
    this.resize();
    this.synchronizeActivityState();
  };

  private readonly handleVisibilityChange = (): void => {
    this.hiddenByDocument = document.hidden;
    if (this.hiddenByDocument) {
      this.releaseActivePointer(true);
    }
    this.synchronizeActivityState();
  };

  private readonly handleReducedMotionChange = (): void => {
    this.updateCapabilities();
    if (this.capabilityState.reducedMotion && this.activeDestination && this.cameraTween) {
      const destination = this.activeDestination;
      this.finishCameraTransition();
      this.positionCameraAtDestination(destination);
      this.renderOnce();
    }
  };

  private readonly handleObservedResize = (entries: readonly ResizeObserverEntry[]): void => {
    const entry = entries[0];
    if (!entry) {
      return;
    }
    this.resize(entry.contentRect.width, entry.contentRect.height);
  };

  private readonly handleWindowResize = (): void => {
    this.resize();
  };

  private readonly animate = (time: number): void => {
    this.animationFrame = 0;
    if (!this.shouldAnimate()) {
      return;
    }

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = time;
      this.lastRenderedTime = time;
    }
    const deltaMilliseconds = Math.min(time - this.lastFrameTime, 50);
    this.lastFrameTime = time;

    const minimumInterval = this.capabilityState.reducedMotion
      ? 50
      : this.capabilityState.quality === 'low'
        ? 32
        : 0;
    if (time - this.lastRenderedTime >= minimumInterval) {
      const renderDeltaMilliseconds = Math.min(time - this.lastRenderedTime, 50);
      this.lastRenderedTime = time;
      this.elapsedTime += renderDeltaMilliseconds * 0.001;
      this.updateScene(this.elapsedTime, renderDeltaMilliseconds * 0.001);
      this.renderFrame();
      this.samplePerformance(deltaMilliseconds);
    }

    this.animationFrame = window.requestAnimationFrame(this.animate);
  };

  private updateScene(elapsed: number, delta: number): void {
    const motion = this.capabilityState.reducedMotion ? 0.16 : 1;
    if (this.globeMaterial) {
      this.globeMaterial.uniforms.uTime!.value = elapsed * motion;
    }
    for (const material of this.mistMaterials) {
      material.uniforms.uTime!.value = elapsed * motion;
      material.uniforms.uMotion!.value = motion;
    }
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uTime!.value = elapsed;
      this.particleMaterial.uniforms.uMotion!.value = motion;
    }
    if (this.grainPass) {
      this.grainPass.uniforms.uTime!.value = elapsed;
    }

    this.applyPendingGlobeRotation();
    if (!this.activeDestination && !this.capabilityState.reducedMotion && !this.pointerDragged) {
      this.globeYaw = this.wrapYaw(this.globeYaw + delta * 0.006);
      this.applyGlobeOrientation();
    }
    this.atmosphereRoot.rotation.y += delta * 0.009 * motion;
    this.armillaryRoot.rotation.y -= delta * 0.018 * motion;
    this.armillaryRoot.rotation.z = Math.sin(elapsed * 0.08) * 0.045 * motion;
  }

  private renderFrame(): void {
    if (!this.renderer || this.contextLost) {
      return;
    }
    if (this.capabilityState.postProcessing && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private renderOnce(): void {
    if (!this.initialized || this.contextLost) {
      return;
    }
    this.updateScene(this.elapsedTime, 0);
    this.renderFrame();
  }

  private selectPinAt(clientX: number, clientY: number): void {
    if (!this.pinMesh || this.contextLost) {
      return;
    }
    const bounds = this.canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return;
    }
    this.pointerNdc.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.layers.set(INTERACTION_LAYER);
    this.camera.updateMatrixWorld();
    this.pinMesh.updateWorldMatrix(true, false);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const intersections = this.raycaster.intersectObject(this.pinMesh, false);
    const hit = intersections[0];
    if (!hit || hit.instanceId === undefined) {
      return;
    }
    const globeHit = this.raycaster.ray.intersectSphere(this.globeOccluder, this.scratchVectorA);
    if (globeHit && this.raycaster.ray.origin.distanceTo(globeHit) + 0.01 < hit.distance) {
      return;
    }

    const destination = this.unlockedDestinations[hit.instanceId];
    const localNormal = this.pinNormals[hit.instanceId];
    if (!destination || !localNormal) {
      return;
    }
    this.scratchVectorA.copy(localNormal).applyQuaternion(this.globeRoot.quaternion).normalize();
    this.scratchVectorB.copy(this.camera.position).normalize();
    if (this.scratchVectorA.dot(this.scratchVectorB) < 0.08) {
      return;
    }

    this.activateDestination(destination);
  }

  private findKeyboardTarget(): Destination | null {
    if (!this.pinMesh || this.unlockedDestinations.length === 0) {
      return null;
    }

    this.applyPendingGlobeRotation();
    this.camera.updateMatrixWorld();
    this.scratchVectorB.copy(this.camera.position).normalize();
    let bestIndex = -1;
    let bestDistanceSquared = KEYBOARD_TARGET_RADIUS_SQUARED;
    for (let index = 0; index < this.unlockedDestinations.length; index += 1) {
      const normal = this.pinNormals[index];
      if (!normal) {
        continue;
      }
      this.scratchVectorA.copy(normal).applyQuaternion(this.globeRoot.quaternion).normalize();
      if (this.scratchVectorA.dot(this.scratchVectorB) < 0.08) {
        continue;
      }
      this.scratchVectorA.multiplyScalar(GLOBE_RADIUS + 0.045).project(this.camera);
      if (
        this.scratchVectorA.z < -1
        || this.scratchVectorA.z > 1
        || Math.abs(this.scratchVectorA.x) > 1
        || Math.abs(this.scratchVectorA.y) > 1
      ) {
        continue;
      }
      const distanceSquared = this.scratchVectorA.x * this.scratchVectorA.x
        + this.scratchVectorA.y * this.scratchVectorA.y;
      if (distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        bestIndex = index;
      }
    }
    return bestIndex >= 0 ? this.unlockedDestinations[bestIndex] ?? null : null;
  }

  private activateDestination(destination: Destination): void {
    const unlockedDestination = this.requireUnlockedDestination(destination);
    void this.transitionTo(unlockedDestination);
    this.invokeConsumerCallback(
      'onDestinationSelect',
      () => this.callbacks.onDestinationSelect?.(unlockedDestination),
    );
  }

  private rotateGlobe(yawDelta: number, pitchDelta: number): void {
    if (!this.canInteract()) {
      return;
    }
    this.finishCameraTransition();
    this.pendingGlobeYaw += yawDelta;
    this.pendingGlobePitch += pitchDelta;
  }

  private applyPendingGlobeRotation(): void {
    if (this.pendingGlobeYaw === 0 && this.pendingGlobePitch === 0) {
      return;
    }
    this.globeYaw = this.wrapYaw(this.globeYaw + this.pendingGlobeYaw);
    this.globePitch = THREE.MathUtils.clamp(
      this.globePitch + this.pendingGlobePitch,
      -MAX_GLOBE_PITCH,
      MAX_GLOBE_PITCH,
    );
    this.pendingGlobeYaw = 0;
    this.pendingGlobePitch = 0;
    this.applyGlobeOrientation();
  }

  private discardPendingGlobeRotation(): void {
    this.pendingGlobeYaw = 0;
    this.pendingGlobePitch = 0;
  }

  private applyGlobeOrientation(): void {
    this.globeRoot.quaternion.setFromAxisAngle(WORLD_UP, this.globeYaw);
    this.globePitchQuaternion.setFromAxisAngle(WORLD_RIGHT, this.globePitch);
    this.globeRoot.quaternion.multiply(this.globePitchQuaternion);
    if (this.activeDestination) {
      this.setParticleFocus(this.activeDestination);
    }
  }

  private wrapYaw(yaw: number): number {
    return THREE.MathUtils.euclideanModulo(yaw + Math.PI, Math.PI * 2) - Math.PI;
  }

  private applyDestinationImmediately(destination: Destination): Promise<void> {
    this.assertUsable();
    this.releaseActivePointer();
    this.applyPendingGlobeRotation();
    this.finishCameraTransition();
    this.activeDestination = destination;
    this.applyDestinationTheme(destination);
    this.setParticleFocus(destination);
    this.refreshPinColors();
    if (this.initialized) {
      this.positionCameraAtDestination(destination);
      this.renderOnce();
    }
    return Promise.resolve();
  }

  private applyDestinationTheme(destination: Destination): void {
    if (!this.globeMaterial) {
      return;
    }
    this.setColorSafely(this.globeMaterial.uniforms.uMineralColor!.value as THREE.Color, destination.colorTheme.primary, 0x1e5f74);
    this.setColorSafely(this.globeMaterial.uniforms.uPaperColor!.value as THREE.Color, destination.colorTheme.accent, 0xe8dec8);
    this.setColorSafely(this.globeMaterial.uniforms.uGlowColor!.value as THREE.Color, destination.colorTheme.glow, 0x2d8f7b);

    for (let index = 0; index < this.mistMaterials.length; index += 1) {
      const material = this.mistMaterials[index];
      if (!material) {
        continue;
      }
      const color = material.uniforms.uMistColor!.value as THREE.Color;
      this.setColorSafely(color, index === 0 ? destination.colorTheme.glow : destination.colorTheme.primary, 0x658da4);
      color.lerp(new THREE.Color(0xd7e5dc), index === 0 ? 0.28 : 0.12);
    }
  }

  private setParticleFocus(destination: Destination): void {
    if (!this.particleMaterial) {
      return;
    }
    const focus = this.particleMaterial.uniforms.uFocus!.value as THREE.Vector3;
    this.destinationDirection(destination, focus).applyQuaternion(this.globeRoot.quaternion).normalize();
  }

  private refreshPinColors(): void {
    if (!this.pinMesh) {
      return;
    }
    for (let index = 0; index < this.unlockedDestinations.length; index += 1) {
      const destination = this.unlockedDestinations[index];
      if (!destination) {
        continue;
      }
      const active = destination.id === this.activeDestination?.id;
      const normal = this.pinNormals[index];
      if (normal) {
        this.writePinMatrix(this.pinMesh, index, normal, active);
      }
      this.pinMesh.setColorAt(index, this.pinColor(destination, active));
    }
    this.pinMesh.instanceMatrix.needsUpdate = true;
    if (this.pinMesh.instanceColor) {
      this.pinMesh.instanceColor.needsUpdate = true;
    }
  }

  private pinColor(destination: Destination, active: boolean): THREE.Color {
    this.setColorSafely(this.scratchColor, active ? destination.colorTheme.glow : '#b63225', 0xb63225);
    return this.scratchColor.multiplyScalar(active ? 2.1 : 0.68);
  }

  private writePinMatrix(
    mesh: THREE.InstancedMesh<THREE.OctahedronGeometry, THREE.MeshBasicMaterial>,
    index: number,
    normal: THREE.Vector3,
    active: boolean,
  ): void {
    this.instanceObject.position.copy(normal).multiplyScalar(GLOBE_RADIUS + 0.045);
    this.instanceObject.quaternion.setFromUnitVectors(WORLD_UP, normal);
    this.instanceObject.scale.set(active ? 0.84 : 0.62, active ? 1.55 : 1.18, active ? 0.84 : 0.62);
    this.instanceObject.updateMatrix();
    mesh.setMatrixAt(index, this.instanceObject.matrix);
  }

  private prepareCameraTransition(destination: Destination): void {
    this.startCameraRadius = Math.max(this.camera.position.length(), 0.001);
    this.endCameraRadius = this.preferredCameraRadius;
    this.startCameraDirection.copy(this.camera.position).normalize();
    this.destinationDirection(destination, this.endCameraDirection).applyQuaternion(this.globeRoot.quaternion).normalize();

    this.scratchVectorA.copy(WORLD_UP);
    if (Math.abs(this.scratchVectorA.dot(this.endCameraDirection)) > 0.9) {
      this.scratchVectorA.copy(WORLD_RIGHT);
    }
    this.scratchVectorB.crossVectors(this.endCameraDirection, this.scratchVectorA).normalize();
    this.endCameraDirection.addScaledVector(this.scratchVectorB, 0.075).normalize();
    this.sweepQuaternion.setFromUnitVectors(this.startCameraDirection, this.endCameraDirection);

    this.startCameraTarget.copy(this.cameraTarget);
    this.endCameraTarget.copy(this.endCameraDirection).multiplyScalar(0.24);
    this.startCameraUp.copy(this.camera.up).normalize();
    this.computeStableCameraUp(this.endCameraDirection, this.endCameraUp);
    if (this.startCameraUp.dot(this.endCameraUp) < 0) {
      this.endCameraUp.negate();
    }
  }

  private readonly updateCameraTransition = (): void => {
    const progress = this.transitionState.progress;
    this.transitionQuaternion.slerpQuaternions(IDENTITY_QUATERNION, this.sweepQuaternion, progress);
    const radius = THREE.MathUtils.lerp(this.startCameraRadius, this.endCameraRadius, progress);
    this.camera.position.copy(this.startCameraDirection).applyQuaternion(this.transitionQuaternion).multiplyScalar(radius);
    this.cameraTarget.lerpVectors(this.startCameraTarget, this.endCameraTarget, progress);
    this.camera.up.lerpVectors(this.startCameraUp, this.endCameraUp, progress);
    if (this.camera.up.lengthSq() < 0.0001) {
      this.camera.up.copy(this.endCameraUp);
    }
    this.camera.up.normalize();
    this.camera.lookAt(this.cameraTarget);
    if (this.globeMaterial) {
      this.globeMaterial.uniforms.uInkBloom!.value = Math.sin(progress * Math.PI);
    }
    if (this.pausedByUser || this.hiddenByDocument) {
      this.renderOnce();
    }
  };

  private readonly completeCameraTransition = (): void => {
    if (this.globeMaterial) {
      this.globeMaterial.uniforms.uInkBloom!.value = 0;
    }
    this.cameraTween = null;
    const resolve = this.transitionResolve;
    this.transitionResolve = null;
    resolve?.();
  };

  private finishCameraTransition(): void {
    const tween = this.cameraTween;
    this.cameraTween = null;
    if (tween) {
      tween.kill();
    }
    if (this.globeMaterial) {
      this.globeMaterial.uniforms.uInkBloom!.value = 0;
    }
    const resolve = this.transitionResolve;
    this.transitionResolve = null;
    resolve?.();
  }

  private positionCameraAtDestination(destination: Destination): void {
    this.destinationDirection(destination, this.endCameraDirection).applyQuaternion(this.globeRoot.quaternion).normalize();
    this.scratchVectorA.copy(WORLD_UP);
    if (Math.abs(this.scratchVectorA.dot(this.endCameraDirection)) > 0.9) {
      this.scratchVectorA.copy(WORLD_RIGHT);
    }
    this.scratchVectorB.crossVectors(this.endCameraDirection, this.scratchVectorA).normalize();
    this.endCameraDirection.addScaledVector(this.scratchVectorB, 0.075).normalize();
    this.camera.position.copy(this.endCameraDirection).multiplyScalar(this.preferredCameraRadius);
    this.cameraTarget.copy(this.endCameraDirection).multiplyScalar(0.24);
    this.computeStableCameraUp(this.endCameraDirection, this.camera.up);
    this.camera.lookAt(this.cameraTarget);
  }

  private computeStableCameraUp(viewDirection: THREE.Vector3, target: THREE.Vector3): void {
    target.copy(WORLD_UP).addScaledVector(viewDirection, -WORLD_UP.dot(viewDirection));
    if (target.lengthSq() < 0.01) {
      target.copy(WORLD_RIGHT).addScaledVector(viewDirection, -WORLD_RIGHT.dot(viewDirection));
    }
    target.normalize();
  }

  private destinationDirection(destination: Destination, target: THREE.Vector3): THREE.Vector3 {
    this.validateDestination(destination);
    const latitude = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(destination.coordinates.lat, -90, 90));
    const wrappedLongitude = ((destination.coordinates.lng % 360) + 540) % 360 - 180;
    const longitude = THREE.MathUtils.degToRad(wrappedLongitude);
    const cosLatitude = Math.cos(latitude);
    return target.set(
      cosLatitude * Math.sin(longitude),
      Math.sin(latitude),
      cosLatitude * Math.cos(longitude),
    ).normalize();
  }

  private detectQualityCeiling(): RenderQuality {
    const navigatorHints = navigator as NavigatorHints;
    const cores = Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency > 0
      ? navigator.hardwareConcurrency
      : null;
    const memory = Number.isFinite(navigatorHints.deviceMemory) && (navigatorHints.deviceMemory ?? 0) > 0
      ? navigatorHints.deviceMemory ?? null
      : null;
    const saveData = navigatorHints.connection?.saveData === true;
    const coarsePointer = typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false;

    if (saveData || (cores !== null && cores <= 2) || (memory !== null && memory <= 2)) {
      return 'low';
    }
    if ((cores !== null && cores <= 4) || (memory !== null && memory <= 4) || coarsePointer) {
      return 'balanced';
    }
    return 'high';
  }

  private refineQualityFromRenderer(): void {
    if (!this.renderer) {
      return;
    }
    if (this.renderer.capabilities.maxTextureSize <= 4_096) {
      this.qualityCeiling = 'low';
    } else if (this.renderer.capabilities.maxTextureSize <= 8_192 && this.qualityCeiling === 'high') {
      this.qualityCeiling = 'balanced';
    }
    this.runtimeQuality = this.qualityCeiling;
  }

  private updateCapabilities(notify = true): void {
    if (this.contextLost || !this.renderer) {
      this.capabilityState = this.fallbackCapabilities();
      if (notify) {
        const capabilities = this.getCapabilities();
        this.invokeConsumerCallback('onCapabilitiesChange', () => this.callbacks.onCapabilitiesChange?.(capabilities));
      }
      return;
    }

    const reducedMotion = this.reducedMotionQuery?.matches ?? false;
    const quality: RenderQuality = reducedMotion ? 'low' : this.runtimeQuality;
    const deviceRatio = Math.max(window.devicePixelRatio || 1, 1);
    const pixelRatio = Math.min(deviceRatio, quality === 'high' ? 1.75 : quality === 'balanced' ? 1.35 : 1);
    const particleCount = quality === 'high' ? HIGH_PARTICLES : quality === 'balanced' ? BALANCED_PARTICLES : LOW_PARTICLES;
    const postProcessing = quality !== 'low' && this.composer !== null;
    this.capabilityState = { quality, pixelRatio, particleCount, postProcessing, reducedMotion };

    this.renderer.setPixelRatio(pixelRatio);
    this.composer?.setPixelRatio(pixelRatio);
    this.particleGeometry?.setDrawRange(0, particleCount);
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uPixelRatio!.value = pixelRatio;
    }
    if (this.bloomPass) {
      this.bloomPass.enabled = postProcessing;
      this.bloomPass.strength = quality === 'high' ? 0.42 : 0.29;
      this.bloomPass.radius = quality === 'high' ? 0.34 : 0.24;
      this.bloomPass.threshold = quality === 'high' ? 0.76 : 0.82;
    }
    if (this.grainPass) {
      this.grainPass.enabled = postProcessing;
      this.grainPass.uniforms.uGrainAmount!.value = quality === 'high' ? 0.034 : 0.024;
      this.grainPass.uniforms.uVignette!.value = quality === 'high' ? 0.42 : 0.35;
    }
    const secondMistLayer = this.mistMeshes[1];
    if (secondMistLayer) {
      secondMistLayer.visible = quality !== 'low';
    }
    const firstMistLayer = this.mistMeshes[0];
    if (firstMistLayer) {
      firstMistLayer.visible = true;
    }

    if (this.initialized) {
      this.resize();
    }
    if (notify) {
      const capabilities = this.getCapabilities();
      this.invokeConsumerCallback('onCapabilitiesChange', () => this.callbacks.onCapabilitiesChange?.(capabilities));
    }
  }

  private samplePerformance(deltaMilliseconds: number): void {
    if (this.capabilityState.reducedMotion || this.runtimeQuality === 'low') {
      return;
    }
    this.sampledFrameTime += deltaMilliseconds;
    this.sampledFrames += 1;
    if (this.sampledFrames < 120) {
      return;
    }

    const average = this.sampledFrameTime / this.sampledFrames;
    this.sampledFrameTime = 0;
    this.sampledFrames = 0;
    if (average > 25 && this.runtimeQuality === 'high') {
      this.runtimeQuality = 'balanced';
      this.updateCapabilities();
    } else if (average > 31 && this.runtimeQuality === 'balanced') {
      this.runtimeQuality = 'low';
      this.updateCapabilities();
    }
  }

  private fallbackCapabilities(reducedMotion = this.reducedMotionQuery?.matches ?? false): SceneCapabilities {
    return {
      quality: 'fallback',
      pixelRatio: 1,
      particleCount: 0,
      postProcessing: false,
      reducedMotion,
    };
  }

  private startAnimationLoop(): void {
    if (!this.shouldAnimate() || this.animationFrame !== 0) {
      return;
    }
    this.lastFrameTime = 0;
    this.animationFrame = window.requestAnimationFrame(this.animate);
  }

  private synchronizeActivityState(): void {
    const canRun = this.initialized
      && !this.disposed
      && !this.pausedByUser
      && !this.hiddenByDocument
      && !this.contextLost;
    if (canRun) {
      this.cameraTween?.resume();
      this.startAnimationLoop();
    } else {
      this.cameraTween?.pause();
      this.stopAnimationLoop();
    }
  }

  private stopAnimationLoop(): void {
    if (this.animationFrame !== 0) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
    this.lastFrameTime = 0;
  }

  private releaseActivePointer(discardPendingRotation = false): void {
    const activePointerId = this.pointerId;
    this.pointerId = -1;
    this.pointerDragged = false;
    if (discardPendingRotation) {
      this.discardPendingGlobeRotation();
    }
    if (activePointerId >= 0) {
      this.releasePointerCaptureSafely(activePointerId);
    }
  }

  private releasePointerCaptureSafely(pointerId: number): void {
    try {
      if (this.canvas.hasPointerCapture(pointerId)) {
        this.canvas.releasePointerCapture(pointerId);
      }
    } catch {
      // Pointer capture may already have been released by the browser.
    }
  }

  private shouldAnimate(): boolean {
    return this.initialized
      && !this.disposed
      && !this.pausedByUser
      && !this.hiddenByDocument
      && !this.contextLost
      && this.renderer !== null;
  }

  private canInteract(): boolean {
    return this.shouldAnimate() && this.capabilityState.quality !== 'fallback';
  }

  private setFallbackVisible(visible: boolean, message?: string): void {
    this.canvas.hidden = visible;
    this.fallback.hidden = !visible;
    this.fallback.setAttribute('aria-hidden', visible ? 'false' : 'true');
    if (visible && message && this.fallback.textContent?.trim().length === 0) {
      this.fallback.textContent = message;
      this.insertedFallbackText = true;
    }
  }

  private cleanupGraphics(): void {
    if (this.pinMesh) {
      this.pinMesh.dispose();
      this.pinMesh.geometry.dispose();
      this.pinMesh.material.dispose();
      this.pinMesh = null;
    }
    this.globeMesh?.geometry.dispose();
    this.globeMaterial?.dispose();
    this.globeMesh = null;
    this.globeMaterial = null;

    this.mistGeometry?.dispose();
    for (const material of this.mistMaterials) {
      material.dispose();
    }
    this.mistGeometry = null;
    this.mistMaterials.length = 0;
    this.mistMeshes.length = 0;

    this.particleGeometry?.dispose();
    this.particleMaterial?.dispose();
    this.particleGeometry = null;
    this.particleMaterial = null;
    this.particles = null;

    this.armillaryGeometry?.dispose();
    this.armillaryMaterial?.dispose();
    this.armillaryGeometry = null;
    this.armillaryMaterial = null;
    this.armillaryLines = null;

    this.bloomPass?.dispose();
    this.grainPass?.dispose();
    this.outputPass?.dispose();
    this.composer?.dispose();
    this.bloomPass = null;
    this.grainPass = null;
    this.outputPass = null;
    this.renderPass = null;
    this.composer = null;

    if (this.renderer) {
      this.renderer.debug.onShaderError = null;
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer = null;
    }
    this.shaderCompilationError = null;

    this.globeRoot.clear();
    this.atmosphereRoot.clear();
    this.armillaryRoot.clear();
    this.scene.clear();
    this.pointerDragged = false;
    this.globeYaw = 0;
    this.globePitch = 0;
    this.pendingGlobeYaw = 0;
    this.pendingGlobePitch = 0;
    this.preferredCameraRadius = DEFAULT_CAMERA_RADIUS;
    this.globeRoot.quaternion.identity();
  }

  private uniqueDestinations(destinations: readonly Destination[]): Destination[] {
    const seen = new Set<string>();
    const unique: Destination[] = [];
    for (const destination of destinations) {
      this.validateDestination(destination);
      if (!seen.has(destination.id)) {
        seen.add(destination.id);
        unique.push(destination);
      }
    }
    return unique;
  }

  private setColorSafely(target: THREE.Color, value: string, fallback: THREE.ColorRepresentation): void {
    target.set(fallback);
    try {
      target.set(value);
    } catch {
      // The fallback is already installed because Color.setStyle can fail silently.
    }
  }

  private validateDestination(destination: Destination): void {
    if (destination.id.trim().length === 0) {
      throw new RangeError('Destination id must not be empty.');
    }
    if (!Number.isFinite(destination.coordinates.lat) || !Number.isFinite(destination.coordinates.lng)) {
      throw new RangeError(`Destination coordinates are invalid for ${destination.id}.`);
    }
  }

  private requireUnlockedDestination(destination: Destination): Destination {
    this.validateDestination(destination);
    const unlockedDestination = this.unlockedDestinations.find(({ id }) => id === destination.id);
    if (!unlockedDestination) {
      throw new RangeError(`Destination ${destination.id} is not unlocked.`);
    }
    return unlockedDestination;
  }

  private invokeConsumerCallback(name: string, callback: () => void): void {
    try {
      callback();
    } catch (reason: unknown) {
      console.error(`MythicGlobe ${name} callback failed.`, reason);
    }
  }

  private assertUsable(): void {
    if (this.disposed) {
      throw new Error('MythicGlobe has already been disposed.');
    }
  }
}

export default MythicGlobe;
