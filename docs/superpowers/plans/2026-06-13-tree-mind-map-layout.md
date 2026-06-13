# Tree Mind Map Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a d3-hierarchy-backed tree layout adapter for mind map style parent-child diagrams.

**Architecture:** `TreeMindMapLayoutEngine` implements the existing layout contract and stays isolated under `src/layout`. It converts `LayoutNode.parentId` relationships into a d3 stratified tree, applies `tree().nodeSize()`, maps tree coordinates into canvas top-left positions around a configurable center point, and falls back to `GridLayoutEngine` for invalid trees.

**Tech Stack:** TypeScript, Vitest, `d3-hierarchy`, existing Vite project scripts.

---

## Scope

This PR implements only C3 from the MVP roadmap:

- Add `d3-hierarchy`.
- Add `src/layout/TreeMindMapLayout.ts`.
- Add `src/layout/TreeMindMapLayout.test.ts`.
- Update `README.md` dependency notes.

This PR does not add incremental layout, AgentPlan integration, React UI, or Fabric rendering.

## Files

- Modify: `package.json`
  - Add `d3-hierarchy` under `dependencies`.
  - Add `@types/d3-hierarchy` under `devDependencies` only if TypeScript needs external types.
- Modify: `package-lock.json`
  - Lock the installed packages.
- Modify: `README.md`
  - List d3-hierarchy and explain its mind map layout role.
- Create: `src/layout/TreeMindMapLayout.ts`
  - Export `TreeMindMapLayoutEngine`.
  - Support `centerX`, `centerY`, `levelGap`, `siblingGap`, and `fallbackColumns`.
- Create: `src/layout/TreeMindMapLayout.test.ts`
  - Cover center-out coordinates, parent-child ordering, immutable input, connector cloning, and invalid tree fallback.

## Task 1: Install Dependency

- [x] **Step 1: Install d3-hierarchy**

```bash
npm install d3-hierarchy
```

Expected:

- `package.json` includes `d3-hierarchy`.
- `package-lock.json` records the installed version.

- [x] **Step 2: Install TypeScript types if needed**

Run after adding the first failing test or implementation:

```bash
npm run build
```

If TypeScript reports missing declarations for `d3-hierarchy`, run:

```bash
npm install -D @types/d3-hierarchy
```

Expected:

- Types are added only if the compiler requires them.

## Task 2: Add Failing Mind Map Tests

- [x] **Step 1: Create `src/layout/TreeMindMapLayout.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { TreeMindMapLayoutEngine } from './TreeMindMapLayout'
import type { LayoutNode } from './LayoutEngine'

const node = (
  id: string,
  parentId?: string,
  width = 120,
  height = 64,
): LayoutNode => ({
  id,
  label: id,
  parentId,
  width,
  height,
})

describe('TreeMindMapLayoutEngine', () => {
  it('places the root at the configured center and children outward', () => {
    const engine = new TreeMindMapLayoutEngine({
      centerX: 400,
      centerY: 300,
      levelGap: 220,
      siblingGap: 120,
    })

    const result = engine.layout({
      nodes: [
        node('root', undefined, 160, 80),
        node('left_branch', 'root'),
        node('right_branch', 'root'),
        node('leaf', 'left_branch'),
      ],
      connectors: [],
    })

    const byId = Object.fromEntries(
      result.positions.map((position) => [position.id, position]),
    )

    expect(byId.root).toEqual({ id: 'root', x: 320, y: 260 })
    expect(byId.left_branch!.x).toBeGreaterThan(byId.root!.x)
    expect(byId.right_branch!.x).toBeGreaterThan(byId.root!.x)
    expect(byId.leaf!.x).toBeGreaterThan(byId.left_branch!.x)
    expect(byId.left_branch!.y).not.toBe(byId.right_branch!.y)
  })

  it('does not mutate layout input and clones connectors', () => {
    const engine = new TreeMindMapLayoutEngine()
    const nodes = [node('root'), node('child', 'root')]
    const connectors = [{ id: 'edge', fromId: 'root', toId: 'child' }]
    const before = JSON.stringify({ nodes, connectors })

    const result = engine.layout({ nodes, connectors })

    expect(JSON.stringify({ nodes, connectors })).toBe(before)
    expect(result.connectors).toEqual(connectors)
    expect(result.connectors[0]).not.toBe(connectors[0])
  })

  it('falls back to grid layout for an invalid tree', () => {
    const engine = new TreeMindMapLayoutEngine({ fallbackColumns: 1 })

    const result = engine.layout({
      nodes: [node('orphan', 'missing_parent'), node('other_root')],
      connectors: [],
    })

    expect(result.positions).toEqual([
      { id: 'orphan', x: 80, y: 80 },
      { id: 'other_root', x: 80, y: 216 },
    ])
  })
})
```

