import * as THREE from 'three';

/**
 * GPU 驱动流金灵萤粒子系统 (GPU Golden Embers & Spirit Fireflies)
 */

export const ParticleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uTargetPos;

  attribute float aScale;
  attribute vec3 aVelocity;
  attribute float aRandomSeed;

  varying float vLife;
  varying float vSeed;

  void main() {
    vSeed = aRandomSeed;
    vec3 pos = position;

    // 粒子沿球体表面与空间流转 (Curl Noise & Orbital Motion)
    float angle = uTime * 0.2 + aRandomSeed * 6.28;
    pos.x += sin(angle + pos.y * 0.5) * 0.3 * aVelocity.x;
    pos.y += cos(angle + pos.x * 0.5) * 0.3 * aVelocity.y;
    pos.z += sin(angle * 1.3) * 0.3 * aVelocity.z;

    // 向目标地标引力微吸附
    vec3 toTarget = uTargetPos - pos;
    float dist = length(toTarget);
    if (dist < 4.0 && dist > 0.1) {
      pos += normalize(toTarget) * (4.0 - dist) * 0.08 * sin(uTime * 2.0 + aRandomSeed * 3.0);
    }

    vec4 mvPosition = viewMatrix * modelMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // 随视角距离与随机种子动态微缩
    float pulse = 0.7 + 0.3 * sin(uTime * 3.0 + aRandomSeed * 10.0);
    gl_PointSize = (aScale * 35.0 * pulse) / -mvPosition.z;
    vLife = pulse;
  }
`;

export const ParticleFragmentShader = /* glsl */ `
  uniform vec3 uGoldColor;
  uniform vec3 uVermilionColor;

  varying float vLife;
  varying float vSeed;

  void main() {
    // 渲染圆形柔和光晕
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    glow = pow(glow, 2.0);

    // 金辉与少许朱砂赤色灵光交织
    vec3 color = mix(uGoldColor, uVermilionColor, step(0.85, fract(vSeed * 7.0)));

    gl_FragColor = vec4(color, glow * 0.85 * vLife);
  }
`;

export function createParticleSystem(count: number = 4000, radius: number = 2.4): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const velocities = new Float32Array(count * 3);
  const randomSeeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // 球面及空间随机分布
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = radius + (Math.random() - 0.5) * 0.8;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    scales[i] = Math.random() * 0.6 + 0.4;
    velocities[i * 3] = (Math.random() - 0.5) * 2.0;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    randomSeeds[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('aRandomSeed', new THREE.BufferAttribute(randomSeeds, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: ParticleVertexShader,
    fragmentShader: ParticleFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uTargetPos: { value: new THREE.Vector3(0, 0, 0) },
      uGoldColor: { value: new THREE.Color('#F6D365') },
      uVermilionColor: { value: new THREE.Color('#FF4E50') }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(geometry, material);
}
