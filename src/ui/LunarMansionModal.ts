import { LunarMansionItem } from '../data/lunarMansions';
import { DESTINATIONS_DATA } from '../data/destinations';

/**
 * 东方星象秘卷 · 二十八星宿神话图鉴与天官弹窗 (Lunar Mansion Ancient Scroll Modal)
 * 具备星宿图腾、四象归属、七曜五行、古天象地理分野、山海神话故事，以及【召唤对应神兽】与【巡礼关联地邑】跳转功能。
 */
export class LunarMansionModal {
  private element: HTMLElement;
  private currentMansion: LunarMansionItem | null = null;

  public onSummonBeast?: (beastName: string) => void;
  public onFocusCity?: (cityId: string) => void;
  public onClose?: () => void;

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'lunar-mansion-modal';
    this.element.className = 'lunar-mansion-backdrop';
    this.element.style.display = 'none';

    document.body.appendChild(this.element);
    this.bindGlobalEvents();
  }

  private bindGlobalEvents() {
    this.element.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('lunar-mansion-backdrop')) {
        this.hide();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.element.style.display === 'flex') {
        this.hide();
      }
    });
  }

  public show(mansion: LunarMansionItem) {
    this.currentMansion = mansion;
    const beastBadgeIcon = {
      dragon: '🐉',
      tortoise: '🐢',
      tiger: '🐅',
      bird: '🦅'
    }[mansion.beastCategory] || '✨';

    const relatedDest = DESTINATIONS_DATA.find(d => d.id === mansion.associatedCityId);

    this.element.innerHTML = `
      <div class="mansion-scroll-card">
        <!-- 装饰古金龙纹边框角 -->
        <div class="mansion-corner top-left"></div>
        <div class="mansion-corner top-right"></div>
        <div class="mansion-corner bottom-left"></div>
        <div class="mansion-corner bottom-right"></div>

        <button class="mansion-close-btn" id="mansion-close-btn" aria-label="关闭图鉴">✕</button>

        <div class="mansion-header">
          <div class="mansion-beast-pill" style="border-color: ${mansion.beastColor}; color: ${mansion.beastColor};">
            <span class="beast-icon">${beastBadgeIcon}</span>
            <span class="beast-title">${mansion.beastCategoryName}</span>
          </div>

          <div class="mansion-title-row">
            <div class="mansion-seal-box" style="border-color: ${mansion.beastColor};">
              <span class="seal-char" style="color: ${mansion.beastColor};">${mansion.char}</span>
            </div>
            <div class="mansion-names">
              <h2 class="mansion-ancient-name">${mansion.name}</h2>
              <div class="mansion-meta-tags">
                <span class="meta-tag">七曜五行 · ${mansion.element}</span>
                <span class="meta-tag">祥灵化身 · ${mansion.animal}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mansion-body-scroll">
          <!-- 1. 天象主司 -->
          <div class="mansion-section-block">
            <div class="section-title">
              <span class="title-icon">🔭</span>
              <span>周天星官司职</span>
            </div>
            <p class="section-text highlight">${mansion.astronomyRole}</p>
          </div>

          <!-- 2. 地理分野与当前区域对应 -->
          <div class="mansion-section-block fenye-block">
            <div class="section-title">
              <span class="title-icon">🧭</span>
              <span>天官分野 · 当前区域地脉对应</span>
            </div>
            <p class="section-text">${mansion.fenye}</p>
          </div>

          <!-- 3. 山海星象神话考纪 -->
          <div class="mansion-section-block lore-block">
            <div class="section-title">
              <span class="title-icon">📜</span>
              <span>《周天星象山海考纪》</span>
            </div>
            <p class="section-text lore-quote">${mansion.lore}</p>
          </div>
        </div>

        <!-- 联动操作底部按钮栏 -->
        <div class="mansion-action-footer">
          <button class="mansion-nav-btn city-btn" id="mansion-nav-city-btn">
            <span class="btn-icon">📍</span>
            <span class="btn-text">巡礼分野【${mansion.associatedCityName}】</span>
          </button>

          <button class="mansion-nav-btn beast-btn" id="mansion-nav-beast-btn" style="border-color: ${mansion.beastColor};">
            <span class="btn-icon">✨</span>
            <span class="btn-text">召来【${mansion.associatedBeastName}】真身</span>
          </button>
        </div>
      </div>
    `;

    this.element.querySelector('#mansion-close-btn')?.addEventListener('click', () => {
      this.hide();
    });

    this.element.querySelector('#mansion-nav-city-btn')?.addEventListener('click', () => {
      this.hide();
      if (this.onFocusCity) {
        this.onFocusCity(mansion.associatedCityId);
      }
    });

    this.element.querySelector('#mansion-nav-beast-btn')?.addEventListener('click', () => {
      this.hide();
      if (this.onSummonBeast) {
        this.onSummonBeast(mansion.associatedBeastName);
      }
    });

    this.element.style.display = 'flex';
  }

  public hide() {
    this.element.style.display = 'none';
    if (this.onClose) {
      this.onClose();
    }
  }
}
