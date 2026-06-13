# Fabric Renderer Shapes And Text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render ProjectState shape and text elements onto the Fabric canvas while keeping ProjectState as the source of truth.

**Architecture:** `FabricRenderer` is a small canvas boundary module. It receives a Fabric-like canvas plus `ProjectState`, clears previously rendered objects, creates Fabric objects for shapes and text using global coordinates, tags every object with the source element ID, and leaves connectors, logical groups, movement, and editing for later PRs.

**Tech Stack:** TypeScript, Fabric.js, Vitest, existing ProjectState model.

---

## Scope

This PR implements only D2 from the MVP roadmap:

- Create `src/canvas/FabricRenderer.ts`.
- Create `src/canvas/FabricRenderer.test.ts`.
- Modify `src/components/CanvasStage/CanvasStage.tsx`.

This PR does not render connectors, does not render logical groups, does not use Fabric Group, and does not add drag/edit behavior.

## Files

- Create: `src/canvas/FabricRenderer.ts`
  - Export `renderProjectStateToFabric`.
  - Render `rect`, `rounded-rect`, `circle`, `diamond`, `cylinder` fallback, `sticky-note`, and text.
  - Tag each Fabric object with `elementId`.
- Create: `src/canvas/FabricRenderer.test.ts`
  - Use a fake object factory and fake canvas boundary to test mapping without depending on a real browser canvas.
- Modify: `src/components/CanvasStage/CanvasStage.tsx`
  - Build a tiny demo `ProjectState` and call `renderProjectStateToFabric` after Fabric canvas initialization.

## Task 1: Add Failing Renderer Tests

- [ ] **Step 1: Create `src/canvas/FabricRenderer.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { renderProjectStateToFabric } from './FabricRenderer'
import { addElement, createProjectState } from '../state/projectState'
import type {
  ConnectorElement,
  GroupElement,
  ShapeElement,
  TextElement,
} from '../state/elements'
import type { FabricObjectFactory, RenderableFabricCanvas } from './FabricRenderer'

const meta = {
  source: 'template' as const,
  createdAt: 1,
  updatedAt: 1,
}

const shape = (
  id: string,
  shapeType: ShapeElement['shape'],
  x = 100,
  y = 120,
): ShapeElement => ({
  id,
  kind: 'shape',
  shape: shapeType,
  label: id,
  x,
  y,
  width: 160,
  height: 80,
  style: {
    fill: '#fff7d6',
    stroke: '#2f2f2f',
    strokeWidth: 2,
  },
  meta,
})

const text = (id: string): TextElement => ({
  id,
  kind: 'text',
  text: 'Hello canvas',
  x: 280,
  y: 180,
  width: 220,
  style: {
    textColor: '#111111',
    fontSize: 18,
    fontWeight: 'bold',
  },
  meta,
})

const connector = (): ConnectorElement => ({
  id: 'edge',
  kind: 'connector',
  fromId: 'a',
  toId: 'b',
  meta,
})

const group = (): GroupElement => ({
  id: 'group',
  kind: 'group',
  label: 'Group',
  x: 80,
  y: 90,
  width: 300,
  height: 200,
  meta,
})

const createFakeFactory = () => {
  const factory: FabricObjectFactory<Record<string, unknown>> = {
    rect: (props) => ({ type: 'rect', props }),
    circle: (props) => ({ type: 'circle', props }),
    polygon: (points, props) => ({ type: 'polygon', points, props }),
    textbox: (textValue, props) => ({ type: 'textbox', text: textValue, props }),
  }

  return factory
}

const createFakeCanvas = (): RenderableFabricCanvas<Record<string, unknown>> & {
  added: Array<Record<string, unknown>>
  removed: Array<Record<string, unknown>>
} => ({
  added: [],
  removed: [],
  getObjects() {
    return [{ elementId: 'old' }]
  },
  add(...objects) {
    this.added.push(...objects)
  },
  remove(...objects) {
    this.removed.push(...objects)
  },
  requestRenderAll() {
    this.rendered = true
  },
})

describe('FabricRenderer', () => {
  it('renders supported shape and text elements with element IDs', () => {
    const state = [
      shape('rect', 'rect'),
      shape('round', 'rounded-rect'),
      shape('circle', 'circle'),
      shape('diamond', 'diamond'),
      shape('cylinder', 'cylinder'),
      shape('note', 'sticky-note'),
      text('title'),
    ].reduce((current, element) => addElement(current, element), createProjectState('demo'))
    const canvas = createFakeCanvas()

    renderProjectStateToFabric(canvas, state, createFakeFactory())

    expect(canvas.removed).toEqual([{ elementId: 'old' }])
    expect(canvas.added.map((item) => item.type)).toEqual([
      'rect',
      'rect',
      'circle',
      'polygon',
      'rect',
      'rect',
      'textbox',
    ])
    expect(canvas.added.map((item) => item.props.elementId)).toEqual([
      'rect',
      'round',
      'circle',
      'diamond',
      'cylinder',
      'note',
      'title',
    ])
  })

  it('skips connector and group elements for later renderer PRs', () => {
    const state = [shape('rect', 'rect'), connector(), group()].reduce(
      (current, element) => addElement(current, element),
      createProjectState('demo'),
    )
    const canvas = createFakeCanvas()

    renderProjectStateToFabric(canvas, state, createFakeFactory())

    expect(canvas.added).toHaveLength(1)
    expect(canvas.added[0].props.elementId).toBe('rect')
  })

  it('uses global coordinates and style defaults', () => {
    const state = addElement(createProjectState('demo'), shape('rect', 'rect', 40, 50))
    const canvas = createFakeCanvas()

    renderProjectStateToFabric(canvas, state, createFakeFactory())

    expect(canvas.added[0].props).toMatchObject({
      elementId: 'rect',
      left: 40,
      top: 50,
      width: 160,
      height: 80,
      fill: '#fff7d6',
      stroke: '#2f2f2f',
      strokeWidth: 2,
    })
  })
})
```

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/canvas/FabricRenderer.test.ts
```

Expected: FAIL because `src/canvas/FabricRenderer.ts` does not exist.

## Task 2: Implement FabricRenderer

- [ ] **Step 1: Create `src/canvas/FabricRenderer.ts`**

```ts
import { Circle, Polygon, Rect, Textbox } from 'fabric'
import type { CanvasElement, ShapeElement, TextElement } from '../state/elements'
import type { ProjectState } from '../state/projectState'

