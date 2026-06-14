import { describe, expect, it, vi } from 'vitest'
import { TextFallbackProvider } from './TextFallbackProvider'

describe('TextFallbackProvider', () => {
  it('starts in idle text fallback mode', () => {
    const provider = new TextFallbackProvider()

    expect(provider.getStatus()).toEqual({
      mode: 'text-fallback',
      state: 'idle',
      supported: true,
    })
  })

  it('emits a final transcript event for submitted text', () => {
    const provider = new TextFallbackProvider()
    const listener = vi.fn()

    provider.subscribe(listener)
    provider.submitText('  画一个用户注册登录流程图  ')

    expect(listener).toHaveBeenCalledWith({
      id: expect.stringMatching(/^text-fallback-/),
      text: '画一个用户注册登录流程图',
      isFinal: true,
      source: 'text-fallback',
    })
  })

  it('ignores empty submitted text', () => {
    const provider = new TextFallbackProvider()
    const listener = vi.fn()

    provider.subscribe(listener)
    provider.submitText('   ')

    expect(listener).not.toHaveBeenCalled()
  })

  it('updates status when started and stopped', () => {
    const provider = new TextFallbackProvider()

    provider.start()

    expect(provider.getStatus()).toMatchObject({
      mode: 'text-fallback',
      state: 'listening',
      supported: true,
    })

    provider.stop()

    expect(provider.getStatus()).toMatchObject({
      mode: 'text-fallback',
      state: 'idle',
      supported: true,
    })
  })

  it('unsubscribes individual listeners', () => {
    const provider = new TextFallbackProvider()
    const listener = vi.fn()
    const unsubscribe = provider.subscribe(listener)

    unsubscribe()
    provider.submitText('撤销')

    expect(listener).not.toHaveBeenCalled()
  })

  it('destroys all listeners and prevents future emissions', () => {
    const provider = new TextFallbackProvider()
    const listener = vi.fn()

    provider.subscribe(listener)
    provider.destroy()
    provider.submitText('重做')

    expect(listener).not.toHaveBeenCalled()
    expect(provider.getStatus()).toMatchObject({
      mode: 'text-fallback',
      state: 'idle',
      supported: true,
    })
  })
})
