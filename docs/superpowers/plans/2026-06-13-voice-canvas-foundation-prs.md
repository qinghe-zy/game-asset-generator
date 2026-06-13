# Voice Canvas Foundation PRs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable foundation PRs for Voice Canvas: project baseline, tests, ProjectState, command history, and async interaction control.

**Architecture:** This plan creates the state and execution foundation before any canvas, voice, or LLM feature. The app remains runnable after every PR. Later plans will build Fabric rendering, layout, Agent planning, voice orchestration, Serverless proxy, and final documentation on top of these contracts.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, immutable ProjectState updates, command sourcing with macro commands.

---

## Scope

This plan covers the first five PRs only:

1. Project baseline and PR workflow docs.
2. Test harness and sample unit test.
3. ProjectState and element model.
4. CommandManager with macro undo/redo.
5. InteractionController with abort and stale-plan reconciliation.

The full MVP is intentionally split into later plans:

- Canvas renderer and ConnectionUpdater.
- Layout adapters for dagre and d3-hierarchy.
- Local template Agent and AgentPlan validation.
- SpeechOrchestrator, TTS, earcons, and text fallback.
- PendingPlanPanel and UI wiring.
- Local Node/Express API proxy and domestic Serverless docs.
- Export, autosave, README, and final `docs/DESIGN.md` update.

## PR Workflow Requirements

Each task below maps to one small PR. Every PR must keep `main` runnable after merge.

Use this PR description shape:

```markdown
## 功能描述

说明这个 PR 新增或修改了什么，以及用户如何使用它。

## 实现思路

说明关键技术选择、核心模块和主要数据流。

## 测试方式

列出验证命令、手工测试步骤，以及当前已知限制。
```

When a PR introduces a dependency, update `README.md` in that same PR. If code is reused from earlier personal projects, state the source in the PR description.

## File Map

Planned files for this foundation batch:

- `README.md`: project purpose, scripts, dependencies, PR workflow.
- `package.json`: project name, scripts, test dependency.
- `src/App.tsx`: minimal runnable application shell.
- `src/App.css`: minimal shell styles.
- `src/index.css`: global styles for the shell.
- `src/state/elements.ts`: canvas element types.
- `src/state/projectState.ts`: ProjectState factory and immutable helpers.
- `src/state/projectState.test.ts`: ProjectState unit tests.
- `src/commands/CommandManager.ts`: command execution, history, macro undo/redo.
- `src/commands/CommandManager.test.ts`: command history unit tests.
- `src/interaction/InteractionController.ts`: async planning control, abort, stale-plan handling.
- `src/interaction/InteractionController.test.ts`: concurrency and stale-plan unit tests.
- `src/test/setup.ts`: Vitest setup.
- `vitest.config.ts`: Vitest config.
- `tsconfig.app.json`: include test globals only if needed.

## Task 1: Project Baseline PR

**PR title:** Replace Vite starter with Voice Canvas runnable shell

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/index.css`

- [ ] **Step 1: Update `package.json` metadata**

Change the project name from `vite-temp` to `voice-canvas`.

Expected `package.json` top fields:

```json
{
  "name": "voice-canvas",
  "private": true,
  "version": "0.0.0",
  "type": "module"
}
```

Keep the existing `scripts`, `dependencies`, and `devDependencies` unchanged in this PR.

- [ ] **Step 2: Replace `src/App.tsx` with a Voice Canvas shell**

```tsx
import './App.css'

function App() {
  return (
    <main className="appShell">
      <header className="topBar">
        <div>
          <p className="eyebrow">Voice Canvas</p>
          <h1>AI 语音绘图工作台</h1>
        </div>
        <div className="statusPill">MVP Foundation</div>
      </header>

      <section className="workspace" aria-label="Voice Canvas workspace">
        <div className="emptyCanvas">
          <p className="emptyCanvasTitle">结构化画布</p>
          <p className="emptyCanvasText">
            后续 PR 会接入 ProjectState、命令系统、Fabric 渲染和语音 Agent。
          </p>
        </div>
      </section>

      <footer className="voiceBar">
        <div>
          <strong>语音状态</strong>
          <span>等待基础模块接入</span>
        </div>
        <button type="button" disabled>
          开始语音创作
        </button>
      </footer>
    </main>
  )
}

