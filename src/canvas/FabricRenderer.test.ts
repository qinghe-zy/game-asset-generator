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
  renderRole?: string
  type?: string
  text?: string
  linePoints?: [number, number, number, number]
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

const labeledConnector = (
  id: string,
  fromId: string,
  toId: string,
  label: string,
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

const group = (id = 'group'): GroupElement => ({
  id,
  kind: 'group',
  label: 'Frontend group',
  x: 70,
  y: 72,
  width: 310,
  height: 170,
  style: {
    fill: '#f8fafc',
    stroke: '#cbd5e1',
    strokeWidth: 1,
    textColor: '#475569',
    fontSize: 13,
  },
  meta,
})

const createFakeFactory = () => {
  const factory: FabricObjectFactory<FakeObject> = {
    line: (linePoints, props) => ({
      elementId: String(props.elementId),
      renderRole: String(props.renderRole),
      type: 'line',
      linePoints,
      props,
    }),
    rect: (props) => ({
      elementId: String(props.elementId),
      renderRole: String(props.renderRole),
      type: 'rect',
      props,
    }),
    circle: (props) => ({
      elementId: String(props.elementId),
      renderRole: String(props.renderRole),
      type: 'circle',
      props,
    }),
    polygon: (points, props) => ({
      elementId: String(props.elementId),
      renderRole: String(props.renderRole),
      type: 'polygon',
      points,
      props,
    }),
    textbox: (textValue, props) => ({
      elementId: String(props.elementId),
      renderRole: String(props.renderRole),
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

  it('renders logical groups as background rectangles and separate titles before children', () => {
    const groupedShape = {
      ...shape('child', 'rounded-rect', 120, 120),
      parentId: 'group',
    }
    const state = [group(), groupedShape, text('label')].reduce(
      (current, element) => addElement(current, element),
      createProjectState('demo'),
    )
    const canvas = createFakeCanvas()

    renderProjectStateToFabric(canvas, state, createFakeFactory())

    expect(canvas.added.map((item) => item.type)).toEqual([
      'rect',
      'textbox',
      'rect',
      'textbox',
    ])
    expect(canvas.added.map((item) => item.props.renderRole)).toEqual([
      'group-background',
      'group-title',
      undefined,
      undefined,
    ])
    expect(canvas.added[0].props).toMatchObject({
      elementId: 'group',
      renderRole: 'group-background',
      left: 70,
      top: 72,
      width: 310,
      height: 170,
      fill: '#f8fafc',
      stroke: '#cbd5e1',
      strokeWidth: 1,
    })
    expect(canvas.added[1].props).toMatchObject({
      elementId: 'group',
      renderRole: 'group-title',
      left: 82,
      top: 82,
      width: 286,
      fill: '#475569',
      fontSize: 13,
    })
    expect(canvas.added[1].text).toBe('Frontend group')
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

  it('renders connectors as line objects with optional labels', () => {
    const state = [
      shape('a', 'rounded-rect', 100, 100),
      shape('b', 'rounded-rect', 280, 100),
      labeledConnector('edge', 'a', 'b', 'opens'),
    ].reduce(
      (current, element) => addElement(current, element),
      createProjectState('demo'),
    )
    const canvas = createFakeCanvas()

    renderProjectStateToFabric(canvas, state, createFakeFactory())

    expect(canvas.added.map((item) => item.type)).toEqual([
      'rect',
      'rect',
      'line',
      'textbox',
    ])
    expect(canvas.added[2].linePoints).toEqual([260, 140, 280, 140])
    expect(canvas.added[2].props).toMatchObject({
      elementId: 'edge',
      renderRole: 'connector-line',
      stroke: '#64748b',
      strokeWidth: 2,
    })
    expect(canvas.added[3].text).toBe('opens')
    expect(canvas.added[3].props).toMatchObject({
      elementId: 'edge',
      renderRole: 'connector-label',
      left: 270,
      top: 140,
    })
  })
})
