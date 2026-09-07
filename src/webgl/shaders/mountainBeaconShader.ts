import * as THREE from 'three';

/**
 * ============================================================================
 * 通天神岳接引真光与仙人指路定岳金刚印着色器 (Celestial Mountain God Ray & Leyline Shader)
 * ============================================================================
 * 遵循 Three.js Shaders / GSAP / 华夏仙道与山海经高对比度美学规范：
 * 1. 垂直双端羽化：底部汇聚山巅 (y=0)，顶部化入九霄仙云 (y=1)，消除生硬几何截断；
 * 2. 视线掠射角软化 (Fresnel Anti-Blinding)：消除俯视视角下的实心白斑过曝；
 * 3. 动态光隙流痕 (Volumetric Streaks)：向下流转的仙人指路天光经纬；
 * 4. 高对比度天青苍玉与纯阳白金双阶色谱：与背景金橙色粒子形成 100% 鲜明色相分离；
 * 5. GSAP 全家桶时间轴驱动：光柱破云天降 (uProgress)、神圣冲击闪耀 (uIntensity)。
 */

export const MountainBeaconRayVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vHeight;

  void main() {
    vUv = uv;
    vHeight = position.y;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const MountainBeaconRayFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorCore;    // 炽盛纯阳耀白内核 (#FFFFFF)
  uniform vec3 uColorEdge;    // 仙道天青苍玉外晕 (#00F5FF)
  uniform float uIntensity;   // 整体光照强度 (GSAP 动画)
  uniform float uProgress;    // 破云天降进度 (0.0 ~ 1.0)
  uniform float uTopViewDamp; // 俯视视角压制因子 (防止垂直俯视糊成白盘)

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vHeight;

  void main() {
    // 1. 垂直渐变羽化：底部在剑身高度 (vUv.y < 0.18) 彻底透明，将清澈无遮挡的视野完全留给实体名剑！
    // 顶部飘散融入九霄仙云
    float bottomFade = smoothstep(0.16, 0.32, vUv.y);
    float topFade = smoothstep(1.0, 0.68, vUv.y);

    // 2. 天光下贯破云进度蒙版 (0.0 -> 1.0 沿高度自上而下倾泻)
    float progressCut = 1.0 - uProgress;
    float descentMask = smoothstep(progressCut + 0.08, progressCut - 0.02, vUv.y);

    // 3. 视线掠射菲涅尔软化 (Fresnel Grazing Angle)
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);
    float ndotv = abs(dot(N, V));
    float rim = pow(1.0 - ndotv, 1.65);

    // 俯视角衰减检测：视线接近 Y 轴时平滑柔化
    float viewTiltDown = clamp(abs(V.y) / (length(V) + 0.0001), 0.0, 1.0);
    float topDamp = mix(1.0, 0.25, pow(viewTiltDown, 1.6) * uTopViewDamp);

    // 4. 太虚霞光经纬与流动光痕 (向下流转的仙人指路天青虚光)
    float streak1 = sin(vUv.x * 28.0 + uTime * 2.0) * 0.14;
    float streak2 = cos(vUv.x * 14.0 - uTime * 1.4 + vUv.y * 10.0) * 0.10;
    float verticalPulse = sin(vUv.y * 18.0 + uTime * 3.6) * 0.10;
    float downwardGuidance = sin((vUv.y * 14.0 + uTime * 4.0) * 3.14159) * 0.16;
    float volumetric = 1.0 + streak1 + streak2 + verticalPulse + downwardGuidance;

    // 5. 纯阳白金内核向天青外晕的双阶色谱过渡 (柔和典雅，严禁高倍过曝)
    float coreBlend = smoothstep(0.75, 0.25, rim);
    vec3 beamRamp = mix(uColorEdge, uColorCore, coreBlend * 0.45 + 0.15);

    // 6. 最终 Alpha 合成：清虚淡雅，作为远景背景氛围，杜绝实心光筒遮蔽
    float baseAlpha = (rim * 0.65 + 0.18) * bottomFade * topFade * descentMask * topDamp * volumetric;
    float finalAlpha = clamp(baseAlpha * uIntensity * 0.45, 0.0, 0.38);

    gl_FragColor = vec4(beamRamp, finalAlpha);
  }
