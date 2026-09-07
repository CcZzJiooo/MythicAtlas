import type { ClimateElement } from '../types';

type AudioContextConstructor = typeof AudioContext;

const ELEMENT_TONES: Record<ClimateElement, readonly number[]> = {
  wood: [196, 293.66, 392],
  fire: [220, 329.63, 440],
  earth: [174.61, 261.63, 349.23],
  metal: [246.94, 369.99, 493.88],
  water: [164.81, 246.94, 329.63],
};

function getAudioContextConstructor(): AudioContextConstructor | null {
  const audioWindow = window as typeof window & { webkitAudioContext?: AudioContextConstructor };
  return window.AudioContext ?? audioWindow.webkitAudioContext ?? null;
}

function createNoiseBuffer(context: AudioContext, seconds = 4): AudioBuffer {
  const frameCount = Math.ceil(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let previous = 0;

  for (let index = 0; index < frameCount; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.985 + white * 0.015;
    channel[index] = Math.max(-1, Math.min(1, previous * 3.1));
  }

  return buffer;
}

export class AmbientSoundscape {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private waterSource: AudioBufferSourceNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private chimeTimer: number | null = null;
  private suspendTimer: number | null = null;
  private enabled = false;
  private element: ClimateElement = 'water';
  private disposed = false;

  get isEnabled(): boolean {
    return this.enabled;
  }

  async setEnabled(nextEnabled: boolean): Promise<boolean> {
    if (this.disposed) return false;

    if (!nextEnabled) {
      this.enabled = false;
      if (this.master && this.context) {
        this.master.gain.cancelScheduledValues(this.context.currentTime);
        this.master.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.12);
      }
      this.clearChimeTimer();
      this.clearSuspendTimer();
      this.suspendTimer = window.setTimeout(() => {
        this.suspendTimer = null;
        if (!this.enabled && this.context?.state === 'running') void this.context.suspend();
      }, 180);
      return false;
    }

    if (!this.context) {
      const Context = getAudioContextConstructor();
      if (!Context) return false;
      this.initialize(new Context());
    }

    if (!this.context || !this.master) return false;
    this.clearSuspendTimer();
    await this.context.resume();
    this.enabled = true;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(0.34, this.context.currentTime, 0.35);
    this.scheduleNextChime(450);
    return true;
  }

  async toggle(): Promise<boolean> {
    return this.setEnabled(!this.enabled);
  }

  setElement(element: ClimateElement): void {
    this.element = element;
  }

  playParchment(): void {
    if (!this.enabled || !this.context || !this.master) return;
    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = createNoiseBuffer(this.context, 0.36);
    filter.type = 'bandpass';
    filter.frequency.value = 1850;
    filter.Q.value = 0.45;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.31);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(now);
    source.stop(now + 0.34);
  }

  playNavigation(): void {
    if (!this.enabled || !this.context || !this.master) return;
    const tones = ELEMENT_TONES[this.element];
    const frequency = tones[1] ?? 293.66;
    this.playPluck(frequency, 0.075, 0.7);
  }

  playSeal(): void {
    if (!this.enabled || !this.context || !this.master) return;
    const now = this.context.currentTime;
    const partials = [1, 2.02, 2.96, 4.12] as const;
    const base = 128;

    partials.forEach((partial, index) => {
      if (!this.context || !this.master) return;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(base * partial, now);
      oscillator.detune.value = index * 2.5;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12 / (index + 1), now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8 + index * 0.26);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + 2.2 + index * 0.26);
    });
  }

  setPaused(paused: boolean): void {
    if (!this.context || !this.enabled) return;
    if (paused) {
      void this.context.suspend();
      this.clearChimeTimer();
    } else {
      void this.context.resume();
      this.scheduleNextChime(900);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.enabled = false;
    this.clearChimeTimer();
    this.clearSuspendTimer();
    this.windSource?.stop();
    this.waterSource?.stop();
    this.windLfo?.stop();
    this.windSource = null;
    this.waterSource = null;
    this.windLfo = null;
    if (this.context) void this.context.close();
    this.context = null;
    this.master = null;
    this.ambientBus = null;
  }

  private initialize(context: AudioContext): void {
    this.context = context;
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const ambientBus = context.createGain();
    master.gain.value = 0.0001;
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.02;
    compressor.release.value = 0.28;
    ambientBus.gain.value = 0.72;
    ambientBus.connect(master);
    master.connect(compressor).connect(context.destination);
    this.master = master;
    this.ambientBus = ambientBus;

    const buffer = createNoiseBuffer(context);
    this.windSource = this.createWindLayer(buffer);
    this.waterSource = this.createWaterLayer(buffer);
  }

  private createWindLayer(buffer: AudioBuffer): AudioBufferSourceNode {
    if (!this.context || !this.ambientBus) throw new Error('Audio engine is not initialized');
    const source = this.context.createBufferSource();
    const lowPass = this.context.createBiquadFilter();
    const highPass = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const lfo = this.context.createOscillator();
    const lfoDepth = this.context.createGain();

    source.buffer = buffer;
    source.loop = true;
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 940;
    lowPass.Q.value = 0.35;
    highPass.type = 'highpass';
    highPass.frequency.value = 90;
    gain.gain.value = 0.12;
    lfo.type = 'sine';
    lfo.frequency.value = 0.07;
    lfoDepth.gain.value = 0.045;
    lfo.connect(lfoDepth).connect(gain.gain);
    source.connect(highPass).connect(lowPass).connect(gain).connect(this.ambientBus);
    source.start();
    lfo.start();
    this.windLfo = lfo;
    return source;
  }

  private createWaterLayer(buffer: AudioBuffer): AudioBufferSourceNode {
    if (!this.context || !this.ambientBus) throw new Error('Audio engine is not initialized');
    const source = this.context.createBufferSource();
    const bandPass = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = 1.37;
    bandPass.type = 'bandpass';
    bandPass.frequency.value = 480;
    bandPass.Q.value = 0.7;
    gain.gain.value = 0.055;
    source.connect(bandPass).connect(gain).connect(this.ambientBus);
    source.start();
    return source;
  }

  private playPluck(frequency: number, level: number, duration: number): void {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.992, now + duration);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + duration);
    filter.Q.value = 1.4;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(filter).connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
  }

  private scheduleNextChime(delay?: number): void {
    this.clearChimeTimer();
    if (!this.enabled || this.disposed) return;
    const wait = delay ?? 7000 + Math.random() * 9000;
    this.chimeTimer = window.setTimeout(() => {
      const tones = ELEMENT_TONES[this.element];
      const frequency = tones[Math.floor(Math.random() * tones.length)] ?? 246.94;
      this.playPluck(frequency, 0.052, 1.25 + Math.random() * 0.45);
      this.scheduleNextChime();
    }, wait);
  }

  private clearChimeTimer(): void {
    if (this.chimeTimer !== null) {
      window.clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
  }

  private clearSuspendTimer(): void {
    if (this.suspendTimer !== null) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
  }
}
