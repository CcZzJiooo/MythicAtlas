import * as THREE from 'three';

/**
 * 焦点微观秘境地貌法阵材质 (Landmark Mythic Rune & Diorama Aura)
 */

export const RuneCircleVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const RuneCircleFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    vec2 p = vUv - vec2(0.5);
    float r = length(p);
    float angle = atan(p.y, p.x);

    if (r > 0.5 || r < 0.1) discard;

    // 1. 同心三道金石法阵环
    float ring1 = smoothstep(0.48, 0.47, r) * smoothstep(0.44, 0.45, r);
    float ring2 = smoothstep(0.38, 0.37, r) * smoothstep(0.35, 0.36, r);
    float ring3 = smoothstep(0.24, 0.23, r) * smoothstep(0.21, 0.22, r);

    // 2. 旋转八卦二十八星宿符文刻度
    float runes = sin(angle * 12.0 + uTime * 0.8) * sin(angle * 24.0 - uTime * 0.4);
    float runeBand = smoothstep(0.44, 0.43, r) * smoothstep(0.38, 0.39, r) * step(0.1, runes);

    // 3. 核心太极流光放射
    float ray = abs(sin(angle * 4.0 + uTime * 0.5)) * (0.5 - r) * 2.0;

    float alpha = (ring1 * 1.5 + ring2 * 1.2 + ring3 + runeBand * 1.8 + ray * 0.4) * uOpacity;
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;

export function createRuneCircleMesh(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(1.2, 1.2);
  const material = new THREE.ShaderMaterial({
    vertexShader: RuneCircleVertexShader,
    fragmentShader: RuneCircleFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#D4AF37') },
      uOpacity: { value: 1.0 }
    },
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}
