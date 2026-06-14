import { describe, expect, it, vi } from 'vitest'
import type {
  SpeechProvider,
  SpeechProviderStatus,
  SpeechTranscriptEvent,
  TranscriptListener,
} from './SpeechProvider'
import type { TtsProvider, TtsProviderStatus } from './TtsProvider'
import { SpeechOrchestrator } from './SpeechOrchestrator'

class FakeSpeechProvider implements SpeechProvider {
  private listener: TranscriptListener | null = null
  unsubscribe = vi.fn()

  getStatus(): SpeechProviderStatus {
    return {
      mode: 'text-fallback',
      state: 'idle',
      supported: true,
    }
  }

  start(): void {
    return undefined
  }

  stop(): void {
    return undefined
  }

  subscribe(listener: TranscriptListener): () => void {
    this.listener = listener
    return this.unsubscribe
  }

  destroy(): void {
    return undefined
  }

  emit(text: string): void {
    const event: SpeechTranscriptEvent = {
      id: `fake-${text}`,
      text,
      isFinal: true,
      source: 'text-fallback',
    }

    this.listener?.(event)
  }
}

class FakeTtsProvider implements TtsProvider {
  speak = vi.fn()
  cancel = vi.fn()

  getStatus(): TtsProviderStatus {
    return {
      state: 'idle',
      supported: true,
    }
  }
}

function createOrchestrator() {
  const speechProvider = new FakeSpeechProvider()
  const ttsProvider = new FakeTtsProvider()
  const onTranscript = vi.fn()
  const onInterruption = vi.fn()
  const orchestrator = new SpeechOrchestrator({
    speechProvider,
    ttsProvider,
    onTranscript,
    onInterruption,
  })

  return {
    orchestrator,
    speechProvider,
    ttsProvider,
    onTranscript,
    onInterruption,
  }
}

describe('SpeechOrchestrator', () => {
  it('speaks a pending plan summary through TTS', () => {
    const { orchestrator, ttsProvider } = createOrchestrator()

    orchestrator.speakPendingPlan('将创建用户注册登录流程图，请确认。')

    expect(ttsProvider.speak).toHaveBeenCalledWith(
      '将创建用户注册登录流程图，请确认。',
    )
  })

  it('cancels TTS when final transcript contains an interruption phrase', () => {
    const { speechProvider, ttsProvider, onInterruption } = createOrchestrator()

    speechProvider.emit('等等，先别执行')

    expect(ttsProvider.cancel).toHaveBeenCalledTimes(1)
    expect(onInterruption).toHaveBeenCalledWith({
      reason: 'barge-in',
      transcript: '等等，先别执行',
    })
  })

  it('forwards non-interruption transcripts to the normal callback', () => {
    const { speechProvider, onTranscript, onInterruption, ttsProvider } =
      createOrchestrator()

    speechProvider.emit('加一个短信验证码步骤')

    expect(onTranscript).toHaveBeenCalledWith({
      id: 'fake-加一个短信验证码步骤',
      text: '加一个短信验证码步骤',
      isFinal: true,
      source: 'text-fallback',
    })
    expect(onInterruption).not.toHaveBeenCalled()
    expect(ttsProvider.cancel).not.toHaveBeenCalled()
  })

  it('uses interruption phrases for cancellation and modification', () => {
    const { speechProvider, onInterruption, ttsProvider } = createOrchestrator()

    speechProvider.emit('修改一下，不要数据库')
    speechProvider.emit('取消')

    expect(ttsProvider.cancel).toHaveBeenCalledTimes(2)
    expect(onInterruption).toHaveBeenCalledTimes(2)
  })

  it('unsubscribes from speech provider and cancels TTS on destroy', () => {
    const { orchestrator, speechProvider, ttsProvider } = createOrchestrator()

    orchestrator.destroy()

    expect(speechProvider.unsubscribe).toHaveBeenCalledTimes(1)
    expect(ttsProvider.cancel).toHaveBeenCalledTimes(1)
  })
})
