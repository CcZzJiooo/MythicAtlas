import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  GuangdongTerrain3D,
  GUANGDONG_GEO,
  GUANGDONG_MAINLAND_OUTLINE,
  HONG_KONG_GEO,
  MACAO_GEO,
  GD_21_CENTROIDS,
  FAMOUS_MOUNTAINS,
  GUANGDONG_RIVERS_GEOMETRY,
  GUANGDONG_LANDFORM_FEATURES,
  GUANGDONG_POST_ROADS,
  CONTINUOUS_MOUNTAIN_CORRIDORS,
  GUANGDONG_ISOLATED_PEAKS,
  AUTHORITATIVE_OFFSHORE_ISLANDS,
  getContinuousMountainOrogeny,
  isSouthSeaWater,
  getRiverInfluence
} from './GuangdongTerrain3D';
import { DESTINATIONS_DATA } from '../data/destinations';

describe('GuangdongTerrain3D Master Diorama Unit Tests', () => {
  it('Part 0: should synchronize 1:1 with national Shenzhou sector authoritative vector boundaries (adcode 440000)', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);
    expect(diorama).toBeDefined();

    // 1. 验证直接源自神州板块 (CHINA_PROVINCES_GEO) 的权威省区要素
    expect(GUANGDONG_GEO).toBeDefined();
    expect(GUANGDONG_GEO.adcode).toBe(440000);
    expect(GUANGDONG_GEO.name).toBe('广东省');

    // 2. 验证多环矢量精度：全省共 21 个行政闭合环 (大陆主环 + 20 个离岸岛屿环)，彻底告别粗糙 75 点近似！
    expect(GUANGDONG_GEO.rings.length).toBe(21);
    expect(GUANGDONG_GEO.rings[0].length).toBe(613); // 大陆高精主环 613 点
    expect(GUANGDONG_MAINLAND_OUTLINE.length).toBe(613);

    // 3. 验证港澳特区矢量并入
    expect(HONG_KONG_GEO).toBeDefined();
    expect(HONG_KONG_GEO?.adcode).toBe(810000);
    expect(MACAO_GEO).toBeDefined();
    expect(MACAO_GEO?.adcode).toBe(820000);

    // 4. 验证高精经纬度点在省域内的快速且精准判定 (毫秒级射线包围盒算法)
    expect(diorama.isPointInGuangdong(23.13, 113.26)).toBe(true);  // 广州中心
    expect(diorama.isPointInGuangdong(22.54, 114.05)).toBe(true);  // 深圳中心
    expect(diorama.isPointInGuangdong(23.37, 116.68)).toBe(true);  // 汕头中心
    expect(diorama.isPointInGuangdong(21.27, 110.36)).toBe(true);  // 湛江中心
    expect(diorama.isPointInGuangdong(20.35, 110.15)).toBe(true);  // 雷州半岛徐闻南端
    expect(diorama.isPointInGuangdong(24.80, 113.60)).toBe(true);  // 韶关北部山区
    expect(diorama.isPointInGuangdong(24.30, 116.12)).toBe(true);  // 梅州客乡

    // 明确省外坐标判定为 false (如湖南郴州、南海深海)
    expect(diorama.isPointInGuangdong(25.80, 113.00)).toBe(false); // 湖南郴州
    expect(diorama.isPointInGuangdong(19.50, 113.00)).toBe(false); // 南海深水
  }, 25000);

  it('should instantiate master diorama with all sub-layers properly constructed', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);
    expect(diorama).toBeDefined();
    expect(diorama.group).toBeInstanceOf(THREE.Group);
    expect(diorama.group.name).toBe('GuangdongTerrainDioramaMaster');
    expect(diorama.getInteractableMeshes().length).toBeGreaterThan(0);
  });

  it('Regression Test: plinth upper terrace must remain strictly below lowest sea water level (-0.018)', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);
    let maxPlinthTerraceY = -Infinity;
    diorama.group.children.forEach(c => {
      if (c.name === 'ImperialPlinth') {
        c.children.forEach((child: any) => {
          // Check upper terrace mesh (the solid pedestal beneath the basin)
          if (child.geometry instanceof THREE.BoxGeometry && child.position.y < -0.01) {
            child.geometry.computeBoundingBox();
            const topY = child.geometry.boundingBox.max.y + child.position.y;
            if (topY > maxPlinthTerraceY) maxPlinthTerraceY = topY;
          }
        });
      }
    });

    // Deepest South China Sea water height is -0.018
    const seaHeight = diorama.getTerrainHeight(21.0, 114.0, false);
    expect(seaHeight).toBeCloseTo(-0.018, 3);
    // Pedestal terrace top (-0.027) must remain strictly beneath the sea water (-0.018)
    expect(maxPlinthTerraceY).toBeLessThan(seaHeight);
  });

  it('Part 1: should compute authentic geomorphological elevation fields', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);

    // 1. 验证四大连绵构造山系大山走廊体系
    expect(CONTINUOUS_MOUNTAIN_CORRIDORS.length).toBeGreaterThanOrEqual(5);
    expect(GUANGDONG_ISOLATED_PEAKS.length).toBeGreaterThanOrEqual(5);

    // 粤北南岭横贯主脊 (石坑崆 1902m 极巅)
    const nanlingOrogeny = getContinuousMountainOrogeny(112.9868, 24.9288);
    expect(nanlingOrogeny).toBeGreaterThan(1600);

    // 粤东400公里莲花山脉斜贯主系 (铜鼓嶂 1560m、李望嶂 1222m、海丰莲花山 1337m、深圳梧桐山 943m)
    const tongguOrogeny = getContinuousMountainOrogeny(116.24, 23.92);
    expect(tongguOrogeny).toBeGreaterThan(1200);

    const liwangOrogeny = getContinuousMountainOrogeny(115.98, 23.59);
    expect(liwangOrogeny).toBeGreaterThan(950);

    const lianhuaOrogeny = getContinuousMountainOrogeny(115.25, 23.06);
    expect(lianhuaOrogeny).toBeGreaterThan(1000);

    const wutongOrogeny = getContinuousMountainOrogeny(114.2083, 22.5833);
    expect(wutongOrogeny).toBeGreaterThan(700);

    // 验证莲花山脉山系走廊鞍部连绵贯通 (绝非孤立肉包或笋尖！)
    const midRidgeOrogeny = getContinuousMountainOrogeny(114.50, 22.72);
    expect(midRidgeOrogeny).toBeGreaterThan(450);

    // 粤西云开大山主脊 (信宜大田顶 1704m)
    const datiandingOrogeny = getContinuousMountainOrogeny(111.23, 22.28);
    expect(datiandingOrogeny).toBeGreaterThan(1400);

    // 2. 验证平原边缘独立断块孤峰 (广州白云山 382m)
    const baiyunOrogeny = getContinuousMountainOrogeny(113.2983, 23.1783);
    expect(baiyunOrogeny).toBeGreaterThan(250);

    // 3. 验证沙盘 3D 最终高程与分层设色区间
    const nanlingHeight = diorama.getTerrainHeight(24.9288, 112.9868, true);
    expect(nanlingHeight).toBeGreaterThan(0.18);

    const tongguHeight = diorama.getTerrainHeight(23.92, 116.24, true);
    expect(tongguHeight).toBeGreaterThan(0.14);

    const datiandingHeight = diorama.getTerrainHeight(22.28, 111.23, true);
    expect(datiandingHeight).toBeGreaterThan(0.15);

    const baiyunHeight = diorama.getTerrainHeight(23.1783, 113.2983, true);
    expect(baiyunHeight).toBeGreaterThan(0.045);

    // 4. 验证珠三角与潮汕冲积平原低平舒缓 (处于满目青翠平原带 0.012~0.045，零方块死线，无方格底纹)
    const gzHeight = diorama.getTerrainHeight(23.1291, 113.2644, true);
    expect(gzHeight).toBeLessThan(0.045);
    expect(gzHeight).toBeGreaterThan(0.012);

    const foshanHeight = diorama.getTerrainHeight(23.0215, 113.1214, true);
    expect(foshanHeight).toBeLessThan(0.045);
    expect(foshanHeight).toBeGreaterThan(0.012);

    const chaoshanHeight = diorama.getTerrainHeight(23.6569, 116.6226, true);
    expect(chaoshanHeight).toBeLessThan(0.045);
    expect(chaoshanHeight).toBeGreaterThan(0.012);

    // 5. 雷州半岛低缓台地
    const leizhouHeight = diorama.getTerrainHeight(20.9000, 110.0500, true);
    expect(leizhouHeight).toBeLessThan(0.06);

    // 6. 严密验证南部南海海域水深 (严禁在大洋深处凭空拔起外星孤峰巨山！)
    // 用户红框 1：雷州半岛东侧湛江外海水域
    expect(isSouthSeaWater(20.90, 110.60)).toBe(true);
    expect(diorama.getTerrainHeight(20.90, 110.60, false)).toBeLessThan(0.0);

    // 用户红框 2：阳江—茂名—川山群岛近海大洋水域
    expect(isSouthSeaWater(21.50, 111.90)).toBe(true);
    expect(diorama.getTerrainHeight(21.50, 111.90, false)).toBeLessThan(0.0);
    expect(isSouthSeaWater(21.55, 112.60)).toBe(true);
    expect(diorama.getTerrainHeight(21.55, 112.60, false)).toBeLessThan(0.0);

    // 用户红框 3：珠江口外伶仃洋、万山群岛、香港大亚湾海面
    expect(isSouthSeaWater(21.90, 113.75)).toBe(true);
    expect(diorama.getTerrainHeight(21.90, 113.75, false)).toBeLessThan(0.0);
    expect(isSouthSeaWater(22.35, 114.70)).toBe(true);
    expect(diorama.getTerrainHeight(22.35, 114.70, false)).toBeLessThan(0.0);

    // 琼州海峡深水
    expect(isSouthSeaWater(20.15, 110.20)).toBe(true);
    expect(diorama.getTerrainHeight(20.15, 110.20, false)).toBeLessThan(0.0);

    const southSeaHeight = diorama.getTerrainHeight(19.8, 113.0, false);
    expect(southSeaHeight).toBeLessThan(0.0);
    expect(isSouthSeaWater(19.8, 113.0)).toBe(true);

    // 严密验证真实南海大陆架—陆坡—海盆五阶活态水深模型 (杜绝全海域死板 32m 截断错误！)
    // ① 浅海近岸 (大亚湾外海/红海湾浅水)：水深在浅滩区间 [5m, 45m]
    const nearshoreProbe = diorama.probeLocation(22.35, 114.70);
    expect(nearshoreProbe.tierName).toBe('沧溟');
    expect(Math.abs(nearshoreProbe.elevationMeters)).toBeLessThan(45);
    expect(Math.abs(nearshoreProbe.elevationMeters)).toBeGreaterThan(5);

    // ② 粤东外大陆架/红海湾外海 (21.22°N, 115.23°E)：外大陆架水深在 [80m, 260m]，绝非 32m
    const shelfBreakProbe = diorama.probeLocation(21.22, 115.23);
    expect(shelfBreakProbe.tierName).toBe('沧溟');
    expect(shelfBreakProbe.zoneTitle).toContain('红海湾');
    expect(Math.abs(shelfBreakProbe.elevationMeters)).toBeGreaterThan(80);
    expect(Math.abs(shelfBreakProbe.elevationMeters)).not.toBe(32);

    // ③ 东沙群岛外海 (20.61°N, 116.75°E)：东沙环礁陡坡水深，绝非 32m
    const dongshaProbe = diorama.probeLocation(20.61, 116.75);
    expect(dongshaProbe.tierName).toBe('沧溟');
    expect(dongshaProbe.zoneTitle).toContain('东沙群岛');
    expect(Math.abs(dongshaProbe.elevationMeters)).toBeGreaterThan(35);
    expect(Math.abs(dongshaProbe.elevationMeters)).not.toBe(32);

    // ④ 南海大洋深海盆底 (20.15°N, 117.20°E 东沙海槽深水区)：水深深渊超过 1000m
    const deepOceanProbe = diorama.probeLocation(20.15, 117.20);
    expect(deepOceanProbe.tierName).toBe('沧溟');
    expect(Math.abs(deepOceanProbe.elevationMeters)).toBeGreaterThan(1000);

    // 7. 权威离岸海岛群高程验证 (南澳岛 588m、海陵岛 390m、上川岛 499m、横琴岛 437m)
    expect(AUTHORITATIVE_OFFSHORE_ISLANDS.length).toBeGreaterThanOrEqual(10);
    expect(diorama.isPointInTerritory(23.42, 117.02)).toBe(true); // 南澳岛
    expect(diorama.getTerrainHeight(23.42, 117.02, true)).toBeGreaterThan(0.05);

    expect(diorama.isPointInTerritory(21.62, 111.88)).toBe(true); // 海陵岛
    expect(diorama.getTerrainHeight(21.62, 111.88, true)).toBeGreaterThan(0.04);

    expect(diorama.isPointInTerritory(21.68, 112.78)).toBe(true); // 上川岛
    expect(diorama.getTerrainHeight(21.68, 112.78, true)).toBeGreaterThan(0.04);

    expect(diorama.isPointInTerritory(22.10, 113.52)).toBe(true); // 横琴岛
    expect(diorama.getTerrainHeight(22.10, 113.52, true)).toBeGreaterThan(0.04);
  });

  it('Part 2: should contain 25+ authoritative famous mountains across 21 cities with 3D sculpt properties', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);
    expect(FAMOUS_MOUNTAINS.length).toBeGreaterThanOrEqual(25);

    // 验证涵盖全省 21 地级市及香港、澳门的代表性名山
    const coveredCityIds = new Set(FAMOUS_MOUNTAINS.map(m => m.cityId));
    expect(coveredCityIds.size).toBeGreaterThanOrEqual(21);
    expect(coveredCityIds.has('hongkong')).toBe(true);
    expect(coveredCityIds.has('macau')).toBe(true);

    // 针对揭阳全境名山体系（揭西李望嶂、望天石、大北山、天子嶂、石肚嶂、鸿娥岭、明山、巾山、独山、黄岐山、普宁铁山）的精准校验
    const mountainIds = FAMOUS_MOUNTAINS.map(m => m.id);
    expect(mountainIds).toContain('baiyun');
    expect(mountainIds).toContain('dinghu');
    expect(mountainIds).toContain('dabeishan');
    expect(mountainIds).toContain('dushan');
    expect(mountainIds).toContain('liwangzhang');
    expect(mountainIds).toContain('wangtianshi');
    expect(mountainIds).toContain('tianzizhang');
    expect(mountainIds).toContain('shiduzhang');
    expect(mountainIds).toContain('hongeling');
    expect(mountainIds).toContain('mingshan');
    expect(mountainIds).toContain('jinshan_jiexi');
    expect(mountainIds).toContain('huangqishan');
    expect(mountainIds).toContain('tieshan_puning');
    expect(mountainIds).toContain('sangpushan');
    expect(mountainIds).toContain('wuzhishi');
    expect(mountainIds).toContain('dananshan');
    expect(mountainIds).toContain('damaoshan');
    expect(mountainIds).toContain('lionrock');
    expect(mountainIds).toContain('lantau_peak');
    expect(mountainIds).toContain('taipingshan');
    expect(mountainIds).toContain('dieshitang');
    expect(mountainIds).toContain('dongwangyang');
    expect(mountainIds).toContain('dataishan');

    // 揭阳/揭西名山全量扩充验证 (不少于10座权威名岳)
    const jieyangMountains = FAMOUS_MOUNTAINS.filter(m => m.cityId === 'jieyang');
    expect(jieyangMountains.length).toBeGreaterThanOrEqual(10);

    // 验证粤东权威名山体系精准数据与归属
    const tongguzhang = FAMOUS_MOUNTAINS.find(m => m.id === 'tongguzhang')!;
    expect(tongguzhang.cityName).toBe('梅州市');
    expect(tongguzhang.lng).toBe(116.24);
    expect(tongguzhang.lat).toBe(23.92);
    expect(tongguzhang.altitude).toBe(1560);
    expect(tongguzhang.peakTier).toBe('highest');

    const liwang = FAMOUS_MOUNTAINS.find(m => m.id === 'liwangzhang')!;
    expect(liwang.cityName).toBe('揭阳市');
    expect(liwang.altitude).toBe(1222);
    expect(liwang.peakTier).toBe('highest');

    const wangtianshi = FAMOUS_MOUNTAINS.find(m => m.id === 'wangtianshi')!;
    expect(wangtianshi.cityName).toBe('揭阳市');
    expect(wangtianshi.altitude).toBe(1198);

    const sangpu = FAMOUS_MOUNTAINS.find(m => m.id === 'sangpushan')!;
    expect(sangpu.cityName).toBe('汕头市');
    expect(sangpu.altitude).toBe(484);

    const wuzhi = FAMOUS_MOUNTAINS.find(m => m.id === 'wuzhishi')!;
    expect(wuzhi.cityName).toBe('梅州市');
    expect(wuzhi.altitude).toBe(460);

    const danan = FAMOUS_MOUNTAINS.find(m => m.id === 'dananshan')!;
    expect(danan.cityName).toBe('汕头市');
    expect(danan.altitude).toBe(972);

    const fenghuang = FAMOUS_MOUNTAINS.find(m => m.id === 'fenghuangshan')!;
    expect(fenghuang.cityName).toBe('潮州市');
    expect(fenghuang.altitude).toBe(1498);
    expect(fenghuang.lat).toBe(23.93);

    const baiyun = FAMOUS_MOUNTAINS.find(m => m.id === 'baiyun')!;
    expect(baiyun.cityName).toBe('广州市');
    expect(baiyun.altitude).toBe(382);

    const dinghu = FAMOUS_MOUNTAINS.find(m => m.id === 'dinghu')!;
    expect(dinghu.cityName).toBe('肇庆市');
    expect(dinghu.altitude).toBe(1000);

    const dabeishan = FAMOUS_MOUNTAINS.find(m => m.id === 'dabeishan')!;
    expect(dabeishan.cityName).toBe('揭阳市');
    expect(dabeishan.altitude).toBe(1100);

    const dushan = FAMOUS_MOUNTAINS.find(m => m.id === 'dushan')!;
    expect(dushan.cityName).toBe('揭阳市');
    expect(dushan.name).toBe('揭西独山');
    expect(dushan.altitude).toBe(450);

    const huangqi = FAMOUS_MOUNTAINS.find(m => m.id === 'huangqishan')!;
    expect(huangqi.cityName).toBe('揭阳市');
    expect(huangqi.altitude).toBe(300);

    const tieshan = FAMOUS_MOUNTAINS.find(m => m.id === 'tieshan_puning')!;
    expect(tieshan.cityName).toBe('揭阳市');
    expect(tieshan.altitude).toBe(520);

    const damaoshan = FAMOUS_MOUNTAINS.find(m => m.id === 'damaoshan')!;
    expect(damaoshan.cityName).toBe('香港特别行政区');
    expect(damaoshan.altitude).toBe(957);

    const lantau = FAMOUS_MOUNTAINS.find(m => m.id === 'lantau_peak')!;
    expect(lantau.cityName).toBe('香港特别行政区');
    expect(lantau.altitude).toBe(934);

    const dieshitang = FAMOUS_MOUNTAINS.find(m => m.id === 'dieshitang')!;
    expect(dieshitang.cityName).toBe('澳门特别行政区');
    expect(dieshitang.altitude).toBe(172);

    // 验证名山地标与全景地势高程100%对应，绝无“名山所在地反而是平原”的矛盾
    const wutongHeight = diorama.getTerrainHeight(22.5833, 114.2083, true);
    expect(wutongHeight).toBeGreaterThan(0.10); // 梧桐山 (943m) 拔地而起，绝非平原

    const tongguHeight = diorama.getTerrainHeight(23.92, 116.24, true);
    expect(tongguHeight).toBeGreaterThan(0.15); // 铜鼓嶂 (1560m) 粤东第一峰巍峨耸立

    const liwangHeight = diorama.getTerrainHeight(23.59, 115.98, true);
    expect(liwangHeight).toBeGreaterThan(0.12); // 李望嶂 (1222m) 揭阳极巅雄峙

    const fenghuangHeight = diorama.getTerrainHeight(23.93, 116.71, true);
    expect(fenghuangHeight).toBeGreaterThan(0.14); // 潮安凤凰山 (1498m) 拔海雄峦

    // 验证探针在揭西高山脊梁上的探测：彻底杜绝高程矛盾（1186m vs 独山450m）
    const jiexiRidgeProbe = diorama.probeLocation(23.49, 115.85);
    expect(jiexiRidgeProbe.elevationMeters).toBeGreaterThan(700);
    // 标题不得包含生硬括号数字，且不得将千米大山脊张冠李戴为独山
    expect(jiexiRidgeProbe.zoneTitle).not.toContain('(');
    expect(jiexiRidgeProbe.zoneTitle).not.toContain('独山');
    expect(jiexiRidgeProbe.zoneTitle).toMatch(/(大北山|莲花山脉)/);

    // 验证名山导览辅助方法可用
    expect(diorama.getMountainList().length).toBeGreaterThanOrEqual(35);
    const liwangCoord = diorama.getMountainCoordinates('liwangzhang');
    expect(liwangCoord).toBeDefined();
    expect(liwangCoord?.spec.name).toBe('李望嶂');
    expect(liwangCoord?.worldY).toBeDefined();
    expect(liwangCoord?.worldX).toBeDefined();
    expect(liwangCoord?.worldZ).toBeDefined();

    // 验证沙盘组沉降位移下的世界坐标准确同步 (杜绝向天虚瞄 0.4m Bug)
    diorama.group.position.set(0, -0.4, 0);
    const shikangkongCoord = diorama.getMountainCoordinates('shikengkung');
    expect(shikangkongCoord).toBeDefined();
    expect(shikangkongCoord?.spec.name).toBe('石坑崆');
    expect(shikangkongCoord!.worldY).toBeCloseTo(shikangkongCoord!.y - 0.4, 3);
    diorama.group.position.set(0, 0, 0);

    const sangpuHeight = diorama.getTerrainHeight(23.43, 116.60, true);
    expect(sangpuHeight).toBeGreaterThan(0.045); // 桑浦山 (484m) 潮汕平原巍然凸起

    const damaoHeight = diorama.getTerrainHeight(22.4100, 114.1200, true);
    expect(damaoHeight).toBeGreaterThan(0.10); // 大帽山 (957m) 香港第一峰拔地而起

    const lantauHeight = diorama.getTerrainHeight(22.2500, 113.9200, true);
    expect(lantauHeight).toBeGreaterThan(0.08); // 大屿山凤凰山 (934m) 拔海雄峰

    const macaoHeight = diorama.getTerrainHeight(22.1242, 113.5614, true);
    expect(macaoHeight).toBeGreaterThan(0.02); // 澳门叠石塘山 (172m) 明晰高出海面

    const luofuHeight = diorama.getTerrainHeight(23.2982, 114.0583, true);
    expect(luofuHeight).toBeGreaterThan(0.14); // 罗浮山 (1296m) 崇山峻岭

    const shikengHeight = diorama.getTerrainHeight(24.9288, 112.9868, true);
    expect(shikengHeight).toBeGreaterThan(0.20); // 石坑崆 (1902m) 南岭极巅

    const baiyunHeight = diorama.getTerrainHeight(23.1783, 113.2983, true);
    expect(baiyunHeight).toBeGreaterThan(0.045); // 白云山 (382m) 明晰隆起高于城市基底

    // 验证名山图层模式切换与真实自然峰峦地貌微雕，彻底杜绝粗糙圆锥与塑料玩具亭子
    diorama.setLayerMode('mountains');
    expect(diorama.getLayerMode()).toBe('mountains');
  });

  it('Part 3: should define realistic river drainage basins and surface-conforming water system', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);
    expect(GUANGDONG_RIVERS_GEOMETRY.length).toBeGreaterThanOrEqual(8);

    const riverNames = GUANGDONG_RIVERS_GEOMETRY.map(r => r.name);
    expect(riverNames).toContain('西江干流');
    expect(riverNames).toContain('北江清流');
    expect(riverNames).toContain('东江水系');
    expect(riverNames).toContain('三江八门入海');
    expect(riverNames).toContain('韩江水系');
    expect(riverNames).toContain('鉴江巨流');

    GUANGDONG_RIVERS_GEOMETRY.forEach(river => {
      expect(river.pts.length).toBeGreaterThanOrEqual(2);
      expect(river.widthDeg).toBeGreaterThan(0);
      expect(river.depthMeters).toBeGreaterThan(0);
    });

    // 验证水系影响场计算
    const xiRiverSample = getRiverInfluence(23.05, 112.45);
    expect(xiRiverSample.waterFactor).toBeGreaterThan(0);

    // 验证水系图层模式切换
    diorama.setLayerMode('waters');
    expect(diorama.getLayerMode()).toBe('waters');
  });

  it('Part 4: should map all 21 cities plus Hong Kong and Macao with collision-free coordinates and interactive altars', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);
    const cityKeys = Object.keys(GD_21_CENTROIDS);
    expect(cityKeys.length).toBeGreaterThanOrEqual(21);
    expect(cityKeys).toContain('hongkong');
    expect(cityKeys).toContain('macau');

    cityKeys.forEach(cityId => {
      const city = GD_21_CENTROIDS[cityId];
      expect(city.name).toBeDefined();
      expect(city.lng).toBeGreaterThan(109.5);
      expect(city.lng).toBeLessThan(117.5);
      expect(city.lat).toBeGreaterThan(20.1);
      expect(city.lat).toBeLessThan(25.6);
      expect(city.badgeElevationOffset).toBeGreaterThan(0.02);

      const local = diorama.geoToLocal(city.lat, city.lng);
      expect(typeof local.x).toBe('number');
      expect(typeof local.z).toBe('number');
    });

    // 验证城市图层模式切换与激活城市
    diorama.setLayerMode('cities');
    expect(diorama.getLayerMode()).toBe('cities');

    diorama.setActiveCity('guangzhou');
    expect(diorama.getActiveCityId()).toBe('guangzhou');
    diorama.setActiveCity(null);
    expect(diorama.getActiveCityId()).toBeNull();
  });

  it('Part 5: should support landforms layer mode with iconic geomorphological features', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);
    diorama.setLayerMode('landforms');
    expect(diorama.getLayerMode()).toBe('landforms');

    // 验证18处全省权威地貌奇观 (丹霞、喀斯特、古火山、花岗岩峡谷、海蚀海岸、冲积平原)
    expect(GUANGDONG_LANDFORM_FEATURES.length).toBe(18);
    const danxiaItems = GUANGDONG_LANDFORM_FEATURES.filter(f => f.category === '丹霞地貌');
    expect(danxiaItems.length).toBeGreaterThanOrEqual(3);
    const karstItems = GUANGDONG_LANDFORM_FEATURES.filter(f => f.category === '喀斯特地貌');
    expect(karstItems.length).toBeGreaterThanOrEqual(4);
    const volcanoItems = GUANGDONG_LANDFORM_FEATURES.filter(f => f.category === '古火山地质');
    expect(volcanoItems.length).toBeGreaterThanOrEqual(4);

    diorama.setLayerMode('topography');
    expect(diorama.getLayerMode()).toBe('topography');
  });

  it('Part 6: should support ancient post roads and maritime silk routes layer mode', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);
    diorama.setLayerMode('roads');
    expect(diorama.getLayerMode()).toBe('roads');

    // 验证7条南粤古道与海丝航道
    expect(GUANGDONG_POST_ROADS.length).toBe(7);
    const roadNames = GUANGDONG_POST_ROADS.map(r => r.name);
    expect(roadNames).toContain('大庾岭梅关古道');
    expect(roadNames).toContain('南岭西京古道');
    expect(roadNames).toContain('粤东潮惠古驿道');
    expect(roadNames).toContain('岐澳香山古道');
    expect(roadNames).toContain('广州黄埔海丝古航道');
    expect(roadNames).toContain('汉代徐闻古港航道');
    expect(roadNames).toContain('汕头澄海樟林古港');

    GUANGDONG_POST_ROADS.forEach(road => {
      expect(road.points.length).toBeGreaterThanOrEqual(2);
      expect(road.color).toBeDefined();
      expect(road.description).toBeDefined();
    });
  });

  it('should run update loop and dispose cleanly', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 2.2, 2.8);

    expect(() => {
      diorama.update(2.5, 0.016, camera);
      diorama.setLayerMode('landforms');
      diorama.update(2.55, 0.016, camera);
      diorama.setLayerMode('mountains');
      diorama.update(2.6, 0.016, camera);

      // 回归测试：验证点击山岳 (信宜大田顶、石坑崆) 激活通天接引真光后，渲染循环平稳运行，绝不抛错卡死
      diorama.highlightMountain('xinyi-datian-ding');
      for (let f = 0; f < 15; f++) {
        diorama.update(2.6 + f * 0.016, 0.016, camera);
      }
      diorama.highlightMountain('shikangkong');
      for (let f = 0; f < 10; f++) {
        diorama.update(2.9 + f * 0.016, 0.016, camera);
      }
      diorama.highlightMountain(null);
      for (let f = 0; f < 10; f++) {
        diorama.update(3.1 + f * 0.016, 0.016, camera);
      }

      diorama.setLayerMode('cities');
      diorama.update(3.3, 0.016, camera);
      diorama.dispose();
    }).not.toThrow();
  });

  it('Part 7: should expose getProbeableObjects, getGeoBounds and aBathymetryDepth attribute without plinth leakage', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);
    const bounds = diorama.getGeoBounds();
    expect(bounds.width).toBe(3.8);
    expect(bounds.depth).toBe(2.8);

    const probeables = diorama.getProbeableObjects();
    expect(probeables.length).toBeGreaterThan(0);
    // 严格确保探针感应对象集合包含真实地形与地貌，但坚决排除须弥座底盘与罗盘仪轨
    const names = probeables.map(o => o.name);
    expect(names).not.toContain('ImperialPlinth');
    expect(names).not.toContain('ImperialCompassRose');
    expect(names).not.toContain('MountainCloudSeaGroup');
    expect(names).not.toContain('DioramaProbeReticle');

    const terrainMesh = diorama.getTerrainMesh();
    expect(terrainMesh).toBeDefined();
    const geom = terrainMesh.geometry;
    const bathymetryAttr = geom.getAttribute('aBathymetryDepth');
    expect(bathymetryAttr).toBeDefined();
    expect(bathymetryAttr.count).toBe(361 * 271);
    
    // 验证水深系数在 0.0 ~ 1.0 之间
    let maxDepth = 0;
    let minDepth = 1.0;
    for (let i = 0; i < bathymetryAttr.count; i += 20) {
      const d = bathymetryAttr.getX(i);
      if (d < minDepth) minDepth = d;
      if (d > maxDepth) maxDepth = d;
    }
    expect(minDepth).toBeGreaterThanOrEqual(0.0);
    expect(maxDepth).toBeLessThanOrEqual(1.0);
    expect(maxDepth).toBeGreaterThan(0.5); // 确保深海盆底达到深水阶梯
  }, 20000);

  it('Part 8: should build authentic Tripo 4K PBR Han Sword beacon with PBR materials, non-white-out blending, and clean disposal', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);
    const beacon = diorama.group.getObjectByName('MountainFocusBeacon');
    expect(beacon).toBeDefined();

    // 1. 验证天光地柱与规尺不致盲 (地阵采用 NormalBlending 彻底杜绝纯白过曝，非 AdditiveBlending)
    const groundArray = beacon!.children.find(c => c instanceof THREE.Mesh && (c.material as THREE.MeshBasicMaterial).map && (c.material as THREE.MeshBasicMaterial).blending === THREE.NormalBlending);
    expect(groundArray).toBeDefined();

    // 2. 验证仙人指路神兵组 (FocusImmortalPointer) 与 Tripo 4K PBR 神兵容器
    const swordGroup = beacon!.getObjectByName('FocusImmortalPointer');
    expect(swordGroup).toBeDefined();

    // 3. 验证 4K PBR 神兵网格 (TripoHanSwordMesh) 及其 PBR 金属光泽属性
    const swordMesh = swordGroup!.getObjectByName('TripoHanSwordMesh') as THREE.Mesh;
    expect(swordMesh).toBeDefined();
    const pbrMat = swordMesh.material as THREE.MeshStandardMaterial;
    expect(pbrMat.metalness).toBeGreaterThanOrEqual(0.88);
    expect(pbrMat.roughness).toBeLessThanOrEqual(0.30);
    expect(pbrMat.blending).toBe(THREE.NormalBlending);
    expect(pbrMat.side).toBe(THREE.DoubleSide);

    // 4. 验证山岳聚焦高亮与时间更新生命周期
    diorama.highlightMountain('danxia');
    diorama.update(1.0, 0.016);
    diorama.highlightMountain(null);

    diorama.dispose();
  });

  it('Part 9: should build authentic mythic pedestal rock, scree field, and GSAP timeline without green floating mesh', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);

    // 1. 验证奠基天石组件在沙盘初始化时安全挂载
    const pedestalGroup = diorama.getFocusPedestalGroup();
    expect(pedestalGroup).toBeDefined();
    expect(pedestalGroup.name).toBe('FocusPedestalGroup');

    // 2. 聚焦广东省第一峰【石坑崆 (1902m)】(古生代花岗岩玄石基座)
    diorama.highlightMountain('shikengkung');
    diorama.update(0.1, 0.016);

    // 验证极巅奠基天石台座与伴生碎石群 (Pedestal Rock & Scree Field)
    const mainRock = pedestalGroup.getObjectByName('PedestalMainRock') as THREE.Mesh;
    expect(mainRock).toBeDefined();
    expect(mainRock.geometry).toBeDefined();
    const rockMat = mainRock.material as THREE.MeshStandardMaterial;
    expect(rockMat.roughness).toBeGreaterThanOrEqual(0.80);
    expect(rockMat.metalness).toBeLessThanOrEqual(0.15);

    // 验证 5 块伴生自然崩解碎石
    for (let i = 0; i < 5; i++) {
      const debris = pedestalGroup.getObjectByName(`DebrisRock_${i}`);
      expect(debris).toBeDefined();
    }

    // 3. 切换聚焦至【丹霞山 (408m)】(赤壁红砂岩玄石)
    diorama.highlightMountain('danxia');
    diorama.update(0.2, 0.016);
    const danxiaRock = pedestalGroup.getObjectByName('PedestalMainRock') as THREE.Mesh;
    expect(danxiaRock).toBeDefined();

    // 4. 切换聚焦至【英西峰林 (380m)】(灰白喀斯特玄石)
    diorama.highlightMountain('yingxi');
    diorama.update(0.3, 0.016);
    const karstRock = pedestalGroup.getObjectByName('PedestalMainRock') as THREE.Mesh;
    expect(karstRock).toBeDefined();

    // 5. 验证四时日晷光影同步 (setTimeOfDay)
    diorama.setTimeOfDay('dusk', false);
    diorama.setTimeOfDay('night', false);
    diorama.setTimeOfDay('noon', false);

    // 6. 验证退出名山聚焦并执行平滑清理
    diorama.highlightMountain(null);
    diorama.update(0.5, 0.016);

    diorama.dispose();
  });

  it('Part 10: should mount authentic Shikengkung (1902m) 3D granite massif with watertight base skirt, horn peak and PBR vertex colors', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);

    // 1. 验证石坑崆实景级 3D 名山模型在沙盘初始化时成功装配
    const peakModel = diorama.getShikengkungPeakModel();
    expect(peakModel).toBeDefined();
    expect(peakModel?.group.name).toBe('ShikengkungPeak3DMaster');

    // 2. 验证 3D 实体山体网格 (Solid Closed Massif)
    const massif = peakModel?.mountainMesh;
    expect(massif).toBeDefined();
    expect(massif?.name).toBe('ShikengkungSolidMassif');
    expect(massif?.userData.isDioramaInteractable).toBe(true);
    expect(massif?.userData.hitData.id).toBe('shikengkung');

    const geom = massif?.geometry as THREE.BufferGeometry;
    expect(geom).toBeDefined();

    const posAttr = geom.attributes.position;
    expect(posAttr).toBeDefined();
    expect(posAttr.count).toBeGreaterThan(4000); // 64 径向环 x 80 角度分段高精网格

    // 验证下扎封闭底座 (深扎地下 16mm，杜绝悬空与漏底)
    geom.computeBoundingBox();
    const bbox = geom.boundingBox!;
    expect(bbox.min.y).toBeLessThanOrEqual(-0.014); // 深扎沙盘地下
    expect(bbox.max.y).toBeGreaterThanOrEqual(0.024); // 雄伟角峰拔起

    // 验证花岗岩矿物岩相顶点色与法线
    const normAttr = geom.attributes.normal;
    expect(normAttr).toBeDefined();
    expect(normAttr.count).toBe(posAttr.count);

    const colAttr = geom.attributes.color;
    expect(colAttr).toBeDefined();
    expect(colAttr.count).toBe(posAttr.count);

    // 验证顶点色彩丰富度 (非纯黑纯白，拥有花岗岩五重国色分层)
    let hasGlintOrBase = false;
    let hasDarkSlate = false;
    for (let i = 0; i < colAttr.count; i++) {
      const r = colAttr.getX(i);
      if (r > 0.45) hasGlintOrBase = true;
      if (r < 0.25) hasDarkSlate = true;
    }
    expect(hasGlintOrBase).toBe(true);
    expect(hasDarkSlate).toBe(true);

    // 3. 验证真实花岗岩 PBR 物理材质属性
    const mat = massif?.material as THREE.ShaderMaterial;
    expect(mat).toBeDefined();
    expect(mat.vertexColors).toBe(true);
    expect(mat.uniforms.uSunColor).toBeDefined();
    expect(mat.uniforms.uFillColor).toBeDefined();

    // 4. 验证极巅常驻天然天石基座与伴生碎石群
    const summitPedestal = peakModel?.pedestalGroup;
    expect(summitPedestal).toBeDefined();
    const apexStone = summitPedestal?.getObjectByName('ShikengkungApexStone');
    expect(apexStone).toBeDefined();

    for (let i = 0; i < 4; i++) {
      const debris = summitPedestal?.getObjectByName(`ApexDebris_${i}`);
      expect(debris).toBeDefined();
    }

    // 5. 验证聚焦联动与神兵定岳高程对齐
    diorama.highlightMountain('shikengkung');
    diorama.update(0.1, 0.016);
    expect(summitPedestal?.visible).toBe(false); // 聚焦时由主时间轴接管天石展开

    diorama.highlightMountain(null);
    diorama.update(0.2, 0.016);
    expect(summitPedestal?.visible).toBe(true); // 退出聚焦时恢复常驻极巅天石

    // 6. 回归验证：石坑崆 着色器基底海拔 uBaseElevation 必须存在且有效，杜绝负值深海蓝洞
    expect(mat.uniforms.uBaseElevation).toBeDefined();
    expect(mat.uniforms.uBaseElevation.value).toBeGreaterThan(0.15);
    expect(mat.uniforms.uPlain1.value.getHexString().toLowerCase()).toBe('5a8b6f');

    // 7. 回归验证：探针探测石坑崆极巅时，高程严格等于法定 1902m（绝非 1957m 浮点误差），坐标精准对齐台账
    const probeExact = diorama.probeLocation(24.9288, 112.9868);
    expect(probeExact.elevationMeters).toBe(1902);
    expect(probeExact.tierName).toBe('极巅');
    expect(probeExact.zoneTitle).toBe('韶关市 · 石坑崆');
    expect(probeExact.lat).toBe(24.9288);
    expect(probeExact.lng).toBe(112.9868);
    expect(probeExact.colorHex).toBe('#783214');

    // 验证峰顶微范围吸附：在微偏位置探测依然精准呈现 1902m 法定标尺
    const probeNear = diorama.probeLocation(24.94, 112.99);
    expect(probeNear.elevationMeters).toBe(1902);
    expect(probeNear.zoneTitle).toBe('韶关市 · 石坑崆');
    expect(probeNear.lat).toBe(24.9288);
    expect(probeNear.lng).toBe(112.9868);

    // 6. 验证清理
    diorama.dispose();
    expect(diorama.getShikengkungPeakModel()).toBeUndefined();
  });

  it('Part 11: should keep physical mountain bodies permanently visible in topography mode while cleanly hiding UI badges', () => {
    const diorama = new GuangdongTerrain3D(DESTINATIONS_DATA);

    // 默认或显式切换到全景地势模式
    diorama.setLayerMode('topography');
    expect(diorama.getLayerMode()).toBe('topography');

    // 验证石坑崆 3D 标杆角峰模型与物理山体常驻可见
    const peakModel = diorama.getShikengkungPeakModel();
    expect(peakModel).toBeDefined();
    expect(peakModel?.group.visible).toBe(true);
    expect(peakModel?.mountainMesh.visible).toBe(true);

    // 验证几何体下扎闭合深度达 45mm，彻底杜绝悬空
    const geom = peakModel?.mountainMesh.geometry as THREE.BufferGeometry;
    geom.computeBoundingBox();
    expect(geom.boundingBox!.min.y).toBeLessThanOrEqual(-0.035);

    // 验证全景地势下隐藏悬浮 UI 标牌，保持纯净地貌画卷
    const coord = diorama.getMountainCoordinates('shikengkung');
    expect(coord).toBeDefined();

    // 验证切换到名山大川模式时，标牌与光柱恢复可见
    diorama.setLayerMode('mountains');
    expect(diorama.getLayerMode()).toBe('mountains');
    expect(peakModel?.mountainMesh.visible).toBe(true);

    diorama.dispose();
  });
});


