import * as THREE from 'three';
import { WORLD_COUNTRIES_GEO } from './worldCountriesGeo';
import { CHINA_PROVINCES_GEO, GUANGDONG_CITIES_GEO } from './chinaRegionalGeo';
import { MOUNTAIN_BUMPS } from './worldGeoData';

/**
 * 4096×2048 超高清全球地理多级渐进式地文与山海青绿金箔纹理生成器
 * Ultra-HD (4096x2048) Progressive LOD Mythic Silk Earth Texture Generator
 * 包含：全球199国高精板块、中国34省份金丝界线、广东21地市微观地级市界、高密度山脉等高地文与江河水系
 */
export function generateMythicEarthTexture(): THREE.CanvasTexture {
  const width = 4096;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // 1. 深邃青金石与群青深海基底 (Deep Lapis Lazuli & Celestial Indigo Gradient)
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0.0, '#02060F'); // 北极深邃星海
  oceanGrad.addColorStop(0.18, '#041021');
  oceanGrad.addColorStop(0.5, '#082038');  // 赤道温润碧海
  oceanGrad.addColorStop(0.82, '#041021');
  oceanGrad.addColorStop(1.0, '#02060F'); // 南极冰洋
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 宋代古法水波微澜水纹理 (Fine Silk Water Weave)
  ctx.fillStyle = 'rgba(21, 67, 96, 0.08)';
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 2);
  }

  // 坐标映射公式 (Equirectangular WGS84 Projection):
  // Longitude [-180, 180] -> [0, width]
  // Latitude [90, -90] -> [0, height]
  const toX = (lng: number) => ((lng + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // 2. 经纬度金丝罗盘网格 (Celestial Astrolabe Graticule - 极细半透明海洋网格)
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
  ctx.lineWidth = 0.8;
  for (let lng = -180; lng <= 180; lng += 30) {
    ctx.beginPath();
    ctx.moveTo(toX(lng), 0);
    ctx.lineTo(toX(lng), height);
    ctx.stroke();
  }
  for (let lat = -90; lat <= 90; lat += 30) {
    ctx.beginPath();
    ctx.moveTo(0, toY(lat));
    ctx.lineTo(width, toY(lat));
    ctx.stroke();
  }

  /**
   * 绘制闭合多边形 (矢量多边形高清渲染)
   */
  const drawPolygon = (
    coords: [number, number][],
    fillColor = '#1A4331',
    strokeColor = 'rgba(212, 175, 55, 0.45)',
    lineWidth = 1.2,
    glow = false,
    dashPattern: number[] = []
  ) => {
    if (coords.length < 3) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX(coords[0][0]), toY(coords[0][1]));
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(toX(coords[i][0]), toY(coords[i][1]));
    }
    ctx.closePath();

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    if (glow) {
      ctx.shadowColor = 'rgba(212, 175, 55, 0.6)';
      ctx.shadowBlur = 6;
    }

    if (strokeColor && lineWidth > 0) {
      if (dashPattern.length > 0) {
        ctx.setLineDash(dashPattern);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
    ctx.restore();
  };

  // =========================================================================
  // 第一层：全球 199 个国家宏观大陆板块渲染 (Level 1: Global Continents & 199 Nations)
  // =========================================================================
  for (const country of WORLD_COUNTRIES_GEO) {
    let fillColor = '#173E2D';
    let strokeColor = 'rgba(212, 175, 55, 0.28)';
    let lineWidth = 0.8;

    if (country.name === 'China') {
      fillColor = '#1B4734';
      strokeColor = ''; // 中国使用高精省界与粤境地级市界精准呈现，不绘制低精全球粗描边
      lineWidth = 0.0;
    } else if (country.name === 'Russia') {
      fillColor = '#163829';
      strokeColor = 'rgba(212, 175, 55, 0.28)';
      lineWidth = 0.8;
    } else if (country.name === 'Antarctica') {
      fillColor = '#244840';
      strokeColor = 'rgba(160, 200, 190, 0.35)';
      lineWidth = 0.8;
    }

    for (const ring of country.rings) {
      drawPolygon(ring, fillColor, strokeColor, lineWidth, false, []);
    }
  }

  // =========================================================================
  // 第二层：全球高地山脉自然山体微阴影 (Organic Mountain Shading - 无人造硬边线框)
  // =========================================================================
  MOUNTAIN_BUMPS.forEach(m => {
    if (m.coords.length < 3) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX(m.coords[0][0]), toY(m.coords[0][1]));
    for (let i = 1; i < m.coords.length; i++) {
      ctx.lineTo(toX(m.coords[i][0]), toY(m.coords[i][1]));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(38, 92, 68, 0.18)';
    ctx.fill();
    ctx.restore();
  });

  // =========================================================================
  // 第三层：中国 34 省份/特区金丝界线 (Level 2: 华美耀目大省轮廓金边)
  // =========================================================================
  for (const prov of CHINA_PROVINCES_GEO) {
    for (const ring of prov.rings) {
      if (ring.length < 5) continue;
      drawPolygon(ring, 'rgba(28, 64, 48, 0.08)', 'rgba(243, 196, 18, 0.70)', 1.2, false, []);
    }
  }

  // =========================================================================
  // 第四层：广东省 21 地级市与港澳特区高精度微观行政区划 (Level 3: 省内地级市月白银丝细线)
  // =========================================================================
  for (const city of GUANGDONG_CITIES_GEO) {
    if (city.name === '香港' || city.name === '澳门') {
      // 港澳特区：全量多岛屿坚实青绿陆地基底与华美金丝包边
      for (const ring of city.rings) {
        if (ring.length >= 4) {
          drawPolygon(ring, '#1B4734', 'rgba(243, 196, 18, 0.65)', 0.9, false, []);
        }
      }
    } else {
      // 广东 21 地级市：内部区划以清晰月白银丝细线勾勒，层次分明
      for (const ring of city.rings) {
        if (ring.length >= 6) {
          drawPolygon(ring, 'rgba(25, 65, 50, 0.04)', 'rgba(226, 232, 240, 0.38)', 0.8, false, []);
        }
      }
    }
  }

  // =========================================================================
  // 第六层：山海经古雅金粉星屑 (Traditional Mineral Gold Flecks)
  // =========================================================================
  ctx.fillStyle = 'rgba(255, 235, 150, 0.7)';
  const seed = 12345;
  for (let i = 0; i < 600; i++) {
    const x = ((Math.sin(seed + i * 1.7) * 43758.5453) % 1) * width;
    const y = ((Math.cos(seed + i * 2.3) * 43758.5453) % 1) * height;
    const size = 0.6 + ((i % 3) * 0.5);
    ctx.beginPath();
    ctx.arc(Math.abs(x), Math.abs(y), size, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * 4096×2048 超高清地表地形与山脉凹凸法线贴图 (Ultra-HD 3D Topography Bump Map)
 */
export function generateEarthBumpTexture(): THREE.CanvasTexture {
  const width = 4096;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // 海洋深度基准 (深灰基底)
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  const toX = (lng: number) => ((lng + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  const drawBumpLand = (coords: [number, number][], heightHex = '#424242') => {
    if (coords.length < 3) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX(coords[0][0]), toY(coords[0][1]));
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(toX(coords[i][0]), toY(coords[i][1]));
    }
    ctx.closePath();
    ctx.fillStyle = heightHex;
    ctx.fill();
    ctx.restore();
  };

  // 1. 全球所有陆地基础高程
  for (const country of WORLD_COUNTRIES_GEO) {
    for (const ring of country.rings) {
      drawBumpLand(ring, '#484848');
    }
  }

  // 2. 中国与广东及港澳陆地微凸
  for (const prov of CHINA_PROVINCES_GEO) {
    for (const ring of prov.rings) {
      drawBumpLand(ring, '#565656');
    }
  }
  for (const city of GUANGDONG_CITIES_GEO) {
    if (city.name === '香港' || city.name === '澳门') {
      for (const ring of city.rings) {
        drawBumpLand(ring, '#565656');
      }
    }
  }

  // 3. 世界名山与青藏/南岭/天山高耸山脉真实 3D 凹凸立体高程
  MOUNTAIN_BUMPS.forEach(m => {
    if (m.coords.length < 3) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX(m.coords[0][0]), toY(m.coords[0][1]));
    for (let i = 1; i < m.coords.length; i++) {
      ctx.lineTo(toX(m.coords[i][0]), toY(m.coords[i][1]));
    }
    ctx.closePath();
    ctx.filter = `blur(${m.blurRadius * 2}px)`;
    const grayVal = Math.floor(85 + m.heightIntensity * 155);
    ctx.fillStyle = `rgb(${grayVal}, ${grayVal}, ${grayVal})`;
    ctx.fill();
    ctx.restore();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * 真实大气云层贴图生成器 (Atmospheric Dynamic Clouds)
 */
export function generateCloudTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // 绘制柔和羽化环形云絮 (Soft Feathered Planetary Cloud Wisps - 杜绝任何斜向硬条纹)
  for (let i = 0; i < 48; i++) {
    const cx = Math.random() * width;
    const cy = 200 + Math.random() * 624;
    const r = 80 + Math.random() * 160;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
    grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.06)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
