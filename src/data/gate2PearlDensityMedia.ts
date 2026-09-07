/**
 * Gate 2 / 珠三角高密度切片的图片准入台账。
 *
 * 这不是通用素材库：它只记录本轮压力样本当前真正被 DestinationItem
 * 引用的 16 张地方图片。尺寸合格不自动等于来源、许可、拍摄日期和
 * 景点对应关系合格；没有完整证据的条目必须保持 provenance_pending。
 */
export type Gate2PearlDensityMediaStatus = 'catalog_approved' | 'provenance_pending';

export interface Gate2PearlDensityMediaAuditEntry {
  readonly id: string;
  readonly destinationId: string;
  readonly role: 'hero' | 'gallery';
  readonly localAssetPath: string;
  readonly localDimensions: {
    readonly width: number;
    readonly height: number;
  };
  readonly sourceUrl?: string;
  readonly sourceLabel?: string;
  readonly sourceDimensions?: {
    readonly width: number;
    readonly height: number;
  };
  readonly photoDate?: string;
  readonly licenseLabel?: string;
  readonly attribution?: string;
  readonly sha256?: string;
  readonly status: Gate2PearlDensityMediaStatus;
  readonly matchingNote: string;
  readonly blocker?: string;
}

const EVIDENCE_RECHECK_DATE = '2026-08-31';