export interface RenderableFabricCanvas<TObject> {
  getObjects(): TObject[]
  add(...objects: TObject[]): void
  remove(...objects: TObject[]): void
  requestRenderAll(): void
}

export interface FabricObjectFactory<TObject> {
  rect(props: Record<string, unknown>): TObject
  circle(props: Record<string, unknown>): TObject
  polygon(points: Array<{ x: number; y: number }>, props: Record<string, unknown>): TObject
  textbox(text: string, props: Record<string, unknown>): TObject
}

type FabricTaggedObject = { elementId?: string }

const defaultFactory: FabricObjectFactory<FabricTaggedObject> = {
  rect: (props) => new Rect(props),
  circle: (props) => new Circle(props),
  polygon: (points, props) => new Polygon(points, props),
  textbox: (text, props) => new Textbox(text, props),
}

export function renderProjectStateToFabric<TObject extends FabricTaggedObject>(
  canvas: RenderableFabricCanvas<TObject>,
  state: ProjectState,
  factory: FabricObjectFactory<TObject> = defaultFactory as FabricObjectFactory<TObject>,
): void {
  const existingObjects = canvas.getObjects().filter((object) => object.elementId)
  canvas.remove(...existingObjects)

  const renderableObjects = state.elementOrder
    .map((elementId) => state.elements[elementId])
    .filter((element): element is CanvasElement => Boolean(element))
    .flatMap((element) => createObjectsForElement(element, factory))

  if (renderableObjects.length > 0) {
    canvas.add(...renderableObjects)
  }

  canvas.requestRenderAll()
}

function createObjectsForElement<TObject extends FabricTaggedObject>(
  element: CanvasElement,
  factory: FabricObjectFactory<TObject>,
): TObject[] {
  if (element.kind === 'shape') {
    return [createShapeObject(element, factory)]
  }

  if (element.kind === 'text') {
    return [createTextObject(element, factory)]
  }

  return []
}

function createShapeObject<TObject extends FabricTaggedObject>(
  element: ShapeElement,
  factory: FabricObjectFactory<TObject>,
): TObject {
  const baseProps = {
    elementId: element.id,
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    fill: element.style?.fill ?? '#ffffff',
    stroke: element.style?.stroke ?? '#171717',
    strokeWidth: element.style?.strokeWidth ?? 1,
    objectCaching: false,
  }

  if (element.shape === 'circle') {
    return factory.circle({
      ...baseProps,
      radius: Math.min(element.width, element.height) / 2,
    })
  }

  if (element.shape === 'diamond') {
    return factory.polygon(
      [
        { x: element.x + element.width / 2, y: element.y },
        { x: element.x + element.width, y: element.y + element.height / 2 },
        { x: element.x + element.width / 2, y: element.y + element.height },
        { x: element.x, y: element.y + element.height / 2 },
      ],
      {
        elementId: element.id,
        fill: baseProps.fill,
        stroke: baseProps.stroke,
        strokeWidth: baseProps.strokeWidth,
        objectCaching: false,
      },
    )
  }

  return factory.rect({
    ...baseProps,
    rx: element.shape === 'rounded-rect' || element.shape === 'sticky-note' ? 12 : 0,
    ry: element.shape === 'rounded-rect' || element.shape === 'sticky-note' ? 12 : 0,
  })
}

