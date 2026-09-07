import * as THREE from 'three';
import { DestinationItem } from '../types';
import { EXPERIENCE_GEOMETRY, getLodVisibility } from '../core/experienceState';
import { DESTINATIONS_DATA } from '../data/destinations';
import {
  PROVINCIAL_BADGES_DATA,
  type ProvincialBadgeConfig
} from '../data/provincialBadges';

export type AdministrativeTier = 'capital' | 'sez' | 'sar' | 'hub' | 'city';
export type { ProvincialBadgeConfig } from '../data/provincialBadges';

export interface CityAdministrativeConfig {
  icon: string;
  cityName: string;
  shortTag: string; // 城市·别称 (如: 广州·羊城, 深圳·鹏城)
  honorTitle: string;
  subTitle: string; // 灵境绝景副题
  tier: AdministrativeTier;
  tierBadgeText: string;
  themeColor: string;
  glowColor: string;
  coords: { lat: number; lng: number };
  phaseOffset: number;
  labelOffset: { x: number; y: number; z: number }; // 严格东(+X)/法线高(+Y)/南(+Z, 北为-Z)三维发散引线坐标
}

/**
 * 广东省廿一地市中心官方测绘坐标与核心文化知识库
 * 经严格右手正交切空间测绘的引线避让偏移（Leader Line Offset）
 * +X: 正东, -X: 正西
 * +Y: 地表垂直天顶海拔高度
 * -Z: 正北, +Z: 正南
 * 彻底消解潮汕三市、珠三角七市等所有密集区域重叠，全量 21 地市 100% 空间发散、清爽显化！
 */