export const GATE2_PEARL_DENSITY_MEDIA_AUDIT: readonly Gate2PearlDensityMediaAuditEntry[] = [
  {
    id: 'guangzhou-hero-existing',
    destinationId: 'guangzhou',
    role: 'hero',
    localAssetPath: '/images/landmarks/guangzhou_0.jpg',
    localDimensions: { width: 3840, height: 2367 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E5%B9%BF%E5%B7%9E%E9%95%87%E6%B5%B7%E6%A5%BC2019.jpg',
    sourceLabel: 'Wikimedia Commons · 镇海楼 (广州)',
    sourceDimensions: { width: 5291, height: 3261 },
    photoDate: '2019-12-20 12:55:26',
    licenseLabel: 'CC BY-SA 4.0',
    attribution: 'ScareCriterion12, 2019-12-20, Wikimedia Commons, CC BY-SA 4.0',
    sha256: '70D27EC9A358B0D07BF42CF8FD2E2703FEDDB563209EFF57185ABE9BBBDF74B3',
    status: 'catalog_approved',
    matchingNote: '本地文件与 Wikimedia Commons 3840px 版本 SHA-256 一致；画面为广州越秀山镇海楼，来源、原图尺寸、拍摄日期和许可已核对。'
  },
  {
    id: 'guangzhou-gallery-1-existing',
    destinationId: 'guangzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/guangzhou_1.jpg',
    localDimensions: { width: 3000, height: 2010 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Five-Ram_Sculpture_03290-Guangzhou_(32923532571).jpg',
    sourceLabel: 'Wikimedia Commons · Five-Ram Sculpture 03290-Guangzhou',
    sourceDimensions: { width: 3000, height: 2010 },
    photoDate: '2016-12-11 15:31:00',
    licenseLabel: 'CC BY 2.0',
    attribution: 'xiquinhosilva, 2016-12-11, Wikimedia Commons, CC BY 2.0',
    sha256: '4F0FE21DCA285A88F47C5F12C40476F21132D5402FB1DF08C2058BBC7E6E17C2',
    status: 'catalog_approved',
    matchingNote: '本地文件与 Wikimedia Commons 原图 SHA-256 一致；画面为越秀公园五羊石雕，地点、原图尺寸、拍摄日期和许可已核对。'
  },
  {
    id: 'guangzhou-gallery-2-existing',
    destinationId: 'guangzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/guangzhou_2.jpg',
    localDimensions: { width: 3648, height: 5472 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Canton_Tower_2013.11.15_18-12-45.jpg',
    sourceLabel: 'Wikimedia Commons · Canton Tower 2013.11.15 18-12-45',
    sourceDimensions: { width: 3648, height: 5472 },
    photoDate: '2013-11-15 18:12:45',
    licenseLabel: 'CC BY-SA 3.0 / GFDL',
    attribution: 'Zhangzhugang, 2013-11-15, Wikimedia Commons, CC BY-SA 3.0 / GFDL',
    sha256: 'FDDE9912810224422AE0B122F9C4F3BDDD95FB69B2D01A8ADA0F70C0B06E6916',
    status: 'catalog_approved',
    matchingNote: '本地文件与 Wikimedia Commons 原图尺寸和 SHA-256 一致；画面为广州塔夜景，地点、原图尺寸、拍摄日期和许可已核对。'
  },
  {
    id: 'guangzhou-moxing-summit-2023',
    destinationId: 'guangzhou',
    role: 'gallery',
    localAssetPath: '/images/landmarks/guangzhou_moxing_summit_2023.jpg',
    localDimensions: { width: 3840, height: 2880 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Moxing_Summit_1.jpg',
    sourceLabel: 'Wikimedia Commons · Moxing Summit 1',
    sourceDimensions: { width: 4000, height: 3000 },
    photoDate: '2023-03-04',
    licenseLabel: 'CC BY-SA 4.0',
    attribution: 'EditQ, 2023-03-04, Wikimedia Commons, CC BY-SA 4.0',
    sha256: '51ACACF631809C81572853398096C04F3C566CCE4F0BC1DE4D97B017E27B96FB',
    status: 'catalog_approved',
    matchingNote: '替换原先无法严谨证明为摩星岭的白云图；画面直接显示摩星岭牌坊与登山石阶，本地 3840×2880 版本来源、原图尺寸、拍摄日期和许可已核对。'
  },
  {
    id: 'foshan-hero-existing',
    destinationId: 'foshan',
    role: 'hero',
    localAssetPath: '/images/landmarks/foshan_0.jpg',
    localDimensions: { width: 3840, height: 2880 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:20251122_Foshan_Shi_Zumiao_Bowuguan_(132108).jpg',
    sourceLabel: 'Wikimedia Commons · 20251122 Foshan Shi Zumiao Bowuguan',
    sourceDimensions: { width: 4096, height: 3072 },
    photoDate: '2025-11-22 13:21:08',
    licenseLabel: 'CC BY-SA 4.0',
    attribution: 'Yumeto, 2025-11-22, Wikimedia Commons, CC BY-SA 4.0',
    sha256: '498CCA5110B08D41E00B2B5002E3B281049F89FD181E2A9CEEA665F3CC16B61B',
    status: 'catalog_approved',
    matchingNote: '本地文件与 Wikimedia Commons 3840px 版本 SHA-256 一致；画面为佛山祖庙入口及万福台建筑，地点、原图尺寸、拍摄日期和许可已核对。'
  },
  {
    id: 'foshan-xiqiao-north-gate-2021',
    destinationId: 'foshan',
    role: 'gallery',
    localAssetPath: '/images/landmarks/foshan_xiqiao_north_gate_2021.jpg',
    localDimensions: { width: 3840, height: 2880 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gate_of_Mount_SaiCiu_(NORTH).jpg',
    sourceLabel: 'Wikimedia Commons · Gate of Mount SaiCiu (NORTH)',
    sourceDimensions: { width: 4608, height: 3456 },
    photoDate: '2021-04-30',
    licenseLabel: 'CC BY-SA 4.0',
    attribution: 'PQ77wd, 2021-04-30, Wikimedia Commons, CC BY-SA 4.0',
    sha256: '3D3DEEE6D2EACB6E8EADC98C4E4A6AD61EB697053C9E2BC8CCC626AB2A1B9165',
    status: 'catalog_approved',
    matchingNote: '画面为西樵山北门入口与山体，不再冒充南海观音或天池瀑布；本地下载尺寸达到 3840×2880，景点、来源、许可和日期已核对。'
  },
  {
    id: 'foshan-shiwan-ridge-2019',
    destinationId: 'foshan',
    role: 'gallery',
    localAssetPath: '/images/landmarks/foshan_shiwan_ridge_2019.jpg',
    localDimensions: { width: 1920, height: 1388 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Shiwan_Town_39229-Foshan_(49043096232).jpg',
    sourceLabel: 'Wikimedia Commons · Shiwan Town 39229-Foshan',
    sourceDimensions: { width: 3000, height: 2169 },
    photoDate: '2019-09-21 12:56:00',
    licenseLabel: 'CC BY 2.0',
    attribution: 'xiquinhosilva, 2019-09-21 12:56:00, Wikimedia Commons, CC BY 2.0',
    sha256: '398D26432CC6EE4232DD1EB768D9FA1805A13D563C616702312916A383D0C7B5',
    status: 'catalog_approved',
    matchingNote: '画面可见石湾陶师祖庙屋脊陶塑，和“佛山陶塑脊饰”文案直接对应；本地 1920×1388 达到 1080p 以上，原图与许可信息已核对。'
  },
  {
    id: 'foshan-gallery-3-existing',
    destinationId: 'foshan',
    role: 'gallery',
    localAssetPath: '/images/landmarks/foshan_3.jpg',
    localDimensions: { width: 3840, height: 2806 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Century_Lotus_Sports_Center_%26_Fangta_seen_from_Dongping_Bridge.jpg',
    sourceLabel: 'Wikimedia Commons · Century Lotus Sports Center & Fangta seen from Dongping Bridge',
    sourceDimensions: { width: 3929, height: 2871 },
    photoDate: '2022-09-03 11:53:00',
    licenseLabel: 'CC BY-SA 4.0',
    attribution: '钉钉, 2022-09-03, Wikimedia Commons, CC BY-SA 4.0',
    sha256: 'C9034B2BD5441876AEBA4976AF0F35FD5F7A5A6A0CE73C736661C292F81187B9',
    status: 'catalog_approved',
    matchingNote: '本地文件与 Wikimedia Commons 3840px 版本 SHA-256 一致；画面为东平大桥视角下的世纪莲体育中心与方塔，地点、原图尺寸、拍摄日期和许可已核对。'
  },
  {
    id: 'dongguan-keyuan-architecture-2024',
    destinationId: 'dongguan',
    role: 'hero',
    localAssetPath: '/images/landmarks/dongguan_keyuan_2024_architecture.jpg',
    localDimensions: { width: 8192, height: 5003 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:KE_YUAN,_DONGGUAN,_CHINA_(101).jpg',
    sourceLabel: 'Wikimedia Commons · KE YUAN, DONGGUAN, CHINA (101)',
    sourceDimensions: { width: 8192, height: 5003 },
    photoDate: '2024-12-07',
    licenseLabel: 'CC BY-SA 4.0',
    attribution: 'Dinkun Chen, 2024-12-07, Wikimedia Commons, CC BY-SA 4.0',
    sha256: '1BE18402DFC6A9A7187B1C5474918D99BD00B487EFF77405B7F73091CC159202',
    status: 'catalog_approved',
    matchingNote: '画面为可园院落、砖木建筑与亭榭，修正了旧图并非可园的问题；原图尺寸、坐标语境、作者、日期和许可已核对。'
  },
  {
    id: 'dongguan-weiyuan-humen-2026',
    destinationId: 'dongguan',
    role: 'gallery',
    localAssetPath: '/images/landmarks/dongguan_weiyuan_humen_2026.jpg',
    localDimensions: { width: 4862, height: 3037 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:2026-04-06_Mon_T18-23-54_01.jpg',
    sourceLabel: 'Wikimedia Commons · Humen Bridge and Weiyuan Fort view',
    sourceDimensions: { width: 4862, height: 3037 },
    photoDate: '2026-04-06',
    licenseLabel: 'CC BY-SA 4.0',
    attribution: 'Wouter Van Rossem, 2026-04-06, Wikimedia Commons, CC BY-SA 4.0',
    sha256: 'A20F817B55CCACD07118A0BB3B2D3046EDBF7DDA9B9C031C766D65DEBB2D32F8',
    status: 'catalog_approved',
    matchingNote: '画面同时包含虎门大桥与威远炮台远眺关系，修正了旧低清图的素材准入；尺寸达到 4862×3037，日期与许可已核对。'
  },
  {
    id: 'dongguan-gallery-2-existing',
    destinationId: 'dongguan',
    role: 'gallery',
    localAssetPath: '/images/landmarks/dongguan_2.jpg',
    localDimensions: { width: 3000, height: 2044 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Opium_War_Museum_11433-Humen_(48754798691).jpg',
    sourceLabel: 'Wikimedia Commons · Opium War Museum 11433-Humen',
    sourceDimensions: { width: 3000, height: 2044 },
    photoDate: '2019-08-04 13:03:00',
    licenseLabel: 'CC BY 2.0',
    attribution: 'xiquinhosilva, 2019-08-04, Wikimedia Commons, CC BY 2.0',
    sha256: '8C509E52A58B1573AF3F0FCF80ABDA2D053296053AEE40CED1756C2B0675B306',
    status: 'catalog_approved',
    matchingNote: '本地文件与 Wikimedia Commons 原图 SHA-256 一致；画面为虎门鸦片战争博物馆/林则徐纪念馆旧址语境，地点、原图尺寸、拍摄日期和许可已核对。'
  },
  {
    id: 'dongguan-songshanlake-xbotpark-2022',
    destinationId: 'dongguan',
    role: 'gallery',
    localAssetPath: '/images/landmarks/dongguan_songshanlake_xbotpark_2022.jpg',
    localDimensions: { width: 8000, height: 6000 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:SongshanLakeXbotPark2.jpg',
    sourceLabel: 'Wikimedia Commons · SongshanLakeXbotPark2',
    sourceDimensions: { width: 8000, height: 6000 },
    photoDate: '2022-10-20',
    licenseLabel: 'CC0',
    attribution: 'Raysonho, 2022-10-20, Wikimedia Commons, CC0',
    sha256: '0ACA38EAC3412A12BAB1DD242A7AD466B2484535C1ECF74EA30F76C3647166A4',
    status: 'catalog_approved',
    matchingNote: '画面为松山湖 XbotPark 创业基地建筑，文案已从不对应的“华为欧洲小镇”改为实际地点；尺寸、作者、日期和 CC0 已核对。'
  },
  {
    id: 'shenzhen-hero-existing',
    destinationId: 'shenzhen',
    role: 'hero',
    localAssetPath: '/images/landmarks/shenzhen_0.jpg',
    localDimensions: { width: 3840, height: 2560 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E5%A4%A7%E9%B9%8F%E6%89%80%E5%9F%8E%E5%8D%97%E9%97%A8%E4%B8%9C%E8%B7%AF.jpg',
    sourceLabel: 'Wikimedia Commons · 大鹏所城南门东路',
    sourceDimensions: { width: 5472, height: 3648 },
    photoDate: '2021-04-11 09:02:49',
    licenseLabel: 'CC BY-SA 4.0',
    attribution: 'Iswzo, 2021-04-11, Wikimedia Commons, CC BY-SA 4.0',
    sha256: '1D296D789A2750ADAF23064FB9013F68878C0F148D6680667C81A6962ED80F77',
    status: 'catalog_approved',
    matchingNote: '本地文件与 Wikimedia Commons 3840px 版本 SHA-256 一致；画面为大鹏所城南门东路及古城门，地点、原图尺寸、拍摄日期和许可已核对。'
  },
  {
    id: 'shenzhen-gallery-1-existing',
    destinationId: 'shenzhen',
    role: 'gallery',
    localAssetPath: '/images/landmarks/shenzhen_1.jpg',
    localDimensions: { width: 1164, height: 2068 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Pingan_International_Finance_Center_by2020.jpg',
    sourceLabel: 'Wikimedia Commons · Pingan International Finance Center by2020',
    sourceDimensions: { width: 1164, height: 2068 },
    photoDate: '2021-01-01 15:21:42',
    licenseLabel: 'CC BY-SA 4.0',
    attribution: 'Charlie fong, 2021-01-01, Wikimedia Commons, CC BY-SA 4.0',
    sha256: 'B9DF1F5C497F33980D61BEC0A2A594B4FC4D7BCDC712E89252462D8E7DE1F4D0',
    status: 'catalog_approved',
    matchingNote: '本地文件与 Wikimedia Commons 原图 SHA-256 一致；画面为深圳平安金融中心竖幅天际线，地点、原图尺寸、拍摄日期和许可已核对。'
  },
  {
    id: 'shenzhen-wutong-tower-2022',
    destinationId: 'shenzhen',
    role: 'gallery',
    localAssetPath: '/images/landmarks/shenzhen_wutong_tower_2022.jpg',
    localDimensions: { width: 8192, height: 5464 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:SHENZHEN_TELEVISION_TOWER_IN_THE_TOP_OF_THE_WUTONG_MOUNTAIN.jpg',
    sourceLabel: 'Wikimedia Commons · Shenzhen television tower in Wutong Mountain',
    sourceDimensions: { width: 8192, height: 5464 },
    photoDate: '2022-11-21',
    licenseLabel: 'CC BY-SA 4.0',
    attribution: 'Dinkun Chen, 2022-11-21, Wikimedia Commons, CC BY-SA 4.0',
    sha256: '19C4587EA946B140D6DC49A717B25D91AFD4AB58F448595FB8A9E8756015353D',
    status: 'catalog_approved',
    matchingNote: '画面为梧桐山电视塔与山脊云气，文案已同步为实际画面；原图尺寸、地点、日期和许可已核对。'
  },
  {
    id: 'shenzhen-bay-park-2018',
    destinationId: 'shenzhen',
    role: 'gallery',
    localAssetPath: '/images/landmarks/shenzhen_bay_park_2018.jpg',
    localDimensions: { width: 4032, height: 3024 },
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Shenzhen_Bay_Park.jpg',
    sourceLabel: 'Wikimedia Commons · Shenzhen Bay Park',
    sourceDimensions: { width: 4032, height: 3024 },
    photoDate: '2018-06-26',
    licenseLabel: 'CC BY-SA 4.0',
    attribution: 'GangZhao, 2018-06-26, Wikimedia Commons, CC BY-SA 4.0',
    sha256: 'D5E361CB72C5BD6E6D9286ABE1F946B296E32E2F547CBCAE8F21161344FE76DC',
    status: 'catalog_approved',
    matchingNote: '画面为深圳湾公园与湾区天际线，文案已移除原图不具备的“人才公园春笋”断言；尺寸、地点、日期和许可已核对。'
  }
] as const;

export const GATE2_PEARL_DENSITY_MEDIA_RECHECK_DATE = EVIDENCE_RECHECK_DATE;

export function isGate2PearlDensityMediaReady(): boolean {
  return GATE2_PEARL_DENSITY_MEDIA_AUDIT.length === 16
    && GATE2_PEARL_DENSITY_MEDIA_AUDIT.every(media => media.status === 'catalog_approved');
}

export function getGate2PearlDensityMediaForDestination(
  destinationId: string
): readonly Gate2PearlDensityMediaAuditEntry[] {
  return GATE2_PEARL_DENSITY_MEDIA_AUDIT.filter(media => media.destinationId === destinationId);
}
