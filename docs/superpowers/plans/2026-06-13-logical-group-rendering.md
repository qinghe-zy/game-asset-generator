# Logical Group Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render ProjectState logical groups as global-coordinate background rectangles with separate titles, without using Fabric Group.

**Architecture:** Extend the existing `FabricRenderer` boundary so group elements create ordinary Fabric rectangle/textbox objects before shape/text children. Group nesting remains only in `ProjectState.parentId`; Fabric receives flat absolute-positioned objects tagged with element IDs and render roles.

**Tech Stack:** TypeScript, Fabric.js, Vitest, existing ProjectState model.

---

## Scope

This PR implements only D3 from the MVP roadmap:

- Modify `src/canvas/FabricRenderer.ts`.
- Modify `src/canvas/FabricRenderer.test.ts`.
- Modify `src/components/CanvasStage/CanvasStage.tsx` demo state to show one group with existing shape/text children.

This PR does not implement drag behavior, child movement, connector rendering, connector updates, selection, or native `fabric.Group`.

## Files

- Modify: `src/canvas/FabricRenderer.ts`
  - Add group rendering as flat Fabric objects.
  - Render group background before child elements.
  - Render group title as a separate textbox.
  - Tag objects with `elementId` and a small `renderRole` value.
- Modify: `src/canvas/FabricRenderer.test.ts`
  - Add tests for group background/title creation.
  - Add tests proving connectors remain skipped and no native group factory is used.
- Modify: `src/components/CanvasStage/CanvasStage.tsx`
  - Add a demo group around the existing demo shape/text.

## Task 1: Add Failing Group Renderer Tests

- [ ] **Step 1: Update `src/canvas/FabricRenderer.test.ts` fake object model**

Add `renderRole?: string` to `FakeObject` and continue keeping `props: Record<string, unknown>`.

- [ ] **Step 2: Add a group helper**

```ts
const group = (id = 'group'): GroupElement => ({
  id,
  kind: 'group',
  label: 'Frontend group',
  x: 70,
  y: 72,
  width: 310,
  height: 170,
  style: {
    fill: '#f8fafc',
    stroke: '#cbd5e1',
    strokeWidth: 1,
    textColor: '#475569',
    fontSize: 13,
  },
  meta,
})
```

- [ ] **Step 3: Add a failing test for group background and title**

```ts
it('renders logical groups as background rectangles and separate titles before children', () => {
  const groupedShape = {
    ...shape('child', 'rounded-rect', 120, 120),
    parentId: 'group',
  }
  const state = [group(), groupedShape, text('label')].reduce(
    (current, element) => addElement(current, element),
    createProjectState('demo'),
  )
  const canvas = createFakeCanvas()

  renderProjectStateToFabric(canvas, state, createFakeFactory())

  expect(canvas.added.map((item) => item.type)).toEqual([
    'rect',
    'textbox',
    'rect',
    'textbox',
  ])
  expect(canvas.added.map((item) => item.props.renderRole)).toEqual([
    'group-background',
    'group-title',
    undefined,
    undefined,
  ])
  expect(canvas.added[0].props).toMatchObject({
    elementId: 'group',
    renderRole: 'group-background',
    left: 70,
    top: 72,
    width: 310,
    height: 170,
    fill: '#f8fafc',
    stroke: '#cbd5e1',
    strokeWidth: 1,
  })
  expect(canvas.added[1].props).toMatchObject({
    elementId: 'group',
    renderRole: 'group-title',
    left: 82,
    top: 82,
    width: 286,
    fill: '#475569',
    fontSize: 13,
  })
  expect(canvas.added[1].text).toBe('Frontend group')
})
```

- [ ] **Step 4: Add a test that connectors still skip while groups render**

Replace the existing "skips connector and group elements" expectation with:

```ts
it('renders groups but still skips connector elements for later renderer PRs', () => {
  const state = [group(), shape('rect', 'rect'), connector()].reduce(
    (current, element) => addElement(current, element),
    createProjectState('demo'),
  )
  const canvas = createFakeCanvas()

  renderProjectStateToFabric(canvas, state, createFakeFactory())

  expect(canvas.added.map((item) => item.props.elementId)).toEqual([
    'group',
    'group',
    'rect',
  ])
  expect(canvas.added.some((item) => item.props.elementId === 'edge')).toBe(false)
})
```

- [ ] **Step 5: Run focused test and verify RED**

```bash
npm run test -- src/canvas/FabricRenderer.test.ts
```

Expected: FAIL because `FabricRenderer` currently skips group elements.

## Task 2: Implement Group Rendering

- [ ] **Step 1: Update `src/canvas/FabricRenderer.ts` imports**

Add `GroupElement` to the existing type import:

```ts
import type {
  CanvasElement,
  GroupElement,
  ShapeElement,
  TextElement,
} from '../state/elements'
```

- [ ] **Step 2: Route group elements in `createObjectsForElement`**

```ts
if (element.kind === 'group') {
  return createGroupObjects(element, factory)
}
```

Place this before the final `return []`.

- [ ] **Step 3: Add group rendering constants and helper**

