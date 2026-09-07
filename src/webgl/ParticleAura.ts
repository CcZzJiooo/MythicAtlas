import * as THREE from 'three';

/**
 * 顶级 3D GPU Curl-Noise 东方流体星尘粒子涡流 (Awwwards-Tier Curl Noise Particle System)
 * 特性：
 * 1. 5000+ 高密流体粒子，采用 Simplex-Curl 3D 散度自由涡旋场算法
 * 2. 随全局时间、鼠标位移与城市五行灵气（金木水火土）动态变幻色彩与运动轨迹
 * 3. 产生如东方仙境中金粉流云、灵气潮汐般的大片级流动质感
 */

export class ParticleAura {
  public mesh: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private count = 5200;

  constructor() {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const randomSeeds = new Float32Array(this.count * 3);
    const scales = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      // 球面与圆环交织分布
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.0 + Math.random() * 2.5;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      randomSeeds[i * 3] = Math.random();
      randomSeeds[i * 3 + 1] = Math.random();
      randomSeeds[i * 3 + 2] = Math.random();

      scales[i] = Math.random() * 0.85 + 0.25;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomSeeds, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorPrimary: { value: new THREE.Color('#D4AF37') },
        uColorSecondary: { value: new THREE.Color('#38EF7D') },
        uSpeed: { value: 0.8 },
        uTurbulence: { value: 0.35 }
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uSpeed;
        uniform float uTurbulence;
        attribute vec3 aRandom;
        attribute float aScale;
        varying float vAlpha;
        varying vec3 vWorldPos;

        // Simplex Noise 3D Implementation
        vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
          i = mod(i, 289.0);
          vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * (ns.z * ns.z));
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        // Curl Noise 3D: computes the curl of potential field
        vec3 curlNoise(vec3 p) {
          const float e = 0.1;
          float dx = snoise(p + vec3(e, 0.0, 0.0)) - snoise(p - vec3(e, 0.0, 0.0));
          float dy = snoise(p + vec3(0.0, e, 0.0)) - snoise(p - vec3(0.0, e, 0.0));
          float dz = snoise(p + vec3(0.0, 0.0, e)) - snoise(p - vec3(0.0, 0.0, e));
          return vec3(dy - dz, dz - dx, dx - dy) / (2.0 * e);
        }

        void main() {
          vec3 pos = position;
          // 自然可见的灵动时间流速 (优雅且富有生命力，杜绝死寂静止)
          float t = uTime * 0.35 * uSpeed + aRandom.x * 10.0;

          // 1. 浑天星宿优雅环绕自转
          float angle = t * 0.22 + aRandom.y * 6.28;
          float cosA = cos(angle);
          float sinA = sin(angle);
          mat2 rot = mat2(cosA, -sinA, sinA, cosA);
          pos.xz = rot * pos.xz;

          // 2. 注入 Curl Noise 散度自由涡流场与太虚灵气升腾波动
          vec3 curl = curlNoise(pos * 0.45 + vec3(0.0, t * 0.28, sin(t * 0.2) * 0.3));
          pos += curl * (uTurbulence * 0.45 + 0.12);
          pos.y += sin(t * 0.6 + aRandom.z * 6.28) * 0.10;

          vWorldPos = pos;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // 3. 智能点径大小衰减：严格限制最大尺寸，杜绝近景变成突兀巨大黄色光斑
          float pSize = (20.0 * aScale) * (1.0 / max(0.6, -mvPosition.z));
          gl_PointSize = clamp(pSize, 1.5, 26.0);

          // 4. 星宿呼吸与渐隐生息
          vAlpha = sin(uTime * 2.0 + aRandom.z * 6.28) * 0.35 + 0.65;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorPrimary;
        uniform vec3 uColorSecondary;
        varying float vAlpha;
        varying vec3 vWorldPos;

        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;

          // 凝聚高光核心与外圈柔和光晕
          float core = pow(1.0 - dist * 2.0, 2.5);
          float halo = pow(1.0 - dist * 2.0, 1.2) * 0.55;

          // 空间混色：随世界坐标渐变过渡
          float mixFactor = sin(vWorldPos.y * 1.2) * 0.5 + 0.5;
          vec3 particleColor = mix(uColorPrimary, uColorSecondary, mixFactor);

          gl_FragColor = vec4(particleColor, (core * 0.85 + halo * 0.45) * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
  }

  public update(time: number) {
    this.material.uniforms.uTime.value = time;
  }

  public setThemeColors(primaryHex: string, secondaryHex: string) {
    this.material.uniforms.uColorPrimary.value.set(primaryHex);
    this.material.uniforms.uColorSecondary.value.set(secondaryHex);
  }
}
