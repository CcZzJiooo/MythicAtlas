import gsap from 'gsap';

export class LoadingOverlay {
  private element: HTMLElement;
  private progressBar: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'loading-screen';
    this.element.innerHTML = `
      <div class="loading-ink-splash">
        <div class="loading-seal-icon">山海</div>
        <div class="loading-title">新山海图志</div>
        <div class="loading-subtitle">以山海之墨 · 绘人间万象</div>
        <div class="loading-bar-wrap">
          <div class="loading-bar" id="loading-bar"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);
    this.progressBar = this.element.querySelector('#loading-bar') as HTMLElement;
  }

  public setProgress(percent: number) {
    if (this.progressBar) {
      this.progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
  }

  public hide(callback?: () => void) {
    this.setProgress(100);
    setTimeout(() => {
      gsap.to(this.element, {
        opacity: 0,
        duration: 1.0,
        ease: 'power2.inOut',
        onComplete: () => {
          this.element.classList.add('fade-out');
          if (callback) callback();
        }
      });
    }, 400);
  }
}
