export type SpeechProviderMode = 'text-fallback' | 'web-speech'

export type SpeechProviderState =
  | 'idle'
  | 'listening'
  | 'unsupported'
  | 'error'

export interface SpeechProviderStatus {
  mode: SpeechProviderMode
  state: SpeechProviderState
  supported: boolean
  message?: string
}

export interface SpeechTranscriptEvent {
  id: string
  text: string
  isFinal: boolean
  source: SpeechProviderMode
}

export type TranscriptListener = (event: SpeechTranscriptEvent) => void

export interface SpeechProvider {
  getStatus(): SpeechProviderStatus
  start(): void
  stop(): void
  subscribe(listener: TranscriptListener): () => void
  destroy(): void
}
