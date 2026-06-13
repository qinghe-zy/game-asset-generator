# Command Router Local Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small local command router so text fallback input can run explicit canvas commands before falling back to Agent planning.

**Architecture:** Keep parsing and command execution decisions in `src/commands/CommandRouter.ts`. The router receives the current state and command history callbacks, resolves target entities with `EntityResolver`, and returns a typed result that the React controller can translate into UI state. Complex creative prompts continue through `LocalTemplateAgent`.

**Tech Stack:** React 19, TypeScript, Vitest, existing ProjectState and CommandManager.

---

### Task 1: CommandRouter Pure Behavior

**Files:**
- Create: `src/commands/CommandRouter.ts`
- Create: `src/commands/CommandRouter.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests for:
- `撤销` calls the supplied undo callback.
- `重做` calls the supplied redo callback.
- `清空画布` executes one command that removes all elements and clears selection.
- `删除选中` executes one command that removes selected elements.
- `把登录改成红色` resolves an unambiguous label and executes a style update command.
- Ambiguous color targets return a clarification result and do not execute a command.
- `导出 PNG` returns an unsupported export result for the later export module.
- Creative input such as `画一个用户注册登录流程图` returns `not-local`.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm run test -- src/commands/CommandRouter.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: fail because `src/commands/CommandRouter.ts` does not exist.

- [ ] **Step 3: Implement minimal router**

Implement:
- `routeLocalCommand(input, context): LocalCommandResult`
- Exact/near-exact local command matching for undo, redo, clear, delete selected, export.
- A constrained recolor pattern for `把<target>改成<color>`.
- Command creation using existing immutable state helpers.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
npm run test -- src/commands/CommandRouter.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: all CommandRouter tests pass.

### Task 2: Controller Integration

**Files:**
- Modify: `src/app/useVoiceCanvasController.ts`
- Modify: `src/app/useVoiceCanvasController.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing controller tests**

Add tests for:
- Text input `撤销` undoes the last generated macro through `requestPlan`.
- Text input `重做` restores the undone macro.
- Text input `把打开入口改成红色` recolors the resolved element after a generated flow is executed.
- Text input `导出 PNG` sets a clear unsupported status without changing state.

- [ ] **Step 2: Run controller tests and verify RED**

Run:

```powershell
npm run test -- src/app/useVoiceCanvasController.test.tsx --maxWorkers=1 --no-file-parallelism
```

Expected: fail because the controller has not called CommandRouter yet and does not expose redo state.

- [ ] **Step 3: Wire router into controller**

Update `requestPlan` to:
- Trim input.
- Try `routeLocalCommand` first.
- Update `projectState`, `pendingPlan`, and status messages based on router results.
- Fall back to `createLocalTemplatePlan` when the router returns `not-local`.
- Expose `canRedo` and `redo()` for UI use.

Update `App.tsx` to add a compact redo button beside undo.

- [ ] **Step 4: Run controller tests and verify GREEN**

Run:

```powershell
npm run test -- src/app/useVoiceCanvasController.test.tsx --maxWorkers=1 --no-file-parallelism
```

Expected: all controller tests pass.

### Task 3: PR Verification

**Files:**
- Review all changed files.

- [ ] **Step 1: Run automated checks**

Run:

```powershell
npm run test -- --maxWorkers=1 --no-file-parallelism
npm run build
npm run lint
git diff --check
```

- [ ] **Step 2: Run safety scans**

Run:

```powershell
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md index.html
rg -n -e "fabric\.Group" -e "new\s+Group" -e "from 'fabric'.*Group" -e 'from "fabric".*Group' src
rg -n -e "fetch\(" -e "XMLHttpRequest" -e "localStorage" -e "process\.env" -e "import\.meta\.env" src
```

- [ ] **Step 3: Manual browser acceptance**

Run the dev server and verify:
- Generate `画一个用户注册登录流程图`.
- Execute the pending plan.
- Enter `撤销` and confirm generated nodes disappear.
- Enter `重做` and confirm generated nodes return.
- Enter an unambiguous color command such as `把打开入口改成红色` and confirm the state changes.
- Enter `导出 PNG` and confirm the status says export will be added later.

- [ ] **Step 4: Self-review and GitHub sync**

Review:
- The diff is limited to local command routing and small UI/controller wiring.
- No broad natural language guessing was added.
- No dependencies were added.
- No previous personal code was reused.

Then commit, push `codex/voice-canvas-command-router`, open a GitHub PR, and include the required Chinese PR sections.
