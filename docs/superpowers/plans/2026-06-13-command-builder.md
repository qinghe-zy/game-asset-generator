# CommandBuilder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert validated `AgentPlan` objects into one macro `Command` that updates `ProjectState` and can be undone as a single user action.

**Architecture:** `CommandBuilder` lives in `src/agent` because it is the boundary between Agent planning and command execution. It validates the plan, builds transient canvas elements, applies the selected layout engine before creating elements, and returns a macro command compatible with the existing `CommandManager`.

**Tech Stack:** TypeScript, Vitest, existing `AgentPlan`, `PlanValidator`, `CommandManager`, `ProjectState`, and layout engine interfaces.

---

### Task 1: Add CommandBuilder tests

**Files:**
- Create: `src/agent/CommandBuilder.test.ts`

- [x] **Step 1: Write failing tests for plan execution**

Add tests that assert:
- a local template flow plan builds one macro command that creates shapes and connectors.
- a fake layout engine is called before state creation and its positions appear on shape elements.
- a grouped architecture plan creates logical group elements with global coordinates and child parent IDs.
- executing the built macro through `CommandManager` can be undone in one step.
- invalid plans throw and do not produce a command.

- [x] **Step 2: Run the tests and confirm RED**

Run:

```bash
npm run test -- src/agent/CommandBuilder.test.ts
```

Expected: FAIL because `src/agent/CommandBuilder.ts` does not exist yet.

### Task 2: Implement CommandBuilder

**Files:**
- Create: `src/agent/CommandBuilder.ts`

- [x] **Step 1: Add public API**

Create:

```ts
export interface CommandBuilderOptions {
  layoutEngine?: LayoutEngine
  existingElementIds?: string[]
  timestamp?: number
}

export function buildPlanCommand(plan: AgentPlan, options?: CommandBuilderOptions): Command
```

- [x] **Step 2: Validate before building**

Call `validateAgentPlan(plan, { existingElementIds })`. If validation fails, throw an `Error` whose message starts with `Invalid AgentPlan:`.

- [x] **Step 3: Convert create operations into draft elements**

Use default dimensions:
- shapes: `width: 160`, `height: 72`
- diamond: `width: 140`, `height: 88`
- circle: `width: 96`, `height: 96`
- sticky note: `width: 160`, `height: 120`
- groups: `width: 560`, `height: 260`
- text: `width: 220`

Set `meta.source` to `agent` and use the provided timestamp for `createdAt`/`updatedAt`.

- [x] **Step 4: Apply layout to created nodes**

Build a `LayoutRequest` from created shapes, text, and groups plus created connectors. Use the provided layout engine when passed, otherwise choose a default engine from `plan.layoutIntent.type`:
- `flow`: `DagreFlowLayoutEngine`
- `mindmap`: `TreeMindMapLayoutEngine`
- otherwise: `GridLayoutEngine`

Patch returned positions onto matching shape/text/group draft elements before adding them to state.

- [x] **Step 5: Convert remaining operations into commands**

Support:
- `create-connector`
- `update-style`
- `move-element`
- `delete-element`
- `relayout-region`

For `relayout-region`, run a layout request for the requested IDs found in the current state and patch returned positions. This keeps the operation explicit without wiring UI runtime yet.

- [x] **Step 6: Run focused tests and confirm GREEN**

Run:

```bash
npm run test -- src/agent/CommandBuilder.test.ts
```

Expected: PASS.

### Task 3: PR verification

**Files:**
- Review: `src/agent/CommandBuilder.ts`
- Review: `src/agent/CommandBuilder.test.ts`
- Review: this plan document

- [x] **Step 1: Run complete automated checks**

Run:

```bash
npm run test
npm run build
npm run lint
```

- [x] **Step 2: Run review and safety checks**

Run:

```bash
git diff --check
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md index.html
```

Review the diff for scope creep. This PR should not wire UI, call network APIs, add browser permissions, or introduce dependencies.

- [ ] **Step 3: Commit, push, and open PR**

Commit:

```bash
git add docs/superpowers/plans/2026-06-13-command-builder.md src/agent/CommandBuilder.ts src/agent/CommandBuilder.test.ts
git commit -m "feat: add agent command builder"
git push -u origin codex/voice-canvas-command-builder
```

Open a PR with:
- `## 功能描述`
- `## 实现思路`
- `## 测试方式`

Mention that no third-party dependency was added and no previous personal code was reused.
