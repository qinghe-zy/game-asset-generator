import { describe, expect, it } from 'vitest'
import { IncrementalLayoutEngine } from './IncrementalLayout'
import type { LayoutNode } from './LayoutEngine'

const node = (
  id: string,
  x: number | undefined,
  y: number | undefined,
  width = 120,
  height = 64,
  manualLocked = false,
): LayoutNode => ({
  id,
  label: id,
  x,
  y,
  width,
  height,
  manualLocked,
})

describe('IncrementalLayoutEngine', () => {
  it('places a new node to the right of the anchor', () => {
    const engine = new IncrementalLayoutEngine({
      anchorElementId: 'anchor',
      newNodeIds: ['new_node'],
      gap: 40,
    })

    const result = engine.layout({
      nodes: [node('anchor', 100, 120), node('new_node', undefined, undefined)],
      connectors: [{ id: 'edge', fromId: 'anchor', toId: 'new_node' }],
    })

    expect(result.positions).toEqual([
      { id: 'anchor', x: 100, y: 120 },
      { id: 'new_node', x: 260, y: 120 },
    ])
    expect(result.connectors).toEqual([
      { id: 'edge', fromId: 'anchor', toId: 'new_node' },
    ])
  })

  it('keeps existing and manual-locked positions unchanged', () => {
    const engine = new IncrementalLayoutEngine({
      anchorElementId: 'anchor',
      newNodeIds: ['new_node'],
    })

    const result = engine.layout({
      nodes: [
        node('anchor', 100, 120, 120, 64, true),
        node('existing', 500, 320),
        node('new_node', undefined, undefined),
      ],
      connectors: [],
    })

    expect(result.positions).toContainEqual({ id: 'anchor', x: 100, y: 120 })
    expect(result.positions).toContainEqual({ id: 'existing', x: 500, y: 320 })
  })

  it('moves the new node below when the right-side slot overlaps', () => {
    const engine = new IncrementalLayoutEngine({
      anchorElementId: 'anchor',
      newNodeIds: ['new_node'],
      gap: 40,
      stackGap: 32,
    })

    const result = engine.layout({
      nodes: [
        node('anchor', 100, 120),
        node('blocker', 260, 120),
        node('new_node', undefined, undefined),
      ],
      connectors: [],
    })

    expect(result.positions.find((position) => position.id === 'new_node')).toEqual(
      { id: 'new_node', x: 100, y: 216 },
    )
  })

  it('uses the first positioned node when the anchor is missing', () => {
    const engine = new IncrementalLayoutEngine({
      anchorElementId: 'missing',
      newNodeIds: ['new_node'],
      gap: 40,
    })

    const result = engine.layout({
      nodes: [
        node('fallback_anchor', 80, 90),
        node('new_node', undefined, undefined),
      ],
      connectors: [],
    })

    expect(result.positions.find((position) => position.id === 'new_node')).toEqual(
      { id: 'new_node', x: 240, y: 90 },
    )
  })

  it('does not mutate input nodes or connectors', () => {
    const engine = new IncrementalLayoutEngine({
      anchorElementId: 'anchor',
      newNodeIds: ['new_node'],
    })
    const nodes = [node('anchor', 100, 120), node('new_node', undefined, undefined)]
    const connectors = [{ id: 'edge', fromId: 'anchor', toId: 'new_node' }]
    const before = JSON.stringify({ nodes, connectors })

    engine.layout({ nodes, connectors })

    expect(JSON.stringify({ nodes, connectors })).toBe(before)
  })
})
