export interface LayoutNode {
  id: string
  label?: string
  width: number
  height: number
  x?: number
  y?: number
  parentId?: string
  manualLocked?: boolean
}

export interface LayoutConnector {
  id: string
  fromId: string
  toId: string
  label?: string
}

export interface LayoutRequest {
  nodes: LayoutNode[]
  connectors: LayoutConnector[]
}

export interface LayoutPosition {
  id: string
  x: number
  y: number
}

export interface LayoutResult {
  positions: LayoutPosition[]
  connectors: LayoutConnector[]
}

export interface LayoutEngine {
  layout(request: LayoutRequest): LayoutResult
}
