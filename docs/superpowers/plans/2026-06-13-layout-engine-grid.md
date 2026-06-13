# Layout Engine Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small layout abstraction and deterministic grid layout fallback for non-connector canvas elements.

**Architecture:** The layout layer works on plain logical nodes and connectors, then returns absolute positions for the command/rendering layers to apply later. It stays independent from React, Fabric.js, and the ProjectState mutation helpers so future dagre, mind map, and incremental layouts can share the same contract.

**Tech Stack:** TypeScript, Vitest, existing Vite project scripts.

---

## Scope

This PR implements only C1 from the MVP roadmap:

- `src/layout/LayoutEngine.ts` defines shared layout types and the `LayoutEngine` interface.
- `src/layout/GridLayout.ts` implements a deterministic fallback grid layout.
- `src/layout/LayoutEngine.test.ts` verifies the contract.

This PR does not add dagre/elkjs, React UI, Fabric rendering, incremental layout, or AgentPlan integration. Those are later PRs.

## Files

- Create: `src/layout/LayoutEngine.ts`
  - Exports `LayoutNode`, `LayoutConnector`, `LayoutRequest`, `LayoutPosition`, `LayoutResult`, and `LayoutEngine`.
- Create: `src/layout/GridLayout.ts`
  - Exports `GridLayoutEngine`.
  - Places nodes in rows and columns using configurable spacing.
  - Returns positions without mutating input nodes/connectors.
- Create: `src/layout/LayoutEngine.test.ts`
  - Covers non-overlap, immutability, stable ordering, connector tolerance, and empty input.

## Task 1: Add Failing Layout Tests

- [x] **Step 1: Create `src/layout/LayoutEngine.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { GridLayoutEngine } from './GridLayout'
import type { LayoutNode } from './LayoutEngine'

const node = (
  id: string,
  width = 120,
  height = 64,
  label = id,
): LayoutNode => ({
  id,
  label,
  width,
  height,
})

const boxesOverlap = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y

describe('GridLayoutEngine', () => {
  it('places nodes in deterministic grid order without overlap', () => {
    const engine = new GridLayoutEngine({
      columns: 2,
      startX: 10,
      startY: 20,
      columnGap: 30,
      rowGap: 40,
    })
    const nodes = [
      node('alpha', 100, 50),
      node('beta', 120, 60),
      node('gamma', 90, 70),
    ]

    const result = engine.layout({ nodes, connectors: [] })

    expect(result.positions.map((position) => position.id)).toEqual([
      'alpha',
      'beta',
      'gamma',
    ])
    expect(result.positions[0]).toMatchObject({ id: 'alpha', x: 10, y: 20 })
    expect(result.positions[1]?.x).toBeGreaterThan(
      result.positions[0]!.x + nodes[0]!.width,
    )
    expect(result.positions[2]?.y).toBeGreaterThan(
      result.positions[0]!.y + nodes[0]!.height,
    )

    const placed = result.positions.map((position) => ({
      ...position,
      width: nodes.find((item) => item.id === position.id)!.width,
      height: nodes.find((item) => item.id === position.id)!.height,
    }))

    for (let index = 0; index < placed.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < placed.length; nextIndex += 1) {
        expect(boxesOverlap(placed[index]!, placed[nextIndex]!)).toBe(false)
      }
    }
  })

  it('does not mutate layout input', () => {
    const engine = new GridLayoutEngine()
    const nodes = [node('alpha')]
    const connectors = [{ id: 'edge', fromId: 'alpha', toId: 'beta' }]
    const before = JSON.stringify({ nodes, connectors })

    engine.layout({ nodes, connectors })

    expect(JSON.stringify({ nodes, connectors })).toBe(before)
  })

  it('accepts connectors while positioning only nodes', () => {
    const engine = new GridLayoutEngine()

    const result = engine.layout({
      nodes: [node('alpha'), node('beta')],
      connectors: [{ id: 'edge', fromId: 'alpha', toId: 'beta' }],
    })

    expect(result.positions).toHaveLength(2)
    expect(result.connectors).toEqual([
      { id: 'edge', fromId: 'alpha', toId: 'beta' },
    ])
  })

  it('returns an empty result for an empty canvas', () => {
    const engine = new GridLayoutEngine()

    const result = engine.layout({ nodes: [], connectors: [] })

    expect(result.positions).toEqual([])
    expect(result.connectors).toEqual([])
  })
})
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test -- src/layout/LayoutEngine.test.ts
```

