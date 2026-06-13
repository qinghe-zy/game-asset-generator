# Incremental Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an incremental layout engine that places newly added nodes near an anchor without moving existing manually arranged nodes.

**Architecture:** `IncrementalLayoutEngine` implements the existing `LayoutEngine` contract and is isolated in `src/layout`. It receives `anchorElementId` and `newNodeIds` through constructor options, keeps all existing positioned nodes at their current coordinates, places new nodes to the right of the anchor first, then below if the first slot overlaps, and searches downward until it finds a non-overlapping slot.

**Tech Stack:** TypeScript, Vitest, existing layout model.

---

## Scope

This PR implements only C4 from the MVP roadmap:

- Add `src/layout/IncrementalLayout.ts`.
- Add `src/layout/IncrementalLayout.test.ts`.

This PR does not integrate with AgentPlan execution, React UI, Fabric rendering, or command history. No new dependency is added.

## Files

- Create: `src/layout/IncrementalLayout.ts`
  - Export `IncrementalLayoutEngine`.
  - Accept `anchorElementId`, `newNodeIds`, `gap`, and `stackGap`.
  - Preserve positioned existing nodes, especially `manualLocked` nodes.
  - Clone connectors.
- Create: `src/layout/IncrementalLayout.test.ts`
  - Cover placing new nodes near anchors.
  - Cover overlap avoidance.
  - Cover preserving existing positions and manual-locked positions.
  - Cover fallback when anchor is missing.

## Task 1: Add Failing Incremental Layout Tests

- [x] **Step 1: Create `src/layout/IncrementalLayout.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { IncrementalLayoutEngine } from './IncrementalLayout'
import type { LayoutNode } from './LayoutEngine'

const node = (
  id: string,
  x: number | undefined,
  y: number | undefined,
  width = 120,
  height = 64,
  manualLocked = false,
): LayoutNode => ({
  id,
  label: id,
  x,
  y,
  width,
  height,
  manualLocked,
})

describe('IncrementalLayoutEngine', () => {
  it('places a new node to the right of the anchor', () => {
    const engine = new IncrementalLayoutEngine({
      anchorElementId: 'anchor',
      newNodeIds: ['new_node'],
      gap: 40,
    })

    const result = engine.layout({
      nodes: [node('anchor', 100, 120), node('new_node', undefined, undefined)],
      connectors: [{ id: 'edge', fromId: 'anchor', toId: 'new_node' }],
    })

    expect(result.positions).toEqual([
      { id: 'anchor', x: 100, y: 120 },
      { id: 'new_node', x: 260, y: 120 },
    ])
    expect(result.connectors).toEqual([
      { id: 'edge', fromId: 'anchor', toId: 'new_node' },
    ])
  })

  it('keeps existing and manual-locked positions unchanged', () => {
    const engine = new IncrementalLayoutEngine({
      anchorElementId: 'anchor',
      newNodeIds: ['new_node'],
    })

    const result = engine.layout({
      nodes: [
        node('anchor', 100, 120, 120, 64, true),
        node('existing', 500, 320),
        node('new_node', undefined, undefined),
      ],
      connectors: [],
    })

    expect(result.positions).toContainEqual({ id: 'anchor', x: 100, y: 120 })
    expect(result.positions).toContainEqual({ id: 'existing', x: 500, y: 320 })
  })

  it('moves the new node below when the right-side slot overlaps', () => {
    const engine = new IncrementalLayoutEngine({
      anchorElementId: 'anchor',
      newNodeIds: ['new_node'],
      gap: 40,
      stackGap: 32,
    })

    const result = engine.layout({
      nodes: [
        node('anchor', 100, 120),
        node('blocker', 260, 120),
        node('new_node', undefined, undefined),
      ],
      connectors: [],
    })

    expect(result.positions.find((position) => position.id === 'new_node')).toEqual(
      { id: 'new_node', x: 100, y: 216 },
    )
  })

  it('uses the first positioned node when the anchor is missing', () => {
    const engine = new IncrementalLayoutEngine({
      anchorElementId: 'missing',
      newNodeIds: ['new_node'],
      gap: 40,
    })

    const result = engine.layout({
      nodes: [node('fallback_anchor', 80, 90), node('new_node', undefined, undefined)],
      connectors: [],
    })

    expect(result.positions.find((position) => position.id === 'new_node')).toEqual(
      { id: 'new_node', x: 240, y: 90 },
    )
  })

  it('does not mutate input nodes or connectors', () => {
    const engine = new IncrementalLayoutEngine({
      anchorElementId: 'anchor',
      newNodeIds: ['new_node'],
    })
    const nodes = [node('anchor', 100, 120), node('new_node', undefined, undefined)]
    const connectors = [{ id: 'edge', fromId: 'anchor', toId: 'new_node' }]
    const before = JSON.stringify({ nodes, connectors })

    engine.layout({ nodes, connectors })

    expect(JSON.stringify({ nodes, connectors })).toBe(before)
  })
})
```

