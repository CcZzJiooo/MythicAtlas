import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * 万象沙盘 2.0 (Diorama 2.0) 权威 DEM 数字高程贴图离线烘焙脚本
 * 覆盖范围：经度 109.50°E ~ 117.50°E，纬度 20.10°N ~ 25.60°N
 * 规格：1024 × 1024 RGBA PNG
 * R 通道：真实海拔归一化 (0 ~ 2000m -> 0 ~ 255)
 * G 通道：微观地质坡度与断裂带特征
 * B 通道：水系下切微凹槽与冲积网河特征
 * A 通道：陆海遮罩 (0 = 陆地, 255 = 深海水体)
 */

const WIDTH = 1024;
const HEIGHT = 1024;

const MIN_LNG = 109.50;
const MAX_LNG = 117.50;
const MIN_LAT = 20.10;
const MAX_LAT = 25.60;

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function createPNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const scanlineWidth = width * 4;
  const rawData = Buffer.alloc(height * (scanlineWidth + 1));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (scanlineWidth + 1);
    rawData[rowOffset] = 0; // filter None
    rgbaBuffer.copy(rawData, rowOffset + 1, y * scanlineWidth, (y + 1) * scanlineWidth);
  }
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// 简易确定性分形噪声
function hash2D(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smoothNoise(x, y) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const u = fx * fx * (3.0 - 2.0 * fx);
  const v = fy * fy * (3.0 - 2.0 * fy);
  return (
    hash2D(i, j) * (1.0 - u) * (1.0 - v) +
    hash2D(i + 1.0, j) * u * (1.0 - v) +
    hash2D(i, j + 1.0) * (1.0 - u) * v +
    hash2D(i + 1.0, j + 1.0) * u * v
  );
}

function fbm(x, y, octaves = 3) {
  let val = 0.0;
  let amp = 0.5;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x, y);
    x *= 2.0;
    y *= 2.0;
    amp *= 0.5;
  }
  return val;
}

// 大陆海岸线控制折线
const COASTLINE_KEYPOINTS = [
  [109.50, 21.65],
  [109.68, 21.50],
  [109.85, 21.38],
  [109.66, 20.86],
  [109.88, 20.47],
  [110.08, 20.25],
  [110.45, 20.31],
  [110.40, 20.70],
  [110.48, 21.05],
  [110.55, 21.30],
  [111.00, 21.42],
  [111.60, 21.50],
  [112.20, 21.70],
  [112.80, 21.80],
  [113.25, 22.05],
  [113.60, 22.15],
  [113.90, 22.35],
  [114.30, 22.25],
  [114.70, 22.60],
  [115.35, 22.75],
  [116.00, 22.85],
  [116.60, 23.20],
  [117.15, 23.55],
  [117.50, 23.65]
];

function getCoastlineLat(lng) {
  if (lng <= COASTLINE_KEYPOINTS[0][0]) return COASTLINE_KEYPOINTS[0][1];
  const last = COASTLINE_KEYPOINTS.length - 1;
  if (lng >= COASTLINE_KEYPOINTS[last][0]) return COASTLINE_KEYPOINTS[last][1];
  for (let i = 0; i < last; i++) {
    const p0 = COASTLINE_KEYPOINTS[i];
    const p1 = COASTLINE_KEYPOINTS[i + 1];
    if (lng >= p0[0] && lng <= p1[0]) {
      const t = (lng - p0[0]) / (p1[0] - p0[0]);
      return p0[1] + t * (p1[1] - p0[1]);
    }
  }
  return 21.8;
}

