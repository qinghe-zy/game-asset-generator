import type {
  SpeechProvider,
  SpeechTranscriptEvent,
} from './SpeechProvider'
import type { TtsProvider } from './TtsProvider'

export interface SpeechInterruptionEvent {
  reason: 'barge-in'
  transcript: string
}

export interface SpeechOrchestratorOptions {
  speechProvider: SpeechProvider
  ttsProvider: TtsProvider
  onTranscript: (event: SpeechTranscriptEvent) => void
  onInterruption: (event: SpeechInterruptionEvent) => void
  interruptionPhrases?: string[]
}

const DEFAULT_INTERRUPTION_PHRASES = [
  '等等',
  '停',
  '取消',
  '先别执行',
  '修改一下',
]

export class SpeechOrchestrator {
  private readonly speechProvider: SpeechProvider
  private readonly ttsProvider: TtsProvider
  private readonly onTranscript: (event: SpeechTranscriptEvent) => void
  private readonly onInterruption: (event: SpeechInterruptionEvent) => void
  private readonly interruptionPhrases: string[]
  private readonly unsubscribe: () => void
  private destroyed = false

  constructor(options: SpeechOrchestratorOptions) {
    this.speechProvider = options.speechProvider
    this.ttsProvider = options.ttsProvider
    this.onTranscript = options.onTranscript
    this.onInterruption = options.onInterruption
    this.interruptionPhrases =
      options.interruptionPhrases ?? DEFAULT_INTERRUPTION_PHRASES
    this.unsubscribe = this.speechProvider.subscribe((event) =>
      this.handleTranscript(event),
    )
  }

  speakPendingPlan(summary: string): void {
    if (this.destroyed) {
      return
    }

    this.ttsProvider.speak(summary)
  }

  destroy(): void {
    if (this.destroyed) {
      return
    }

    this.destroyed = true
    this.unsubscribe()
    this.ttsProvider.cancel()
  }

  private handleTranscript(event: SpeechTranscriptEvent): void {
    if (this.destroyed) {
      return
    }

    if (event.isFinal && this.isInterruption(event.text)) {
      const transcript = event.text.trim()
      this.ttsProvider.cancel()
      this.onInterruption({
        reason: 'barge-in',
        transcript,
      })
      return
    }

    this.onTranscript(event)
  }

  private isInterruption(text: string): boolean {
    const transcript = text.trim()

    if (!transcript) {
      return false
    }

    return this.interruptionPhrases.some((phrase) =>
      transcript.includes(phrase),
    )
  }
}
