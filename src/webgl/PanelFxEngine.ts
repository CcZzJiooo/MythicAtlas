import * as THREE from 'three';

/**
 * PanelFxEngine: 专为大宋宣和「玄黑泥金」文人案卷面板打造的独立 WebGL 粒子水墨流光引擎
 * - 850+ 颗漫天悬浮金粉粒子 (Twinkling Golden Stardust)
 * - 宣和黑曜泥金水墨云烟着色器 (Obsidian & Mud-Gold FBM Curl-Noise Shader)
 * - 朱砂金屑物理爆破粒子系统 (Cinnabar & 24K Gold Spark Burst Emitter)
 * - 鼠标交互流体涟漪 (Mouse-Follow Fluid Uniforms)
 */
export class PanelFxEngine {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private animId: number = 0;
  private isRunning: boolean = false;

  // 1. 水墨云烟 Plane & Shader
  private inkMesh!: THREE.Mesh;
  private inkMaterial!: THREE.ShaderMaterial;

  // 2. 漫天金粉粒子
  private dustPoints!: THREE.Points;
  private dustCount: number = 850;
  private dustPositions!: Float32Array;
  private dustVelocities!: Float32Array;
  private dustScales!: Float32Array;
  private dustAlphas!: Float32Array;

  // 3. 朱砂金屑爆破粒子
  private sparkCount: number = 180;
  private sparkPoints!: THREE.Points;
  private sparkPositions!: Float32Array;
  private sparkVelocities!: Float32Array;
  private sparkColors!: Float32Array;
  private sparkAges!: Float32Array;
  private sparkLifespans!: Float32Array;

  // 鼠标交互与时间
  private mousePos = new THREE.Vector2(0.5, 0.5);
  private targetMousePos = new THREE.Vector2(0.5, 0.5);
  private startTime: number = performance.now();

  constructor(container: HTMLElement) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'panel-fx-webgl-canvas';
    this.container.prepend(this.canvas);

