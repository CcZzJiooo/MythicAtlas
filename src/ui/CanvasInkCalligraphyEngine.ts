/**
 * 历史实验资产：仙咏集当前契约不再实例化 Canvas 水墨引擎。
 * 如需重新启用，必须先更新诗笺 Design Contract 并通过完整 Gate 验收。
 */
export class CanvasInkCalligraphyEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private isRunning: boolean = false;
  private dpr: number = 1;

  // 笔尖运动坐标与流光轨迹点
  public brushX: number = -100;
  public brushY: number = -100;
  public brushIntensity: number = 0; // 0~1
  public isVisible: boolean = false;
  private trail: { x: number; y: number; alpha: number; radius: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
  }

  public resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.clear();
  }

  public clear() {
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    this.ctx.clearRect(0, 0, w, h);
    this.trail = [];
  }

  /**
   * 在当前笔尖位置添加一道水墨流光波纹
   */
  public addStrokePoint(x: number, y: number) {
    this.trail.push({
      x,
      y,
      alpha: 1.0,
      radius: 12 + Math.random() * 4
    });
  }

  /**
   * 绘制朱砂闲章下落冲击波
   */
  public drawSealImpact(x: number, y: number, size: number = 24) {
    const ctx = this.ctx;
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, size * 0.2, x, y, size * 1.6);
    grad.addColorStop(0, 'rgba(178, 34, 34, 0.7)');
    grad.addColorStop(0.5, 'rgba(220, 20, 60, 0.3)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, size * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private loop = () => {
    if (!this.isRunning) return;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;

    this.ctx.clearRect(0, 0, w, h);

    // 1. 绘制历史流光轨迹并淡出
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const pt = this.trail[i];
      pt.alpha -= 0.04; // 优雅淡出
      if (pt.alpha <= 0) {
        this.trail.splice(i, 1);
        continue;
      }

      this.ctx.save();
      const grad = this.ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.radius);
      grad.addColorStop(0, `rgba(255, 240, 180, ${pt.alpha * 0.6})`);
      grad.addColorStop(0.5, `rgba(212, 175, 55, ${pt.alpha * 0.25})`);
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 2. 绘制当前正在运笔的书法金墨笔芒焦点
    if (this.isVisible && this.brushX > -50 && this.brushIntensity > 0.01) {
      const ctx = this.ctx;
      ctx.save();
      
      // 外部金气晕染
      const glowGrad = ctx.createRadialGradient(this.brushX, this.brushY, 0, this.brushX, this.brushY, 18);
      glowGrad.addColorStop(0, `rgba(255, 248, 220, ${this.brushIntensity * 0.85})`);
      glowGrad.addColorStop(0.4, `rgba(212, 175, 55, ${this.brushIntensity * 0.45})`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(this.brushX, this.brushY, 18, 0, Math.PI * 2);
      ctx.fill();

      // 笔尖极亮点
      ctx.fillStyle = `rgba(255, 255, 255, ${this.brushIntensity})`;
      ctx.beginPath();
      ctx.arc(this.brushX, this.brushY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    this.animId = requestAnimationFrame(this.loop);
  };
}
