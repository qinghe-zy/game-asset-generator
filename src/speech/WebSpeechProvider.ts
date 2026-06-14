import type {
  SpeechProvider,
  SpeechProviderStatus,
  SpeechTranscriptEvent,
  TranscriptListener,
} from './SpeechProvider'

interface WebSpeechRecognitionResult {
  isFinal: boolean
  0: {
    transcript: string
  }
}

interface WebSpeechRecognitionResultEvent {
  resultIndex: number
  results: ArrayLike<WebSpeechRecognitionResult>
}

interface WebSpeechRecognitionErrorEvent {
  error?: string
  message?: string
}

interface WebSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: WebSpeechRecognitionResultEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}

type WebSpeechRecognitionConstructor = new () => WebSpeechRecognition

interface BrowserSpeechWindow extends Window {
  SpeechRecognition?: WebSpeechRecognitionConstructor
  webkitSpeechRecognition?: WebSpeechRecognitionConstructor
}

export interface WebSpeechProviderOptions {
  speechRecognitionConstructor?: WebSpeechRecognitionConstructor | null
  lang?: string
}

export class WebSpeechProvider implements SpeechProvider {
  private listeners = new Set<TranscriptListener>()
  private recognition: WebSpeechRecognition | null
  private state: SpeechProviderStatus['state']
  private message: string | undefined
  private eventCounter = 0
  private destroyed = false

  constructor(options: WebSpeechProviderOptions = {}) {
    const Recognition =
      'speechRecognitionConstructor' in options
        ? options.speechRecognitionConstructor
        : this.detectRecognitionConstructor()

    if (!Recognition) {
      this.recognition = null
      this.state = 'unsupported'
      this.message =
        'Web Speech recognition is unavailable in this browser. Use text fallback instead.'
      return
    }

    this.recognition = new Recognition()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = options.lang ?? 'zh-CN'
    this.recognition.onresult = (event) => this.handleResult(event)
    this.recognition.onerror = (event) => this.handleError(event)
    this.recognition.onend = () => this.handleEnd()
    this.state = 'idle'
  }

  getStatus(): SpeechProviderStatus {
    return {
      mode: 'web-speech',
      state: this.state,
      supported: this.recognition !== null,
      ...(this.message ? { message: this.message } : {}),
    }
  }

  start(): void {
    if (!this.recognition || this.destroyed) {
      return
    }

    this.message = undefined
    this.state = 'listening'
    this.recognition.start()
  }

  stop(): void {
    if (!this.recognition || this.destroyed) {
      return
    }

    this.state = 'idle'
    this.recognition.stop()
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

  destroy(): void {
    this.destroyed = true
    this.listeners.clear()

    if (!this.recognition) {
      return
    }

    this.recognition.onresult = null
    this.recognition.onerror = null
    this.recognition.onend = null
    this.recognition.abort()
    this.state = 'idle'
  }

  private detectRecognitionConstructor():
    | WebSpeechRecognitionConstructor
    | null {
    if (typeof window === 'undefined') {
      return null
    }

    const speechWindow = window as BrowserSpeechWindow

    return (
      speechWindow.SpeechRecognition ??
      speechWindow.webkitSpeechRecognition ??
      null
    )
  }

  private handleResult(event: WebSpeechRecognitionResultEvent): void {
    if (this.destroyed) {
      return
    }

    for (let index = event.resultIndex; index < event.results.length; index++) {
      const result = event.results[index]

      if (!result?.isFinal) {
        continue
      }

      const transcript = result[0]?.transcript.trim()

      if (!transcript) {
        continue
      }

      this.emit({
        id: `web-speech-${++this.eventCounter}`,
        text: transcript,
        isFinal: true,
        source: 'web-speech',
      })
    }
  }

  private handleError(event: WebSpeechRecognitionErrorEvent): void {
    if (this.destroyed) {
      return
    }

    const detail = event.error || event.message || 'unknown'
    this.state = 'error'
    this.message = `Speech recognition error: ${detail}`
  }

  private handleEnd(): void {
    if (this.destroyed || this.state === 'error') {
      return
    }

    this.state = 'idle'
  }

  private emit(event: SpeechTranscriptEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}
