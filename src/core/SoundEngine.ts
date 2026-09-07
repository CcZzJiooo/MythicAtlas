/**
 * 东方古韵 Web Audio 程序化声学合成引擎 (Web Audio Procedural Sound Engine)
 * 无需任何外部音频文件下载，纯物理振荡器、共鸣滤波器与分析器实时合成：
 * 1. 五声音阶古琴玉筝 (Pentatonic Zither / Guqin Synth)
 * 2. 编钟铜磬金石长鸣 (Sacred Bronze Bell / Chime Resonance)
 * 3. 破虚穿云空间掠影 (Dimensional Warp Woosh)
 * 4. 山海神兽啸鸣共鸣 (Mythic Beast Harmonic Resonance)
 * 5. 实时音频频谱分析器 (Real-time Web Audio Analyser for HUD visualizer)
 */

export class SoundEngine {
  private static instance: SoundEngine;
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying: boolean = false;
  private analyser: AnalyserNode | null = null;

  // 五声音阶 (宫、商、角、徵、羽: C, D, E, G, A, c, d, e)
  private pentatonicFrequencies = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

  private constructor() {
    // Lazy initialized on first user interaction
  }

  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  public initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.05, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private connectToOutput(node: AudioNode) {
    if (this.analyser) {
      node.connect(this.analyser);
    } else if (this.ctx) {
      node.connect(this.ctx.destination);
    }
  }

  /**
   * 触发空灵古琴微鸣 (Guqin / Zither Pluck)
   */
  public playGuqin(noteIndex?: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const freq = noteIndex !== undefined
      ? this.pentatonicFrequencies[noteIndex % this.pentatonicFrequencies.length]
      : this.pentatonicFrequencies[Math.floor(Math.random() * this.pentatonicFrequencies.length)];

    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 4, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 1.8);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    this.connectToOutput(gainNode);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.3);
    osc2.stop(now + 2.3);
  }

  /**
   * 触发青铜钟磬长鸣 (Bronze Bell / Chime)
   */
  public playBronzeBell() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fundamental = 320;
    const partials = [1, 1.45, 1.95, 2.75, 3.45];
    const gains = [0.25, 0.15, 0.12, 0.08, 0.04];

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, now);
    this.connectToOutput(masterGain);

    partials.forEach((ratio, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * ratio, now);

      pGain.gain.setValueAtTime(0.01, now);
      pGain.gain.linearRampToValueAtTime(gains[i], now + 0.015);
      pGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5 - i * 0.4);

      osc.connect(pGain);
      pGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 3.6);
    });
  }

  /**
   * 触发山海神兽真身降临破虚共鸣 (Mythic Beast Summon Harmonic)
   */
  public playBeastSummon() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 低沉龙吟/灵兽风雷轰鸣
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(80, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 1.2);

    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(0.35, now + 0.1);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    subOsc.connect(subGain);
    this.connectToOutput(subGain);
    subOsc.start(now);
    subOsc.stop(now + 1.5);

    // 金光圣辉升腾泛音
    const shimmerOsc = this.ctx.createOscillator();
    const shimmerGain = this.ctx.createGain();
    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.setValueAtTime(523.25, now + 0.1);
    shimmerOsc.frequency.exponentialRampToValueAtTime(1046.5, now + 1.0);

    shimmerGain.gain.setValueAtTime(0.001, now + 0.1);
    shimmerGain.gain.linearRampToValueAtTime(0.18, now + 0.4);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    shimmerOsc.connect(shimmerGain);
    this.connectToOutput(shimmerGain);
    shimmerOsc.start(now + 0.1);
    shimmerOsc.stop(now + 2.1);
  }

  /**
   * 触发星际穿越 · 卡冈图雅黑洞时空折跃合成音效 (Gargantua Interstellar Black Hole Warp Synthesis)
   * 包含引力坍缩次重低音、多普勒吸积盘风暴、星际空灵管风琴和弦与超新星破空泛音
   */
  public playGargantuaWarp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. 引力坍缩次重低音 (Sub-Bass Gravitational Infall Drone)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(45, now);
    subOsc.frequency.exponentialRampToValueAtTime(120, now + 0.5);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 1.2);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.42, now + 0.45);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

    subOsc.connect(subGain);
    this.connectToOutput(subGain);
    subOsc.start(now);
    subOsc.stop(now + 1.4);

    // 2. 吸积盘湍流风暴白噪 (Accretion Doppler Atmospheric Shear)
    const bufferSize = Math.floor(this.ctx.sampleRate * 1.3);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1);
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(220, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.6);
    noiseFilter.frequency.exponentialRampToValueAtTime(600, now + 1.2);
    noiseFilter.Q.setValueAtTime(4.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.22, now + 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    this.connectToOutput(noiseGain);
    noiseSource.start(now);
    noiseSource.stop(now + 1.35);

    // 3. 星际穿梭空灵和弦 (Interstellar Celestial Chord Resonance: Dm9 -> Fmaj7)
    const chordFreqs = [293.66, 349.23, 440.00, 587.33, 880.00];
    chordFreqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 0.98, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + 0.6);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 1.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(gain);
      this.connectToOutput(gain);
      osc.start(now + idx * 0.03);
      osc.stop(now + 1.45);
    });
  }

  /**
   * 触发破虚穿云空间掠影 (Dimensional Warp Swoosh)
   */
  public playWarp() {
    this.playGargantuaWarp();
  }

  /**
   * 触发古卷竹简展开声 (Parchment Rustle)
   */
  public playParchment() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.linearRampToValueAtTime(450, now + 0.35);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    this.connectToOutput(gain);

    noise.start(now);
  }

  /**
   * 触发朱砂落印破风声 (Cinnabar Stamp Hit)
   */
  public playStampHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(oscGain);
    this.connectToOutput(oscGain);
    osc.start(now);
    osc.stop(now + 0.16);

    setTimeout(() => {
      this.playBronzeBell();
    }, 40);
  }

  public playStamp() {
    this.playStampHit();
  }

  /**
   * 触发清脆木石交互点击 (Wood/Stone Tap)
   */
  public playTap() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    this.connectToOutput(gain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * 开启东方冥想风鸣环境底噪 (Ambient Ethereal Drone)
   */
  public startAmbient() {
    if (this.isAmbientPlaying || this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.001, now);
    this.ambientGain.gain.linearRampToValueAtTime(0.04, now + 3.0);
    this.connectToOutput(this.ambientGain);

    const drone1 = this.ctx.createOscillator();
    const drone2 = this.ctx.createOscillator();

    drone1.type = 'sine';
    drone1.frequency.setValueAtTime(108.0, now);

    drone2.type = 'sine';
    drone2.frequency.setValueAtTime(108.5, now);

    drone1.connect(this.ambientGain);
    drone2.connect(this.ambientGain);

    drone1.start();
    drone2.start();
    this.isAmbientPlaying = true;
  }
}
