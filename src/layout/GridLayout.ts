import type { LayoutEngine, LayoutRequest, LayoutResult } from './LayoutEngine'

export interface GridLayoutOptions {
  columns?: number
  startX?: number
  startY?: number
  columnGap?: number
  rowGap?: number
}

const defaultOptions: Required<GridLayoutOptions> = {
  columns: 3,
  startX: 80,
  startY: 80,
  columnGap: 80,
  rowGap: 72,
}

export class GridLayoutEngine implements LayoutEngine {
  private readonly options: Required<GridLayoutOptions>

  constructor(options: GridLayoutOptions = {}) {
    this.options = {
      ...defaultOptions,
      ...options,
      columns: Math.max(1, Math.floor(options.columns ?? defaultOptions.columns)),
    }
  }

  layout(request: LayoutRequest): LayoutResult {
    const { nodes } = request
    const columnWidths = this.measureColumnWidths(nodes)
    const rowHeights = this.measureRowHeights(nodes)

    return {
      positions: nodes.map((node, index) => {
        const column = index % this.options.columns
        const row = Math.floor(index / this.options.columns)

        return {
          id: node.id,
          x:
            this.options.startX +
            this.offsetFor(columnWidths, column, this.options.columnGap),
          y:
            this.options.startY +
            this.offsetFor(rowHeights, row, this.options.rowGap),
        }
      }),
      connectors: request.connectors.map((connector) => ({ ...connector })),
    }
  }

  private measureColumnWidths(nodes: LayoutRequest['nodes']): number[] {
    return nodes.reduce<number[]>((widths, node, index) => {
      const column = index % this.options.columns
      widths[column] = Math.max(widths[column] ?? 0, node.width)
      return widths
    }, [])
  }

  private measureRowHeights(nodes: LayoutRequest['nodes']): number[] {
    return nodes.reduce<number[]>((heights, node, index) => {
      const row = Math.floor(index / this.options.columns)
      heights[row] = Math.max(heights[row] ?? 0, node.height)
      return heights
    }, [])
  }

  private offsetFor(sizes: number[], index: number, gap: number): number {
    return sizes
      .slice(0, index)
      .reduce((offset, size) => offset + size + gap, 0)
  }
}
