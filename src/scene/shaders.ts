import type { IUniform } from 'three';

/**
 * Shared shader sources for the celestial globe. All texture detail is generated
 * in GLSL so the scene has no network or image loading dependency.
 */
export const mythicGlobeVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDisplacement;
  uniform float uInkBloom;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vLocalDirection;
  varying float vElevation;
  varying float vInk;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.52;
    mat3 rotation = mat3(
       0.00,  0.80,  0.60,
      -0.80,  0.36, -0.48,
      -0.60, -0.48,  0.64
    );
    for (int octave = 0; octave < 5; octave++) {
      value += amplitude * noise3(p);
      p = rotation * p * 2.03 + 0.17;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 direction = normalize(position);
    vec3 flow = vec3(uTime * 0.018, -uTime * 0.011, uTime * 0.007);
    float broadInk = fbm(direction * 3.45 + flow);
    float mineralGrain = noise3(direction * 18.0 - flow * 1.7);
    float ink = broadInk * 0.82 + mineralGrain * 0.18;
    float washWave = sin((direction.y + direction.x * 0.32) * 15.0 - uInkBloom * 7.0);
    float transitionLift = washWave * uInkBloom * 0.025;
    float elevation = (ink - 0.5) * uDisplacement + transitionLift;
    vec3 displaced = position + normal * elevation;
    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);

    vLocalDirection = direction;
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vElevation = elevation;
    vInk = ink;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const mythicGlobeFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uInkBloom;
  uniform vec3 uInkColor;
  uniform vec3 uMineralColor;
  uniform vec3 uPaperColor;
  uniform vec3 uGlowColor;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vLocalDirection;
  varying float vElevation;
  varying float vInk;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.56;
    for (int octave = 0; octave < 3; octave++) {
      value += amplitude * noise3(p);
      p = p.yzx * 2.07 + vec3(0.31, 0.17, 0.23);
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(vec3(-0.35, 0.76, 0.55));
    float light = max(dot(normal, lightDirection), 0.0);
    float wrappedLight = light * 0.68 + 0.32;

    float flowingInk = fbm(vLocalDirection * 9.0 + vec3(uTime * 0.012, 0.0, -uTime * 0.009));
    float continent = smoothstep(0.43, 0.63, vInk + flowingInk * 0.12);
    float inkPool = 1.0 - smoothstep(0.20, 0.55, vInk - flowingInk * 0.15);
    float contour = abs(fract((vInk + flowingInk * 0.18) * 13.0) - 0.5);
    float contourLine = 1.0 - smoothstep(0.025, 0.085, contour);

    vec3 mineral = mix(uMineralColor, uPaperColor, continent * 0.42);
    vec3 color = mix(mineral, uInkColor, inkPool * 0.78);
    color = mix(color, uPaperColor, contourLine * 0.18);
    color *= wrappedLight;

    float fresnel = pow(1.0 - max(dot(viewDirection, normal), 0.0), 3.2);
    float aura = fresnel * (0.72 + uInkBloom * 0.55);
    color += uGlowColor * aura * 1.35;

    float mineralSpeck = step(0.985, hash31(floor(vLocalDirection * 170.0)));
    color += uPaperColor * mineralSpeck * (0.42 + light * 0.5);
    color += uGlowColor * max(vElevation, 0.0) * 1.15;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const mistVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uMotion;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vDirection;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z
    );
  }

  void main() {
    vec3 direction = normalize(position);
    float drift = noise3(direction * 5.0 + vec3(uTime * uSpeed, 0.0, -uTime * uSpeed * 0.6));
    vec3 displaced = position + normal * (drift - 0.5) * 0.055 * uMotion;
    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vDirection = direction;
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const mistFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uOpacity;
  uniform float uSeed;
  uniform vec3 uMistColor;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vDirection;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.58;
    for (int octave = 0; octave < 4; octave++) {
      value += amplitude * noise3(p);
      p = p.yzx * 2.03 + 0.19;
      amplitude *= 0.47;
    }
    return value;
  }

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - max(dot(viewDirection, normalize(vWorldNormal)), 0.0), 1.65);
    vec3 drift = vec3(uTime * uSpeed, uSeed, -uTime * uSpeed * 0.72);
    float cloud = fbm(vDirection * (5.2 + uSeed) + drift);
    float wisps = smoothstep(0.44, 0.76, cloud + rim * 0.16);
    float alpha = wisps * (0.18 + rim * 0.82) * uOpacity;
    vec3 color = uMistColor * (0.68 + cloud * 0.62);
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const spiritParticleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uMotion;
  uniform vec3 uFocus;

  attribute float aSize;
  attribute float aPhase;
  attribute float aDrift;

  varying float vWarmth;
  varying float vPulse;

  void main() {
    vec3 focus = normalize(uFocus + vec3(0.0001));
    vec3 reference = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), step(0.88, abs(focus.y)));
    vec3 basisA = normalize(cross(focus, reference));
    vec3 basisB = normalize(cross(focus, basisA));

    float time = uTime * uMotion;
    vec3 p = position;
    vec3 tangent = normalize(cross(normalize(p), vec3(0.13, 1.0, 0.21)) + vec3(0.0001));
    p += tangent * sin(time * (0.18 + aDrift * 0.22) + aPhase * 6.28318) * (0.025 + aDrift * 0.055);

    float angle = aPhase * 37.6991 + time * (0.28 + aDrift * 0.34);
    float orbitRadius = 0.12 + fract(aPhase * 17.13) * 0.42;
    vec3 focusOrbit = focus * (2.23 + sin(angle * 0.37) * 0.09)
      + basisA * cos(angle) * orbitRadius
      + basisB * sin(angle) * orbitRadius;
    float focusMix = smoothstep(0.79, 0.995, aDrift) * 0.88;
    p = mix(p, focusOrbit, focusMix);

    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    float perspective = 11.0 / max(-viewPosition.z, 0.25);
    float pulse = 0.72 + 0.28 * sin(time * 1.6 + aPhase * 31.0);
    gl_PointSize = clamp(aSize * uPixelRatio * perspective * pulse, 1.0, 7.0 * uPixelRatio);
    gl_Position = projectionMatrix * viewPosition;
    vWarmth = aPhase;
    vPulse = pulse;
  }
