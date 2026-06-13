import { describe, expect, it } from 'vitest'
import { calculateConnectorRenderModels } from './ConnectionUpdater'
import { addElement, createProjectState } from '../state/projectState'
import type { ConnectorElement, ShapeElement } from '../state/elements'

const meta = {
  source: 'template' as const,
  createdAt: 1,
  updatedAt: 1,
}

const shape = (
  id: string,
  x: number,
  y: number,
  shapeType: ShapeElement['shape'] = 'rounded-rect',
): ShapeElement => ({
  id,
  kind: 'shape',
  shape: shapeType,
  label: id,
  x,
  y,
  width: 100,
  height: 60,
  meta,
})

const connector = (
  id: string,
  fromId: string,
  toId: string,
  label?: string,
): ConnectorElement => ({
  id,
  kind: 'connector',
  fromId,
  toId,
  label,
  style: {
    stroke: '#64748b',
    strokeWidth: 2,
    textColor: '#334155',
    fontSize: 12,
  },
  meta,
})

describe('ConnectionUpdater', () => {
  it('calculates right-to-left anchors between rect-like elements', () => {
    const state = [
      shape('a', 100, 100),
      shape('b', 280, 100),
      connector('edge', 'a', 'b'),
    ].reduce(
      (current, element) => addElement(current, element),
      createProjectState('demo'),
    )

    const [model] = calculateConnectorRenderModels(state)

    expect(model).toMatchObject({
      id: 'edge',
      from: { x: 200, y: 130 },
      to: { x: 280, y: 130 },
      label: undefined,
      style: {
        stroke: '#64748b',
        strokeWidth: 2,
        textColor: '#334155',
        fontSize: 12,
      },
    })
    expect(model.labelPosition).toEqual({ x: 240, y: 130 })
  })

  it('projects anchors on circle edges', () => {
    const state = [
      shape('a', 100, 100, 'circle'),
      shape('b', 300, 100, 'circle'),
      connector('edge', 'a', 'b', 'next'),
    ].reduce(
      (current, element) => addElement(current, element),
      createProjectState('demo'),
    )

    const [model] = calculateConnectorRenderModels(state)

    expect(model.from.x).toBeCloseTo(180, 2)
    expect(model.from.y).toBeCloseTo(130, 2)
    expect(model.to.x).toBeCloseTo(320, 2)
    expect(model.to.y).toBeCloseTo(130, 2)
    expect(model.label).toBe('next')
    expect(model.labelPosition).toEqual({ x: 250, y: 130 })
  })

  it('skips connectors when an endpoint is missing', () => {
    const state = [shape('a', 100, 100), connector('edge', 'a', 'missing')].reduce(
      (current, element) => addElement(current, element),
      createProjectState('demo'),
    )

    expect(calculateConnectorRenderModels(state)).toEqual([])
  })
})
