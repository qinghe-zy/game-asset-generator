# CanvasStage Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Fabric.js and mount a real canvas stage shell without adding drawing logic.

**Architecture:** `CanvasStage` is a focused React component that owns a single HTML `<canvas>` and initializes a Fabric `Canvas` instance on mount. The component disposes Fabric on unmount, exposes a stable accessible canvas region, and leaves all ProjectState rendering for later PRs.

**Tech Stack:** React, TypeScript, Fabric.js, Vitest, jsdom.

---

## Scope

This PR implements only D1 from the MVP roadmap:

- Install `fabric`.
- Add `src/components/CanvasStage/CanvasStage.tsx`.
- Add `src/components/CanvasStage/CanvasStage.css`.
- Add focused component tests.
- Replace the placeholder canvas region in `src/App.tsx` with `CanvasStage`.
- Update `README.md` dependency notes.

This PR does not render ProjectState elements, add Fabric groups, implement connectors, or add canvas editing behavior.

## Files

- Modify: `package.json`
  - Add `fabric` under `dependencies`.
- Modify: `package-lock.json`
  - Lock Fabric and its transitive dependencies.
- Modify: `README.md`
  - List Fabric.js and explain that it powers the interactive canvas renderer.
- Create: `src/components/CanvasStage/CanvasStage.tsx`
  - Render a canvas region and initialize/dispose Fabric.
- Create: `src/components/CanvasStage/CanvasStage.css`
  - Style the shell as a real workbench canvas area.
- Create: `src/components/CanvasStage/CanvasStage.test.tsx`
  - Verify accessible stage and canvas render.
- Modify: `src/App.tsx`
  - Use `CanvasStage` instead of the placeholder empty canvas.
- Modify: `src/App.css`
  - Remove placeholder-only styles if unused and keep workbench shell layout.
- Modify: `index.html`
  - Add an empty favicon data URL so browser smoke checks do not report `/favicon.ico` 404 noise.

## Task 1: Install Fabric

- [x] **Step 1: Install Fabric**

```bash
npm install fabric
```

Expected:

- `package.json` includes `fabric`.
- `package-lock.json` records the installed version.
- `npm audit` reports no vulnerabilities.

## Task 2: Add Failing CanvasStage Test

- [x] **Step 1: Create `src/components/CanvasStage/CanvasStage.test.tsx`**

```tsx
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { CanvasStage } from './CanvasStage'

let container: HTMLDivElement | undefined

afterEach(() => {
  container?.remove()
  container = undefined
})

const renderCanvasStage = () => {
  container = document.createElement('div')
  document.body.append(container)

  act(() => {
    createRoot(container!).render(<CanvasStage />)
  })
}

describe('CanvasStage', () => {
  it('renders a real canvas inside the canvas work area', () => {
    renderCanvasStage()

    expect(
      document.querySelector('[aria-label="Canvas drawing surface"]'),
    ).not.toBeNull()
    expect(document.querySelector('[data-testid="fabric-canvas"]')).toBeInstanceOf(
      HTMLCanvasElement,
    )
  })
})
```

- [x] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/components/CanvasStage/CanvasStage.test.tsx
```

Expected: FAIL because `CanvasStage.tsx` does not exist.

## Task 3: Implement CanvasStage Shell

- [x] **Step 1: Create `src/components/CanvasStage/CanvasStage.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { Canvas } from 'fabric'
import './CanvasStage.css'

const CANVAS_WIDTH = 1280
const CANVAS_HEIGHT = 720