    this.initWebGL();
    this.createInkBackground();
    this.createStardustParticles();
    this.createSparkBurstSystem();
    this.bindEvents();
  }

  private initWebGL() {
    const width = this.container.clientWidth || 440;
    const height = this.container.clientHeight || 780;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  /**
   * 1. 宣和黑曜泥金水墨流光 GLSL Shader
   */
  private createInkBackground() {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec2 uMouse;
      varying vec2 vUv;

      // Simplex 2D Noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
              + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      float fbm(vec2 p) {
        float total = 0.0;
        float amp = 0.55;
        for (int i = 0; i < 4; i++) {
          total += snoise(p) * amp;
          p *= 2.08;
          amp *= 0.48;
        }
        return total;
      }

      void main() {
        vec2 uv = vUv;
        float t = uTime * 0.10;

        // 鼠标引起的流体微扰动
        float mouseDist = distance(uv, uMouse);
        float mouseRipple = exp(-mouseDist * 6.5) * 0.22;

        // 双层卷曲水墨 FBM 场 (Obsidian Ink Curl)
        vec2 q = vec2(fbm(uv + vec2(t * 0.35, -t * 0.18)), fbm(uv + vec2(-t * 0.25, t * 0.45)));
        vec2 r = vec2(fbm(uv + 3.0 * q + vec2(1.7, 9.2) + mouseRipple), fbm(uv + 3.0 * q + vec2(8.3, 2.8)));
        float f = fbm(uv + 4.2 * r);

        // 玄黑黑曜底色 + 青绿山水岚气 + 泥金微芒
        vec3 cBase = vec3(0.04, 0.06, 0.09); // 深沉黑曜墨玉
        vec3 cMist = vec3(0.08, 0.18, 0.16); // 青绿烟岚
        vec3 cGold = vec3(0.85, 0.68, 0.24); // 宣和泥金

        vec3 color = mix(cBase, cMist, clamp((f * f) * 2.6, 0.0, 1.0));
        color = mix(color, cGold, clamp(length(q) * 0.38 * f, 0.0, 1.0));

        // 边缘暗角与通透微光
        float vignette = smoothstep(0.0, 0.75, 1.0 - length((uv - 0.5) * 1.35));
        float alpha = mix(0.78, 0.96, f * 0.5) * vignette;

        gl_FragColor = vec4(color, alpha);
      }
    `;

    this.inkMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) }
      },
      transparent: true,
      depthWrite: false
    });

    const geom = new THREE.PlaneGeometry(2, 2);
    this.inkMesh = new THREE.Mesh(geom, this.inkMaterial);
    this.scene.add(this.inkMesh);
  }

  /**
   * 2. 漫天悬浮金粉系统 (850+ 颗呼吸金粉粒子)
   */
  private createStardustParticles() {
    const geom = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(this.dustCount * 3);
    this.dustVelocities = new Float32Array(this.dustCount * 3);
    this.dustScales = new Float32Array(this.dustCount);
    this.dustAlphas = new Float32Array(this.dustCount);

    for (let i = 0; i < this.dustCount; i++) {
      this.dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 2.0; // x: -1 ~ 1
      this.dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 2.0; // y: -1 ~ 1
      this.dustPositions[i * 3 + 2] = 0.05;

      this.dustVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.0008; // 微小水平漂移
      this.dustVelocities[i * 3 + 1] = 0.0003 + Math.random() * 0.0009; // 冉冉上升
      this.dustVelocities[i * 3 + 2] = 0.0;

      this.dustScales[i] = 1.4 + Math.random() * 2.8;
      this.dustAlphas[i] = 0.25 + Math.random() * 0.75;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    geom.setAttribute('aScale', new THREE.BufferAttribute(this.dustScales, 1));
    geom.setAttribute('aAlpha', new THREE.BufferAttribute(this.dustAlphas, 1));

    const dustVertexShader = `
      attribute float aScale;
      attribute float aAlpha;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        vAlpha = aAlpha * (0.65 + 0.35 * sin(uTime * 2.5 + position.x * 12.0));
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aScale * (4.2 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const dustFragmentShader = `
      varying float vAlpha;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        float glow = pow(1.0 - dist * 2.0, 1.8);
        vec3 goldColor = vec3(1.0, 0.88, 0.48);
        gl_FragColor = vec4(goldColor, vAlpha * glow);
      }
    `;

    const dustMaterial = new THREE.ShaderMaterial({
      vertexShader: dustVertexShader,
      fragmentShader: dustFragmentShader,
      uniforms: {
        uTime: { value: 0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dustPoints = new THREE.Points(geom, dustMaterial);
    this.scene.add(this.dustPoints);
  }

  /**
   * 3. 朱砂金屑爆破发射器 (180+ 颗物理粒子)
   */
  private createSparkBurstSystem() {
    const geom = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.sparkCount * 3);
    this.sparkVelocities = new Float32Array(this.sparkCount * 3);
    this.sparkColors = new Float32Array(this.sparkCount * 3);
    this.sparkAges = new Float32Array(this.sparkCount);
    this.sparkLifespans = new Float32Array(this.sparkCount);

    for (let i = 0; i < this.sparkCount; i++) {
      this.sparkPositions[i * 3 + 0] = 0;
      this.sparkPositions[i * 3 + 1] = 0;
      this.sparkPositions[i * 3 + 2] = 0.1;
      this.sparkAges[i] = 1.0;
      this.sparkLifespans[i] = 1.0;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));
    geom.setAttribute('aAge', new THREE.BufferAttribute(this.sparkAges, 1));

    const sparkVertexShader = `
      attribute vec3 color;
      attribute float aAge;
      varying vec3 vColor;
      varying float vLife;
      void main() {
        vColor = color;
        vLife = max(0.0, 1.0 - aAge);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (1.0 - aAge) * 18.0;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const sparkFragmentShader = `
      varying vec3 vColor;
      varying float vLife;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        float intensity = pow(1.0 - dist * 2.0, 2.0);
        gl_FragColor = vec4(vColor, vLife * intensity * 1.6);
      }
    `;

    const sparkMat = new THREE.ShaderMaterial({
      vertexShader: sparkVertexShader,
      fragmentShader: sparkFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparkPoints = new THREE.Points(geom, sparkMat);
    this.scene.add(this.sparkPoints);
  }

  /**
   * 触发粒子爆破 (如点击印章、切换 Tab)
   */
  public triggerSparkBurst(xNormalized: number, yNormalized: number, count: number = 45, isCinnabar: boolean = true) {
    const sx = (xNormalized - 0.5) * 2.0;
    const sy = -(yNormalized - 0.5) * 2.0;

    let spawned = 0;
    for (let i = 0; i < this.sparkCount && spawned < count; i++) {
      if (this.sparkAges[i] >= 1.0) {
        this.sparkPositions[i * 3 + 0] = sx;
        this.sparkPositions[i * 3 + 1] = sy;
        this.sparkPositions[i * 3 + 2] = 0.1;

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.008 + Math.random() * 0.024;
        this.sparkVelocities[i * 3 + 0] = Math.cos(angle) * speed;
        this.sparkVelocities[i * 3 + 1] = Math.sin(angle) * speed + 0.004;

        if (isCinnabar && Math.random() > 0.35) {
          // 朱砂红火光
          this.sparkColors[i * 3 + 0] = 0.95;
          this.sparkColors[i * 3 + 1] = 0.20 + Math.random() * 0.15;
          this.sparkColors[i * 3 + 2] = 0.10;
        } else {
          // 纯金碎屑
          this.sparkColors[i * 3 + 0] = 1.0;
          this.sparkColors[i * 3 + 1] = 0.86 + Math.random() * 0.12;
          this.sparkColors[i * 3 + 2] = 0.28;
        }

        this.sparkAges[i] = 0.0;
        this.sparkLifespans[i] = 0.55 + Math.random() * 0.45;
        spawned++;
      }
    }
  }

  private bindEvents() {
    this.container.addEventListener('pointermove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      this.targetMousePos.set(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
    });

    window.addEventListener('resize', () => this.handleResize());
  }

  public handleResize() {
    if (!this.container) return;
    const width = this.container.clientWidth || 440;
    const height = this.container.clientHeight || 780;
    this.renderer.setSize(width, height);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  public stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  private animate = () => {
    if (!this.isRunning) return;
    this.animId = requestAnimationFrame(this.animate);

    const time = (performance.now() - this.startTime) * 0.001;

    // 1. 平滑鼠标跟随
    this.mousePos.lerp(this.targetMousePos, 0.08);
    this.inkMaterial.uniforms.uTime.value = time;
    this.inkMaterial.uniforms.uMouse.value.copy(this.mousePos);

    // 2. 更新漫天金粉位置
    const posAttr = this.dustPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    for (let i = 0; i < this.dustCount; i++) {
      positions[i * 3 + 0] += this.dustVelocities[i * 3 + 0] + Math.sin(time + i) * 0.0003;
      positions[i * 3 + 1] += this.dustVelocities[i * 3 + 1];

      // 顶部循环到底部
      if (positions[i * 3 + 1] > 1.05) {
        positions[i * 3 + 1] = -1.05;
        positions[i * 3 + 0] = (Math.random() - 0.5) * 2.0;
      }
      if (positions[i * 3 + 0] < -1.05) positions[i * 3 + 0] = 1.05;
      if (positions[i * 3 + 0] > 1.05) positions[i * 3 + 0] = -1.05;
    }
    posAttr.needsUpdate = true;
    (this.dustPoints.material as THREE.ShaderMaterial).uniforms.uTime.value = time;

    // 3. 更新朱砂金屑爆破粒子
    const sparkPosAttr = this.sparkPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const sparkAgeAttr = this.sparkPoints.geometry.getAttribute('aAge') as THREE.BufferAttribute;
    const sPos = sparkPosAttr.array as Float32Array;
    const sAges = sparkAgeAttr.array as Float32Array;

    for (let i = 0; i < this.sparkCount; i++) {
      if (sAges[i] < 1.0) {
        sAges[i] += 0.016 / this.sparkLifespans[i];
        sPos[i * 3 + 0] += this.sparkVelocities[i * 3 + 0];
        sPos[i * 3 + 1] += this.sparkVelocities[i * 3 + 1];
        this.sparkVelocities[i * 3 + 1] -= 0.0008; // 模拟重力下坠
        this.sparkVelocities[i * 3 + 0] *= 0.96;   // 空气阻力
      }
    }
    sparkPosAttr.needsUpdate = true;
    sparkAgeAttr.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    this.stop();
    this.renderer.dispose();
    this.canvas.remove();
  }
}
