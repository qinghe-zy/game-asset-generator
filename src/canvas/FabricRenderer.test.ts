import { describe, expect, it } from 'vitest'
import { renderProjectStateToFabric } from './FabricRenderer'
import { addElement, createProjectState } from '../state/projectState'
import type {
  ConnectorElement,
  GroupElement,
  ShapeElement,
  TextElement,
} from '../state/elements'
import type {
  FabricObjectFactory,
  FabricTaggedObject,
  RenderableFabricCanvas,
} from './FabricRenderer'

interface FakeObject {
  elementId?: string
  type?: string
  text?: string
  points?: Array<{ x: number; y: number }>
  props: Record<string, unknown>
}

const meta = {
  source: 'template' as const,
  createdAt: 1,
  updatedAt: 1,
}

const shape = (
  id: string,
  shapeType: ShapeElement['shape'],
  x = 100,
  y = 120,
): ShapeElement => ({
  id,
  kind: 'shape',
  shape: shapeType,
  label: id,
  x,
  y,
  width: 160,
  height: 80,
  style: {
    fill: '#fff7d6',
    stroke: '#2f2f2f',
    strokeWidth: 2,
  },
  meta,
})

const text = (id: string): TextElement => ({
  id,
  kind: 'text',
  text: 'Hello canvas',
  x: 280,
  y: 180,
  width: 220,
  style: {
    textColor: '#111111',
    fontSize: 18,
    fontWeight: 'bold',
  },
  meta,
})

const connector = (): ConnectorElement => ({
  id: 'edge',
  kind: 'connector',
  fromId: 'a',
  toId: 'b',
  meta,
})

const group = (): GroupElement => ({
  id: 'group',
  kind: 'group',
  label: 'Group',
  x: 80,
  y: 90,
  width: 300,
  height: 200,
  meta,
})

const createFakeFactory = () => {
  const factory: FabricObjectFactory<FakeObject> = {
    rect: (props) => ({
      elementId: String(props.elementId),
      type: 'rect',
      props,
    }),
    circle: (props) => ({
      elementId: String(props.elementId),
      type: 'circle',
      props,
    }),
    polygon: (points, props) => ({
      elementId: String(props.elementId),
      type: 'polygon',
      points,
      props,
    }),
    textbox: (textValue, props) => ({
      elementId: String(props.elementId),
      type: 'textbox',
      text: textValue,
      props,
    }),
  }

  return factory
}

const createFakeCanvas = (): RenderableFabricCanvas<FakeObject> & {
  added: FakeObject[]
  removed: FakeObject[]
  rendered?: boolean
} => ({
  added: [],
  removed: [],
  getObjects() {
    return [{ elementId: 'old', props: {} }]
  },
  add(...objects) {
    this.added.push(...objects)
  },
  remove(...objects) {
    this.removed.push(...objects)
  },
  requestRenderAll() {
    this.rendered = true
  },
})

describe('FabricRenderer', () => {
  it('renders supported shape and text elements with element IDs', () => {
    const state = [
      shape('rect', 'rect'),
      shape('round', 'rounded-rect'),
      shape('circle', 'circle'),
      shape('diamond', 'diamond'),
      shape('cylinder', 'cylinder'),
      shape('note', 'sticky-note'),
      text('title'),
    ].reduce(
      (current, element) => addElement(current, element),
      createProjectState('demo'),
    )
    const canvas = createFakeCanvas()

    renderProjectStateToFabric(canvas, state, createFakeFactory())

    expect(canvas.removed.map((item) => item.elementId)).toEqual(['old'])
    expect(canvas.added.map((item) => item.type)).toEqual([
      'rect',
      'rect',
      'circle',
      'polygon',
      'rect',
      'rect',
      'textbox',
    ])
    expect(canvas.added.map((item) => item.props.elementId)).toEqual([
      'rect',
      'round',
      'circle',
      'diamond',
      'cylinder',
      'note',
      'title',
    ])
  })

  it('skips connector and group elements for later renderer PRs', () => {
    const state = [shape('rect', 'rect'), connector(), group()].reduce(
      (current, element) => addElement(current, element),
      createProjectState('demo'),
    )
    const canvas = createFakeCanvas()

    renderProjectStateToFabric(canvas, state, createFakeFactory())

    expect(canvas.added).toHaveLength(1)
    expect(canvas.added[0].props.elementId).toBe('rect')
  })

  it('uses global coordinates and style defaults', () => {
    const state = addElement(
      createProjectState('demo'),
      shape('rect', 'rect', 40, 50),
    )
    const canvas = createFakeCanvas()

    renderProjectStateToFabric(canvas, state, createFakeFactory())

    expect(canvas.added[0].props).toMatchObject({
      elementId: 'rect',
      left: 40,
      top: 50,
      width: 160,
      height: 80,
      fill: '#fff7d6',
      stroke: '#2f2f2f',
      strokeWidth: 2,
    })
  })

  it('tags real Fabric objects with source element IDs', () => {
    const state = addElement(createProjectState('demo'), shape('rect', 'rect'))
    const canvas = createFakeCanvas() as RenderableFabricCanvas<FabricTaggedObject> & {
      added: FabricTaggedObject[]
      removed: FabricTaggedObject[]
    }

    renderProjectStateToFabric(canvas, state)

    expect(canvas.added[0].elementId).toBe('rect')
  })
})