export function CanvasStage() {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvasElement = canvasElementRef.current

    if (!canvasElement) {
      return
    }

    const fabricCanvas = new Canvas(canvasElement, {
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: false,
    })

    fabricCanvas.setDimensions({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    })
    fabricCanvas.renderAll()

    return () => {
      void fabricCanvas.dispose()
    }
  }, [])

  return (
    <section className="canvasStage" aria-label="Canvas drawing surface">
      <canvas
        ref={canvasElementRef}
        className="canvasStageSurface"
        data-testid="fabric-canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
    </section>
  )
}
```

- [x] **Step 2: Create `src/components/CanvasStage/CanvasStage.css`**

```css
.canvasStage {
  min-height: 480px;
  overflow: auto;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background:
    linear-gradient(#f0f0f0 1px, transparent 1px),
    linear-gradient(90deg, #f0f0f0 1px, transparent 1px),
    #f7f7f7;
  background-size: 32px 32px;
  box-shadow:
    0 1px 1px rgb(0 0 0 / 4%),
    0 8px 24px rgb(0 0 0 / 6%);
}

.canvasStageSurface {
  display: block;
  width: min(1280px, 100%);
  min-width: 720px;
  height: auto;
  background: #ffffff;
}
```

- [x] **Step 3: Run focused test and verify GREEN**

```bash
npm run test -- src/components/CanvasStage/CanvasStage.test.tsx
```

Expected: PASS.

## Task 4: Wire CanvasStage Into App

- [x] **Step 1: Modify `src/App.tsx`**

Replace the placeholder `emptyCanvas` block with:

```tsx
import { CanvasStage } from './components/CanvasStage/CanvasStage'
```

and:

```tsx
<CanvasStage />
```

- [x] **Step 2: Modify `src/App.css`**

Remove `.emptyCanvas`, `.emptyCanvasTitle`, and `.emptyCanvasText` rules if they are no longer used. Keep the existing app shell, top bar, workspace, and voice bar styles.

- [x] **Step 3: Run full test suite**

```bash
npm run test
```

Expected: PASS.

- [x] **Step 4: Add favicon noise guard**

Modify `index.html`:

```html
<link rel="icon" href="data:," />
```

Expected: Browser smoke checks no longer report a `/favicon.ico` 404.

## Task 5: Update Dependency Documentation

- [x] **Step 1: Modify `README.md`**

Add this bullet under `## Dependencies`:

```markdown
- Fabric.js: power the interactive canvas surface and future ProjectState rendering.
```

- [x] **Step 2: Verify README mentions Fabric**

```bash
rg -n "Fabric|fabric" README.md package.json package-lock.json
```

Expected: README and package files mention Fabric.

## Task 6: Verify PR Quality

- [x] **Step 1: Run automated checks**

```bash
npm run test -- src/components/CanvasStage/CanvasStage.test.tsx
npm run test
npm run build
npm run lint
```

Expected: all commands exit 0.

- [x] **Step 2: Review scope and safety**

```bash
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
rg -n -e "fabric.Group" -e "new Group" -e "Group(" src
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md
```

Expected:

- Diff touches only D1 plan, package files, README, App shell, and CanvasStage files.
- No Fabric Group usage appears.
- Secret scan finds no real credentials.

## Task 7: Commit, Push, and Open PR

- [ ] **Step 1: Stage and commit**

```bash
git add docs/superpowers/plans/2026-06-13-canvas-stage-shell.md index.html package.json package-lock.json README.md src/App.tsx src/App.css src/components/CanvasStage/CanvasStage.tsx src/components/CanvasStage/CanvasStage.css src/components/CanvasStage/CanvasStage.test.tsx
git commit -m "feat: add fabric canvas stage shell"
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin codex/voice-canvas-canvas-stage
```

- [ ] **Step 3: Open GitHub PR**

Use title:

```text
feat: add fabric canvas stage shell
```

Use body:

```markdown
## 功能描述

新增 Fabric.js 画布舞台壳层，把首页中原来的占位画布替换为真实的 `<canvas>` 区域，为后续 ProjectState 渲染、拖拽和连线更新打基础。

## 实现思路

`CanvasStage` 在 React mount 时创建 Fabric `Canvas`，设置固定画布尺寸和白色背景，并在 unmount 时调用 `dispose()` 清理资源。本轮只负责安全挂载真实画布，不绘制业务元素，也不使用 Fabric Group。README 已补充 Fabric.js 依赖用途。

## 测试方式

- `npm run test -- src/components/CanvasStage/CanvasStage.test.tsx`
- `npm run test`
- `npm run build`
- `npm run lint`

同时检查了 diff 范围、空白问题、敏感信息命中，以及没有 Fabric Group 用法。
```

- [ ] **Step 4: Confirm PR status**

```bash
gh pr view --json number,state,mergeStateStatus,isDraft,headRefName,baseRefName,url,title
```

Expected: PR is open against `main` and not draft.

## Self-Review

- Spec coverage: covers Fabric dependency, README dependency note, CanvasStage shell, safe Fabric mount/dispose, runnable app shell, and no Fabric Group usage.
- Placeholder scan: no implementation placeholder remains.
- Type consistency: `CanvasStage` is a React component imported directly by `App`.
