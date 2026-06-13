# Dagre Flow Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dagre-backed flow layout adapter that positions directed canvas graphs while preserving manual-locked nodes and falling back to the existing grid layout.

**Architecture:** `DagreFlowLayoutEngine` implements the existing `LayoutEngine` contract and stays inside `src/layout`. It converts plain `LayoutNode` and `LayoutConnector` data into a dagre graph, runs dagre, converts center coordinates back to top-left positions, restores manual-locked node positions, and uses `GridLayoutEngine` if dagre cannot produce usable positions.

**Tech Stack:** TypeScript, Vitest, `@dagrejs/dagre`, existing Vite project scripts.

---

## Scope

This PR implements only C2 from the MVP roadmap:

- Add `@dagrejs/dagre`.
- Add `src/layout/DagreFlowLayout.ts`.
- Add `src/layout/DagreFlowLayout.test.ts`.
- Update `README.md` dependency notes.

This PR does not connect layout to AgentPlan execution, React UI, Fabric rendering, mind maps, or incremental layout. Those remain separate PRs.

## Files

- Modify: `package.json`
  - Add `@dagrejs/dagre` under `dependencies`.
- Modify: `package-lock.json`
  - Lock the dagre package and transitive graphlib dependency through `npm install`.
- Modify: `README.md`
  - List dagre and explain that it powers flowchart/architecture automatic layout.
- Create: `src/layout/DagreFlowLayout.ts`
  - Export `DagreFlowLayoutEngine`.
  - Support `rankdir`, `nodesep`, `ranksep`, `fallback`, and graph factory injection for tests.
- Create: `src/layout/DagreFlowLayout.test.ts`
  - Cover directed ordering, immutable input, manual-locked position preservation, and fallback on dagre failure.

## Task 1: Install Dependency

- [x] **Step 1: Install dagre**

```bash
npm install @dagrejs/dagre
```

Expected:

- `package.json` includes `@dagrejs/dagre`.
- `package-lock.json` records the installed version.
- No unrelated dependencies are added.

## Task 2: Add Failing Dagre Tests

- [x] **Step 1: Create `src/layout/DagreFlowLayout.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { DagreFlowLayoutEngine } from './DagreFlowLayout'
import type { LayoutNode } from './LayoutEngine'

const node = (
  id: string,
  width = 120,
  height = 64,
  x?: number,
  y?: number,
  manualLocked = false,
): LayoutNode => ({
  id,
  label: id,
  width,
  height,
  x,
  y,
  manualLocked,
})

describe('DagreFlowLayoutEngine', () => {
  it('positions directed flow nodes from left to right', () => {
    const engine = new DagreFlowLayoutEngine({ rankdir: 'LR' })

    const result = engine.layout({
      nodes: [node('start'), node('process'), node('end')],
      connectors: [
        { id: 'edge_start_process', fromId: 'start', toId: 'process' },
        { id: 'edge_process_end', fromId: 'process', toId: 'end' },
      ],
    })

    const byId = Object.fromEntries(
      result.positions.map((position) => [position.id, position]),
    )

    expect(byId.process!.x).toBeGreaterThan(byId.start!.x)
    expect(byId.end!.x).toBeGreaterThan(byId.process!.x)
    expect(result.connectors).toEqual([
      { id: 'edge_start_process', fromId: 'start', toId: 'process' },
      { id: 'edge_process_end', fromId: 'process', toId: 'end' },
    ])
  })

  it('does not mutate nodes or connectors', () => {
    const engine = new DagreFlowLayoutEngine()
    const nodes = [node('start'), node('end')]
    const connectors = [{ id: 'edge', fromId: 'start', toId: 'end' }]
    const before = JSON.stringify({ nodes, connectors })

    engine.layout({ nodes, connectors })

    expect(JSON.stringify({ nodes, connectors })).toBe(before)
  })

  it('preserves manual-locked node positions', () => {
    const engine = new DagreFlowLayoutEngine({ rankdir: 'LR' })

    const result = engine.layout({
      nodes: [node('fixed', 120, 64, 300, 220, true), node('next')],
      connectors: [{ id: 'edge', fromId: 'fixed', toId: 'next' }],
    })

    expect(result.positions.find((position) => position.id === 'fixed')).toEqual({
      id: 'fixed',
      x: 300,
      y: 220,
    })
  })

  it('uses grid fallback when dagre layout fails', () => {
    const engine = new DagreFlowLayoutEngine({
      fallbackColumns: 1,
      createGraph: () => {
        throw new Error('dagre unavailable')
      },
    })

    const result = engine.layout({
      nodes: [node('alpha'), node('beta')],
      connectors: [{ id: 'edge', fromId: 'alpha', toId: 'beta' }],
    })

    expect(result.positions).toEqual([
      { id: 'alpha', x: 80, y: 80 },
      { id: 'beta', x: 80, y: 216 },
    ])
  })
})
```

