/**
 * 《新山海图志》华夏上古神兽与祥瑞灵物高精纯矢量图谱引擎 (High-Fidelity Mythic Beast Pure SVG Vector Totem Engine)
 * 严格依据《山海经》《述异记》、河姆渡国宝骨雕、汉画像砖、青铜器神兽纹样及各城市确凿典故考据精绘制
 * 彻底杜绝任何抽象敷衍线条，34 地区 1:1 独立专属纯矢量艺术图腾，形神兼备、字图绝对统一！
 */

export interface MythicBeastSvgConfig {
  svgPath: string;
  category: 'feather' | 'scale' | 'fur' | 'shell' | 'divine';
  aliasList: string[];
}

export const MYTHIC_BEAST_SVG_CATALOG: Record<string, MythicBeastSvgConfig> = {
  // 1. 广州市: 五仙神羊 (Five Celestial Rams - 盘旋大仙羊角、温润羊首与口衔五穗麦穗)
  '五仙神羊': {
    category: 'fur',
    aliasList: ['仙五羊', '五羊', '仙羊', '穗城神羊', '五色仙羊'],
    svgPath: `
      <!-- 左右向外向上盘旋的大仙羊角 (双螺旋古风羊角) -->
      <path d="M7 6C4 2 1 3 1 7c0 3.5 3 4.5 6 2M17 6c3-4 6-3 6 1 0 3.5-3 4.5-6 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M6 7c-1.5-1.5-3-1-3 1s1.5 2 3 1M18 7c1.5-1.5 3-1 3 1s-1.5 2-3 1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <!-- 温润仙羊面庞与羊耳 -->
      <path d="M7.5 7.5h9l-1.5 5.5-3 3-3-3L7.5 7.5z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M5 8.5l2.5 1M19 8.5l-2.5 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="10" cy="10" r="0.9" fill="currentColor"/>
      <circle cx="14" cy="10" r="0.9" fill="currentColor"/>
      <!-- 口衔五穗嘉禾 (麦粒饱满下垂) -->
      <path d="M12 16v6M9.5 18l2.5-2 2.5 2M8.5 20.5l3.5-2.5 3.5 2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="9.5" cy="18" r="0.8" fill="currentColor"/>
      <circle cx="14.5" cy="18" r="0.8" fill="currentColor"/>
      <circle cx="8.5" cy="20.5" r="0.8" fill="currentColor"/>
      <circle cx="15.5" cy="20.5" r="0.8" fill="currentColor"/>
    `
  },

  // 2. 深圳市: 金翅大鹏 (Golden Dapeng - 垂天大展多层羽翼、凌厉鹰隼利喙与破浪利爪)
  '金翅大鹏': {
    category: 'feather',
    aliasList: ['鲲鹏', '大鹏', '金鹏', '鹏城大鹏', '扶摇大鹏'],
    svgPath: `
      <!-- 垂天之翼大展 (左翼三层羽翎) -->
      <path d="M12 8C8 3 3 2 1 4c1 4 3 8 7 10M12 8C9 5 5 5 3 7c1 3 3 6 6 8M12 8C10 6 7 7 5 9c2 3 4 5 7 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- 垂天之翼大展 (右翼三层羽翎) -->
      <path d="M12 8c4-5 9-6 11-4-1 4-3 8-7 10M12 8c3-3 7-3 9-1-1 3-3 6-6 8M12 8c2-2 5-1 7 1-2 3-4 5-7 6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- 大鹏首部与金钩利喙 -->
      <polygon points="12,1 9.5,6 14.5,6" fill="currentColor"/>
      <path d="M12 6v3M10.5 7.5h3" stroke="currentColor" stroke-width="1.2"/>
      <!-- 凌空破浪飞翎与尾羽 -->
      <path d="M12 14v8M9.5 19l2.5 3 2.5-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    `
  },

  // 3. 珠海市: 中华白海豚 (White Dolphin - 真实海豚额隆头、跃水优美身姿与双层飞浪)
  '中华白海豚': {
    category: 'scale',
    aliasList: ['白海豚', '海豚', '九洲海豚', '中华白豚'],
    svgPath: `
      <!-- 白海豚额隆头、微翘嘴喙与流线跃水身躯 -->
      <path d="M2 14.5C3 8 8.5 3 15.5 4c3.5 0.5 5.5 2.5 6.5 5.5-2.5-0.5-5.5 0-7.5 1.5-3.5 2.5-5.5 5.5-11 5.5-1.5 0-2.5-0.5-3.5-2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- 背鳍与流线胸鳍 -->
      <path d="M12.5 4.8c0-2.5 1.5-3.8 3-3-0.8 1.2-1.5 2.2-2 3M10.5 11.5l-2.5 3.5c1-0.2 2-0.8 2.5-1.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <!-- 月牙形尾鳍 -->
      <path d="M2 14.5l-1.5 2.5 2-0.5 1 2-0.5-2.5" fill="currentColor"/>
      <circle cx="18.5" cy="7.5" r="0.8" fill="currentColor"/>
      <!-- 伶仃洋碧波双层飞浪 -->
      <path d="M3 19.5c3-1.5 6.5 0 9.5-1.5 3-1.5 6 0 9-1.5M6 22c3-1 6.5 0 9.5-1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    `
  },

  // 4. 佛山市: 西樵醒狮 (Awakening Lion - 正视南狮额镜天角、铜铃巨目、如意卷毛与方阔狮口)
  '西樵醒狮': {
    category: 'fur',
    aliasList: ['醒狮', '南狮', '佛山醒狮', '岭南醒狮', '瑞狮'],
    svgPath: `
      <!-- 醒狮天角与中央明镜额镜 -->
      <circle cx="12" cy="5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <polygon points="12,0.5 10.5,3 13.5,3" fill="currentColor"/>
      <!-- 额头如意云纹 -->
      <path d="M8 5C6 4 5 5 5 6.5c0 1.5 1.5 2 3 1.5M16 5c2-1 3 0 3 1.5 0 1.5-1.5 2-3 1.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <!-- 招牌双重铜铃大目 (金晴火眼) -->
      <circle cx="7" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="17" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="7" cy="10" r="1.1" fill="currentColor"/>
      <circle cx="17" cy="10" r="1.1" fill="currentColor"/>
      <!-- 方阔狮鼻与大张采青阔口 -->
      <path d="M10 11.5c1 0.8 3 0.8 4 0M6 14.5c2 4 10 4 12 0M8 17c1.5 1.5 6.5 1.5 8 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <!-- 两侧卷曲绒毛胡须 -->
      <path d="M3 9c-1 3 1 6 3.5 6.5M21 9c1 3-1 6-3.5 6.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
    `
  },

  // 5. 韶关市: 丹霞毕方 (Bifang - 丹霞仙鹤神躯、昂首吐火喙与极具辨识度的唯一单足立岩)
  '丹霞毕方': {
    category: 'feather',
    aliasList: ['毕方', '丹霞神鸟', '独足毕方', '赤火毕方'],
    svgPath: `
      <!-- 昂首引吭鸟首与高冠 -->
      <path d="M12 5c-1-3 1-4 3-3.5 1.5 0.5 1 2-0.5 3-2 1.5-2.5 3-2.5 5.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <polygon points="14.5,3.5 18,2.5 16,5" fill="currentColor"/>
      <circle cx="13.5" cy="3.5" r="0.7" fill="#fff"/>
      <!-- 喙中喷吐的毕方真火苗 -->
      <path d="M18 2.5c2-1 3.5 0 2 2-1.5 1.5-3 0.5-2-2z" fill="currentColor"/>
      <!-- 丰满展羽与翎尾 -->
      <path d="M12 10c-3 1-5 3-6 6 3 0.5 6-1 8-3.5M12 10c2-2 5-3 8-2-2 3-4 6-7 7.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <!-- 【独足立岩铁律】中央唯一单足垂直站立于下方岩石 -->
      <path d="M12 14v7M10 21l2 2 2-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 23h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    `
  },

  // 6. 肇庆市: 端溪白泽 (Baize - 额前竖立发光第三天目、如意祥云双角与墨韵长仙髯)
  '端溪白泽': {
    category: 'divine',
    aliasList: ['白泽', '端砚白泽', '通万物白泽', '端溪神兽'],
    svgPath: `
      <!-- 白泽一对向上向后弯曲的祥云神角 -->
      <path d="M7 5C5 2 2.5 2.5 2.5 5s3 3 5.5 3M17 5c2-3 4.5-2.5 4.5 0s-3 3-5.5 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <!-- 额头正中竖立发光的【第三天目】(通晓万物之眼) -->
      <ellipse cx="12" cy="6.5" rx="1.6" ry="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <circle cx="12" cy="6.5" r="0.9" fill="currentColor"/>
      <!-- 白泽睿智面庞与双眼 -->
      <path d="M6.5 9c0 4 2.5 7 5.5 8 3-1 5.5-4 5.5-8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="9" cy="11" r="0.9" fill="currentColor"/>
      <circle cx="15" cy="11" r="0.9" fill="currentColor"/>
      <!-- 飘逸长仙须美髯 (端砚墨宝) -->
      <path d="M9.5 17c1 2.5 4 2.5 5 0M12 18v4.5M10.5 20.5l1.5 2 1.5-2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    `
  },

  // 7. 惠州市: 罗浮青鸾 (Qingluan - S型修长长颈、华美凤翅与三道下垂飘逸青翎)
  '罗浮青鸾': {
    category: 'feather',
    aliasList: ['青鸾', '青鸟', '罗浮青鸟', '仙禽青鸾'],
    svgPath: `
      <!-- 优美S型仙禽长颈与昂首青鸟冠 -->
      <path d="M6.5 8c1-4.5 4.5-5.5 6.5-3.5 1.5 1.5 1 3.5-1 5-2 2-3 4-3 7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <polygon points="13.5,3.5 17.5,3 15,5.5" fill="currentColor"/>
      <circle cx="12" cy="4" r="0.7" fill="#fff"/>
      <!-- 罗浮仙山振翅青翼 -->
      <path d="M9 12c3-3 7-4 12-3-2 3-4 6-7 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <!-- 三道修长飘逸下垂青翎仙羽 -->
      <path d="M9 17c-1 2.5-3.5 4.5-7.5 5.5 4-1 6.5-2.5 7.5-5.5M11 18c0 2-0.5 4-2 5.5 2-1 3-2.5 3-5M13 17c1 2 2 4 3.5 5.5 0-2-0.5-3.5-1.5-5.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    `
  },

  // 8. 汕头市: 南澳神鳌 (Sacred Ao - 正俯视厚重八边形鳌甲、背部六边形八卦神纹与四足划水)
  '南澳神鳌': {
    category: 'shell',
    aliasList: ['神鳌', '巨鳌', '南澳巨鳌', '灵鳌', '负海鳌'],
    svgPath: `
      <!-- 正俯视厚重八边形鳌甲轮廓 -->
      <polygon points="12,2.5 18,5.5 20.5,12 18,18.5 12,21.5 6,18.5 3.5,12 6,5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <!-- 鳌甲内部精细六边形龟背纹与八卦爻线 -->
      <polygon points="12,7 16,9.5 16,14.5 12,17 8,14.5 8,9.5" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <path d="M12,2.5v4.5M18,5.5l-2,4M18,18.5l-2-4M12,21.5v-4.5M6,18.5l2-4M6,5.5l2,4" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <!-- 鳌首龙头与四只划水鳌足 -->
      <polygon points="12,0.5 10.5,2.5 13.5,2.5" fill="currentColor"/>
      <path d="M2,6l2.5 2M22,6l-2.5 2M2,18l2.5-2M22,18l-2.5-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    `
  },

  // 9. 潮州市: 韩江神鳄 (Sacred Crocodile - 侧视大张45度交错利齿大口、锯齿骨板与江水漩涡)
  '韩江神鳄': {
    category: 'scale',
    aliasList: ['神鳄', '韩江鳄', '鳄神', '退波神鳄'],
    svgPath: `
      <!-- 凶悍鳄鱼头部侧视大口 (上下颚大张45度) -->
      <path d="M3 12.5l17-7.5-4 5.5 5 2-18 4.5 4.5-2.5-4.5-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <!-- 上下两排交错尖锐利齿 -->
      <path d="M7 9l1.5 2 1.5-2 1.5 2 1.5-2M7 15l1.5-2 1.5 2 1.5-2 1.5 2" stroke="currentColor" stroke-width="1.2"/>
      <!-- 脊背三道坚硬凸起三角形骨板鳞棱 -->
      <polygon points="4,6.5 6.5,4 7.5,6.5" fill="currentColor"/>
      <polygon points="8.5,5.5 11,3 12,5.5" fill="currentColor"/>
      <polygon points="13,4.5 15.5,2 16.5,4.5" fill="currentColor"/>
      <circle cx="6.5" cy="10" r="1.1" fill="currentColor"/>
      <!-- 韩江恶溪波涛翻滚 -->
      <path d="M1 20c3-1 6 1 10 0 4-1 7 1 11 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    `
  },

  // 10. 揭阳市: 进贤彩凤 (Phoenix - 绝美开屏！正面高耸进贤双冠与大圆扇形九尾孔雀凤翎)
  '进贤彩凤': {
    category: 'feather',
    aliasList: ['九彩凤', '进贤凤', '玉都神凤', '彩凤', '金凤'],
    svgPath: `
      <!-- 正面高耸进贤门双重谯楼凤冠与凤首 -->
      <polygon points="12,1.5 10.5,5 13.5,5" fill="currentColor"/>
      <path d="M10.5 5h3l-1.5 6z" fill="currentColor"/>
      <circle cx="9.5" cy="8" r="0.7" fill="#fff"/>
      <circle cx="14.5" cy="8" r="0.7" fill="#fff"/>
      <!-- 正面大扇形九尾华羽放射状开屏 (孔雀凤翎放射骨架) -->
      <path d="M12 11L3 4M12 11L6 2M12 11L12 0.5M12 11L18 2M12 11L21 4M12 11L23 8.5M12 11L1 8.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <!-- 凤翎末端华丽同心圆眼斑 -->
      <circle cx="3" cy="4" r="1.4" fill="currentColor"/>
      <circle cx="6" cy="2" r="1.4" fill="currentColor"/>
      <circle cx="18" cy="2" r="1.4" fill="currentColor"/>
      <circle cx="21" cy="4" r="1.4" fill="currentColor"/>
      <circle cx="1" cy="8.5" r="1.2" fill="currentColor"/>
      <circle cx="23" cy="8.5" r="1.2" fill="currentColor"/>
      <!-- 底部祥云百鸟托座 -->
      <path d="M6 18.5c2.5-2 9.5-2 12 0M4 21.5c3.5-1.5 12.5-1.5 16 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    `
  },

  // 11. 汕尾市: 遮浪霸下 (Baxia - 侧视厚重玄武神躯、背负高耸功德石碑与分海双向波纹)
  '遮浪霸下': {
    category: 'shell',
    aliasList: ['霸下', '赑屃', '遮浪霸下', '定浪霸下', '玄甲霸下'],
    svgPath: `
      <!-- 底部沉稳玄龟神躯与甲壳 -->
      <path d="M2.5 14c0-3 3-5 8.5-5 6.5 0 10.5 2 10.5 6 0 2-2 4.5-6.5 5.5H6c-3.5 0-3.5-4-3.5-6.5z" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- 龟背上高耸直立的【功德石碑】(负碑赑屃标志) -->
      <rect x="8.5" y="2" width="6" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M10 4.5h3M10 6.5h3M10 8.5h3" stroke="currentColor" stroke-width="1"/>
      <!-- 碑顶祥云首与霸下龙头 -->
      <polygon points="11.5,0.5 8.5,2 14.5,2" fill="currentColor"/>
      <path d="M21.5 13l2-1.5v3.5l-2 1M5.5 19.5l-1.5 2.5M17.5 19.5l1.5 2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <!-- 遮浪分海波纹 -->
      <path d="M1 21.5c2-1 4 0 6-1M17 21.5h6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    `
  },

  // 12. 湛江市: 雷首神兽 (Thunder God Beast - 八只连环雷鼓环绕星阵与中央折线霹雳)
  '雷首神兽': {
    category: 'divine',
    aliasList: ['雷祖', '雷神', '雷州神兽', '雷首', '霹雳神兽'],
    svgPath: `
      <!-- 八只连环神鼓环绕成八卦星阵 -->
      <circle cx="12" cy="2.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <circle cx="18.7" cy="5.3" r="1.8" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <circle cx="21.5" cy="12" r="1.8" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <circle cx="18.7" cy="18.7" r="1.8" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <circle cx="12" cy="21.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <circle cx="5.3" cy="18.7" r="1.8" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <circle cx="2.5" cy="12" r="1.8" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <circle cx="5.3" cy="5.3" r="1.8" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <!-- 鼓心雷纹点 -->
      <circle cx="12" cy="2.5" r="0.6" fill="currentColor"/>
      <circle cx="21.5" cy="12" r="0.6" fill="currentColor"/>
      <circle cx="12" cy="21.5" r="0.6" fill="currentColor"/>
      <circle cx="2.5" cy="12" r="0.6" fill="currentColor"/>
      <!-- 正中央狂暴折线霹雳雷霆 (雷祖神威) -->
      <polygon points="13,4.5 6.5,13 12,13 10,20.5 18.5,10.5 13,10.5" fill="currentColor"/>
    `
  },
  // 13. 茂名市: 高凉灵龟 (Gaoliang Sacred Turtle - 冼太夫人铜柱灵龟、直立雕花铜柱与长寿八卦龟甲)
  '高凉灵龟': {
    category: 'shell',
    aliasList: ['灵龟', '高凉神龟', '圣母灵龟', '寿龟', '铜柱灵龟'],
    svgPath: `
      <!-- 正面大龟壳与八卦长寿纹 -->
      <ellipse cx="12" cy="14.5" rx="8.5" ry="6.8" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <path d="M7.5 14.5h9M12 10.5v8M9 12l6 5M15 12l-6 5" stroke="currentColor" stroke-width="1.2"/>
      <!-- 背负巍峨耸立的【雕花青铜神柱】(冼太夫人铜柱延年) -->
      <rect x="10.2" y="1.5" width="3.6" height="9.5" rx="0.6" fill="currentColor"/>
      <path d="M9 1.5h6M9.5 4.5h5M9.5 7.5h5" stroke="#fff" stroke-width="0.8"/>
      <!-- 龟首与四肢 -->
      <circle cx="12" cy="8.5" r="1.6" fill="currentColor"/>
      <path d="M3.5 11l-2.5-2M20.5 11l2.5-2M3.5 18l-2.5 2M20.5 18l2.5 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    `
  },

  // 14. 阳江市: 海陵鲛人 (Merfolk - 南海泉先鲛女仙姿、合十托举发光夜明珠与蝴蝶鱼尾)
  '海陵鲛人': {
    category: 'scale',
    aliasList: ['鲛人', '海陵鲛女', '南海鲛人', '水府灵神'],
    svgPath: `
      <!-- 上半身仙女姿态与如云长发 -->
      <circle cx="12" cy="3.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <path d="M10 6h4l-1 5h-2z" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <!-- 双手合十托举发光的【夜明珠】(沧海月明珠有泪) -->
      <circle cx="12" cy="8.5" r="1.8" fill="currentColor"/>
      <path d="M8 8.5c1.5-1 3-1 4 0M16 8.5c-1.5-1-3-1-4 0" stroke="currentColor" stroke-width="1.2"/>
      <!-- 珠光光芒 -->
      <path d="M12 5.5v1M12 10.5v1M9 8.5h1M14 8.5h1" stroke="currentColor" stroke-width="1"/>
      <!-- 下半身蜿蜒舒展的宽大蝴蝶琉璃鱼尾 -->
      <path d="M12 11c-1 3.5-3 5.5-6.5 6.5 4.5 1 6.5 3 6.5 5.5 0-2.5 2-4.5 6.5-5.5-3.5-1-5.5-3-6.5-6.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
    `
  },

  // 15. 清远市: 峡江帝江 (Dijiang - 《山海经》严谨考据：浑敦无面之躯、四翼大展与齐刷刷六足)
  '峡江帝江': {
    category: 'feather',
    aliasList: ['帝江', '混沌帝江', '连州帝江', '六足神鸟'],
    svgPath: `
      <!-- 浑敦无面金红圆球神躯 (圆融无耳目口鼻) -->
      <circle cx="12" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <!-- 身体两侧两对大展神翼 (共四翼) -->
      <path d="M6 7.5C3.5 5 1 6 1 8.5c2.5 1.5 4.5 0.5 5-1M18 7.5c2.5-2.5 5-1.5 5 1-2.5 1.5-4.5 0.5-5-1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M6.5 12.5C4 11 1.5 12 1.5 14.5c2.5 1 4.5-0.5 5-2M17.5 12.5c2.5-1.5 5-0.5 5 2-2.5 1-4.5-0.5-5-2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <!-- 底部整齐排布的【六只直立支撑神鸟足】(山海经六足铁律) -->
      <path d="M7.5 16.5v5M9.3 16.5v5M11.1 16.5v5M12.9 16.5v5M14.7 16.5v5M16.5 16.5v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <!-- 腹心通音律太极律动圆纹 -->
      <circle cx="12" cy="10.5" r="2.2" fill="currentColor"/>
    `
  },

  // 16. 江门市: 古榕鸿鹄 (Honghu - 小鸟天堂古榕盘根树冠林群与长展千里大鸿鹄)
  '古榕鸿鹄': {
    category: 'feather',
    aliasList: ['鸿鹄', '古榕仙禽', '高洁鸿鹄', '侨乡鸿鹄'],
    svgPath: `
      <!-- 顶部高飞千里大鸿鹄 (修长长颈与翱翔双翼) -->
      <path d="M12 3.5l-8 4.5 8-2.5 8 2.5-8-4.5z" fill="currentColor"/>
      <path d="M12 1v3M8 6.5l4 2 4-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
      <!-- 下方独木成林巨型伞状古榕树冠与垂曳气根 -->
      <path d="M2.5 17.5c0-3.5 3.5-5.5 5.5-5.5 1.5-2 3.5-3 4-3s2.5 1 4 3c2 0 5.5 2 5.5 5.5 0 2-2 3.5-4.5 3.5h-10c-2.5 0-4.5-1.5-4.5-3.5z" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <path d="M8.5 17.5v4.5M12 15.5v6.5M15.5 17.5v4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    `
  },

  // 17. 河源市: 万绿夫诸 (Four-Horned Celestial Deer - 洁水夫诸白鹿、四支修长独立开叉鹿角与清泉涟漪)
  '万绿夫诸': {
    category: 'fur',
    aliasList: ['夫诸', '洁水夫诸', '四角神鹿', '万绿神鹿'],
    svgPath: `
      <!-- 夫诸额顶四支独立直立开叉的【四角鹿冠】(四角洁水神鹿) -->
      <path d="M6.5 6.5L4 1.5M6.5 6.5L8 1.5M17.5 6.5L16 1.5M17.5 6.5L20 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M6.5 6.5c0 2 2 3.5 3.5 4.5M17.5 6.5c0 2-2 3.5-3.5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <!-- 清秀白鹿面庞与双眼 -->
      <polygon points="10,10.5 14,10.5 13,15.5 12,17.5 11,15.5" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <circle cx="9" cy="11.5" r="0.8" fill="currentColor"/>
      <circle cx="15" cy="11.5" r="0.8" fill="currentColor"/>
      <!-- 万绿湖洁水清泉同心双涟漪 -->
      <ellipse cx="12" cy="19.5" rx="8.5" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <ellipse cx="12" cy="19.5" rx="4.5" ry="1.2" fill="none" stroke="currentColor" stroke-width="1.1"/>
    `
  },

  // 18. 梅州市: 客都白虎 (White Tiger - 正视大方脸虎头、额头正中浮雕大「王」字与威严虎目硬须)
  '客都白虎': {
    category: 'fur',
    aliasList: ['白虎', '客都神虎', '阴那白虎', '仁圣白虎'],
    svgPath: `
      <!-- 正面威严大虎头与直立圆润虎耳 -->
      <path d="M3.5 6c-1-2.5 1-3.5 3.5-2.5l2 2M20.5 6c1-2.5-1-3.5-3.5-2.5l-2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M3.5 8c0 5.5 3.5 11.5 8.5 12.5 5-1 8.5-7 8.5-12.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
      <!-- 额头正中清晰威严的大写「王」字神纹 -->
      <path d="M9 5h6M9.5 7.2h5M9 9.5h6M12 5v4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <!-- 炯炯虎目、虎鼻与八字外张硬须 -->
      <circle cx="7.5" cy="12" r="1.4" fill="currentColor"/>
      <circle cx="16.5" cy="12" r="1.4" fill="currentColor"/>
      <polygon points="12,13 10,15.5 14,15.5" fill="currentColor"/>
      <path d="M3 14H0.5M3 16H1M21 14h2.5M21 16h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    `
  },

  // 19. 中山市: 香山麒麟 (Qilin - 祥云独角、龙首麋身、口中横向紧咬玉书金牒卷轴)
  '香山麒麟': {
    category: 'divine',
    aliasList: ['麒麟', '香山神麟', '瑞麟', '博爱麒麟'],
    svgPath: `
      <!-- 麒麟祥云独角 -->
      <path d="M12 1.5l-1.2 5h2.4L12 1.5z" fill="currentColor"/>
      <path d="M12 4C9 1.5 6.5 2.5 5.5 4.5M12 4c3-2.5 5.5-1.5 6.5 0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <!-- 龙首麋面 -->
      <path d="M6.5 8.5h11l-1.5 5-4 2-4-2L6.5 8.5z" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="9" cy="11" r="0.9" fill="currentColor"/>
      <circle cx="15" cy="11" r="0.9" fill="currentColor"/>
      <!-- 口中横向咬着的【玉书金牒卷轴】(天下为公) -->
      <rect x="4.5" y="15.5" width="15" height="4.2" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <path d="M6.5 17.6h11" stroke="currentColor" stroke-width="1.2"/>
      <circle cx="3.5" cy="17.6" r="1.1" fill="currentColor"/>
      <circle cx="20.5" cy="17.6" r="1.1" fill="currentColor"/>
    `
  },

  // 20. 东莞市: 海门獬豸 (Xiezhi - 直插云霄的单根笔直锋利独角与方正海门要塞锁口)
  '海门獬豸': {
    category: 'divine',
    aliasList: ['獬豸', '海门神兽', '法兽', '独角獬豸'],
    svgPath: `
      <!-- 直插云霄的锋利如剑【獬豸独角】(触不直法兽) -->
      <polygon points="12,0.5 9.5,9 14.5,9" fill="currentColor"/>
      <!-- 威严方正法兽面廓 -->
      <path d="M4.5 9c0 6.5 3.5 11 7.5 12 4-1 7.5-5.5 7.5-12" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="8" cy="13" r="1.4" fill="currentColor"/>
      <circle cx="16" cy="13" r="1.4" fill="currentColor"/>
      <!-- 虎门海门锁关方正锁形大口 -->
      <rect x="9" y="15.5" width="6" height="4.5" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="12" cy="17.7" r="0.8" fill="currentColor"/>
    `
  },

  // 21. 云浮市: 天露青龙 (Coiling Dragon with Pearl - 正面圆环盘龙造型、龙须飞扬与龙爪环抱正中龙珠)
  '天露青龙': {
    category: 'scale',
    aliasList: ['青龙', '天露神龙', '苍龙', '六祖青龙', '真如神龙'],
    svgPath: `
      <!-- 苍龙身躯盘旋成完美太极正圆 -->
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-dasharray="8 2 2 2"/>
      <!-- 顶部鹿角与龙首 -->
      <path d="M7.5 4.5C5.5 2 4 2.5 3 3.5M16.5 4.5c2-2.5 3.5-2 4.5-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <polygon points="12,3.5 9.5,7 14.5,7" fill="currentColor"/>
      <!-- 龙爪正中央环抱发光的【神龙宝珠】 -->
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="12" cy="12" r="1.3" fill="currentColor"/>
      <!-- 飞扬龙须 -->
      <path d="M6.5 8c-2 2-3 4.5-2 7M17.5 8c2 2 3 4.5 2 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    `
  },

  // 22. 香港: 狮子山金狮 (Lion Rock Golden Lion - 狮子山山崖峰峦层叠雄狮金鬃侧廓与昂首雄狮)
  '狮子山金狮': {
    category: 'fur',
    aliasList: ['狮子山神狮', '金狮', '香江神狮', '狮子山金狮', '狮子山神兽', '九龙神狮'],
    svgPath: `
      <!-- 昂首远眺雄狮头部侧视轮廓 (目光炯炯) -->
      <path d="M5.5 14c-1-3.5 0-6.5 2.5-7.5l4-2c2 0 4 2 4 4.5 1-1 3-1 4.5 0 1 2 0 4.5-1 5.5l-2.5 3-7.5 1c-2 0-3-2.5-4-4.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="10.8" cy="8.2" r="1" fill="currentColor"/>
      <!-- 从头顶到颈后层层叠叠如狮子山山峦般的【雄狮金鬃】 -->
      <path d="M12 3.5c3.5-2 8-1 9 2.5s0 5.5-2.5 6.5c3.5 0 5.5 3.5 4.5 6.5s-4.5 4.5-8 4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M14 6c2.5-1 5.5 0 6.5 2.5M16.5 11.5c2 0 4.5 2 3.5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <!-- 维港同舟共济金浪 -->
      <path d="M1.5 21.5c3-1.5 6.5 0 9.5-1 3.5 1 6.5 0 9.5 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    `
  },

  // 23. 澳门: 濠镜天鹿 (Heavenly Deer with Lotus - 轻盈奔跃仙鹿与前后四蹄足踏盛开三瓣金莲)
  '濠镜天鹿': {
    category: 'fur',
    aliasList: ['天鹿', '濠镜神鹿', '金莲天鹿', '瑞芝天鹿'],
    svgPath: `
      <!-- 珊瑚开叉多枝仙鹿角 -->
      <path d="M8.5 4.5C6.5 1.5 4.5 1.5 3.5 3M15.5 4.5c2-3 4-3 5-1.5M6.5 2.5l-2-1.5M17.5 2.5l2-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <!-- 奔跃仙鹿身姿 -->
      <path d="M7.5 7h9l-1.5 4.5-3 2-3-2L7.5 7z" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <circle cx="9.5" cy="9.2" r="0.8" fill="currentColor"/>
      <circle cx="14.5" cy="9.2" r="0.8" fill="currentColor"/>
      <!-- 足下踩着的【盛开三瓣金莲花】(澳门区花金莲) -->
      <path d="M12 14.5c-1.8 2.2-4.5 3.2-6.5 2.2 2.2 3.2 5.5 4.2 6.5 5.5 1-1.3 4.3-2.3 6.5-5.5-2 1-4.7 0-6.5-2.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M12 14.5v5.5" stroke="currentColor" stroke-width="1.4"/>
    `
  },

  // 24. 杭州市: 钱塘潮神 (Tidal Steed - 昂首长嘶飞天白马长鬃与百丈钱塘回头潮巨浪)
  '钱塘潮神': {
    category: 'divine',
    aliasList: ['潮神', '钱塘白马', '潮神白马', '素车白马'],
    svgPath: `
      <!-- 昂首长嘶飞天神马马首与飞扬马鬃 (伍子胥素车白马) -->
      <path d="M5.5 13.5c-1-3.5 0-7.5 3.5-9.5 2 1 3 3.5 2 6.5l5.5-1c1.5 1 2 3.5 1 5L13 16.5H7.5c-1.5 0-2-1.5-2-3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M11 3.5c3.5-1 7 0 8 2.5-1 2-2.5 3.5-4.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="9.5" cy="8" r="1" fill="currentColor"/>
      <!-- 蹄下卷起的百丈【钱塘一线怒潮与回头巨浪】 -->
      <path d="M1.5 17c3.5-3.5 7.5-1 10.5-3.5 3.5 2.5 7-1 10.5-2.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M1.5 21.5c3.5-2 7 0 10.5-1.5 4.5 1.5 7.5-1 10.5 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    `
  },
  // 25. 宁波市: 双鸟朝阳 (Double Birds Facing Sun - 七千年河姆渡国宝骨雕纯正复刻：太阳火轮与对称捧日双鸟)
  '双鸟朝阳': {
    category: 'feather',
    aliasList: ['双凤朝阳', '河姆渡神鸟', '朝日双鸟', '双鸟捧日'],
    svgPath: `
      <!-- 正中央一轮喷薄光芒的【河姆渡太阳火轮】 -->
      <circle cx="12" cy="11" r="3.8" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="12" cy="11" r="1.8" fill="currentColor"/>
      <!-- 左侧昂首捧日神鸟 (羽翎相依) -->
      <path d="M8 11C5.5 10 2.5 8 1.5 4.5c2.5 3 4.5 6.5 7 6.5z" fill="currentColor"/>
      <path d="M1.5 4.5l2.5 1-1 2.5" stroke="currentColor" stroke-width="1.3"/>
      <!-- 右侧对称昂首捧日神鸟 -->
      <path d="M16 11c2.5-1 5.5-3 6.5-6.5-2.5 3-4.5 6.5-7 6.5z" fill="currentColor"/>
      <path d="M22.5 4.5l-2.5 1 1 2.5" stroke="currentColor" stroke-width="1.3"/>
      <!-- 底部象牙连理托座 -->
      <path d="M3.5 18c4.5-2.5 12.5-2.5 17 0M5.5 21.5c3.5-1 9.5-1 13 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    `
  },

  // 26. 温州市: 白鹿衔花 (White Deer with Flower - 晋郭璞筑城白鹿：侧面回眸仙鹿与嘴中紧衔大五瓣名花)
  '白鹿衔花': {
    category: 'fur',
    aliasList: ['白鹿', '温州白鹿', '衔花白鹿', '东瓯仙鹿'],
    svgPath: `
      <!-- 鹿角向后分枝 -->
      <path d="M9.5 4.5C7.5 1.5 5.5 1.5 4.5 3M8.5 2.5C6.5 0.5 4.5 1 3.5 2.5M14.5 4.5c2-3 4-3 5-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <!-- 回眸仙鹿面庞 -->
      <path d="M7.5 6.5h8l-1.5 4-3.5 1.5-3-1.5L7.5 6.5z" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <circle cx="9.5" cy="8.5" r="0.8" fill="currentColor"/>
      <!-- 嘴中紧紧衔着一朵大而清晰的【五瓣名花与瑞草】(白鹿衔花标志) -->
      <path d="M12 12v4.5" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="12" cy="18" r="2.4" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="12" cy="18" r="0.9" fill="currentColor"/>
      <circle cx="9.2" cy="16.2" r="1.2" fill="currentColor"/>
      <circle cx="14.8" cy="16.2" r="1.2" fill="currentColor"/>
      <circle cx="9.8" cy="20.2" r="1.2" fill="currentColor"/>
      <circle cx="14.2" cy="20.2" r="1.2" fill="currentColor"/>
    `
  },

  // 27. 绍兴市: 兰亭神鹅 (Sacred Calligraphy Goose - 王羲之换经神鹅：超大S形曲项向天歌、圆润浮水腹身与墨池涟漪)
  '兰亭神鹅': {
    category: 'feather',
    aliasList: ['神鹅', '兰亭鹅', '换经鹅', '右军神鹅', '墨韵白鹅'],
    svgPath: `
      <!-- 书圣白鹅招牌大S形【曲项向天歌长颈】(白毛浮绿水，红掌拨清波) -->
      <path d="M15.5 3.5c-3.5-2.5-6.5 0-5.5 4s4.5 4.5 3.5 9c-1 3.5-4.5 5-9 5.5 4.5 1 10 0 13.5-4.5 2-3.5 2-9 0-13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
      <!-- 鹅头红顶与扁平鹅喙 -->
      <circle cx="15.5" cy="3.5" r="1.4" fill="currentColor"/>
      <polygon points="15.5,3.5 20,3.5 17.5,6" fill="currentColor"/>
      <circle cx="13.8" cy="3.5" r="0.6" fill="#fff"/>
      <!-- 墨池清流涟漪 -->
      <path d="M1.5 20c3.5-1 7 1 11 0 4.5-1 8 1 11 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M4.5 22.5c3.5-0.8 8 0.8 12.5 0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    `
  },

  // 28. 湖州市: 莫干双龙 (Twin Sword Dragons - 干将莫邪雌雄双剑十字交叉出鞘与太极剑丸)
  '莫干双龙': {
    category: 'scale',
    aliasList: ['双剑龙', '莫干剑龙', '干将莫邪龙', '雌雄双龙'],
    svgPath: `
      <!-- 干将剑、莫邪剑双剑十字交叉出鞘 -->
      <path d="M3.5 3.5l17 17M20.5 3.5L3.5 20.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      <!-- 四个剑尖化作的四方龙首锋芒 -->
      <polygon points="3.5,3.5 7,2.5 2.5,7" fill="currentColor"/>
      <polygon points="20.5,3.5 17,2.5 21.5,7" fill="currentColor"/>
      <polygon points="3.5,20.5 7,21.5 2.5,17" fill="currentColor"/>
      <polygon points="20.5,20.5 17,21.5 21.5,17" fill="currentColor"/>
      <!-- 中央铸剑太极灵珠与护锷 -->
      <circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
    `
  },

  // 29. 嘉兴市: 南湖红鲤 (Leaping Red Carp - 垂直大弧形向上跃龙门鲤鱼身、扇尾与龙门浪)
  '南湖红鲤': {
    category: 'scale',
    aliasList: ['红鲤', '南湖鲤', '赤鳞神鲤', '红船神鲤'],
    svgPath: `
      <!-- 垂直大弧形向上跃龙门的鲤鱼身躯 (鲤跃龙门) -->
      <path d="M12 1.5C6.5 3.5 3.5 9 4.5 14.5c1 4.5 4.5 7.5 9 7.5 3.5-3.5 4.5-9 3.5-13.5-1-3.5-2.5-7-5-8.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
      <!-- 宽大的扇形鱼尾 -->
      <path d="M13.5 22l3.5 3.5-1.5-3.5 3.5-1-5.5-1.5" fill="currentColor"/>
      <!-- 向上张开的双胸鳍与鱼鳞神光 -->
      <path d="M3.5 11l-3-2.5 3-1M12.5 6c0-3.5 2.5-4.5 3.5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="8.5" cy="5.5" r="1.2" fill="currentColor"/>
      <!-- 龙门水波翻滚 -->
      <path d="M0.5 20c3.5-1.5 7 0 10.5-1.5 3.5 1.5 7 0 10.5 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    `
  },

  // 30. 金华市: 婺州水龙 (Water Dragon Waterfall - 顶部倒挂俯冲龙首与直冲向下的三道瀑布飞帘)
  '婺州水龙': {
    category: 'scale',
    aliasList: ['双龙', '水龙', '双龙洞龙', '金华神龙', '青白水龙'],
    svgPath: `
      <!-- 双龙洞顶倒挂俯冲而下的威严龙首 -->
      <polygon points="12,8.5 6.5,1.5 17.5,1.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
      <polygon points="12,8.5 8.5,2.5 15.5,2.5" fill="currentColor"/>
      <circle cx="8.5" cy="3.5" r="0.9" fill="#fff"/>
      <circle cx="15.5" cy="3.5" r="0.9" fill="#fff"/>
      <!-- 龙嘴向下垂直喷涌而出的【三道瀑布飞帘水柱】 -->
      <path d="M8.5 10.5v12M12 9.5v13.5M15.5 10.5v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <!-- 水潭波澜 -->
      <path d="M4 23h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    `
  },

  // 31. 衢州市: 烂柯仙鹤 (Immortal Crane on Go Board - 丹顶玄禽仙鹤双腿修长立于方形围棋棋盘与棋子之上)
  '烂柯仙鹤': {
    category: 'feather',
    aliasList: ['仙鹤', '烂柯鹤', '玄鹤', '仙弈神鹤'],
    svgPath: `
      <!-- 仙鹤长颈向下探视烂柯仙棋局 -->
      <path d="M13.5 1.5c-2.5 0-3.5 1.5-3.5 3s2.5 2.5 2 5c-1 3.5-3.5 4.5-7 5.5 3.5 0 7-1.5 9-4 1-1.5 1-4 0.5-6.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
      <circle cx="13" cy="2" r="1.2" fill="currentColor"/> <!-- 丹顶朱砂印 -->
      <polygon points="14.5,2.5 18,3 16,5" fill="currentColor"/>
      <!-- 仙鹤两条极修长的并立仙足 -->
      <path d="M10 13.5v4.5M13.5 13.5v4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <!-- 底部烂柯山【方形网格围棋棋盘与黑白棋子】 -->
      <rect x="3.5" y="18" width="17" height="4.5" rx="0.6" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <path d="M7.7 18v4.5M12 18v4.5M16.3 18v4.5" stroke="currentColor" stroke-width="1"/>
      <circle cx="5.6" cy="20.2" r="1.1" fill="currentColor"/>
      <circle cx="14.1" cy="20.2" r="1.1" fill="currentColor"/>
    `
  },

  // 32. 舟山市: 潮音金吼 (Golden Hou Roaring to Sky - 90度仰天大张怒吼巨口与三道放射状海潮音波)
  '潮音金吼': {
    category: 'divine',
    aliasList: ['金吼', '海潮吼', '潮音吼', '普陀金吼', '镇海金兽'],
    svgPath: `
      <!-- 朝天90度垂直仰天的【怒吼狮首巨口】(朝天吼真身) -->
      <path d="M5.5 16.5c-1-3.5 0-8 2.5-11 1-2 3.5-3.5 5.5-3.5s4.5 1.5 5.5 3.5c2.5 3 3.5 7.5 2.5 11l-3.5 2.5H9l-3.5-2.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
      <!-- 垂直朝天大张的深渊巨口 -->
      <ellipse cx="12" cy="7" rx="4.5" ry="2.8" fill="currentColor"/>
      <!-- 喉间喷薄向上的三道放射状【普陀梵音潮音海啸声波】 -->
      <path d="M12 3V0.5M7.5 3L5 0.5M16.5 3L19 0.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <!-- 底部普陀梵音莲花浪 -->
      <path d="M2.5 20.5c3.5-1.5 7 0 10.5-1.5 3.5 1.5 7 0 10.5 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    `
  },

  // 33. 台州市: 赤城火凤 (Ascending Fire Phoenix - 与揭阳彻底区隔！垂直直冲云霄的双立火翅与升腾天台真火苗)
  '赤城火凤': {
    category: 'feather',
    aliasList: ['火凤', '天台火凤', '赤城凤', '栖霞神凤'],
    svgPath: `
      <!-- 垂直向上直冲云霄的双直立火翅 (朱雀浴火朝天冲天火翼) -->
      <path d="M6.5 16.5L3 1.5c3.5 4.5 6 9 6 13.5M17.5 16.5l3.5-15c-3.5 4.5-6 9-6 13.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <!-- 正中央向上升腾的尖锐火冠凤首 -->
      <polygon points="12,0.5 9,7 15,7" fill="currentColor"/>
      <circle cx="12" cy="9" r="1.6" fill="currentColor"/>
      <!-- 身体两侧与尾部熊熊升腾的三道尖锐赤城真火苗 -->
      <path d="M12 12c-2.5 2.5-3.5 6-1 10.5 1-2.5 2.5-5 1-10.5z" fill="currentColor"/>
      <path d="M7.5 15c-2 2.5-2.5 5-1 7.5 1-2 2-4 1-7.5z" fill="currentColor"/>
      <path d="M16.5 15c2 2.5 2.5 5 1 7.5-1-2-2-4-1-7.5z" fill="currentColor"/>
    `
  },

  // 34. 丽水市: 鼎湖飞龙 (Dragon Spiraling Peak - 缙云仙都鼎湖峰直立巨石柱与螺旋缠绕升天天龙)
  '鼎湖飞龙': {
    category: 'scale',
    aliasList: ['飞龙', '鼎湖神龙', '仙都飞龙', '乘天神龙', '龙泉剑龙'],
    svgPath: `
      <!-- 中央直插云霄的【鼎湖峰天然巨石柱】 -->
      <rect x="10" y="5.5" width="4" height="16" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- 神龙身躯呈螺旋S形缠绕石柱腾空盘旋而上 (黄帝乘龙升天) -->
      <path d="M3.5 18.5c3.5-2.5 8 0 11.5-2.5s4.5-3.5 1-6-8 0-11.5-2.5 4.5-3.5 10.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <!-- 柱顶腾空昂首的威严龙首 -->
      <polygon points="12,0.5 8.5,4 15.5,4" fill="currentColor"/>
      <circle cx="12" cy="2.8" r="0.8" fill="#fff"/>
      <path d="M6.5 1.5L9 4M17.5 1.5L15 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <!-- 底部仙都升天祥云 -->
      <path d="M2.5 21.5c3.5-1 7-1 10.5 0 3.5-1 7-1 10.5 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    `
  },

  // 兜底与通用灵兽 (Fallback / Common)
  '白虎': {
    category: 'fur',
    aliasList: ['猛虎', '白额虎', '神虎'],
    svgPath: `
      <path d="M3.5 6c-1-2.5 1-3.5 3.5-2.5l2 2M20.5 6c1-2.5-1-3.5-3.5-2.5l-2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M3.5 8c0 5.5 3.5 11.5 8.5 12.5 5-1 8.5-7 8.5-12.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
      <path d="M9 5h6M9.5 7.2h5M9 9.5h6M12 5v4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="7.5" cy="12" r="1.4" fill="currentColor"/>
      <circle cx="16.5" cy="12" r="1.4" fill="currentColor"/>
    `
  },
  '青龙': {
    category: 'scale',
    aliasList: ['神龙', '巨龙', '苍龙'],
    svgPath: `
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-dasharray="8 2 2 2"/>
      <polygon points="12,3.5 9.5,7 14.5,7" fill="currentColor"/>
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>
    `
  },
  '玄武': {
    category: 'shell',
    aliasList: ['龟蛇', '玄冥'],
    svgPath: `
      <polygon points="12,2.5 18,5.5 20.5,12 18,18.5 12,21.5 6,18.5 3.5,12 6,5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
      <polygon points="12,7 16,9.5 16,14.5 12,17 8,14.5 8,9.5" fill="none" stroke="currentColor" stroke-width="1.3"/>
    `
  },
  '白泽': {
    category: 'divine',
    aliasList: ['白泽神兽'],
    svgPath: `
      <path d="M7 5C5 2 2.5 2.5 2.5 5s3 3 5.5 3M17 5c2-3 4.5-2.5 4.5 0s-3 3-5.5 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <ellipse cx="12" cy="6.5" rx="1.6" ry="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <circle cx="12" cy="6.5" r="0.9" fill="currentColor"/>
    `
  },
  '麒麟': {
    category: 'divine',
    aliasList: ['神麟', '祥麟'],
    svgPath: `
      <path d="M12 1.5l-1.2 5h2.4L12 1.5z" fill="currentColor"/>
      <rect x="4.5" y="15.5" width="15" height="4.2" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.6"/>
    `
  }
};

