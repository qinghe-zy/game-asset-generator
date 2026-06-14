export type TtsProviderState = 'idle' | 'speaking' | 'unsupported'

export interface TtsProviderStatus {
  state: TtsProviderState
  supported: boolean
  message?: string
}

export interface TtsProvider {
  getStatus(): TtsProviderStatus
  speak(text: string): void
  cancel(): void
}

interface BrowserSpeechSynthesis {
  speak(utterance: BrowserSpeechSynthesisUtterance): void
  cancel(): void
}

interface BrowserSpeechSynthesisUtterance {
  text: string
  lang: string
  onend: (() => void) | null
}

type BrowserSpeechSynthesisUtteranceConstructor = new (
  text: string,
) => BrowserSpeechSynthesisUtterance

interface BrowserTtsWindow {
  speechSynthesis?: BrowserSpeechSynthesis
  SpeechSynthesisUtterance?: BrowserSpeechSynthesisUtteranceConstructor
}

export interface BrowserTtsProviderOptions {
  synthesis?: BrowserSpeechSynthesis | null
  utteranceConstructor?: BrowserSpeechSynthesisUtteranceConstructor | null
  lang?: string
}

export class BrowserTtsProvider implements TtsProvider {
  private readonly synthesis: BrowserSpeechSynthesis | null
  private readonly Utterance: BrowserSpeechSynthesisUtteranceConstructor | null
  private readonly lang: string
  private state: TtsProviderState
  private message: string | undefined

  constructor(options: BrowserTtsProviderOptions = {}) {
    this.synthesis =
      'synthesis' in options
        ? (options.synthesis ?? null)
        : this.detectSynthesis()
    this.Utterance =
      'utteranceConstructor' in options
        ? (options.utteranceConstructor ?? null)
        : this.detectUtteranceConstructor()
    this.lang = options.lang ?? 'zh-CN'

    if (!this.synthesis || !this.Utterance) {
      this.state = 'unsupported'
      this.message =
        'Speech synthesis is unavailable in this browser. Visual confirmation remains available.'
      return
    }

    this.state = 'idle'
  }

  getStatus(): TtsProviderStatus {
    return {
      state: this.state,
      supported: this.synthesis !== null && this.Utterance !== null,
      ...(this.message ? { message: this.message } : {}),
    }
  }

  speak(text: string): void {
    if (!this.synthesis || !this.Utterance) {
      return
    }

    const speechText = text.trim()

    if (!speechText) {
      return
    }

    const utterance = new this.Utterance(speechText)
    utterance.lang = this.lang
    utterance.onend = () => {
      this.state = 'idle'
    }

    this.state = 'speaking'
    this.synthesis.speak(utterance)
  }

  cancel(): void {
    if (!this.synthesis) {
      return
    }

    this.synthesis.cancel()
    this.state = this.Utterance ? 'idle' : 'unsupported'
  }

  private detectSynthesis(): BrowserSpeechSynthesis | null {
    if (typeof window === 'undefined') {
      return null
    }

    return (window as unknown as BrowserTtsWindow).speechSynthesis ?? null
  }

  private detectUtteranceConstructor():
    | BrowserSpeechSynthesisUtteranceConstructor
    | null {
    if (typeof window === 'undefined') {
      return null
    }

    return (
      (window as unknown as BrowserTtsWindow).SpeechSynthesisUtterance ?? null
    )
  }
}