export default App
```

- [ ] **Step 3: Replace `src/App.css`**

```css
.appShell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: #f6f7fb;
  color: #172033;
}

.topBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 32px;
  border-bottom: 1px solid #dfe3ec;
  background: #ffffff;
}

.eyebrow {
  margin: 0 0 6px;
  color: #4b6bfb;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.topBar h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.statusPill {
  border: 1px solid #cfd7eb;
  border-radius: 999px;
  padding: 8px 12px;
  background: #f8faff;
  color: #3b4b70;
  font-size: 14px;
}

.workspace {
  padding: 24px 32px;
}

.emptyCanvas {
  min-height: 480px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  border: 1px solid #d9dfeb;
  border-radius: 8px;
  background:
    linear-gradient(#eef2fa 1px, transparent 1px),
    linear-gradient(90deg, #eef2fa 1px, transparent 1px),
    #ffffff;
  background-size: 32px 32px;
}

.emptyCanvasTitle {
  margin: 0;
  color: #1d2940;
  font-size: 22px;
  font-weight: 700;
}

.emptyCanvasText {
  max-width: 520px;
  margin: 0;
  color: #61708d;
  text-align: center;
}

.voiceBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 32px;
  border-top: 1px solid #dfe3ec;
  background: #ffffff;
}

.voiceBar div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.voiceBar span {
  color: #667491;
  font-size: 14px;
}

.voiceBar button {
  border: 0;
  border-radius: 8px;
  padding: 10px 16px;
  background: #d8deea;
  color: #64708a;
}

@media (max-width: 760px) {
  .topBar,
  .voiceBar {
    align-items: flex-start;
    flex-direction: column;
  }

  .workspace {
    padding: 16px;
  }
}
```

- [ ] **Step 4: Replace `src/index.css`**

```css
:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  color: #172033;
  background: #f6f7fb;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
textarea {
  font: inherit;
}
```

- [ ] **Step 5: Replace `README.md` with project-specific content**

```md
# Voice Canvas

Voice Canvas is an AI voice drawing tool. The MVP focuses on a voice-first structured canvas: users speak drawing goals, the app turns them into editable canvas objects, and later PRs add Agent planning, layout, voice orchestration, and Serverless model access.

## Scripts

- `npm run dev`: start the Vite dev server.
- `npm run build`: type-check and build the frontend.
- `npm run lint`: run ESLint.
- `npm run preview`: preview the production build.

## Current Status

This branch contains the runnable frontend foundation. The implementation is intentionally split into small PRs so the main branch stays runnable after every merge.

## PR Requirements

Each PR should implement one feature. PR descriptions should include:

- 功能描述
- 实现思路
- 测试方式

If a PR adds a third-party dependency, list it in this README and explain what part of the project uses it.
```

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 7: Run lint**

Run:

```bash
npm run lint
```

Expected: ESLint passes.

- [ ] **Step 8: Commit**

```bash
git add package.json README.md src/App.tsx src/App.css src/index.css
git commit -m "feat: add voice canvas app shell"
```

Suggested PR description:

```markdown
## 功能描述

本 PR 将默认 Vite 示例替换为 Voice Canvas 的基础工作台页面。页面包含顶部状态栏、画布占位区和底部语音状态栏，为后续接入 ProjectState、命令系统、画布渲染和语音 Agent 做准备。

## 实现思路

保留 React + Vite 的轻量结构，只替换模板组件和样式，不引入新依赖。首屏直接呈现工作台，避免先做营销页。

## 测试方式

- `npm run build`
- `npm run lint`
```

## Task 2: Test Harness PR

**PR title:** Add Vitest unit test harness

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/state/projectState.test.ts`

- [ ] **Step 1: Install Vitest**

Run:

```bash
npm install -D vitest
```

Expected: `package.json` and a lock file update. Use npm because the repository currently has no lock file and `package.json` uses npm-style scripts.

- [ ] **Step 2: Add test script to `package.json`**

Add:

```json
"test": "vitest run"
```

Expected scripts section:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 4: Install jsdom**

Run:

```bash
npm install -D jsdom
```

Expected: `package.json` and lock file update.

- [ ] **Step 5: Create `src/test/setup.ts`**

```ts
import { afterEach } from 'vitest'

afterEach(() => {
  localStorage.clear()
})
```

- [ ] **Step 6: Create smoke test `src/state/projectState.test.ts`**

```ts
import { describe, expect, it } from 'vitest'

describe('test harness', () => {
  it('runs unit tests', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 7: Update README dependency section**

Add:

```md
## Dependencies

- React and React DOM: render the frontend application.
- Vite: local development server and production build.
- Vitest and jsdom: unit tests for state, command, and interaction modules.
```

- [ ] **Step 8: Run tests**

Run:

```bash
npm run test
```

Expected: one passing smoke test.

- [ ] **Step 9: Run build and lint**

Run:

```bash
npm run build
npm run lint
```

Expected: both pass.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json README.md vitest.config.ts src/test/setup.ts src/state/projectState.test.ts
git commit -m "test: add vitest harness"
```

Suggested PR description:

```markdown
## 功能描述

本 PR 增加 Vitest 单元测试基础设施，后续状态模型、命令系统和交互控制器都可以用自动化测试验证。

## 实现思路

使用 Vitest 作为测试运行器，jsdom 作为浏览器环境模拟。当前只加入一个 smoke test，确保测试命令可运行。

## 测试方式

- `npm run test`
- `npm run build`
- `npm run lint`

本 PR 新增第三方依赖 Vitest 和 jsdom，README 已说明用途。
```

## Task 3: ProjectState PR

**PR title:** Add ProjectState element model

**Files:**
- Create: `src/state/elements.ts`
- Create: `src/state/projectState.ts`
- Modify: `src/state/projectState.test.ts`

- [ ] **Step 1: Replace `src/state/projectState.test.ts` with failing ProjectState tests**

```ts
import { describe, expect, it } from 'vitest'
import { addElement, createProjectState, updateElement } from './projectState'
import type { ShapeElement } from './elements'

const shape = (id: string, label: string): ShapeElement => ({
  id,
  kind: 'shape',
  shape: 'rounded-rect',
  label,
  x: 0,
  y: 0,
  width: 160,
  height: 72,
  style: {
    fill: '#ffffff',
    stroke: '#2f5bea',
    textColor: '#172033',
  },
  meta: {
    source: 'template',
    createdAt: 1,
    updatedAt: 1,
  },
})

describe('ProjectState', () => {
  it('creates an empty project state', () => {
    const state = createProjectState('画布')

    expect(state.title).toBe('画布')
    expect(state.version).toBe(1)
    expect(state.elements).toEqual({})
    expect(state.elementOrder).toEqual([])
    expect(state.selectedIds).toEqual([])
  })

  it('adds an element immutably and increments version', () => {
    const state = createProjectState('画布')
    const next = addElement(state, shape('node_login', '登录'))

    expect(next).not.toBe(state)
    expect(next.version).toBe(2)
    expect(next.elements.node_login?.label).toBe('登录')
    expect(next.elementOrder).toEqual(['node_login'])
    expect(state.elementOrder).toEqual([])
  })

  it('updates an existing element immutably', () => {
    const state = addElement(createProjectState('画布'), shape('node_login', '登录'))
    const next = updateElement(state, 'node_login', {
      label: '用户登录',
      x: 120,
    })

    expect(next.version).toBe(3)
    expect(next.elements.node_login?.label).toBe('用户登录')
    expect(next.elements.node_login && 'x' in next.elements.node_login ? next.elements.node_login.x : undefined).toBe(120)
    expect(state.elements.node_login?.label).toBe('登录')
  })

  it('throws when updating a missing element', () => {
    const state = createProjectState('画布')

    expect(() => updateElement(state, 'missing', { label: 'x' })).toThrow(
      'Element not found: missing',
    )
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm run test -- src/state/projectState.test.ts
```

Expected: FAIL because `projectState` and `elements` modules do not exist.

- [ ] **Step 3: Create `src/state/elements.ts`**

```ts
export type ElementKind = 'shape' | 'text' | 'connector' | 'group'

export type ElementSource = 'agent' | 'voice-command' | 'template'

export interface ElementStyle {
  fill?: string
  stroke?: string
  textColor?: string
  strokeWidth?: number
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
}

export interface ElementMeta {
  aliases?: string[]
  source: ElementSource
  createdAt: number
  updatedAt: number
}

export interface BaseElement {
  id: string
  kind: ElementKind
  label?: string
  locked?: boolean
  manualLocked?: boolean
  parentId?: string
  style?: ElementStyle
  meta: ElementMeta
}

export type ShapeType =
  | 'rect'
  | 'rounded-rect'
  | 'circle'
  | 'diamond'
  | 'cylinder'
  | 'sticky-note'

export interface ShapeElement extends BaseElement {
  kind: 'shape'
  shape: ShapeType
  x: number
  y: number
  width: number
  height: number
}

export interface TextElement extends BaseElement {
  kind: 'text'
  text: string
  x: number
  y: number
  width: number
}

export interface ConnectorElement extends BaseElement {
  kind: 'connector'
  fromId: string
  toId: string
  routing?: 'straight' | 'orthogonal'
}

export interface GroupElement extends BaseElement {
  kind: 'group'
  x: number
  y: number
  width: number
  height: number
}

export type CanvasElement =
  | ShapeElement
  | TextElement
  | ConnectorElement
  | GroupElement
```

- [ ] **Step 4: Create `src/state/projectState.ts`**

```ts
import type { CanvasElement } from './elements'

export interface ProjectState {
  id: string
  title: string
  version: number
  elements: Record<string, CanvasElement>
  elementOrder: string[]
  selectedIds: string[]
  createdAt: number
  updatedAt: number
}

const now = () => Date.now()

export function createProjectState(title: string): ProjectState {
  const timestamp = now()

  return {
    id: `project_${timestamp}`,
    title,
    version: 1,
    elements: {},
    elementOrder: [],
    selectedIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function addElement(
  state: ProjectState,
  element: CanvasElement,
): ProjectState {
  if (state.elements[element.id]) {
    throw new Error(`Element already exists: ${element.id}`)
  }

  return {
    ...state,
    version: state.version + 1,
    elements: {
      ...state.elements,
      [element.id]: element,
    },
    elementOrder: [...state.elementOrder, element.id],
    updatedAt: now(),
  }
}

export type ElementPatch = Partial<CanvasElement> & Record<string, unknown>

export function updateElement(
  state: ProjectState,
  elementId: string,
  patch: ElementPatch,
): ProjectState {
  const current = state.elements[elementId]

  if (!current) {
    throw new Error(`Element not found: ${elementId}`)
  }

  return {
    ...state,
    version: state.version + 1,
    elements: {
      ...state.elements,
      [elementId]: {
        ...current,
        ...patch,
      } as CanvasElement,
    },
    updatedAt: now(),
  }
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test -- src/state/projectState.test.ts
```

Expected: ProjectState tests pass.

- [ ] **Step 6: Run build and lint**

Run:

```bash
npm run build
npm run lint
```

Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add src/state/elements.ts src/state/projectState.ts src/state/projectState.test.ts
git commit -m "feat: add project state model"
```

Suggested PR description:

```markdown
## 功能描述

本 PR 增加 Voice Canvas 的 ProjectState 和基础元素模型。后续画布渲染、命令系统、AgentPlan 执行都会以这个状态结构作为数据源。

## 实现思路

ProjectState 独立于 Fabric.js，使用普通 TypeScript 类型描述形状、文本、连线和逻辑分组。状态更新函数返回新对象，避免渲染层和命令层共享可变数据。

## 测试方式

- `npm run test -- src/state/projectState.test.ts`
- `npm run build`
- `npm run lint`
```

## Task 4: CommandManager PR

**PR title:** Add macro command undo and redo

**Files:**
- Create: `src/commands/CommandManager.ts`
- Create: `src/commands/CommandManager.test.ts`
- Modify: `src/state/projectState.ts`

- [ ] **Step 1: Add helper functions to `src/state/projectState.ts`**

Append these exports:

```ts
export function removeElement(
  state: ProjectState,
  elementId: string,
): ProjectState {
  if (!state.elements[elementId]) {
    throw new Error(`Element not found: ${elementId}`)
  }

  const remainingElements = { ...state.elements }
  delete remainingElements[elementId]

  return {
    ...state,
    version: state.version + 1,
    elements: remainingElements,
    elementOrder: state.elementOrder.filter((id) => id !== elementId),
    selectedIds: state.selectedIds.filter((id) => id !== elementId),
    updatedAt: now(),
  }
}

export function selectElements(
  state: ProjectState,
  selectedIds: string[],
): ProjectState {
  const missingId = selectedIds.find((id) => !state.elements[id])

  if (missingId) {
    throw new Error(`Element not found: ${missingId}`)
  }

  return {
    ...state,
    version: state.version + 1,
    selectedIds,
    updatedAt: now(),
  }
}
```

- [ ] **Step 2: Create failing tests `src/commands/CommandManager.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { CommandManager, createMacroCommand } from './CommandManager'
import { addElement, createProjectState, updateElement } from '../state/projectState'
import type { ProjectState } from '../state/projectState'
import type { ShapeElement } from '../state/elements'

const shape = (id: string): ShapeElement => ({
  id,
  kind: 'shape',
  shape: 'rounded-rect',
  label: id,
  x: 0,
  y: 0,
  width: 120,
  height: 60,
  meta: {
    source: 'template',
    createdAt: 1,
    updatedAt: 1,
  },
})

describe('CommandManager', () => {
  it('executes a command and undoes it with a snapshot', () => {
    const manager = new CommandManager(createProjectState('画布'))

    manager.execute({
      id: 'add-login',
      label: 'Add login',
      apply: (state) => addElement(state, shape('login')),
    })

    expect(manager.getState().elements.login?.label).toBe('login')

    manager.undo()

    expect(manager.getState().elements.login).toBeUndefined()

    manager.redo()

    expect(manager.getState().elements.login?.label).toBe('login')
  })

  it('treats a macro command as one undo step', () => {
    const manager = new CommandManager(createProjectState('画布'))
    const macro = createMacroCommand('macro-1', 'Create login flow', [
      {
        id: 'add-login',
        label: 'Add login',
        apply: (state: ProjectState) => addElement(state, shape('login')),
      },
      {
        id: 'rename-login',
        label: 'Rename login',
        apply: (state: ProjectState) =>
          updateElement(state, 'login', { label: '用户登录' }),
      },
    ])

    manager.execute(macro)

    expect(manager.getState().elements.login?.label).toBe('用户登录')
    expect(manager.getUndoCount()).toBe(1)

    manager.undo()

    expect(manager.getState().elements.login).toBeUndefined()
    expect(manager.getRedoCount()).toBe(1)
  })

  it('clears redo history after a new command', () => {
    const manager = new CommandManager(createProjectState('画布'))

    manager.execute({
      id: 'add-login',
      label: 'Add login',
      apply: (state) => addElement(state, shape('login')),
    })
    manager.undo()
    manager.execute({
      id: 'add-register',
      label: 'Add register',
      apply: (state) => addElement(state, shape('register')),
    })

    expect(manager.getRedoCount()).toBe(0)
    expect(manager.getState().elements.register?.label).toBe('register')
  })
})
```

- [ ] **Step 3: Run test to verify failure**

Run:

```bash
npm run test -- src/commands/CommandManager.test.ts
```

Expected: FAIL because `CommandManager` module does not exist.

- [ ] **Step 4: Create `src/commands/CommandManager.ts`**

```ts
import type { ProjectState } from '../state/projectState'

export interface Command {
  id: string
  label: string
  apply(state: ProjectState): ProjectState
}

interface HistoryEntry {
  command: Command
  before: ProjectState
  after: ProjectState
}

export function createMacroCommand(
  id: string,
  label: string,
  commands: Command[],
): Command {
  return {
    id,
    label,
    apply(state) {
      return commands.reduce(
        (currentState, command) => command.apply(currentState),
        state,
      )
    },
  }
}

export class CommandManager {
  private state: ProjectState
  private undoStack: HistoryEntry[] = []
  private redoStack: HistoryEntry[] = []

  constructor(initialState: ProjectState) {
    this.state = initialState
  }

  getState(): ProjectState {
    return this.state
  }

  getUndoCount(): number {
    return this.undoStack.length
  }

  getRedoCount(): number {
    return this.redoStack.length
  }

  execute(command: Command): ProjectState {
    const before = this.state
    const after = command.apply(before)

    this.state = after
    this.undoStack.push({ command, before, after })
    this.redoStack = []

    return this.state
  }

  undo(): ProjectState {
    const entry = this.undoStack.pop()

    if (!entry) {
      return this.state
    }

    this.state = entry.before
    this.redoStack.push(entry)

    return this.state
  }

  redo(): ProjectState {
    const entry = this.redoStack.pop()

    if (!entry) {
      return this.state
    }

    this.state = entry.after
    this.undoStack.push(entry)

    return this.state
  }
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test -- src/commands/CommandManager.test.ts src/state/projectState.test.ts
```

Expected: command and state tests pass.

- [ ] **Step 6: Run build and lint**

Run:

```bash
npm run build
npm run lint
```

Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add src/commands/CommandManager.ts src/commands/CommandManager.test.ts src/state/projectState.ts
git commit -m "feat: add command history manager"
```

Suggested PR description:

```markdown
## 功能描述

本 PR 增加命令执行和撤销/重做基础能力。普通语音编辑和 Agent 生成的大操作都可以通过 CommandManager 进入统一历史栈。

## 实现思路

CommandManager 使用 before/after 状态快照实现撤销和重做。多个内部操作可以包成一个 MacroCommand，让一次 Agent 生成在用户看来是一个可撤销动作。

## 测试方式

- `npm run test -- src/commands/CommandManager.test.ts src/state/projectState.test.ts`
- `npm run build`
- `npm run lint`
```

## Task 5: InteractionController PR

**PR title:** Add async interaction controller for stale Agent plans

**Files:**
- Create: `src/interaction/InteractionController.ts`
- Create: `src/interaction/InteractionController.test.ts`

- [ ] **Step 1: Create failing tests `src/interaction/InteractionController.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import {
  InteractionController,
  type Planner,
  type PendingPlan,
} from './InteractionController'
import { addElement, createProjectState } from '../state/projectState'
import type { ShapeElement } from '../state/elements'

const shape = (id: string): ShapeElement => ({
  id,
  kind: 'shape',
  shape: 'rounded-rect',
  label: id,
  x: 0,
  y: 0,
  width: 100,
  height: 60,
  meta: {
    source: 'template',
    createdAt: 1,
    updatedAt: 1,
  },
})

describe('InteractionController', () => {
  it('creates a pending plan when state version is unchanged', async () => {
    const planner: Planner = async () => ({
      id: 'plan-1',
      summary: '创建登录流程',
      baseVersion: 1,
      requiresConfirmation: true,
    })
    const controller = new InteractionController(createProjectState('画布'), planner)

    const result = await controller.requestPlan('画登录流程')

    expect(result.status).toBe('pending')
    expect(controller.getPendingPlan()?.summary).toBe('创建登录流程')
  })

  it('marks a returned plan stale when project version changed during planning', async () => {
    let resolvePlan: (plan: PendingPlan) => void = () => undefined
    const planner: Planner = () =>
      new Promise((resolve) => {
        resolvePlan = resolve
      })
    const controller = new InteractionController(createProjectState('画布'), planner)

    const planning = controller.requestPlan('画登录流程')
    controller.applyExternalState((state) => addElement(state, shape('login')))
    resolvePlan({
      id: 'plan-1',
      summary: '创建登录流程',
      baseVersion: 1,
      requiresConfirmation: true,
    })

    const result = await planning

    expect(result.status).toBe('stale')
    expect(controller.getPendingPlan()).toBeNull()
  })

  it('aborts the active request when canceled', async () => {
    let signalFromPlanner: AbortSignal | null = null
    const planner: Planner = (_input, context) =>
      new Promise((_resolve, reject) => {
        signalFromPlanner = context.signal
        context.signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    const controller = new InteractionController(createProjectState('画布'), planner)

    const planning = controller.requestPlan('画登录流程')
    controller.cancelActiveRequest()
    const result = await planning

    expect(signalFromPlanner?.aborted).toBe(true)
    expect(result.status).toBe('aborted')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
npm run test -- src/interaction/InteractionController.test.ts
```

Expected: FAIL because `InteractionController` module does not exist.

- [ ] **Step 3: Create `src/interaction/InteractionController.ts`**

```ts
import type { ProjectState } from '../state/projectState'

export interface PendingPlan {
  id: string
  summary: string
  baseVersion: number
  requiresConfirmation: boolean
}

export interface PlannerContext {
  signal: AbortSignal
  baseVersion: number
}

export type Planner = (
  input: string,
  context: PlannerContext,
) => Promise<PendingPlan>

export type PlanRequestResult =
  | { status: 'pending'; plan: PendingPlan }
  | { status: 'stale'; plan: PendingPlan; currentVersion: number }
  | { status: 'aborted' }
  | { status: 'error'; error: unknown }

export class InteractionController {
  private state: ProjectState
  private readonly planner: Planner
  private activeAbortController: AbortController | null = null
  private pendingPlan: PendingPlan | null = null

  constructor(initialState: ProjectState, planner: Planner) {
    this.state = initialState
    this.planner = planner
  }

  getState(): ProjectState {
    return this.state
  }

  getPendingPlan(): PendingPlan | null {
    return this.pendingPlan
  }

  applyExternalState(
    update: (state: ProjectState) => ProjectState,
  ): ProjectState {
    this.state = update(this.state)
    return this.state
  }

  cancelActiveRequest(): void {
    this.activeAbortController?.abort()
    this.activeAbortController = null
    this.pendingPlan = null
  }

  async requestPlan(input: string): Promise<PlanRequestResult> {
    this.cancelActiveRequest()

    const abortController = new AbortController()
    const baseVersion = this.state.version
    this.activeAbortController = abortController

    try {
      const plan = await this.planner(input, {
        signal: abortController.signal,
        baseVersion,
      })

      if (abortController.signal.aborted) {
        return { status: 'aborted' }
      }

      if (this.state.version !== baseVersion) {
        return {
          status: 'stale',
          plan,
          currentVersion: this.state.version,
        }
      }

      this.pendingPlan = plan
      return { status: 'pending', plan }
    } catch (error) {
      if (abortController.signal.aborted) {
        return { status: 'aborted' }
      }

      return { status: 'error', error }
    } finally {
      if (this.activeAbortController === abortController) {
        this.activeAbortController = null
      }
    }
  }
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test -- src/interaction/InteractionController.test.ts
```

Expected: interaction tests pass.

- [ ] **Step 5: Run all tests, build, and lint**

Run:

```bash
npm run test
npm run build
npm run lint
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/interaction/InteractionController.ts src/interaction/InteractionController.test.ts
git commit -m "feat: add interaction controller"
```

Suggested PR description:

```markdown
## 功能描述

本 PR 增加 InteractionController，用来管理 Agent 规划请求的取消、pending plan 和状态版本校验。它为后续语音打断、LLM 请求超时和 stale plan 处理提供基础。

## 实现思路

每次规划请求都会记录 ProjectState.version，并绑定 AbortController。如果请求返回时画布版本已经变化，计划不会自动进入待确认状态，避免旧计划覆盖用户的新操作。

## 测试方式

- `npm run test -- src/interaction/InteractionController.test.ts`
- `npm run test`
- `npm run build`
- `npm run lint`
```

## Plan Self-Review Checklist

- Spec coverage for this batch:
  - PR workflow: Task 1 README and every task's PR description template.
  - Runnable main after each PR: each task ends with build and lint.
  - State source of truth: Task 3.
  - Macro undo/redo: Task 4.
  - Async cancellation and stale-plan reconciliation: Task 5.
  - Canvas, layout, Agent, speech, Serverless, export, and final design doc are intentionally deferred to later plans.
- Red-flag scan:
  - No unfinished-marker wording remains.
  - Deferred modules are listed as later plans, not vague steps inside this plan.
- Type consistency:
  - `ProjectState.version` is defined in Task 3 and used in Task 5.
  - `ShapeElement` fields match tests and type definitions.
  - `CommandManager` uses `ProjectState` from the state module.
