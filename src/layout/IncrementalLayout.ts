import type {
  LayoutConnector,
  LayoutEngine,
  LayoutNode,
  LayoutPosition,
  LayoutRequest,
  LayoutResult,
} from './LayoutEngine'

export interface IncrementalLayoutOptions {
  anchorElementId?: string
  newNodeIds: string[]
  gap?: number
  stackGap?: number
}

interface Bounds {
  id: string
  x: number
  y: number
  width: number
  height: number
}

const defaultOptions = {
  gap: 40,
  stackGap: 32,
}

const cloneConnectors = (connectors: LayoutConnector[]): LayoutConnector[] =>
  connectors.map((connector) => ({ ...connector }))

export class IncrementalLayoutEngine implements LayoutEngine {
  private readonly options: Required<IncrementalLayoutOptions>
  private readonly newNodeIds: Set<string>

  constructor(options: IncrementalLayoutOptions) {
    this.options = {
      anchorElementId: options.anchorElementId ?? '',
      newNodeIds: options.newNodeIds,
      gap: options.gap ?? defaultOptions.gap,
      stackGap: options.stackGap ?? defaultOptions.stackGap,
    }
    this.newNodeIds = new Set(options.newNodeIds)
  }

  layout(request: LayoutRequest): LayoutResult {
    const positionedNodes = request.nodes.filter(this.hasPosition)
    const anchor = this.findAnchor(request.nodes, positionedNodes)
    const occupied = positionedNodes.map((node) => this.boundsFor(node))
    const positions: LayoutPosition[] = positionedNodes.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
    }))

    request.nodes
      .filter((node) => this.newNodeIds.has(node.id))
      .forEach((node, index) => {
        const position = this.positionNewNode(node, anchor, occupied, index)
        const bounds = {
          id: node.id,
          x: position.x,
          y: position.y,
          width: node.width,
          height: node.height,
        }

        positions.push(position)
        occupied.push(bounds)
      })

    return {
      positions,
      connectors: cloneConnectors(request.connectors),
    }
  }

  private hasPosition(
    node: LayoutNode,
  ): node is LayoutNode & { x: number; y: number } {
    return typeof node.x === 'number' && typeof node.y === 'number'
  }

  private findAnchor(
    nodes: LayoutNode[],
    positionedNodes: Array<LayoutNode & { x: number; y: number }>,
  ): LayoutNode & { x: number; y: number } {
    return (
      positionedNodes.find((node) => node.id === this.options.anchorElementId) ??
      positionedNodes[0] ??
      this.defaultAnchor(nodes[0])
    )
  }

  private defaultAnchor(
    node: LayoutNode | undefined,
  ): LayoutNode & { x: number; y: number } {
    return {
      id: node?.id ?? 'anchor',
      label: node?.label,
      width: node?.width ?? 120,
      height: node?.height ?? 64,
      x: 80,
      y: 80,
    }
  }

  private positionNewNode(
    node: LayoutNode,
    anchor: LayoutNode & { x: number; y: number },
    occupied: Bounds[],
    index: number,
  ): LayoutPosition {
    const rightSlot = {
      id: node.id,
      x: anchor.x + anchor.width + this.options.gap,
      y: anchor.y + index * (node.height + this.options.stackGap),
      width: node.width,
      height: node.height,
    }

    if (!this.overlapsAny(rightSlot, occupied)) {
      return { id: node.id, x: rightSlot.x, y: rightSlot.y }
    }

    let belowSlot = {
      id: node.id,
      x: anchor.x,
      y: anchor.y + anchor.height + this.options.stackGap,
      width: node.width,
      height: node.height,
    }

    while (this.overlapsAny(belowSlot, occupied)) {
      belowSlot = {
        ...belowSlot,
        y: belowSlot.y + node.height + this.options.stackGap,
      }
    }

    return { id: node.id, x: belowSlot.x, y: belowSlot.y }
  }

  private boundsFor(node: LayoutNode & { x: number; y: number }): Bounds {
    return {
      id: node.id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    }
  }

  private overlapsAny(bounds: Bounds, occupied: Bounds[]): boolean {
    return occupied.some((other) => this.overlaps(bounds, other))
  }

  private overlaps(a: Bounds, b: Bounds): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    )
  }
}
