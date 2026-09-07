export interface SolarTermItem {
  id: string;
  name: string;
  pinyin: string;
  angle: number; // 0 ~ 360 deg
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  solarLongitude: number; // 太阳黄经
  threePhenology: [string, string, string]; // 三候
  poetry: string;
  guidance: string;
  recommendedPlaces: string[];
}

export const SOLAR_TERMS_DATA: SolarTermItem[] = [
  {
    id: 'lichun',
    name: '立春',
    pinyin: 'Lì Chūn',
    angle: 0,
    season: 'spring',
    solarLongitude: 315,
    threePhenology: ['一候 东风解冻', '二候 蛰虫始振', '三候 鱼陟负冰'],
    poetry: '律回岁晚冰霜少，春到人间草木知。',
    guidance: '阳气初升，万物复苏。此日宜登高望远，迎春纳福。',
    recommendedPlaces: ['广州·越秀仙井', '肇庆·鼎湖古刹', '杭州·西湖孤山']
  },
  {
    id: 'yushui',
    name: '雨水',
    pinyin: 'Yǔ Shuǐ',
    angle: 15,
    season: 'spring',
    solarLongitude: 330,
    threePhenology: ['一候 獭祭鱼', '二候 鸿雁来', '三候 草木萌动'],
    poetry: '好雨知时节，当春乃发生。',
    guidance: '春雨润泽，山川萌动。宜探寻岭南水乡，泛舟烟雨江河。',
    recommendedPlaces: ['佛山·祖庙陶韵', '江门·开平碉楼', '苏州·周庄水乡']
  },
  {
    id: 'jingzhe',
    name: '惊蛰',
    pinyin: 'Jīng Zhé',
    angle: 30,
    season: 'spring',
    solarLongitude: 345,
    threePhenology: ['一候 桃始华', '二候 仓庚鸣', '三候 鹰化为鸠'],
    poetry: '微雨众卉新，一雷惊蛰始。',
    guidance: '春雷唤醒大地沉睡生灵，正是山海百兽初醒之时。',
    recommendedPlaces: ['清远·峡山龙潭', '韶关·丹霞仙山', '桂林·象鼻奇峰']
  },
  {
    id: 'chunfen',
    name: '春分',
    pinyin: 'Chūn Fēn',
    angle: 45,
    season: 'spring',
    solarLongitude: 0,
    threePhenology: ['一候 玄鸟至', '二候 雷乃发声', '三候 始电'],
    poetry: '日月阳阴两均天，玄鸟不辞桃花寒。',
    guidance: '昼夜均分，寒暑平衡。阴阳气象最为中和调顺。',
    recommendedPlaces: ['惠州·罗浮天界', '深圳·大鹏古堡', '南京·钟山梅花']
  },
  {
    id: 'qingming',
    name: '清明',
    pinyin: 'Qīng Míng',
    angle: 60,
    season: 'spring',
    solarLongitude: 15,
    threePhenology: ['一候 桐始华', '二候 田鼠化为鴽', '三候 虹始见'],
    poetry: '清明时节雨纷纷，路上行人欲断魂。',
    guidance: '气清景明，万物吐故纳新。宜寻访先贤宗祠与古道烟峦。',
    recommendedPlaces: ['潮州·韩文公祠', '梅州·客家围屋', '黄山·云海晴翠']
  },
  {
    id: 'guyu',
    name: '谷雨',
    pinyin: 'Gǔ Yǔ',
    angle: 75,
    season: 'spring',
    solarLongitude: 30,
    threePhenology: ['一候 萍始生', '二候 鸣鸠拂其羽', '三候 戴胜降于桑'],
    poetry: '杨花落尽子规啼，闻道龙标过五溪。',
    guidance: '春季最后一个节气，雨生百谷，茶香沁心。',
    recommendedPlaces: ['河源·万绿天湖', '揭阳·进贤名门', '武夷山·九曲天游']
  },
  {
    id: 'lixia',
    name: '立夏',
    pinyin: 'Lì Xià',
    angle: 90,
    season: 'summer',
    solarLongitude: 45,
    threePhenology: ['一候 蝼蝈鸣', '二候 蚯蚓出', '三候 王瓜生'],
    poetry: '绿树阴浓夏日长，楼台倒影入池塘。',
    guidance: '夏木阴阴，万物并秀。山海气象自清柔转为丰茂壮阔。',
    recommendedPlaces: ['东莞·莞香古园', '中山·翠亨香山', '敦煌·莫高飞天']
  },
  {
    id: 'xiaoman',
    name: '小满',
    pinyin: 'Xiǎo Mǎn',
    angle: 105,
    season: 'summer',
    solarLongitude: 60,
    threePhenology: ['一候 苦菜秀', '二候 靡草死', '三候 麦秋至'],
    poetry: '夜来南风起，小麦覆陇黄。',
    guidance: '物致于此，小得盈满。麦穗初齐，江河水满。',
    recommendedPlaces: ['珠海·情侣海湾', '汕头·南澳海丝', '西安·秦陵祖龙']
  },
  {
    id: 'mangzhong',
    name: '芒种',
    pinyin: 'Máng Zhòng',
    angle: 120,
    season: 'summer',
    solarLongitude: 75,
    threePhenology: ['一候 螳螂生', '二候 鵙始鸣', '三候 反舌无声'],
    poetry: '乙酉甲申雷雨惊，乘除却贺芒种晴。',
    guidance: '有芒之谷类作物可种，天下农人稼穑最忙之时。',
    recommendedPlaces: ['湛江·雷州古港', '茂名·高凉古郡', '成都·青城仙幽']
  },
  {
    id: 'xiazhi',
    name: '夏至',
    pinyin: 'Xià Zhì',
    angle: 135,
    season: 'summer',
    solarLongitude: 90,
    threePhenology: ['一候 鹿角解', '二候 蝉始鸣', '三候 半夏生'],
    poetry: '绿筠尚含粉，圆荷始散芳。',
    guidance: '日北至，日长之至，日影短至。正阳之气鼎盛极点。',
    recommendedPlaces: ['阳江·海陵银滩', '汕尾·红海金湾', '拉萨·布达拉宫']
  },
  {
    id: 'xiaoshu',
    name: '小暑',
    pinyin: 'Xiǎo Shǔ',
    angle: 150,
    season: 'summer',
    solarLongitude: 105,
    threePhenology: ['一候 温风至', '二候 蟋蟀居宇', '三候 鹰始鸷'],
    poetry: '倏忽温风至，因循小暑来。',
    guidance: '盛夏伊始，温风涤荡。宜临水避暑，观星纳凉。',
    recommendedPlaces: ['云浮·蟠龙石窟', '清远·连州地下河', '九寨沟·五彩神池']
  },
  {
    id: 'dashu',
    name: '大暑',
    pinyin: 'Dà Shǔ',
    angle: 165,
    season: 'summer',
    solarLongitude: 120,
    threePhenology: ['一候 腐草为萤', '二候 土润溽暑', '三候 大雨时行'],
    poetry: '何以销烦暑，端居一室中。',
    guidance: '一年中最热之时，雷雨丰沛，大地湿热蒸腾。',
    recommendedPlaces: ['肇庆·七星仙岩', '韶关·南华祖庭', '峨眉山·金顶梵光']
  },
  {
    id: 'liqiu',
    name: '立秋',
    pinyin: 'Lì Qiū',
    angle: 180,
    season: 'autumn',
    solarLongitude: 135,
    threePhenology: ['一候 凉风至', '二候 白露生', '三候 寒蝉鸣'],
    poetry: '乳鸦啼散玉屏空，一枕新凉一扇风。',
    guidance: '秋风初起，暑去凉来。山海之间金风飒爽。',
    recommendedPlaces: ['广州·白云仙阁', '佛山·西樵神岩', '北京·故宫红墙']
  },
  {
    id: 'chushu',
    name: '处暑',
    pinyin: 'Chù Shǔ',
    angle: 195,
    season: 'autumn',
    solarLongitude: 150,
    threePhenology: ['一候 鹰乃祭鸟', '二候 天地始肃', '三候 禾乃登'],
    poetry: '处暑无三日，新凉直万金。',
    guidance: '出暑退热，秋意渐浓。开海捕鱼，千帆竞发。',
    recommendedPlaces: ['湛江·硇洲灯塔', '阳江·闸坡渔港', '泰山·日出天街']
  },
  {
    id: 'bailu',
    name: '白露',
    pinyin: 'Bái Lù',
    angle: 210,
    season: 'autumn',
    solarLongitude: 165,
    threePhenology: ['一候 鸿雁来', '二候 玄鸟归', '三候 群鸟养羞'],
    poetry: '蒹葭苍苍，白露为霜。所谓伊人，在水一方。',
    guidance: '水土湿气凝结为白露，秋高气爽，观星绝佳。',
    recommendedPlaces: ['惠州·西湖晴岚', '东莞·可园雅韵', '苏州·拙政秋水']
  },
  {
    id: 'qiufen',
    name: '秋分',
    pinyin: 'Qiū Fēn',
    angle: 225,
    season: 'autumn',
    solarLongitude: 180,
    threePhenology: ['一候 雷始收声', '二候 蛰虫坯户', '三候 水始涸'],
    poetry: '金气秋分，风清露冷秋期半。',
    guidance: '秋季过半，阴阳再平。古人秋分祭月，酬谢丰收。',
    recommendedPlaces: ['揭阳·双溪流泉', '潮州·广济古浮桥', '曲阜·孔庙文海']
  },
  {
    id: 'hanlu',
    name: '寒露',
    pinyin: 'Hán Lù',
    angle: 240,
    season: 'autumn',
    solarLongitude: 195,
    threePhenology: ['一候 鸿雁来宾', '二候 雀入大水为蛤', '三候 菊有黄华'],
    poetry: '袅袅凉风动，凄凄寒露零。',
    guidance: '气温骤降，露气寒冷。山林重叠泛红，正是登高赏菊之时。',
    recommendedPlaces: ['阳江·十里银滩', '梅州·千佛古塔', '张家界·天门神洞']
  },
  {
    id: 'shuangjiang',
    name: '霜降',
    pinyin: 'Shuāng Jiàng',
    angle: 255,
    season: 'autumn',
    solarLongitude: 210,
    threePhenology: ['一候 豺乃祭兽', '二候 草木黄落', '三候 蜇虫咸俯'],
    poetry: '山明水净夜来霜，数树深红出浅黄。',
    guidance: '秋季最后一个节气，霜凝叶落，天地萧肃。',
    recommendedPlaces: ['韶关·梅关古道', '清远·瑶寨烟霞', '武当山·绝壁金顶']
  },
  {
    id: 'lidong',
    name: '立冬',
    pinyin: 'Lì Dōng',
    angle: 270,
    season: 'winter',
    solarLongitude: 225,
    threePhenology: ['一候 水始冰', '二候 地始冻', '三候 雉入大水为蜃'],
    poetry: '冻笔新诗懒写，寒炉美酒时温。',
    guidance: '冬之始也，水始成冰。万物伏藏，修养生息。',
    recommendedPlaces: ['深圳·大梅沙晴浪', '珠海·日月双贝', '长白山·天池玄冰']
  },
  {
    id: 'xiaoxue',
    name: '小雪',
    pinyin: 'Xiǎo Xuě',
    angle: 285,
    season: 'winter',
    solarLongitude: 240,
    threePhenology: ['一候 虹藏不见', '二候 天气上升地气下降', '三候 闭塞而成冬'],
    poetry: '莫怪虹无影，如今小雪时。',
    guidance: '天寒地冻，微雪初飘。岭南仍暖，北方已皑皑。',
    recommendedPlaces: ['中山·香山古阁', '江门·圭峰古峦', '平遥·雪映晋城']
  },
  {
    id: 'daxue',
    name: '大雪',
    pinyin: 'Dà Xuě',
    angle: 300,
    season: 'winter',
    solarLongitude: 255,
    threePhenology: ['一候 鹖鴠不鸣', '二候 虎始交', '三候 荔挺出'],
    poetry: '大雪江南见未曾，今年方始是严凝。',
    guidance: '雪盛日深，万里冰封。宜温酒煮茶，研读山海舆图。',
    recommendedPlaces: ['河源·佗城古邑', '茂名·茂名红壤', '哈尔滨·雪国索菲亚']
  },
  {
    id: 'dongzhi',
    name: '冬至',
    pinyin: 'Dōng Zhì',
    angle: 315,
    season: 'winter',
    solarLongitude: 270,
    threePhenology: ['一候 蚯蚓结', '二候 麋角解', '三候 水泉动'],
    poetry: '天时人事日相催，冬至阳生春又来。',
    guidance: '日南之至，日短之至，日影长之至。一阳初生，大吉之日。',
    recommendedPlaces: ['广州·五仙古观', '佛山·顺德水乡', '洛阳·龙门大佛']
  },
  {
    id: 'xiaohan',
    name: '小寒',
    pinyin: 'Xiǎo Hán',
    angle: 330,
    season: 'winter',
    solarLongitude: 285,
    threePhenology: ['一候 雁北乡', '二候 鹊始巢', '三候 雉始雊'],
    poetry: '小寒料峭，一番春意催梅料。',
    guidance: '冷气积久而寒，梅花初绽，春意暗涌。',
    recommendedPlaces: ['汕尾·玄武仙山', '潮州·湘桥夕照', '普陀山·紫竹潮音']
  },
  {
    id: 'dahan',
    name: '大寒',
    pinyin: 'Dà Hán',
    angle: 345,
    season: 'winter',
    solarLongitude: 300,
    threePhenology: ['一候 鸡始乳', '二候 征鸟厉疾', '三候 水泽腹坚'],
    poetry: '大寒雪未消，闭户不能出。',
    guidance: '岁之终也，大寒迎年。辞旧迎新，静候东风。',
    recommendedPlaces: ['云浮·新兴国恩寺', '汕头·礐石胜境', '五台山·金界银峦']
  }
];
