import { describe, expect, it } from 'vitest'
import { TreeMindMapLayoutEngine } from './TreeMindMapLayout'
import type { LayoutNode } from './LayoutEngine'

const node = (
  id: string,
  parentId?: string,
  width = 120,
  height = 64,
): LayoutNode => ({
  id,
  label: id,
  parentId,
  width,
  height,
})

describe('TreeMindMapLayoutEngine', () => {
  it('places the root at the configured center and children outward', () => {
    const engine = new TreeMindMapLayoutEngine({
      centerX: 400,
      centerY: 300,
      levelGap: 220,
      siblingGap: 120,
    })

    const result = engine.layout({
      nodes: [
        node('root', undefined, 160, 80),
        node('left_branch', 'root'),
        node('right_branch', 'root'),
        node('leaf', 'left_branch'),
      ],
      connectors: [],
    })

    const byId = Object.fromEntries(
      result.positions.map((position) => [position.id, position]),
    )

    expect(byId.root).toEqual({ id: 'root', x: 320, y: 260 })
    expect(byId.left_branch!.x).toBeGreaterThan(byId.root!.x)
    expect(byId.right_branch!.x).toBeGreaterThan(byId.root!.x)
    expect(byId.leaf!.x).toBeGreaterThan(byId.left_branch!.x)
    expect(byId.left_branch!.y).not.toBe(byId.right_branch!.y)
  })

  it('does not mutate layout input and clones connectors', () => {
    const engine = new TreeMindMapLayoutEngine()
    const nodes = [node('root'), node('child', 'root')]
    const connectors = [{ id: 'edge', fromId: 'root', toId: 'child' }]
    const before = JSON.stringify({ nodes, connectors })

    const result = engine.layout({ nodes, connectors })

    expect(JSON.stringify({ nodes, connectors })).toBe(before)
    expect(result.connectors).toEqual(connectors)
    expect(result.connectors[0]).not.toBe(connectors[0])
  })

  it('falls back to grid layout for an invalid tree', () => {
    const engine = new TreeMindMapLayoutEngine({ fallbackColumns: 1 })

    const result = engine.layout({
      nodes: [node('orphan', 'missing_parent'), node('other_root')],
      connectors: [],
    })

    expect(result.positions).toEqual([
      { id: 'orphan', x: 80, y: 80 },
      { id: 'other_root', x: 80, y: 216 },
    ])
  })
})