/**
 * 根据神兽名称获取对应的纯矢量 SVG 图标
 */
export function getBeastSvgIcon(beastName: string, color: string = 'currentColor', size: number = 24): string {
  const cleanName = (beastName || '').trim();

  // 1. 精确匹配
  if (MYTHIC_BEAST_SVG_CATALOG[cleanName]) {
    const config = MYTHIC_BEAST_SVG_CATALOG[cleanName];
    return generateSvgString(config.svgPath, color, size, cleanName);
  }

  // 2. 别名与模糊匹配
  for (const [key, config] of Object.entries(MYTHIC_BEAST_SVG_CATALOG)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return generateSvgString(config.svgPath, color, size, cleanName);
    }
    if (config.aliasList.some(alias => cleanName.includes(alias) || alias.includes(cleanName))) {
      return generateSvgString(config.svgPath, color, size, cleanName);
    }
  }

  // 3. 兜底匹配：按字面特征
  if (cleanName.includes('进贤') || cleanName.includes('彩凤')) {
    return generateSvgString(MYTHIC_BEAST_SVG_CATALOG['进贤彩凤'].svgPath, color, size, cleanName);
  }
  if (cleanName.includes('赤城') || cleanName.includes('火凤')) {
    return generateSvgString(MYTHIC_BEAST_SVG_CATALOG['赤城火凤'].svgPath, color, size, cleanName);
  }
  if (cleanName.includes('龙') || cleanName.includes('蛟')) {
    return generateSvgString(MYTHIC_BEAST_SVG_CATALOG['天露青龙'].svgPath, color, size, cleanName);
  }
  if (cleanName.includes('狮') || cleanName.includes('吼')) {
    return generateSvgString(MYTHIC_BEAST_SVG_CATALOG['西樵醒狮'].svgPath, color, size, cleanName);
  }
  if (cleanName.includes('鹿') || cleanName.includes('诸')) {
    return generateSvgString(MYTHIC_BEAST_SVG_CATALOG['万绿夫诸'].svgPath, color, size, cleanName);
  }
  if (cleanName.includes('鳌') || cleanName.includes('龟') || cleanName.includes('下')) {
    return generateSvgString(MYTHIC_BEAST_SVG_CATALOG['南澳神鳌'].svgPath, color, size, cleanName);
  }
  if (cleanName.includes('虎')) {
    return generateSvgString(MYTHIC_BEAST_SVG_CATALOG['客都白虎'].svgPath, color, size, cleanName);
  }

  // 最终兜底
  return generateSvgString(MYTHIC_BEAST_SVG_CATALOG['端溪白泽'].svgPath, color, size, cleanName);
}

function generateSvgString(innerPath: string, color: string, size: number, title: string): string {
  return `<svg class="mythic-beast-svg-totem" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" style="color: ${color}; vertical-align: middle;" aria-label="${title}">${innerPath}</svg>`;
}
