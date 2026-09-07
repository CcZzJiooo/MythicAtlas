/**
 * Gate 2 regional evidence is a provenance ledger, not a destination catalog.
 *
 * A runtime slice may have real, useful source material while one or more
 * approval boundaries remain pending. Keeping those facts separate lets the
 * UI run the slice without inventing administrative approval or hiding an
 * unresolved source/licence decision.
 */
export type Gate2EvidenceSourceKind =
  | 'administrative'
  | 'boundary'
  | 'heritage'
  | 'media'
  | 'culture';

export type Gate2EvidenceStatus = 'confirmed' | 'candidate' | 'pending';

export interface Gate2EvidenceSource {
  readonly id: string;
  readonly kind: Gate2EvidenceSourceKind;
  readonly label: string;
  readonly url: string;
  readonly observedAt: string;
  readonly status: Gate2EvidenceStatus;
  readonly notes: string;
}

export interface Gate2RegionalFact {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly sourceId: string;
  readonly status: 'confirmed' | 'pending';
}

export interface Gate2BoundaryEvidence {
  readonly adminCode: string;
  readonly center: {
    readonly lat: number;
    readonly lng: number;
  };
  readonly sourceId: string;
  readonly coordinateSystem: 'unknown_pending' | 'WGS84' | 'GCJ02';
  readonly importStatus: 'not_imported' | 'imported';
  readonly status: 'pending' | 'approved';
  readonly blocker: string;
}

export interface Gate2MediaEvidence {
  readonly id: string;
  readonly sourceId: string;
  readonly role: 'hero_candidate' | 'gallery_candidate';
  readonly locationLabel: string;
  readonly photoDate?: string;
  readonly uploadDate?: string;
  readonly width: number;
  readonly height: number;
  readonly licenseLabel: string;
  readonly localAssetPath: string;
  readonly sha256: string;
  readonly attribution: string;
  readonly metadataStatus: 'confirmed' | 'pending';
  readonly localAssetStatus: 'not_ingested' | 'ingested';
  readonly catalogReadiness: 'pending_local_ingest' | 'approved';
  readonly matchingNote: string;
}

export interface Gate2RegionalEvidence {
  readonly id: string;
  readonly sampleId: string;
  readonly regionKey: string;
  readonly provinceCode: string;
  readonly candidateCityName: string;
  readonly sources: readonly Gate2EvidenceSource[];
  readonly facts: readonly Gate2RegionalFact[];
  readonly boundary: Gate2BoundaryEvidence;
  readonly media: readonly Gate2MediaEvidence[];
  readonly cultureTokens: readonly {
    readonly name: string;
    readonly hex: string;
    readonly sourcePath: string;
    readonly status: 'confirmed' | 'pending';
  }[];
  readonly catalogReadiness: 'candidate_pending_catalog' | 'ready_for_catalog';
  readonly notes: string;
}

const EVIDENCE_RECHECK_DATE = '2026-08-31';

/**
 * First non-Guangdong runtime slice: Hangzhou / West Lake.
 *
 * The source pages establish an addressable, real candidate and several
 * usable photographic references. Local ingest and attribution are now
 * recorded for four files; the administrative boundary and complete city-copy
 * review remain pending as separate evidence boundaries.
 */
