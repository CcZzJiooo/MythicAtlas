import { DESTINATIONS_DATA } from '../data/destinations';
import { CalendarStatus, DestinationItem } from '../types';
import { StorageManager } from '../core/StorageManager';
import { SoundEngine } from '../core/SoundEngine';

export class TimelineSection {
  public element: HTMLElement;
  private storage: StorageManager;
  private sound: SoundEngine;
  private calendarStatus: CalendarStatus;
  private activeId: string;
  private onSelectCallback?: (dest: DestinationItem) => void;

  constructor(
    container: HTMLElement,
    status: CalendarStatus,
    activeId: string,
    onSelect?: (dest: DestinationItem) => void
  ) {
    this.storage = StorageManager.getInstance();
    this.sound = SoundEngine.getInstance();
    this.calendarStatus = status;
    this.activeId = activeId;
    this.onSelectCallback = onSelect;

    this.element = document.createElement('section');
    this.element.id = 'timeline-stage';
    this.element.className = 'page-section timeline-page-section';
    container.appendChild(this.element);

    this.render();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public updateStatus(status: CalendarStatus, activeId: string) {
    this.calendarStatus = status;
    this.activeId = activeId;
    this.render();
  }

  public updateCountdown(countdownStr: string) {
    const el = this.element.querySelector('#timeline-section-countdown');
    if (el) {
      el.textContent = countdownStr;
    }
  }

  private render() {
    this.element.innerHTML = `
      <div class="section-container">
        <div class="section-header-center">
          <div class="section-badge">⏳ 往昔舆图 · 岁时星象廊</div>
          <h2 class="section-main-title">日历流转 · 循历而行溯源万象</h2>
          <div class="section-sub-title">
            每日破晓启封一处样板城市胜境 · 未来天数受迷雾结界禁制
          </div>

          <div class="timeline-countdown-box">
            <span>⌛ 距离下处山海秘境启封：</span>
            <strong id="timeline-section-countdown">${this.calendarStatus.countdownStr}</strong>
          </div>
        </div>

        <div class="timeline-nodes-grid">
          ${DESTINATIONS_DATA.map(dest => {
            const isToday = dest.id === this.calendarStatus.todayDestination.id;
            const isFuture = dest.dayIndex > this.calendarStatus.todayDestination.dayIndex;
            const isSelected = dest.id === this.activeId;
            const isCollected = this.storage.isSealCollected(dest.id);

            return `
              <div class="timeline-node-card ${isSelected ? 'selected' : ''} ${isFuture ? 'locked' : ''} ${isToday ? 'today-highlight' : ''}" data-id="${dest.id}">
                <div class="node-date-tag">${dest.dateKey}</div>
                <div class="node-icon">${isFuture ? '🔒' : isCollected ? '💮' : '✨'}</div>
                <div class="node-title">${isFuture ? '迷雾封界' : dest.cityName}</div>
                <div class="node-sub">${isFuture ? '岁序未至' : dest.ancientMythicName}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // 绑定点击
    const nodes = this.element.querySelectorAll('.timeline-node-card');
    nodes.forEach(node => {
      node.addEventListener('click', () => {
        const id = node.getAttribute('data-id');
        if (!id) return;
        const target = DESTINATIONS_DATA.find(d => d.id === id);
        if (!target) return;

        if (target.dayIndex > this.calendarStatus.todayDestination.dayIndex) {
          this.sound.playTap();
          alert(`【天机未启】该样板胜境将于 ${target.dateKey} 解锁，目前处于迷雾禁制中！`);
          return;
        }

        this.sound.playGuqin();
        if (this.onSelectCallback) {
          this.onSelectCallback(target);
        }
        document.querySelector('#daily-stage')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }
}
