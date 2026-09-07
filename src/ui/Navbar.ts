import {
  experienceState,
  getActiveNavItem,
  type ActiveNavItem,
  type DimensionMode
} from '../core/experienceState';
import { AudioVisualizer } from './AudioVisualizer';

export class Navbar {
  private element: HTMLElement;
  private onAudioToggle: () => void;
  private onDimensionChange?: (mode: DimensionMode | 'scroll') => void;
  private isAudioPlaying = false;
  private audioVisualizer: AudioVisualizer;
  private unsubscribeState?: () => void;

  constructor(
    onAudioToggle: () => void, 
    _onOracleClick?: () => void,
    onDimensionChange?: (mode: DimensionMode | 'scroll') => void
  ) {
    this.onAudioToggle = onAudioToggle;
    this.onDimensionChange = onDimensionChange;
    this.audioVisualizer = new AudioVisualizer();

    this.element = document.createElement('header');
    this.element.className = 'celestial-observatory-hud imperial-scroll-theme';
    this.element.id = 'celestial-observatory-hud';
    this.render();
    this.unsubscribeState = experienceState.subscribe(state => {
      this.setDimensionState(getActiveNavItem(state));
    });
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public setAudioState(isPlaying: boolean) {
    this.isAudioPlaying = isPlaying;
    const btn = this.element.querySelector('#audio-btn');
    if (btn) {
      const label = btn.querySelector('.pill-audio-label');
      if (label) {
        label.textContent = isPlaying ? '黄钟 · 雅乐' : '琴韵雅乐';
      }
      btn.classList.toggle('active', isPlaying);
    }
  }

  public setDimensionState(mode: ActiveNavItem) {
    const nodes = this.element.querySelectorAll('.scroll-chapter-node');
    nodes.forEach(node => {
      const targetMode = node.getAttribute('data-mode');
      node.classList.toggle('active', targetMode === mode);
    });
  }

  private render() {
    this.element.innerHTML = `
      <!-- 顶部天象子午贯通金丝赤道标尺 (1px Celestial Meridian Line) -->
      <div class="hud-celestial-equator">
        <div class="equator-hairline"></div>
        <div class="equator-degree-ticks">
          <span class="degree-mark">周天 360°</span>
          <span class="degree-mark">东宫 · 苍龙角亢</span>
          <span class="degree-mark">南宫 · 朱雀井鬼</span>
          <span class="degree-mark">西宫 · 白虎奎娄</span>
          <span class="degree-mark">北宫 · 玄武斗牛</span>
        </div>
      </div>

      <!-- 【大宋宣和 · 泥金绫绢舒展长卷】(Ancient Unfolding Imperial Silk Handscroll) -->
      <div class="imperial-handscroll-wrapper">
        <!-- 1. 左卷轴轴头与朱砂锦带 (Left White Jade Scroll Roller Knob & Cinnabar Silk Ribbon) -->
        <div class="scroll-roller-finial left">
          <div class="jade-finial-knob">
            <div class="knob-cap gold"></div>
            <div class="knob-body jade"></div>
            <div class="knob-ring gold"></div>
          </div>
          <div class="cinnabar-silk-ribbon"></div>
        </div>

        <!-- 2. 宣和御制长卷主体 (Main Imperial Silk Damask & Xuan Paper Handscroll) -->
        <div class="imperial-scroll-body">
          <!-- 2.1 卷首题跋区 (Handscroll Header: Title & Seal) -->
          <div class="scroll-colophon-section" id="nav-brand-btn" title="点击归正神州坤舆星图顶层">
            <div class="ancient-cinnabar-seal">
              <span class="seal-glyph">山海</span>
            </div>
            <div class="colophon-text-flow">
              <h1 class="colophon-main-title">新山海图志</h1>
              <span class="colophon-ephemeris-text">万国坤舆 · 华夏奇境 · 岁在甲辰</span>
            </div>
          </div>

          <!-- 锦绫分割金线 (Brocade Gold Filigree Divider) -->
          <div class="scroll-silk-divider">
            <span class="divider-talisman-mark">✦</span>
          </div>

          <!-- 2.2 卷中四大章回天枢台 (Four Mythic Scroll Chapters: 3D Globe / Diorama / Beast / Scroll) -->
          <nav class="scroll-chapters-nav">
            <!-- 章回1: 神州坤舆 (3D宏观星穹地球) -->
            <button class="scroll-chapter-node active" id="nav-globe-mode-btn" data-mode="globe" title="神州坤舆 · 3D山海宏观星图与沙盘">
              <span class="chapter-seal-dot"></span>
              <span class="chapter-rune-char">坤</span>
              <span class="chapter-text">神州坤舆</span>
            </button>

            <span class="chapter-silk-dot">·</span>

            <!-- 章回2: 万象沙盘 (3D地貌微缩沙盘) -->
            <button class="scroll-chapter-node" id="nav-diorama-mode-btn" data-mode="diorama" title="万象沙盘 · 3D山海微缩高程沙盘">
              <span class="chapter-seal-dot"></span>
              <span class="chapter-rune-char">象</span>
              <span class="chapter-text">万象沙盘</span>
            </button>

            <span class="chapter-silk-dot">·</span>

            <!-- 章回3: 神兽真身 (3D上古图腾全息) -->
            <button class="scroll-chapter-node" id="nav-beast-mode-btn" data-mode="beast" title="神兽真身 · 3D上古图腾全息检视">
              <span class="chapter-seal-dot"></span>
              <span class="chapter-rune-char">尊</span>
              <span class="chapter-text">神兽真身</span>
            </button>

            <span class="chapter-silk-dot">·</span>

            <!-- 章回4: 画卷巡礼 (长卷风物文牒) -->
            <button class="scroll-chapter-node" id="nav-scroll-mode-btn" data-mode="scroll" title="画卷巡礼 · 探索八荒风物与通关文牒">
              <span class="chapter-seal-dot"></span>
              <span class="chapter-rune-char">卷</span>
              <span class="chapter-text">画卷巡礼</span>
            </button>
          </nav>

          <!-- 锦绫分割金线 -->
          <div class="scroll-silk-divider">
            <span class="divider-talisman-mark">✦</span>
          </div>

          <!-- 2.3 卷尾雅乐玉佩区 (Handscroll Tail: Guqin Zen Audio Visualizer) -->
          <div class="scroll-action-tail">
            <button class="scroll-audio-talisman" id="audio-btn" title="十二律吕 · 奏响古琴天籁禅音">
              <div class="nav-visualizer-slot"></div>
              <span class="pill-audio-label">琴韵雅乐</span>
            </button>
          </div>
        </div>

        <!-- 3. 右卷轴轴头与朱砂锦带 (Right White Jade Scroll Roller Knob & Cinnabar Silk Ribbon) -->
        <div class="scroll-roller-finial right">
          <div class="jade-finial-knob">
            <div class="knob-cap gold"></div>
            <div class="knob-body jade"></div>
            <div class="knob-ring gold"></div>
          </div>
          <div class="cinnabar-silk-ribbon"></div>
        </div>
      </div>
    `;

    // Append Audio Visualizer
    const visualizerSlot = this.element.querySelector('.nav-visualizer-slot');
    if (visualizerSlot) {
      visualizerSlot.appendChild(this.audioVisualizer.getElement());
    }

    // 1. 章回点击与维度折跃
    this.element.querySelectorAll('.scroll-chapter-node').forEach(node => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = node.getAttribute('data-mode');
        if (mode === 'scroll') {
          const dailyStage = document.getElementById('daily-stage');
          if (dailyStage) {
            dailyStage.scrollIntoView({ behavior: 'smooth' });
          }
          if (this.onDimensionChange) {
            this.onDimensionChange('scroll');
          }
        } else if (mode && (mode === 'globe' || mode === 'diorama' || mode === 'beast')) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (this.onDimensionChange) {
            this.onDimensionChange(mode as DimensionMode);
          }
        }
      });
    });

    // 2. 卷首题跋点击回正；激活态由 ExperienceState 派生
    this.element.querySelector('#nav-brand-btn')?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (this.onDimensionChange) {
        this.onDimensionChange('globe');
      }
    });

    // 3. 雅乐开关
    this.element.querySelector('#audio-btn')?.addEventListener('click', () => {
      this.onAudioToggle();
    });
  }

  public destroy() {
    this.unsubscribeState?.();
    this.unsubscribeState = undefined;
  }
}
