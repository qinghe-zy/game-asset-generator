export type ElementKind = 'shape' | 'text' | 'connector' | 'group'

export type ElementSource = 'agent' | 'voice-command' | 'template'

export interface ElementStyle {
  fill?: string
  stroke?: string
  textColor?: string
  strokeWidth?: number
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
}

export interface ElementMeta {
  aliases?: string[]
  source: ElementSource
  createdAt: number
  updatedAt: number
}

export interface BaseElement {
  id: string
  kind: ElementKind
  label?: string
  locked?: boolean
  manualLocked?: boolean
  parentId?: string
  style?: ElementStyle
  meta: ElementMeta
}

export type ShapeType =
  | 'rect'
  | 'rounded-rect'
  | 'circle'
  | 'diamond'
  | 'cylinder'
  | 'sticky-note'

export interface ShapeElement extends BaseElement {
  kind: 'shape'
  shape: ShapeType
  x: number
  y: number
  width: number
  height: number
}

export interface TextElement extends BaseElement {
  kind: 'text'
  text: string
  x: number
  y: number
  width: number
}

export interface ConnectorElement extends BaseElement {
  kind: 'connector'
  fromId: string
  toId: string
  routing?: 'straight' | 'orthogonal'
}

export interface GroupElement extends BaseElement {
  kind: 'group'
  x: number
  y: number
  width: number
  height: number
}

export type CanvasElement =
  | ShapeElement
  | TextElement
  | ConnectorElement
  | GroupElement
