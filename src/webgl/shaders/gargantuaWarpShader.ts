import * as THREE from 'three';

/**
 * 星际穿越 · 卡冈图雅 (Gargantua) 电影级黑洞引力透镜与超空间折跃后处理着色器
 * (Ultra-Optimized Relativistic Black Hole Lensing & Hyperspace Warp Shader - 60FPS Locked)
 */
export const GargantuaWarpShader = {
  name: 'GargantuaWarpShader',
  uniforms: {
    tDiffuse: { value: null },
    uProgress: { value: 0.0 }, // 0.0 (无折跃) -> 1.0 (折跃完成)
    uEpicenter: { value: new THREE.Vector2(0.5, 0.5) }, // 引力奇点归一化屏幕坐标
    uTime: { value: 0.0 },
    uAspect: { value: window.innerWidth / window.innerHeight },
    uAccretionColor: { value: new THREE.Color(0xFFB84D) }, // 标志性赤金吸积盘
    uSecondaryColor: { value: new THREE.Color(0x38EF7D) }  // 东方青冥引力外环
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uProgress;
    uniform vec2 uEpicenter;
    uniform float uTime;
    uniform float uAspect;
    uniform vec3 uAccretionColor;
    uniform vec3 uSecondaryColor;
    varying vec2 vUv;

    void main() {
      // 零折跃状态硬件极速直通通道 (Zero GPU overhead when idle)
      if (uProgress <= 0.0001) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      vec2 uv = vUv;
      vec2 center = uEpicenter;
      
      // 视口宽高比各向同性矫正
      vec2 diff = uv - center;
      diff.x *= uAspect;
      float dist = length(diff);
      float angle = atan(diff.y, diff.x);

      // 电影级平滑钟形包络线 (0.0 -> 1.0 -> 0.0)
      float t = uProgress;
      float envelope = sin(t * 3.14159265);

      // 1. 施瓦西引力透镜弯曲 (Schwarzschild Gravitational Lensing)
      float schwRadius = 0.22 * envelope;
      float lensWarp = schwRadius / (dist * dist * 4.0 + dist * 0.8 + 0.04);
      vec2 warpDir = diff / (dist + 0.0001);
      warpDir.x /= uAspect;

      // 相对论时空拖拽旋涡 (Frame Dragging)
      float swirl = envelope * 1.8 / (dist * 3.5 + 0.4);
      float sinS = sin(swirl);
      float cosS = cos(swirl);
      vec2 swirledDir = vec2(
        warpDir.x * cosS - warpDir.y * sinS,
        warpDir.x * sinS + warpDir.y * cosS
      );

      // 2. 相对论超空间光学色散 (Relativistic RGB Dispersion)
      float chroma = envelope * 0.04 * (1.0 + lensWarp * 0.5);
      vec2 uvR = uv - swirledDir * (lensWarp * 0.07 + chroma);
      vec2 uvG = uv - swirledDir * (lensWarp * 0.07);
      vec2 uvB = uv - swirledDir * (lensWarp * 0.07 - chroma);

      vec3 baseColor;
      baseColor.r = texture2D(tDiffuse, clamp(uvR, 0.0, 1.0)).r;
      baseColor.g = texture2D(tDiffuse, clamp(uvG, 0.0, 1.0)).g;
      baseColor.b = texture2D(tDiffuse, clamp(uvB, 0.0, 1.0)).b;

      // 3. 卡冈图雅标志性双环发光吸积盘 (Gargantua Accretion Rings)
      float ringDist1 = abs(dist - schwRadius * 1.3);
      float ring1 = exp(-ringDist1 * 32.0) * envelope;
      
      // 高性能多普勒湍流流光 (Fast Doppler Filaments)
      float filament = sin(angle * 6.0 - uTime * 7.0) * cos(dist * 28.0 + uTime * 4.0);
      float accretionGlow = ring1 * (0.75 + 0.25 * filament);

      // 外层爱因斯坦引力环 (Secondary Einstein Ring)
      float ringDist2 = abs(dist - schwRadius * 2.2);
      float ring2 = exp(-ringDist2 * 42.0) * envelope * 0.7;

      // 4. 超空间流光拉丝 (Hyperspace Relativistic Streaks)
      float streaks = pow(max(0.0, sin(angle * 28.0 + uTime * 5.0) * cos(angle * 14.0 - uTime * 3.0)), 4.0);
      float streakBeam = streaks * envelope * (1.0 - smoothstep(0.0, 0.85, dist));

      // 5. 事件视界阴影 (Event Horizon Cosmic Shadow)
      float horizon = smoothstep(schwRadius * 0.7, schwRadius * 0.2, dist) * envelope;

      // 6. 临界点超新星破空闪耀 (Breakthrough Supernova Flash)
      float flash = pow(envelope, 3.2) * 1.8;
      float whiteout = smoothstep(0.6, 0.95, t) * (1.0 - smoothstep(0.95, 1.0, t)) * 0.8;

      // 综合电影级渲染
      vec3 finalColor = baseColor * (1.0 - horizon * 0.95);
      finalColor += uAccretionColor * accretionGlow * 3.2;
      finalColor += uSecondaryColor * ring2 * 2.2;
      finalColor += mix(uAccretionColor, vec3(1.0), 0.6) * streakBeam * 2.0;
      finalColor += vec3(1.0, 0.95, 0.8) * flash * (1.0 - clamp(dist * 1.2, 0.0, 1.0));
      finalColor += vec3(1.0) * whiteout;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};
