import * as THREE from 'three';

/**
 * 浑天水墨星球着色器 (Ink-Wash Celestial Globe Shader)
 * 纯 GLSL 实现水墨晕染山川、海岸浸润、金箔经纬网格与灵气潮汐
 */

export const InkGlobeVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vPosition = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const InkGlobeFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uInkColor;      // 深墨色
  uniform vec3 uWaterColor;    // 宣纸/青绿水色
  uniform vec3 uGoldColor;     // 泥金流光
  uniform vec3 uHoverPos;      // 鼠标/当前地标聚焦坐标
  uniform float uInkPulse;     // 水墨扩散脉冲强度

  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  // Simplex 3D Noise Helper
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

  // Fractal Brownian Motion (水墨多层分形叠加)
  float fbm(vec3 p) {
    float total = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      total += snoise(p) * amp;
      p *= 2.05;
      amp *= 0.5;
    }
    return total;
  }

  void main() {
    vec3 normPos = normalize(vPosition);

    // 1. 程序化生成大地陆块与沧海水纹 (水墨渗透感)
    float landNoise = fbm(normPos * 2.6 + vec3(0.0, uTime * 0.015, 0.0));
    float inkWash = smoothstep(-0.08, 0.28, landNoise);

    // 2. 宣纸水墨纤维底色
    float paperFiber = snoise(vWorldPosition * 25.0) * 0.04;
    vec3 baseWater = uWaterColor + vec3(paperFiber);
    vec3 finalColor = mix(baseWater, uInkColor, inkWash);

    // 3. 陆海交界处的泥金水墨勾边 (Gold Leaf Shoreline Edge)
    float edgeGold = smoothstep(0.24, 0.28, landNoise) * (1.0 - smoothstep(0.28, 0.32, landNoise));
    finalColor += uGoldColor * edgeGold * 1.5;

    // 4. 经纬线与浑天金网 (Astrolabe Longitude & Latitude Inscriptions)
    float latLine = abs(fract(vUv.y * 18.0) - 0.5);
    float lngLine = abs(fract(vUv.x * 36.0) - 0.5);
    float grid = (1.0 - smoothstep(0.0, 0.04, latLine)) + (1.0 - smoothstep(0.0, 0.04, lngLine));
    finalColor += uGoldColor * grid * 0.12;

    // 5. 焦点水墨扩散脉冲 (Ink Bloom Ripple on Landmark selection)
    float distToFocus = length(vWorldPosition - uHoverPos);
    float ripple = sin(distToFocus * 8.0 - uTime * 3.0) * exp(-distToFocus * 1.2);
    if (uInkPulse > 0.01) {
      finalColor += uGoldColor * max(0.0, ripple) * uInkPulse * 0.8;
    }

    // 6. 边缘暗角与景深明暗 (Fresnel Rim)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
    finalColor += uGoldColor * pow(fresnel, 3.0) * 0.35;

    gl_FragColor = vec4(finalColor, 0.95);
  }
`;

export function createInkGlobeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: InkGlobeVertexShader,
    fragmentShader: InkGlobeFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uInkColor: { value: new THREE.Color('#0D1117') },      // 深渊玄墨
      uWaterColor: { value: new THREE.Color('#1A2332') },    // 幽青水墨
      uGoldColor: { value: new THREE.Color('#D4AF37') },     // 泥金流光
      uHoverPos: { value: new THREE.Vector3(0, 0, 0) },
      uInkPulse: { value: 0.0 }
    },
    transparent: true,
    side: THREE.FrontSide
  });
}