export const CITY_ADMINISTRATIVE_DATA: Record<string, CityAdministrativeConfig> = {
  // === 珠江三角洲核心区 (7市精细发散高低错落) ===
  'guangzhou': {
    icon: '🐐',
    cityName: '广州市',
    shortTag: '广州 · 羊城',
    honorTitle: '广州市 · 羊城首善',
    subTitle: '· 越秀五羊 · 珠水云山 ·',
    tier: 'capital',
    tierBadgeText: '👑 省会首府',
    themeColor: '#E53935',
    glowColor: '#FFD700',
    coords: { lat: 23.1288, lng: 113.2590 },
    phaseOffset: 0.0,
    labelOffset: { x: 0.000, y: 0.038, z: -0.022 } // 广州：省会高耸正北
  },
  'foshan': {
    icon: '🦁',
    cityName: '佛山市',
    shortTag: '佛山 · 禅城',
    honorTitle: '佛山市 · 祖庙醒狮',
    subTitle: '· 佛山祖庙 · 醒狮天下 ·',
    tier: 'hub',
    tierBadgeText: '🏛️ 历史名城',
    themeColor: '#FFA000',
    glowColor: '#FFE082',
    coords: { lat: 23.0242, lng: 113.1134 },
    phaseOffset: (Math.PI * 2 * 4) / 21,
    labelOffset: { x: -0.026, y: 0.018, z: 0.000 } // 佛山：向正西平原大幅拉开
  },
  'dongguan': {
    icon: '🪵',
    cityName: '东莞市',
    shortTag: '东莞 · 莞香',
    honorTitle: '东莞市 · 东方莞香',
    subTitle: '· 可园松柏 · 虎门雄关 ·',
    tier: 'city',
    tierBadgeText: '📍 莞邑名郡',
    themeColor: '#FFB300',
    glowColor: '#FFE57F',
    coords: { lat: 23.0200, lng: 113.7500 },
    phaseOffset: (Math.PI * 2 * 8) / 21,
    labelOffset: { x: 0.022, y: 0.024, z: -0.008 } // 东莞：向东北抬升
  },
  'shenzhen': {
    icon: '🦅',
    cityName: '深圳市',
    shortTag: '深圳 · 鹏城',
    honorTitle: '深圳市 · 鹏城先锋',
    subTitle: '· 莲花山顶 · 前海潮涌 ·',
    tier: 'sez',
    tierBadgeText: '💎 经济特区',
    themeColor: '#00B0FF',
    glowColor: '#40C4FF',
    coords: { lat: 22.5431, lng: 114.0596 },
    phaseOffset: (Math.PI * 2 * 1) / 21,
    labelOffset: { x: 0.028, y: 0.030, z: 0.010 } // 深圳：向东南大鹏湾高架延伸
  },
  'zhongshan': {
    icon: '🏮',
    cityName: '中山市',
    shortTag: '中山 · 香山',
    honorTitle: '中山市 · 孙文故里',
    subTitle: '· 翠亨福地 · 岐江晚望 ·',
    tier: 'city',
    tierBadgeText: '📍 香山名郡',
    themeColor: '#FF7043',
    glowColor: '#FFCCBC',
    coords: { lat: 22.5167, lng: 113.3833 },
    phaseOffset: (Math.PI * 2 * 9) / 21,
    labelOffset: { x: -0.014, y: 0.016, z: 0.012 } // 中山：向西南偏低
  },
  'zhuhai': {
    icon: '🧜‍♀️',
    cityName: '珠海市',
    shortTag: '珠海 · 百岛',
    honorTitle: '珠海市 · 百岛珠玑',
    subTitle: '· 日月双贝 · 情侣金湾 ·',
    tier: 'sez',
    tierBadgeText: '💎 经济特区',
    themeColor: '#00E5FF',
    glowColor: '#1DE9B6',
    coords: { lat: 22.2639, lng: 113.5767 },
    phaseOffset: (Math.PI * 2 * 2) / 21,
    labelOffset: { x: 0.010, y: 0.014, z: 0.026 } // 珠海：向正南外海海岛深处延伸
  },
  'jiangmen': {
    icon: '🏰',
    cityName: '江门市',
    shortTag: '江门 · 碉楼',
    honorTitle: '江门市 · 侨乡碉楼',
    subTitle: '· 开平碉楼 · 赤坎古韵 ·',
    tier: 'city',
    tierBadgeText: '📍 侨乡名邑',
    themeColor: '#9E9D24',
    glowColor: '#D4E157',
    coords: { lat: 22.5978, lng: 113.0908 },
    phaseOffset: (Math.PI * 2 * 10) / 21,
    labelOffset: { x: -0.028, y: 0.022, z: 0.012 } // 江门：向西南外延开平
  },

  // === 粤东潮汕客家区 (彻底消解潮汕三市堆叠) ===
  'chaozhou': {
    icon: '🦄',
    cityName: '潮州市',
    shortTag: '潮州 · 广济',
    honorTitle: '潮州市 · 千年古邑',
    subTitle: '· 广济灵桥 · 韩文公祠 ·',
    tier: 'hub',
    tierBadgeText: '🏛️ 历史名城',
    themeColor: '#E53935',
    glowColor: '#FF8A80',
    coords: { lat: 23.6670, lng: 116.6330 },
    phaseOffset: (Math.PI * 2 * 5) / 21,
    labelOffset: { x: 0.010, y: 0.032, z: -0.020 } // 潮州：东北高位韩江
  },
  'shantou': {
    icon: '💎',
    cityName: '汕头市',
    shortTag: '汕头 · 鮀岛',
    honorTitle: '汕头市 · 潮海商埠',
    subTitle: '· 小公园亭 · 开埠商舶 ·',
    tier: 'sez',
    tierBadgeText: '💎 经济特区',
    themeColor: '#2979FF',
    glowColor: '#80D8FF',
    coords: { lat: 23.3540, lng: 116.6821 },
    phaseOffset: (Math.PI * 2 * 3) / 21,
    labelOffset: { x: 0.028, y: 0.018, z: 0.014 } // 汕头：大幅拉长向东南外海延伸！
  },
  'jieyang': {
    icon: '🦚',
    cityName: '揭阳市',
    shortTag: '揭阳 · 玉都',
    honorTitle: '揭阳市 · 榕江玉都',
    subTitle: '· 进贤古门 · 揭阳古邑 ·',
    tier: 'city',
    tierBadgeText: '📍 榕城古郡',
    themeColor: '#3949AB',
    glowColor: '#9FA8DA',
    coords: { lat: 23.5487, lng: 116.3723 },
    phaseOffset: (Math.PI * 2 * 16) / 21,
    labelOffset: { x: -0.020, y: 0.024, z: -0.006 } // 揭阳：向西北内陆延伸，与潮汕彻底三分天下！
  },
  'meizhou': {
    icon: '🐅',
    cityName: '梅州市',
    shortTag: '梅州 · 客都',
    honorTitle: '梅州市 · 世界客都',
    subTitle: '· 千佛围屋 · 叶帅故里 ·',
    tier: 'city',
    tierBadgeText: '📍 客都圣邑',
    themeColor: '#AB47BC',
    glowColor: '#E1BEE7',
    coords: { lat: 24.2890, lng: 116.1220 },
    phaseOffset: (Math.PI * 2 * 15) / 21,
    labelOffset: { x: -0.006, y: 0.036, z: -0.024 } // 梅州：粤北东北高位
  },
  'shanwei': {
    icon: '🐢',
    cityName: '汕尾市',
    shortTag: '汕尾 · 玄武',
    honorTitle: '汕尾市 · 海陆胜境',
    subTitle: '· 玄武灵山 · 红场记忆 ·',
    tier: 'city',
    tierBadgeText: '📍 海陆胜境',
    themeColor: '#0288D1',
    glowColor: '#81D4FA',
    coords: { lat: 22.7860, lng: 115.3750 },
    phaseOffset: (Math.PI * 2 * 17) / 21,
    labelOffset: { x: 0.000, y: 0.018, z: 0.024 } // 汕尾：向正南海岸延伸
  },
  'heyuan': {
    icon: '🦕',
    cityName: '河源市',
    shortTag: '河源 · 万绿',
    honorTitle: '河源市 · 万绿天湖',
    subTitle: '· 万绿天湖 · 恐龙化石 ·',
    tier: 'city',
    tierBadgeText: '📍 槎城福地',
    themeColor: '#00ACC1',
    glowColor: '#80DEEA',
    coords: { lat: 23.7380, lng: 114.6970 },
    phaseOffset: (Math.PI * 2 * 14) / 21,
    labelOffset: { x: 0.006, y: 0.028, z: -0.014 } // 河源：万绿湖中位
  },
  'huizhou': {
    icon: '⛰️',
    cityName: '惠州市',
    shortTag: '惠州 · 罗浮',
    honorTitle: '惠州市 · 罗浮仙山',
    subTitle: '· 罗浮仙境 · 惠州西湖 ·',
    tier: 'city',
    tierBadgeText: '📍 鹅城古郡',
    themeColor: '#26A69A',
    glowColor: '#80CBC4',
    coords: { lat: 23.1000, lng: 114.4167 },
    phaseOffset: (Math.PI * 2 * 11) / 21,
    labelOffset: { x: 0.018, y: 0.030, z: -0.014 } // 惠州：罗浮山东北
  },

  // === 粤西五市 (从西江到雷州半岛平滑舒展) ===
  'zhaoqing': {
    icon: '🪨',
    cityName: '肇庆市',
    shortTag: '肇庆 · 端砚',
    honorTitle: '肇庆市 · 端砚名都',
    subTitle: '· 七星灵岩 · 鼎湖飞瀑 ·',
    tier: 'city',
    tierBadgeText: '📍 端州古郡',
    themeColor: '#43A047',
    glowColor: '#A5D6A7',
    coords: { lat: 23.0470, lng: 112.4650 },
    phaseOffset: (Math.PI * 2 * 12) / 21,
    labelOffset: { x: -0.020, y: 0.024, z: -0.012 } // 肇庆：西北七星岩
  },
  'yunfu': {
    icon: '🐉',
    cityName: '云浮市',
    shortTag: '云浮 · 蟠龙',
    honorTitle: '云浮市 · 六祖禅都',
    subTitle: '· 蟠龙仙洞 · 国恩祖庭 ·',
    tier: 'city',
    tierBadgeText: '📍 石都禅境',
    themeColor: '#8E24AA',
    glowColor: '#CE93D8',
    coords: { lat: 22.9155, lng: 112.0447 },
    phaseOffset: (Math.PI * 2 * 20) / 21,
    labelOffset: { x: -0.022, y: 0.018, z: 0.008 } // 云浮：西南低位
  },
  'yangjiang': {
    icon: '🌊',
    cityName: '阳江市',
    shortTag: '阳江 · 海陵',
    honorTitle: '阳江市 · 海陵胜景',
    subTitle: '· 海陵胜岛 · 南海一号 ·',
    tier: 'city',
    tierBadgeText: '📍 漠阳古郡',
    themeColor: '#009688',
    glowColor: '#80CBC4',
    coords: { lat: 21.8584, lng: 111.9816 },
    phaseOffset: (Math.PI * 2 * 19) / 21,
    labelOffset: { x: 0.010, y: 0.016, z: 0.024 } // 阳江：海陵岛向南入海
  },
  'maoming': {
    icon: '🍈',
    cityName: '茂名市',
    shortTag: '茂名 · 高凉',
    honorTitle: '茂名市 · 冼太圣地',
    subTitle: '· 浪漫海岸 · 冼太古庙 ·',
    tier: 'city',
    tierBadgeText: '📍 高凉圣邑',
    themeColor: '#D81B60',
    glowColor: '#F48FB1',
    coords: { lat: 21.6627, lng: 110.9259 },
    phaseOffset: (Math.PI * 2 * 18) / 21,
    labelOffset: { x: -0.020, y: 0.022, z: -0.010 } // 茂名：西北高凉
  },
  'zhanjiang': {
    icon: '🗿',
    cityName: '湛江市',
    shortTag: '湛江 · 雷州',
    honorTitle: '湛江市 · 雷州古郡',
    subTitle: '· 金沙海湾 · 红土石狗 ·',
    tier: 'hub',
    tierBadgeText: '⚓ 南海重镇',
    themeColor: '#FF6D00',
    glowColor: '#FFD180',
    coords: { lat: 21.2000, lng: 110.3800 },
    phaseOffset: (Math.PI * 2 * 7) / 21,
    labelOffset: { x: 0.000, y: 0.018, z: 0.028 } // 湛江：雷州半岛向最南琼州海峡延伸
  },

  // === 粤北二市 (岭南名岳雄峙) ===
  'qingyuan': {
    icon: '🐉',
    cityName: '清远市',
    shortTag: '清远 · 凤城',
    honorTitle: '清远市 · 飞来灵峡',
    subTitle: '· 飞来清峡 · 连南瑶寨 ·',
    tier: 'city',
    tierBadgeText: '📍 凤城胜境',
    themeColor: '#00897B',
    glowColor: '#80CBC4',
    coords: { lat: 23.6820, lng: 113.0560 },
    phaseOffset: (Math.PI * 2 * 13) / 21,
    labelOffset: { x: -0.012, y: 0.034, z: -0.020 } // 清远：西北高位
  },
  'shaoguan': {
    icon: '🌄',
    cityName: '韶关市',
    shortTag: '韶关 · 丹霞',
    honorTitle: '韶关市 · 丹霞仙境',
    subTitle: '· 丹霞奇峦 · 南华禅林 ·',
    tier: 'hub',
    tierBadgeText: '⛰️ 岭南名岳',
    themeColor: '#FF5722',
    glowColor: '#FFAB91',
    coords: { lat: 24.8108, lng: 113.5966 },
    phaseOffset: (Math.PI * 2 * 6) / 21,
    labelOffset: { x: 0.000, y: 0.036, z: -0.026 } // 韶关：正北丹霞之巅
  },

  // === 浙江省十一地级市 (江南活态国色与空间精细避让) ===
  'hangzhou': {
    icon: '🦚',
    cityName: '杭州市',
    shortTag: '杭州 · 钱塘',
    honorTitle: '杭州市 · 钱塘西子',
    subTitle: '· 西湖澄波 · 三潭印月 ·',
    tier: 'capital',
    tierBadgeText: '👑 省会首府',
    themeColor: '#5B8266', // 西湖竹青
    glowColor: '#87CEEB',  // 天水碧
    coords: { lat: 30.2741, lng: 120.1551 },
    phaseOffset: 0.0,
    labelOffset: { x: -0.010, y: 0.038, z: -0.018 }
  },
  'ningbo': {
    icon: '🐢',
    cityName: '宁波市',
    shortTag: '宁波 · 明州',
    honorTitle: '宁波市 · 四明沧溟',
    subTitle: '· 天一阁韵 · 三江海舶 ·',
    tier: 'sez',
    tierBadgeText: '💎 计划单列',
    themeColor: '#1A365D', // 沧溟宝蓝
    glowColor: '#40C4FF',  // 三江晶蓝
    coords: { lat: 29.8683, lng: 121.5440 },
    phaseOffset: (Math.PI * 2 * 1) / 11,
    labelOffset: { x: 0.022, y: 0.026, z: -0.006 }
  },
  'wenzhou': {
    icon: '🦌',
    cityName: '温州市',
    shortTag: '温州 · 东瓯',
    honorTitle: '温州市 · 东瓯鹿城',
    subTitle: '· 雁荡奇峰 · 江心孤屿 ·',
    tier: 'hub',
    tierBadgeText: '🏛️ 浙南枢纽',
    themeColor: '#8B263E', // 雁荡丹霞红
    glowColor: '#FF80AB',  // 灵岩霞彩
    coords: { lat: 28.0000, lng: 120.6994 },
    phaseOffset: (Math.PI * 2 * 2) / 11,
    labelOffset: { x: 0.016, y: 0.018, z: 0.026 }
  },
  'shaoxing': {
    icon: '🦢',
    cityName: '绍兴市',
    shortTag: '绍兴 · 越州',
    honorTitle: '绍兴市 · 会稽兰亭',
    subTitle: '· 兰亭修禊 · 鉴湖春波 ·',
    tier: 'hub',
    tierBadgeText: '🏛️ 历史名城',
    themeColor: '#2E6F40', // 越窑青瓷
    glowColor: '#68D391',  // 鉴湖春水
    coords: { lat: 30.0000, lng: 120.5821 },
    phaseOffset: (Math.PI * 2 * 3) / 11,
    labelOffset: { x: 0.006, y: 0.028, z: -0.012 }
  },
  'huzhou': {
    icon: '🦩',
    cityName: '湖州市',
    shortTag: '湖州 · 吴兴',
    honorTitle: '湖州市 · 吴兴笔都',
    subTitle: '· 太湖溇港 · 莫干竹海 ·',
    tier: 'city',
    tierBadgeText: '📍 水晶之晶',
    themeColor: '#4A7C59', // 莫干竹青
    glowColor: '#9AE6B4',  // 松花绿
    coords: { lat: 30.8943, lng: 120.0868 },
    phaseOffset: (Math.PI * 2 * 4) / 11,
    labelOffset: { x: -0.018, y: 0.032, z: -0.026 }
  },
  'jiaxing': {
    icon: '🐸',
    cityName: '嘉兴市',
    shortTag: '嘉兴 · 秀州',
    honorTitle: '嘉兴市 · 秀州南湖',
    subTitle: '· 烟雨南湖 · 乌镇古韵 ·',
    tier: 'city',
    tierBadgeText: '📍 禾城胜景',
    themeColor: '#4A5568', // 乌镇黛瓦青
    glowColor: '#81E6D9',  // 南湖烟波
    coords: { lat: 30.7460, lng: 120.7555 },
    phaseOffset: (Math.PI * 2 * 5) / 11,
    labelOffset: { x: 0.012, y: 0.034, z: -0.028 }
  },
  'jinhua': {
    icon: '🦅',
    cityName: '金华市',
    shortTag: '金华 · 婺州',
    honorTitle: '金华市 · 婺州双龙',
    subTitle: '· 八咏楼前 · 双龙洞天 ·',
    tier: 'hub',
    tierBadgeText: '📍 浙中名郡',
    themeColor: '#D69E2E', // 婺女金华
    glowColor: '#F6E05E',  // 太阳金芒
    coords: { lat: 29.0781, lng: 119.6474 },
    phaseOffset: (Math.PI * 2 * 6) / 11,
    labelOffset: { x: -0.008, y: 0.022, z: 0.004 }
  },
  'quzhou': {
    icon: '🕊️',
    cityName: '衢州市',
    shortTag: '衢州 · 信安',
    honorTitle: '衢州市 · 信安南孔',
    subTitle: '· 烂柯仙弈 · 南宗孔庙 ·',
    tier: 'city',
    tierBadgeText: '📍 三省通衢',
    themeColor: '#744210', // 烂柯仙木褐
    glowColor: '#4FD1C5',  // 信安江清碧
    coords: { lat: 28.9701, lng: 118.8726 },
    phaseOffset: (Math.PI * 2 * 7) / 11,
    labelOffset: { x: -0.028, y: 0.020, z: 0.010 }
  },
  'zhoushan': {
    icon: '🦅',
    cityName: '舟山市',
    shortTag: '舟山 · 定海',
    honorTitle: '舟山市 · 定海蓬莱',
    subTitle: '· 普陀胜境 · 千岛沧溟 ·',
    tier: 'hub',
    tierBadgeText: '⚓ 海天佛国',
    themeColor: '#DD6B20', // 普陀祥光金
    glowColor: '#63B3ED',  // 潮音碧浪
    coords: { lat: 29.9853, lng: 122.2072 },
    phaseOffset: (Math.PI * 2 * 8) / 11,
    labelOffset: { x: 0.034, y: 0.030, z: -0.016 }
  },
  'taizhou': {
    icon: '🦚',
    cityName: '台州市',
    shortTag: '台州 · 天台',
    honorTitle: '台州市 · 赤城天台',
    subTitle: '· 国清古刹 · 神仙福地 ·',
    tier: 'city',
    tierBadgeText: '📍 仙佛胜景',
    themeColor: '#C53030', // 天台赤城红
    glowColor: '#FC8181',  // 仙居霞光
    coords: { lat: 28.6564, lng: 121.4208 },
    phaseOffset: (Math.PI * 2 * 9) / 11,
    labelOffset: { x: 0.024, y: 0.020, z: 0.012 }
  },
  'lishui': {
    icon: '🦄',
    cityName: '丽水市',
    shortTag: '丽水 · 处州',
    honorTitle: '丽水市 · 处州括苍',
    subTitle: '· 龙泉青瓷 · 云和仙梯 ·',
    tier: 'city',
    tierBadgeText: '📍 秀山丽水',
    themeColor: '#71A88A', // 龙泉粉青
    glowColor: '#9AE6B4',  // 梅子青瓷光
    coords: { lat: 28.4676, lng: 119.9230 },
    phaseOffset: (Math.PI * 2 * 10) / 11,
    labelOffset: { x: -0.018, y: 0.016, z: 0.022 }
  }
};

