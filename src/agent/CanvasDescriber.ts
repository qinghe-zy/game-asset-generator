import type {
  CanvasElement,
  ConnectorElement,
  GroupElement,
} from '../state/elements'
import type { ProjectState } from '../state/projectState'

export interface CanvasNodeSummary {
  id: string
  kind: CanvasElement['kind']
  label: string
  parentId?: string
}

export interface CanvasGroupSummary {
  id: string
  label: string
  nodes: string[]
}

export interface CanvasRelationSummary {
  id: string
  from: string
  to: string
  label?: string
}

export interface CanvasSummary {
  title: string
  version: number
  elementCount: number
  nodes: CanvasNodeSummary[]
  groups: CanvasGroupSummary[]
  relations: CanvasRelationSummary[]
  selectedIds: string[]
  recentChanges: string[]
  truncatedNodeCount: number
}

export interface CanvasDescriberOptions {
  maxNodes?: number
  recentChanges?: string[]
}

const DEFAULT_MAX_NODES = 25

export function describeCanvas(
  state: ProjectState,
  options: CanvasDescriberOptions = {},
): CanvasSummary {
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES
  const elements = state.elementOrder
    .map((id) => state.elements[id])
    .filter((element): element is CanvasElement => Boolean(element))
  const describableNodes = elements.filter(
    (element) => element.kind !== 'connector' && element.kind !== 'group',
  )
  const nodes = describableNodes.slice(0, maxNodes).map(summarizeNode)

  return {
    title: state.title,
    version: state.version,
    elementCount: elements.length,
    nodes,
    groups: elements.filter(isGroup).map((group) => summarizeGroup(group, state)),
    relations: elements.filter(isConnector).map((connector) =>
      summarizeRelation(connector, state),
    ),
    selectedIds: [...state.selectedIds],
    recentChanges: options.recentChanges ?? [],
    truncatedNodeCount: Math.max(0, describableNodes.length - nodes.length),
  }
}

function summarizeNode(element: CanvasElement): CanvasNodeSummary {
  return {
    id: element.id,
    kind: element.kind,
    label: getElementLabel(element),
    parentId: element.parentId,
  }
}

function summarizeGroup(
  group: GroupElement,
  state: ProjectState,
): CanvasGroupSummary {
  return {
    id: group.id,
    label: getElementLabel(group),
    nodes: state.elementOrder
      .map((id) => state.elements[id])
      .filter(
        (element): element is CanvasElement =>
          Boolean(element) &&
          element.parentId === group.id &&
          element.kind !== 'connector',
      )
      .map(getElementLabel),
  }
}

function summarizeRelation(
  connector: ConnectorElement,
  state: ProjectState,
): CanvasRelationSummary {
  const relation: CanvasRelationSummary = {
    id: connector.id,
    from: getElementLabel(state.elements[connector.fromId]),
    to: getElementLabel(state.elements[connector.toId]),
  }

  if (connector.label) {
    relation.label = connector.label
  }

  return relation
}

function getElementLabel(element: CanvasElement | undefined): string {
  return element?.label || element?.id || 'unknown'
}

function isGroup(element: CanvasElement): element is GroupElement {
  return element.kind === 'group'
}

function isConnector(element: CanvasElement): element is ConnectorElement {
  return element.kind === 'connector'
}
