import type { ElementStyle, ShapeType } from '../state/elements'

export interface LayoutIntent {
  type: 'grid' | 'flow' | 'mindmap' | 'freeform'
  direction?: 'TB' | 'LR'
  mode: 'global' | 'incremental' | 'preserve-manual'
  anchorElementId?: string
  preserveManualPositions?: boolean
}

export interface BasePlanOperation {
  id: string
}

export interface CreateShapeOperation extends BasePlanOperation {
  type: 'create-shape'
  elementId: string
  shape: ShapeType
  label?: string
  parentId?: string
  style?: ElementStyle
}

export interface CreateTextOperation extends BasePlanOperation {
  type: 'create-text'
  elementId: string
  text: string
  label?: string
  parentId?: string
  style?: ElementStyle
}

export interface CreateGroupOperation extends BasePlanOperation {
  type: 'create-group'
  elementId: string
  label: string
  childIds?: string[]
  style?: ElementStyle
}

export interface CreateConnectorOperation extends BasePlanOperation {
  type: 'create-connector'
  elementId: string
  fromId: string
  toId: string
  label?: string
  routing?: 'straight' | 'orthogonal'
  style?: ElementStyle
}

export interface UpdateStyleOperation extends BasePlanOperation {
  type: 'update-style'
  elementId: string
  style: ElementStyle
}

export interface MoveElementOperation extends BasePlanOperation {
  type: 'move-element'
  elementId: string
  dx?: number
  dy?: number
  x?: number
  y?: number
}

export interface DeleteElementOperation extends BasePlanOperation {
  type: 'delete-element'
  elementId: string
}

export interface RelayoutRegionOperation extends BasePlanOperation {
  type: 'relayout-region'
  elementIds: string[]
  layoutIntent: LayoutIntent
}

export type PlanOperation =
  | CreateShapeOperation
  | CreateTextOperation
  | CreateGroupOperation
  | CreateConnectorOperation
  | UpdateStyleOperation
  | MoveElementOperation
  | DeleteElementOperation
  | RelayoutRegionOperation

export interface AgentPlan {
  id: string
  summary: string
  requiresConfirmation: boolean
  operations: PlanOperation[]
  layoutIntent: LayoutIntent
  speechFeedback: string
  riskFlags?: string[]
  fallbackReason?: string | null
}