export const HANGZHOU_JIANGNAN_EVIDENCE: Gate2RegionalEvidence = {
  id: 'hangzhou-jiangnan-candidate',
  sampleId: 'non-gd-jiangnan-candidate',
  regionKey: 'jiangnan_waters',
  provinceCode: 'ZJ',
  candidateCityName: '杭州市',
  sources: [
    {
      id: 'hangzhou-admin-code',
      kind: 'administrative',
      label: '高德地图行政区划说明',
      url: 'https://developer.amap.com/api/amap-ui/reference-amap-ui/geo/district-explorer',
      observedAt: EVIDENCE_RECHECK_DATE,
      status: 'confirmed',
      notes: '页面将杭州列为市级行政区示例，行政区划代码为 330100。'
    },
    {
      id: 'hangzhou-admin-center',
      kind: 'administrative',
      label: '杭州市行政区划与中心坐标资料页',
      url: 'https://www.poi86.com/poi/amap/city/330100.html',
      observedAt: EVIDENCE_RECHECK_DATE,
      status: 'candidate',
      notes: '页面列出 330100 与中心坐标 120.210792, 30.246026；该站不是本项目认可的官方边界发布源，因此仅作交叉核对。'
    },
    {
      id: 'hangzhou-boundary-download',
      kind: 'boundary',
      label: '杭州市边界 GeoJSON 下载索引页',
      url: 'https://www.poi86.com/poi/download_area_geojson/330100.html',
      observedAt: EVIDENCE_RECHECK_DATE,
      status: 'candidate',
      notes: '页面提供边界下载入口但要求验证码，当前未导入项目；边界版本、坐标系与许可仍需单独核定。'
    },
    {
      id: 'hangzhou-osm-boundary',
      kind: 'boundary',
      label: 'OpenStreetMap 杭州市行政边界关系',
      url: 'https://www.openstreetmap.org/relation/3221112',
      observedAt: EVIDENCE_RECHECK_DATE,
      status: 'candidate',
      notes: '通过 Nominatim 获取 relation 3221112 的 WGS84 Polygon 并保存原始响应；数据采用 ODbL 1.0，仍需与可审计行政来源交叉复核后才能把边界标为 approved。'
    },
    {
      id: 'hangzhou-west-lake-unesco',
      kind: 'heritage',
      label: 'UNESCO 杭州西湖文化景观条目',
      url: 'https://whc.unesco.org/en/list/1334/',
      observedAt: EVIDENCE_RECHECK_DATE,
      status: 'confirmed',
      notes: '可确认西湖文化景观的组成、文化语境、2011 年列入世界遗产名录及遗产区面积；只用于事实资料，不直接生成神话文案。'
    },
    {
      id: 'hangzhou-west-lake-night-photo',
      kind: 'media',
      label: 'Wikimedia Commons · Bridge causeway night Xihu Hangzhou',
      url: 'https://commons.wikimedia.org/wiki/File:2014.11.21.193919_Bridge_causeway_night_Xihu_Hangzhou.jpg',
      observedAt: EVIDENCE_RECHECK_DATE,
      status: 'confirmed',
      notes: '文件页记录作者 Hermann Luyken、拍摄日期、原图尺寸与 CC0；已下载并完成本地尺寸与 SHA-256 核对。'
    },
    {
      id: 'hangzhou-west-lake-skyline-photo',
      kind: 'media',
      label: 'Wikimedia Commons · Hangzhou Skyline against the West Lake',
      url: 'https://commons.wikimedia.org/wiki/File:Hangzhou_Skyline_against_the_West_Lake.png',
      observedAt: EVIDENCE_RECHECK_DATE,
      status: 'confirmed',
      notes: '文件页记录作者 Y Chen、拍摄日期、原图尺寸与 CC BY-SA 4.0；已下载并完成本地尺寸与 SHA-256 核对。'
    },
    {
      id: 'hangzhou-three-pools-photo',
      kind: 'media',
      label: 'Wikimedia Commons · Three Pools Mirroring the Moon Xihu Hangzhou',
      url: 'https://commons.wikimedia.org/wiki/File:2014.11.21.110937_Three_Pools_Mirroring_the_Moon_Xihu_Hangzhou.jpg',
      observedAt: EVIDENCE_RECHECK_DATE,
      status: 'confirmed',
      notes: '文件页记录作者 Hermann Luyken、拍摄日期、原图尺寸与 CC0；已下载并完成本地尺寸与 SHA-256 核对。'
    },
    {
      id: 'hangzhou-west-lake-day-photo',
      kind: 'media',
      label: 'Wikimedia Commons · Hangzhou China West Lake',
      url: 'https://commons.wikimedia.org/wiki/File:Hangzhou_China_West_Lake.jpg',
      observedAt: EVIDENCE_RECHECK_DATE,
      status: 'confirmed',
      notes: '文件页记录作者 Circa24、拍摄日期、原图尺寸与 CC BY-SA 4.0；已下载并完成本地尺寸与 SHA-256 核对。'
    }
  ],
  facts: [
    {
      id: 'hangzhou-adcode',
      label: '行政区划代码',
      value: '330100',
      sourceId: 'hangzhou-admin-code',
      status: 'confirmed'
    },
    {
      id: 'hangzhou-center',
      label: '候选城市中心锚点',
      value: '120.210792, 30.246026（经度, 纬度）',
      sourceId: 'hangzhou-admin-center',
      status: 'pending'
    },
    {
      id: 'west-lake-heritage-context',
      label: '真实文化景观语境',
      value: '西湖及三面环绕的山体、堤道、岛屿、亭台、园林与历史景观构成杭州西湖文化景观',
      sourceId: 'hangzhou-west-lake-unesco',
      status: 'confirmed'
    },
    {
      id: 'hangzhou-media-ingest',
      label: '本地高清媒体入库',
      value: '4 张杭州西湖候选图片已完成本地文件、像素和 SHA-256 记录；许可 attribution 已写入证据包',
      sourceId: 'hangzhou-west-lake-night-photo',
      status: 'confirmed'
    },
    {
      id: 'hangzhou-city-copy',
      label: '可运行城市文案与神兽资料',
      value: '唯一目录记录已形成；完整事实与创作文案复核仍保持 pending',
      sourceId: 'hangzhou-west-lake-unesco',
      status: 'pending'
    }
  ],
  boundary: {
    adminCode: '330100',
    center: { lat: 30.246026, lng: 120.210792 },
    sourceId: 'hangzhou-osm-boundary',
    coordinateSystem: 'WGS84',
    importStatus: 'imported',
    status: 'pending',
    blocker: '已导入 OSM relation 3221112 的原始 WGS84 Polygon；仍需与可审计行政来源交叉复核边界版本、法定口径和许可链，暂不能标为 approved。'
  },
  media: [
    {
      id: 'hangzhou-west-lake-night',
      sourceId: 'hangzhou-west-lake-night-photo',
      role: 'hero_candidate',
      locationLabel: '杭州西湖断桥与堤道夜景（按文件标题与图像内容对应）',
      photoDate: '2014-11-21 19:39:19',
      width: 2736,
      height: 1824,
      licenseLabel: 'CC0',
      localAssetPath: '/images/landmarks/hangzhou_0.jpg',
      sha256: '7166CD13E42923C581889BC30ADB0A235EC1FE71C540280CC6BDD1172898A77B',
      attribution: 'Hermann Luyken, 2014-11-21 19:39:19, Wikimedia Commons, CC0',
      metadataStatus: 'confirmed',
      localAssetStatus: 'ingested',
      catalogReadiness: 'approved',
      matchingNote: '与杭州西湖断桥/堤道夜景对应，尺寸高于 1080p；作者、许可、拍摄日期和本地文件校验记录已保存。'
    },
    {
      id: 'hangzhou-west-lake-skyline',
      sourceId: 'hangzhou-west-lake-skyline-photo',
      role: 'gallery_candidate',
      locationLabel: '杭州西湖与城市天际线',
      photoDate: '2019-01-26',
      width: 6000,
      height: 3376,
      licenseLabel: 'CC BY-SA 4.0',
      localAssetPath: '/images/landmarks/hangzhou_1.png',
      sha256: '27A7A92F98BED5455DE361E38302464E1126BC5B8015BD234C4065E3F8393459',
      attribution: 'Y Chen, 2019-01-26, Wikimedia Commons, CC BY-SA 4.0',
      metadataStatus: 'confirmed',
      localAssetStatus: 'ingested',
      catalogReadiness: 'approved',
      matchingNote: '与杭州西湖及其城市天际线对应，尺寸高于 1080p；已记录作者、拍摄日期、许可、本地文件和 SHA-256。'
    },
    {
      id: 'hangzhou-three-pools',
      sourceId: 'hangzhou-three-pools-photo',
      role: 'gallery_candidate',
      locationLabel: '杭州西湖三潭印月',
      photoDate: '2014-11-21 11:09:37',
      width: 2736,
      height: 1824,
      licenseLabel: 'CC0',
      localAssetPath: '/images/landmarks/hangzhou_2.jpg',
      sha256: 'EC3598D0B36E7ABDDC65FDBC95F07174630B3D9189E3B5844FE465857B004E6C',
      attribution: 'Hermann Luyken, 2014-11-21 11:09:37, Wikimedia Commons, CC0',
      metadataStatus: 'confirmed',
      localAssetStatus: 'ingested',
      catalogReadiness: 'approved',
      matchingNote: '与西湖三潭印月对应，尺寸高于 1080p；已记录作者、拍摄日期、许可、本地文件和 SHA-256。'
    },
    {
      id: 'hangzhou-west-lake-day',
      sourceId: 'hangzhou-west-lake-day-photo',
      role: 'gallery_candidate',
      locationLabel: '杭州西湖湖山景观',
      photoDate: '2019-03-20 09:57:07',
      width: 3264,
      height: 2448,
      licenseLabel: 'CC BY-SA 4.0',
      localAssetPath: '/images/landmarks/hangzhou_3.jpg',
      sha256: '0D825C86DFF3BE224D3F017C04D302CD0ACD43651BDFE7028B077FD360A3EC38',
      attribution: 'Circa24, 2019-03-20 09:57:07, Wikimedia Commons, CC BY-SA 4.0',
      metadataStatus: 'confirmed',
      localAssetStatus: 'ingested',
      catalogReadiness: 'approved',
      matchingNote: '与杭州西湖湖山景观对应，尺寸高于 1080p；已记录作者、拍摄日期、许可、本地文件和 SHA-256。'
    }
  ],
  cultureTokens: [
    {
      name: '沧浪',
      hex: '#B1D5C8',
      sourcePath: 'C:/Users/jiojio/Knowledge/cn-culture-atlas/data/colors.json',
      status: 'confirmed'
    },
    {
      name: '天水碧',
      hex: '#87CEEB',
      sourcePath: 'C:/Users/jiojio/Knowledge/cn-culture-atlas/data/colors.json',
      status: 'confirmed'
    },
    {
      name: '竹青',
      hex: '#5B8266',
      sourcePath: 'C:/Users/jiojio/Knowledge/cn-culture-atlas/data/colors.json',
      status: 'confirmed'
    },
    {
      name: '西湖绿',
      hex: '#6A8E23',
      sourcePath: 'C:/Users/jiojio/Knowledge/cn-culture-atlas/data/colors.json',
      status: 'confirmed'
    }
  ],
  catalogReadiness: 'ready_for_catalog',
  notes: '杭州已进入唯一 DestinationItem 目录，边界原始样本已导入，四张高清图片已本地入库；跨源行政边界复核、完整事实/创作资料复核和 Gate2 运行验收仍未完成。'
};

export const GATE2_REGIONAL_EVIDENCE: readonly Gate2RegionalEvidence[] = [
  HANGZHOU_JIANGNAN_EVIDENCE
];

export function getGate2RegionalEvidence(evidenceId: string): Gate2RegionalEvidence | undefined {
  return GATE2_REGIONAL_EVIDENCE.find(evidence => evidence.id === evidenceId);
}

export function getGate2EvidenceForSample(sampleId: string): Gate2RegionalEvidence | undefined {
  return GATE2_REGIONAL_EVIDENCE.find(evidence => evidence.sampleId === sampleId);
}

export function isGate2RegionalEvidenceReady(evidence: Gate2RegionalEvidence): boolean {
  return evidence.catalogReadiness === 'ready_for_catalog'
    && evidence.boundary.status === 'approved'
    && evidence.boundary.importStatus === 'imported'
    && evidence.media.length > 0
    && evidence.media.every(media => media.catalogReadiness === 'approved');
}
