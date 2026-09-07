import { DestinationItem } from '../types';

export class PassportSection {
  private element: HTMLElement;
  private destinations: DestinationItem[];
  private stampedIds: string[];

  constructor(destinations: DestinationItem[], stampedIds: string[]) {
    this.destinations = destinations;
    this.stampedIds = stampedIds;
    this.element = document.createElement('section');
    this.element.id = 'passport-stage';
    this.element.className = 'passport-section';
    this.render();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public updateStamped(stampedIds: string[]) {
    this.stampedIds = stampedIds;
    this.render();
  }

  private render() {
    const stampedSet = new Set(this.stampedIds);
    const progressPct = Math.round((this.stampedIds.length / this.destinations.length) * 100);

    this.element.innerHTML = `
      <div class="passport-container">
        <!-- Section Header -->
        <div class="section-badge-center">
          <span class="badge-icon">📜</span> 山海通鉴 · 山海通关文牒印谱
        </div>
        <h2 class="section-main-title">
          当前样板 · 朱砂御印通关集谱
        </h2>
        <p class="section-main-desc">
          已巡游收集 <strong>${this.stampedIds.length} / ${this.destinations.length}</strong> 处样板胜境印章（探索进度 ${progressPct}%）
        </p>

        <!-- Progress Bar -->
        <div class="passport-progress-bar-wrapper">
          <div class="passport-progress-fill" style="width: ${progressPct}%;"></div>
        </div>

        <!-- Current sample destination seal stamps grid -->
        <div class="passport-stamps-grid">
          ${this.destinations.map(d => {
            const isCollected = stampedSet.has(d.id);
            return `
              <div class="stamp-slot ${isCollected ? 'unlocked' : 'locked'}">
                <div class="seal-box" style="border-color: ${isCollected ? d.seal.inkColor : '#4A5568'}; color: ${isCollected ? d.seal.inkColor : '#718096'};">
                  ${isCollected ? `<span class="seal-text">${d.seal.sealScript}</span>` : `<span class="lock-icon">🔒</span>`}
                </div>
                <span class="stamp-slot-city">${d.cityName}</span>
                <span class="stamp-slot-name">${d.seal.sealName}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Call to Action: Generate High-Resolution Certificate Poster -->
        <div class="passport-poster-action-box">
          <button class="generate-poster-btn" id="generate-passport-poster-btn">
            <span class="btn-icon">🎨</span> 一键绘制并生成《山海通关文牒》古画海报
          </button>
          <p class="poster-tip">基于 HTML5 高分辨率 Canvas 实时绘制水墨仿古印谱大图，支持一键下载 PNG</p>
        </div>

        <!-- Poster Modal Popup -->
        <div class="passport-poster-modal" id="poster-modal" style="display:none;">
          <div class="modal-backdrop" id="close-modal-backdrop"></div>
          <div class="modal-card">
            <div class="modal-header">
              <h3>📜 《山海通关文牒》高清印谱</h3>
              <button class="close-modal-btn" id="close-modal-btn">✕</button>
            </div>
            <div class="modal-canvas-wrap">
              <canvas id="passport-canvas" width="900" height="1280"></canvas>
            </div>
            <div class="modal-footer">
              <button class="download-poster-btn" id="download-poster-btn">
                💾 保存高清文牒海报 (PNG)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind Poster Generation Modal
    this.element.querySelector('#generate-passport-poster-btn')?.addEventListener('click', () => {
      this.generateAndShowPoster();
    });

    this.element.querySelector('#close-modal-btn')?.addEventListener('click', () => {
      this.hideModal();
    });

    this.element.querySelector('#close-modal-backdrop')?.addEventListener('click', () => {
      this.hideModal();
    });

    this.element.querySelector('#download-poster-btn')?.addEventListener('click', () => {
      const canvas = this.element.querySelector('#passport-canvas') as HTMLCanvasElement;
      if (canvas) {
        const link = document.createElement('a');
        link.download = `山海通关文牒_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    });
  }

  private hideModal() {
    const modal = this.element.querySelector('#poster-modal') as HTMLElement;
    if (modal) modal.style.display = 'none';
  }

  /**
   * Generates antique Xuan-paper passport certificate on HTML5 Canvas
   */
  private generateAndShowPoster() {
    const modal = this.element.querySelector('#poster-modal') as HTMLElement;
    const canvas = this.element.querySelector('#passport-canvas') as HTMLCanvasElement;
    if (!modal || !canvas) return;

    modal.style.display = 'flex';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const stampedSet = new Set(this.stampedIds);

    // 1. Draw Antique Xuan Paper Background
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w * 0.8);
    bgGrad.addColorStop(0, '#F5E6CA');
    bgGrad.addColorStop(0.7, '#EBD5B3');
    bgGrad.addColorStop(1, '#D8BC93');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Double Cinnabar Borders & Gold Trims
    ctx.strokeStyle = '#B32014';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // 3. Four Corner Auspicious Knots
    const cornerSize = 25;
    const corners = [
      [30, 30], [w - 30, 30], [30, h - 30], [w - 30, h - 30]
    ];
    ctx.fillStyle = '#B32014';
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, cornerSize, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Header Calligraphy
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1A110B';
    ctx.font = 'bold 44px "Ma Shan Zheng", "STKaiti", serif';
    ctx.fillText('山 海 通 关 文 牒', w / 2, 110);

    ctx.fillStyle = '#8C2B1B';
    ctx.font = '22px "Long Cang", "STKaiti", serif';
    ctx.fillText('—— 当前样板城市山海胜境行者印谱 ——', w / 2, 150);

    ctx.fillStyle = '#4A3B32';
    ctx.font = '16px "PingFang SC", sans-serif';
    ctx.fillText(`岁在丙午 · 巡游已收录 ${this.stampedIds.length} / ${this.destinations.length} 处胜地印契`, w / 2, 185);

    // 5. Draw a responsive current-sample stamp grid.
    const cols = Math.min(7, Math.max(1, Math.ceil(this.destinations.length / 4)));
    const rows = Math.ceil(this.destinations.length / cols);
    const startX = 65;
    const startY = 225;
    const cellW = (w - 130) / cols;
    const cellH = 120;

    this.destinations.forEach((dest, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const cx = startX + c * cellW + cellW / 2;
      const cy = startY + r * cellH + cellH / 2;

      const isCollected = stampedSet.has(dest.id);

      // Stamp Frame
      ctx.strokeStyle = isCollected ? dest.seal.inkColor : '#A09383';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 38, cy - 38, 76, 76);

      if (isCollected) {
        // Red Vermilion Seal Text
        ctx.fillStyle = dest.seal.inkColor;
        ctx.font = 'bold 19px "Ma Shan Zheng", serif';
        ctx.fillText(dest.seal.sealScript.slice(0, 2), cx, cy - 6);
        ctx.fillText(dest.seal.sealScript.slice(2, 4), cx, cy + 18);
      } else {
        // Locked Mark
        ctx.fillStyle = '#8C7E6E';
        ctx.font = '18px sans-serif';
        ctx.fillText('🔒 未盖印', cx, cy + 5);
      }

      // City Label Below
      ctx.fillStyle = '#2D2013';
      ctx.font = 'bold 14px "PingFang SC", sans-serif';
      ctx.fillText(dest.cityName, cx, cy + 56);
    });

    // 6. Center regional classical poetry & proclamation
    const procY = startY + rows * cellH + 80;
    ctx.fillStyle = '#2C1810';
    ctx.font = '22px "Ma Shan Zheng", "STKaiti", serif';
    ctx.fillText('「五岭苍茫开巨浸，三江奔涌汇南溟。」', w / 2, procY);

    ctx.fillStyle = '#4A3B32';
    ctx.font = '16px "PingFang SC", serif';
    ctx.fillText('持此文牒者，已步履当前样板目录，览尽湖山、潮汐、山岳与古城风物。', w / 2, procY + 35);
    ctx.fillText('山海同鉴，万象常安。特此钤印为证。', w / 2, procY + 65);

    // 7. Footer Imperial Master Seal
    ctx.strokeStyle = '#B32014';
    ctx.lineWidth = 4;
    ctx.strokeRect(w / 2 - 60, h - 160, 120, 90);

    ctx.fillStyle = '#B32014';
    ctx.font = 'bold 26px "Ma Shan Zheng", serif';
    ctx.fillText('山海通鉴', w / 2, h - 118);
    ctx.fillText('永镇灵图', w / 2, h - 85);
  }
}
