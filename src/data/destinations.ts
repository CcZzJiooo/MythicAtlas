import type { DestinationItem } from '../types';
import { createRegionReference } from './regions';

export const DESTINATIONS_DATA: DestinationItem[] = [
  {
    id: 'guangzhou',
    cityName: '广州市',
    dayIndex: 0,
    dateKey: '2026-08-08',
    solarTerm: '立春 · 东风解冻',
    modernName: '广州 · 白云仙山与越秀镇海楼',
    ancientMythicName: '羊城五仙神岳',
    region: createRegionReference('pearl_river_delta', '珠三角 · 广府祖源'),
    country: '中国 · 广东',
    coordinates: { lat: 23.1288, lng: 113.2590, altitude: 382, mapX: 0.1, mapZ: 0.1 },
    element: 'wood',
    colorTheme: { primary: '#2D7A68', glow: '#48BB78', accent: '#F6AD55' },
    heroImage: '/images/landmarks/guangzhou_0.jpg',
    heroImageCaption: '越秀山 · 广州博物馆镇海楼古建筑实景',
    galleryImages: [
      '/images/landmarks/guangzhou_1.jpg',
      '/images/landmarks/guangzhou_2.jpg',
      '/images/landmarks/guangzhou_moxing_summit_2023.jpg'
    ],
    galleryCaptions: [
      '越秀公园 · 羊城标志五羊石雕实景',
      '珠江沿岸 · 广州塔与海心沙天际线实景',
      '白云山摩星岭 · 摩星岭牌坊与登山石阶实景'
    ],
    bestSeason: '早春花市至深秋 · 珠江微波羊城春色',
    geologyType: '白垩纪花岗岩低山丘陵与珠江三角洲冲积平原',
    mythicPoem: '五仙乘彩驾祥云，手捧嘉禾降楚氛。\n化作灵羊留福泽，千秋穗水自氤氲。',
    mythicLore: '《山海异志·南山经》补：“南海之滨，古名楚庭。周夷王时，有五色仙人各骑五色仙羊，手执一茎六出之嘉禾降于白云山之巅，赐禾于万民，祝曰‘愿此阛阓永无饥荒’。言讫腾空仙去，灵羊化为巨石。”',
    realHistory: '广州作为海上丝绸之路发祥地与岭南文化中心，拥有2200多年建城史。白云山素有“羊城第一秀”之美誉，峰峦重叠，溪涧纵横；越秀山上的镇海楼登高可俯瞰三江汇流，自古为岭南商都人文枢纽。',
    guardian: {
      name: '仙五羊',
      title: '司丰祈谷瑞角仙兽',
      classicQuote: '南海有灵山，有仙乘五色羊，衔嘉禾而来，遗化为石，故号五羊城。——《南越志》',
      domainPower: '调和五谷丰登、聚纳四海商贾、佑护千秋福泽',
      symbolIcon: '🐐'
    },
    seal: { sealName: '羊城五仙之印', sealScript: '穗城祥瑞', inkColor: '#D93829' },
    landscapeTag: '名山古邑'
  },
  {
    id: 'shenzhen',
    cityName: '深圳市',
    dayIndex: 1,
    dateKey: '2026-08-09',
    solarTerm: '春分 · 玄鸟至',
    modernName: '深圳 · 梧桐烟云与大鹏千户所城',
    ancientMythicName: '大鹏扶摇云渊',
    region: createRegionReference('pearl_river_delta', '珠三角 · 先锋前沿'),
    country: '中国 · 广东',
    coordinates: { lat: 22.5431, lng: 114.0596, altitude: 943, mapX: 0.45, mapZ: 0.35 },
    element: 'gold',
    colorTheme: { primary: '#1A365D', glow: '#63B3ED', accent: '#FAF089' },
    heroImage: '/images/landmarks/shenzhen_0.jpg',
    heroImageCaption: '大鹏半岛 · 大鹏守御千户所城古城楼实景',
    galleryImages: [
      '/images/landmarks/shenzhen_1.jpg',
      '/images/landmarks/shenzhen_wutong_tower_2022.jpg',
      '/images/landmarks/shenzhen_bay_park_2018.jpg'
    ],
    galleryCaptions: [
      '深圳福田 · 平安金融中心现代天际线实景',
      '梧桐山 · 深圳电视塔与山脊云气实景',
      '深圳湾公园 · 湾区天际线与滨水云天实景'
    ],
    bestSeason: '春秋气候宜人 · 登梧桐顶眺望大鹏湾万顷波涛',
    geologyType: '侏罗纪火山岩山体与滨海花岗岩曲折岬角',
    mythicPoem: '绝云振翼九万里，大尾乘溟化作鹏。\n沧海腾波开巨浸，鹏城一日上层凌。',
    mythicLore: '《海内东经》深述：“南海之东，大鹏湾深邃如墨，有巨鲲潜息其底。每逢朔风骤起，鲲化为鹏，翼若垂天之云，自梧桐天峰抟扶摇而上，击水三千里。南溟巨浪皆随其翼翻涌。”',
    realHistory: '深圳大鹏半岛矗立着始建于明洪武二十七年的“大鹏守御千户所城”，为明清海防要塞，深圳别称“鹏城”即源于此。梧桐山为深圳最高峰，云蒸霞蔚，山海相拥，见证着当代改革开放的时代传奇。',
    guardian: {
      name: '鲲鹏',
      title: '绝云扶摇乘溟巨羽',
      classicQuote: '北冥有鱼，其名为鲲，化而为鸟，其名为鹏。鹏之徙于南冥也，水击三千里。——《庄子·逍遥游》',
      domainPower: '御役沧海狂澜、瞬息破空疾翔、启迪拓荒豪情',
      symbolIcon: '🦅'
    },
    seal: { sealName: '大鹏扶摇之玺', sealScript: '鹏城破浪', inkColor: '#B32014' },
    landscapeTag: '海防雄关'
  },
  {
    id: 'zhuhai',
    cityName: '珠海市',
    dayIndex: 2,
    dateKey: '2026-08-10',
    solarTerm: '夏至 · 鹿角解',
    modernName: '珠海 · 情侣路日月贝与万山群岛',
    ancientMythicName: '沧海双贝仙屿',
    region: createRegionReference('pearl_river_delta', '珠三角 · 百岛之市'),
    country: '中国 · 广东',
    coordinates: { lat: 22.2639, lng: 113.5767, altitude: 437, mapX: 0.15, mapZ: 0.55 },
    element: 'water',
    colorTheme: { primary: '#1E5F74', glow: '#4FD1C5', accent: '#E8DEC8' },
    heroImage: '/images/landmarks/zhuhai_0.jpg',
    heroImageCaption: '野狸岛 · 珠海大剧院日月贝双贝实景',
    galleryImages: [
      '/images/landmarks/zhuhai_1.jpg',
      '/images/landmarks/zhuhai_2.jpg',
      '/images/landmarks/zhuhai_3.jpg'
    ],
    galleryCaptions: [
      '情侣路 · 珠海渔女雕像与香炉湾碧波实景',
      '伶仃洋 · 港珠澳大桥跨海长虹实景',
      '万山群岛 · 东澳岛南沙湾碧海实景'
    ],
    bestSeason: '盛夏晴岚 · 漫步情侣路远眺港珠澳跨海长虹',
    geologyType: '珠江口溺谷海湾与花岗岩沉溺侵蚀群岛',
    mythicPoem: '碧落双贝浮浩渺，月明珠蚌吐朝辉。\n长虹跨海通三界，万顷波澄宿鸟归。',
    mythicLore: '《大荒南经》言：“南海巨浸之中，有珠玑万斛。夜深月朗之时，神女化为白螺大贝浮出波心，吐纳夜光之珠，照澈海天三百里。万山群岛皆其遗落之玉珮化成。”',
    realHistory: '珠海坐拥146座海岛，被称为“百岛之城”。中国唯一建在海岛上的歌剧院“日月贝”宛如两颗洁白巨蚌盛开在野狸岛畔；港珠澳大桥如长龙贯通伶仃洋，是现代工程与自然山海完美交融的浪漫海岸。',
    guardian: {
      name: '螭吻',
      title: '吞波辟水灵兽',
      classicQuote: '南海之螭，好望喜吞，水精之兽也，能平风波。——《山海百兽传》',
      domainPower: '调御狂风巨浪、凝聚沧海明珠、镇伏水患',
      symbolIcon: '🐚'
    },
    seal: { sealName: '南海明珠之印', sealScript: '双贝流光', inkColor: '#C02C1D' },
    landscapeTag: '海岛歌剧'
  },
  {
    id: 'foshan',
    cityName: '佛山市',
    dayIndex: 3,
    dateKey: '2026-08-11',
    solarTerm: '雨水 · 獭祭鱼',
    modernName: '佛山 · 西樵灵山飞瀑与禅城祖庙',
    ancientMythicName: '西樵天池灵洞',
    region: createRegionReference('pearl_river_delta', '珠三角 · 禅宗武术'),
    country: '中国 · 广东',
    coordinates: { lat: 23.0242, lng: 113.1134, altitude: 346, mapX: -0.1, mapZ: 0.18 },
    element: 'earth',
    colorTheme: { primary: '#C47D3B', glow: '#F6AD55', accent: '#2D7A68' },
    heroImage: '/images/landmarks/foshan_0.jpg',
    heroImageCaption: '禅城祖庙 · 北宋灵应祠万福台古建实景',
    galleryImages: [
      '/images/landmarks/foshan_xiqiao_north_gate_2021.jpg',
      '/images/landmarks/foshan_shiwan_ridge_2019.jpg',
      '/images/landmarks/foshan_3.jpg'
    ],
    galleryCaptions: [
      '西樵山北门 · 西樵山国家地质公园入口实景',
      '石湾陶师祖庙 · 佛山陶塑脊饰实景',
      '东平河畔 · 佛山世纪莲与现代禅城风貌实景'
    ],
    bestSeason: '春雨润泽 · 拜谒祖庙非遗醒狮与西樵云海飞瀑',
    geologyType: '第三纪古火山死火山口与火山碎屑岩台地',
    mythicPoem: '火峰千载化清泉，洞壑深藏隐逸仙。\n祖庙金瓦雕古魄，醒狮一跃动南天。',
    mythicLore: '《南越旧志》录：“西樵山乃古太古地火喷涌而成，后地火熄而泉水注之，峰顶化为天池巨泽。有醒狮神兽宿于深涧，毛发如焰，首戴金角，踩桩登高如履平地，一声长啸百魅皆退。”',
    realHistory: '西樵山被誉为“珠江文明的灯塔”，七十二峰错落有致，拥有四方竹与天池瀑布；佛山祖庙始建于北宋元丰年间，汇聚三雕两塑岭南古建筑精粹，更是黄飞鸿、叶问武术与广东醒狮之祖源地。',
    guardian: {
      name: '醒狮',
      title: '驱邪护正仁威灵狮',
      classicQuote: '南国有灵狮，五彩金缕，喜跃腾踏，鼓角齐鸣则百邪遁走。——《岭南杂记》',
      domainPower: '破除邪祟阴霾、振奋刚阳浩气、通达武道真意',
      symbolIcon: '🦁'
    },
    seal: { sealName: '西樵灵境之玺', sealScript: '醒狮凌空', inkColor: '#D93829' },
    landscapeTag: '名山武术'
  },
  {
    id: 'shaoguan',
    cityName: '韶关市',
    dayIndex: 4,
    dateKey: '2026-08-12',
    solarTerm: '惊蛰 · 桃始华',
    modernName: '韶关 · 丹霞赤壁地貌与南华禅寺',
    ancientMythicName: '南岭赤霞神壁',
    region: createRegionReference('nanling_north', '粤北 · 南岭屏障'),
    country: '中国 · 广东',
    coordinates: { lat: 24.8108, lng: 113.5966, altitude: 408, mapX: 0.12, mapZ: -0.6 },
    element: 'fire',
    colorTheme: { primary: '#9C4221', glow: '#F56565', accent: '#ECC94B' },
    heroImage: '/images/landmarks/shaoguan_0.jpg',
    heroImageCaption: '丹霞山 · 世界自然遗产阳元石与赤壁丹崖实景',
    galleryImages: [
      '/images/landmarks/shaoguan_1.jpg',
      '/images/landmarks/shaoguan_2.jpg',
      '/images/landmarks/shaoguan_3.jpg'
    ],
    galleryCaptions: [
      '韶州府学宫 · 岭南千年儒家古建道场实景',
      '韶关百年东街 · 明代风采楼与三江六岸实景',
      '乐昌金鸡岭 · 丹霞奇峰险道自然风光实景'
    ],
    bestSeason: '春雷初动 · 漫山春木映衬丹霞赤壁胜绝人间',
    geologyType: '白垩系红色砂砾岩世界“丹霞地貌”命名地',
    mythicPoem: '色如渥丹灿若霞，千峰削玉立天涯。\n曹溪一勺菩提水，洗尽人间万劫沙。',
    mythicLore: '《西山经》赤石纪：“南岭之腹，有石山千重，色赤如凝血，如天帝打翻赤霞神丹所凝。神禽毕方巡行其上，单足踏岩，吐九阳真火，使万年岩壁金石不朽。山下有曹溪古潭，乃六祖慧能悟道真境。”',
    realHistory: '韶关丹霞山是全球“丹霞地貌”的命名地，被联合国列为世界自然遗产。群峰如林、赤壁如霞，锦江碧水如玉带穿梭其间；南华禅寺则是中国禅宗六祖慧能宏扬“南宗禅法”之菩提道场。',
    guardian: {
      name: '毕方',
      title: '丹霞赤焰灵禽',
      classicQuote: '章莪之山，有鸟焉，状如鹤，一足，赤文青质而白喙，名曰毕方。——《山海经·西山经》',
      domainPower: '调御地脉真火、凝铸赤岩金石、开悟明心',
      symbolIcon: '🔥'
    },
    seal: { sealName: '丹霞天工之章', sealScript: '赤壁飞丹', inkColor: '#A92317' },
    landscapeTag: '丹霞地貌'
  },
  {
    id: 'zhaoqing',
    cityName: '肇庆市',
    dayIndex: 5,
    dateKey: '2026-08-13',
    solarTerm: '立秋 · 凉风至',
    modernName: '肇庆 · 七星岩湖山与鼎湖山原始雨林',
    ancientMythicName: '北斗七星洞天',
    region: createRegionReference('pearl_river_delta', '珠三角 · 砚都灵秀'),
    country: '中国 · 广东',
    coordinates: { lat: 23.0470, lng: 112.4650, altitude: 1000, mapX: -0.4, mapZ: 0.15 },
    element: 'water',
    colorTheme: { primary: '#2D7A68', glow: '#48BB78', accent: '#CBD5E0' },
    heroImage: '/images/landmarks/zhaoqing_0.jpg',
    heroImageCaption: '七星岩 · 仙女湖喀斯特孤峰与北斗列阵实景',
    galleryImages: [
      '/images/landmarks/zhaoqing_1.jpg',
      '/images/landmarks/zhaoqing_2.jpg',
      '/images/landmarks/zhaoqing_3.jpg'
    ],
    galleryCaptions: [
      '鼎湖山 · 北回归线绿宝石飞水潭实景',
      '宋城古墙 · 肇庆披云楼古迹实景',
      '中国砚都 · 端溪名砚古坑遗址实景'
    ],
    bestSeason: '初秋风爽 · 烟雨七星岩湖光潋滟如置身画卷',
    geologyType: '古生代石灰岩喀斯特孤峰群与南亚热带季风常绿阔叶林',
    mythicPoem: '北斗七星坠碧湖，天工巧布玉珊瑚。\n鼎湖飞瀑雷声吼，绿满人间不用图。',
    mythicLore: '《海内经》奇述：“太古之时，北斗星君手引神线，将天枢、天璇等七星金核掷于西江之畔，化为七座翠石奇峰，立于万顷澄湖之中。神兽白泽常步出溶洞，与隐逸者言古今天地之秘。”',
    realHistory: '七星岩兼具“桂林之山，杭州之水”，七座石灰岩峰如北斗排列在仙女湖上；鼎湖山则是中国第一个国家级自然保护区，被誉为“北回归线上的绿宝石”，飞水潭瀑布负氧离子极高，自古亦产名冠天下的“端砚”。',
    guardian: {
      name: '端溪白泽',
      title: '通晓古今端溪神兽',
      classicQuote: '白泽能言，达于万物之情，出于端溪之水，明心启智。——《抱朴子》及古注',
      domainPower: '洞察天地精微、蕴育端石墨韵、涤荡烦垢',
      symbolIcon: '📜'
    },
    seal: { sealName: '端溪七星之印', sealScript: '星岩洞天', inkColor: '#2C7A7B' },
    landscapeTag: '喀斯特湖山'
  },
  {
    id: 'huizhou',
    cityName: '惠州市',
    dayIndex: 6,
    dateKey: '2026-08-14',
    solarTerm: '芒种 · 螳螂生',
    modernName: '惠州 · 罗浮山第七洞天与西湖苏堤',
    ancientMythicName: '罗浮神仙洞府',
    region: createRegionReference('pearl_river_delta', '珠三角 · 葛洪仙境'),
    country: '中国 · 广东',
    coordinates: { lat: 23.09, lng: 114.41, altitude: 1296, mapX: 0.6, mapZ: 0.1 },
    element: 'wood',
    colorTheme: { primary: '#2F855A', glow: '#68D391', accent: '#ECC94B' },
    heroImage: '/images/landmarks/huizhou_0.jpg',
    heroImageCaption: '惠州西湖 · 苏堤烟柳与泗洲塔实景',
    galleryImages: [
      '/images/landmarks/huizhou_1.jpg',
      '/images/landmarks/huizhou_2.jpg',
      '/images/landmarks/huizhou_3.jpg'
    ],
    galleryCaptions: [
      '罗浮山 · 葛洪炼丹冲虚古观与飞云顶实景',
      '惠东双月湾 · 左右双湾一动一静大洋奇观实景',
      '惠东巽寮湾 · 滨海奇石白沙风光实景'
    ],
    bestSeason: '初夏芒种 · 罗浮品仙荔，西湖苏堤烟柳泛舟',
    geologyType: '燕山期巨型花岗岩侵入拔地山峰',
    mythicPoem: '罗浮四百三十峰，蓬莱一岛飞相从。\n葛翁丹灶香犹在，青鸟飞鸣下碧松。',
    mythicLore: '《神仙传》载：“罗浮山乃蓬莱仙岛之一峰，随波浮游自东海而来，与罗山相合而成。晋代丹圣葛洪携妻鲍姑驻此炼丹，著《抱朴子》，创立岭南医药道脉。神禽青鸾常巡于飞云顶，鸣声清越。”',
    realHistory: '罗浮山道教尊为“第七大洞天、第三十四福地”，峰峦雄奇，泉水清冽；惠州西湖则以苏东坡寓居惠州时筑“苏堤”而闻名遐迩，留下了“日啖荔枝三百颗，不辞长作岭南人”的千古绝唱。',
    guardian: {
      name: '青鸾',
      title: '蓬莱传信灵禽',
      classicQuote: '大荒之中，有青鸟名曰青鸾，西王母之使也，宿于罗浮百草之间。——《山海经》',
      domainPower: '传导九天仙气、祛除瘟疫瘴毒、延年益寿',
      symbolIcon: '🦚'
    },
    seal: { sealName: '罗浮洞天之玺', sealScript: '丹灶仙云', inkColor: '#2F855A' },
    landscapeTag: '洞天福地'
  },
  {
    id: 'shantou',
    cityName: '汕头市',
    dayIndex: 7,
    dateKey: '2026-08-15',
    solarTerm: '小暑 · 温风至',
    modernName: '汕头 · 南澳海岛青澳湾与小公园骑楼',
    ancientMythicName: '南澳神龟溟岛',
    region: createRegionReference('chaoshan_east', '粤东 · 潮汕明珠'),
    country: '中国 · 广东',
    coordinates: { lat: 23.35, lng: 116.68, altitude: 588, mapX: 1.3, mapZ: -0.05 },
    element: 'water',
    colorTheme: { primary: '#006064', glow: '#00E5FF', accent: '#84FFFF' },
    heroImage: '/images/landmarks/shantou_0.jpg',
    heroImageCaption: '南澳岛 · 青澳湾北回归线“自然之门”实景',
    galleryImages: [
      '/images/landmarks/shantou_1.jpg',
      '/images/landmarks/shantou_2.jpg',
      '/images/landmarks/shantou_3.jpg'
    ],
    galleryCaptions: [
      '小公园开埠区 · 中山纪念亭与近代骑楼群实景',
      '南澳跨海大桥 · 碧海长虹实景',
      '礐石风景区 · 飘然亭俯瞰汕头内海湾全景'
    ],
    bestSeason: '盛夏小暑 · 青澳湾黄金沙滩踏浪与北回归线寻日',
    geologyType: '沿海大陆架基岩海岛与曲折海湾海蚀地貌',
    mythicPoem: '溟渤苍茫立巨鳌，雄关北界锁波涛。\n红头画舫通四海，金线横空过画桥。',
    mythicLore: '《海外东经》记：“东海之外，有巨鳌负山浮海，名曰南澳。北回归线穿其背脊而过，立夏正午日影直入无痕。古有乘溟神鲲伴随红头帆船破浪，引潮汕游子开拓四海商埠。”',
    realHistory: '汕头为中国最早开埠通商的沿海特区之一，小公园开埠区保留了中国最大的骑楼群建筑；南澳岛是广东唯一海岛县，坐拥青澳湾与北回归线标志塔“自然之门”，是古代海上丝绸之路重要节点。',
    guardian: {
      name: '巨鳌',
      title: '负海镇波太古神鳌',
      classicQuote: '女娲炼五色石以补苍天，断鳌足以立四极。巨鳌镇南澳，波澜不惊。——《淮南子》',
      domainPower: '镇定四方海啸、稳固海岛根基、引渡远洋商船',
      symbolIcon: '🐢'
    },
    seal: { sealName: '南澳灵鳌之印', sealScript: '溟岛潮涌', inkColor: '#006064' },
    landscapeTag: '碧海仙岛'
  },
  {
    id: 'chaozhou',
    cityName: '潮州市',
    dayIndex: 8,
    dateKey: '2026-08-16',
    solarTerm: '白露 · 鸿雁来',
    modernName: '潮州 · 广济古桥与韩江韩文公祠',
    ancientMythicName: '韩江通神浮梁',
    region: createRegionReference('chaoshan_east', '粤东 · 潮州古城'),
    country: '中国 · 广东',
    coordinates: { lat: 23.66, lng: 116.63, altitude: 450, mapX: 1.25, mapZ: -0.2 },
    element: 'wood',
    colorTheme: { primary: '#744210', glow: '#ECC94B', accent: '#D69E2E' },
    heroImage: '/images/landmarks/chaozhou_0.jpg',
    heroImageCaption: '广济古桥 · 韩江十八梭船廿四洲启闭浮梁实景',
    galleryImages: [
      '/images/landmarks/chaozhou_1.jpg',
      '/images/landmarks/chaozhou_2.jpg',
      '/images/landmarks/chaozhou_3.jpg'
    ],
    galleryCaptions: [
      '潮州牌坊街 · 二十二座明清石牌坊古街实景',
      '韩文公祠 · 韩愈刺潮笔架山古迹实景',
      '开元镇国禅寺 · 唐代敕建岭南古刹实景'
    ],
    bestSeason: '金秋白露 · 漫步牌坊街品工夫茶，观广济桥“十八梭船廿四洲”',
    geologyType: '韩江下游冲积三角洲平原与古水系阶地',
    mythicPoem: '十八梭船廿四洲，江风吹月照城楼。\n韩文公迹千秋在，鳄水波平不再忧。',
    mythicLore: '《潮州古异志》述：“韩江古名恶溪，巨鳄为患。唐韩愈刺潮，作《祭鳄鱼文》投水，神兽陆吾降临助其威，鳄鱼震骇南遁入海，江水始澄碧。后人于江上建浮梁二十四洲，夜断昼连，神妙莫测。”',
    realHistory: '潮州古城历经两千年风雨，为国家历史文化名城。广济桥始建于南宋，与赵州桥、洛阳桥、卢沟桥并称中国四大古桥，开创“早开晚合”启闭式桥梁先河；工夫茶、潮绣与木雕展现中国传统手工艺之极境。',
    guardian: {
      name: '陆吾',
      title: '司川镇恶九尾神兽',
      classicQuote: '韩公秉正气，神陆吾佐之，投文投豕，驱鳄南遁。——《潮州府志》',
      domainPower: '辟除水中恶孽、启迪士子文脉、护佑万古商梁',
      symbolIcon: '🐅'
    },
    seal: { sealName: '广济浮梁之印', sealScript: '桥东胜境', inkColor: '#B32014' },
    landscapeTag: '古桥名邑'
  },
  {
    id: 'jieyang',
    cityName: '揭阳市',
    dayIndex: 9,
    dateKey: '2026-08-17',
    solarTerm: '小雪 · 虹藏不见',
    modernName: '揭阳 · 进贤古门楼与玉都双溪',
    ancientMythicName: '古揭阳进贤阙',
    region: createRegionReference('chaoshan_east', '粤东 · 玉都水乡'),
    country: '中国 · 广东',
    coordinates: { lat: 23.5487, lng: 116.3723, altitude: 280, mapX: 1.15, mapZ: -0.1 },
    element: 'fire',
    colorTheme: { primary: '#C21F30', glow: '#FF6B81', accent: '#FFE082' },
    heroImage: '/images/landmarks/jieyang_0.jpg',
    heroImageCaption: '进贤门 · 明代天启元年古城楼与榕水环抱实景',
    galleryImages: [
      '/images/landmarks/jieyang_1.jpg',
      '/images/landmarks/jieyang_2.jpg',
      '/images/landmarks/jieyang_3.jpg'
    ],
    galleryCaptions: [
      '揭阳学宫 · 岭南规制最完整孔庙大成殿实景',
      '揭阳楼广场 · 汉唐气魄九鼎雄峙与古邑新标实景',
      '揭阳城隍庙 · 明代国保古刹殿宇与潮汕嵌瓷灰塑实景'
    ],
    bestSeason: '初冬清和 · 登进贤门城楼览榕水，赏揭阳楼九鼎之雄姿',
    geologyType: '榕江南北两河环绕冲积低平原与古水网',
    mythicPoem: '双溪环抱水城深，进贤高门照碧浔。\n巧琢昆仑千尺玉，文光直上动星辰。',
    mythicLore: '《南粤金石志》：“揭阳故地，两水环流如双龙戏珠。古时有九彩金凤栖于进贤古门之顶，衔昆仑羊脂玉髓遗于城东，故揭阳人善解玉琢器，温润透光，为天下玉石聚纳之灵枢。”',
    realHistory: '揭阳建制始于秦汉，是潮汕历史最悠久的古邑之一。榕江南北河绕城而过，素有“水上莲花”之称；建于明代天启元年的“进贤门”雄伟庄严；揭阳如今也是中国乃至东南亚最大的翡翠玉石加工基地。',
    guardian: {
      name: '九彩凤',
      title: '衔玉鸣阳瑞彩神禽',
      classicQuote: '丹穴之鸟，五采而文，名曰凤皇，见则天下安宁，遗玉于揭阳。——《山海经》',
      domainPower: '凝粹天地玉石精粹、纳聚文曲才智、呈祥百福',
      symbolIcon: '✨'
    },
    seal: { sealName: '玉都进贤之印', sealScript: '金门进贤', inkColor: '#C21F30' },
    landscapeTag: '水乡古门'
  },
  {
    id: 'shanwei',
    cityName: '汕尾市',
    dayIndex: 10,
    dateKey: '2026-08-18',
    solarTerm: '秋分 · 雷始收声',
    modernName: '汕尾 · 遮浪红海湾与风车海岛',
    ancientMythicName: '红海遮浪神岬',
    region: createRegionReference('chaoshan_east', '粤东 · 滨海名城'),
    country: '中国 · 广东',
    coordinates: { lat: 22.7860, lng: 115.3750, altitude: 310, mapX: 0.9, mapZ: 0.25 },
    element: 'fire',
    colorTheme: { primary: '#9C4221', glow: '#ED8936', accent: '#63B3ED' },
    heroImage: '/images/landmarks/shanwei_0.jpg',
    heroImageCaption: '红海湾遮浪半岛 · 一侧惊涛一侧静浪双极奇观实景',
    galleryImages: [
      '/images/landmarks/shanwei_1.jpg',
      '/images/landmarks/shanwei_2.jpg',
      '/images/landmarks/shanwei_3.jpg'
    ],
    galleryCaptions: [
      '碣石玄武山 · 元山寺明清海防古庙实景',
      '红海湾风车岛 · 浅水白沙滩与巨型风车群实景',
      '品清湖 · 中国大陆第一大泻湖滨海风光实景'
    ],
    bestSeason: '秋分海澄 · 红海湾观“一侧惊涛一侧静浪”奇观',
    geologyType: '突兀基岩海岬侵蚀地貌与红褐色海岸沙滩',
    mythicPoem: '半岛分水两洞天，东滔西静两茫然。\n玄武神甲镇长浪，风吹白羽落金湾。',
    mythicLore: '《大荒南经》补：“南海之湾，有赭红岬角突入大洋二十里。神兽霸下伏于海底，背负玄武神甲，一力劈开巨浪，故半岛之东巨浪滔天，半岛之西则波平如镜，形成天地双极奇景。”',
    realHistory: '汕尾红海湾遮浪半岛是世界著名的“海上风帆赛场”，由于特殊的半岛地形，无论风向如何，半岛两侧总是一侧风狂浪急、一侧风平浪静，极富戏剧性；玄武山古寺亦为著名的滨海宗教圣地。',
    guardian: {
      name: '霸下',
      title: '劈波定浪玄甲灵皇',
      classicQuote: '龙生九子，其长曰霸下，形如巨龟，能负重镇浪，立于遮浪之极。——《山海百怪记》',
      domainPower: '分辟狂风巨浪、镇伏海啸暗礁、安定渔海',
      symbolIcon: '🛡️'
    },
    seal: { sealName: '遮浪红海之鉴', sealScript: '浪静风恬', inkColor: '#9C4221' },
    landscapeTag: '滨海奇岬'
  },
  {
    id: 'zhanjiang',
    cityName: '湛江市',
    dayIndex: 11,
    dateKey: '2026-08-19',
    solarTerm: '大暑 · 腐草为萤',
    modernName: '湛江 · 湖光岩玛珥火山湖与菠萝的海',
    ancientMythicName: '雷州雷泽火湖',
    region: createRegionReference('leizhou_west', '粤西 · 雷州半岛'),
    country: '中国 · 广东',
    coordinates: { lat: 21.2000, lng: 110.3800, altitude: 200, mapX: -0.9, mapZ: 0.95 },
    element: 'fire',
    colorTheme: { primary: '#C53030', glow: '#F6AD55', accent: '#38EF7D' },
    heroImage: '/images/landmarks/zhanjiang_0.jpg',
    heroImageCaption: '湖光岩 · 世界上保存最完好的玛珥火山湖实景',
    galleryImages: [
      '/images/landmarks/zhanjiang_1.jpg',
      '/images/landmarks/zhanjiang_2.jpg',
      '/images/landmarks/zhanjiang_3.jpg'
    ],
    galleryCaptions: [
      '徐闻县 · 万亩“菠萝的海”七彩红土田园实景',
      '湛江海湾大桥 · 金沙湾滨海度假浴场实景',
      '雷州半岛 · 雷祖古祠与南方兵马俑“雷州石狗”实景'
    ],
    bestSeason: '大暑盛夏 · 湖光岩水明如镜，徐闻观万亩“菠萝的海”金黄丘陵',
    geologyType: '新生代更新世玛珥火山爆破火山口湖与玄武岩红土丘陵',
    mythicPoem: '雷祖神威震九垓，湖心如镜落天台。\n千年落叶无踪影，火尽泉泓水月开。',
    mythicLore: '《海内东经》录：“雷州之陆，常多天雷。有火湖名湖光，昔火山爆发雷火贯地而成。湖水清莹，落叶堕水皆沉底不浮，鱼虾神异。雷祖陈文玉常驾雷车巡按其上，持雷斧以号令风雨。”',
    realHistory: '湛江湖光岩是世界上保存最完好的玛珥火山湖之一，湖水天然自净，落叶无影；雷州半岛拥有悠久的雷祖信仰与独特的“雷州石狗”非遗文化；徐闻县的万亩菠萝种植园则被称为“菠萝的海”，壮丽无垠。',
    guardian: {
      name: '雷祖',
      title: '九天应元威化雷神',
      classicQuote: '雷州多雷，神陈文玉降于白卵，生有神异，执雷斧御风雷。——《雷祖志》',
      domainPower: '策役天雷正气、荡平污浊秽气、洁净万水',
      symbolIcon: '⚡'
    },
    seal: { sealName: '雷泽湖光之印', sealScript: '雷池如鉴', inkColor: '#C02C1D' },
    landscapeTag: '火山玛珥湖'
  },
  {
    id: 'maoming',
    cityName: '茂名市',
    dayIndex: 12,
    dateKey: '2026-08-20',
    solarTerm: '立冬 · 水始冰',
    modernName: '茂名 · 中国第一滩与放鸡岛潜水秘境',
    ancientMythicName: '高凉冼太圣海',
    region: createRegionReference('leizhou_west', '粤西 · 油城滨海'),
    country: '中国 · 广东',
    coordinates: { lat: 21.6627, lng: 110.9259, altitude: 320, mapX: -0.7, mapZ: 0.75 },
    element: 'earth',
    colorTheme: { primary: '#975A16', glow: '#FAF089', accent: '#2F855A' },
    heroImage: '/images/landmarks/maoming_0.jpg',
    heroImageCaption: '茂名滨海 · 中国第一滩十二里金沙与海防林实景',
    galleryImages: [
      '/images/landmarks/maoming_1.jpg',
      '/images/landmarks/maoming_2.jpg',
      '/images/landmarks/maoming_3.jpg'
    ],
    galleryCaptions: [
      '放鸡岛 · 华南国家级潜水度假区珊瑚礁实景',
      '高州冼太庙 · 岭南巾帼英雄第一人圣母祖庙实景',
      '露天矿生态公园 · 工业遗址好心湖碧水实景'
    ],
    bestSeason: '立冬暖阳 · 十二里金沙踏浪与放鸡岛珊瑚潜水',
    geologyType: '华南海岸带细软石英砂平缓沙滩与花岗岩珊瑚礁岛',
    mythicPoem: '百里金沙接碧涛，高凉圣母领风骚。\n乘风放彩安南海，千古唯闻唯我豪。',
    mythicLore: '《南越后志》：“高凉山海之间，有岭南圣母冼夫人精忠报国。海中有放鸡岛，商船往来必放生雄鸡以祭海神。仁兽驺吾常随冼夫人左右，日行千里，护佑百越部落和睦安居。”',
    realHistory: '茂名“中国第一滩”拥有绵延12公里的细白沙滩与华南最大的防风防护林带；放鸡岛海水能见度达8米，海底珊瑚群繁茂；冼夫人作为“岭南圣母”，被周恩来总理赞誉为“中国巾帼英雄第一人”。',
    guardian: {
      name: '驺吾',
      title: '高凉仁威护国灵兽',
      classicQuote: '驺吾仁兽，大若虎，五采毕具，行不践草，随圣母以定岭南。——《山海经·海内北经》及南越志',
      domainPower: '抚慰群民纷争、踏浪无声、保境安民',
      symbolIcon: '🐅'
    },
    seal: { sealName: '高凉圣母之玺', sealScript: '金滩波平', inkColor: '#B32014' },
    landscapeTag: '金色沙滩'
  },
  {
    id: 'yangjiang',
    cityName: '阳江市',
    dayIndex: 13,
    dateKey: '2026-08-21',
    solarTerm: '寒露 · 鸿雁来宾',
    modernName: '阳江 · 海陵岛十里银滩与“南海I号”宋代古沉船',
    ancientMythicName: '海陵鲛人丝墟',
    region: createRegionReference('leizhou_west', '粤西 · 丝路遗珍'),
    country: '中国 · 广东',
    coordinates: { lat: 21.8584, lng: 111.9816, altitude: 250, mapX: -0.45, mapZ: 0.6 },
    element: 'gold',
    colorTheme: { primary: '#B7791F', glow: '#ECC94B', accent: '#1E5F74' },
    heroImage: '/images/landmarks/yangjiang_0.jpg',
    heroImageCaption: '广东海上丝绸之路博物馆 · “南海I号”水晶宫实景',
    galleryImages: [
      '/images/landmarks/yangjiang_1.jpg',
      '/images/landmarks/yangjiang_2.jpg',
      '/images/landmarks/yangjiang_3.jpg'
    ],
    galleryCaptions: [
      '海陵岛 · 中国最美海岛十里银滩浪花实景',
      '闸坡大角湾 · 国家5A级海滨天然浴场实景',
      '阳春凌霄岩 · 南国第一洞府巨型溶洞实景'
    ],
    bestSeason: '寒露秋爽 · 海陵岛戏水，参观海上丝绸之路博物馆“南海I号”',
    geologyType: '浅海潮间带广阔平缓石英砂滩与大陆架古海床',
    mythicPoem: '十里银滩映晚晴，沉香千载古舟横。\n鲛人泣泪皆成玉，不负丝途万里行。',
    mythicLore: '《海内南经》：“南海之中有海陵岛，其水深处有鲛人织水雾之绡，其眼泣则化为珍珠。南宋商舶载万斛瓷器丝绸西渡，沉于沧海千年，受鲛人灵力守护，瓷器光洁如新出窑。”',
    realHistory: '阳江海陵岛被评为“中国最美十大海岛”之一，十里银滩宽阔延绵；岛上的广东海上丝绸之路博物馆内，原生态保存并展出800年前南宋沉船“南海I号”，出水数万件精美金银器与古瓷，震惊世界。',
    guardian: {
      name: '鲛人',
      title: '丝路织水水府灵神',
      classicQuote: '南海水有鲛人，水居如鱼，不废织绩，其眼泣则能出珠。——《述异记》',
      domainPower: '守护沉睡古宝、编织避水灵绡、平息怒海暗流',
      symbolIcon: '🧜'
    },
    seal: { sealName: '海陵金丝之印', sealScript: '银滩古舶', inkColor: '#D4AF37' },
    landscapeTag: '丝路沉船'
  },
  {
    id: 'qingyuan',
    cityName: '清远市',
    dayIndex: 14,
    dateKey: '2026-08-22',
    solarTerm: '处暑 · 鹰乃祭鸟',
    modernName: '清远 · 连州地下河溶洞与英西峰林仙境',
    ancientMythicName: '连州九幽荧河',
    region: createRegionReference('nanling_north', '粤北 · 溶洞峡谷'),
    country: '中国 · 广东',
    coordinates: { lat: 23.6820, lng: 113.0560, altitude: 650, mapX: 0.05, mapZ: -0.4 },
    element: 'water',
    colorTheme: { primary: '#2A4365', glow: '#4FD1C5', accent: '#90CDF4' },
    heroImage: '/images/landmarks/qingyuan_0.jpg',
    heroImageCaption: '连州地下河 · 巨型喀斯特钟乳石暗河溶洞实景',
    galleryImages: [
      '/images/landmarks/qingyuan_1.jpg',
      '/images/landmarks/qingyuan_2.jpg',
      '/images/landmarks/qingyuan_3.jpg'
    ],
    galleryCaptions: [
      '英德英西峰林 · 南天第一峰林奇石溪流画卷实景',
      '连南南岗 · 世界唯一千年瑶寨古排木楼实景',
      '黄腾峡 · 天门悬廊玻璃桥与高山峡谷飞瀑实景'
    ],
    bestSeason: '处暑避暑 · 地下河冬暖夏凉常年18℃，游船如穿行星河',
    geologyType: '巨型亚热带喀斯特地下暗河溶洞与地表峰林走廊',
    mythicPoem: '地府潜行别有天，玉钟石笋挂深渊。\n扁舟摇入广寒界，疑似银河落九泉。',
    mythicLore: '《大荒北经》外传：“南岭之下，有地穴深入万丈，荧光自照如繁星。暗河蜿蜒百里，神鸟帝江宿于洞府深穹，无面目而通音律，每有舟子放歌，洞壁钟乳皆鸣钟磬以和之。”',
    realHistory: '清远连州地下河是典型的巨型喀斯特暗河溶洞，洞内石笋石柱奇幻瑰丽，乘船游览上下三层暗河恍若游历地心神境；英德英西峰林则拥有千余座喀斯特石峰，溪水缠绕，被誉为“南天第一峰林风光”。',
    guardian: {
      name: '帝江',
      title: '司空通音混沌神鸟',
      classicQuote: '天山有神，状如黄囊，赤如丹火，六足四翼，浑敦无面目，是识歌舞，实惟帝江。——《山海经·西山经》',
      domainPower: '穿梭幽冥空间、调律钟乳石磬、洞彻地底阴翳',
      symbolIcon: '🪶'
    },
    seal: { sealName: '连州幽泉之玺', sealScript: '暗河星斗', inkColor: '#1A365D' },
    landscapeTag: '地下溶洞'
  },
  {
    id: 'jiangmen',
    cityName: '江门市',
    dayIndex: 15,
    dateKey: '2026-08-23',
    solarTerm: '霜降 · 豺乃祭兽',
    modernName: '江门 · 开平五山碉楼群与古兜小鸟天堂',
    ancientMythicName: '侨乡千碉古林',
    region: createRegionReference('pearl_river_delta', '珠三角 · 碉楼侨乡'),
    country: '中国 · 广东',
    coordinates: { lat: 22.58, lng: 113.08, altitude: 230, mapX: -0.15, mapZ: 0.4 },
    element: 'wood',
    colorTheme: { primary: '#2D7A68', glow: '#56ab2f', accent: '#D4AF37' },
    heroImage: '/images/landmarks/jiangmen_0.jpg',
    heroImageCaption: '开平碉楼与村落 · 世界文化遗产自力村铭石楼实景',
    galleryImages: [
      '/images/landmarks/jiangmen_1.jpg',
      '/images/landmarks/jiangmen_2.jpg',
      '/images/landmarks/jiangmen_3.jpg'
    ],
    galleryCaptions: [
      '开平立园 · 中西合璧运河私家园林泮立楼实景',
      '新会小鸟天堂 · 巴金笔下百年独木成林古榕树实景',
      '赤坎古镇 · 潭江之滨三公里欧陆骑楼水街实景'
    ],
    bestSeason: '金秋霜降 · 田野稻黄与古碉楼相映，水上观万鸟齐飞',
    geologyType: '潭江下游水网冲积平原与热带水乡生态林地',
    mythicPoem: '独木成林栖万羽，千碉拔地锁狼烟。\n中西古韵融一界，沧海归来月正圆。',
    mythicLore: '《南粤异禽记》：“潭江之滨，有一古榕覆盖十亩，一木成林。神鸟鸿鹄引万千白鹭仙禽栖于林顶，朝出暮归，啼鸣若仙乐。侨民感神鸟之德，筑高楼坚碉以御盗贼，守望故土。”',
    realHistory: '开平碉楼是中国乡土建筑绝唱与世界文化遗产，完美融合古希腊、古罗马、哥特式与中国岭南传统建筑风格于一炉（如自力村、立园、瑞石楼）；新会“小鸟天堂”则因巴金散文名篇名扬天下。',
    guardian: {
      name: '鸿鹄',
      title: '引千羽高洁仙禽',
      classicQuote: '有鸟焉，五采而文，名曰鸿鹄，行万里而归故土，庇佑万鸟。——《山海经》',
      domainPower: '维系海外侨胞血脉、佑护水乡安宁、抚育百禽繁衍',
      symbolIcon: '🦢'
    },
    seal: { sealName: '开平千碉之印', sealScript: '碉楼安邦', inkColor: '#2D7A68' },
    landscapeTag: '世遗碉楼'
  },
  {
    id: 'heyuan',
    cityName: '河源市',
    dayIndex: 16,
    dateKey: '2026-08-24',
    solarTerm: '谷雨 · 萍始生',
    modernName: '河源 · 万绿湖万顷碧波与霍山丹霞峰',
    ancientMythicName: '万绿清湖古境',
    region: createRegionReference('nanling_north', '粤北 · 客家水塔'),
    country: '中国 · 广东',
    coordinates: { lat: 23.74, lng: 114.70, altitude: 480, mapX: 0.75, mapZ: -0.35 },
    element: 'water',
    colorTheme: { primary: '#1E5F74', glow: '#38EF7D', accent: '#FAF089' },
    heroImage: '/images/landmarks/heyuan_0.jpg',
    heroImageCaption: '万绿湖 · 华南第一大高峡平湖与360座翡翠绿岛实景',
    galleryImages: [
      '/images/landmarks/heyuan_1.jpg',
      '/images/landmarks/heyuan_2.jpg',
      '/images/landmarks/heyuan_3.jpg'
    ],
    galleryCaptions: [
      '龙川霍山 · 广东七大名山白垩纪丹霞悬崖栈道实景',
      '中华恐龙之乡 · 河源恐龙博物馆万枚恐龙蛋化石实景',
      '龙川佗城 · 赵佗兴王南越古邑遗址实景'
    ],
    bestSeason: '暮春谷雨 · 乘舟万绿湖如行翡翠明镜，登霍山观险峰栈道',
    geologyType: '华南第一大人工高峡平湖与白垩纪丹霞悬崖',
    mythicPoem: '万顷澄碧浮翠岛，水天一色透空明。\n霍山千仞神仙客，长引甘泉润粤城。',
    mythicLore: '《东江异志》：“东江源头，有神鹿夫诸引琼浆化为千岛翡翠之湖，水质甘冽达于上品。凡人饮之可清心明目。湖底藏亿万年恐龙神卵，乃太古巨龙孕育之秘窟。”',
    realHistory: '万绿湖是华南第一大水库（新丰江水库），面积达370平方公里，拥有360个绿岛，水质常年保持国家一类地表水标准，是粤港澳大湾区重要生命水塔；河源也是世界“中华恐龙之乡”，拥有超万枚恐龙蛋化石。',
    guardian: {
      name: '夫诸',
      title: '澄泉辟水神鹿',
      classicQuote: '敖岸之山有兽，状如白鹿而四角，名曰夫诸，引净水灌溉万绿之境。——《山海经·中山经》',
      domainPower: '洁净万顷深源之水、涵养生态万木、启运生机',
      symbolIcon: '🦌'
    },
    seal: { sealName: '万绿澄泓之玺', sealScript: '万绿如瑶', inkColor: '#1E5F74' },
    landscapeTag: '万顷碧湖'
  },
  {
    id: 'meizhou',
    cityName: '梅州市',
    dayIndex: 17,
    dateKey: '2026-08-25',
    solarTerm: '清明 · 桐始华',
    modernName: '梅州 · 客家花萼楼围屋与阴那山灵光寺',
    ancientMythicName: '阴那灵光古刹',
    region: createRegionReference('nanling_north', '粤北 · 客家世界首府'),
    country: '中国 · 广东',
    coordinates: { lat: 24.2890, lng: 116.1220, altitude: 1298, mapX: 1.1, mapZ: -0.45 },
    element: 'earth',
    colorTheme: { primary: '#975A16', glow: '#F6AD55', accent: '#2F855A' },
    heroImage: '/images/landmarks/meizhou_0.jpg',
    heroImageCaption: '大埔花萼楼 · 400年圆形夯土客家土围屋实景',
    galleryImages: [
      '/images/landmarks/meizhou_1.jpg',
      '/images/landmarks/meizhou_2.jpg',
      '/images/landmarks/meizhou_3.jpg'
    ],
    galleryCaptions: [
      '阴那山灵光寺 · 唐代千年古刹与生死柏藻井实景',
      '桥溪古村落 · 雁南飞茶田与客家围龙屋建筑实景',
      '梅州客天下 · 世界客都原乡客家风情建筑实景'
    ],
    bestSeason: '仲春清明 · 探访原汁原味客家围龙屋与阴那山五指峰云海',
    geologyType: '梅江盆地红色砂岩与阴那山花岗岩高耸突兀山脊',
    mythicPoem: '土筑圆楼法自然，客家辗转越千年。\n阴那双柏生死树，禅意空明化大千。',
    mythicLore: '《客海图志》：“中原衣冠南迁至梅水之滨，法太极阴阳八卦之象，夯土成圆楼方堡。神兽白虎威踞阴那山五指峰，守卫客家祖祠，寺前有生死二柏，一枯一荣，蕴藏生死轮回玄机。”',
    realHistory: '梅州被尊为“世界客都”，大埔花萼楼为典型圆形土围屋，历经400年风雨巍然不倒；阴那山灵光寺始建于唐代，寺前“生死柏”一活一死立千载，殿顶藻井无尘无烟，为岭南佛教建筑奇观。',
    guardian: {
      name: '白虎',
      title: '镇家守祠肃杀仁圣',
      classicQuote: '西方白虎，猛烈威严，镇守客家八卦祖楼，万邪不敢犯。——《神异经》',
      domainPower: '镇守宗族血脉、聚气御外患、庇佑家族长青',
      symbolIcon: '🐅'
    },
    seal: { sealName: '世界客都之印', sealScript: '客家围龙', inkColor: '#975A16' },
    landscapeTag: '客家围屋'
  },
  {
    id: 'zhongshan',
    cityName: '中山市',
    dayIndex: 18,
    dateKey: '2026-08-26',
    solarTerm: '小满 · 苦菜秀',
    modernName: '中山 · 孙中山故里翠亨村与五桂山林',
    ancientMythicName: '香山翠亨金峰',
    region: createRegionReference('pearl_river_delta', '珠三角 · 伟人故里'),
    country: '中国 · 广东',
    coordinates: { lat: 22.5167, lng: 113.3833, altitude: 531, mapX: 0.1, mapZ: 0.38 },
    element: 'gold',
    colorTheme: { primary: '#B7791F', glow: '#ECC94B', accent: '#E53E3E' },
    heroImage: '/images/landmarks/zhongshan_0.jpg',
    heroImageCaption: '翠亨村 · 孙中山故居纪念馆红砖中西楼实景',
    galleryImages: [
      '/images/landmarks/zhongshan_1.jpg',
      '/images/landmarks/zhongshan_2.jpg',
      '/images/landmarks/zhongshan_3.jpg'
    ],
    galleryCaptions: [
      '中山纪念堂 · 缅怀伟人博爱天下宏伟古建实景',
      '五桂山脉 · 珠江三角洲生态绿核大尖山实景',
      '岐江公园 · 粤中造船厂工业遗址与岐江夜景实景'
    ],
    bestSeason: '初夏小满 · 漫步翠亨古村落，登五桂山遥望伶仃洋',
    geologyType: '珠江口西岸低山丘陵与冲积平原过渡带',
    mythicPoem: '五桂苍苍异草香，伟人博爱泽重光。\n天下为公声振宇，长留浩气照重阳。',
    mythicLore: '《香山志》云：“昔此地孤立沧海之中，山产异香灵草，故名香山。神兽麒麟踏祥云常降于五桂之顶，口衔‘天下为公’之金牒，兆示开创共和、缔造新纪元之伟大先驱诞生于此。”',
    realHistory: '中山市古称香山，是中国唯一以伟人名字命名的地级市。民主革命先行者孙中山先生诞生于翠亨村，故居融合中西合璧建筑风格；五桂山脉雄浑葱郁，是珠江三角洲的重要生态绿核。',
    guardian: {
      name: '麒麟',
      title: '博爱为公盛世灵皇',
      classicQuote: '麒麟出，天下有仁圣。香山有灵，天下为公之风自此始。——《南越瑞应录》',
      domainPower: '播撒天下大同博爱、破除旧制桎梏、开物成务',
      symbolIcon: '✨'
    },
    seal: { sealName: '香山博爱之玺', sealScript: '天下为公', inkColor: '#C53030' },
    landscapeTag: '伟人故居'
  },
  {
    id: 'dongguan',
    cityName: '东莞市',
    dayIndex: 19,
    dateKey: '2026-08-27',
    solarTerm: '立夏 · 蝼蝈鸣',
    modernName: '东莞 · 岭南名园可园与虎门威远古炮台',
    ancientMythicName: '莞邑可园名阁',
    region: createRegionReference('pearl_river_delta', '珠三角 · 智造名城'),
    country: '中国 · 广东',
    coordinates: { lat: 23.0200, lng: 113.7500, altitude: 280, mapX: 0.3, mapZ: 0.15 },
    element: 'wood',
    colorTheme: { primary: '#2D7A68', glow: '#48BB78', accent: '#D4AF37' },
    heroImage: '/images/landmarks/dongguan_keyuan_2024_architecture.jpg',
    heroImageCaption: '东莞可园 · 岭南园林院落与砖木建筑实景',
    galleryImages: [
      '/images/landmarks/dongguan_weiyuan_humen_2026.jpg',
      '/images/landmarks/dongguan_2.jpg',
      '/images/landmarks/dongguan_songshanlake_xbotpark_2022.jpg'
    ],
    galleryCaptions: [
      '虎门威远炮台与虎门大桥 · 珠江口海门实景',
      '鸦片战争博物馆 · 林则徐虎门销烟池旧址实景',
      '松山湖 · XbotPark 创业基地湖畔建筑实景'
    ],
    bestSeason: '初夏立夏 · 细品可园曲径通幽亭台楼阁与虎门海潮',
    geologyType: '珠江口东岸狮子洋海潮沉积平原与台地',
    mythicPoem: '咫尺山林藏大千，可亭临水话前贤。\n虎门销烟浩气在，铸就中华第一篇。',
    mythicLore: '《莞邑考录》：“东莞产莞草与沉香。可园主人张敬修筑可园，居巢居廉驻此创立‘岭南画派’没骨花鸟画法。异兽獬豸常立于虎门要塞之巅，明辨忠奸，长鸣警世，镇锁狮子洋海门。”',
    realHistory: '东莞可园为“岭南四大名园”之代表，以“小巧玲珑、布局精妙”著称，一楼一阁皆可圈可点；虎门则是鸦片战争爆发地，林则徐虎门销烟与威远古炮台矗立在珠江入海口，是中国近代史的开篇圣地。',
    guardian: {
      name: '獬豸',
      title: '辨正明忠海门灵神',
      classicQuote: '獬豸如鹿，见不正者以角触之。立于海门，辨别忠奸，镇守南疆。——《异物志》',
      domainPower: '洞明公理正义、守护国之门户、孕育岭南墨韵',
      symbolIcon: '🦄'
    },
    seal: { sealName: '可园墨韵之印', sealScript: '可园可意', inkColor: '#2D7A68' },
    landscapeTag: '名园古迹'
  },
  {
    id: 'yunfu',
    cityName: '云浮市',
    dayIndex: 20,
    dateKey: '2026-08-28',
    solarTerm: '大雪 · 鹖鴠不鸣',
    modernName: '云浮 · 六祖故里国恩寺与天露仙山',
    ancientMythicName: '天露六祖灵坛',
    region: createRegionReference('nanling_north', '粤北 · 禅都石都'),
    country: '中国 · 广东',
    coordinates: { lat: 22.9155, lng: 112.0447, altitude: 1251, mapX: -0.55, mapZ: 0.3 },
    element: 'earth',
    colorTheme: { primary: '#744210', glow: '#ECC94B', accent: '#48BB78' },
    heroImage: '/images/landmarks/yunfu_0.jpg',
    heroImageCaption: '新兴国恩寺 · 禅宗六祖惠能出生圆寂祖庭实景',
    galleryImages: [
      '/images/landmarks/yunfu_1.jpg',
      '/images/landmarks/yunfu_2.jpg',
      '/images/landmarks/yunfu_3.jpg'
    ],
    galleryCaptions: [
      '天露山 · 云浮最高峰高山杜鹃花海与云海实景',
      '蟠龙洞 · 世界三大罕见宝石花钟乳石地质奇观实景',
      '中国石都 · 云浮国际石材博览中心巧夺天工实景'
    ],
    bestSeason: '初春至仲冬 · 天露山高山杜鹃盛开，参拜国恩寺祖庭真身',
    geologyType: '大南山脉与云开大山结晶大理石与花岗岩峰峦',
    mythicPoem: '菩提本自无一物，何处能惹世间尘。\n天露仙露润禅海，石都万彩化通神。',
    mythicLore: '《六祖本纪》记：“六祖慧能诞生于新兴龙山之下，圆寂亦归于国恩寺祖庭。天露山有神龙盘踞云雾，口吐天甘玉露，使万山石材化为五彩大理玉石，文彩斑斓，通灵聚气。”',
    realHistory: '云浮新兴县是禅宗六祖慧能大师的出生地与圆寂之所，国恩寺被尊为“岭南第一圣域”；天露山海拔1251米，为云浮最高峰，满山杜鹃花海与石径云梯；云浮同时也是享誉全球的“中国石材之都”。',
    guardian: {
      name: '青龙',
      title: '司掌甘露真如神龙',
      classicQuote: '东溟有青龙，行云布雨，降天露于南山，明心见性者得悟菩提。——《山海经·大荒经》',
      domainPower: '普降甘露净水、悟彻明心见性、化顽石为瑰玉',
      symbolIcon: '🐉'
    },
    seal: { sealName: '禅宗祖庭之印', sealScript: '菩提明境', inkColor: '#7B341E' },
    landscapeTag: '禅宗祖庭'
  },
  {
    id: 'hongkong',
    cityName: '香港',
    dayIndex: 21,
    dateKey: '2026-08-29',
    solarTerm: '冬至 · 蚯蚓结',
    modernName: '香港 · 太平山顶维港璀璨与大屿天坛大佛',
    ancientMythicName: '香江蓬莱仙岛',
    region: createRegionReference('pearl_river_delta', '大湾区 · 东方之珠'),
    country: '中国 · 香港',
    coordinates: { lat: 22.3193, lng: 114.1694, altitude: 552, mapX: 0.35, mapZ: 0.65 },
    element: 'gold',
    colorTheme: { primary: '#8A1C5A', glow: '#FF4081', accent: '#FFD700' },
    heroImage: '/images/landmarks/hongkong_0.jpg',
    heroImageCaption: '太平山顶 · 维多利亚港璀璨天际线夜景实景',
    galleryImages: [
      '/images/landmarks/hongkong_1.jpg',
      '/images/landmarks/hongkong_2.jpg',
      '/images/landmarks/hongkong_3.jpg'
    ],
    galleryCaptions: [
      '大屿山 · 天坛大佛与宝莲禅寺云海实景',
      '中环 · 维多利亚港两岸摩天大楼天际线实景',
      '尖沙咀 · 星光大道与海港渡轮实景'
    ],
    bestSeason: '冬至岁阑 · 太平山顶揽胜维港万家灯火与香江夜色',
    geologyType: '中生代花岗岩与火山岩岛屿山海相拥海岸地质',
    mythicPoem: '万顷沧波开蜃市，双星映水照蓬莱。\n香江风动画楼出，紫荆光夺彩云回。',
    mythicLore: '《海岳名岛记》：“南海有香江，岛屿棋布，自古产沉水香、降真香。相传祥瑞神兽白泽曾驻足狮子山之巅，通晓幽溟万象，吐紫霞结为神珠，聚四海百宝，光耀重洋。”',
    realHistory: '香港自古为海上丝绸之路重要补给站与香料集散港，素有“东方之珠”之美誉。太平山俯瞰维多利亚港，两岸摩天大楼与深水良港交相辉映；大屿山天坛大佛庄严慈祥，是中西文化交融汇聚的国际大都会。',
    guardian: {
      name: '狮子山金狮',
      title: '同舟共济镇海金狮',
      classicQuote: '狮子山头迎晓日，香江水暖聚繁华。同舟共济，百折不挠。——《新安县志》',
      domainPower: '凝聚同舟共济浩气、辟除风暴凶煞、纳聚四海百宝',
      symbolIcon: '🦁'
    },
    seal: { sealName: '香江紫荆之印', sealScript: '东方明珠', inkColor: '#8A1C5A' },
    landscapeTag: '东方明珠'
  },
  {
    id: 'macau',
    cityName: '澳门',
    dayIndex: 22,
    dateKey: '2026-08-30',
    solarTerm: '小寒 · 雁北乡',
    modernName: '澳门 · 大三巴牌坊与妈阁紫烟',
    ancientMythicName: '濠镜九莲仙境',
    region: createRegionReference('pearl_river_delta', '大湾区 · 莲岛濠镜'),
    country: '中国 · 澳门',
    coordinates: { lat: 22.1987, lng: 113.5439, altitude: 170, mapX: 0.15, mapZ: 0.7 },
    element: 'wood',
    colorTheme: { primary: '#00796B', glow: '#00E676', accent: '#FFE082' },
    heroImage: '/images/landmarks/macau_0.jpg',
    heroImageCaption: '大三巴牌坊 · 圣保禄学院圣堂遗址实景',
    galleryImages: [
      '/images/landmarks/macau_1.jpg',
      '/images/landmarks/macau_2.jpg',
      '/images/landmarks/macau_3.jpg'
    ],
    galleryCaptions: [
      '妈阁庙 · 弘仁殿与香火缭绕明清古刹实景',
      '东望洋山 · 远东最早现代灯塔与圣母雪地殿实景',
      '议事亭前地 · 葡式碎石波浪路与历史城区实景'
    ],
    bestSeason: '岁末小寒 · 漫步历史城区与妈阁紫烟，感受中西合璧海岛风情',
    geologyType: '花岗岩低丘与珠江口海侵连岛沙洲海积平原',
    mythicPoem: '莲峰耸翠连沧溟，濠镜涵虚照客星。\n妈阁香烟波浪阔，千帆归棹伴潮听。',
    mythicLore: '《澳门记略》载：“澳门半岛形如落水金莲，古名濠镜澳。相传有瑞兽天鹿衔九品青芝自扶桑踏浪而来，化作东望洋与莲峰诸山，海神妈祖庇佑千舟竞发，风平浪静，化险为夷。”',
    realHistory: '澳门拥有400余年中西文化交融历史，澳门历史城区被列为世界文化遗产。始建于明代弘治元年的妈阁庙与圣保禄大教堂遗址（大三巴牌坊）相邻相望，见证了东西方文明的对话与共荣。',
    guardian: {
      name: '天鹿',
      title: '衔芝降福灵岛瑞兽',
      classicQuote: '天鹿纯善，能步波涛而不溺，衔瑞芝以寿万灵，王者道洽则至。——《宋书·符瑞志》',
      domainPower: '平息沧海风浪、护佑千帆安澜、降赐长寿安康',
      symbolIcon: '🦌'
    },
    seal: { sealName: '濠镜九莲之印', sealScript: '莲峰归海', inkColor: '#00796B' },
    landscapeTag: '世界遗产'
  },
  {
    id: 'hangzhou',
    cityName: '杭州市',
    dayIndex: 23,
    dateKey: '2026-08-31',
    solarTerm: '处暑 · 天地始肃',
    modernName: '杭州 · 西湖文化景观与三潭印月',
    ancientMythicName: '钱塘西子仙境',
    region: createRegionReference('jiangnan_waters', '江南水乡 · 钱塘西湖'),
    country: '中国 · 浙江',
    coordinates: { lat: 30.246026, lng: 120.210792 },
    element: 'water',
    colorTheme: {
      primary: '#5B8266',
      secondary: '#B1D5C8',
      accent: '#87CEEB',
      glow: '#6A8E23'
    },
    heroImage: '/images/landmarks/hangzhou_0.jpg',
    heroImageCaption: '杭州西湖 · 断桥与堤道夜景实景',
    galleryImages: [
      '/images/landmarks/hangzhou_1.png',
      '/images/landmarks/hangzhou_2.jpg',
      '/images/landmarks/hangzhou_3.jpg'
    ],
    galleryCaptions: [
      '杭州西湖 · 湖面与城市天际线实景',
      '杭州西湖 · 三潭印月实景',
      '杭州西湖 · 湖山景观实景'
    ],
    bestSeason: '春秋晴润 · 沿苏堤看湖山、堤岛与天光相映',
    geologyType: '钱塘江下游冲积平原与西湖周缘低山丘陵水网景观',
    mythicPoem: '一湖涵碧接天光，十景烟波入画堂。\n苏堤春晓春风起，三塔浮金照夕阳。',
    mythicLore: '【项目创作】钱塘潮息，西子湖心藏一方澄泓玉鉴。青鸾衔来江南春色，掠过苏堤与三潭，将人间烟水化作可游、可观、可回望的山海秘境。',
    realHistory: '杭州西湖文化景观由西湖及三面环绕的山体、堤道、岛屿、亭台、园林等共同构成，保留了长期营造湖山景观的文化传统；该文化景观于2011年列入世界遗产名录。',
    guardian: {
      name: '钱塘潮神',
      title: '怒潮白马破浪神兽',
      classicQuote: '欲把西湖比西子，淡妆浓抹总相宜。——苏轼《饮湖上初晴后雨》',
      domainPower: '引渡湖山清气、平息钱塘怒潮、传递江南春信',
      symbolIcon: '🐎'
    },
    seal: { sealName: '西湖澄碧之印', sealScript: '澄波映月', inkColor: '#5B8266' },
    landscapeTag: '湖山世遗'
  },
  {
    id: 'ningbo',
    cityName: '宁波市',
    dayIndex: 24,
    dateKey: '2026-09-01',
    solarTerm: '白露 · 鸿雁来宾',
    modernName: '宁波 · 甬城天一阁与三江口',
    ancientMythicName: '明州四明沧溟',
    region: createRegionReference('jiangnan_waters', '江南水乡 · 明州四明'),
    country: '中国 · 浙江',
    coordinates: { lat: 29.8683, lng: 121.5440 },
    element: 'water',
    colorTheme: {
      primary: '#1A365D',
      secondary: '#4A7C59',
      accent: '#80D8FF',
      glow: '#40C4FF'
    },
    heroImage: '/images/landmarks/ningbo_0.jpg',
    heroImageCaption: '宁波天一阁 · 华夏现存最古私家藏书楼实景',
    galleryImages: [
      '/images/landmarks/ningbo_1.jpg',
      '/images/landmarks/ningbo_2.jpg',
      '/images/landmarks/ningbo_3.jpg'
    ],
    galleryCaptions: [
      '宁波三江口 · 甬江姚江奉化江汇流实景',
      '宁波东钱湖 · 浙东明珠湖山烟波实景',
      '宁波保国寺 · 北宋大殿木构奇迹实景'
    ],
    bestSeason: '春秋澄朗 · 登天一阁览万卷书香，立三江口临东海潮汐',
    geologyType: '浙东沿海丘陵与姚江、奉化江、甬江三江汇流冲积平原',
    mythicPoem: '四明三江潮浩渺，天一阁深藏古书。\n海外通津舟楫集，甬城风物自清虚。',
    mythicLore: '【项目创作】三江合汇，潮涌东海。明州古港千帆并进，河姆渡双鸟朝阳骨雕灵光不灭，昂首捧日守护东海万国通津。',
    realHistory: '宁波古称明州，是中国古代海上丝绸之路的重要始发港，拥有中国现存最早的私家藏书楼天一阁及著名的三江口古运河水系。',
    guardian: {
      name: '双鸟朝阳',
      title: '捧日通津河姆渡神鸟',
      classicQuote: '沧海横流安若席，四明天一镇潮澜。',
      domainPower: '平息海潮波涛、护佑航海舟楫、守御千载典籍',
      symbolIcon: '🦅'
    },
    seal: { sealName: '明州海舶之印', sealScript: '甬江潮平', inkColor: '#1A365D' },
    landscapeTag: '书藏古今'
  },
  {
    id: 'wenzhou',
    cityName: '温州市',
    dayIndex: 25,
    dateKey: '2026-09-02',
    solarTerm: '秋分 · 雷始收声',
    modernName: '温州 · 雁荡奇峰与江心孤屿',
    ancientMythicName: '东瓯鹿城福地',
    region: createRegionReference('jiangnan_waters', '江南水乡 · 东瓯雁荡'),
    country: '中国 · 浙江',
    coordinates: { lat: 28.0006, lng: 120.6994 },
    element: 'wood',
    colorTheme: {
      primary: '#8B263E',
      secondary: '#6B8E23',
      accent: '#EDF2F7',
      glow: '#FF80AB'
    },
    heroImage: '/images/landmarks/wenzhou_0.jpg',
    heroImageCaption: '温州雁荡山 · 灵峰奇嶂与火山岩绝壁实景',
    galleryImages: [
      '/images/landmarks/wenzhou_1.jpg',
      '/images/landmarks/wenzhou_2.jpg',
      '/images/landmarks/wenzhou_3.jpg'
    ],
    galleryCaptions: [
      '温州江心屿 · 瓯江蓬莱双塔映江实景',
      '温州大龙湫 · 华夏第一名瀑飞流实景',
      '温州楠溪江 · 悠悠三百里山水画廊实景'
    ],
    bestSeason: '春夏之交与金秋 · 雁荡飞瀑绝壑，楠溪秀水如画',
    geologyType: '浙南中生代白垩纪流纹岩破火山口地质景观与瓯江水系',
    mythicPoem: '绝壁横空雁荡秋，江心孤屿水长流。\n东瓯自古山川秀，白鹿衔花枕碧洲。',
    mythicLore: '【项目创作】相传晋时白鹿衔花绕城，东瓯化为繁花鹿城。雁荡万仞灵岩耸入九霄，仙鹿踏云而行，吞吐江南山水灵气。',
    realHistory: '温州古称东瓯、鹿城，是国家历史文化名城；境内雁荡山以“海上名山、寰中绝胜”著称，是中国十大名山之一。',
    guardian: {
      name: '白鹿衔花',
      title: '衔花筑城灵瑞仙兽',
      classicQuote: '白鹿衔花筑名邑，江心孤屿水波清。',
      domainPower: '引渡奇岩仙雾、护佑山水秀色、赐福百业繁荣',
      symbolIcon: '🦌'
    },
    seal: { sealName: '东瓯鹿城之印', sealScript: '孤屿灵峰', inkColor: '#8B263E' },
    landscapeTag: '东南山水'
  },
  {
    id: 'shaoxing',
    cityName: '绍兴市',
    dayIndex: 26,
    dateKey: '2026-09-03',
    solarTerm: '寒露 · 雀入大水',
    modernName: '绍兴 · 会稽兰亭与鉴湖越水',
    ancientMythicName: '会稽兰亭圣境',
    region: createRegionReference('jiangnan_waters', '江南水乡 · 会稽越水'),
    country: '中国 · 浙江',
    coordinates: { lat: 30.0024, lng: 120.5821 },
    element: 'water',
    colorTheme: {
      primary: '#2E6F40',
      secondary: '#C08030',
      accent: '#A3C9A8',
      glow: '#68D391'
    },
    heroImage: '/images/landmarks/shaoxing_0.jpg',
    heroImageCaption: '绍兴兰亭 · 曲水流觞与右军墨华实景',
    galleryImages: [
      '/images/landmarks/shaoxing_1.jpg',
      '/images/landmarks/shaoxing_2.jpg',
      '/images/landmarks/shaoxing_3.jpg'
    ],
    galleryCaptions: [
      '绍兴沈园 · 宋代名园与陆游题壁实景',
      '绍兴鉴湖 · 八百里鉴湖春水浩渺实景',
      '绍兴鲁迅故里 · 三味书屋与百草园水乡实景'
    ],
    bestSeason: '暮春三月与金秋 · 兰亭修禊，鉴湖泛舟，品古越黄酒',
    geologyType: '会稽山北麓低山丘陵与宁绍水网平原交汇地带',
    mythicPoem: '山阴道上行春色，兰亭修禊引清流。\n会稽苍苍鉴水碧，越绝风流八百秋。',
    mythicLore: '【项目创作】会稽山连苍穹，大禹鼎定九州。王右军爱鹅换经兰亭挥毫，神鹅曲项向天，化育古越八百里鉴湖文脉。',
    realHistory: '绍兴古称越州、会稽，是越国古都；拥有大禹陵、王羲之曲水流觞兰亭、鲁迅故里、沈园及鉴湖等丰富历史人文。',
    guardian: {
      name: '兰亭神鹅',
      title: '换经墨韵书圣神禽',
      classicQuote: '此地有崇山峻岭，茂林修竹；又有清流激湍，映带左右。——王羲之《兰亭集序》',
      domainPower: '化育书法文气、调和水乡风物、守护先贤圣陵',
      symbolIcon: '🦢'
    },
    seal: { sealName: '会稽兰亭之印', sealScript: '曲水流觞', inkColor: '#2E6F40' },
    landscapeTag: '名士水乡'
  },
  {
    id: 'huzhou',
    cityName: '湖州市',
    dayIndex: 27,
    dateKey: '2026-09-04',
    solarTerm: '霜降 · 豺乃祭兽',
    modernName: '湖州 · 太湖溇港与莫干竹海',
    ancientMythicName: '吴兴水晶碧宫',
    region: createRegionReference('jiangnan_waters', '江南水乡 · 太湖吴兴'),
    country: '中国 · 浙江',
    coordinates: { lat: 30.8943, lng: 120.0868 },
    element: 'wood',
    colorTheme: {
      primary: '#4A7C59',
      secondary: '#8FBC8F',
      accent: '#68D391',
      glow: '#9AE6B4'
    },
    heroImage: '/images/landmarks/huzhou_0.jpg',
    heroImageCaption: '湖州莫干山 · 清凉竹海与剑池飞瀑实景',
    galleryImages: [
      '/images/landmarks/huzhou_1.jpg',
      '/images/landmarks/huzhou_2.jpg',
      '/images/landmarks/huzhou_3.jpg'
    ],
    galleryCaptions: [
      '湖州南浔古镇 · 中西合璧江南巨富名宅实景',
      '湖州太湖溇港 · 弁山云气与太湖碧波实景',
      '湖州飞英塔 · 罕见塔中塔古代佛建奇观实景'
    ],
    bestSeason: '夏秋清幽 · 避暑莫干幽谷，漫步南浔古街，品太湖三白',
    geologyType: '太湖流域南部水网平原与天目山余脉低山丘陵',
    mythicPoem: '行遍江南清丽地，人生只合住湖州。\n霅溪水暖鱼虾美，莫干竹深翠欲流。',
    mythicLore: '【项目创作】太湖万顷碧波环绕水晶之宫，霅溪水清见底。莫干山干将莫邪雌雄双剑出鞘化为双龙，巡行于茫茫翠竹烟云之间。',
    realHistory: '湖州古称吴兴，拥有太湖溇港古代水利工程世界遗产，是中国著名的湖笔之都、丝绸之府，南浔古镇与莫干山驰名中外。',
    guardian: {
      name: '莫干双龙',
      title: '剑魄通玄雌雄双龙',
      classicQuote: '人生只合住湖州，霅溪清润水云悠。——戴表元《湖州》',
      domainPower: '凝炼湖山竹韵、点化湖颖文笔、守护清远水质',
      symbolIcon: '🐉'
    },
    seal: { sealName: '吴兴笔都之印', sealScript: '湖山清远', inkColor: '#4A7C59' },
    landscapeTag: '清丽吴兴'
  },
  {
    id: 'jiaxing',
    cityName: '嘉兴市',
    dayIndex: 28,
    dateKey: '2026-09-05',
    solarTerm: '立冬 · 水始冰',
    modernName: '嘉兴 · 禾城南湖与烟雨乌镇',
    ancientMythicName: '秀州南湖烟雨',
    region: createRegionReference('jiangnan_waters', '江南水乡 · 秀州禾城'),
    country: '中国 · 浙江',
    coordinates: { lat: 30.7461, lng: 120.7555 },
    element: 'water',
    colorTheme: {
      primary: '#718096',
      secondary: '#E53E3E',
      accent: '#319795',
      glow: '#81E6D9'
    },
    heroImage: '/images/landmarks/jiaxing_0.jpg',
    heroImageCaption: '嘉兴南湖 · 烟雨楼与红船圣地实景',
    galleryImages: [
      '/images/landmarks/jiaxing_1.jpg',
      '/images/landmarks/jiaxing_2.jpg',
      '/images/landmarks/jiaxing_3.jpg'
    ],
    galleryCaptions: [
      '嘉兴乌镇 · 水阁石桥枕水人家实景',
      '嘉兴西塘 · 烟雨长廊古镇水乡实景',
      '嘉兴海宁盐官 · 钱塘大潮一线奔腾实景'
    ],
    bestSeason: '春秋烟雨 · 乌镇听橹声，南湖看烟雨，海宁观大潮',
    geologyType: '杭嘉湖平原典型太湖水网沉积平原与钱塘江河口段',
    mythicPoem: '水阁凭栏烟雨濛，乌篷摇过古桥东。\n南湖月朗波心阔，槜李春深画意浓。',
    mythicLore: '【项目创作】秀水如织，泽国万顷。烟雨楼前红鲤跃浪，化作江南春水灵韵，滋润千年水乡古镇与槜李名邑。',
    realHistory: '嘉兴古称禾兴、秀州，地处杭嘉湖平原中心，拥有乌镇、西塘两大中国著名水乡古镇与江南名胜南湖烟雨楼。',
    guardian: {
      name: '南湖红鲤',
      title: '跃浪呈祥水泽神鲤',
      classicQuote: '烟雨楼前水连天，水乡泽国万家烟。',
      domainPower: '调控泽国甘霖、催生水乡繁盛、守护古镇安澜',
      symbolIcon: '🐟'
    },
    seal: { sealName: '秀州南湖之印', sealScript: '烟雨秀水', inkColor: '#319795' },
    landscapeTag: '枕水人家'
  },
  {
    id: 'jinhua',
    cityName: '金华市',
    dayIndex: 29,
    dateKey: '2026-09-06',
    solarTerm: '小雪 · 虹藏不见',
    modernName: '金华 · 婺州八咏楼与双龙洞天',
    ancientMythicName: '婺州双龙神洞',
    region: createRegionReference('jiangnan_waters', '江南水乡 · 婺州双龙'),
    country: '中国 · 浙江',
    coordinates: { lat: 29.1029, lng: 119.6474 },
    element: 'earth',
    colorTheme: {
      primary: '#D69E2E',
      secondary: '#3182CE',
      accent: '#ECC94B',
      glow: '#F6E05E'
    },
    heroImage: '/images/landmarks/jinhua_0.jpg',
    heroImageCaption: '金华双龙洞 · 卧舟入洞喀斯特溶洞奇观实景',
    galleryImages: [
      '/images/landmarks/jinhua_1.jpg',
      '/images/landmarks/jinhua_2.jpg',
      '/images/landmarks/jinhua_3.jpg'
    ],
    galleryCaptions: [
      '金华八咏楼 · 李清照千古绝唱诗楼实景',
      '东阳卢宅 · 华夏民居第一古建雕刻群实景',
      '兰溪诸葛八卦村 · 九宫八卦古村落实景'
    ],
    bestSeason: '春秋适宜 · 八咏怀古，双龙探幽，游东阳木雕之乡',
    geologyType: '金衢盆地东段红层丘陵与北山喀斯特溶洞地貌',
    mythicPoem: '水通南国三千里，气压江城十四州。\n八咏楼头云水阔，双龙洞里石泉幽。',
    mythicLore: '【项目创作】天界金星与婺女双星璀璨交辉，双龙洞顶青白双水龙俯冲吐玉液飞帘，气压江南十四州。',
    realHistory: '金华古称婺州，因地处金星与婺女争华之处而得名；宋代女词人李清照在此留下《题八咏楼》绝唱，双龙洞为道教名胜。',
    guardian: {
      name: '婺州水龙',
      title: '飞帘垂瀑洞天水龙',
      classicQuote: '水通南国三千里，气压江城十四州。——李清照《题八咏楼》',
      domainPower: '普照金衢平原、淬炼东阳巧匠、通达四海商贸',
      symbolIcon: '🐲'
    },
    seal: { sealName: '婺州双龙之印', sealScript: '气压江城', inkColor: '#D69E2E' },
    landscapeTag: '浙中枢纽'
  },
  {
    id: 'quzhou',
    cityName: '衢州市',
    dayIndex: 30,
    dateKey: '2026-09-07',
    solarTerm: '大雪 · 鹖鴠不鸣',
    modernName: '衢州 · 烂柯仙棋与南宗孔氏',
    ancientMythicName: '烂柯信安仙弈',
    region: createRegionReference('jiangnan_waters', '江南水乡 · 三省通衢'),
    country: '中国 · 浙江',
    coordinates: { lat: 28.9701, lng: 118.8595 },
    element: 'earth',
    colorTheme: {
      primary: '#744210',
      secondary: '#C53030',
      accent: '#2C7A7B',
      glow: '#4FD1C5'
    },
    heroImage: '/images/landmarks/quzhou_0.jpg',
    heroImageCaption: '衢州烂柯山 · 围棋仙地天生石梁仙洞实景',
    galleryImages: [
      '/images/landmarks/quzhou_1.jpg',
      '/images/landmarks/quzhou_2.jpg',
      '/images/landmarks/quzhou_3.jpg'
    ],
    galleryCaptions: [
      '衢州孔氏南宗家庙 · 南孔圣地古礼家庙实景',
      '江山江郎山 · 华夏丹霞第一奇峰三爿石实景',
      '衢州水亭门 · 钱塘江源头古城楼水关实景'
    ],
    bestSeason: '秋高气爽 · 登江郎山观丹霞三爿石，访南孔家庙沐儒风',
    geologyType: '钱塘江上游常山港与江山港汇流盆地及白垩纪丹霞地貌',
    mythicPoem: '王质观棋柯已烂，信安江上水如苍。\n南宗阙里儒风在，三省通衢古道长。',
    mythicLore: '【项目创作】王质采樵登烂柯山，一局未终斧柯已烂，沧海桑田。烂柯仙鹤引渡仙凡两界，信安江水奔流四省要冲。',
    realHistory: '衢州古称信安，有两千多年历史，素称“四省通衢”；境内有王质观棋烂柯山（围棋仙地）、江郎山（世界自然遗产）及南孔家庙。',
    guardian: {
      name: '烂柯仙鹤',
      title: '仙弈忘返引渡玄禽',
      classicQuote: '山中方七日，世上已千年。——烂柯山传仙典',
      domainPower: '推演棋道造化、弘扬南宗儒风、守御四省通衢',
      symbolIcon: '🕊️'
    },
    seal: { sealName: '信安南孔之印', sealScript: '烂柯仙弈', inkColor: '#744210' },
    landscapeTag: '儒风仙源'
  },
  {
    id: 'zhoushan',
    cityName: '舟山市',
    dayIndex: 31,
    dateKey: '2026-09-08',
    solarTerm: '冬至 · 蚯蚓结',
    modernName: '舟山 · 普陀山海天佛国与千岛之城',
    ancientMythicName: '定海蓬莱神珠',
    region: createRegionReference('jiangnan_waters', '江南水乡 · 定海普陀'),
    country: '中国 · 浙江',
    coordinates: { lat: 29.9855, lng: 122.2072 },
    element: 'water',
    colorTheme: {
      primary: '#DD6B20',
      secondary: '#2B6CB0',
      accent: '#38B2AC',
      glow: '#63B3ED'
    },
    heroImage: '/images/landmarks/zhoushan_0.jpg',
    heroImageCaption: '舟山普陀山 · 南海观音大铜像临海圣境实景',
    galleryImages: [
      '/images/landmarks/zhoushan_1.jpg',
      '/images/landmarks/zhoushan_2.jpg',
      '/images/landmarks/zhoushan_3.jpg'
    ],
    galleryCaptions: [
      '普陀山普济禅寺 · 海天佛国首刹莲池古寺实景',
      '舟山岱山岛 · 蓬莱仙岛古渔港海天实景',
      '舟山朱家尖 · 十里金沙与海蚀岬角实景'
    ],
    bestSeason: '夏秋海清 · 普陀礼佛听梵音海潮，列岛尝生猛海鲜',
    geologyType: '浙东沿海大陆架基岩岛屿群与海蚀海积地貌',
    mythicPoem: '海天佛国潮音远，千岛沧波紫竹深。\n普陀落伽祥云绕，定海神珠照碧浔。',
    mythicLore: '【项目创作】沧海千岛如散落凡间的碧玉珍珠，紫竹林畔祥云缭绕。潮音金吼昂首啸天，镇浪护法，梵音海潮响彻东海之滨。',
    realHistory: '舟山拥有 1,390 多个岛屿，是中国第一大群岛；普陀山是中国佛教四大名山之一，素有“海天佛国、南海圣境”之称。',
    guardian: {
      name: '潮音金吼',
      title: '镇浪护法金翅神兽',
      classicQuote: '海天佛国祥光现，千岛潮音度众生。',
      domainPower: '庇护千岛安澜、镇伏东海惊涛、普润海天慈光',
      symbolIcon: '🦁'
    },
    seal: { sealName: '定海海天之印', sealScript: '潮音落伽', inkColor: '#DD6B20' },
    landscapeTag: '海天佛国'
  },
  {
    id: 'taizhou',
    cityName: '台州市',
    dayIndex: 32,
    dateKey: '2026-09-09',
    solarTerm: '小寒 · 雁北乡',
    modernName: '台州 · 天台山国清寺与神仙居',
    ancientMythicName: '赤城天台灵境',
    region: createRegionReference('jiangnan_waters', '江南水乡 · 赤城天台'),
    country: '中国 · 浙江',
    coordinates: { lat: 28.6564, lng: 121.4208 },
    element: 'fire',
    colorTheme: {
      primary: '#C53030',
      secondary: '#7B341E',
      accent: '#319795',
      glow: '#FC8181'
    },
    heroImage: '/images/landmarks/taizhou_0.jpg',
    heroImageCaption: '台州天台山 · 国清寺隋塔与天台宗祖庭实景',
    galleryImages: [
      '/images/landmarks/taizhou_1.jpg',
      '/images/landmarks/taizhou_2.jpg',
      '/images/landmarks/taizhou_3.jpg'
    ],
    galleryCaptions: [
      '台州仙居神仙居 · 观音峰云海绝壁悬空栈道实景',
      '临海台州府城墙 · 江南八达岭雄关瓮城实景',
      '天台山石梁飞瀑 · 天下第一奇观花岗岩石梁瀑布实景'
    ],
    bestSeason: '春秋清润 · 登天台探隋代古刹国清寺，攀神仙居行仙山栈道',
    geologyType: '天台山脉火山岩中低山与仙居火山流纹岩丹霞峰林景观',
    mythicPoem: '龙楼凤阙不肯住，飞腾直欲天台去。\n赤城霞起建高标，仙居万仞神仙路。',
    mythicLore: '【项目创作】赤城霞光拔地而起，神仙居万仞栈道如通天神路。赤城火凤直冲云霄，栖霞盘旋于天台琼台仙谷，仙佛同源，霞蔚千重。',
    realHistory: '台州古称海陵、临海，李白诗云“龙楼凤阙不肯住，飞腾直欲天台去”；国清寺为佛教天台宗发源地，临海拥有千年台州府城墙。',
    guardian: {
      name: '赤城火凤',
      title: '赤城霞标冲天神羽',
      classicQuote: '天台四万八千丈，对此欲倒东南倾。——李白《梦游天姥吟留别》',
      domainPower: '焕发赤霞祥光、加持仙山福地、守护隋塔古刹',
      symbolIcon: '🦚'
    },
    seal: { sealName: '赤城仙居之印', sealScript: '仙佛同源', inkColor: '#C53030' },
    landscapeTag: '山海水城'
  },
  {
    id: 'lishui',
    cityName: '丽水市',
    dayIndex: 33,
    dateKey: '2026-09-10',
    solarTerm: '大寒 · 鸡始乳',
    modernName: '丽水 · 龙泉青瓷古窑与云和梯田',
    ancientMythicName: '处州括苍仙谷',
    region: createRegionReference('jiangnan_waters', '江南水乡 · 处州龙泉'),
    country: '中国 · 浙江',
    coordinates: { lat: 28.4677, lng: 119.9230 },
    element: 'wood',
    colorTheme: {
      primary: '#71A88A',
      secondary: '#48BB78',
      accent: '#D69E2E',
      glow: '#9AE6B4'
    },
    heroImage: '/images/landmarks/lishui_0.jpg',
    heroImageCaption: '丽水云和梯田 · 华东最大千年云海梯田实景',
    galleryImages: [
      '/images/landmarks/lishui_1.jpg',
      '/images/landmarks/lishui_2.jpg',
      '/images/landmarks/lishui_3.jpg'
    ],
    galleryCaptions: [
      '龙泉大窑青瓷遗址 · 哥窑弟窑千年龙泉青瓷窑火实景',
      '缙云仙都鼎湖峰 · 黄帝飞升华夏第一笋峰实景',
      '丽水古堰画乡 · 千年通济堰与瓯江古帆船实景'
    ],
    bestSeason: '春耕与秋收 · 赏云和梯田水满云飞，探龙泉青瓷宝剑非遗',
    geologyType: '浙西南洞宫山与括苍山中高山区，华东最高峰黄茅尖地带',
    mythicPoem: '雨过天青云破处，龙泉窑火淬青瓷。\n梯田叠翠通银汉，秀水处州入画痴。',
    mythicLore: '【项目创作】瓯江源头万木葱茏，鼎湖峰如巨柱擎天。相传轩辕黄帝在此铸鼎乘龙升天，鼎湖飞龙盘旋神柱，镇守秀水灵山。',
    realHistory: '丽水古称处州，被誉为“浙江绿谷”；拥有人类非物质文化遗产龙泉青瓷传统烧制技艺、龙泉宝剑、缙云仙都及中国最美梯田云和梯田。',
    guardian: {
      name: '鼎湖飞龙',
      title: '仙都铸鼎乘天神龙',
      classicQuote: '雨过天晴云破处，这般颜色做将来。——龙泉青瓷古赋',
      domainPower: '融汇窑火灵性、淬砺神剑锋芒、守护万木森林',
      symbolIcon: '🐉'
    },
    seal: { sealName: '龙泉处州之印', sealScript: '青瓷宝剑', inkColor: '#71A88A' },
    landscapeTag: '秀水丽水'
  }
];

/**
 * Canonical catalog accessors.  Consumers should resolve records through this
 * module instead of maintaining a second destination array or date fallback.
 */
export const DESTINATION_CATALOG_META = {
  id: 'gate2-regional-sample',
  coverage: 'sample' as const,
  entryCount: DESTINATIONS_DATA.length
};

export function findDestinationById(destinationId: string): DestinationItem | undefined {
  return DESTINATIONS_DATA.find(destination => destination.id === destinationId);
}

export function findDestinationByDateKey(dateKey: string): DestinationItem | undefined {
  return DESTINATIONS_DATA.find(destination => destination.dateKey === dateKey);
}

export function getFallbackDestinationIndex(date: Date): number {
  const dayNumber = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
  const normalized = dayNumber % DESTINATIONS_DATA.length;
  return normalized < 0 ? normalized + DESTINATIONS_DATA.length : normalized;
}
