import { describe, expect, it, vi } from 'vitest'
import { BrowserTtsProvider } from './TtsProvider'

class FakeUtterance {
  text: string
  lang = ''
  onend: (() => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

function createSynthesis() {
  return {
    speak: vi.fn(),
    cancel: vi.fn(),
  }
}

describe('BrowserTtsProvider', () => {
  it('reports unsupported status when browser synthesis is unavailable', () => {
    const provider = new BrowserTtsProvider({
      synthesis: null,
      utteranceConstructor: null,
    })

    expect(provider.getStatus()).toMatchObject({
      state: 'unsupported',
      supported: false,
    })
  })

  it('speaks text through browser synthesis', () => {
    const synthesis = createSynthesis()
    const provider = new BrowserTtsProvider({
      synthesis,
      utteranceConstructor: FakeUtterance,
    })

    provider.speak('请确认：创建用户登录流程图')

    expect(synthesis.speak).toHaveBeenCalledTimes(1)
    const utterance = synthesis.speak.mock.calls[0]?.[0] as FakeUtterance
    expect(utterance.text).toBe('请确认：创建用户登录流程图')
    expect(utterance.lang).toBe('zh-CN')
    expect(provider.getStatus()).toMatchObject({
      state: 'speaking',
      supported: true,
    })
  })

  it('ignores empty text', () => {
    const synthesis = createSynthesis()
    const provider = new BrowserTtsProvider({
      synthesis,
      utteranceConstructor: FakeUtterance,
    })

    provider.speak('   ')

    expect(synthesis.speak).not.toHaveBeenCalled()
    expect(provider.getStatus()).toMatchObject({ state: 'idle' })
  })

  it('cancels current speech', () => {
    const synthesis = createSynthesis()
    const provider = new BrowserTtsProvider({
      synthesis,
      utteranceConstructor: FakeUtterance,
    })

    provider.speak('准备执行计划')
    provider.cancel()

    expect(synthesis.cancel).toHaveBeenCalledTimes(1)
    expect(provider.getStatus()).toMatchObject({ state: 'idle' })
  })

  it('returns to idle when utterance ends', () => {
    const synthesis = createSynthesis()
    const provider = new BrowserTtsProvider({
      synthesis,
      utteranceConstructor: FakeUtterance,
    })

    provider.speak('执行完成')
    const utterance = synthesis.speak.mock.calls[0]?.[0] as FakeUtterance
    utterance.onend?.()

    expect(provider.getStatus()).toMatchObject({ state: 'idle' })
  })
})