`;

export const spiritParticleFragmentShader = /* glsl */ `
  varying float vWarmth;
  varying float vPulse;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float radius = length(centered) * 2.0;
    if (radius > 1.0) {
      discard;
    }
    float core = 1.0 - smoothstep(0.02, 0.42, radius);
    float halo = 1.0 - smoothstep(0.12, 1.0, radius);
    float alpha = (core + halo * 0.42) * (0.52 + vPulse * 0.48);
    vec3 malachite = vec3(0.22, 0.72, 0.67);
    vec3 gilt = vec3(1.34, 0.82, 0.24);
    vec3 color = mix(malachite, gilt, smoothstep(0.18, 0.82, vWarmth));
    color *= core * 1.45 + halo * 0.92;
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface FilmGrainVignetteUniforms {
  readonly tDiffuse: IUniform<null>;
  readonly uTime: IUniform<number>;
  readonly uGrainAmount: IUniform<number>;
  readonly uVignette: IUniform<number>;
}

/** A single restrained full-screen pass, keeping post-processing cost bounded. */
export const filmGrainVignetteShader: {
  uniforms: FilmGrainVignetteUniforms;
  vertexShader: string;
  fragmentShader: string;
} = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrainAmount: { value: 0.035 },
    uVignette: { value: 0.42 },
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
    uniform float uGrainAmount;
    uniform float uVignette;
    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec4 source = texture2D(tDiffuse, vUv);
      float grain = hash12(gl_FragCoord.xy + vec2(uTime * 43.17, -uTime * 27.91)) - 0.5;
      vec2 centered = vUv * 2.0 - 1.0;
      float edge = smoothstep(0.24, 1.38, dot(centered, centered));
      vec3 color = source.rgb + grain * uGrainAmount;
      color *= 1.0 - edge * uVignette;
      gl_FragColor = vec4(color, source.a);
    }
  `,
};