```ts
const GROUP_TITLE_OFFSET_X = 12
const GROUP_TITLE_OFFSET_Y = 10
const GROUP_TITLE_RESERVED_HEIGHT = 24
const GROUP_CORNER_RADIUS = 10

function createGroupObjects<TObject extends FabricTaggedObject>(
  element: GroupElement,
  factory: FabricObjectFactory<TObject>,
): TObject[] {
  const background = factory.rect({
    elementId: element.id,
    renderRole: 'group-background',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    fill: element.style?.fill ?? '#f8fafc',
    stroke: element.style?.stroke ?? '#d4d4d4',
    strokeWidth: element.style?.strokeWidth ?? 1,
    rx: GROUP_CORNER_RADIUS,
    ry: GROUP_CORNER_RADIUS,
    objectCaching: false,
  })

  const title = factory.textbox(element.label ?? element.id, {
    elementId: element.id,
    renderRole: 'group-title',
    left: element.x + GROUP_TITLE_OFFSET_X,
    top: element.y + GROUP_TITLE_OFFSET_Y,
    width: Math.max(1, element.width - GROUP_TITLE_OFFSET_X * 2),
    height: GROUP_TITLE_RESERVED_HEIGHT,
    fill: element.style?.textColor ?? '#525252',
    fontSize: element.style?.fontSize ?? 13,
    fontWeight: element.style?.fontWeight ?? 'bold',
    objectCaching: false,
  })

  return [background, title]
}
```

- [ ] **Step 4: Run focused test and verify GREEN**

```bash
npm run test -- src/canvas/FabricRenderer.test.ts
```

Expected: PASS.

## Task 3: Update CanvasStage Demo State

- [ ] **Step 1: Add a logical group element before existing demo children**

In `createDemoProjectState`, insert this element first:

```ts
{
  id: 'demo-group',
  kind: 'group',
  label: 'Voice planning area',
  x: 72,
  y: 64,
  width: 308,
  height: 176,
  style: {
    fill: '#f8fafc',
    stroke: '#d9e2e8',
    strokeWidth: 1,
    textColor: '#5d6b78',
    fontSize: 13,
  },
  meta: demoMeta,
}
```

- [ ] **Step 2: Add `parentId: 'demo-group'` to the existing shape and text demo elements**

Both child elements keep their global `x`/`y` coordinates. Do not convert them to local coordinates.

- [ ] **Step 3: Run CanvasStage focused test**

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
- rendered demo area has non-white pixels.
- console errors are 0.

- [ ] **Step 3: Review scope and safety**

```bash
git diff --stat
git diff --check
rg -n -e "fabric\.Group" -e "new\s+Group" -e "from 'fabric'.*Group" -e 'from "fabric".*Group' src
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md index.html
```

Expected:

- Diff touches only the D3 plan, `src/canvas/FabricRenderer.ts`, `src/canvas/FabricRenderer.test.ts`, and `CanvasStage`.
- No Fabric Group usage appears.
- Secret scan finds no real credentials.

## Task 5: Commit, Push, and Open PR

- [ ] **Step 1: Stage and commit**

```bash
git add docs/superpowers/plans/2026-06-13-logical-group-rendering.md src/canvas/FabricRenderer.ts src/canvas/FabricRenderer.test.ts src/components/CanvasStage/CanvasStage.tsx
git commit -m "feat: render logical groups"
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin codex/voice-canvas-logical-groups
```

- [ ] **Step 3: Open GitHub PR**

Use title:

```text
feat: render logical groups
```

Use body:

```markdown
## 功能描述

新增逻辑分组渲染能力：ProjectState 中的 group 元素会显示为画布上的背景矩形和独立标题，子元素仍使用全局坐标渲染。CanvasStage 的 demo 也加入了一个分组区域，评审打开页面即可看到分组效果。

## 实现思路

在 FabricRenderer 内部把 group 降级为普通 Rect + Textbox 两个 Fabric 对象，并用 `renderRole` 标记 `group-background` 和 `group-title`。分组关系仍只保存在 ProjectState 的 `parentId` 中，渲染层保持单一全局坐标系；本 PR 没有使用 Fabric 原生 Group，也没有实现拖拽联动或连接线。

## 测试方式

- `npm run test -- src/canvas/FabricRenderer.test.ts`
- `npm run test`
- `npm run build`
- `npm run lint`
- 浏览器 smoke：本地 Vite + Edge headless，确认 canvas region、Fabric upper canvas、demo 区域非白像素均存在，console errors 为 0。

同时检查了 diff 范围、空白问题、敏感信息命中，以及没有 Fabric Group 用法。本 PR 没有新增第三方依赖。
```

- [ ] **Step 4: Confirm PR status**

```bash
gh pr view --json number,state,mergeStateStatus,isDraft,headRefName,baseRefName,url,title
```

Expected: PR is open against `main` and not draft.

## Self-Review

- Spec coverage: groups render as flat background rectangles and separate titles; parent relation remains in ProjectState; children retain global coordinates.
- Placeholder scan: no implementation placeholder remains.
- Boundary check: no connectors, drag behavior, selection, or native Fabric Group are introduced.
