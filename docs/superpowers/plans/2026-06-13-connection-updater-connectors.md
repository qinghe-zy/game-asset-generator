# Connection Updater And Connectors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render ProjectState connectors as flat Fabric line objects with optional midpoint labels, using computed anchors from source and target elements.

**Architecture:** Add a small `ConnectionUpdater` geometry module that converts connector relationships into render models. `FabricRenderer` remains the Fabric boundary: it asks `ConnectionUpdater` for line/label geometry, then creates Fabric `Line` and `Textbox` objects tagged with element IDs and render roles.

**Tech Stack:** TypeScript, Fabric.js, Vitest, existing ProjectState model.

---

## Scope

This PR implements only D4 from the MVP roadmap:

- Create `src/canvas/ConnectionUpdater.ts`.
- Create `src/canvas/ConnectionUpdater.test.ts`.
- Modify `src/canvas/FabricRenderer.ts`.
- Modify `src/canvas/FabricRenderer.test.ts`.
- Modify `src/components/CanvasStage/CanvasStage.tsx` demo state with one connector.

This PR does not implement interactive dragging, Fabric `moving` event hooks, orthogonal routing, arrowheads, selection, or live command-driven movement. The computed connector geometry is deterministic and can be rerendered after any future state change.

## Files

- Create: `src/canvas/ConnectionUpdater.ts`
  - Export `calculateConnectorRenderModels`.
  - Calculate edge anchors for rect-like shapes.
  - Calculate projected anchors for circles.
  - Use bounding-box center fallback for diamonds, text, and groups.
  - Skip connectors whose endpoints are missing.
- Create: `src/canvas/ConnectionUpdater.test.ts`
  - Test rect-to-rect anchors.
  - Test circle projected anchors.
  - Test missing endpoint skip.
  - Test label midpoint.
- Modify: `src/canvas/FabricRenderer.ts`
  - Add `line` to `FabricObjectFactory`.
  - Import `Line` from Fabric.
  - Render connectors after all non-connector elements so lines sit above group backgrounds and under future interactive handles.
- Modify: `src/canvas/FabricRenderer.test.ts`
  - Add fake line factory.
  - Replace connector skip expectation with connector rendering expectation.
- Modify: `src/components/CanvasStage/CanvasStage.tsx`
  - Add a second demo shape and a connector between shapes.

## Task 1: Add Failing ConnectionUpdater Tests

- [ ] **Step 1: Create `src/canvas/ConnectionUpdater.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { calculateConnectorRenderModels } from './ConnectionUpdater'
import { addElement, createProjectState } from '../state/projectState'
import type { ConnectorElement, ShapeElement } from '../state/elements'

const meta = {
  source: 'template' as const,
  createdAt: 1,
  updatedAt: 1,
}

const shape = (
  id: string,
  x: number,
  y: number,
  shapeType: ShapeElement['shape'] = 'rounded-rect',
): ShapeElement => ({
  id,
  kind: 'shape',
  shape: shapeType,
  label: id,
  x,
  y,
  width: 100,
  height: 60,
  meta,
})

const connector = (
  id: string,
  fromId: string,
  toId: string,
  label?: string,
): ConnectorElement => ({
  id,
  kind: 'connector',
  fromId,
  toId,
  label,
  style: {
    stroke: '#64748b',
    strokeWidth: 2,
    textColor: '#334155',
    fontSize: 12,
  },
  meta,
})

describe('ConnectionUpdater', () => {
  it('calculates right-to-left anchors between rect-like elements', () => {
    const state = [shape('a', 100, 100), shape('b', 280, 100), connector('edge', 'a', 'b')].reduce(
      (current, element) => addElement(current, element),
      createProjectState('demo'),
    )

    const [model] = calculateConnectorRenderModels(state)

    expect(model).toMatchObject({
      id: 'edge',
      from: { x: 200, y: 130 },
      to: { x: 280, y: 130 },
      label: undefined,
      style: {
        stroke: '#64748b',
        strokeWidth: 2,
        textColor: '#334155',
        fontSize: 12,
      },
    })
    expect(model.labelPosition).toEqual({ x: 240, y: 130 })
  })

  it('projects anchors on circle edges', () => {
    const state = [
      shape('a', 100, 100, 'circle'),
      shape('b', 300, 100, 'circle'),
      connector('edge', 'a', 'b', 'next'),
    ].reduce((current, element) => addElement(current, element), createProjectState('demo'))

    const [model] = calculateConnectorRenderModels(state)

    expect(model.from.x).toBeCloseTo(190, 2)
    expect(model.from.y).toBeCloseTo(130, 2)
    expect(model.to.x).toBeCloseTo(310, 2)
    expect(model.to.y).toBeCloseTo(130, 2)
    expect(model.label).toBe('next')
    expect(model.labelPosition).toEqual({ x: 250, y: 130 })
  })

  it('skips connectors when an endpoint is missing', () => {
    const state = [shape('a', 100, 100), connector('edge', 'a', 'missing')].reduce(
      (current, element) => addElement(current, element),
      createProjectState('demo'),
    )

    expect(calculateConnectorRenderModels(state)).toEqual([])
  })
})
```

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/canvas/ConnectionUpdater.test.ts
```

Expected: FAIL because `src/canvas/ConnectionUpdater.ts` does not exist.

## Task 2: Implement ConnectionUpdater

- [ ] **Step 1: Create `src/canvas/ConnectionUpdater.ts`**

```ts
import type {
  CanvasElement,
  ConnectorElement,
  ElementStyle,
  GroupElement,
  ShapeElement,
  TextElement,
} from '../state/elements'
import type { ProjectState } from '../state/projectState'

