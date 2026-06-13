import { createMacroCommand, type Command } from '../commands/CommandManager'
import { DagreFlowLayoutEngine } from '../layout/DagreFlowLayout'
import { GridLayoutEngine } from '../layout/GridLayout'
import { IncrementalLayoutEngine } from '../layout/IncrementalLayout'
import type {
  LayoutConnector,
  LayoutEngine,
  LayoutNode,
  LayoutRequest,
} from '../layout/LayoutEngine'
import { TreeMindMapLayoutEngine } from '../layout/TreeMindMapLayout'
import type {
  CanvasElement,
  ConnectorElement,
  GroupElement,
  ShapeElement,
  TextElement,
} from '../state/elements'
import {
  addElement,
  removeElement,
  updateElement,
  type ProjectState,
} from '../state/projectState'
import type {
  AgentPlan,
  CreateConnectorOperation,
  CreateGroupOperation,
  CreateShapeOperation,
  CreateTextOperation,
  LayoutIntent,
  MoveElementOperation,
  PlanOperation,
  RelayoutRegionOperation,
} from './AgentPlan'
import { validateAgentPlan } from './PlanValidator'

export interface CommandBuilderOptions {
  layoutEngine?: LayoutEngine
  existingElementIds?: string[]
  timestamp?: number
}

const DEFAULT_SHAPE_SIZE = {
  width: 160,
  height: 72,
}

const SHAPE_SIZES: Partial<
  Record<CreateShapeOperation['shape'], { width: number; height: number }>
> = {
  circle: { width: 96, height: 96 },
  diamond: { width: 140, height: 88 },
  'sticky-note': { width: 160, height: 120 },
}

const GROUP_SIZE = {
  width: 560,
  height: 260,
}

const TEXT_SIZE = {
  width: 220,
}

export function buildPlanCommand(
  plan: AgentPlan,
  options: CommandBuilderOptions = {},
): Command {
  const validation = validateAgentPlan(plan, {
    existingElementIds: options.existingElementIds,
  })

  if (!validation.ok) {
    throw new Error(`Invalid AgentPlan: ${validation.errors.join('; ')}`)
  }

  return createMacroCommand(`execute-${plan.id}`, plan.summary, [
    {
      id: `apply-${plan.id}`,
      label: plan.summary,
      apply: (state) => applyPlan(state, validation.plan, options),
    },
  ])
}

function applyPlan(
  state: ProjectState,
  plan: AgentPlan,
  options: CommandBuilderOptions,
): ProjectState {
  const timestamp = options.timestamp ?? Date.now()
  const drafts = createDraftElements(plan.operations, timestamp)
  const layoutEngine =
    options.layoutEngine ??
    layoutEngineFor(plan.layoutIntent, layoutNodeIdsFromDrafts(drafts))
  const positionedDrafts = applyLayout(drafts, layoutEngine)

  return plan.operations.reduce(
    (currentState, operation) =>
      applyOperation(currentState, operation, positionedDrafts, options, timestamp),
    state,
  )
}

function applyOperation(
  state: ProjectState,
  operation: PlanOperation,
  drafts: Map<string, CanvasElement>,
  options: CommandBuilderOptions,
  timestamp: number,
): ProjectState {
  switch (operation.type) {
    case 'create-shape':
    case 'create-text':
    case 'create-group':
    case 'create-connector':
      return addElement(state, requireDraft(drafts, operation.elementId))
    case 'update-style':
      return updateElement(state, operation.elementId, { style: operation.style })
    case 'move-element':
      return updateElement(state, operation.elementId, movePatch(state, operation, timestamp))
    case 'delete-element':
      return removeElement(state, operation.elementId)
    case 'relayout-region':
      return relayoutRegion(
        state,
        operation,
        options.layoutEngine ??
          layoutEngineFor(operation.layoutIntent, operation.elementIds),
      )
  }
}

