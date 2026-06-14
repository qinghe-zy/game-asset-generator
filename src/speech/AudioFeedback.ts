export type AudioCue =
  | 'microphone'
  | 'thinking'
  | 'success'
  | 'error'
  | 'confirmation'
  | 'interruption'

export interface AudioFeedbackStatus {
  supported: boolean
  enabled: boolean
  playingThinking: boolean
  message?: string
}

export interface AudioFeedback {
  getStatus(): AudioFeedbackStatus
  playCue(cue: Exclude<AudioCue, 'thinking'>): void
  startThinking(): void
  stopThinking(): void
  destroy(): Promise<void>
}

interface AudioParamLike {
  value: number
  setValueAtTime(value: number, startTime: number): void
  exponentialRampToValueAtTime(value: number, endTime: number): void
}

interface OscillatorLike {
  frequency: { value: number }
  type: string
  connect(target: GainLike): void
  start(startTime?: number): void
  stop(endTime?: number): void
}

interface GainLike {
  gain: AudioParamLike
  connect(target: unknown): void
}

interface AudioContextLike {
  currentTime: number
  destination: unknown
  createOscillator(): OscillatorLike
  createGain(): GainLike
  close(): Promise<void>
}

type AudioContextFactory = () => AudioContextLike

interface AudioFeedbackWindow {
  AudioContext?: new () => AudioContextLike
  webkitAudioContext?: new () => AudioContextLike
}

interface CueConfig {
  frequency: number
  duration: number
  gain: number
  type: string
}

const CUE_CONFIGS: Record<Exclude<AudioCue, 'thinking'>, CueConfig> = {
  microphone: {
    frequency: 660,
    duration: 0.08,
    gain: 0.04,
    type: 'sine',
  },
  success: {
    frequency: 880,
    duration: 0.12,
    gain: 0.05,
    type: 'triangle',
  },
  error: {
    frequency: 220,
    duration: 0.14,
    gain: 0.045,
    type: 'sawtooth',
  },
  confirmation: {
    frequency: 520,
    duration: 0.1,
    gain: 0.04,
    type: 'sine',
  },
  interruption: {
    frequency: 330,
    duration: 0.09,
    gain: 0.045,
    type: 'square',
  },
}

export interface BrowserAudioFeedbackOptions {
  audioContextFactory?: AudioContextFactory | null
  enabled?: boolean
}

export class BrowserAudioFeedback implements AudioFeedback {
  private readonly audioContextFactory: AudioContextFactory | null
  private audioContext: AudioContextLike | null = null
  private enabled: boolean
  private thinkingOscillator: OscillatorLike | null = null
  private message: string | undefined

  constructor(options: BrowserAudioFeedbackOptions = {}) {
    this.audioContextFactory =
      'audioContextFactory' in options
        ? (options.audioContextFactory ?? null)
        : this.detectAudioContextFactory()
    this.enabled = options.enabled ?? true

    if (!this.audioContextFactory) {
      this.message =
        'Web Audio is unavailable in this browser. Audio feedback is disabled.'
    }
  }

  getStatus(): AudioFeedbackStatus {
    return {
      supported: this.audioContextFactory !== null,
      enabled: this.enabled,
      playingThinking: this.thinkingOscillator !== null,
      ...(this.message ? { message: this.message } : {}),
    }
  }

  playCue(cue: Exclude<AudioCue, 'thinking'>): void {
    if (!this.enabled) {
      return
    }

    const context = this.getAudioContext()

    if (!context) {
      return
    }

    const config = CUE_CONFIGS[cue]
    this.playTone(context, config)
  }

  startThinking(): void {
    if (!this.enabled || this.thinkingOscillator) {
      return
    }

    const context = this.getAudioContext()

    if (!context) {
      return
    }

    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = 280
    gain.gain.setValueAtTime(0.018, context.currentTime)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()

    this.thinkingOscillator = oscillator
  }

  stopThinking(): void {
    if (!this.thinkingOscillator) {
      return
    }

    this.thinkingOscillator.stop()
    this.thinkingOscillator = null
  }

  async destroy(): Promise<void> {
    this.enabled = false
    this.stopThinking()

    if (!this.audioContext) {
      return
    }

    await this.audioContext.close()
    this.audioContext = null
  }

  private getAudioContext(): AudioContextLike | null {
    if (!this.audioContextFactory) {
      return null
    }

    if (!this.audioContext) {
      this.audioContext = this.audioContextFactory()
    }

    return this.audioContext
  }

  private playTone(context: AudioContextLike, config: CueConfig): void {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const startTime = context.currentTime
    const endTime = startTime + config.duration

    oscillator.type = config.type
    oscillator.frequency.value = config.frequency
    gain.gain.setValueAtTime(config.gain, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, endTime)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startTime)
    oscillator.stop(endTime)
  }

  private detectAudioContextFactory(): AudioContextFactory | null {
    if (typeof window === 'undefined') {
      return null
    }

    const audioWindow = window as unknown as AudioFeedbackWindow
    const AudioContextConstructor =
      audioWindow.AudioContext ?? audioWindow.webkitAudioContext

    if (!AudioContextConstructor) {
      return null
    }

    return () => new AudioContextConstructor()
  }
}