export interface ConnectorRenderModel {
  id: string
  from: Point
  to: Point
  label?: string
  labelPosition: Point
  style: ElementStyle
}

interface Point {
  x: number
  y: number
}

interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export function calculateConnectorRenderModels(
  state: ProjectState,
): ConnectorRenderModel[] {
  return state.elementOrder
    .map((elementId) => state.elements[elementId])
    .filter((element): element is ConnectorElement => element?.kind === 'connector')
    .flatMap((connectorElement) => {
      const fromElement = state.elements[connectorElement.fromId]
      const toElement = state.elements[connectorElement.toId]

      if (!fromElement || !toElement) {
        return []
      }

      const fromCenter = getElementCenter(fromElement)
      const toCenter = getElementCenter(toElement)
      const from = getAnchorPoint(fromElement, toCenter)
      const to = getAnchorPoint(toElement, fromCenter)

      return [
        {
          id: connectorElement.id,
          from,
          to,
          label: connectorElement.label,
          labelPosition: midpoint(from, to),
          style: connectorElement.style ?? {},
        },
      ]
    })
}

function getAnchorPoint(element: CanvasElement, target: Point): Point {
  if (element.kind === 'shape' && element.shape === 'circle') {
    return getCircleAnchor(element, target)
  }

  return getBoxAnchor(getElementBounds(element), target)
}

function getCircleAnchor(element: ShapeElement, target: Point): Point {
  const center = getElementCenter(element)
  const radius = Math.min(element.width, element.height) / 2
  const dx = target.x - center.x
  const dy = target.y - center.y
  const distance = Math.hypot(dx, dy)

  if (distance === 0) {
    return { x: center.x + radius, y: center.y }
  }

  return {
    x: center.x + (dx / distance) * radius,
    y: center.y + (dy / distance) * radius,
  }
}

function getBoxAnchor(bounds: Bounds, target: Point): Point {
  const center = getBoundsCenter(bounds)
  const dx = target.x - center.x
  const dy = target.y - center.y

  if (dx === 0 && dy === 0) {
    return { x: bounds.x + bounds.width, y: center.y }
  }

  const halfWidth = bounds.width / 2
  const halfHeight = bounds.height / 2
  const scale = Math.min(
    dx === 0 ? Number.POSITIVE_INFINITY : Math.abs(halfWidth / dx),
    dy === 0 ? Number.POSITIVE_INFINITY : Math.abs(halfHeight / dy),
  )

  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  }
}

function getElementBounds(element: CanvasElement): Bounds {
  if (element.kind === 'shape' || element.kind === 'group') {
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    }
  }

  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.style?.fontSize ?? 16,
  }
}

function getElementCenter(element: CanvasElement): Point {
  return getBoundsCenter(getElementBounds(element))
}

function getBoundsCenter(bounds: Bounds): Point {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  }
}

