import { describe, expect, it, vi } from 'vitest'
import { WebSpeechProvider } from './WebSpeechProvider'

class FakeSpeechRecognition {
  continuous = false
  interimResults = false
  lang = ''
  onend: (() => void) | null = null
  onerror: ((event: { error?: string; message?: string }) => void) | null = null
  onresult: ((event: {
    results: ArrayLike<{
      isFinal: boolean
      0: { transcript: string }
    }>
    resultIndex: number
  }) => void) | null = null
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()
}

function createProvider() {
  const recognitions: FakeSpeechRecognition[] = []
  class Provider extends FakeSpeechRecognition {
    constructor() {
      super()
      recognitions.push(this)
    }
  }

  const provider = new WebSpeechProvider({
    speechRecognitionConstructor: Provider,
  })

  const recognition = recognitions[0]

  if (!recognition) {
    throw new Error('Expected fake recognition to be created')
  }

  return { provider, recognition }
}

describe('WebSpeechProvider', () => {
  it('reports unsupported status when no recognition constructor exists', () => {
    const provider = new WebSpeechProvider({
      speechRecognitionConstructor: null,
    })

    expect(provider.getStatus()).toMatchObject({
      mode: 'web-speech',
      state: 'unsupported',
      supported: false,
    })
  })

  it('starts in idle web speech mode when recognition is available', () => {
    const { provider } = createProvider()

    expect(provider.getStatus()).toEqual({
      mode: 'web-speech',
      state: 'idle',
      supported: true,
    })
  })

  it('starts and stops the browser recognizer', () => {
    const { provider, recognition } = createProvider()

    provider.start()

    expect(recognition.start).toHaveBeenCalledTimes(1)
    expect(provider.getStatus()).toMatchObject({ state: 'listening' })

    provider.stop()

    expect(recognition.stop).toHaveBeenCalledTimes(1)
    expect(provider.getStatus()).toMatchObject({ state: 'idle' })
  })

  it('emits final transcript events from recognition results', () => {
    const { provider, recognition } = createProvider()
    const listener = vi.fn()

    provider.subscribe(listener)
    recognition.onresult?.({
      resultIndex: 0,
      results: [
        {
          isFinal: true,
          0: { transcript: '  画一个复杂的服务架构图  ' },
        },
      ],
    })

    expect(listener).toHaveBeenCalledWith({
      id: expect.stringMatching(/^web-speech-/),
      text: '画一个复杂的服务架构图',
      isFinal: true,
      source: 'web-speech',
    })
  })

  it('ignores interim or empty recognition results', () => {
    const { provider, recognition } = createProvider()
    const listener = vi.fn()

    provider.subscribe(listener)
    recognition.onresult?.({
      resultIndex: 0,
      results: [
        {
          isFinal: false,
          0: { transcript: '临时内容' },
        },
        {
          isFinal: true,
          0: { transcript: '   ' },
        },
      ],
    })

    expect(listener).not.toHaveBeenCalled()
  })

  it('moves to error state when recognition reports an error', () => {
    const { provider, recognition } = createProvider()

    recognition.onerror?.({ error: 'network' })

    expect(provider.getStatus()).toEqual({
      mode: 'web-speech',
      state: 'error',
      supported: true,
      message: 'Speech recognition error: network',
    })
  })

  it('destroys recognition handlers and prevents future transcript emissions', () => {
    const { provider, recognition } = createProvider()
    const listener = vi.fn()

    provider.subscribe(listener)
    provider.destroy()

    expect(recognition.abort).toHaveBeenCalledTimes(1)
    expect(recognition.onresult).toBeNull()
    expect(recognition.onerror).toBeNull()
    expect(recognition.onend).toBeNull()
  })
})
