import { describe, expect, it, vi } from 'vitest'
import { BrowserAudioFeedback } from './AudioFeedback'

class FakeOscillator {
  frequency = { value: 0 }
  type = ''
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class FakeGain {
  gain = {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  }
  connect = vi.fn()
}

class FakeAudioContext {
  currentTime = 10
  destination = {}
  oscillators: FakeOscillator[] = []
  gains: FakeGain[] = []
  closed = false

  createOscillator(): FakeOscillator {
    const oscillator = new FakeOscillator()
    this.oscillators.push(oscillator)
    return oscillator
  }

  createGain(): FakeGain {
    const gain = new FakeGain()
    this.gains.push(gain)
    return gain
  }

  close(): Promise<void> {
    this.closed = true
    return Promise.resolve()
  }
}

function createAudioFeedback(options?: { enabled?: boolean }) {
  const context = new FakeAudioContext()
  const feedback = new BrowserAudioFeedback({
    audioContextFactory: () => context,
    enabled: options?.enabled,
  })

  return { feedback, context }
}

describe('BrowserAudioFeedback', () => {
  it('reports unsupported status when no audio context factory exists', () => {
    const feedback = new BrowserAudioFeedback({
      audioContextFactory: null,
    })

    expect(feedback.getStatus()).toMatchObject({
      supported: false,
      enabled: true,
      playingThinking: false,
    })
  })

  it('does nothing when disabled', () => {
    const { feedback, context } = createAudioFeedback({ enabled: false })

    feedback.playCue('success')

    expect(context.oscillators).toHaveLength(0)
    expect(feedback.getStatus()).toMatchObject({
      supported: true,
      enabled: false,
    })
  })

  it('plays one-shot cues with generated tones', () => {
    const { feedback, context } = createAudioFeedback()

    feedback.playCue('microphone')
    feedback.playCue('success')
    feedback.playCue('error')
    feedback.playCue('confirmation')
    feedback.playCue('interruption')

    expect(context.oscillators).toHaveLength(5)
    expect(context.gains).toHaveLength(5)
    expect(context.oscillators.every((oscillator) => oscillator.start)).toBe(
      true,
    )
    expect(context.oscillators[0]?.stop).toHaveBeenCalled()
  })

  it('starts and stops a looped thinking cue', () => {
    const { feedback, context } = createAudioFeedback()

    feedback.startThinking()

    expect(feedback.getStatus()).toMatchObject({ playingThinking: true })
    expect(context.oscillators).toHaveLength(1)

    feedback.stopThinking()

    expect(feedback.getStatus()).toMatchObject({ playingThinking: false })
    expect(context.oscillators[0]?.stop).toHaveBeenCalledTimes(1)
  })

  it('does not start duplicate thinking loops', () => {
    const { feedback, context } = createAudioFeedback()

    feedback.startThinking()
    feedback.startThinking()

    expect(context.oscillators).toHaveLength(1)
  })

  it('destroys feedback by stopping thinking and closing the context', async () => {
    const { feedback, context } = createAudioFeedback()

    feedback.startThinking()
    await feedback.destroy()

    expect(context.oscillators[0]?.stop).toHaveBeenCalledTimes(1)
    expect(context.closed).toBe(true)
    expect(feedback.getStatus()).toMatchObject({
      enabled: false,
      playingThinking: false,
    })
  })
})