/**
 * 华夏地标 3D 灵光地标体系 (V3 终极高透自适应版)
 * 1. 3D 世界层：自发光金丝光柱 + 悬浮八面灵晶 + 国风阶梯导线 + 流动能量光子 + 2.5倍超清大字曜金琉璃微牌；
 * 2. 自适应透视缩放：在共享相机配置的微距到全览区间内自动平滑调节 Sprite 比例，杜绝贴图溢出或遮挡；
 * 3. 空间避让：21 地市 100% 常驻高亮显示，0 穿模，0 遮挡。
 */
export class LandmarkPins {
  public group: THREE.Group;
  public pinMeshes: THREE.Mesh[] = [];
  private readonly destinations: readonly DestinationItem[];
  private readonly provincialBadges: readonly ProvincialBadgeConfig[];

  public animatedItems: {
    pinGroup: THREE.Group;
    groundSealMesh: THREE.Mesh;
    lightBeamMesh: THREE.Mesh;
    crystal: THREE.Mesh;
    leaderLine: THREE.Line;
    pulseDot: THREE.Mesh;
    jointBead: THREE.Mesh;
    badgeSprite: THREE.Sprite;
    badgeMat: THREE.SpriteMaterial;
    city: DestinationItem;
    config: CityAdministrativeConfig;
    basePos: THREE.Vector3;
    normal: THREE.Vector3;
    speed: number;
    isSelected: boolean;
    baseOffset: { x: number; y: number; z: number };
    linePoints: THREE.Vector3[];
    waveAmplitude: number;
    phaseOffset: number;
    currentElevation: number;
    currentScaleX: number;
    currentScaleY: number;
  }[] = [];

