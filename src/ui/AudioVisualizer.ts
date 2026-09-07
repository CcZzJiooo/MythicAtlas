import { SoundEngine } from '../core/SoundEngine';

/**
 * 东方琴韵实时音频频谱动效 (Oriental Golden Audio Spectrum Visualizer)
 * 将 Web Audio 的 AnalyserNode 频率数据实时绘制为鎏金波形曲线
 */

export class AudioVisualizer {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private sound: SoundEngine;
  private isRunning: boolean = true;
  private dataArray: Uint8Array;

  constructor() {
    this.sound = SoundEngine.getInstance();
    this.container = document.createElement('div');
    this.container.className = 'audio-spectrum-container';

    this.canvas = document.createElement('canvas');
    this.canvas.width = 120;
    this.canvas.height = 24;
    this.ctx = this.canvas.getContext('2d');

    this.dataArray = new Uint8Array(32);
    this.container.appendChild(this.canvas);

    this.animate();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  private animate = () => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    if (!this.ctx) return;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    const analyser = this.sound.getAnalyser();
    const isMuted = this.sound.getMuted();

    if (analyser && !isMuted) {
      (analyser as any).getByteFrequencyData(this.dataArray);
    } else {
      for (let i = 0; i < this.dataArray.length; i++) {
        this.dataArray[i] = 0;
      }
    }

    const barWidth = (width / 16);
    let x = 0;

    for (let i = 0; i < 16; i++) {
      const val = this.dataArray[i * 2] || (Math.sin(Date.now() * 0.003 + i) * 8 + 12);
      const barHeight = Math.max(3, (val / 255) * (height - 4));

      // Golden gradient for bars
      const grad = this.ctx.createLinearGradient(0, height - barHeight, 0, height);
      grad.addColorStop(0, '#FAF089');
      grad.addColorStop(0.6, '#D4AF37');
      grad.addColorStop(1, 'rgba(183, 121, 31, 0.4)');

      this.ctx.fillStyle = grad;
      this.ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

      x += barWidth;
    }
  };

  public destroy() {
    this.isRunning = false;
  }
}