- [x] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/layout/DagreFlowLayout.test.ts
```

Expected: FAIL because `src/layout/DagreFlowLayout.ts` does not exist.

## Task 3: Extend LayoutNode With Optional Current Coordinates

- [x] **Step 1: Modify `src/layout/LayoutEngine.ts`**

Add optional current coordinates to support manual-locked preservation:

```ts
export interface LayoutNode {
  id: string
  label?: string
  width: number
  height: number
  x?: number
  y?: number
  parentId?: string
  manualLocked?: boolean
}
```

- [x] **Step 2: Run existing layout tests**

```bash
npm run test -- src/layout/LayoutEngine.test.ts
```

Expected: PASS.

## Task 4: Implement Dagre Adapter

- [x] **Step 1: Create `src/layout/DagreFlowLayout.ts`**

```ts
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

const defaultOptions: Required<
  Omit<DagreFlowLayoutOptions, 'createGraph'>
> = {
  rankdir: 'LR',
  nodesep: 80,
  ranksep: 120,
  fallbackColumns: 3,
}

const cloneConnectors = (connectors: LayoutConnector[]): LayoutConnector[] =>
  connectors.map((connector) => ({ ...connector }))

export class DagreFlowLayoutEngine implements LayoutEngine {
  private readonly options: Required<
    Omit<DagreFlowLayoutOptions, 'createGraph'>
  >
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
```

- [x] **Step 2: Run focused test and verify GREEN**

```bash
npm run test -- src/layout/DagreFlowLayout.test.ts
```

Expected: PASS.

## Task 5: Update Dependency Documentation

- [x] **Step 1: Modify `README.md`**

Add this bullet under `## Dependencies`:

```markdown
- @dagrejs/dagre: compute automatic directed graph layouts for flowcharts and architecture diagrams.
```

- [x] **Step 2: Verify README mentions dagre**

```bash
rg -n "dagre|@dagrejs/dagre" README.md package.json
```

Expected: README and package files both mention `@dagrejs/dagre`.

## Task 6: Verify PR Quality

- [x] **Step 1: Run full automated checks**

```bash
npm run test -- src/layout/DagreFlowLayout.test.ts
npm run test
npm run build
npm run lint
```

Expected: all commands exit 0.

- [x] **Step 2: Review scope and safety**

```bash
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
git diff -- package.json package-lock.json README.md
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md
```

Expected:

- Diff touches only C2 plan, dagre layout files, dependency files, and README.
- `git diff --check` prints no output.
- Secret scan finds no real credentials.
- No React or Fabric imports are added to `src/layout`.

## Task 7: Commit, Push, and Open PR

- [ ] **Step 1: Stage and commit**

```bash
git add docs/superpowers/plans/2026-06-13-dagre-flow-layout.md package.json package-lock.json README.md src/layout/LayoutEngine.ts src/layout/DagreFlowLayout.ts src/layout/DagreFlowLayout.test.ts
git commit -m "feat: add dagre flow layout adapter"
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin codex/voice-canvas-dagre-flow-layout
```

- [ ] **Step 3: Open GitHub PR**

Use title:

```text
feat: add dagre flow layout adapter
```

Use body:

```markdown
## 功能描述

新增基于 `@dagrejs/dagre` 的流程图布局适配器。它接收已有的逻辑节点和连线，输出适合流程图、架构图使用的自动排布坐标，并保留手动锁定节点的当前位置。

## 实现思路

`DagreFlowLayoutEngine` 复用现有 `LayoutEngine` 契约，将节点和边转换为 dagre graph，运行 dagre 后把中心点坐标转换成画布使用的左上角坐标。若 dagre 创建或计算失败，则回退到 `GridLayoutEngine`，让后续 Agent 执行链不会因为布局库异常而中断。本 PR 新增第三方依赖 `@dagrejs/dagre`，README 已说明它用于流程图和架构图自动布局。

## 测试方式

- `npm run test -- src/layout/DagreFlowLayout.test.ts`
- `npm run test`
- `npm run build`
- `npm run lint`

同时检查了 diff 范围、空白问题、敏感信息命中、README 依赖说明，以及 layout 模块没有 React/Fabric 依赖。
```

- [ ] **Step 4: Confirm PR status**

```bash
gh pr view --json number,state,mergeStateStatus,isDraft,headRefName,baseRefName,url,title
```

Expected: PR is open against `main` and not draft.

## Self-Review

- Spec coverage: covers dagre dependency, directed graph adapter, manual-locked node preservation, grid fallback, README dependency note, and no custom full flow algorithm.
- Placeholder scan: no implementation placeholder remains.
- Type consistency: `DagreFlowLayoutEngine` implements the existing `LayoutEngine` interface and uses optional `LayoutNode.x/y` only for manual-locked preservation.