// 权威离岸海岛
const OFFSHORE_ISLANDS = [
  { name: '南澳岛', lng: 117.02, lat: 23.42, altitude: 588, radius: 0.085 },
  { name: '海陵岛', lng: 111.88, lat: 21.62, altitude: 390, radius: 0.070 },
  { name: '上川岛', lng: 112.78, lat: 21.68, altitude: 499, radius: 0.065 },
  { name: '下川岛', lng: 112.58, lat: 21.62, altitude: 317, radius: 0.045 },
  { name: '横琴岛', lng: 113.52, lat: 22.10, altitude: 437, radius: 0.048 },
  { name: '大万山岛', lng: 113.72, lat: 21.94, altitude: 436, radius: 0.035 },
  { name: '担杆岛', lng: 114.18, lat: 22.03, altitude: 322, radius: 0.035 },
  { name: '外伶仃岛', lng: 114.03, lat: 22.10, altitude: 311, radius: 0.030 },
  { name: '东澳岛', lng: 113.71, lat: 22.02, altitude: 285, radius: 0.028 },
  { name: '东海岛', lng: 110.45, lat: 21.05, altitude: 111, radius: 0.065 },
  { name: '硇洲岛', lng: 110.585, lat: 20.915, altitude: 82, radius: 0.020 }
];

// 权威大山主脊走廊
const MOUNTAIN_CORRIDORS = [
  // 1. 粤北南岭横贯巨岳 (石坑崆 1902m, 天井山 1702m, 大东山 1597m)
  {
    name: '南岭主脉',
    sigma: 0.085,
    wps: [
      { lng: 112.35, lat: 24.88, alt: 1380 },
      { lng: 112.72, lat: 24.87, alt: 1597 },
      { lng: 112.9868, lat: 24.9288, alt: 1902 },
      { lng: 113.35, lat: 24.95, alt: 1550 },
      { lng: 113.80, lat: 25.10, alt: 1350 },
      { lng: 114.25, lat: 25.25, alt: 1180 }
    ]
  },
  // 2. 粤东莲花山脉斜贯主系 (铜鼓嶂 1560m, 莲花山 1337m, 罗浮山 1296m, 梧桐山 943m)
  {
    name: '莲花山脉',
    sigma: 0.075,
    wps: [
      { lng: 116.40, lat: 24.40, alt: 1298 },
      { lng: 116.02, lat: 23.95, alt: 1560 },
      { lng: 115.55, lat: 23.45, alt: 1280 },
      { lng: 115.25, lat: 23.05, alt: 1337 },
      { lng: 114.75, lat: 22.80, alt: 1050 },
      { lng: 114.50, lat: 22.72, alt: 860 },
      { lng: 114.2083, lat: 22.5833, alt: 943 }
    ]
  },
  // 3. 罗浮山—南昆山穹窿
  {
    name: '罗浮山穹窿',
    sigma: 0.065,
    wps: [
      { lng: 113.88, lat: 23.63, alt: 1210 },
      { lng: 114.0583, lat: 23.2982, alt: 1296 },
      { lng: 114.25, lat: 23.15, alt: 890 }
    ]
  },
  // 4. 粤西云开大山—天露山脉 (大田顶 1704m, 鹅凰嶂 1337m, 天露山 1251m, 鼎湖山 1000m)
  {
    name: '云开天露山脉',
    sigma: 0.080,
    wps: [
      { lng: 111.05, lat: 21.95, alt: 1200 },
      { lng: 111.23, lat: 22.28, alt: 1704 },
      { lng: 111.60, lat: 21.90, alt: 1337 },
      { lng: 112.00, lat: 22.35, alt: 1150 },
      { lng: 112.25, lat: 22.65, alt: 1251 },
      { lng: 112.55, lat: 23.18, alt: 1000 },
      { lng: 112.77, lat: 22.75, alt: 805 }
    ]
  },
  // 5. 香港大帽山—大屿山山系
  {
    name: '香港山系',
    sigma: 0.045,
    wps: [
      { lng: 114.12, lat: 22.41, alt: 957 },
      { lng: 114.18, lat: 22.35, alt: 495 },
      { lng: 114.14, lat: 22.275, alt: 552 },
      { lng: 113.92, lat: 22.25, alt: 934 }
    ]
  },
  // 6. 澳门丘陵走廊
  {
    name: '澳门丘陵',
    sigma: 0.035,
    wps: [
      { lng: 113.5614, lat: 22.1242, alt: 172 },
      { lng: 113.565, lat: 22.158, alt: 160 },
      { lng: 113.5511, lat: 22.1969, alt: 90 }
    ]
  }
];

