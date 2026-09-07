import * as THREE from 'three';

export interface CalligraphyWriteTarget {
  element: HTMLElement;
  char: string;
  index: number;
  lineIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CalligraphyWriteCallbacks {
  onCharacterStart?: (target: CalligraphyWriteTarget, index: number, total: number) => void;
  onCharacterProgress?: (target: CalligraphyWriteTarget, progress: number) => void;
  onCharacterComplete?: (target: CalligraphyWriteTarget, index: number, total: number) => void;
  onComplete?: () => void;
}

export interface CalligraphyWriteOptions {
  introDuration?: number;
  charDuration?: number;
  interCharPause?: number;
  linePause?: number;
}

interface StrokePlan {
  points: THREE.Vector3[];
  length: number;
  radius: number;
}

interface CharacterPlan {
  target: CalligraphyWriteTarget;
  strokes: StrokePlan[];
  start: number;
  end: number;
  startPoint: THREE.Vector3;
  endPoint: THREE.Vector3;
}

interface BrushSample {
  point: THREE.Vector3;
  tangent: THREE.Vector3;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * 仙咏集的唯一书写动效主人。
 *
 * 这个类不是“毛笔贴图”或“光标跟随器”：它同时管理 3D 笔体、落纸接触、湿墨
 * TubeGeometry、逐字时间轴和完整的取消/完成生命周期。DOM 字符只承载语义与可读
 * 文字，不能再独立伪造一套书写动画。
 */
export class ThreeDCalligraphyBrushEngine {
  private readonly container: HTMLElement;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly brushGroup: THREE.Group;
  private readonly strokeGroup: THREE.Group;
  private readonly inkMaterial: THREE.MeshStandardMaterial;
  private readonly wetInkMaterial: THREE.MeshBasicMaterial;
  private readonly contactShadow: THREE.Mesh;
  private readonly contactInk: THREE.Mesh;
  private readonly light: THREE.PointLight;
  private tipMesh: THREE.Mesh | null = null;
  private bristleMesh: THREE.Mesh | null = null;
  private currentInk: THREE.Group | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private animationId: number | null = null;

  private isRunning = false;
  private schedule: CharacterPlan[] = [];
  private callbacks: CalligraphyWriteCallbacks = {};
  private options: Required<CalligraphyWriteOptions> = {
    introDuration: 520,
    charDuration: 320,
    interCharPause: 72,
    linePause: 280
  };
  private startedAt = 0;
  private totalDuration = 0;
  private activePlanIndex = -1;
  private activeStrokeCount = 0;
  private completedCharacterIndices = new Set<number>();

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();

    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width || 440);
    const height = Math.max(1, rect.height || 320);

    this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 14);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(width, height, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.className = 'three-calligraphy-brush-canvas';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    Object.assign(this.renderer.domElement.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '8',
      opacity: '0'
    });
    this.container.appendChild(this.renderer.domElement);

    // 天青冷光负责纸面反射，暖色点光只负责提示湿墨，不再使用金粉粒子制造焦点。
    const hemisphere = new THREE.HemisphereLight(0xc8dfd7, 0x12211e, 1.35);
    this.scene.add(hemisphere);

    const keyLight = new THREE.DirectionalLight(0xe9d7bd, 1.85);
    keyLight.position.set(-3, 6, 8);
    this.scene.add(keyLight);

    this.light = new THREE.PointLight(0xd4a779, 0.85, 5.5);
    this.scene.add(this.light);

