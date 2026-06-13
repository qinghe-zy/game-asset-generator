import { stratify, tree } from 'd3-hierarchy'
import { GridLayoutEngine } from './GridLayout'
import type {
  LayoutConnector,
  LayoutEngine,
  LayoutNode,
  LayoutRequest,
  LayoutResult,
} from './LayoutEngine'

export interface TreeMindMapLayoutOptions {
  centerX?: number
  centerY?: number
  levelGap?: number
  siblingGap?: number
  fallbackColumns?: number
}

interface TreeDatum {
  id: string
  parentId?: string
  node: LayoutNode
}

const defaultOptions: Required<TreeMindMapLayoutOptions> = {
  centerX: 400,
  centerY: 300,
  levelGap: 220,
  siblingGap: 120,
  fallbackColumns: 3,
}

const cloneConnectors = (connectors: LayoutConnector[]): LayoutConnector[] =>
  connectors.map((connector) => ({ ...connector }))

export class TreeMindMapLayoutEngine implements LayoutEngine {
  private readonly options: Required<TreeMindMapLayoutOptions>

  constructor(options: TreeMindMapLayoutOptions = {}) {
    this.options = {
      ...defaultOptions,
      ...options,
      fallbackColumns: Math.max(
        1,
        Math.floor(options.fallbackColumns ?? defaultOptions.fallbackColumns),
      ),
    }
  }

  layout(request: LayoutRequest): LayoutResult {
    try {
      const data = request.nodes.map((node) => ({
        id: node.id,
        parentId: node.parentId,
        node,
      }))
      const root = stratify<TreeDatum>()
        .id((datum) => datum.id)
        .parentId((datum) => datum.parentId ?? null)(data)

      tree<TreeDatum>().nodeSize([
        this.options.siblingGap,
        this.options.levelGap,
      ])(root)

      return {
        positions: root.descendants().map((treeNode) => {
          const node = treeNode.data.node
          const x = this.requireCoordinate(treeNode.x, node.id, 'x')
          const y = this.requireCoordinate(treeNode.y, node.id, 'y')

          return {
            id: node.id,
            x: this.options.centerX + y - node.width / 2,
            y: this.options.centerY + x - node.height / 2,
          }
        }),
        connectors: cloneConnectors(request.connectors),
      }
    } catch {
      return new GridLayoutEngine({
        columns: this.options.fallbackColumns,
      }).layout(request)
    }
  }

  private requireCoordinate(
    value: number | undefined,
    nodeId: string,
    axis: 'x' | 'y',
  ): number {
    if (typeof value !== 'number') {
      throw new Error(`Tree layout did not return ${axis} for node: ${nodeId}`)
    }

    return value
  }
}
