import * as THREE from 'three';

/**
 * 灵气外层大气光晕着色器 (Atmosphere Fresnel Glow Shader)
 */

export const AtmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const AtmosphereFragmentShader = /* glsl */ `
  uniform vec3 uGlowColor;
  uniform float uCoefficient;
  uniform float uPower;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = max(0.0, uCoefficient - max(0.0, dot(vNormal, viewDir)));
    float intensity = clamp(pow(rim, uPower), 0.0, 1.0);

    gl_FragColor = vec4(uGlowColor, intensity * 0.45);
  }
`;

export function createAtmosphereMesh(radius: number = 2.15): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 64, 64);
  const material = new THREE.ShaderMaterial({
    vertexShader: AtmosphereVertexShader,
    fragmentShader: AtmosphereFragmentShader,
    uniforms: {
      uGlowColor: { value: new THREE.Color('#4FD1C5') }, // 灵韵青翡光
      uCoefficient: { value: 0.85 },
      uPower: { value: 2.8 }
    },
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Mesh(geometry, material);
}