function midpoint(from: Point, to: Point): Point {
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  }
}
```

- [ ] **Step 2: Run focused test and verify GREEN**

```bash
npm run test -- src/canvas/ConnectionUpdater.test.ts
```

Expected: PASS.

## Task 3: Render Connectors In FabricRenderer

- [ ] **Step 1: Add failing renderer test for connectors**

Update `src/canvas/FabricRenderer.test.ts`:

- Add `line(points: [number, number, number, number], props: Record<string, unknown>): TObject` to `FabricObjectFactory` fake usage.
- Add `points?: [number, number, number, number]` to `FakeObject`.
- Implement fake `line`.
- Replace "still skips connector elements" with:

```ts
it('renders connectors as line objects with optional labels', () => {
  const state = [
    shape('a', 'rounded-rect', 100, 100),
    shape('b', 'rounded-rect', 280, 100),
    connector('edge', 'a', 'b', 'opens'),
  ].reduce((current, element) => addElement(current, element), createProjectState('demo'))
  const canvas = createFakeCanvas()

  renderProjectStateToFabric(canvas, state, createFakeFactory())

  expect(canvas.added.map((item) => item.type)).toEqual([
    'rect',
    'rect',
    'line',
    'textbox',
  ])
  expect(canvas.added[2].points).toEqual([260, 140, 280, 140])
  expect(canvas.added[2].props).toMatchObject({
    elementId: 'edge',
    renderRole: 'connector-line',
    stroke: '#64748b',
    strokeWidth: 2,
  })
  expect(canvas.added[3].text).toBe('opens')
  expect(canvas.added[3].props).toMatchObject({
    elementId: 'edge',
    renderRole: 'connector-label',
    left: 270,
    top: 140,
  })
})
```

- [ ] **Step 2: Run renderer focused test and verify RED**

```bash
npm run test -- src/canvas/FabricRenderer.test.ts
```

Expected: FAIL because renderer still does not create line objects.

- [ ] **Step 3: Update `src/canvas/FabricRenderer.ts`**

Add Fabric `Line` import and `ConnectionUpdater` import:

```ts
import { Circle, Line, Polygon, Rect, Textbox } from 'fabric'
import { calculateConnectorRenderModels } from './ConnectionUpdater'
```

Extend `FabricObjectFactory`:

```ts
line(points: [number, number, number, number], props: Record<string, unknown>): TObject
```

Extend `defaultFactory`:

```ts
line: (points, props) => new Line(points, props) as FabricTaggedObject,
```

Change object creation in `renderProjectStateToFabric` to render non-connectors first, then connectors:

```ts
const nextObjects = [
  ...state.elementOrder
    .map((elementId) => state.elements[elementId])
    .filter((element): element is CanvasElement => Boolean(element))
    .flatMap((element) => createObjectsForElement(element, factory)),
  ...createConnectorObjects(state, factory),
]
```

Keep `createObjectsForElement` returning `[]` for connectors.

Add:

```ts
function createConnectorObjects<TObject extends FabricTaggedObject>(
  state: ProjectState,
  factory: FabricObjectFactory<TObject>,
): TObject[] {
  return calculateConnectorRenderModels(state).flatMap((connector) => {
    const line = factory.line(
      [connector.from.x, connector.from.y, connector.to.x, connector.to.y],
      {
        elementId: connector.id,
        renderRole: 'connector-line',
        stroke: connector.style.stroke ?? '#64748b',
        strokeWidth: connector.style.strokeWidth ?? 2,
        fill: '',
        objectCaching: false,
      },
    )

    if (!connector.label) {
      return [line]
    }

    return [
      line,
      factory.textbox(connector.label, {
        elementId: connector.id,
        renderRole: 'connector-label',
        left: connector.labelPosition.x,
        top: connector.labelPosition.y,
        width: 160,
        fill: connector.style.textColor ?? '#334155',
        fontSize: connector.style.fontSize ?? 12,
        fontWeight: connector.style.fontWeight ?? 'normal',
        objectCaching: false,
      }),
    ]
  })
}
```

- [ ] **Step 4: Run renderer focused test and verify GREEN**

```bash
npm run test -- src/canvas/FabricRenderer.test.ts
```

Expected: PASS.

## Task 4: Update CanvasStage Demo

- [ ] **Step 1: Add a second demo shape**

In `createDemoProjectState`, add:

```ts
{
  id: 'agent-plan',
  kind: 'shape',
  shape: 'rounded-rect',
  label: 'Agent plan',
  parentId: 'demo-group',
  x: 392,
  y: 88,
  width: 220,
  height: 116,
  style: {
    fill: '#f7f7f7',
    stroke: '#171717',
    strokeWidth: 2,
  },
  meta: demoMeta,
}
```

- [ ] **Step 2: Add a connector element after both shapes**

```ts
{
  id: 'voice-to-plan',
  kind: 'connector',
  fromId: 'voice-brief',
  toId: 'agent-plan',
  label: 'plans',
  style: {
    stroke: '#64748b',
    strokeWidth: 2,
    textColor: '#334155',
    fontSize: 12,
  },
  meta: demoMeta,
}
```

- [ ] **Step 3: Run CanvasStage focused test**

```bash
npm run test -- src/components/CanvasStage/CanvasStage.test.tsx
```

Expected: PASS.

## Task 5: Verify PR Quality

- [ ] **Step 1: Run automated checks**

```bash
npm run test -- src/canvas/ConnectionUpdater.test.ts
npm run test -- src/canvas/FabricRenderer.test.ts
npm run test
npm run build
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 2: Browser smoke**