function createDraftElements(
  operations: PlanOperation[],
  timestamp: number,
): Map<string, CanvasElement> {
  const drafts = new Map<string, CanvasElement>()

  for (const operation of operations) {
    switch (operation.type) {
      case 'create-shape':
        drafts.set(operation.elementId, createShape(operation, timestamp))
        break
      case 'create-text':
        drafts.set(operation.elementId, createText(operation, timestamp))
        break
      case 'create-group':
        drafts.set(operation.elementId, createGroup(operation, timestamp))
        break
      case 'create-connector':
        drafts.set(operation.elementId, createConnector(operation, timestamp))
        break
      case 'update-style':
      case 'move-element':
      case 'delete-element':
      case 'relayout-region':
        break
    }
  }

  return drafts
}

function createShape(
  operation: CreateShapeOperation,
  timestamp: number,
): ShapeElement {
  const size = SHAPE_SIZES[operation.shape] ?? DEFAULT_SHAPE_SIZE

  return {
    id: operation.elementId,
    kind: 'shape',
    shape: operation.shape,
    label: operation.label,
    parentId: operation.parentId,
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    style: operation.style,
    meta: createMeta(timestamp),
  }
}

function createText(
  operation: CreateTextOperation,
  timestamp: number,
): TextElement {
  return {
    id: operation.elementId,
    kind: 'text',
    text: operation.text,
    label: operation.label,
    parentId: operation.parentId,
    x: 0,
    y: 0,
    width: TEXT_SIZE.width,
    style: operation.style,
    meta: createMeta(timestamp),
  }
}

function createGroup(
  operation: CreateGroupOperation,
  timestamp: number,
): GroupElement {
  return {
    id: operation.elementId,
    kind: 'group',
    label: operation.label,
    x: 0,
    y: 0,
    width: GROUP_SIZE.width,
    height: GROUP_SIZE.height,
    style: operation.style,
    meta: createMeta(timestamp),
  }
}

function createConnector(
  operation: CreateConnectorOperation,
  timestamp: number,
): ConnectorElement {
  return {
    id: operation.elementId,
    kind: 'connector',
    label: operation.label,
    fromId: operation.fromId,
    toId: operation.toId,
    routing: operation.routing,
    style: operation.style,
    meta: createMeta(timestamp),
  }
}