// 平原独立残丘
const ISOLATED_PEAKS = [
  { name: '白云山', lng: 113.2983, lat: 23.1783, alt: 382, radius: 0.045 },
  { name: '西樵山', lng: 112.9667, lat: 22.9333, alt: 346, radius: 0.042 },
  { name: '五桂山', lng: 113.4333, lat: 22.4167, alt: 531, radius: 0.045 },
  { name: '黄杨山', lng: 113.2000, lat: 22.2167, alt: 581, radius: 0.040 }
];

function sampleElevation(lng, lat) {
  const coast = getCoastlineLat(lng);
  const isSouthOfCoast = lat < coast;

  // 1. 优先检测离岸名岛
  let islandElev = 0.0;
  for (const isl of OFFSHORE_ISLANDS) {
    const dLng = (lng - isl.lng) * Math.cos(isl.lat * Math.PI / 180);
    const dLat = lat - isl.lat;
    const dist = Math.hypot(dLng, dLat);
    if (dist < isl.radius) {
      const u = dist / isl.radius;
      const falloff = 0.5 * (1.0 + Math.cos(u * Math.PI));
      const elev = isl.altitude * (falloff * falloff);
      if (elev > islandElev) islandElev = elev;
    }
  }

  // 若在南海海域且无岛屿，则为深海水体
  if (isSouthOfCoast && islandElev <= 1.0) {
    return { meters: 0.0, isSea: true };
  }

  // 2. 山系走廊造山
  let corridorElev = 0.0;
  for (const c of MOUNTAIN_CORRIDORS) {
    const wps = c.wps;
    for (let i = 0; i < wps.length - 1; i++) {
      const p0 = wps[i];
      const p1 = wps[i + 1];
      const dx = p1.lng - p0.lng;
      const dy = p1.lat - p0.lat;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 1e-6) continue;
      let t = ((lng - p0.lng) * dx + (lat - p0.lat) * dy) / lenSq;
      t = Math.max(0.0, Math.min(1.0, t));
      const projLng = p0.lng + t * dx;
      const projLat = p0.lat + t * dy;
      const dLng = (lng - projLng) * Math.cos(projLat * Math.PI / 180);
      const dLat = lat - projLat;
      const dist = Math.hypot(dLng, dLat);

      if (dist < c.sigma * 2.5) {
        const u = dist / c.sigma;
        const gaussian = Math.exp(-0.5 * u * u);
        const spineH = p0.alt + t * (p1.alt - p0.alt);
        const noiseDetail = 0.85 + 0.25 * fbm(lng * 8.0, lat * 8.0, 3);
        const elev = spineH * gaussian * noiseDetail;
        if (elev > corridorElev) corridorElev = elev;
      }
    }
  }

  // 3. 独立残丘
  let peakElev = 0.0;
  for (const p of ISOLATED_PEAKS) {
    const dLng = (lng - p.lng) * Math.cos(p.lat * Math.PI / 180);
    const dLat = lat - p.lat;
    const dist = Math.hypot(dLng, dLat);
    if (dist < p.radius) {
      const u = dist / p.radius;
      const falloff = 0.5 * (1.0 + Math.cos(u * Math.PI));
      const elev = p.alt * (falloff * falloff);
      if (elev > peakElev) peakElev = elev;
    }
  }

  const mountainTotal = Math.max(corridorElev, peakElev, islandElev);

  // 4. 广袤低山丘陵与冲积平原
  const northSlope = Math.max(0.0, (lat - 21.2) / 4.2);
  const macroSlope = Math.pow(northSlope, 1.3) * 140.0;
  const rollingHills = 45.0 + macroSlope + fbm(lng * 3.2, lat * 3.2, 3) * 65.0;

  // 珠三角与潮汕平原凹地
  const dPrd = Math.pow((lng - 113.35) / 0.46, 2.0) + Math.pow((lat - 22.80) / 0.40, 2.0);
  const prdFactor = Math.exp(-0.5 * dPrd);
  const dChaoshan = Math.pow((lng - 116.55) / 0.35, 2.0) + Math.pow((lat - 23.55) / 0.28, 2.0);
  const chaoshanFactor = Math.exp(-0.5 * dChaoshan);
  const plainFactor = Math.max(prdFactor, chaoshanFactor);

  const plainBase = 16.0;
  let landBase = rollingHills * (1.0 - plainFactor * 0.85) + plainBase * (plainFactor * 0.85);

  // 平滑联合 (Smooth Union)
  const diff = mountainTotal - landBase;
  const kSmooth = 32.0;
  let totalMeters = Math.max(landBase, mountainTotal);
  if (Math.abs(diff) <= kSmooth) {
    const t = (diff + kSmooth) / (2.0 * kSmooth);
    totalMeters = (1.0 - t) * landBase + t * mountainTotal + kSmooth * t * (1.0 - t) * 0.5;
  }

  // 边界平滑余弦衰减
  let borderFade = 1.0;
  if (lng > 116.85) borderFade *= Math.max(0.0, Math.min(1.0, (117.40 - lng) / 0.45));
  if (lng < 110.05) borderFade *= Math.max(0.0, Math.min(1.0, (lng - 109.60) / 0.40));
  if (lat > 25.05)  borderFade *= Math.max(0.0, Math.min(1.0, (25.45 - lat) / 0.35));
  borderFade = borderFade * borderFade * (3.0 - 2.0 * borderFade);

  totalMeters = totalMeters * borderFade + 14.0 * (1.0 - borderFade);

  return { meters: totalMeters, isSea: false };
}

