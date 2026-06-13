# PendingPlan Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire local template planning, pending confirmation, execution, cancellation, and undo into the app state so a text compatibility command can render a useful diagram on the canvas.

**Architecture:** Keep runtime state in a focused React hook under `src/app`. `App` owns the current `ProjectState`, pending `AgentPlan`, text debug input, status message, and undo history through `CommandManager`; `CanvasStage` becomes a presentational renderer that receives state as a prop.

**Tech Stack:** React 19, TypeScript, Vitest/jsdom, existing `LocalTemplateAgent`, `CommandBuilder`, `CommandManager`, `FabricRenderer`, and `ProjectState`.

---

### Task 1: Add pending runtime tests

**Files:**
- Create: `src/app/useVoiceCanvasController.test.ts`
- Create: `src/App.test.tsx`

- [x] **Step 1: Write failing hook tests**

Test `useVoiceCanvasController` with React `act`:
- initial state has the demo project and no pending plan.
- `requestPlan("画一个用户注册登录流程图")` creates a pending plan without changing the canvas.
- `executePendingPlan()` applies the macro command and clears pending.
- `cancelPendingPlan()` clears pending without changing the canvas.
- `undo()` removes the generated flow as one macro step.

- [x] **Step 2: Write failing app interaction tests**

Render `<App />` into jsdom and assert:
- the text compatibility input is visible and clearly labeled.
- submitting a prompt shows a pending plan panel with Execute and Cancel controls.
- Execute updates `window.getProjectState()` with generated flow elements.

- [x] **Step 3: Run tests and confirm RED**

Run:

```bash
npm run test -- src/app/useVoiceCanvasController.test.ts src/App.test.tsx
```

Expected: FAIL because the hook, panel, and app wiring do not exist yet.

### Task 2: Implement controller hook

**Files:**
- Create: `src/app/demoProjectState.ts`
- Create: `src/app/useVoiceCanvasController.ts`

- [x] **Step 1: Move demo state factory**

Move the existing demo project creation out of `CanvasStage` into `src/app/demoProjectState.ts` so runtime state and debug state have one source of truth.

- [x] **Step 2: Add `useVoiceCanvasController`**

The hook should expose:
- `projectState`
- `pendingPlan`
- `statusMessage`
- `textPrompt`
- `setTextPrompt`
- `requestPlan`
- `executePendingPlan`
- `cancelPendingPlan`
- `undo`
- `canUndo`

Use `createLocalTemplatePlan()` for planning and `buildPlanCommand()` + `CommandManager` for execution.

- [x] **Step 3: Run focused hook tests and confirm GREEN**

Run:

```bash
npm run test -- src/app/useVoiceCanvasController.test.ts
```

### Task 3: Implement pending plan UI

**Files:**
- Create: `src/components/PendingPlanPanel/PendingPlanPanel.tsx`
- Create: `src/components/PendingPlanPanel/PendingPlanPanel.css`
- Modify: `src/components/CanvasStage/CanvasStage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [x] **Step 1: Make CanvasStage receive ProjectState**

Change `CanvasStage` to accept `projectState: ProjectState` and render whenever it changes. Register debug state from that prop.

- [x] **Step 2: Add PendingPlanPanel**

Show plan summary, operation count, fallback reason when present, and buttons:
- Execute
- Cancel

Use compact workbench styling: near-white surface, hairline border, small mono label, no modal overlay.

- [x] **Step 3: Wire App**

Add a text compatibility input in the footer area. Submitting it calls `requestPlan`. Show pending panel above the canvas. Add an Undo button for this PR's manual acceptance.

- [x] **Step 4: Run app interaction tests and confirm GREEN**

Run:

```bash
npm run test -- src/App.test.tsx
```

### Task 4: PR verification

**Files:**
- Review all files touched in Tasks 2 and 3.

- [x] **Step 1: Run complete automated checks**

Run:

```bash
npm run test
npm run build
npm run lint
```

- [x] **Step 2: Run browser manual acceptance**

Run Vite locally and verify:
- Type `画一个用户注册登录流程图`.
- Pending plan appears.
- Execute renders a flow on canvas.
- Undo removes the generated flow.
- Cancel clears a pending plan without changing canvas.
- UI follows `D:\Project\voice-canvas\DESIGN.md`: workbench-first, near-white surfaces, ink text, hairline borders, compact controls, no overlapping text.

- [x] **Step 3: Run review and safety checks**

Run:

```bash
git diff --check
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md index.html
rg -n -e "fabric\\.Group" -e "new\\s+Group" -e "from 'fabric'.*Group" -e 'from "fabric".*Group' src
```

Review scope: this PR should not add Web Speech, remote LLM, Serverless code, persistence, export, or broad command routing.

- [ ] **Step 4: Commit, push, and open PR**

Commit:

```bash
git add docs/superpowers/plans/2026-06-13-pending-plan-runtime.md src/app src/components/PendingPlanPanel src/components/CanvasStage src/App.tsx src/App.css src/App.test.tsx
git commit -m "feat: wire pending plan runtime"
git push -u origin codex/voice-canvas-pending-plan-runtime
```

Open a PR with:
- `## 功能描述`
- `## 实现思路`
- `## 测试方式`

Mention that no third-party dependency was added and no previous personal code was reused.
