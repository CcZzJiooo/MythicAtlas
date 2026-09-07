export interface EarthlyBranchItem {
  id: string;
  name: string;
  char: string;
  zodiacAnimal: string;
  timeRange: string;
  angle: number; // 0 ~ 360 deg on Equatorial Ring
  element: string;
  yinYang: '阳' | '阴';
  solarOrgan: string; // 经络脏腑
  lore: string;
}

export const EARTHLY_BRANCHES_DATA: EarthlyBranchItem[] = [
  {
    id: 'zi',
    name: '子时',
    char: '子',
    zodiacAnimal: '鼠',
    timeRange: '23:00 - 01:00 (夜半)',
    angle: 0,
    element: '水',
    yinYang: '阳',
    solarOrgan: '胆经主令',
    lore: '夜半子时，一阳初动。万籁俱寂，天地气交。古人此际安眠，以养胆气生发。'
  },
  {
    id: 'chou',
    name: '丑时',
    char: '丑',
    zodiacAnimal: '牛',
    timeRange: '01:00 - 03:00 (鸡鸣)',
    angle: 30,
    element: '土',
    yinYang: '阴',
    solarOrgan: '肝经主令',
    lore: '鸡鸣丑时，沉睡养肝。肝藏血，人卧则血归于肝。金星斜照，大地蓄力。'
  },
  {
    id: 'yin',
    name: '寅时',
    char: '寅',
    zodiacAnimal: '虎',
    timeRange: '03:00 - 05:00 (平旦)',
    angle: 60,
    element: '木',
    yinYang: '阳',
    solarOrgan: '肺经主令',
    lore: '平旦寅时，阴阳交替，晓光初现。肺朝百脉，气血自此重新分配周身。'
  },
  {
    id: 'mao',
    name: '卯时',
    char: '卯',
    zodiacAnimal: '兔',
    timeRange: '05:00 - 07:00 (日出)',
    angle: 90,
    element: '木',
    yinYang: '阴',
    solarOrgan: '大肠经主令',
    lore: '日出东方，红霞万道。阳气大盛，万物破晓出土，朝气蓬勃。'
  },
  {
    id: 'chen',
    name: '辰时',
    char: '辰',
    zodiacAnimal: '龙',
    timeRange: '07:00 - 09:00 (食时)',
    angle: 120,
    element: '土',
    yinYang: '阳',
    solarOrgan: '胃经主令',
    lore: '食时辰时，群龙行雨。朝食进膳，脾胃运化，为一天精气神之源泉。'
  },
  {
    id: 'si',
    name: '巳时',
    char: '巳',
    zodiacAnimal: '蛇',
    timeRange: '09:00 - 11:00 (隅中)',
    angle: 150,
    element: '火',
    yinYang: '阴',
    solarOrgan: '脾经主令',
    lore: '隅中巳时，临近正午。艳阳高照，脾主运化，是读书研理、经略乾坤最佳光阴。'
  },
  {
    id: 'wu',
    name: '午时',
    char: '午',
    zodiacAnimal: '马',
    timeRange: '11:00 - 13:00 (日中)',
    angle: 180,
    element: '火',
    yinYang: '阳',
    solarOrgan: '心经主令',
    lore: '日中正午，阳极阴生。天顶金轮辉映，古人宜小憩片刻，以养心神安泰。'
  },
  {
    id: 'wei',
    name: '未时',
    char: '未',
    zodiacAnimal: '羊',
    timeRange: '13:00 - 15:00 (日昳)',
    angle: 210,
    element: '土',
    yinYang: '阴',
    solarOrgan: '小肠经主令',
    lore: '日昳未时，太阳偏西。小肠分清泌浊，精神充沛，百工巧匠施展绝技之时。'
  },
  {
    id: 'shen',
    name: '申时',
    char: '申',
    zodiacAnimal: '猴',
    timeRange: '15:00 - 17:00 (哺时)',
    angle: 240,
    element: '金',
    yinYang: '阳',
    solarOrgan: '膀胱经主令',
    lore: '晡时申时，夕照灿烂。水谷精微畅达，记忆澄澈，古人行文作诗之黄金时辰。'
  },
  {
    id: 'you',
    name: '酉时',
    char: '酉',
    zodiacAnimal: '鸡',
    timeRange: '17:00 - 19:00 (日入)',
    angle: 270,
    element: '金',
    yinYang: '阴',
    solarOrgan: '肾经主令',
    lore: '日入酉时，夕阳西坠。暮色染千山，飞鸟归林。肾藏精气，宜静心归藏。'
  },
  {
    id: 'xu',
    name: '戌时',
    char: '戌',
    zodiacAnimal: '狗',
    timeRange: '19:00 - 21:00 (黄昏)',
    angle: 300,
    element: '土',
    yinYang: '阳',
    solarOrgan: '心包经主令',
    lore: '黄昏戌时，华灯初上。月上柳梢头，人约黄昏后。心怀愉悦，夜话家常。'
  },
  {
    id: 'hai',
    name: '亥时',
    char: '亥',
    zodiacAnimal: '猪',
    timeRange: '21:00 - 23:00 (人定)',
    angle: 330,
    element: '水',
    yinYang: '阴',
    solarOrgan: '三焦经主令',
    lore: '人定亥时，夜色深沉。三焦通百脉，安歇就寝，静候天地阴阳重启循环。'
  }
];
