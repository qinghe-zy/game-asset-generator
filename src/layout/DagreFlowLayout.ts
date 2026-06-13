import { Graph, layout } from '@dagrejs/dagre'
import { GridLayoutEngine } from './GridLayout'
import type {
  LayoutConnector,
  LayoutEngine,
  LayoutNode,
  LayoutRequest,
  LayoutResult,
} from './LayoutEngine'

export type DagreRankDirection = 'TB' | 'BT' | 'LR' | 'RL'

export interface DagreFlowLayoutOptions {
  rankdir?: DagreRankDirection
  nodesep?: number
  ranksep?: number
  fallbackColumns?: number
  createGraph?: () => Graph
}

interface DagrePosition {
  x?: number
  y?: number
}

const defaultOptions: Required<Omit<DagreFlowLayoutOptions, 'createGraph'>> = {
  rankdir: 'LR',
  nodesep: 80,
  ranksep: 120,
  fallbackColumns: 3,
}

const cloneConnectors = (connectors: LayoutConnector[]): LayoutConnector[] =>
  connectors.map((connector) => ({ ...connector }))

export class DagreFlowLayoutEngine implements LayoutEngine {
  private readonly options: Required<Omit<DagreFlowLayoutOptions, 'createGraph'>>
  private readonly createGraph: () => Graph

  constructor(options: DagreFlowLayoutOptions = {}) {
    this.options = {
      ...defaultOptions,
      ...options,
      fallbackColumns: Math.max(
        1,
        Math.floor(options.fallbackColumns ?? defaultOptions.fallbackColumns),
      ),
    }
    this.createGraph = options.createGraph ?? (() => new Graph())
  }

  layout(request: LayoutRequest): LayoutResult {
    try {
      const graph = this.createGraph()
      graph.setGraph({
        rankdir: this.options.rankdir,
        nodesep: this.options.nodesep,
        ranksep: this.options.ranksep,
      })
      graph.setDefaultEdgeLabel(() => ({}))

      request.nodes.forEach((node) => {
        graph.setNode(node.id, {
          label: node.label ?? node.id,
          width: node.width,
          height: node.height,
        })
      })

      request.connectors.forEach((connector) => {
        graph.setEdge(connector.fromId, connector.toId)
      })

      layout(graph)

      return {
        positions: request.nodes.map((node) =>
          this.positionForNode(node, graph.node(node.id) as DagrePosition),
        ),
        connectors: cloneConnectors(request.connectors),
      }
    } catch {
      return new GridLayoutEngine({
        columns: this.options.fallbackColumns,
      }).layout(request)
    }
  }

  private positionForNode(node: LayoutNode, position: DagrePosition) {
    if (node.manualLocked && node.x !== undefined && node.y !== undefined) {
      return {
        id: node.id,
        x: node.x,
        y: node.y,
      }
    }

    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
      throw new Error(`Dagre did not return a position for node: ${node.id}`)
    }

    return {
      id: node.id,
      x: position.x - node.width / 2,
      y: position.y - node.height / 2,
    }
  }
}