- [x] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/layout/IncrementalLayout.test.ts
```

Expected: FAIL because `src/layout/IncrementalLayout.ts` does not exist.

## Task 2: Implement Incremental Layout

- [x] **Step 1: Create `src/layout/IncrementalLayout.ts`**

```ts
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

  private hasPosition(node: LayoutNode): node is LayoutNode & { x: number; y: number } {
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

  private defaultAnchor(node: LayoutNode | undefined): LayoutNode & { x: number; y: number } {
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
```

- [x] **Step 2: Run focused test and verify GREEN**

```bash
npm run test -- src/layout/IncrementalLayout.test.ts
```

Expected: PASS.

## Task 3: Verify PR Quality

- [x] **Step 1: Run full automated checks**

```bash
npm run test -- src/layout/IncrementalLayout.test.ts
npm run test -- src/layout
npm run test
npm run build
npm run lint
```

Expected: all commands exit 0.

- [x] **Step 2: Review scope and safety**

```bash
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md
```

Expected:

- Diff touches only C4 plan and incremental layout files.
- `git diff --check` prints no output.
- Secret scan finds no real credentials.
- No package or README changes are needed.
- Existing positioned nodes are preserved; no global relayout occurs.

## Task 4: Commit, Push, and Open PR

- [ ] **Step 1: Stage and commit**

```bash
git add docs/superpowers/plans/2026-06-13-incremental-layout.md src/layout/IncrementalLayout.ts src/layout/IncrementalLayout.test.ts
git commit -m "feat: add incremental layout engine"
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin codex/voice-canvas-incremental-layout
```

- [ ] **Step 3: Open GitHub PR**

Use title:

```text
feat: add incremental layout engine
```

Use body:

```markdown
## 功能描述

新增增量布局引擎，用于在已有画布上添加新节点时，把新节点放到锚点附近，同时保留用户已经调整过的位置。

## 实现思路

`IncrementalLayoutEngine` 复用现有 `LayoutEngine` 契约，通过 `anchorElementId` 找到锚点，通过 `newNodeIds` 识别本轮新增节点。已有带坐标的节点会原样返回，新节点优先放在锚点右侧；如果右侧位置和已有节点重叠，就改为放到锚点下方，并继续向下搜索空位。这样后续 Agent 多轮追加内容时，不会触发全局重排。

## 测试方式

- `npm run test -- src/layout/IncrementalLayout.test.ts`
- `npm run test -- src/layout`
- `npm run test`
- `npm run build`
- `npm run lint`

同时检查了 diff 范围、空白问题、敏感信息命中，并确认本 PR 没有新增依赖、没有 UI 改动。
```

- [ ] **Step 4: Confirm PR status**

```bash
gh pr view --json number,state,mergeStateStatus,isDraft,headRefName,baseRefName,url,title
```

Expected: PR is open against `main` and not draft.

## Self-Review

- Spec coverage: covers anchor lookup, right-or-below placement, overlap avoidance, manual/existing position preservation, and no global relayout.
- Placeholder scan: no implementation placeholder remains.
- Type consistency: `IncrementalLayoutEngine` implements `LayoutEngine` and uses existing `LayoutNode.x/y` coordinates.
