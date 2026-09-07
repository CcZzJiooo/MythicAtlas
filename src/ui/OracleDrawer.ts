import { TimeEngine } from '../core/TimeEngine';
import { StorageManager } from '../core/StorageManager';
import { SoundEngine } from '../core/SoundEngine';

export class OracleDrawer {
  private element: HTMLElement;
  private timeEngine: TimeEngine;
  private storage: StorageManager;
  private sound: SoundEngine;
  private isOpen: boolean = false;
  private onDateChangedCallback?: () => void;

  constructor(container: HTMLElement, onDateChanged?: () => void) {
    this.timeEngine = TimeEngine.getInstance();
    this.storage = StorageManager.getInstance();
    this.sound = SoundEngine.getInstance();
    this.onDateChangedCallback = onDateChanged;

    this.element = document.createElement('div');
    this.element.className = 'oracle-panel';
    this.element.style.display = 'none';
    container.appendChild(this.element);

    this.render();
  }

  public toggle(): boolean {
    this.isOpen = !this.isOpen;
    this.element.style.display = this.isOpen ? 'flex' : 'none';
    this.sound.playTap();
    if (this.isOpen) {
      this.render();
    }
    return this.isOpen;
  }

  private render() {
    const progress = this.storage.getProgress();
    const effectiveDate = this.timeEngine.getEffectiveDate();
    const dateStr = this.timeEngine.formatDateKey(effectiveDate);

    this.element.innerHTML = `
      <div class="oracle-header">
        <span>🔮 天象神谕推演</span>
        <span style="font-size: 11px; color: var(--c-gold-leaf);">演示调试模式</span>
      </div>

      <div style="font-size: 12.5px; color: var(--c-silk-dim); line-height: 1.6;">
        当前模拟岁时：<strong style="color: var(--c-gold-bright);">${dateStr}</strong><br/>
        当前偏移天数：<span style="color: var(--c-cinnabar);">${progress.oracleDateOffset > 0 ? '+' : ''}${progress.oracleDateOffset} 天</span>
      </div>

      <div class="oracle-controls">
        <button class="oracle-btn" id="oracle-prev-day">⏮ 溯流前一日</button>
        <button class="oracle-btn" id="oracle-reset">🔄 归位真历</button>
        <button class="oracle-btn" id="oracle-next-day">顺流后一日 ⏭</button>
      </div>

      <div style="font-size: 11px; color: rgba(244, 239, 230, 0.4); margin-top: 4px;">
        ※ 提示：神谕推演可自由模拟未来/过去解锁节点，便于即刻检阅不同节气秘境。
      </div>
    `;

    // 绑定事件
    this.element.querySelector('#oracle-prev-day')?.addEventListener('click', () => {
      this.sound.playGuqin();
      this.timeEngine.setOracleOffset(progress.oracleDateOffset - 1);
      this.render();
      if (this.onDateChangedCallback) this.onDateChangedCallback();
    });

    this.element.querySelector('#oracle-next-day')?.addEventListener('click', () => {
      this.sound.playGuqin();
      this.timeEngine.setOracleOffset(progress.oracleDateOffset + 1);
      this.render();
      if (this.onDateChangedCallback) this.onDateChangedCallback();
    });

    this.element.querySelector('#oracle-reset')?.addEventListener('click', () => {
      this.sound.playTap();
      this.timeEngine.setOracleOffset(0);
      this.render();
      if (this.onDateChangedCallback) this.onDateChangedCallback();
    });
  }
}
