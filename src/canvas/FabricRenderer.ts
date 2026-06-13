import { Circle, Polygon, Rect, Textbox } from 'fabric'
import type { CanvasElement, ShapeElement, TextElement } from '../state/elements'
import type { ProjectState } from '../state/projectState'

export interface RenderableFabricCanvas<TObject> {
  getObjects(): TObject[]
  add(...objects: TObject[]): void
  remove(...objects: TObject[]): void
  requestRenderAll(): void
}

export interface FabricObjectFactory<TObject> {
  rect(props: Record<string, unknown>): TObject
  circle(props: Record<string, unknown>): TObject
  polygon(
    points: Array<{ x: number; y: number }>,
    props: Record<string, unknown>,
  ): TObject
  textbox(text: string, props: Record<string, unknown>): TObject
}

export type FabricTaggedObject = object & {
  elementId?: unknown
}

const defaultFactory: FabricObjectFactory<FabricTaggedObject> = {
  rect: (props) => new Rect(props) as FabricTaggedObject,
  circle: (props) => new Circle(props) as FabricTaggedObject,
  polygon: (points, props) => new Polygon(points, props) as FabricTaggedObject,
  textbox: (text, props) => new Textbox(text, props) as FabricTaggedObject,
}

export function renderProjectStateToFabric<TObject extends FabricTaggedObject>(
  canvas: RenderableFabricCanvas<TObject>,
  state: ProjectState,
  factory: FabricObjectFactory<TObject> = defaultFactory as FabricObjectFactory<TObject>,
): void {
  const previousObjects = canvas
    .getObjects()
    .filter((object) => Boolean(object.elementId))

  if (previousObjects.length > 0) {
    canvas.remove(...previousObjects)
  }

  const nextObjects = state.elementOrder
    .map((elementId) => state.elements[elementId])
    .filter((element): element is CanvasElement => Boolean(element))
    .flatMap((element) => createObjectsForElement(element, factory))

  if (nextObjects.length > 0) {
    canvas.add(...nextObjects)
  }

  canvas.requestRenderAll()
}

function createObjectsForElement<TObject extends FabricTaggedObject>(
  element: CanvasElement,
  factory: FabricObjectFactory<TObject>,
): TObject[] {
  if (element.kind === 'shape') {
    return [createShapeObject(element, factory)]
  }

  if (element.kind === 'text') {
    return [createTextObject(element, factory)]
  }

  return []
}

function createShapeObject<TObject extends FabricTaggedObject>(
  element: ShapeElement,
  factory: FabricObjectFactory<TObject>,
): TObject {
  const baseProps = {
    elementId: element.id,
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    fill: element.style?.fill ?? '#ffffff',
    stroke: element.style?.stroke ?? '#171717',
    strokeWidth: element.style?.strokeWidth ?? 1,
    objectCaching: false,
  }

  if (element.shape === 'circle') {
    const diameter = Math.min(element.width, element.height)

    return factory.circle({
      ...baseProps,
      width: diameter,
      height: diameter,
      radius: diameter / 2,
    })
  }

  if (element.shape === 'diamond') {
    return factory.polygon(
      [
        { x: element.x + element.width / 2, y: element.y },
        { x: element.x + element.width, y: element.y + element.height / 2 },
        { x: element.x + element.width / 2, y: element.y + element.height },
        { x: element.x, y: element.y + element.height / 2 },
      ],
      {
        elementId: element.id,
        fill: baseProps.fill,
        stroke: baseProps.stroke,
        strokeWidth: baseProps.strokeWidth,
        objectCaching: false,
      },
    )
  }

  return factory.rect({
    ...baseProps,
    rx: hasRoundedCorners(element) ? 12 : 0,
    ry: hasRoundedCorners(element) ? 12 : 0,
  })
}

function hasRoundedCorners(element: ShapeElement): boolean {
  return element.shape === 'rounded-rect' || element.shape === 'sticky-note'
}

function createTextObject<TObject extends FabricTaggedObject>(
  element: TextElement,
  factory: FabricObjectFactory<TObject>,
): TObject {
  return factory.textbox(element.text, {
    elementId: element.id,
    left: element.x,
    top: element.y,
    width: element.width,
    fill: element.style?.textColor ?? '#171717',
    fontSize: element.style?.fontSize ?? 16,
    fontWeight: element.style?.fontWeight ?? 'normal',
    objectCaching: false,
  })
}
