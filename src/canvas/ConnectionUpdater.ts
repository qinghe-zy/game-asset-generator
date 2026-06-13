import type {
  CanvasElement,
  ConnectorElement,
  ElementStyle,
  ShapeElement,
} from '../state/elements'
import type { ProjectState } from '../state/projectState'

export interface ConnectorRenderModel {
  id: string
  from: Point
  to: Point
  label?: string
  labelPosition: Point
  style: ElementStyle
}

export interface Point {
  x: number
  y: number
}

interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

type ConnectableElement = Exclude<CanvasElement, ConnectorElement>

export function calculateConnectorRenderModels(
  state: ProjectState,
): ConnectorRenderModel[] {
  return state.elementOrder
    .map((elementId) => state.elements[elementId])
    .filter((element): element is ConnectorElement => element?.kind === 'connector')
    .flatMap((connectorElement) => {
      const fromElement = state.elements[connectorElement.fromId]
      const toElement = state.elements[connectorElement.toId]

      if (!isConnectableElement(fromElement) || !isConnectableElement(toElement)) {
        return []
      }

      const fromCenter = getElementCenter(fromElement)
      const toCenter = getElementCenter(toElement)
      const from = getAnchorPoint(fromElement, toCenter)
      const to = getAnchorPoint(toElement, fromCenter)

      return [
        {
          id: connectorElement.id,
          from,
          to,
          label: connectorElement.label,
          labelPosition: midpoint(from, to),
          style: connectorElement.style ?? {},
        },
      ]
    })
}

function isConnectableElement(
  element: CanvasElement | undefined,
): element is ConnectableElement {
  return Boolean(element && element.kind !== 'connector')
}

function getAnchorPoint(element: ConnectableElement, target: Point): Point {
  if (element.kind === 'shape' && element.shape === 'circle') {
    return getCircleAnchor(element, target)
  }

  return getBoxAnchor(getElementBounds(element), target)
}

function getCircleAnchor(element: ShapeElement, target: Point): Point {
  const center = getElementCenter(element)
  const radius = Math.min(element.width, element.height) / 2
  const dx = target.x - center.x
  const dy = target.y - center.y
  const distance = Math.hypot(dx, dy)

  if (distance === 0) {
    return { x: center.x + radius, y: center.y }
  }

  return {
    x: center.x + (dx / distance) * radius,
    y: center.y + (dy / distance) * radius,
  }
}

function getBoxAnchor(bounds: Bounds, target: Point): Point {
  const center = getBoundsCenter(bounds)
  const dx = target.x - center.x
  const dy = target.y - center.y

  if (dx === 0 && dy === 0) {
    return { x: bounds.x + bounds.width, y: center.y }
  }

  const halfWidth = bounds.width / 2
  const halfHeight = bounds.height / 2
  const scale = Math.min(
    dx === 0 ? Number.POSITIVE_INFINITY : Math.abs(halfWidth / dx),
    dy === 0 ? Number.POSITIVE_INFINITY : Math.abs(halfHeight / dy),
  )

  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  }
}

function getElementBounds(element: ConnectableElement): Bounds {
  if (element.kind === 'shape' || element.kind === 'group') {
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    }
  }

  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.style?.fontSize ?? 16,
  }
}

function getElementCenter(element: ConnectableElement): Point {
  return getBoundsCenter(getElementBounds(element))
}

function getBoundsCenter(bounds: Bounds): Point {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
}

function midpoint(from: Point, to: Point): Point {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  }
}
