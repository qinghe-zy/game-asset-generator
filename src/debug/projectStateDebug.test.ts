import { afterEach, describe, expect, it } from 'vitest'
import { clearProjectStateDebug, registerProjectStateDebug } from './projectStateDebug'
import { createProjectState } from '../state/projectState'
import type { ProjectState } from '../state/projectState'

declare global {
  interface Window {
    getProjectState?: () => ProjectState
  }
}

afterEach(() => {
  clearProjectStateDebug()
})

describe('projectStateDebug', () => {
  it('registers a window getter in test mode', () => {
    const state = createProjectState('debug demo')

    const cleanup = registerProjectStateDebug(() => state)

    expect(window.getProjectState?.()).toBe(state)
    cleanup()
    expect(window.getProjectState).toBeUndefined()
  })

  it('replaces an existing debug getter and clears only the active getter', () => {
    const first = createProjectState('first')
    const second = createProjectState('second')

    const cleanupFirst = registerProjectStateDebug(() => first)
    const cleanupSecond = registerProjectStateDebug(() => second)

    expect(window.getProjectState?.()).toBe(second)
    cleanupFirst()
    expect(window.getProjectState?.()).toBe(second)
    cleanupSecond()
    expect(window.getProjectState).toBeUndefined()
  })
})
