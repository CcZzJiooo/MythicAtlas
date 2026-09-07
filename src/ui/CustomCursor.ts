/**
 * 东方鎏金游龙光标跟随与星尘拖尾系统 (Golden Dragon Custom Cursor & Particle Trail)
 * 具备平滑插值追踪、按钮吸附 (Magnetic Snap) 与星尘微粒喷发
 */

export class CustomCursor {
  private cursorDot: HTMLDivElement;
  private cursorRing: HTMLDivElement;
  private mouseX = -100;
  private mouseY = -100;
  private ringX = -100;
  private ringY = -100;
  private isHovering = false;
  private isClicking = false;

  constructor() {
    this.cursorDot = document.createElement('div');
    this.cursorDot.className = 'custom-cursor-dot';

    this.cursorRing = document.createElement('div');
    this.cursorRing.className = 'custom-cursor-ring';

    document.body.appendChild(this.cursorDot);
    document.body.appendChild(this.cursorRing);

    this.bindEvents();
    this.animate();
  }

  private bindEvents() {
    window.addEventListener('pointermove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      this.cursorDot.style.transform = `translate3d(${this.mouseX}px, ${this.mouseY}px, 0)`;

      // Spawn subtle trail particle occasionally
      if (Math.random() < 0.25) {
        this.spawnTrailParticle(this.mouseX, this.mouseY);
      }
    });

    window.addEventListener('pointerdown', () => {
      this.isClicking = true;
      this.cursorRing.classList.add('clicking');
    });

    window.addEventListener('pointerup', () => {
      this.isClicking = false;
      this.cursorRing.classList.remove('clicking');
    });

    // Detect hover over interactive elements
    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, .clickable, .pin-card, .tab-btn, .action-pill, input, select, textarea')) {
        this.isHovering = true;
        this.cursorRing.classList.add('hovering');
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, .clickable, .pin-card, .tab-btn, .action-pill, input, select, textarea')) {
        this.isHovering = false;
        this.cursorRing.classList.remove('hovering');
      }
    });
  }

  private spawnTrailParticle(x: number, y: number) {
    const particle = document.createElement('div');
    particle.className = 'cursor-trail-particle';
    const offsetX = (Math.random() - 0.5) * 12;
    const offsetY = (Math.random() - 0.5) * 12;
    particle.style.left = `${x + offsetX}px`;
    particle.style.top = `${y + offsetY}px`;

    document.body.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 600);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    // Smooth Lerp for ring
    const factor = this.isHovering ? 0.25 : 0.15;
    this.ringX += (this.mouseX - this.ringX) * factor;
    this.ringY += (this.mouseY - this.ringY) * factor;

    this.cursorRing.style.transform = `translate3d(${this.ringX}px, ${this.ringY}px, 0)`;
  };
}