- [x] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/layout/TreeMindMapLayout.test.ts
```

Expected: FAIL because `src/layout/TreeMindMapLayout.ts` does not exist.

## Task 3: Implement Tree Mind Map Adapter

- [x] **Step 1: Create `src/layout/TreeMindMapLayout.ts`**

```ts
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

          return {
            id: node.id,
            x: this.options.centerX + treeNode.y - node.width / 2,
            y: this.options.centerY + treeNode.x - node.height / 2,
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
}
```

- [x] **Step 2: Run focused test and verify GREEN**

```bash
npm run test -- src/layout/TreeMindMapLayout.test.ts
```

Expected: PASS.

## Task 4: Update Dependency Documentation

- [x] **Step 1: Modify `README.md`**

Add this bullet under `## Dependencies`:

```markdown
- d3-hierarchy: compute tree layouts for mind maps and parent-child diagrams.
```

- [x] **Step 2: Verify README mentions d3-hierarchy**

```bash
rg -n "d3-hierarchy" README.md package.json package-lock.json
```

Expected: README and package files mention `d3-hierarchy`.

## Task 5: Verify PR Quality

- [x] **Step 1: Run full automated checks**

```bash
npm run test -- src/layout/TreeMindMapLayout.test.ts
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

- Diff touches only C3 plan, tree mind map layout files, dependency files, and README.
- `git diff --check` prints no output.
- Secret scan finds no real credentials.
- Adapter remains thin and isolated under `src/layout`.

## Task 6: Commit, Push, and Open PR

- [ ] **Step 1: Stage and commit**

```bash
git add docs/superpowers/plans/2026-06-13-tree-mind-map-layout.md package.json package-lock.json README.md src/layout/TreeMindMapLayout.ts src/layout/TreeMindMapLayout.test.ts
git commit -m "feat: add tree mind map layout adapter"
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin codex/voice-canvas-mind-map-layout
```

- [ ] **Step 3: Open GitHub PR**

Use title:

```text
feat: add tree mind map layout adapter
```

Use body:

```markdown
## 功能描述

新增基于 `d3-hierarchy` 的思维导图布局适配器。它接收节点的 `parentId` 父子关系，输出以根节点为中心、子节点向外展开的坐标，供后续 Agent 和渲染层复用。

## 实现思路

`TreeMindMapLayoutEngine` 复用现有 `LayoutEngine` 契约，将节点转换为 d3 stratify 能识别的树结构，再用 `tree().nodeSize()` 计算树形坐标，并映射成画布左上角坐标。若父子关系无效导致 d3 无法生成树，则回退到 `GridLayoutEngine`。本 PR 新增第三方依赖 `d3-hierarchy`，README 已说明它用于思维导图和父子结构布局。

## 测试方式

- `npm run test -- src/layout/TreeMindMapLayout.test.ts`
- `npm run test`
- `npm run build`
- `npm run lint`

同时检查了 diff 范围、空白问题、敏感信息命中、README 依赖说明，以及 layout 适配器仍然独立在 `src/layout`。
```

- [ ] **Step 4: Confirm PR status**

```bash
gh pr view --json number,state,mergeStateStatus,isDraft,headRefName,baseRefName,url,title
```

Expected: PR is open against `main` and not draft.

## Self-Review

- Spec coverage: covers d3-hierarchy dependency, parent-child conversion, center-out tree coordinates, invalid tree fallback, README dependency note, and isolated adapter boundary.
- Placeholder scan: no implementation placeholder remains.
- Type consistency: `TreeMindMapLayoutEngine` implements `LayoutEngine`; tests use `LayoutNode.parentId` already present in the shared contract.
