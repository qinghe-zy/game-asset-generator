import { describe, expect, it } from 'vitest'
import { GridLayoutEngine } from './GridLayout'
import type { LayoutNode } from './LayoutEngine'

const node = (
  id: string,
  width = 120,
  height = 64,
  label = id,
): LayoutNode => ({
  id,
  label,
  width,
  height,
})

const boxesOverlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y

describe('GridLayoutEngine', () => {
  it('places nodes in deterministic grid order without overlap', () => {
    const engine = new GridLayoutEngine({
      columns: 2,
      startX: 10,
      startY: 20,
      columnGap: 30,
      rowGap: 40,
    })
    const nodes = [
      node('alpha', 100, 50),
      node('beta', 120, 60),
      node('gamma', 90, 70),
    ]

    const result = engine.layout({ nodes, connectors: [] })

    expect(result.positions.map((position) => position.id)).toEqual([
      'alpha',
      'beta',
      'gamma',
    ])
    expect(result.positions[0]).toMatchObject({ id: 'alpha', x: 10, y: 20 })
    expect(result.positions[1]?.x).toBeGreaterThan(
      result.positions[0]!.x + nodes[0]!.width,
    )
    expect(result.positions[2]?.y).toBeGreaterThan(
      result.positions[0]!.y + nodes[0]!.height,
    )

    const placed = result.positions.map((position) => ({
      ...position,
      width: nodes.find((item) => item.id === position.id)!.width,
      height: nodes.find((item) => item.id === position.id)!.height,
    }))

    for (let index = 0; index < placed.length; index += 1) {
      for (
        let nextIndex = index + 1;
        nextIndex < placed.length;
        nextIndex += 1
      ) {
        expect(boxesOverlap(placed[index]!, placed[nextIndex]!)).toBe(false)
      }
    }
  })

  it('does not mutate layout input', () => {
    const engine = new GridLayoutEngine()
    const nodes = [node('alpha')]
    const connectors = [{ id: 'edge', fromId: 'alpha', toId: 'beta' }]
    const before = JSON.stringify({ nodes, connectors })

    engine.layout({ nodes, connectors })

    expect(JSON.stringify({ nodes, connectors })).toBe(before)
  })

  it('accepts connectors while positioning only nodes', () => {
    const engine = new GridLayoutEngine()

    const result = engine.layout({
      nodes: [node('alpha'), node('beta')],
      connectors: [{ id: 'edge', fromId: 'alpha', toId: 'beta' }],
    })

    expect(result.positions).toHaveLength(2)
    expect(result.connectors).toEqual([
      { id: 'edge', fromId: 'alpha', toId: 'beta' },
    ])
  })

  it('returns an empty result for an empty canvas', () => {
    const engine = new GridLayoutEngine()

    const result = engine.layout({ nodes: [], connectors: [] })

    expect(result.positions).toEqual([])
    expect(result.connectors).toEqual([])
  })
})