`;

/**
 * 生成高清晰度仙人指路 · 八角定岳金刚印与司南向心准星矢量纹理 (1024x1024)
 * 彻底废除圆形乾坤圈与死白光团！采用天青苍玉与金石微刻高对比度配色：
 * 包含：八角天罡星规、四方向心定穴飞标、司南十字定岳真尺、核心细致金石准星
 */
export function createMountainLeylineTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // 1. 最外层：八角天罡星规 (Octagonal Celestial Boundary - 纯正八角棱星)
  ctx.strokeStyle = 'rgba(0, 245, 255, 0.75)';
  ctx.lineWidth = 3.0;
  ctx.shadowColor = 'rgba(0, 245, 255, 0.60)';
  ctx.shadowBlur = 8;

  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    const r = (i % 2 === 0) ? 460 : 360;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // 2. 内层菱形金刚方阵 (Diamond Core Grid)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.60)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 300);
  ctx.lineTo(cx + 300, cy);
  ctx.lineTo(cx, cy + 300);
  ctx.lineTo(cx - 300, cy);
  ctx.closePath();
  ctx.stroke();

  // 3. 正交四方定岳真尺十字刻度 (Cardinal Precision Crosshair Lines)
  ctx.strokeStyle = 'rgba(255, 224, 130, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 6;
  ctx.shadowColor = 'rgba(255, 224, 130, 0.50)';

  // X 轴与 Y 轴贯通定岳线
  ctx.beginPath();
  ctx.moveTo(cx - 430, cy);
  ctx.lineTo(cx + 430, cy);
  ctx.moveTo(cx, cy - 430);
  ctx.lineTo(cx, cy + 430);
  ctx.stroke();

  // 刻度微标
  for (let d = -400; d <= 400; d += 40) {
    if (Math.abs(d) < 80) continue;
    ctx.beginPath();
    ctx.moveTo(cx + d, cy - 8);
    ctx.lineTo(cx + d, cy + 8);
    ctx.moveTo(cx - 8, cy + d);
    ctx.lineTo(cx + 8, cy + d);
    ctx.stroke();
  }

  // 4. 【仙人指路 · 四方破空向心飞标】(Inward-pointing Sharp Guiding Arrowheads)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const baseDist = 260;
    const tipDist = 120; // 尖端直刺向中心
    const ax = cx + Math.cos(angle) * baseDist;
    const ay = cy + Math.sin(angle) * baseDist;
    const tipX = cx + Math.cos(angle) * tipDist;
    const tipY = cy + Math.sin(angle) * tipDist;
    const perp = angle + Math.PI / 2;
    const w1x = ax + Math.cos(perp) * 28;
    const w1y = ay + Math.sin(perp) * 28;
    const w2x = ax - Math.cos(perp) * 28;
    const w2y = ay - Math.sin(perp) * 28;

    ctx.fillStyle = 'rgba(0, 245, 255, 0.80)';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(w1x, w1y);
    ctx.lineTo(cx + Math.cos(angle) * (baseDist - 30), cy + Math.sin(angle) * (baseDist - 30));
    ctx.lineTo(w2x, w2y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
    ctx.lineWidth = 2.0;
    ctx.stroke();
  }

  // 5. 核心定岳菱形准星与细致金石针尖 (彻底消除大白光斑)
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 224, 130, 0.95)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 60);
  ctx.lineTo(cx + 60, cy);
  ctx.lineTo(cx, cy + 60);
  ctx.lineTo(cx - 60, cy);
  ctx.closePath();
  ctx.stroke();

  // 中心十字针与定岳微针眼 (半径仅 3px，通透清晰)
  ctx.strokeStyle = 'rgba(0, 245, 255, 0.90)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy);
  ctx.lineTo(cx + 24, cy);
  ctx.moveTo(cx, cy - 24);
  ctx.lineTo(cx, cy + 24);
  ctx.stroke();

  ctx.fillStyle = '#FFE082';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

/**
 * 生成高对比度天青冰晶星尘粒子微缩贴图 (64x64)
 */
export function createAscendingMoteTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const c = size / 2;
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.28, 'rgba(0, 245, 255, 0.75)');
  grad.addColorStop(0.65, 'rgba(0, 180, 216, 0.25)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

