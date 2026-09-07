import { SoundEngine } from '../core/SoundEngine';

export class AudioToggle {
  private button: HTMLElement;
  private sound: SoundEngine;

  constructor(container: HTMLElement) {
    this.sound = SoundEngine.getInstance();

    this.button = document.createElement('button');
    this.button.className = 'nav-btn';
    this.button.innerHTML = `<span>🔊</span> <span>禅音开启</span>`;
    container.appendChild(this.button);

    this.button.addEventListener('click', () => {
      // 开启环境风鸣底噪并切换静音
      this.sound.startAmbient();
      const isMuted = this.sound.toggleMute();

      if (isMuted) {
        this.button.innerHTML = `<span>🔇</span> <span>禅音静息</span>`;
        this.button.classList.remove('active');
      } else {
        this.button.innerHTML = `<span>🔊</span> <span>禅音悠扬</span>`;
        this.button.classList.add('active');
        this.sound.playGuqin();
      }
    });
  }
}