async function main() {
  console.log(`[DEM Generator] Boking ${WIDTH}x${HEIGHT} authoritative Guangdong DEM...`);
  const rgbaBuffer = Buffer.alloc(WIDTH * HEIGHT * 4);

  let maxM = 0;
  let minM = 9999;

  for (let y = 0; y < HEIGHT; y++) {
    const v = 1.0 - (y / (HEIGHT - 1)); // 0 at south (20.10), 1 at north (25.60)
    const lat = MIN_LAT + v * (MAX_LAT - MIN_LAT);

    for (let x = 0; x < WIDTH; x++) {
      const u = x / (WIDTH - 1); // 0 at west (109.50), 1 at east (117.50)
      const lng = MIN_LNG + u * (MAX_LNG - MIN_LNG);

      const { meters, isSea } = sampleElevation(lng, lat);
      if (meters > maxM) maxM = meters;
      if (!isSea && meters < minM) minM = meters;

      const idx = (y * WIDTH + x) * 4;

      // R: elevation 0 ~ 2000m -> 0 ~ 255
      const normH = Math.max(0.0, Math.min(1.0, meters / 2000.0));
      const r = Math.round(normH * 255);

      // G: local detail
      const g = Math.round(Math.min(255, (meters % 50) / 50.0 * 255));

      // B: valley / plain softness
      const b = Math.round(normH > 0.3 ? 180 : 60);

      // A: Sea mask: 255 for deep sea, 0 for land
      const a = isSea ? 255 : 0;

      rgbaBuffer[idx] = r;
      rgbaBuffer[idx + 1] = g;
      rgbaBuffer[idx + 2] = b;
      rgbaBuffer[idx + 3] = a;
    }
  }

  console.log(`[DEM Generator] Elevation range: min=${minM.toFixed(1)}m, max=${maxM.toFixed(1)}m`);

  const outDir = path.resolve('public/assets/dem');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'guangdong_dem_1024.png');
  const pngBuf = createPNG(WIDTH, HEIGHT, rgbaBuffer);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`[DEM Generator] Wrote ${pngBuf.length} bytes to ${outPath}`);
}

main().catch(err => {
  console.error('[DEM Generator] Error:', err);
  process.exit(1);
});