    this.inkMaterial = new THREE.MeshStandardMaterial({
      color: 0x18201e,
      roughness: 0.42,
      metalness: 0.02,
      transparent: true,
      opacity: 0.83,
      depthWrite: false
    });
    this.wetInkMaterial = new THREE.MeshBasicMaterial({
      color: 0xa4c8ba,
      transparent: true,
      opacity: 0.27,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.strokeGroup = new THREE.Group();
    this.strokeGroup.position.z = 0.03;
    this.scene.add(this.strokeGroup);

    this.brushGroup = this.buildRealisticBrush3D();
    this.brushGroup.visible = false;
    this.scene.add(this.brushGroup);

    this.contactShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.46, 32),
      new THREE.MeshBasicMaterial({
        color: 0x061311,
        transparent: true,
        opacity: 0.22,
        depthWrite: false
      })
    );
    this.contactShadow.position.z = -0.08;
    this.contactShadow.visible = false;
    this.scene.add(this.contactShadow);

    this.contactInk = new THREE.Mesh(
      new THREE.CircleGeometry(0.13, 24),
      new THREE.MeshBasicMaterial({
        color: 0x151e1b,
        transparent: true,
        opacity: 0.64,
        depthWrite: false
      })
    );
    this.contactInk.position.z = 0.18;
    this.contactInk.visible = false;
    this.scene.add(this.contactInk);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.container);
    }

    this.resize();
  }

  /** 构造可见杆、笔箍、兼毫笔锋与蘸墨笔尖，局部原点就是落纸点。 */
  private buildRealisticBrush3D(): THREE.Group {
    const group = new THREE.Group();
    // 真实笔体按诗笺字高缩放，保持完整笔杆进入视野但不遮盖诗句。
    group.scale.setScalar(0.175);

    const shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x3c2417,
      roughness: 0.3,
      metalness: 0.12
    });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.145, 4.15, 24), shaftMaterial);
    shaft.position.y = 2.55;
    group.add(shaft);

    const shaftHighlight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.04, 3.75, 12),
      new THREE.MeshBasicMaterial({ color: 0xb0835d, transparent: true, opacity: 0.28 })
    );
    shaftHighlight.position.set(-0.045, 2.55, 0.105);
    group.add(shaftHighlight);

    const jadeCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 18, 14),
      new THREE.MeshStandardMaterial({ color: 0x6f9b8b, roughness: 0.19, metalness: 0.22 })
    );
    jadeCap.position.y = 4.73;
    group.add(jadeCap);

    const ferrule = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.13, 0.48, 24),
      new THREE.MeshStandardMaterial({ color: 0x80694b, roughness: 0.27, metalness: 0.7 })
    );
    ferrule.position.y = 0.93;
    group.add(ferrule);

    const bristleGeometry = new THREE.ConeGeometry(0.17, 1.02, 20, 2);
    bristleGeometry.rotateX(Math.PI);
    bristleGeometry.translate(0, 0.51, 0);
    this.bristleMesh = new THREE.Mesh(
      bristleGeometry,
      new THREE.MeshStandardMaterial({ color: 0x111715, roughness: 0.86, metalness: 0.01 })
    );
    group.add(this.bristleMesh);

    const innerBristleGeometry = new THREE.ConeGeometry(0.075, 0.72, 14, 2);
    innerBristleGeometry.rotateX(Math.PI);
    innerBristleGeometry.translate(0, 0.36, 0.02);
    this.tipMesh = new THREE.Mesh(
      innerBristleGeometry,
      new THREE.MeshStandardMaterial({ color: 0x283b32, roughness: 0.7, metalness: 0.01 })
    );
    group.add(this.tipMesh);

    // 初始为自然悬腕姿态；每帧再依据运笔切线调整 Z 轴方向和提按角。
    group.rotation.x = 0.34;
    group.rotation.y = -0.16;
    group.rotation.z = -0.42;
    return group;
  }

  public resize(): void {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 440;
    const height = rect.height || 320;
    if (width <= 0 || height <= 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(width, height, false);
  }

  /** 像素坐标与诗笺 WebGL 平面的投影换算。 */
  private pixelToWorld(x: number, y: number, z = 0.05): THREE.Vector3 {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 440;
    const height = rect.height || 320;
    const ndcX = (x / width) * 2 - 1;
    const ndcY = -(y / height) * 2 + 1;
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const visibleHeight = 2 * Math.tan(verticalFov / 2) * this.camera.position.z;
    const visibleWidth = visibleHeight * this.camera.aspect;
    return new THREE.Vector3(
      (ndcX * visibleWidth) / 2,
      (ndcY * visibleHeight) / 2,
      z
    );
  }

  private pixelWidthToWorld(px: number): number {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 440;
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const visibleHeight = 2 * Math.tan(verticalFov / 2) * this.camera.position.z;
    const visibleWidth = visibleHeight * this.camera.aspect;
    return (px / width) * visibleWidth;
  }

  private hashCharacter(target: CalligraphyWriteTarget): number {
    let hash = target.index * 131 + target.lineIndex * 17;
    for (const char of target.char) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    return Math.abs(hash);
  }

  /**
   * 为每个字生成一组有起、行、收的短笔势。
   * 这些笔势是视觉运动路径，不冒充字体文件中的真实笔顺；真正的字形仍由 DOM
   * 承载，路径负责让毛笔在字框内以提按、顿挫和收锋的方式把它“写出来”。
   */
  private createStrokePlan(target: CalligraphyWriteTarget): StrokePlan[] {
    const hash = this.hashCharacter(target);
    const width = Math.max(target.width, 12);
    const height = Math.max(target.height, 15);
    const drift = ((hash % 9) - 4) / 100;
    const depth = 0.07;
    const point = (nx: number, ny: number): THREE.Vector3 => {
      const adjustedX = Math.min(0.9, Math.max(0.1, nx + drift));
      const adjustedY = Math.min(0.9, Math.max(0.1, ny - drift * 0.6));
      return this.pixelToWorld(
        target.x + width * adjustedX,
        target.y + height * adjustedY,
        depth
      );
    };

    const patterns: Array<Array<[number, number]>> = [
      [[0.16, 0.25], [0.35, 0.21], [0.60, 0.23], [0.84, 0.28]],
      [[0.53, 0.15], [0.52, 0.36], [0.50, 0.60], [0.48, 0.85]],
      [[0.18, 0.62], [0.35, 0.53], [0.58, 0.57], [0.82, 0.76]],
      hash % 2 === 0
        ? [[0.76, 0.17], [0.65, 0.36], [0.51, 0.57], [0.29, 0.82]]
        : [[0.24, 0.78], [0.39, 0.67], [0.63, 0.43], [0.79, 0.22]]
    ];

    const baseRadius = this.pixelWidthToWorld(Math.max(1.3, Math.min(2.5, Math.min(width, height) * 0.088)));
    return patterns.map((pattern, strokeIndex) => {
      const points = pattern.map(([nx, ny], pointIndex) => {
        const pointJitter = ((hash + strokeIndex * 11 + pointIndex * 7) % 5 - 2) / 100;
        return point(nx + pointJitter, ny - pointJitter * 0.5);
      });
      return {
        points,
        length: this.polylineLength(points),
        radius: baseRadius * (strokeIndex === 1 ? 1.08 : 0.92 + ((hash % 3) * 0.05))
      };
    });
  }

  private polylineLength(points: THREE.Vector3[]): number {
    let length = 0;
    for (let index = 1; index < points.length; index += 1) {
      length += points[index - 1].distanceTo(points[index]);
    }
    return Math.max(length, 0.0001);
  }

  private buildSchedule(targets: CalligraphyWriteTarget[]): void {
    let cursor = this.options.introDuration;
    this.schedule = targets.map((target, index) => {
      const strokes = this.createStrokePlan(target);
      const start = cursor;
      const end = start + this.options.charDuration;
      const nextTarget = targets[index + 1];
      cursor = end + (nextTarget
        ? (nextTarget.lineIndex !== target.lineIndex ? this.options.linePause : this.options.interCharPause)
        : 0);

      return {
        target,
        strokes,
        start,
        end,
        startPoint: strokes[0].points[0].clone(),
        endPoint: strokes[strokes.length - 1].points[strokes[strokes.length - 1].points.length - 1].clone()
      };
    });
    this.totalDuration = cursor;
  }

  private disposeGeometry(object: THREE.Object3D): void {
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
  }

  private clearInk(): void {
    this.clearCurrentInk();
    for (const child of [...this.strokeGroup.children]) {
      this.disposeGeometry(child);
      this.strokeGroup.remove(child);
    }
    this.activeStrokeCount = 0;
    this.activePlanIndex = -1;
  }

  private clearCurrentInk(): void {
    if (!this.currentInk) return;
    this.disposeGeometry(this.currentInk);
    this.strokeGroup.remove(this.currentInk);
    this.currentInk = null;
  }

  private createStrokeObject(points: THREE.Vector3[], radius: number): THREE.Group {
    const group = new THREE.Group();
    const safePoints = points.length > 1
      ? points
      : [points[0], points[0].clone().add(new THREE.Vector3(0.001, 0.001, 0))];
    const curve = new THREE.CatmullRomCurve3(safePoints, false, 'centripetal', 0.24);
    const geometry = new THREE.TubeGeometry(curve, Math.max(8, safePoints.length * 3), radius, 6, false);
    group.add(new THREE.Mesh(geometry, this.inkMaterial));

    const sheenGeometry = new THREE.BufferGeometry().setFromPoints(safePoints);
    const sheen = new THREE.Line(sheenGeometry, this.wetInkMaterial);
    sheen.position.z = 0.045;
    group.add(sheen);
    return group;
  }

  private strokeWeights(plan: CharacterPlan): number[] {
    const total = plan.strokes.reduce((sum, stroke) => sum + stroke.length, 0);
    return plan.strokes.map((stroke) => stroke.length / total);
  }

  private slicePolyline(points: THREE.Vector3[], progress: number): THREE.Vector3[] {
    const clamped = clamp01(progress);
    const result = [points[0].clone()];
    if (clamped <= 0) {
      result.push(points[0].clone().lerp(points[1], 0.001));
      return result;
    }

    const segmentLengths = points.slice(1).map((point, index) => point.distanceTo(points[index]));
    const totalLength = segmentLengths.reduce((sum, value) => sum + value, 0) || 1;
    let distance = totalLength * clamped;

    for (let index = 1; index < points.length; index += 1) {
      const segmentLength = segmentLengths[index - 1];
      if (distance >= segmentLength) {
        result.push(points[index].clone());
        distance -= segmentLength;
        continue;
      }
      const segmentProgress = segmentLength ? distance / segmentLength : 1;
      result.push(points[index - 1].clone().lerp(points[index], segmentProgress));
      break;
    }

    if (result.length === 1) result.push(points[0].clone().lerp(points[1], 0.001));
    return result;
  }

  private samplePolyline(points: THREE.Vector3[], progress: number): BrushSample {
    const clamped = clamp01(progress);
    const segmentLengths = points.slice(1).map((point, index) => point.distanceTo(points[index]));
    const totalLength = segmentLengths.reduce((sum, value) => sum + value, 0) || 1;
    let distance = totalLength * clamped;

    for (let index = 1; index < points.length; index += 1) {
      const segmentLength = segmentLengths[index - 1];
      if (distance <= segmentLength || index === points.length - 1) {
        const segmentProgress = segmentLength ? distance / segmentLength : 0;
        const point = points[index - 1].clone().lerp(points[index], segmentProgress);
        const tangent = points[index].clone().sub(points[index - 1]).normalize();
        return { point, tangent };
      }
      distance -= segmentLength;
    }

    const last = points[points.length - 1];
    return {
      point: last.clone(),
      tangent: last.clone().sub(points[points.length - 2]).normalize()
    };
  }

  private updateInk(plan: CharacterPlan, progress: number): BrushSample {
    const weights = this.strokeWeights(plan);
    let cursor = 0;
    let activeStrokeIndex = plan.strokes.length - 1;
    let activeStrokeProgress = 1;

    for (let index = 0; index < weights.length; index += 1) {
      const next = cursor + weights[index];
      if (progress < next || index === weights.length - 1) {
        activeStrokeIndex = index;
        activeStrokeProgress = weights[index] ? (progress - cursor) / weights[index] : 1;
        break;
      }
      cursor = next;
    }

    if (this.activePlanIndex !== plan.target.index) {
      this.activePlanIndex = plan.target.index;
    }

    return this.samplePolyline(plan.strokes[activeStrokeIndex].points, activeStrokeProgress);
  }

  private setBrushPose(sample: BrushSample, pressure: number): void {
    const tangent = sample.tangent.lengthSq() > 0.0001
      ? sample.tangent.clone().normalize()
      : new THREE.Vector3(1, 0, 0);
    const opacity = 0.85 + pressure * 0.15;

    this.brushGroup.visible = true;
    this.brushGroup.position.set(sample.point.x, sample.point.y, sample.point.z + 0.24 + pressure * 0.06);
    // 局部 +Y 是笔杆方向，笔杆自然拖在运笔方向后方。
    this.brushGroup.rotation.z = Math.atan2(tangent.x, -tangent.y);
    this.brushGroup.rotation.x = 0.26 + (1 - pressure) * 0.16;
    this.brushGroup.rotation.y = -0.12 + Math.sin(this.startedAt * 0.002) * 0.025;
    this.light.position.set(sample.point.x + 0.25, sample.point.y + 0.4, sample.point.z + 1.2);
    this.light.intensity = 0.45 + pressure * 0.55;

    if (this.tipMesh && this.bristleMesh) {
      const flatten = 1 + pressure * 0.24;
      this.tipMesh.scale.set(flatten, 1 - pressure * 0.12, flatten);
      this.bristleMesh.scale.set(1 + pressure * 0.14, 1 - pressure * 0.08, 1 + pressure * 0.14);
    }

    this.contactShadow.visible = false;
    this.contactInk.visible = false;

    this.brushGroup.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.material) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        material.transparent = true;
        material.opacity = opacity;
      });
    });
  }

  private notifyCharacterStart(plan: CharacterPlan): void {
    if (this.activePlanIndex === plan.target.index) return;
    this.activePlanIndex = plan.target.index;
    this.callbacks.onCharacterStart?.(plan.target, plan.target.index, this.schedule.length);
  }

  private notifyCharacterComplete(plan: CharacterPlan): void {
    if (this.completedCharacterIndices.has(plan.target.index)) return;
    this.completedCharacterIndices.add(plan.target.index);
    this.callbacks.onCharacterComplete?.(plan.target, plan.target.index, this.schedule.length);
  }

  private findCurrentPlan(elapsed: number): number {
    for (let index = 0; index < this.schedule.length; index += 1) {
      const plan = this.schedule[index];
      if (elapsed >= plan.start && elapsed <= plan.end) return index;
    }
    return -1;
  }

  private updateWriting(elapsed: number): void {
    const firstPlan = this.schedule[0];
    if (!firstPlan) return;

    if (elapsed < firstPlan.start) {
      const hover = firstPlan.startPoint.clone();
      hover.y += 0.18;
      this.setBrushPose({ point: hover, tangent: new THREE.Vector3(1, 0, 0) }, 0.08);
      return;
    }

    if (elapsed >= this.totalDuration) {
      const lastPlan = this.schedule[this.schedule.length - 1];
      this.notifyCharacterStart(lastPlan);
      const sample = this.completedCharacterIndices.has(lastPlan.target.index)
        ? {
          point: lastPlan.endPoint.clone(),
          tangent: lastPlan.endPoint.clone().sub(lastPlan.strokes[lastPlan.strokes.length - 1].points[0]).normalize()
        }
        : this.updateInk(lastPlan, 1);
      this.setBrushPose(sample, 0.94);
      this.notifyCharacterComplete(lastPlan);
      this.finishWriting();
      return;
    }

    const currentIndex = this.findCurrentPlan(elapsed);
    if (currentIndex >= 0) {
      const plan = this.schedule[currentIndex];
      this.notifyCharacterStart(plan);
      const progress = clamp01((elapsed - plan.start) / (plan.end - plan.start));
      const sample = this.updateInk(plan, progress);
      this.setBrushPose(sample, 0.52 + progress * 0.42);
      this.callbacks.onCharacterProgress?.(plan.target, progress);
      if (progress >= 0.999) this.notifyCharacterComplete(plan);
      return;
    }

    // 字与字之间是抬笔换位，不画穿越线；跨行时停顿更明显，保留“写完一行再换行”的呼吸。
    let nextIndex = 0;
    while (nextIndex < this.schedule.length && elapsed >= this.schedule[nextIndex].start) nextIndex += 1;
    const previous = this.schedule[Math.max(0, nextIndex - 1)];
    const next = this.schedule[nextIndex];
    if (!previous || !next) return;

    this.clearCurrentInk();
    const gap = Math.max(1, next.start - previous.end);
    const gapProgress = clamp01((elapsed - previous.end) / gap);
    const moveStart = previous.endPoint.clone();
    const moveEnd = next.startPoint.clone();
    const point = moveStart.lerp(moveEnd, gapProgress);
    point.y += Math.sin(gapProgress * Math.PI) * 0.08;
    this.setBrushPose({ point, tangent: moveEnd.clone().sub(moveStart).normalize() }, 0.12);
  }

  private renderFrame = (timestamp: number): void => {
    if (!this.isRunning) return;
    this.updateWriting(timestamp - this.startedAt);
    this.renderer.render(this.scene, this.camera);
    if (this.isRunning) this.animationId = requestAnimationFrame(this.renderFrame);
  };

  public playWriting(
    targets: CalligraphyWriteTarget[],
    callbacks: CalligraphyWriteCallbacks = {},
    options: CalligraphyWriteOptions = {}
  ): void {
    this.cancel();
    if (targets.length === 0) {
      callbacks.onComplete?.();
      return;
    }

    this.resize();
    this.options = { ...this.options, ...options };
    this.callbacks = callbacks;
    this.completedCharacterIndices = new Set<number>();
    this.buildSchedule(targets);
    this.startedAt = performance.now();
    this.isRunning = true;
    this.renderer.domElement.style.opacity = '1';
    this.brushGroup.visible = true;
    this.contactShadow.visible = true;
    this.contactInk.visible = true;
    this.animationId = requestAnimationFrame(this.renderFrame);
  }

  private finishWriting(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.brushGroup.visible = false;
    this.contactShadow.visible = false;
    this.contactInk.visible = false;
    this.renderer.domElement.style.opacity = '0';
    this.renderer.clear();
    this.callbacks.onComplete?.();
  }

  /** 取消当前书写并清空残留墨迹；重写、换章、换城、关卷都走这里。 */
  public cancel(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clearInk();
    this.schedule = [];
    this.callbacks = {};
    this.brushGroup.visible = false;
    this.contactShadow.visible = false;
    this.contactInk.visible = false;
    this.renderer.domElement.style.opacity = '0';
    this.renderer.clear();
  }

  public dispose(): void {
    this.cancel();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.brushGroup.traverse((child) => {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.contactShadow.geometry.dispose();
    this.contactInk.geometry.dispose();
    (this.contactShadow.material as THREE.Material).dispose();
    (this.contactInk.material as THREE.Material).dispose();
    this.inkMaterial.dispose();
    this.wetInkMaterial.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