  public provincialAnimatedItems: {
    pinGroup: THREE.Group;
    stardustParticles: THREE.Points;
    badgeMesh: THREE.Mesh;
    badgeMat: THREE.MeshBasicMaterial;
    config: ProvincialBadgeConfig;
    basePos: THREE.Vector3;
    normal: THREE.Vector3;
    isSelected: boolean;
    baseHeight: number;
    currentElevation: number;
  }[] = [];

  constructor(
    radius = 2.0,
    destinations: readonly DestinationItem[] = DESTINATIONS_DATA,
    provincialBadges: readonly ProvincialBadgeConfig[] = Object.values(PROVINCIAL_BADGES_DATA)
  ) {
    this.destinations = destinations;
    this.provincialBadges = provincialBadges;
    this.group = new THREE.Group();
    this.createPins(radius);
    this.createProvincialBadges(radius);
  }

  /**
   * 创建地表金光灵脉法阵贴图 (Procedural Luminous Ley-Line Rune Array)
   */
  private createGroundSealTexture(themeColor: string, glowColor: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // 外圈金光八卦符印环
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, Math.PI * 2);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = themeColor;
    ctx.shadowBlur = 10;
    ctx.stroke();

    // 内圈细金丝虚线环
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.arc(64, 64, 42, 0, Math.PI * 2);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#FFF8E1';
    ctx.stroke();
    ctx.setLineDash([]);

