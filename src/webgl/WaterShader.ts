import * as THREE from 'three';

export class SouthSeaWater {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor() {
    const geometry = new THREE.PlaneGeometry(16, 16, 64, 64);
    geometry.rotateX(-Math.PI / 2);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDeepWaterColor: { value: new THREE.Color('#0A2239') }, // 深邃青蓝
        uShallowWaterColor: { value: new THREE.Color('#175873') }, // 浅滩翠碧
        uSunColor: { value: new THREE.Color('#F6E05E') }, // 泥金日光
        uSunDirection: { value: new THREE.Vector3(0.5, 1.0, 0.5).normalize() }
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Gerstner-like multi-frequency waves
          float wave1 = sin(pos.x * 1.5 + uTime * 1.2) * cos(pos.z * 1.5 + uTime * 0.8) * 0.04;
          float wave2 = sin(pos.x * 3.0 - uTime * 1.8 + pos.z * 2.0) * 0.02;
          float wave3 = sin(pos.x * 6.0 + pos.z * 6.0 + uTime * 2.5) * 0.008;
          
          pos.y += wave1 + wave2 + wave3 - 0.08;

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          
          // Perturbed normal
          vec3 norm = normalize(vec3(
            -cos(pos.x * 1.5 + uTime * 1.2) * 0.1,
            1.0,
            -sin(pos.z * 1.5 + uTime * 0.8) * 0.1
          ));
          vNormal = normalize(normalMatrix * norm);

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uDeepWaterColor;
        uniform vec3 uShallowWaterColor;
        uniform vec3 uSunColor;
        uniform vec3 uSunDirection;

        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 normal = normalize(vNormal);

          // Fresnel reflection
          float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

          // Specular sun highlight
          vec3 reflectDir = reflect(-uSunDirection, normal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

          // Subtle caustic pattern
          float caustics = sin(vWorldPosition.x * 8.0 + uTime) * sin(vWorldPosition.z * 8.0 + uTime) * 0.1;

          vec3 waterColor = mix(uDeepWaterColor, uShallowWaterColor, fresnel + caustics);
          waterColor += uSunColor * spec * 0.8;

          gl_FragColor = vec4(waterColor, 0.88);
        }
      `,
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.y = -0.05;
    this.mesh.receiveShadow = true;
  }

  public update(delta: number) {
    this.material.uniforms.uTime.value += delta * 1.2;
  }
}
