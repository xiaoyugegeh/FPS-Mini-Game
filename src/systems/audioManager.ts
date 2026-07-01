import { useGameStore } from '../stores/gameStore';
import { AUDIO } from '../utils/constants';

/**
 * 音频管理器
 * 使用 Web Audio API 程序化生成音效，无需外部资源
 */
export class AudioManager {
  private static instance: AudioManager | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private enabled = false;
  private lastFootstepTime = 0;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * 初始化音频上下文
   */
  init(): void {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.updateVolumes();
      this.enabled = true;
    } catch (error) {
      console.warn('[Audio] 音频上下文初始化失败:', error);
    }
  }

  /**
   * 恢复音频上下文（处理浏览器自动播放策略）
   */
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * 更新音量
   */
  updateVolumes(): void {
    const store = useGameStore.getState();
    if (this.masterGain) {
      this.masterGain.gain.value = store.settings.masterVolume;
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = store.settings.sfxVolume;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = store.settings.musicVolume;
    }
  }

  /**
   * 播放合成音效：白噪声爆发
   */
  private playNoise(duration: number, frequency: number, volume = 1, type: 'bandpass' | 'lowpass' = 'bandpass'): void {
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = 1;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
    source.stop(this.ctx.currentTime + duration);
  }

  /**
   * 播放合成音效：正弦波打击
   */
  private playTone(frequency: number, duration: number, volume = 1, sweep = 0): void {
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    if (sweep !== 0) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(50, frequency + sweep),
        this.ctx.currentTime + duration
      );
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  /**
   * 武器开火声
   */
  playFire(): void {
    if (!this.enabled) return;
    this.playNoise(0.15, AUDIO.FIRE_FREQ, 0.6, 'bandpass');
    this.playTone(120, 0.08, 0.4, -60);
  }

  /**
   * 换弹声
   */
  playReload(): void {
    if (!this.enabled) return;
    this.playTone(AUDIO.RELOAD_FREQ, 0.15, 0.3, 100);
    setTimeout(() => this.playTone(AUDIO.RELOAD_FREQ + 80, 0.12, 0.3, -80), 180);
  }

  /**
   * 命中金属声
   */
  playHitMetal(): void {
    if (!this.enabled) return;
    this.playTone(AUDIO.HIT_METAL_FREQ, 0.1, 0.35, -200);
  }

  /**
   * 命中混凝土声
   */
  playHitConcrete(): void {
    if (!this.enabled) return;
    this.playNoise(0.12, AUDIO.HIT_CONCRETE_FREQ, 0.25, 'lowpass');
  }

  /**
   * 命中塑料/训练靶声
   */
  playHitPlastic(): void {
    if (!this.enabled) return;
    this.playTone(500, 0.08, 0.3, 150);
  }

  /**
   * 脚步声
   * @param isMoving 是否正在移动
   * @param movementState 当前移动状态，影响间隔与音高
   */
  playFootstep(isMoving: boolean, movementState: 'idle' | 'walk' | 'run' = 'walk'): void {
    if (!this.enabled || !isMoving || movementState === 'idle') return;
    const now = performance.now();

    const isRunning = movementState === 'run';
    const interval = isRunning ? AUDIO.FOOTSTEP_INTERVAL_RUN : AUDIO.FOOTSTEP_INTERVAL_WALK;
    if (now - this.lastFootstepTime < interval) return;
    this.lastFootstepTime = now;

    // 奔跑时音高更高、音量略大、时长更短，表现急促感
    const frequency = AUDIO.FOOTSTEP_BASE_FREQ + (isRunning ? AUDIO.FOOTSTEP_RUN_PITCH_OFFSET : 0);
    const volume = isRunning ? 0.22 : 0.16;
    const duration = isRunning ? 0.06 : 0.09;
    this.playNoise(duration, frequency, volume, 'lowpass');
  }

  /**
   * UI 提示音
   */
  playUiConfirm(): void {
    if (!this.enabled) return;
    this.playTone(880, 0.1, 0.2, 0);
  }

  /**
   * 阶段完成音
   */
  playStageComplete(): void {
    if (!this.enabled) return;
    this.playTone(660, 0.12, 0.25, 0);
    setTimeout(() => this.playTone(880, 0.15, 0.3, 0), 120);
    setTimeout(() => this.playTone(1100, 0.2, 0.25, 0), 280);
  }

  /**
   * 玩家受伤音效
   */
  playPlayerHit(): void {
    if (!this.enabled) return;
    this.playNoise(0.25, 180, 0.45, 'lowpass');
    this.playTone(80, 0.2, 0.35, -40);
  }

  /**
   * 触发浏览器震动反馈
   */
  vibrate(pattern: number | number[]): void {
    const store = useGameStore.getState();
    if (!store.settings.enableVibration || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // 忽略不支持震动的情况
    }
  }
}
