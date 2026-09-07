import { SolarTermItem } from '../data/solarTerms';
import { EarthlyBranchItem } from '../data/earthlyBranches';

/**
 * 东方天文大典 · 二十四节气与十二时辰神谕弹窗 (Solar Term & Earthly Branch Modal)
 */
export class SolarTermModal {
  private element: HTMLElement;
  public onFocusPlace?: (placeName: string) => void;

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'solar-term-modal';
    this.element.className = 'lunar-mansion-backdrop';
    this.element.style.display = 'none';

    document.body.appendChild(this.element);
    this.bindEvents();
  }

  private bindEvents() {
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

  public showSolarTerm(term: SolarTermItem) {
    const seasonColor = {
      spring: '#38EF7D',
      summer: '#FF5252',
      autumn: '#FFE066',
      winter: '#4FC3F7'
    }[term.season] || '#D4AF37';

    const seasonName = {
      spring: '孟春·仲春·季春',
      summer: '孟夏·仲夏·季夏',
      autumn: '孟秋·仲秋·季秋',
      winter: '孟冬·仲冬·季冬'
    }[term.season] || '四时岁度';

    this.element.innerHTML = `
      <div class="mansion-scroll-card">
        <div class="mansion-corner top-left"></div>
        <div class="mansion-corner top-right"></div>
        <div class="mansion-corner bottom-left"></div>
        <div class="mansion-corner bottom-right"></div>

        <button class="mansion-close-btn" id="term-close-btn" aria-label="关闭">✕</button>

        <div class="mansion-header">
          <div class="mansion-beast-pill" style="border-color: ${seasonColor}; color: ${seasonColor};">
            <span class="beast-icon">☀️</span>
            <span class="beast-title">二十四节气 · ${seasonName}</span>
          </div>

          <div class="mansion-title-row">
            <div class="mansion-seal-box" style="border-color: ${seasonColor};">
              <span class="seal-char" style="color: ${seasonColor};">${term.name[0]}</span>
            </div>
            <div class="mansion-names">
              <h2 class="mansion-ancient-name">${term.name}</h2>
              <div class="mansion-meta-tags">
                <span class="meta-tag">太阳黄经 · ${term.solarLongitude}°</span>
                <span class="meta-tag">${term.pinyin}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mansion-body-scroll">
          <!-- 1. 七十二候物候现象 -->
          <div class="mansion-section-block">
            <div class="section-title">
              <span class="title-icon">🌱</span>
              <span>七十二候 · 物候三候</span>
            </div>
            <div class="phenology-tags" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px;">
              ${term.threePhenology.map(p => `<span class="meta-tag" style="background: rgba(212,175,55,0.15); color: #F5EFE6; padding: 4px 10px; font-size: 12px; border-radius: 4px;">${p}</span>`).join('')}
            </div>
          </div>

          <!-- 2. 岁时诗赋与气象 -->
          <div class="mansion-section-block lore-block">
            <div class="section-title">
              <span class="title-icon">📜</span>
              <span>岁时诗赋</span>
            </div>
            <p class="section-text lore-quote" style="font-size: 14px; color: #FFE28A;">“${term.poetry}”</p>
            <p class="section-text" style="margin-top: 6px;">${term.guidance}</p>
          </div>

          <!-- 3. 当季推荐寻访名胜 -->
          <div class="mansion-section-block fenye-block">
            <div class="section-title">
              <span class="title-icon">🧭</span>
              <span>当令山海胜景推荐</span>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px;">
              ${term.recommendedPlaces.map(place => `
                <button class="mansion-nav-btn city-btn term-place-btn" data-place="${place}" style="padding: 6px 14px; font-size: 12.5px; border-radius: 16px;">
                  📍 ${place}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.element.querySelector('#term-close-btn')?.addEventListener('click', () => this.hide());
    this.element.querySelectorAll('.term-place-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const place = btn.getAttribute('data-place');
        this.hide();
        if (place && this.onFocusPlace) this.onFocusPlace(place);
      });
    });

    this.element.style.display = 'flex';
  }

  public showEarthlyBranch(branch: EarthlyBranchItem) {
    this.element.innerHTML = `
      <div class="mansion-scroll-card">
        <div class="mansion-corner top-left"></div>
        <div class="mansion-corner top-right"></div>
        <div class="mansion-corner bottom-left"></div>
        <div class="mansion-corner bottom-right"></div>

        <button class="mansion-close-btn" id="branch-close-btn" aria-label="关闭">✕</button>

        <div class="mansion-header">
          <div class="mansion-beast-pill" style="border-color: #D4AF37; color: #D4AF37;">
            <span class="beast-icon">⏳</span>
            <span class="beast-title">十二时辰 · 昼夜流转</span>
          </div>

          <div class="mansion-title-row">
            <div class="mansion-seal-box" style="border-color: #D4AF37;">
              <span class="seal-char" style="color: #FFE066;">${branch.char}</span>
            </div>
            <div class="mansion-names">
              <h2 class="mansion-ancient-name">${branch.name} · 【${branch.zodiacAnimal}】</h2>
              <div class="mansion-meta-tags">
                <span class="meta-tag">对应时间 · ${branch.timeRange}</span>
                <span class="meta-tag">五行阴阳 · ${branch.element} (${branch.yinYang})</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mansion-body-scroll">
          <div class="mansion-section-block">
            <div class="section-title">
              <span class="title-icon">🩺</span>
              <span>经络脏腑主令</span>
            </div>
            <p class="section-text highlight">${branch.solarOrgan}</p>
          </div>

          <div class="mansion-section-block lore-block">
            <div class="section-title">
              <span class="title-icon">📜</span>
              <span>时辰气象考纪</span>
            </div>
            <p class="section-text lore-quote" style="line-height: 1.8;">${branch.lore}</p>
          </div>
        </div>
      </div>
    `;

    this.element.querySelector('#branch-close-btn')?.addEventListener('click', () => this.hide());
    this.element.style.display = 'flex';
  }

  public hide() {
    this.element.style.display = 'none';
  }
}
