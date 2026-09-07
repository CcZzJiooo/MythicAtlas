import * as THREE from 'three';

/**
 * 东方电影级水墨后期着色器 (Cinematic Oriental Ink & Film Shader)
 * 全亮保真：边缘微色散与宣纸微纹理，0 视野遮挡与 0 异常暗块
 */

export const CinematicInkShader = {
  name: 'CinematicInkShader',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0.0 },
    uAberration: { value: 0.0015 },     // 极轻微边缘色散
    uGrainIntensity: { value: 0.015 },  // 极轻微宣纸微颗粒
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
    uniform float uTime;
    uniform float uAberration;
    uniform float uGrainIntensity;
    varying vec2 vUv;

    // Pseudo-random noise for subtle paper grain
    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 center = vec2(0.5);
      vec2 toCenter = vUv - center;
      float dist = length(toCenter);

      // 1. 极轻微边缘色散 (Subtle Aberration)
      float aberrationDist = dist * dist * uAberration;
      vec2 redUv   = clamp(vUv + toCenter * aberrationDist, 0.0, 1.0);
      vec2 greenUv = vUv;
      vec2 blueUv  = clamp(vUv - toCenter * aberrationDist, 0.0, 1.0);

      float r = texture2D(tDiffuse, redUv).r;
      float g = texture2D(tDiffuse, greenUv).g;
      float b = texture2D(tDiffuse, blueUv).b;
      vec3 baseColor = vec3(r, g, b);

      // 2. 宣纸水墨微颗粒 (Paper Grain)
      float noise = rand(vUv * 4.0 + vec2(sin(uTime * 0.5), cos(uTime * 0.3)));
      baseColor += (noise - 0.5) * uGrainIntensity;

      // 3. 全局色彩安全边界约束
      baseColor = clamp(baseColor, 0.0, 1.0);

      gl_FragColor = vec4(baseColor, 1.0);
    }
  `
};
