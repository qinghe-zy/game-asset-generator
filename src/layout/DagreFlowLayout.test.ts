import { describe, expect, it } from 'vitest'
import { DagreFlowLayoutEngine } from './DagreFlowLayout'
import type { LayoutNode } from './LayoutEngine'

const node = (
  id: string,
  width = 120,
  height = 64,
  x?: number,
  y?: number,
  manualLocked = false,
): LayoutNode => ({
  id,
  label: id,
  width,
  height,
  x,
  y,
  manualLocked,
})

describe('DagreFlowLayoutEngine', () => {
  it('positions directed flow nodes from left to right', () => {
    const engine = new DagreFlowLayoutEngine({ rankdir: 'LR' })

    const result = engine.layout({
      nodes: [node('start'), node('process'), node('end')],
      connectors: [
        { id: 'edge_start_process', fromId: 'start', toId: 'process' },
        { id: 'edge_process_end', fromId: 'process', toId: 'end' },
      ],
    })

    const byId = Object.fromEntries(
      result.positions.map((position) => [position.id, position]),
    )

    expect(byId.process!.x).toBeGreaterThan(byId.start!.x)
    expect(byId.end!.x).toBeGreaterThan(byId.process!.x)
    expect(result.connectors).toEqual([
      { id: 'edge_start_process', fromId: 'start', toId: 'process' },
      { id: 'edge_process_end', fromId: 'process', toId: 'end' },
    ])
  })

  it('does not mutate nodes or connectors', () => {
    const engine = new DagreFlowLayoutEngine()
    const nodes = [node('start'), node('end')]
    const connectors = [{ id: 'edge', fromId: 'start', toId: 'end' }]
    const before = JSON.stringify({ nodes, connectors })

    engine.layout({ nodes, connectors })

    expect(JSON.stringify({ nodes, connectors })).toBe(before)
  })

  it('preserves manual-locked node positions', () => {
    const engine = new DagreFlowLayoutEngine({ rankdir: 'LR' })

    const result = engine.layout({
      nodes: [node('fixed', 120, 64, 300, 220, true), node('next')],
      connectors: [{ id: 'edge', fromId: 'fixed', toId: 'next' }],
    })

    expect(result.positions.find((position) => position.id === 'fixed')).toEqual(
      {
        id: 'fixed',
        x: 300,
        y: 220,
      },
    )
  })

  it('uses grid fallback when dagre layout fails', () => {
    const engine = new DagreFlowLayoutEngine({
      fallbackColumns: 1,
      createGraph: () => {
        throw new Error('dagre unavailable')
      },
    })

    const result = engine.layout({
      nodes: [node('alpha'), node('beta')],
      connectors: [{ id: 'edge', fromId: 'alpha', toId: 'beta' }],
    })

    expect(result.positions).toEqual([
      { id: 'alpha', x: 80, y: 80 },
      { id: 'beta', x: 80, y: 216 },
    ])
  })
})
