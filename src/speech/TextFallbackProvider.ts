import type {
  SpeechProvider,
  SpeechProviderStatus,
  SpeechTranscriptEvent,
  TranscriptListener,
} from './SpeechProvider'

export class TextFallbackProvider implements SpeechProvider {
  private listeners = new Set<TranscriptListener>()
  private state: SpeechProviderStatus['state'] = 'idle'
  private eventCounter = 0
  private destroyed = false

  getStatus(): SpeechProviderStatus {
    return {
      mode: 'text-fallback',
      state: this.state,
      supported: true,
    }
  }

  start(): void {
    if (this.destroyed) {
      return
    }

    this.state = 'listening'
  }

  stop(): void {
    this.state = 'idle'
  }

  subscribe(listener: TranscriptListener): () => void {
    if (this.destroyed) {
      return () => undefined
    }

    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  submitText(text: string): void {
    if (this.destroyed) {
      return
    }

    const transcript = text.trim()

    if (!transcript) {
      return
    }

    this.emit({
      id: `text-fallback-${++this.eventCounter}`,
      text: transcript,
      isFinal: true,
      source: 'text-fallback',
    })
  }

  destroy(): void {
    this.listeners.clear()
    this.state = 'idle'
    this.destroyed = true
  }

  private emit(event: SpeechTranscriptEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}
