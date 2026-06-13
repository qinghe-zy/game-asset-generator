import { describe, expect, it } from 'vitest'
import { resolveEntity } from './EntityResolver'
import { addElement, createProjectState, selectElements } from '../state/projectState'
import type { ProjectState } from '../state/projectState'
import type { ShapeElement } from '../state/elements'

const node = (
  id: string,
  label: string,
  options: {
    aliases?: string[]
    x?: number
    y?: number
    fill?: string
  } = {},
): ShapeElement => ({
  id,
  kind: 'shape',
  shape: 'rounded-rect',
  label,
  x: options.x ?? 0,
  y: options.y ?? 0,
  width: 120,
  height: 60,
  style: {
    fill: options.fill ?? '#ffffff',
  },
  meta: {
    aliases: options.aliases,
    source: 'template',
    createdAt: 1,
    updatedAt: 1,
  },
})

const withNodes = (...elements: ShapeElement[]): ProjectState =>
  elements.reduce(
    (state, element) => addElement(state, element),
    createProjectState('画布'),
  )

describe('EntityResolver', () => {
  it('resolves an exact label match', () => {
    const state = withNodes(
      node('node_database', '数据库'),
      node('node_backend', '后端服务'),
    )

    const result = resolveEntity('数据库', state)

    expect(result.status).toBe('resolved')
    expect(result.status === 'resolved' ? result.elementId : undefined).toBe(
      'node_database',
    )
  })

  it('resolves an alias match', () => {
    const state = withNodes(
      node('node_cache', 'Redis', { aliases: ['缓存', 'cache'] }),
      node('node_database', '数据库'),
    )

    const result = resolveEntity('缓存', state)

    expect(result.status).toBe('resolved')
    expect(result.status === 'resolved' ? result.elementId : undefined).toBe(
      'node_cache',
    )
  })

  it('prefers a selected element for a generic shape reference', () => {
    const state = selectElements(
      withNodes(node('node_left', '左侧节点'), node('node_right', '右侧节点')),
      ['node_right'],
    )

    const result = resolveEntity('这个节点', state)

    expect(result.status).toBe('resolved')
    expect(result.status === 'resolved' ? result.elementId : undefined).toBe(
      'node_right',
    )
  })

  it('prefers a recent element when labels are otherwise similar', () => {
    const state = withNodes(node('node_a', '服务'), node('node_b', '服务'))

    const result = resolveEntity('服务', state, {
      recentElementIds: ['node_b'],
    })

    expect(result.status).toBe('resolved')
    expect(result.status === 'resolved' ? result.elementId : undefined).toBe(
      'node_b',
    )
  })

  it('prefers an element visible in the current viewport', () => {
    const state = withNodes(
      node('node_visible', '服务', { x: 50, y: 50 }),
      node('node_offscreen', '服务', { x: 2000, y: 50 }),
    )

    const result = resolveEntity('服务', state, {
      viewport: { x: 0, y: 0, width: 800, height: 600 },
    })

    expect(result.status).toBe('resolved')
    expect(result.status === 'resolved' ? result.elementId : undefined).toBe(
      'node_visible',
    )
  })

  it('returns ambiguous when top candidates are too close', () => {
    const state = withNodes(node('node_a', '服务A'), node('node_b', '服务B'))

    const result = resolveEntity('服务', state)

    expect(result.status).toBe('ambiguous')
    expect(result.status === 'ambiguous' ? result.candidates : []).toEqual([
      'node_a',
      'node_b',
    ])
  })

  it('returns missing when no candidate scores', () => {
    const state = withNodes(node('node_database', '数据库'))

    const result = resolveEntity('短信网关', state)

    expect(result.status).toBe('missing')
  })
})
