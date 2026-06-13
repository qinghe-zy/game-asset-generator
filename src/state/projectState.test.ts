import { describe, expect, it } from 'vitest'
import { addElement, createProjectState, updateElement } from './projectState'
import type { ShapeElement } from './elements'

const shape = (id: string, label: string): ShapeElement => ({
  id,
  kind: 'shape',
  shape: 'rounded-rect',
  label,
  x: 0,
  y: 0,
  width: 160,
  height: 72,
  style: {
    fill: '#ffffff',
    stroke: '#2f5bea',
    textColor: '#172033',
  },
  meta: {
    source: 'template',
    createdAt: 1,
    updatedAt: 1,
  },
})

describe('ProjectState', () => {
  it('creates an empty project state', () => {
    const state = createProjectState('画布')

    expect(state.title).toBe('画布')
    expect(state.version).toBe(1)
    expect(state.elements).toEqual({})
    expect(state.elementOrder).toEqual([])
    expect(state.selectedIds).toEqual([])
  })

  it('adds an element immutably and increments version', () => {
    const state = createProjectState('画布')
    const next = addElement(state, shape('node_login', '登录'))

    expect(next).not.toBe(state)
    expect(next.version).toBe(2)
    expect(next.elements.node_login?.label).toBe('登录')
    expect(next.elementOrder).toEqual(['node_login'])
    expect(state.elementOrder).toEqual([])
  })

  it('updates an existing element immutably', () => {
    const state = addElement(createProjectState('画布'), shape('node_login', '登录'))
    const next = updateElement(state, 'node_login', {
      label: '用户登录',
      x: 120,
    })

    expect(next.version).toBe(3)
    expect(next.elements.node_login?.label).toBe('用户登录')
    expect(
      next.elements.node_login && 'x' in next.elements.node_login
        ? next.elements.node_login.x
        : undefined,
    ).toBe(120)
    expect(state.elements.node_login?.label).toBe('登录')
  })

  it('throws when updating a missing element', () => {
    const state = createProjectState('画布')

    expect(() => updateElement(state, 'missing', { label: 'x' })).toThrow(
      'Element not found: missing',
    )
  })
})