Expected: FAIL because `src/layout/GridLayout.ts` and `src/layout/LayoutEngine.ts` do not exist yet.

## Task 2: Add Layout Engine Contract

- [x] **Step 1: Create `src/layout/LayoutEngine.ts`**

```ts
export interface LayoutNode {
  id: string
  label?: string
  width: number
  height: number
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
```

- [x] **Step 2: Run the focused test**

Run:

```bash
npm run test -- src/layout/LayoutEngine.test.ts
```

Expected: FAIL because `GridLayoutEngine` has not been implemented.

## Task 3: Implement Grid Layout

- [x] **Step 1: Create `src/layout/GridLayout.ts`**

```ts
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
          x: this.options.startX + this.offsetFor(columnWidths, column, this.options.columnGap),
          y: this.options.startY + this.offsetFor(rowHeights, row, this.options.rowGap),
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
```

- [x] **Step 2: Run focused test and verify GREEN**

Run:

```bash
npm run test -- src/layout/LayoutEngine.test.ts
```

Expected: PASS.

## Task 4: Verify PR Quality

- [x] **Step 1: Run full automated checks**

```bash
npm run test
npm run build
npm run lint
```

Expected: all commands exit 0.

- [x] **Step 2: Review diff scope**

```bash
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md
```

Expected:

- Diff touches only the C1 plan and layout files.
- `git diff --check` prints no output.
- Secret scan finds no real credentials.

- [x] **Step 3: Manual acceptance**

Confirm:

- No UI files changed.
- Layout module imports no React or Fabric dependency.
- No new runtime dependency was added.
- Main app remains buildable.

## Task 5: Commit, Push, and Open PR

- [ ] **Step 1: Stage and commit**

```bash
git add docs/superpowers/plans/2026-06-13-layout-engine-grid.md src/layout/LayoutEngine.ts src/layout/GridLayout.ts src/layout/LayoutEngine.test.ts
git commit -m "feat: add grid layout engine"
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin codex/voice-canvas-grid-layout
```

- [ ] **Step 3: Open GitHub PR**

Use title:

```text
feat: add grid layout engine
```

Use body:

```markdown
## 功能描述

新增布局引擎的基础接口和一个稳定的网格布局实现。它接收逻辑节点与连线，输出节点的绝对坐标，作为后续 AgentPlan、自动布局和 Fabric 渲染之间的中间层。

## 实现思路

本轮只实现轻量布局契约和 grid fallback，不接入 UI，也不引入 dagre/elkjs。`GridLayoutEngine` 根据输入顺序按行列排布节点，并根据每列最大宽度、每行最大高度计算间距，避免基础节点重叠。连线会原样复制到结果里，方便后续布局适配器统一返回。

## 测试方式

- `npm run test -- src/layout/LayoutEngine.test.ts`
- `npm run test`
- `npm run build`
- `npm run lint`

同时检查了 diff 范围、空白问题、敏感信息命中、以及 layout 模块没有 React/Fabric 依赖。
```

- [ ] **Step 4: Confirm PR status**

```bash
gh pr view --json number,state,mergeStateStatus,isDraft,headRefName,baseRefName,url,title
```

Expected: PR is open against `main` and not draft.

## Self-Review

- Spec coverage: covers C1 layout interface, logical input, non-mutating output, grid non-overlap, no UI change, no React/Fabric dependency.
- Placeholder scan: no implementation placeholder remains.
- Type consistency: tests import `GridLayoutEngine` from `GridLayout` and `LayoutNode` from `LayoutEngine`; implementation matches those names.