function createTextObject<TObject extends FabricTaggedObject>(
  element: TextElement,
  factory: FabricObjectFactory<TObject>,
): TObject {
  return factory.textbox(element.text, {
    elementId: element.id,
    left: element.x,
    top: element.y,
    width: element.width,
    fill: element.style?.textColor ?? '#171717',
    fontSize: element.style?.fontSize ?? 16,
    fontWeight: element.style?.fontWeight ?? 'normal',
    objectCaching: false,
  })
}
```

- [ ] **Step 2: Run focused test and verify GREEN**

```bash
npm run test -- src/canvas/FabricRenderer.test.ts
```

Expected: PASS.

## Task 3: Wire Demo ProjectState Into CanvasStage

- [ ] **Step 1: Modify `src/components/CanvasStage/CanvasStage.tsx`**

Import and call renderer after Fabric canvas setup:

```tsx
import { renderProjectStateToFabric } from '../../canvas/FabricRenderer'
```

Create a small demo state with one shape and one text element inside the component module, then call:

```tsx
renderProjectStateToFabric(fabricCanvas, createDemoProjectState())
```

- [ ] **Step 2: Run CanvasStage test**

```bash
npm run test -- src/components/CanvasStage/CanvasStage.test.tsx
```

Expected: PASS.

## Task 4: Verify PR Quality

- [ ] **Step 1: Run automated checks**

```bash
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
- Fabric lower canvas contains rendered objects.
- console errors are 0.

- [ ] **Step 3: Review scope and safety**

```bash
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
rg -n -e "fabric.Group" -e "new\\s+Group" -e "from 'fabric'.*Group" -e 'from "fabric".*Group' src
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md index.html
```

Expected:

- Diff touches only D2 plan, `src/canvas`, and `CanvasStage`.
- No Fabric Group usage appears.
- Secret scan finds no real credentials.

## Task 5: Commit, Push, and Open PR

- [ ] **Step 1: Stage and commit**

```bash
git add docs/superpowers/plans/2026-06-13-fabric-renderer-shapes-text.md src/canvas/FabricRenderer.ts src/canvas/FabricRenderer.test.ts src/components/CanvasStage/CanvasStage.tsx
git commit -m "feat: render project shapes and text"
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin codex/voice-canvas-fabric-renderer
```

- [ ] **Step 3: Open GitHub PR**

Use title:

```text
feat: render project shapes and text
```

Use body:

```markdown
## 功能描述

新增 FabricRenderer，把 ProjectState 中的形状和文本元素渲染到 Fabric 画布，并在 CanvasStage 中加载一个最小演示状态，方便评审直接看到真实绘制结果。

## 实现思路

`renderProjectStateToFabric` 以 ProjectState 为唯一输入源，先移除上一轮带 `elementId` 的 Fabric 对象，再按 `elementOrder` 创建 shape/text 对象并写入全局坐标。每个 Fabric 对象都会带上 `elementId`，方便后续拖拽、选择和增量更新。当前 PR 暂不渲染 connector 和 logical group，也不使用 Fabric Group。

## 测试方式

- `npm run test -- src/canvas/FabricRenderer.test.ts`
- `npm run test`
- `npm run build`
- `npm run lint`
- 浏览器 smoke：本地 Vite + Edge headless，确认 canvas region、Fabric upper canvas、渲染对象均存在，console errors 为 0。

同时检查了 diff 范围、空白问题、敏感信息命中，以及没有 Fabric Group 用法。
```

- [ ] **Step 4: Confirm PR status**

```bash
gh pr view --json number,state,mergeStateStatus,isDraft,headRefName,baseRefName,url,title
```

Expected: PR is open against `main` and not draft.

## Self-Review

- Spec coverage: renders rectangle, rounded rectangle, circle, diamond, cylinder fallback, sticky note, and text; uses global coordinates; tags objects with element IDs.
- Placeholder scan: no implementation placeholder remains.
- Boundary check: ProjectState remains source of truth; connectors and groups remain explicitly deferred.
