import { DestinationItem } from '../types';
import { PanelFxEngine } from '../webgl/PanelFxEngine';
import { SoundEngine } from '../core/SoundEngine';
import { getBeastSvgIcon } from './MythicBeastIcons';
import {
  CalligraphyWriteTarget,
  ThreeDCalligraphyBrushEngine
} from './ThreeDCalligraphyBrushEngine';

export interface ScrollDrawerCallbacks {
  onEnterScenic: (dest: DestinationItem) => void;
  onSummonBeast: (dest: DestinationItem) => void;
  onStampCity: (cityId: string) => void;
  onClose?: () => void;
}

export class DestinationScrollDrawer {
  private element: HTMLElement;
  private currentDest: DestinationItem;
  private isStamped: boolean = false;
  private callbacks: ScrollDrawerCallbacks;
  private fxEngine!: PanelFxEngine;
  private sound: SoundEngine;
  private activeTab: 'geo' | 'poem' | 'beast' | 'history' = 'geo';
  private isOpen: boolean = false;
  private threeBrushEngine: ThreeDCalligraphyBrushEngine | null = null;
  private calligraphyRunToken = 0;



  constructor(initialDest: DestinationItem, callbacks: ScrollDrawerCallbacks) {
    this.currentDest = initialDest;
    this.callbacks = callbacks;
    this.sound = SoundEngine.getInstance();

    this.element = document.createElement('aside');
    this.element.id = 'destination-hanging-scroll';
    this.element.className = 'scholar-scroll-drawer-root theme-xuanhe-black';

    this.initDOM();
    this.initWebGLFx();
    this.bindEvents();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  private formatSolarTerm(solarTerm: string): { top: string; bot: string } {
    const raw = solarTerm.split(' · ')[0] || solarTerm;
    const chars = Array.from(raw);
    return {
      top: chars[0] || '节',
      bot: chars[1] || '气'
    };
  }

  private formatCleanLocation(cityName: string, modernName: string): string {
    let cleanMod = modernName;
    const shortCity = cityName.replace(/市$/, '');
    if (cleanMod.startsWith(shortCity + ' · ')) {
      cleanMod = cleanMod.substring(shortCity.length + 3);
    } else if (cleanMod.startsWith(cityName + ' · ')) {
      cleanMod = cleanMod.substring(cityName.length + 3);
    }
    return `${cityName} · ${cleanMod}`;
  }

  private renderSealGridHTML(script: string): string {
    const chars = Array.from(script || '山海御印');
    const c0 = chars[0] || '山';
    const c1 = chars[1] || '海';
    const c2 = chars[2] || '御';
    const c3 = chars[3] || '印';

    // 汉印九叠四字方玺标准排版 (右列: 0右上、1右下; 左列: 2左上、3左下)
    return `
      <div class="seal-2x2-grid">
        <div class="seal-col right-col">
          <span class="seal-char-glyph">${c0}</span>
          <span class="seal-char-glyph">${c1}</span>
        </div>
        <div class="seal-col left-col">
          <span class="seal-char-glyph">${c2}</span>
          <span class="seal-char-glyph">${c3}</span>
        </div>
      </div>
    `;
  }

  private formatElementChinese(element: string): string {
    const map: Record<string, string> = {
      gold: '金',
      wood: '木',
      water: '水',
      fire: '火',
      earth: '土'
    };
    return map[element] || '灵';
  }

  private initDOM() {
    const solar = this.formatSolarTerm(this.currentDest.solarTerm);
    const sealGridHTML = this.renderSealGridHTML(this.currentDest.seal.sealScript);
    const cleanLocation = this.formatCleanLocation(this.currentDest.cityName, this.currentDest.modernName);
    const elementCn = this.formatElementChinese(this.currentDest.element);

    this.element.innerHTML = `
      <!-- 1. 卷轴右侧斜悬羊脂白玉镇纸与朱砂真丝流苏 (Right-Edge Asymmetric Jade Tassel) -->
      <div class="scroll-hanging-tassel-cluster" id="scroll-tassel-anchor">
        <div class="tassel-jade-ring">
          <div class="jade-core"></div>
          <div class="gold-rim"></div>
        </div>
        <div class="tassel-silk-knot"></div>
        <div class="tassel-cinnabar-fringes">
          <span class="fringe-strand strand-1"></span>
          <span class="fringe-strand strand-2"></span>
          <span class="fringe-strand strand-3"></span>
        </div>
      </div>

      <!-- 2. 主体错落手卷容器 (Main Asymmetric Scroll Body) -->
      <div class="scholar-scroll-inner" id="scholar-scroll-inner">
        <!-- 顶栏：大宋宣和御府金标与状态指示 (Top Utility Bar) -->
        <div class="scroll-top-utility-bar">
          <div class="scroll-imperial-crest-tag">
            <span class="crest-gold-icon">📜</span>
            <span class="crest-gold-title">宣和御府 · 泥金宝卷</span>
            <span class="crest-spark-dot">✦</span>
          </div>

          <div class="scroll-seal-status-tag ${this.isStamped ? 'stamped' : 'unstamped'}" id="scroll-top-seal-indicator">
            <span class="status-dot"></span>
            <span class="status-text">${this.isStamped ? '已钤御印 · 入山海志' : '待巡礼 · 留存金印'}</span>
          </div>

          <button class="scroll-close-talisman-btn" id="scroll-drawer-close-btn" title="收起手卷 · 观照大千">
            <span class="close-icon">✕</span>
          </button>
        </div>

        <!-- 卷首：非对称题额大标题 (Asymmetric Title Header) -->
        <header class="scroll-header-cluster">
          <!-- 节气朱砂方印 (精致双字印规，永不爆出界限) -->
          <div class="header-solar-cinnabar-seal" id="scroll-solar-seal">
            <div class="solar-seal-inner-box">
              <span class="solar-char-top">${solar.top}</span>
              <span class="solar-char-bot">${solar.bot}</span>
            </div>
          </div>

          <div class="header-titles-pack">
            <div class="header-ancient-banner">
              <h2 class="ancient-script-title" id="scroll-ancient-title">${this.currentDest.ancientMythicName}</h2>
              <span class="ancient-glow-accent">✦</span>
            </div>
            <div class="header-modern-sub" id="scroll-modern-sub">
              <div class="sub-location-box" id="scroll-location-marquee-box">
                <span class="sub-city-pin">📍</span>
                <div class="marquee-viewport" id="scroll-marquee-viewport">
                  <span class="sub-city-name marquee-track" id="scroll-modern-city-name">${cleanLocation}</span>
                </div>
              </div>
              <span class="sub-region-pill element-${this.currentDest.element}" id="scroll-modern-region">${this.currentDest.region.label}</span>
            </div>
          </div>
        </header>

        <!-- 卷心：宋画绢帛手卷风光实景 (Framed Scenic Album Viewport) -->
        <div class="scroll-scenic-album-viewport">
          <div class="album-silk-matting">
            <img src="${this.currentDest.heroImage}" alt="${this.currentDest.modernName}" class="gallery-album-img" id="scroll-gallery-img" />
            <div class="album-silk-vignette"></div>
            <div class="album-corner-flourish top-left"></div>
            <div class="album-corner-flourish top-right"></div>
            <div class="album-corner-flourish bottom-left"></div>
            <div class="album-corner-flourish bottom-right"></div>
            
            <div class="album-floating-caption">
              <span class="caption-icon">📷</span>
              <span class="caption-desc" id="scroll-gallery-caption">${this.currentDest.heroImageCaption || this.currentDest.modernName}</span>
            </div>
          </div>
        </div>

        <!-- 卷腰：错落经折四大章回古卷 (Staggered 4-Accordion Chapters) -->
        <div class="scroll-chapter-tabs-deck">
          <button class="chapter-tab-pill ${this.activeTab === 'geo' ? 'active' : ''}" data-tab="geo">
            <span class="tab-glyph">⛰️</span>
            <span class="tab-text">坤舆地纪</span>
          </button>
          <button class="chapter-tab-pill ${this.activeTab === 'poem' ? 'active' : ''}" data-tab="poem">
            <span class="tab-glyph">📜</span>
            <span class="tab-text">仙咏集</span>
          </button>
          <button class="chapter-tab-pill ${this.activeTab === 'beast' ? 'active' : ''}" data-tab="beast">
            <span class="tab-glyph">🐉</span>
            <span class="tab-text">镇境山尊</span>
          </button>
          <button class="chapter-tab-pill ${this.activeTab === 'history' ? 'active' : ''}" data-tab="history">
            <span class="tab-glyph">🏛️</span>
            <span class="tab-text">人文志</span>
          </button>
        </div>

        <!-- 卷腹：动态章回详情视窗 (Accordion Chapter Content Views) -->
        <div class="scroll-chapter-content-body" id="scroll-chapter-body">
          <!-- 1. 坤舆地纪 (宣和山川分野图谱 · 零滑动沉浸阅读) -->
          <div class="chapter-pane ${this.activeTab === 'geo' ? 'active' : ''}" id="pane-geo">
            <article class="geo-atlas-scroll">
              <header class="geo-folio-heading">
                <div class="geo-folio-heading-copy">
                  <span class="geo-folio-kicker">坤舆地纪</span>
                  <span class="geo-folio-subtitle">山川天机分野</span>
                </div>
                <div class="geo-astrolabe-pills">
                  <span class="geo-pill coords-pill" id="pane-geo-coords">✨ E ${this.currentDest.coordinates.lng.toFixed(2)}° · N ${this.currentDest.coordinates.lat.toFixed(2)}°</span>
                </div>
              </header>

              <div class="geo-folio-rule" aria-hidden="true"><span></span></div>

              <div class="geo-folio-body">
                <div class="geo-season-strip">
                  <span class="geo-season-icon">📅</span>
                  <span class="geo-season-text" id="pane-geo-season">${this.currentDest.bestSeason}</span>
                </div>
                <div class="geo-lore-content">
                  <p class="geo-lore-text" id="pane-geo-lore">${this.currentDest.mythicLore}</p>
                </div>
              </div>

              <footer class="geo-colophon-inline">
                <div class="geo-geology-meta">
                  <span class="geo-rock-icon">💎</span>
                  <span class="geo-rock-desc" id="pane-geo-geology">${this.currentDest.geologyType || '区域典型地貌'}</span>
                </div>
                <div class="geo-seal-tag">宣和地志</div>
              </footer>
            </article>
          </div>

          <!-- 2. 仙咏集：真正的 3D 毛笔从首字落笔，逐字写至全诗收锋 -->
          <div class="chapter-pane ${this.activeTab === 'poem' ? 'active' : ''}" id="pane-poem">
            <article class="poem-calligraphy-scroll" id="pane-poem-lines" aria-labelledby="poem-section-title">
              <header class="poem-folio-heading">
                <div class="poem-folio-heading-copy">
                  <span class="poem-folio-kicker" id="poem-section-title">仙咏集</span>
                  <span class="poem-folio-subtitle">山海题咏</span>
                </div>
                <span class="poem-folio-index-group">
                  <span class="poem-folio-index" aria-label="诗笺序号">其一</span>
                  <span class="poem-writing-state" id="poem-writing-state" aria-live="polite">待落笔</span>
                </span>
              </header>

              <div class="poem-folio-rule" aria-hidden="true"><span></span></div>

              <div class="poem-folio-body">
                <span class="poem-reading-rail" aria-hidden="true"><span></span></span>
                <div class="poem-horizontal-verses" id="poem-verses" aria-live="polite" aria-label="${this.currentDest.mythicPoem.replace(/\s*\n\s*/g, '。')}">
                  ${this.renderCalligraphyPoemHTML(this.currentDest.mythicPoem)}
                </div>
              </div>

              <!-- 落款保留城市归属、朱砂闲章和唯一的起笔/重写入口 -->
              <div class="poem-colophon-inline" id="poem-colophon-row">
                <div class="poem-colophon-copy">
                  <span class="poem-source" id="poem-source">山海题咏 · ${this.currentDest.cityName}</span>
                  <span class="poem-source-note">一境一咏</span>
                </div>
                <div class="colophon-cinnabar-seal" id="colophon-cinnabar-seal" aria-hidden="true">
                  <span class="seal-char-2x2">仙咏</span>
                </div>
                <button class="poem-replay-button" id="poem-replay-button" type="button" aria-label="从第一个字开始书写当前诗句">
                  <span>点墨起笔</span>
                  <span class="poem-replay-glyph" aria-hidden="true">↗</span>
                </button>
              </div>

              <div class="poem-page-mark" aria-hidden="true">
                <span>壹</span>
                <i></i>
                <span>诗笺</span>
              </div>
            </article>
          </div>

          <!-- 3. 镇境山尊 (山海灵尊御制宝箓 · 五行命格色盘) -->
          <div class="chapter-pane ${this.activeTab === 'beast' ? 'active' : ''}" id="pane-beast">
            <article class="beast-dossier-scroll" id="pane-beast-card" data-element="${this.currentDest.element}">
              <header class="beast-dossier-heading">
                <div class="beast-heading-left">
                  <div class="beast-totem-avatar">
                    <span class="beast-totem-glyph" id="pane-beast-icon">${getBeastSvgIcon(this.currentDest.guardian.name, '#FFD700', 32)}</span>
                    <span class="beast-element-badge" id="pane-beast-element">${elementCn}</span>
                  </div>
                  <div class="beast-title-group">
                    <span class="beast-hero-name" id="pane-beast-name">${this.currentDest.guardian.name}</span>
                    <span class="beast-hero-title" id="pane-beast-title">${this.currentDest.guardian.title}</span>
                  </div>
                </div>
                <div class="beast-talisman-mark">
                  <span class="beast-talisman-tag">镇境灵尊</span>
                </div>
              </header>

              <div class="beast-dossier-rule" aria-hidden="true"><span></span></div>

              <div class="beast-dossier-body">
                <div class="beast-domain-row">
                  <span class="domain-label">⚡ 司掌神权：</span>
                  <span class="domain-val" id="pane-beast-power">${this.currentDest.guardian.domainPower}</span>
                </div>
                <div class="beast-quote-wrapper">
                  <p class="beast-desc-text" id="pane-beast-desc">${this.currentDest.guardian.classicQuote}</p>
                </div>
              </div>

              <footer class="beast-dossier-footer">
                <span class="beast-colophon-source">山海图志 · 镇岳灵尊传</span>
                <span class="beast-seal-tag">灵尊符命</span>
              </footer>
            </article>
          </div>

          <!-- 4. 人文志 (古籍方志朱批玉牒 · 千年文脉) -->
          <div class="chapter-pane ${this.activeTab === 'history' ? 'active' : ''}" id="pane-history">
            <article class="history-chronicle-scroll">
              <header class="history-folio-heading">
                <div class="history-heading-copy">
                  <span class="history-folio-kicker">人文志</span>
                  <span class="history-folio-subtitle">千年方志文脉</span>
                </div>
                <div class="history-seal-mark" aria-hidden="true">
                  <span class="history-seal-char">方志</span>
                </div>
              </header>

              <div class="history-folio-rule" aria-hidden="true"><span></span></div>

              <div class="history-folio-body">
                <div class="history-era-strip">
                  <span class="history-era-icon">🏛️</span>
                  <span class="history-era-text" id="pane-history-meta">方志沿革 · ${this.currentDest.cityName}（${this.currentDest.landscapeTag || '名胜古邑'}）</span>
                </div>
                <div class="history-lore-content">
                  <p class="history-content-text" id="pane-history-text">${this.currentDest.realHistory}</p>
                </div>
              </div>

              <footer class="history-colophon-inline">
                <span class="history-source-note" id="pane-history-source">史官校勘 · ${this.currentDest.region.label}史乘</span>
                <span class="history-vol-tag">卷之首</span>
              </footer>
            </article>
          </div>
        </div>

        <!-- 卷底：斜倚 3° 经典 2×2 朱砂方玺印鉴与三大仙令金符 (2x2 Cinnabar Seal & Action Talismans) -->
        <footer class="scroll-footer-action-deck">
          <!-- 经典 2×2 汉印九叠朱砂方玺 -->
          <div class="scroll-seal-stamp-pod">
            <div class="cinnabar-square-seal ${this.isStamped ? 'stamped' : ''}" id="scroll-seal-stamp-box" title="点击覆印 · 留存山海印鉴">
              <div class="seal-inner-bordered-stage" id="scroll-seal-grid-mount">
                ${sealGridHTML}
              </div>
              <div class="seal-status-caption">
                <span class="seal-stamp-label">${this.isStamped ? '已钤朱砂' : '点击钤印'}</span>
              </div>
            </div>
          </div>

          <!-- 三大御制仙令法宝金符 -->
          <div class="scroll-talisman-actions-grid">
            <button class="talisman-pill-btn btn-scenic" id="scroll-btn-scenic" title="步入沉浸画卷 · 欣赏真实全景大图">
              <div class="talisman-corner c-tl"></div>
              <div class="talisman-corner c-tr"></div>
              <div class="talisman-corner c-bl"></div>
              <div class="talisman-corner c-br"></div>
              <div class="talisman-icon-aura">🌌</div>
              <div class="talisman-meta-wrap">
                <span class="talisman-btn-name">沉浸画卷</span>
                <span class="talisman-btn-sub">全景极境</span>
              </div>
            </button>

            <button class="talisman-pill-btn btn-beast" id="scroll-btn-beast" title="召来神兽真身 · 3D 全息互动">
              <div class="talisman-corner c-tl"></div>
              <div class="talisman-corner c-tr"></div>
              <div class="talisman-corner c-bl"></div>
              <div class="talisman-corner c-br"></div>
              <div class="talisman-icon-aura" id="scroll-beast-btn-icon">${getBeastSvgIcon(this.currentDest.guardian.name, '#FFD700', 20)}</div>
              <div class="talisman-meta-wrap">
                <span class="talisman-btn-name">召山尊</span>
                <span class="talisman-btn-sub">3D真身</span>
              </div>
            </button>

            <button class="talisman-pill-btn btn-stamp ${this.isStamped ? 'stamped' : ''}" id="scroll-btn-stamp" title="钤印此境 · 盖上山海宝印">
              <div class="talisman-corner c-tl"></div>
              <div class="talisman-corner c-tr"></div>
              <div class="talisman-corner c-bl"></div>
              <div class="talisman-corner c-br"></div>
              <div class="talisman-icon-aura">💮</div>
              <div class="talisman-meta-wrap">
                <span class="talisman-btn-name" id="scroll-btn-stamp-text">${this.isStamped ? '已钤印' : '钤印录'}</span>
                <span class="talisman-btn-sub" id="scroll-btn-stamp-sub">${this.isStamped ? '已入册' : '金石钤印'}</span>
              </div>
            </button>
          </div>
        </footer>
      </div>
    `;
  }

  private initWebGLFx() {
    this.fxEngine = new PanelFxEngine(this.element);
    const poemContainer = this.element.querySelector<HTMLElement>('#pane-poem-lines');
    if (poemContainer) {
      try {
        this.threeBrushEngine = new ThreeDCalligraphyBrushEngine(poemContainer);
      } catch (error) {
        // WebGL 不可用时仍保留完整 DOM 诗句，避免整个详情抽屉因增强层失败而不可读。
        this.threeBrushEngine = null;
        console.warn('[MythicAtlas] 3D 书写增强不可用，将回退到静态可读诗笺。', error);
      }
    }
  }


  private bindEvents() {
    // 1. 关闭按钮
    this.element.querySelector('#scroll-drawer-close-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playTap();
      this.close();
      if (this.callbacks.onClose) this.callbacks.onClose();
    });

    // 2. 经折四大章回 Tab 切换
    this.element.querySelectorAll('.chapter-tab-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tab = btn.getAttribute('data-tab') as any;
        if (tab) {
          this.sound.playParchment();
          this.switchTab(tab);
          // 在 Tab 位置激发金屑粒子
          const rect = btn.getBoundingClientRect();
          const pRect = this.element.getBoundingClientRect();
          const xNorm = (rect.left + rect.width * 0.5 - pRect.left) / pRect.width;
          const yNorm = (rect.top + rect.height * 0.5 - pRect.top) / pRect.height;
          this.fxEngine.triggerSparkBurst(xNorm, yNorm, 35, false);
        }
      });
    });

    // 3. 倾斜朱砂大方玺点击盖印
    const sealBox = this.element.querySelector('#scroll-seal-stamp-box');
    sealBox?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleStampTrigger(sealBox as HTMLElement);
    });

    // 3. 诗句只有一个明确的起笔/重写入口，避免正文区域变成隐形按钮
    this.element.querySelector('#poem-replay-button')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playTap();
      this.playCalligraphyAnimation();
    });

    // 3.5. 点击绢帛风光视口直接跃迁入沉浸实景
    this.element.querySelector('.scroll-scenic-album-viewport')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playTap();
      this.callbacks.onEnterScenic(this.currentDest);
    });

    // 4. 三大金符按钮
    this.element.querySelector('#scroll-btn-scenic')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playTap();
      this.callbacks.onEnterScenic(this.currentDest);
    });

    this.element.querySelector('#scroll-btn-beast')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playBronzeBell();
      this.callbacks.onSummonBeast(this.currentDest);
    });

    this.element.querySelector('#scroll-btn-stamp')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = this.element.querySelector('#scroll-btn-stamp') as HTMLElement;
      if (btn) this.handleStampTrigger(btn);
    });

    // 5. 阻止手卷及其子元素内部滚轮事件冒泡，保障名片内容平滑纵向滚动，绝不触发背景 3D 地球缩放
    this.element.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });

  }


  private handleStampTrigger(triggerEl: HTMLElement) {
    this.sound.playStampHit();
    this.callbacks.onStampCity(this.currentDest.id);
    this.setStamped(true);

    // 物理粒子爆破特效
    const rect = triggerEl.getBoundingClientRect();
    const pRect = this.element.getBoundingClientRect();
    const xNorm = (rect.left + rect.width * 0.5 - pRect.left) / pRect.width;
    const yNorm = (rect.top + rect.height * 0.5 - pRect.top) / pRect.height;
    this.fxEngine.triggerSparkBurst(xNorm, yNorm, 70, true);

    // 印章震颤反馈
    triggerEl.classList.add('stamp-impact-shake');
    setTimeout(() => triggerEl.classList.remove('stamp-impact-shake'), 450);
  }

  public switchTab(tab: 'geo' | 'poem' | 'beast' | 'history') {
    this.activeTab = tab;
    this.element.querySelectorAll('.chapter-tab-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    this.element.querySelectorAll('.chapter-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane-${tab}`);
    });

    // 进入仙咏集时从首字落笔；离开时立即取消未完成书写
    if (tab === 'poem') {
      this.playCalligraphyAnimation();
    } else {
      this.stopCalligraphyAnimation();
    }
  }

  private stopCalligraphyAnimation() {
    this.calligraphyRunToken += 1;
    this.threeBrushEngine?.cancel();
    const container = this.element.querySelector<HTMLElement>('#pane-poem-lines');
    container?.classList.remove('is-writing', 'is-complete');
  }

  /**
   * 3D 书写唯一入口：从第一个字符开始，逐字完成整首诗句。
   *
   * ThreeDCalligraphyBrushEngine 独占笔体、墨迹、逐帧循环和时间轴；这里仅把
   * DOM 字符测量成目标框，并把引擎的“起笔/行笔/收笔”状态同步到可读文字。
   */
  public playCalligraphyAnimation() {
    const container = this.element.querySelector<HTMLElement>('#pane-poem-lines');
    const charNodes = Array.from(this.element.querySelectorAll<HTMLElement>('.poem-char'));
    const seal = this.element.querySelector<HTMLElement>('#colophon-cinnabar-seal');
    const colophonRow = this.element.querySelector<HTMLElement>('#poem-colophon-row');
    const readingRail = this.element.querySelector<HTMLElement>('.poem-reading-rail span');
    const writingState = this.element.querySelector<HTMLElement>('#poem-writing-state');

    if (!container || charNodes.length === 0) return;

    this.stopCalligraphyAnimation();
    const runToken = this.calligraphyRunToken;

    const resetDomState = () => {
      container.classList.remove('is-writing', 'is-complete');
      charNodes.forEach((node) => {
        node.classList.remove('is-inking', 'is-written');
        node.style.setProperty('--ink-progress', '0');
        node.style.setProperty('--ink-reveal', '100%');
        node.style.setProperty('--ink-opacity', '0');
      });
      if (readingRail) readingRail.style.transform = 'scaleY(0)';
      if (colophonRow) colophonRow.classList.remove('is-visible');
      if (seal) seal.classList.remove('is-visible');
      if (writingState) writingState.textContent = '待落笔';
    };

    const setReadable = () => {
      container.classList.add('is-complete');
      charNodes.forEach((node) => {
        node.classList.remove('is-inking');
        node.classList.add('is-written');
        node.style.setProperty('--ink-progress', '1');
        node.style.setProperty('--ink-reveal', '0%');
        node.style.setProperty('--ink-opacity', '1');
      });
      if (readingRail) readingRail.style.transform = 'scaleY(1)';
      if (colophonRow) colophonRow.classList.add('is-visible');
      if (seal) seal.classList.add('is-visible');
      if (writingState) writingState.textContent = '一首既成';
    };

    resetDomState();

    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || !this.threeBrushEngine) {
      setReadable();
      return;
    }

    container.classList.add('is-writing');
    this.sound.playParchment();

    // 切入 Tab 后下一帧再测量，确保隐藏 Pane 已完成布局，避免笔尖偏离文字。
    requestAnimationFrame(() => {
      if (runToken !== this.calligraphyRunToken || !this.isOpen || this.activeTab !== 'poem') return;

      this.threeBrushEngine?.resize();
      const containerRect = container.getBoundingClientRect();
      const targets: CalligraphyWriteTarget[] = charNodes.map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          element,
          char: element.dataset.char || element.textContent?.trim() || '',
          index,
          lineIndex: Number(element.closest<HTMLElement>('[data-line]')?.dataset.line || 0),
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height
        };
      }).filter((target) => target.width > 0 && target.height > 0 && target.char.length > 0);

      this.threeBrushEngine?.playWriting(targets, {
        onCharacterStart: (target, index, total) => {
          if (runToken !== this.calligraphyRunToken) return;
          target.element.classList.add('is-inking');
          target.element.classList.remove('is-written');
          target.element.style.setProperty('--ink-progress', '0');
          target.element.style.setProperty('--ink-reveal', '100%');
          target.element.style.setProperty('--ink-opacity', '0.18');
          if (readingRail) readingRail.style.transform = `scaleY(${Math.min(1, (index + 1) / total)})`;
          if (writingState) writingState.textContent = `落笔 ${index + 1} / ${total}`;
        },
        onCharacterProgress: (target, progress) => {
          if (runToken !== this.calligraphyRunToken) return;
          target.element.style.setProperty('--ink-progress', progress.toFixed(3));
          target.element.style.setProperty('--ink-reveal', `${((1 - progress) * 100).toFixed(2)}%`);
          target.element.style.setProperty('--ink-opacity', (0.18 + progress * 0.82).toFixed(3));
        },
        onCharacterComplete: (target) => {
          if (runToken !== this.calligraphyRunToken) return;
          target.element.classList.remove('is-inking');
          target.element.classList.add('is-written');
          target.element.style.setProperty('--ink-progress', '1');
          target.element.style.setProperty('--ink-reveal', '0%');
          target.element.style.setProperty('--ink-opacity', '1');
        },
        onComplete: () => {
          if (runToken !== this.calligraphyRunToken) return;
          setReadable();
        }
      }, {
        // 两行诗句书写节奏：字间提按换位，跨行停顿换气，整体自然行云流水。
        introDuration: 420,
        charDuration: 280,
        interCharPause: 56,
        linePause: 240
      });
    });
  }






  /**
   * 将数据中的诗句拆成行与字节点：字稿层先留在纸上，墨色层等待 3D 笔锋逐字唤醒。
   */
  private renderCalligraphyPoemHTML(poemText: string): string {
    if (!poemText) return '';
    const rawLines = poemText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    let totalCharIdx = 0;

    return rawLines.map((line, lineIdx) => {
      const charSpans = Array.from(line).map((ch) => {
        const idx = totalCharIdx++;
        const safeChar = ch.replace(/[&<>"']/g, (match) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[match] || match));
        return `<span class="poem-char" style="--char-index: ${idx};" data-char="${safeChar}" aria-hidden="true">
          <span class="char-ink-guide" aria-hidden="true">${safeChar}</span>
          <span class="char-ink-mask" aria-hidden="true">${safeChar}</span>
        </span>`;
      }).join('');

      return `<p class="poem-verse-line" data-line="${lineIdx}" aria-hidden="true">${charSpans}</p>`;
    }).join('');
  }






  public open(dest: DestinationItem, isStamped = false) {
    this.currentDest = dest;
    this.isStamped = isStamped;
    this.isOpen = true;
    this.updateContent();

    this.element.classList.add('active');
    this.fxEngine.start();

    // 播放舒展手卷音效
    this.sound.playParchment();

    // 入场激发微量金色水墨粒子
    setTimeout(() => {
      this.fxEngine.triggerSparkBurst(0.5, 0.35, 40, false);
    }, 180);
  }

  public close() {
    this.isOpen = false;
    this.stopCalligraphyAnimation();
    this.element.classList.remove('active');
    this.fxEngine.stop();
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public updateDestination(dest: DestinationItem, isStamped = false) {
    this.currentDest = dest;
    this.isStamped = isStamped;
    this.updateContent();
  }

  public setStamped(stamped: boolean) {
    this.isStamped = stamped;
    const topIndicator = this.element.querySelector('#scroll-top-seal-indicator');
    const sealBox = this.element.querySelector('#scroll-seal-stamp-box');
    const stampBtn = this.element.querySelector('#scroll-btn-stamp');
    const stampBtnText = this.element.querySelector('#scroll-btn-stamp-text');
    const stampBtnSub = this.element.querySelector('#scroll-btn-stamp-sub');

    if (topIndicator) {
      topIndicator.className = `scroll-seal-status-tag ${stamped ? 'stamped' : 'unstamped'}`;
      topIndicator.innerHTML = `
        <span class="status-dot"></span>
        <span class="status-text">${stamped ? '已钤御印 · 入山海志' : '待巡礼 · 留存金印'}</span>
      `;
    }
    if (sealBox) sealBox.classList.toggle('stamped', stamped);
    if (stampBtn) stampBtn.classList.toggle('stamped', stamped);
    if (stampBtnText) stampBtnText.textContent = stamped ? '已钤印' : '钤印录';
    if (stampBtnSub) stampBtnSub.textContent = stamped ? '已入册' : '金石钤印';
  }

  private updateContent() {
    const d = this.currentDest;

    // 1. Header & Solar Term Seal
    const solarSeal = this.element.querySelector('#scroll-solar-seal');
    const ancientTitle = this.element.querySelector('#scroll-ancient-title');
    const modernCityName = this.element.querySelector('#scroll-modern-city-name');
    const modernRegion = this.element.querySelector('#scroll-modern-region');

    if (solarSeal) {
      const solar = this.formatSolarTerm(d.solarTerm);
      solarSeal.innerHTML = `
        <div class="solar-seal-inner-box">
          <span class="solar-char-top">${solar.top}</span>
          <span class="solar-char-bot">${solar.bot}</span>
        </div>
      `;
    }
    if (ancientTitle) ancientTitle.textContent = d.ancientMythicName;
    if (modernCityName) modernCityName.textContent = this.formatCleanLocation(d.cityName, d.modernName);
    if (modernRegion) {
      modernRegion.textContent = d.region.label;
      modernRegion.className = `sub-region-pill element-${d.element}`;
    }

    // 2. Scenic Photo
    const galleryImg = this.element.querySelector('#scroll-gallery-img') as HTMLImageElement;
    const galleryCaption = this.element.querySelector('#scroll-gallery-caption');
    if (galleryImg) {
      galleryImg.src = d.heroImage;
      galleryImg.alt = d.modernName;
    }
    if (galleryCaption) galleryCaption.textContent = d.heroImageCaption || `${d.modernName} 主胜景`;

    // 3. Pane 1: Geo (Dynamically updates exact coordinates, season & geology!)
    const geoSeason = this.element.querySelector('#pane-geo-season');
    const geoCoords = this.element.querySelector('#pane-geo-coords');
    const geoLore = this.element.querySelector('#pane-geo-lore');
    const geoGeology = this.element.querySelector('#pane-geo-geology');
    if (geoSeason) geoSeason.textContent = d.bestSeason;
    if (geoCoords) geoCoords.textContent = `✨ E ${d.coordinates.lng.toFixed(2)}° · N ${d.coordinates.lat.toFixed(2)}°`;
    if (geoLore) geoLore.textContent = d.mythicLore;
    if (geoGeology) geoGeology.textContent = d.geologyType || '区域典型地貌';

    // 4. Pane 2: Poem
    const poemVerses = this.element.querySelector<HTMLElement>('#poem-verses');
    const poemSource = this.element.querySelector<HTMLElement>('#poem-source');
    if (poemSource) poemSource.textContent = `山海题咏 · ${d.cityName}`;
    if (poemVerses) {
      this.stopCalligraphyAnimation();
      poemVerses.innerHTML = this.renderCalligraphyPoemHTML(d.mythicPoem);
      poemVerses.setAttribute('aria-label', d.mythicPoem.replace(/\s*\n\s*/g, '。'));
      if (this.activeTab === 'poem' && this.isOpen) {
        requestAnimationFrame(() => {
          if (this.activeTab === 'poem' && this.isOpen) this.playCalligraphyAnimation();
        });
      }
    }

    // 5. Pane 3: Beast (Dynamically updates 5-element totem and domain power!)
    const beastCard = this.element.querySelector('#pane-beast-card');
    const beastIcon = this.element.querySelector('#pane-beast-icon');
    const beastName = this.element.querySelector('#pane-beast-name');
    const beastTitle = this.element.querySelector('#pane-beast-title');
    const beastElement = this.element.querySelector('#pane-beast-element');
    const beastPower = this.element.querySelector('#pane-beast-power');
    const beastDesc = this.element.querySelector('#pane-beast-desc');
    const beastBtnIcon = this.element.querySelector('#scroll-beast-btn-icon');
    if (beastCard) beastCard.setAttribute('data-element', d.element);
    if (beastIcon) beastIcon.innerHTML = getBeastSvgIcon(d.guardian.name, '#FFD700', 32);
    if (beastName) beastName.textContent = d.guardian.name;
    if (beastTitle) beastTitle.textContent = d.guardian.title;
    if (beastElement) beastElement.textContent = this.formatElementChinese(d.element);
    if (beastPower) beastPower.textContent = d.guardian.domainPower;
    if (beastDesc) beastDesc.textContent = d.guardian.classicQuote;
    if (beastBtnIcon) beastBtnIcon.innerHTML = getBeastSvgIcon(d.guardian.name, '#FFD700', 20);

    // 6. Pane 4: History
    const historyMeta = this.element.querySelector('#pane-history-meta');
    const historyText = this.element.querySelector('#pane-history-text');
    const historySource = this.element.querySelector('#pane-history-source');
    if (historyMeta) historyMeta.textContent = `方志沿革 · ${d.cityName}（${d.landscapeTag || '名胜古邑'}）`;
    if (historyText) historyText.textContent = d.realHistory;
    if (historySource) historySource.textContent = `史官校勘 · ${d.region.label}史乘`;

    // 7. Footer 4-Character Imperial Seal (2x2 Grid)
    const sealGrid = this.element.querySelector('#scroll-seal-grid-mount');
    if (sealGrid) {
      sealGrid.innerHTML = this.renderSealGridHTML(d.seal.sealScript);
    }

    this.setStamped(this.isStamped);

    // 8. 启动地名横向平滑跑马灯（永不出现省略号，支持超长地名舒展轮播）
    this.checkAndStartMarquee();
  }

  private checkAndStartMarquee() {
    const viewport = this.element.querySelector('#scroll-marquee-viewport') as HTMLElement | null;
    const track = this.element.querySelector('#scroll-modern-city-name') as HTMLElement | null;
    if (!viewport || !track) return;

    // 清除旧有样式与动画
    track.classList.remove('is-scrolling');
    track.style.removeProperty('--marquee-dist');
    track.style.removeProperty('--marquee-duration');
    viewport.classList.remove('has-overflow');

    // 延时下一帧精确计算 DOM 尺寸
    requestAnimationFrame(() => {
      const vWidth = viewport.clientWidth;
      const tWidth = track.scrollWidth;

      if (tWidth > vWidth + 2) {
        const overflow = Math.ceil(tWidth - vWidth + 16);
        const duration = Math.max(5, overflow / 15); // 平缓可读的滑行速率
        track.style.setProperty('--marquee-dist', `${overflow}px`);
        track.style.setProperty('--marquee-duration', `${duration}s`);
        track.classList.add('is-scrolling');
        viewport.classList.add('has-overflow');
      }
    });
  }
}