Run local Vite and check in Edge headless:

- canvas region exists.
- Fabric upper canvas exists.
- rendered demo area has non-white pixels.
- a connector-region sample between demo nodes has non-white pixels.
- console errors are 0.

- [ ] **Step 3: Review scope and safety**

```bash
git diff --stat
git diff --check
rg -n -e "fabric\.Group" -e "new\s+Group" -e "from 'fabric'.*Group" -e 'from "fabric".*Group' src
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md index.html
```

Expected:

- Diff touches only D4 plan, `ConnectionUpdater`, `FabricRenderer`, and `CanvasStage`.
- No Fabric Group usage appears.
- Secret scan finds no real credentials.

## Task 6: Commit, Push, and Open PR

- [ ] **Step 1: Stage and commit**

```bash
git add docs/superpowers/plans/2026-06-13-connection-updater-connectors.md src/canvas/ConnectionUpdater.ts src/canvas/ConnectionUpdater.test.ts src/canvas/FabricRenderer.ts src/canvas/FabricRenderer.test.ts src/components/CanvasStage/CanvasStage.tsx
git commit -m "feat: render connectors"
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin codex/voice-canvas-connectors
```

- [ ] **Step 3: Open GitHub PR**

Use title:

```text
feat: render connectors
```

Use body:

```markdown
## 功能描述

新增连接线渲染能力：ProjectState 中的 connector 元素会根据 fromId/toId 自动计算端点锚点，并渲染为 Fabric 直线；带 label 的连接线会在中点显示文字。CanvasStage 的 demo 也加入了一条从语音需求到 Agent plan 的连接线。

## 实现思路

新增 `ConnectionUpdater` 几何模块，把 connector 关系转换为可渲染的 line/label 模型。`FabricRenderer` 仍作为 Fabric 边界，负责把模型转换成 `Line` 和 `Textbox` 对象，并通过 `renderRole` 标记 connector line/label。当前 PR 实现确定性重渲染路径，不接拖拽事件、不做正交路由，也不使用 Fabric Group。

## 测试方式

- `npm run test -- src/canvas/ConnectionUpdater.test.ts`
- `npm run test -- src/canvas/FabricRenderer.test.ts`
- `npm run test`
- `npm run build`
- `npm run lint`
- 浏览器 smoke：本地 Vite + Edge headless，确认 canvas region、Fabric upper canvas、demo 区域和连接线区域非白像素均存在，console errors 为 0。

同时检查了 diff 范围、空白问题、敏感信息命中，以及没有 Fabric Group 用法。本 PR 没有新增第三方依赖。
```

- [ ] **Step 4: Confirm PR status**

```bash
gh pr view --json number,state,mergeStateStatus,isDraft,headRefName,baseRefName,url,title
```

Expected: PR is open against `main` and not draft.

## Self-Review

- Spec coverage: connectors render from relationships, anchor points are computed, optional labels render at midpoint.
- Placeholder scan: no implementation placeholder remains.
- Boundary check: interactive moving hooks and orthogonal routing are explicitly deferred.
