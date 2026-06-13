import type { CanvasElement } from '../state/elements'
import type { ProjectState } from '../state/projectState'

export interface ResolverViewport {
  x: number
  y: number
  width: number
  height: number
}

export interface EntityResolverContext {
  recentElementIds?: string[]
  viewport?: ResolverViewport
}

export type EntityResolutionResult =
  | { status: 'resolved'; elementId: string; score: number }
  | { status: 'ambiguous'; candidates: string[] }
  | { status: 'missing' }

const AMBIGUITY_MARGIN = 10
const GENERIC_NODE_WORDS = ['节点', '方块', '图形', '元素', '这个']

export function resolveEntity(
  query: string,
  state: ProjectState,
  context: EntityResolverContext = {},
): EntityResolutionResult {
  const normalizedQuery = normalize(query)
  const candidates = Object.values(state.elements)
    .map((element) => ({
      id: element.id,
      score: scoreElement(element, normalizedQuery, state, context),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))

  if (candidates.length === 0) {
    return { status: 'missing' }
  }

  const [top, second] = candidates

  if (second && top.score - second.score < AMBIGUITY_MARGIN) {
    return {
      status: 'ambiguous',
      candidates: candidates
        .filter((candidate) => top.score - candidate.score < AMBIGUITY_MARGIN)
        .map((candidate) => candidate.id),
    }
  }

  return {
    status: 'resolved',
    elementId: top.id,
    score: top.score,
  }
}

function scoreElement(
  element: CanvasElement,
  normalizedQuery: string,
  state: ProjectState,
  context: EntityResolverContext,
): number {
  let score = 0
  const normalizedId = normalize(element.id)
  const normalizedLabel = normalize(element.label ?? '')
  const normalizedAliases = (element.meta.aliases ?? []).map(normalize)

  if (normalizedQuery.length > 0 && normalizedLabel === normalizedQuery) {
    score += 100
  } else if (
    normalizedQuery.length > 0 &&
    normalizedLabel.includes(normalizedQuery)
  ) {
    score += 60
  }

  if (normalizedQuery.length > 0 && normalizedId.includes(normalizedQuery)) {
    score += 50
  }

  if (normalizedAliases.includes(normalizedQuery)) {
    score += 90
  }

  if (matchesGenericKind(normalizedQuery, element)) {
    score += 20
  }

  if (state.selectedIds.includes(element.id)) {
    score += 30
  }

  if (context.recentElementIds?.includes(element.id)) {
    score += 25
  }

  if (context.viewport && isElementInViewport(element, context.viewport)) {
    score += 15
  }

  return score
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function matchesGenericKind(
  normalizedQuery: string,
  element: CanvasElement,
): boolean {
  if (!GENERIC_NODE_WORDS.some((word) => normalizedQuery.includes(word))) {
    return false
  }

  return element.kind === 'shape' || element.kind === 'text'
}

function isElementInViewport(
  element: CanvasElement,
  viewport: ResolverViewport,
): boolean {
  if (!('x' in element) || !('y' in element)) {
    return false
  }

  const width = 'width' in element ? element.width : 0
  const height = 'height' in element ? element.height : 0

  return (
    element.x + width >= viewport.x &&
    element.x <= viewport.x + viewport.width &&
    element.y + height >= viewport.y &&
    element.y <= viewport.y + viewport.height
  )
}
