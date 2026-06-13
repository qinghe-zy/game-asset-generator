# Project State Debug Exposure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose a development/test-only `window.getProjectState()` helper so browser smoke and future E2E tests can assert ProjectState JSON instead of fragile canvas pixels.

**Architecture:** Add a tiny debug module that registers a getter on `window` only in Vite development/test modes. CanvasStage remains the current owner of the demo ProjectState and registers the getter while mounted, cleaning it up on unmount.

**Tech Stack:** TypeScript, React, Vite env flags, Vitest.

---

## Scope

This PR implements only D5 from the MVP roadmap:

- Create `src/debug/projectStateDebug.ts`.
- Create `src/debug/projectStateDebug.test.ts`.
- Modify `src/components/CanvasStage/CanvasStage.tsx`.
- Modify `src/components/CanvasStage/CanvasStage.test.tsx`.

This PR does not introduce app-wide state management, persistence, Agent execution, or production telemetry. The helper is only available in `import.meta.env.DEV` or `import.meta.env.MODE === 'test'`.

## Task 1: Add Failing Debug Module Tests

- [ ] **Step 1: Create `src/debug/projectStateDebug.test.ts`**

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { clearProjectStateDebug, registerProjectStateDebug } from './projectStateDebug'
import { createProjectState } from '../state/projectState'

declare global {
  interface Window {
    getProjectState?: () => unknown
  }
}

afterEach(() => {
  clearProjectStateDebug()
})

describe('projectStateDebug', () => {
  it('registers a window getter in test mode', () => {
    const state = createProjectState('debug demo')

    const cleanup = registerProjectStateDebug(() => state)

    expect(window.getProjectState?.()).toBe(state)
    cleanup()
    expect(window.getProjectState).toBeUndefined()
  })

  it('replaces an existing debug getter and clears only the active getter', () => {
    const first = createProjectState('first')
    const second = createProjectState('second')

    const cleanupFirst = registerProjectStateDebug(() => first)
    const cleanupSecond = registerProjectStateDebug(() => second)

    expect(window.getProjectState?.()).toBe(second)
    cleanupFirst()
    expect(window.getProjectState?.()).toBe(second)
    cleanupSecond()
    expect(window.getProjectState).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm run test -- src/debug/projectStateDebug.test.ts
```

Expected: FAIL because `src/debug/projectStateDebug.ts` does not exist.

## Task 2: Implement Debug Module

- [ ] **Step 1: Create `src/debug/projectStateDebug.ts`**

```ts
import type { ProjectState } from '../state/projectState'

declare global {
  interface Window {
    getProjectState?: () => ProjectState
  }
}

type ProjectStateGetter = () => ProjectState

let activeGetter: ProjectStateGetter | undefined

export function registerProjectStateDebug(
  getProjectState: ProjectStateGetter,
): () => void {
  if (!isProjectStateDebugEnabled()) {
    return () => undefined
  }

  activeGetter = getProjectState
  window.getProjectState = getProjectState

  return () => {
    if (activeGetter === getProjectState) {
      clearProjectStateDebug()
    }
  }
}

export function clearProjectStateDebug(): void {
  activeGetter = undefined
  delete window.getProjectState
}

function isProjectStateDebugEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'test'
}
```

- [ ] **Step 2: Run focused test and verify GREEN**

```bash
npm run test -- src/debug/projectStateDebug.test.ts
```

Expected: PASS.

## Task 3: Wire CanvasStage To Debug Getter

- [ ] **Step 1: Modify `src/components/CanvasStage/CanvasStage.tsx`**

Import the debug registration helper:

```ts
import { registerProjectStateDebug } from '../../debug/projectStateDebug'
```

Create the demo state once at module level:

```ts
const demoProjectState = createDemoProjectState()
```

Inside `useEffect`, after the Fabric canvas dimensions are set:

```ts
const cleanupProjectStateDebug = registerProjectStateDebug(() => demoProjectState)
renderProjectStateToFabric(fabricCanvas, demoProjectState)
```

In cleanup:

```ts
cleanupProjectStateDebug()
void fabricCanvas.dispose()
```

- [ ] **Step 2: Update `src/components/CanvasStage/CanvasStage.test.tsx`**

Add an assertion after rendering:

```ts
const debugState = window.getProjectState?.()
expect(debugState?.elements['voice-to-plan']?.kind).toBe('connector')
expect(debugState?.elementOrder).toContain('voice-to-plan')
```

Keep the existing canvas assertions.

- [ ] **Step 3: Run CanvasStage focused test**

```bash
npm run test -- src/components/CanvasStage/CanvasStage.test.tsx
```

Expected: PASS.

## Task 4: Verify PR Quality

- [ ] **Step 1: Run automated checks**

```bash
npm run test -- src/debug/projectStateDebug.test.ts
npm run test -- src/components/CanvasStage/CanvasStage.test.tsx
npm run test
npm run build
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 2: Browser smoke**

Run local Vite and check in Edge headless:

- canvas region exists.
- `window.getProjectState()` exists in dev.
- returned state includes `voice-to-plan`.
- no obvious API keys or sensitive config are exposed.
- console errors are 0.

- [ ] **Step 3: Review scope and safety**

```bash
git diff --stat
git diff --check
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md index.html
```

Expected:

- Diff touches only D5 plan, `src/debug`, and CanvasStage files.
- Secret scan finds no real credentials.
- Debug helper is gated to dev/test only.

## Task 5: Commit, Push, and Open PR

- [ ] **Step 1: Stage and commit**

```bash
git add docs/superpowers/plans/2026-06-13-project-state-debug.md src/debug/projectStateDebug.ts src/debug/projectStateDebug.test.ts src/components/CanvasStage/CanvasStage.tsx src/components/CanvasStage/CanvasStage.test.tsx
git commit -m "feat: expose project state debug getter"
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin codex/voice-canvas-project-state-debug
```

- [ ] **Step 3: Open GitHub PR**

Use title:

```text
feat: expose project state debug getter
```

Use body:

```markdown
## 功能描述

新增开发/测试环境下的 `window.getProjectState()` 调试入口，方便手工验收和后续 E2E 测试直接断言 ProjectState JSON，而不是依赖脆弱的 canvas 像素截图。当前 CanvasStage 会在挂载时暴露 demo ProjectState，并在卸载时清理。

## 实现思路

新增 `projectStateDebug` 小模块，只在 Vite dev 或 test 模式注册 window getter。CanvasStage 继续持有当前 demo ProjectState，并把同一个 state 同时交给 FabricRenderer 和 debug getter。该 PR 不引入生产遥测、不暴露密钥，也不改变用户可见交互。

## 测试方式

- `npm run test -- src/debug/projectStateDebug.test.ts`
- `npm run test -- src/components/CanvasStage/CanvasStage.test.tsx`
- `npm run test`
- `npm run build`
- `npm run lint`
- 浏览器 smoke：本地 Vite + Edge headless，确认 canvas region 存在，`window.getProjectState()` 返回包含 `voice-to-plan` 的 ProjectState，console errors 为 0。

同时检查了 diff 范围、空白问题和敏感信息命中。本 PR 没有新增第三方依赖。
```

- [ ] **Step 4: Confirm PR status**

```bash
gh pr view --json number,state,mergeStateStatus,isDraft,headRefName,baseRefName,url,title
```

Expected: PR is open against `main` and not draft.

## Self-Review

- Spec coverage: `window.getProjectState()` is available for dev/test and returns serializable ProjectState.
- Safety: helper is not intended for production and does not expose secrets.
- Boundary check: no app controller, persistence, Agent pipeline, or E2E dependency is added in this PR.