    // 中心星芒灵穴
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(64 + Math.cos(angle) * 14, 64 + Math.sin(angle) * 14);
      ctx.lineTo(64 + Math.cos(angle) * 38, 64 + Math.sin(angle) * 38);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = glowColor;
      ctx.stroke();
    }

    // 核心微核
    ctx.beginPath();
    ctx.arc(64, 64, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 12;
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    return texture;
  }

  /**
   * 【3D 超清大字曜金琉璃微牌】(280×72 视网膜高清画布，内置金玉飞檐托架底托)
   */
  private createMinimalCitySealTexture(config: CityAdministrativeConfig): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 72;
    const ctx = canvas.getContext('2d')!;

    const cleanCityName = config.cityName.replace('市', '');
    const isCapital = config.tier === 'capital';
    const isSez = config.tier === 'sez';

    // 1. 半透明国风墨玉琉璃底板 (融入城市微透主题色)
    ctx.beginPath();
    ctx.roundRect(6, 6, 268, 60, 30);
    const bgGrad = ctx.createLinearGradient(6, 6, 274, 66);
    bgGrad.addColorStop(0, 'rgba(8, 14, 24, 0.96)');
    bgGrad.addColorStop(0.5, 'rgba(14, 22, 34, 0.94)');
    bgGrad.addColorStop(1, 'rgba(6, 12, 18, 0.96)');
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // 2. 双重璀璨国色光华轮廓
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = isCapital ? '#FFD700' : (isSez ? '#40C4FF' : (config.glowColor || '#FFE082'));
    ctx.shadowColor = config.glowColor || '#FFE082';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 内细金边
    ctx.beginPath();
    ctx.roundRect(10, 10, 260, 52, 26);
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.stroke();

    // 底部飞檐金托架装饰线
    ctx.beginPath();
    ctx.moveTo(35, 66);
    ctx.lineTo(245, 66);
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = config.glowColor || '#FFE082';
    ctx.stroke();

    // 3. 左侧：祥瑞标志 / 等级灵符
    const badgeText = isCapital ? '👑' : (isSez ? '💎' : (config.icon || '📍'));
    ctx.font = '28px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, 46, 36);

    // 金色玉质竖向分割线
    ctx.beginPath();
    ctx.moveTo(80, 18);
    ctx.lineTo(80, 54);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.stroke();

    // 4. 右侧：超大白玉泥金行楷市名
    ctx.font = 'bold 36px "Noto Serif SC", "STKaiti", "KaiTi", "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textGrad = ctx.createLinearGradient(95, 0, 255, 0);
    textGrad.addColorStop(0, '#FFFFFF');
    textGrad.addColorStop(0.25, '#FFF8E1');
    textGrad.addColorStop(0.65, config.glowColor || '#FFE082');
    textGrad.addColorStop(1, '#FFD54F');

    // 双重深黑外描边增加极致对比度与可读性
    ctx.lineWidth = 5.0;
    ctx.strokeStyle = 'rgba(2, 6, 4, 0.98)';
    ctx.strokeText(cleanCityName, 178, 36);

    ctx.fillStyle = textGrad;
    ctx.shadowColor = config.glowColor || '#FFD700';
    ctx.shadowBlur = 14;
    ctx.fillText(cleanCityName, 178, 36);
    ctx.shadowBlur = 0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * 廿一地市 3D 灵光阵位与严格正交切空间引线创建
   */
  private createPins(radius: number) {
    this.destinations.forEach((city, index) => {
      const config = CITY_ADMINISTRATIVE_DATA[city.id] || {
        icon: '📍',
        cityName: city.cityName,
        shortTag: `${city.cityName} · 灵境`,
        honorTitle: city.cityName,
        subTitle: '· 山海福地 · 真实风光 ·',
        tier: 'city' as AdministrativeTier,
        tierBadgeText: '📍 市级地标',
        themeColor: city.colorTheme.primary || '#5B8266',
        glowColor: city.colorTheme.glow || '#87CEEB',
        coords: city.coordinates,
        phaseOffset: (Math.PI * 2 * index) / Math.max(1, this.destinations.length),
        labelOffset: { x: 0, y: 0.025, z: 0 }
      };

      const lat = config.coords.lat;
      const lng = config.coords.lng;

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      const surfaceX = -radius * Math.cos(theta) * Math.sin(phi);
      const surfaceY = radius * Math.cos(phi);
      const surfaceZ = radius * Math.sin(theta) * Math.sin(phi);

      const normal = new THREE.Vector3(surfaceX, surfaceY, surfaceZ).normalize();
      const pos = normal.clone().multiplyScalar(radius);

      // 严格右手正交地理切空间基底 (det = +1)
      const eastTangent = new THREE.Vector3(
        Math.sin(theta),
        0,
        Math.cos(theta)
      ).normalize();

      const southTangent = new THREE.Vector3().crossVectors(eastTangent, normal).normalize();

      const rotMatrix = new THREE.Matrix4();
      rotMatrix.makeBasis(eastTangent, normal, southTangent);

      const pinGroup = new THREE.Group();
      pinGroup.position.copy(pos);
      pinGroup.quaternion.setFromRotationMatrix(rotMatrix);

      const isCapital = config.tier === 'capital';
      const isSez = config.tier === 'sez';

      // 1. 地表金光灵脉法阵
      const sealGeo = new THREE.PlaneGeometry(0.009, 0.009);
      const sealTex = this.createGroundSealTexture(config.themeColor, config.glowColor);
      const sealMat = new THREE.MeshBasicMaterial({
        map: sealTex,
        transparent: true,
        opacity: 0.90,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const groundSealMesh = new THREE.Mesh(sealGeo, sealMat);
      groundSealMesh.rotation.x = -Math.PI / 2;
      groundSealMesh.position.set(0, 0.0012, 0);
      pinGroup.add(groundSealMesh);

      // 2. 立体自发光金丝灵脉光柱 (Luminous Vertical Light Beam)
      const beamHeight = 0.0042;
      const beamGeo = new THREE.CylinderGeometry(0.0004, 0.0007, beamHeight, 8, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(config.glowColor),
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const lightBeamMesh = new THREE.Mesh(beamGeo, beamMat);
      lightBeamMesh.position.set(0, beamHeight / 2 + 0.0008, 0);
      pinGroup.add(lightBeamMesh);

      // 3. 悬浮曜金翡翠晶石灵核 (可在 3D 中直观交互)
      const crystalGeo = new THREE.OctahedronGeometry(isCapital ? 0.0026 : (isSez ? 0.0023 : 0.0020), 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.themeColor),
        emissive: new THREE.Color(config.glowColor),
        emissiveIntensity: isCapital ? 3.0 : 2.2,
        metalness: 0.85,
        roughness: 0.15
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(0, 0.0042, 0);
      pinGroup.add(crystal);
      this.pinMeshes.push(crystal);

      // 4. 【国风阶梯折角金丝灵脉导线】(Stepped 4-Point Leader Line)
      // P0(晶核) -> P1(立柱顶) -> P2(水平悬臂) -> P3(名牌底托)
      const offset = config.labelOffset;
      const kneeY = Math.max(0.009, offset.y * 0.70);

      const p0 = new THREE.Vector3(0, 0.0042, 0);
      const p1 = new THREE.Vector3(0, kneeY, 0);
      const p2 = new THREE.Vector3(offset.x, kneeY, offset.z);
      const p3 = new THREE.Vector3(offset.x, offset.y, offset.z);

      const linePoints = [p0, p1, p2, p3];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color('#FFE082'),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const leaderLine = new THREE.Line(lineGeo, lineMat);
      pinGroup.add(leaderLine);

      // 5. 【沿线游走流光星点能量粒子】(Animated Flowing Energy Pulse Dot)
      const pulseGeo = new THREE.SphereGeometry(0.00065, 8, 8);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#FFFFFF'),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
      });
      const pulseDot = new THREE.Mesh(pulseGeo, pulseMat);
      pulseDot.position.copy(p0);
      pinGroup.add(pulseDot);

      // 6. 【引线末端微型金色灵珠铰接点】(Golden Anchor Joint Bead)
      const jointGeo = new THREE.SphereGeometry(0.0005, 8, 8);
      const jointMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#FFF8E1'),
        transparent: true,
        opacity: 0.95
      });
      const jointBead = new THREE.Mesh(jointGeo, jointMat);
      jointBead.position.set(offset.x, offset.y - 0.0024, offset.z);
      pinGroup.add(jointBead);

      // 7. 【大字曜金琉璃微牌】(清晰度与尺寸放大 2.5 倍)
      const minimalTexture = this.createMinimalCitySealTexture(config);

      const badgeMat = new THREE.SpriteMaterial({
        map: minimalTexture,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
        depthTest: true,
        toneMapped: true
      });
      const badgeSprite = new THREE.Sprite(badgeMat);

      // 基础微标尺寸
      const initialScaleX = isCapital ? 0.028 : (isSez ? 0.026 : 0.024);
      const initialScaleY = isCapital ? 0.0072 : (isSez ? 0.0068 : 0.0062);
      badgeSprite.scale.set(initialScaleX, initialScaleY, 1);
      badgeSprite.position.set(offset.x, offset.y, offset.z);
      badgeSprite.renderOrder = isCapital ? 50000 : (isSez ? 30000 : 10000);
      pinGroup.add(badgeSprite);

      this.group.add(pinGroup);

      this.animatedItems.push({
        pinGroup,
        groundSealMesh,
        lightBeamMesh,
        crystal,
        leaderLine,
        pulseDot,
        jointBead,
        badgeSprite,
        badgeMat,
        city,
        config,
        basePos: pos.clone(),
        normal,
        speed: 1.0,
        isSelected: false,
        baseOffset: { ...offset },
        linePoints: [p0, p1, p2, p3],
        waveAmplitude: 0.0006,
        phaseOffset: config.phaseOffset,
        currentElevation: offset.y,
        currentScaleX: initialScaleX,
        currentScaleY: initialScaleY
      });
    });
  }

  /**
   * 真 3D 球面贴合·区域省级背景名片。
   * 主标题只承担省域识别，其他信息必须服从固定内容预算，不能挤压省名。
   */
  private createProvincialBadgeTexture(config: ProvincialBadgeConfig): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 750;
    const ctx = canvas.getContext('2d')!;
    const serif = '"Noto Serif SC", "STKaiti", "KaiTi", "Songti SC", "SimSun", serif';

    // 1. 顶部：无括号纯净朱砂方印 / 别称御符 (如“岭  南” / “钱  塘”，字号大幅跃升至 48px，字字饱满清晰)
    const sealText = config.shortTag 
      ? (config.shortTag.length === 2 ? `${config.shortTag[0]}  ${config.shortTag[1]}` : config.shortTag)
      : (config.sealLabel ? config.sealLabel.replace(/[✦〔〕\s]/g, '') : '华夏神州');
    const sealW = 320;
    const sealH = 72;
    const sealX = (1000 - sealW) / 2;
    const sealY = 36;
    ctx.beginPath();
    ctx.roundRect(sealX, sealY, sealW, sealH, 36);
    const sealGrad = ctx.createLinearGradient(sealX, sealY, sealX + sealW, sealY + sealH);
    sealGrad.addColorStop(0, '#B71C1C');
    sealGrad.addColorStop(0.5, '#D32F2F');
    sealGrad.addColorStop(1, '#880E4F');
    ctx.fillStyle = sealGrad;
    ctx.fill();

    ctx.lineWidth = 3.0;
    ctx.strokeStyle = '#FFD54F';
    ctx.shadowColor = '#FFD54F';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = `bold 48px ${serif}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sealText, 500, sealY + sealH / 2 + 1);

    // 2. 中央核心：纯粹省名榜书大字【广东省】/【浙江省】(仅3个字，字号高达 220px，字字如斗，y = 290)
    const mainTitle = config.provName || config.honorTitle || '华夏名省';
    const textGrad = ctx.createLinearGradient(150, 0, 850, 0);
    textGrad.addColorStop(0, '#FFFFFF');
    textGrad.addColorStop(0.20, '#FFF9C4');
    textGrad.addColorStop(0.50, '#FFE082');
    textGrad.addColorStop(0.80, '#FFD54F');
    textGrad.addColorStop(1.0, '#FFA000');

    ctx.font = `900 220px ${serif}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 26px 黑色高反差粗描边确保青绿地形上极致清晰
    ctx.lineWidth = 26;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.98)';
    ctx.strokeText(mainTitle, 500, 290);

    // 40px 琥珀金芒流光
    ctx.fillStyle = textGrad;
    ctx.shadowColor = config.glowColor || '#FFD54F';
    ctx.shadowBlur = 40;
    ctx.fillText(mainTitle, 500, 290);
    ctx.shadowBlur = 0;

    // 3. 下方：文脉摘要 (字号放大至 56px，高反差黑描边清晰可读，y = 540)
    if (config.regionSummary) {
      ctx.font = `bold 56px ${serif}`;
      ctx.lineWidth = 14;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.96)';
      ctx.strokeText(config.regionSummary, 500, 540);

      ctx.fillStyle = '#FFF9C4';
      ctx.shadowColor = config.themeColor || '#FFD54F';
      ctx.shadowBlur = 18;
      ctx.fillText(config.regionSummary, 500, 540);
      ctx.shadowBlur = 0;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }

  private createProvincialBadges(radius: number) {
    this.provincialBadges.forEach(config => {
      const lat = config.coords.lat;
      const lng = config.coords.lng;

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);

      const surfaceX = -radius * Math.cos(theta) * Math.sin(phi);
      const surfaceY = radius * Math.cos(phi);
      const surfaceZ = radius * Math.sin(theta) * Math.sin(phi);

      const normal = new THREE.Vector3(surfaceX, surfaceY, surfaceZ).normalize();
      const pos = normal.clone().multiplyScalar(radius);

      const eastTangent = new THREE.Vector3(
        Math.sin(theta),
        0,
        Math.cos(theta)
      ).normalize();

      const southTangent = new THREE.Vector3().crossVectors(eastTangent, normal).normalize();

      const rotMatrix = new THREE.Matrix4();
      rotMatrix.makeBasis(eastTangent, normal, southTangent);

      const pinGroup = new THREE.Group();
      pinGroup.position.copy(pos);
      pinGroup.quaternion.setFromRotationMatrix(rotMatrix);

      // 1. 升腾流金星尘粒子群
      const stardustCount = 48;
      const stardustGeo = new THREE.BufferGeometry();
      const stardustPositions = new Float32Array(stardustCount * 3);
      for (let i = 0; i < stardustCount; i++) {
        const angle = (i / stardustCount) * Math.PI * 2 + Math.random() * 0.4;
        const rad = 0.015 + Math.random() * 0.055;
        const height = 0.002 + Math.random() * 0.035;
        stardustPositions[i * 3] = Math.cos(angle) * rad;
        stardustPositions[i * 3 + 1] = height;
        stardustPositions[i * 3 + 2] = Math.sin(angle) * rad;
      }
      stardustGeo.setAttribute('position', new THREE.BufferAttribute(stardustPositions, 3));
      const stardustMat = new THREE.PointsMaterial({
        color: new THREE.Color('#FFE082'),
        size: 0.0032,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const stardustParticles = new THREE.Points(stardustGeo, stardustMat);
      stardustParticles.visible = false;
      pinGroup.add(stardustParticles);

      // 2. 【真 3D 球面切平面贴合】精准匹配各省物理跨度，杜绝越出省界
      const worldWidth = config.worldWidth || EXPERIENCE_GEOMETRY.overlay.provincialBadge.worldWidth;
      const worldHeight = config.worldHeight || EXPERIENCE_GEOMETRY.overlay.provincialBadge.worldHeight;
      const planeGeo = new THREE.PlaneGeometry(worldWidth, worldHeight);
      const badgeTexture = this.createProvincialBadgeTexture(config);
      const badgeMat = new THREE.MeshBasicMaterial({
        map: badgeTexture,
        transparent: true,
        opacity: 0.98,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        toneMapped: true
      });
      const badgeMesh = new THREE.Mesh(planeGeo, badgeMat);
      badgeMesh.rotation.x = -Math.PI / 2;
      badgeMesh.position.set(0, 0.006, 0);
      badgeMesh.renderOrder = 90000;
      pinGroup.add(badgeMesh);

      this.group.add(pinGroup);

      this.provincialAnimatedItems.push({
        pinGroup,
        stardustParticles,
        badgeMesh,
        badgeMat,
        config,
        basePos: pos.clone(),
        normal,
        isSelected: false,
        baseHeight: 0.006,
        currentElevation: 0.006
      });
    });
  }

  private hoveredCityId: string | null = null;
  private selectedCityId: string | null = null;

  public setHoveredCity(cityId: string | null) {
    this.hoveredCityId = cityId;
    this.highlightCity(cityId || this.selectedCityId || '');
  }

  public setSelectedCity(cityId: string | null) {
    this.selectedCityId = cityId;
    this.highlightCity(cityId || '');
  }

  public highlightCity(cityId: string) {
    this.animatedItems.forEach(item => {
      item.isSelected = item.city.id === cityId;
    });
  }

  public highlightProvince(provId: string) {
    this.provincialAnimatedItems.forEach(item => {
      item.isSelected = item.config.id === provId;
    });
  }

  public update(time: number, delta: number, cameraDist = 8.8, camera?: THREE.Camera) {
    const floatFreq = 1.35;

    // LOD 由共享体验状态派生，省级名片与城市沙盘保持互斥。
    const isProvincialScale = getLodVisibility(cameraDist).provincialBadges;

    const lerpSpeed = Math.min(1.0, delta * 16.0);

    const tempQuat = new THREE.Quaternion();
    const tempWorldNormal = new THREE.Vector3();
    const tempCamDir = new THREE.Vector3();

    if (camera) {
      this.group.getWorldQuaternion(tempQuat);
      tempCamDir.copy(camera.position).normalize();
    }

    // =========================================================================
    // 1. 纯净大地哲学：21 地市三维生硬引线与杂乱浮牌彻底停用，所有地市视觉与名片完全归一于 2D 琉璃名片与 3D 地契沙盘
    // =========================================================================
    this.animatedItems.forEach(item => {
      item.pinGroup.visible = false;
      item.badgeSprite.visible = false;
      item.badgeMat.opacity = 0;
      item.groundSealMesh.visible = false;
      item.lightBeamMesh.visible = false;
      item.leaderLine.visible = false;
      item.pulseDot.visible = false;
      item.jointBead.visible = false;
    });

    // =========================================================================
    // 2. 省级【真 3D 球面贴合·防穿模自适应】更新（由共享 cityBoundary 派生显化/隐退）
    // =========================================================================
    this.provincialAnimatedItems.forEach(provItem => {
      if (!isProvincialScale) {
        provItem.pinGroup.visible = false;
        provItem.badgeMesh.visible = false;
        provItem.badgeMat.opacity = 0;
        provItem.stardustParticles.visible = false;
        return;
      }

      let horizonFade = 1.0;
      if (camera) {
        tempWorldNormal.copy(provItem.normal).applyQuaternion(tempQuat).normalize();
        const horizonDot = tempWorldNormal.dot(tempCamDir);
        horizonFade = THREE.MathUtils.clamp((horizonDot - 0.35) / (0.65 - 0.35), 0, 1);
      }

      // 下界与上界均由共享相机/淡出配置计算，避免组件各自维护阈值
      const closeFade = THREE.MathUtils.clamp(
        (cameraDist - EXPERIENCE_GEOMETRY.camera.cityBoundary)
          / (EXPERIENCE_GEOMETRY.fade.provincialCloseEnd - EXPERIENCE_GEOMETRY.camera.cityBoundary),
        0,
        1,
      );
      const farFade = THREE.MathUtils.clamp(
        (EXPERIENCE_GEOMETRY.camera.provinceMax - cameraDist)
          / (EXPERIENCE_GEOMETRY.camera.provinceMax - EXPERIENCE_GEOMETRY.fade.provincialFarStart),
        0,
        1,
      );
      const totalFade = horizonFade * closeFade * farFade;

      if (totalFade <= 0.001) {
        provItem.pinGroup.visible = false;
        provItem.badgeMesh.visible = false;
        provItem.badgeMat.opacity = 0;
        provItem.stardustParticles.visible = false;
        return;
      }

      provItem.pinGroup.visible = true;
      provItem.badgeMesh.visible = true;

      // 1. 升腾流金星尘粒子群
      if (provItem.isSelected) {
        provItem.stardustParticles.visible = true;
        provItem.stardustParticles.rotation.y = time * 0.45;
        (provItem.stardustParticles.material as THREE.PointsMaterial).opacity = 0.90 * totalFade;
      } else {
        provItem.stardustParticles.visible = false;
      }

      // 2. 防曲面穿模的安全适度自适应算法：近省级视界更清晰，远景才收窄。
      const farProgress = THREE.MathUtils.clamp(
        (cameraDist - EXPERIENCE_GEOMETRY.camera.cityBoundary)
          / (EXPERIENCE_GEOMETRY.camera.provinceMax - EXPERIENCE_GEOMETRY.camera.cityBoundary),
        0,
        1,
      );
      const { nearScale, farScale } = EXPERIENCE_GEOMETRY.overlay.provincialBadge;
      const adaptiveScaleFactor = THREE.MathUtils.lerp(nearScale, farScale, farProgress);
      const safeElevation = 0.006 + (adaptiveScaleFactor - farScale) * 0.008;

      let targetElevation = safeElevation;
      let targetScale = 1.0 * adaptiveScaleFactor;
      let targetOpacity = 0.98 * totalFade;

      if (provItem.isSelected) {
        targetElevation = safeElevation + 0.003;
        targetScale = 1.12 * adaptiveScaleFactor;
        targetOpacity = 1.0 * totalFade;
      }

      provItem.currentElevation += (targetElevation - provItem.currentElevation) * lerpSpeed;
      provItem.badgeMesh.position.y = provItem.currentElevation;
      provItem.badgeMesh.scale.set(targetScale, targetScale, targetScale);
      provItem.badgeMat.opacity = THREE.MathUtils.lerp(provItem.badgeMat.opacity, targetOpacity, lerpSpeed);
    });
  }
}
