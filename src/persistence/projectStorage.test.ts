import { beforeEach, describe, expect, it } from 'vitest'
import { addElement, createProjectState } from '../state/projectState'
import {
  loadStoredProjectState,
  PROJECT_STORAGE_KEY,
  saveProjectState,
} from './projectStorage'

describe('projectStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and restores a ProjectState from localStorage', () => {
    const state = addElement(createProjectState('Autosaved demo'), {
      id: 'node-1',
      kind: 'shape',
      shape: 'rounded-rect',
      label: '登录',
      x: 80,
      y: 120,
      width: 160,
      height: 72,
      meta: {
        source: 'agent',
        createdAt: 1,
        updatedAt: 1,
      },
    })

    saveProjectState(state)

    expect(loadStoredProjectState()).toMatchObject({
      id: state.id,
      title: 'Autosaved demo',
      elementOrder: ['node-1'],
    })
  })

  it('returns null when stored JSON is invalid or does not match ProjectState', () => {
    localStorage.setItem(PROJECT_STORAGE_KEY, '{bad json')
    expect(loadStoredProjectState()).toBeNull()

    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify({ title: 'bad' }))
    expect(loadStoredProjectState()).toBeNull()
  })
})
