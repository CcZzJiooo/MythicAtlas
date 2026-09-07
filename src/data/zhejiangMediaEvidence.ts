/**
 * 浙江省 11 地级市高精真实摄影图片证据准入台账
 *
 * 遵循项目准则第 3 条与最高大纲：
 * 所有用于表达地方、行政区、地标、自然地貌或文化设施的图片，
 * 必须是真实、时效、准确、对应的高清照片，并记录来源、时间、匹配说明和授权边界。
 */

export interface ZhejiangMediaAuditEntry {
  readonly id: string;
  readonly destinationId: string;
  readonly role: 'hero' | 'gallery';
  readonly localAssetPath: string;
  readonly title: string;
  readonly landmark: string;
  readonly source: string;
  readonly license: string;
  readonly matchingNote: string;
}

export const ZHEJIANG_MEDIA_EVIDENCE_AUDIT: readonly ZhejiangMediaAuditEntry[] = [
  // 杭州市
  {
    id: 'hangzhou-hero',
    destinationId: 'hangzhou',
    role: 'hero',
    localAssetPath: '/images/landmarks/hangzhou_0.jpg',
    title: '西湖 · 雷峰夕照',
    landmark: '雷峰塔与西湖全景',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '雷峰塔与西湖黄昏实景摄影，准确体现西湖十景雷峰夕照'
  },
  {
    id: 'hangzhou-gallery-1',
    destinationId: 'hangzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/hangzhou_1.png',
    title: '三潭印月',
    landmark: '西湖小瀛洲三潭印月石塔',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '西湖三潭石塔湖水实景'
  },
  {
    id: 'hangzhou-gallery-2',
    destinationId: 'hangzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/hangzhou_2.jpg',
    title: '灵隐禅寺',
    landmark: '飞来峰与灵隐大雄宝殿',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '江南禅宗名刹飞来峰造像实景'
  },
  {
    id: 'hangzhou-gallery-3',
    destinationId: 'hangzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/hangzhou_3.jpg',
    title: '钱塘江大潮',
    landmark: '钱塘江之江大桥与潮涌',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '钱塘江入海口江潮实景'
  },

  // 宁波市
  {
    id: 'ningbo-hero',
    destinationId: 'ningbo',
    role: 'hero',
    localAssetPath: '/images/landmarks/ningbo_0.jpg',
    title: '宁波天一阁',
    landmark: '天一阁古建筑藏书楼与明池',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '华夏现存最古私家藏书楼真实园林实景'
  },
  {
    id: 'ningbo-gallery-1',
    destinationId: 'ningbo',
    role: 'gallery',
    localAssetPath: '/images/landmarks/ningbo_1.jpg',
    title: '宁波三江口',
    landmark: '三江口甬江姚江奉化江交汇处',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '宁波海上丝绸之路古港三江汇流实景'
  },
  {
    id: 'ningbo-gallery-2',
    destinationId: 'ningbo',
    role: 'gallery',
    localAssetPath: '/images/landmarks/ningbo_2.jpg',
    title: '东钱湖',
    landmark: '东钱湖十里四香与湖山烟波',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '浙东第一大天然淡水湖实景'
  },
  {
    id: 'ningbo-gallery-3',
    destinationId: 'ningbo',
    role: 'gallery',
    localAssetPath: '/images/landmarks/ningbo_3.jpg',
    title: '宁波保国寺',
    landmark: '保国寺北宋大殿无梁木构',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '江南现存最古老完整的宋代木结构建筑实景'
  },

  // 温州市
  {
    id: 'wenzhou-hero',
    destinationId: 'wenzhou',
    role: 'hero',
    localAssetPath: '/images/landmarks/wenzhou_0.jpg',
    title: '温州雁荡山',
    landmark: '雁荡山灵峰与剪刀峰奇嶂',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '白垩纪流纹岩火山地质绝壁奇峰实景'
  },
  {
    id: 'wenzhou-gallery-1',
    destinationId: 'wenzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/wenzhou_1.jpg',
    title: '温州江心屿',
    landmark: '瓯江江心双塔与江心寺',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '瓯江蓬莱江心孤屿实景'
  },
  {
    id: 'wenzhou-gallery-2',
    destinationId: 'wenzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/wenzhou_2.jpg',
    title: '温州大龙湫',
    landmark: '雁荡山大龙湫百丈飞瀑',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '华夏名瀑飞流绝壁实景'
  },
  {
    id: 'wenzhou-gallery-3',
    destinationId: 'wenzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/wenzhou_3.jpg',
    title: '温州楠溪江',
    landmark: '楠溪江山水画廊与古石桥',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '三百里楠溪江诗画山水自然实景'
  },

  // 绍兴市
  {
    id: 'shaoxing-hero',
    destinationId: 'shaoxing',
    role: 'hero',
    localAssetPath: '/images/landmarks/shaoxing_0.jpg',
    title: '绍兴兰亭',
    landmark: '兰亭曲水流觞与鹅池碑亭',
    source: 'Wikimedia Commons',
    license: 'Public Domain / CC BY-SA 4.0',
    matchingNote: '王羲之兰亭集序诞生地实景'
  },
  {
    id: 'shaoxing-gallery-1',
    destinationId: 'shaoxing',
    role: 'gallery',
    localAssetPath: '/images/landmarks/shaoxing_1.jpg',
    title: '绍兴沈园',
    landmark: '沈园宋代园林与钗头凤诗壁',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '陆游唐婉千古名园池台实景'
  },
  {
    id: 'shaoxing-gallery-2',
    destinationId: 'shaoxing',
    role: 'gallery',
    localAssetPath: '/images/landmarks/shaoxing_2.jpg',
    title: '绍兴鉴湖与八字桥',
    landmark: '八字桥古运河与水乡水系',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '世界文化遗产古桥水乡实景'
  },
  {
    id: 'shaoxing-gallery-3',
    destinationId: 'shaoxing',
    role: 'gallery',
    localAssetPath: '/images/landmarks/shaoxing_3.jpg',
    title: '鲁迅故里',
    landmark: '鲁迅祖居与三味书屋',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '水乡街巷与鲁迅笔下风土实景'
  },

  // 湖州市
  {
    id: 'huzhou-hero',
    destinationId: 'huzhou',
    role: 'hero',
    localAssetPath: '/images/landmarks/huzhou_0.jpg',
    title: '湖州莫干山',
    landmark: '莫干山清凉万竿竹海与剑池',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '干将莫邪铸剑名山竹林实景'
  },
  {
    id: 'huzhou-gallery-1',
    destinationId: 'huzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/huzhou_1.jpg',
    title: '南浔古镇',
    landmark: '百间楼与小莲庄水阁',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '江南丝商巨富园林水乡实景'
  },
  {
    id: 'huzhou-gallery-2',
    destinationId: 'huzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/huzhou_2.jpg',
    title: '湖州太湖',
    landmark: '项王公园与太湖烟波',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '太湖南岸湖光水色实景'
  },
  {
    id: 'huzhou-gallery-3',
    destinationId: 'huzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/huzhou_3.jpg',
    title: '湖州飞英塔',
    landmark: '飞英塔石塔木塔塔中塔',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '华夏古代佛塔稀世建筑实景'
  },

  // 嘉兴市
  {
    id: 'jiaxing-hero',
    destinationId: 'jiaxing',
    role: 'hero',
    localAssetPath: '/images/landmarks/jiaxing_0.jpg',
    title: '嘉兴南湖',
    landmark: '南湖烟雨楼与红船湖心岛',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '南湖烟雨楼与江南水色实景'
  },
  {
    id: 'jiaxing-gallery-1',
    destinationId: 'jiaxing',
    role: 'gallery',
    localAssetPath: '/images/landmarks/jiaxing_1.jpg',
    title: '乌镇',
    landmark: '乌镇西栅水阁石桥航拍',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '水阁枕水古桥水乡实景'
  },
  {
    id: 'jiaxing-gallery-2',
    destinationId: 'jiaxing',
    role: 'gallery',
    localAssetPath: '/images/landmarks/jiaxing_2.jpg',
    title: '西塘古镇',
    landmark: '西塘千米烟雨长廊与送子来凤桥',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '吴越交界经典长廊古镇实景'
  },
  {
    id: 'jiaxing-gallery-3',
    destinationId: 'jiaxing',
    role: 'gallery',
    localAssetPath: '/images/landmarks/jiaxing_3.jpg',
    title: '海宁钱塘潮',
    landmark: '钱塘江海宁一线大潮奔涌',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '天下第一潮盐官一线潮实景'
  },

  // 金华市
  {
    id: 'jinhua-hero',
    destinationId: 'jinhua',
    role: 'hero',
    localAssetPath: '/images/landmarks/jinhua_0.jpg',
    title: '金华尖峰山',
    landmark: '金华北山双龙溶洞山脉与市景',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '金华双龙风景区北山俯瞰实景'
  },
  {
    id: 'jinhua-gallery-1',
    destinationId: 'jinhua',
    role: 'gallery',
    localAssetPath: '/images/landmarks/jinhua_1.jpg',
    title: '金华八咏楼',
    landmark: '八咏楼古迹与古婺州城楼',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '沈约李清照千古绝唱诗楼实景'
  },
  {
    id: 'jinhua-gallery-2',
    destinationId: 'jinhua',
    role: 'gallery',
    localAssetPath: '/images/landmarks/jinhua_2.jpg',
    title: '东阳卢宅',
    landmark: '肃雍堂九进院落明清雕刻',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '中国民间故宫木雕建筑实景'
  },
  {
    id: 'jinhua-gallery-3',
    destinationId: 'jinhua',
    role: 'gallery',
    localAssetPath: '/images/landmarks/jinhua_3.jpg',
    title: '兰溪诸葛八卦村',
    landmark: '诸葛村钟池阴阳太极水塘',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '九宫八卦奇村实景'
  },

  // 衢州市
  {
    id: 'quzhou-hero',
    destinationId: 'quzhou',
    role: 'hero',
    localAssetPath: '/images/landmarks/quzhou_0.jpg',
    title: '衢州古城',
    landmark: '衢州明清城墙与大南门',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '铁顶衢州四省通衢古城垣实景'
  },
  {
    id: 'quzhou-gallery-1',
    destinationId: 'quzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/quzhou_1.jpg',
    title: '孔氏南宗家庙',
    landmark: '南孔圣地家庙大成殿古礼',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '南孔家庙大成殿实景'
  },
  {
    id: 'quzhou-gallery-2',
    destinationId: 'quzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/quzhou_2.jpg',
    title: '江郎山',
    landmark: '江山江郎山三爿石丹霞奇峰',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '世界自然遗产华夏第一丹霞石柱实景'
  },
  {
    id: 'quzhou-gallery-3',
    destinationId: 'quzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/quzhou_3.jpg',
    title: '水亭门',
    landmark: '水亭门历史文化街区古城楼',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '钱塘江源头古街码头水关实景'
  },

  // 舟山市
  {
    id: 'zhoushan-hero',
    destinationId: 'zhoushan',
    role: 'hero',
    localAssetPath: '/images/landmarks/zhoushan_0.jpg',
    title: '普陀山南海观音',
    landmark: '南海观音大铜像临海圣境',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '海天佛国三十三米南海观音铜像实景'
  },
  {
    id: 'zhoushan-gallery-1',
    destinationId: 'zhoushan',
    role: 'gallery',
    localAssetPath: '/images/landmarks/zhoushan_1.jpg',
    title: '普陀山普济禅寺',
    landmark: '普济寺海印池与御碑亭',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '普陀山第一前寺名刹实景'
  },
  {
    id: 'zhoushan-gallery-2',
    destinationId: 'zhoushan',
    role: 'gallery',
    localAssetPath: '/images/landmarks/zhoushan_2.jpg',
    title: '岱山岛',
    landmark: '岱山蓬莱仙岛海天风光',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '舟山群岛千岛海天风光实景'
  },
  {
    id: 'zhoushan-gallery-3',
    destinationId: 'zhoushan',
    role: 'gallery',
    localAssetPath: '/images/landmarks/zhoushan_3.jpg',
    title: '朱家尖',
    landmark: '朱家尖南沙十里金沙海滩',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '东海金沙碧浪海蚀地貌实景'
  },

  // 台州市
  {
    id: 'taizhou-hero',
    destinationId: 'taizhou',
    role: 'hero',
    localAssetPath: '/images/landmarks/taizhou_0.jpg',
    title: '天台山国清寺',
    landmark: '国清寺隋代古刹与隋塔',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '天台宗祖庭千年古寺实景'
  },
  {
    id: 'taizhou-gallery-1',
    destinationId: 'taizhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/taizhou_1.jpg',
    title: '神仙居',
    landmark: '仙居神仙居火山流纹岩胜景',
    source: 'Wikimedia Commons',
    license: 'Public Domain / CC BY-SA 4.0',
    matchingNote: '仙山仙境奇峰险道实景'
  },
  {
    id: 'taizhou-gallery-2',
    destinationId: 'taizhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/taizhou_2.jpg',
    title: '台州府城墙',
    landmark: '临海江南长城与灵江大桥',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '临海千年古府城墙灵江要塞实景'
  },
  {
    id: 'taizhou-gallery-3',
    destinationId: 'taizhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/taizhou_3.jpg',
    title: '天台山石梁飞瀑',
    landmark: '天台山石梁天生石桥飞瀑',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '天下第一石梁绝壁飞瀑实景'
  },

  // 丽水市
  {
    id: 'lishui-hero',
    destinationId: 'lishui',
    role: 'hero',
    localAssetPath: '/images/landmarks/lishui_0.jpg',
    title: '云和梯田',
    landmark: '云和高山云海梯田与山村古建',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '华东第一大千年梯田实景'
  },
  {
    id: 'lishui-gallery-1',
    destinationId: 'lishui',
    role: 'gallery',
    localAssetPath: '/images/landmarks/lishui_1.jpg',
    title: '龙泉青瓷古窑',
    landmark: '龙泉青瓷传世梅子青犀牛望月盘',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '人类非遗龙泉青瓷传统工艺实物'
  },
  {
    id: 'lishui-gallery-2',
    destinationId: 'lishui',
    role: 'gallery',
    localAssetPath: '/images/landmarks/lishui_2.jpg',
    title: '缙云仙都鼎湖峰',
    landmark: '鼎湖峰巨石笋柱与练溪晨雾',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '黄帝飞升黄帝祠宇仙都胜景实景'
  },
  {
    id: 'lishui-gallery-3',
    destinationId: 'lishui',
    role: 'gallery',
    localAssetPath: '/images/landmarks/lishui_3.jpg',
    title: '古堰画乡通济堰',
    landmark: '通济堰千年水利工程与瓯江古帆',
    source: 'Wikimedia Commons',
    license: 'CC BY-SA 4.0',
    matchingNote: '世界灌溉工程遗产通济堰实景'
  }
];