function createMeta(timestamp: number) {
  return {
    source: 'agent' as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function applyLayout(
  drafts: Map<string, CanvasElement>,
  layoutEngine: LayoutEngine,
): Map<string, CanvasElement> {
  const request = layoutRequestFromDrafts(drafts)
  const result = layoutEngine.layout(request)
  const positionedDrafts = new Map(drafts)

  for (const position of result.positions) {
    const draft = positionedDrafts.get(position.id)

    if (draft && isPositionedElement(draft)) {
      positionedDrafts.set(draft.id, {
        ...draft,
        x: position.x,
        y: position.y,
      })
    }
  }

  return fitGroupsAroundChildren(positionedDrafts)
}

function layoutRequestFromDrafts(
  drafts: Map<string, CanvasElement>,
): LayoutRequest {
  const elements = [...drafts.values()]

  return {
    nodes: elements.filter(isLayoutElement).map(layoutNodeFromElement),
    connectors: elements.filter(isConnector).map(layoutConnectorFromElement),
  }
}

function layoutEngineFor(intent: LayoutIntent, nodeIds: string[]): LayoutEngine {
  if (intent.mode === 'incremental') {
    return new IncrementalLayoutEngine({
      anchorElementId: intent.anchorElementId,
      newNodeIds: nodeIds,
    })
  }

  switch (intent.type) {
    case 'flow':
      return new DagreFlowLayoutEngine({
        rankdir: intent.direction ?? 'LR',
      })
    case 'mindmap':
      return new TreeMindMapLayoutEngine()
    case 'grid':
    case 'freeform':
      return new GridLayoutEngine()
  }
}

function layoutNodeIdsFromDrafts(drafts: Map<string, CanvasElement>): string[] {
  return [...drafts.values()].filter(isLayoutElement).map((element) => element.id)
}

function fitGroupsAroundChildren(
  drafts: Map<string, CanvasElement>,
): Map<string, CanvasElement> {
  const fittedDrafts = new Map(drafts)

  for (const element of drafts.values()) {
    if (element.kind !== 'group') {
      continue
    }

    const children = [...drafts.values()].filter(
      (child): child is ShapeElement | TextElement | GroupElement =>
        isPositionedElement(child) && child.parentId === element.id,
    )

    if (children.length === 0) {
      continue
    }

    const padding = 40
    const minX = Math.min(...children.map((child) => child.x))
    const minY = Math.min(...children.map((child) => child.y))
    const maxX = Math.max(...children.map((child) => child.x + child.width))
    const maxY = Math.max(
      ...children.map((child) => child.y + ('height' in child ? child.height : DEFAULT_SHAPE_SIZE.height)),
    )

    fittedDrafts.set(element.id, {
      ...element,
      x: minX - padding,
      y: minY - padding,
      width: Math.max(GROUP_SIZE.width, maxX - minX + padding * 2),
      height: Math.max(GROUP_SIZE.height, maxY - minY + padding * 2),
    })
  }

  return fittedDrafts
}

function movePatch(
  state: ProjectState,
  operation: MoveElementOperation,
  timestamp: number,
) {
  const element = state.elements[operation.elementId]

  if (!element || !isPositionedElement(element)) {
    throw new Error(`Element cannot be moved: ${operation.elementId}`)
  }

  return {
    x: operation.x ?? element.x + (operation.dx ?? 0),
    y: operation.y ?? element.y + (operation.dy ?? 0),
    meta: {
      ...element.meta,
      updatedAt: timestamp,
    },
  }
}

function relayoutRegion(
  state: ProjectState,
  operation: RelayoutRegionOperation,
  layoutEngine: LayoutEngine,
): ProjectState {
  const elements = operation.elementIds.map((id) => state.elements[id]).filter(Boolean)
  const request: LayoutRequest = {
    nodes: elements.filter(isLayoutElement).map(layoutNodeFromElement),
    connectors: elements.filter(isConnector).map(layoutConnectorFromElement),
  }
  const result = layoutEngine.layout(request)

  return result.positions.reduce((currentState, position) => {
    const element = currentState.elements[position.id]

    if (!element || !isPositionedElement(element)) {
      return currentState
    }

    return updateElement(currentState, element.id, {
      x: position.x,
      y: position.y,
    })
  }, state)
}

function requireDraft(
  drafts: Map<string, CanvasElement>,
  elementId: string,
): CanvasElement {
  const draft = drafts.get(elementId)

  if (!draft) {
    throw new Error(`Missing draft element: ${elementId}`)
  }

  return draft
}

function layoutNodeFromElement(element: ShapeElement | TextElement | GroupElement): LayoutNode {
  return {
    id: element.id,
    label: element.label,
    width: element.width,
    height: 'height' in element ? element.height : DEFAULT_SHAPE_SIZE.height,
    x: element.x,
    y: element.y,
    parentId: element.parentId,
    manualLocked: element.manualLocked,
  }
}

function layoutConnectorFromElement(element: ConnectorElement): LayoutConnector {
  return {
    id: element.id,
    fromId: element.fromId,
    toId: element.toId,
    label: element.label,
  }
}

function isLayoutElement(
  element: CanvasElement,
): element is ShapeElement | TextElement | GroupElement {
  return element.kind === 'shape' || element.kind === 'text' || element.kind === 'group'
}

function isPositionedElement(
  element: CanvasElement,
): element is ShapeElement | TextElement | GroupElement {
  return isLayoutElement(element)
}

function isConnector(element: CanvasElement): element is ConnectorElement {
  return element.kind === 'connector'
}
