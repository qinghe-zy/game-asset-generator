# Phase E Local Agent Acceptance

Date: 2026-06-13

This record closes the Phase E local Agent and execution pipeline checkpoint before starting the voice and audio work.

## Scope

Accepted in this phase:

- LocalTemplateAgent can turn non-trivial Chinese prompts into structured AgentPlans.
- Complex creation opens a pending plan instead of mutating the canvas immediately.
- Pending plans can be executed or cancelled from the workbench.
- CommandBuilder converts AgentPlan operations into one CommandManager macro command.
- Undo and redo operate at user-action granularity for generated macro content.
- CommandRouter handles explicit local text commands before falling back to local Agent planning.
- Recolor commands use EntityResolver instead of broad natural-language guessing.
- Unsupported export commands return a clear placeholder message for the later export module.

Not included in this phase:

- Browser STT, TTS, barge-in, earcons, or microphone permission flows.
- Remote LLM calls, local proxy, Serverless API routes, or production model key handling.
- Real PNG export, JSON import/export, autosave, or persistence.
- Free-form natural-language editing beyond the constrained local command patterns.

## Automated Evidence

Commands run from `D:\Project\voice-canvas\.worktrees\voice-canvas-phase-e-acceptance`:

| Check | Result |
| --- | --- |
| `npm install` | PASS: 285 packages installed, 0 vulnerabilities |
| `npm run test -- --maxWorkers=1 --no-file-parallelism` | PASS: 19 test files, 88 tests |
| `npm run build` | PASS: TypeScript build and Vite production build |
| `npm run lint` | PASS |

Notes:

- `npm run build` still reports the known Vite chunk-size warning for the Fabric/canvas bundle: one generated JS chunk is about 548 kB after minification.
- `npm install` still reports existing deprecation warnings for `whatwg-encoding` and `prebuild-install`.

## Browser Smoke Evidence

Browser smoke used local Vite on `127.0.0.1:5177` and `agent-browser` 0.27.0.

### Initial State

```json
{
  "status": "等待文本兼容输入",
  "count": 5,
  "hasGetter": true
}
```

The demo canvas starts with 5 elements and exposes `window.getProjectState()` in dev mode for JSON-based QA assertions.

### Pending Plan Confirmation

Input:

```text
画一个用户注册登录流程图
```

Observed before execution:

```json
{
  "status": "计划已生成，等待确认",
  "pendingSummary": "创建注册登录流程，包含验证码、成功路径和异常处理。",
  "operationCount": 11,
  "layoutType": "flow",
  "count": 5,
  "hasFlow": false
}
```

The pending plan panel appeared and the canvas was not mutated before confirmation.

### Plan Execution

Observed after clicking the pending plan execute button:

```json
{
  "status": "已执行：创建注册登录流程，包含验证码、成功路径和异常处理。",
  "count": 16,
  "hasFlow": true,
  "connector": {
    "id": "connector-flow-1",
    "kind": "connector",
    "label": "开始",
    "fromId": "flow-entry",
    "toId": "flow-account",
    "routing": "orthogonal"
  }
}
```

The generated diagram includes nodes and relationship-based connectors.

### Undo And Redo

Observed after entering `撤销`:

```json
{
  "status": "已撤销上一步",
  "count": 5,
  "hasFlow": false
}
```

Observed after entering `重做`:

```json
{
  "status": "已重做上一步",
  "count": 16,
  "hasFlow": true
}
```

The generated flow is undone and redone as one macro user action.

### Recolor Command

Input:

```text
把打开入口改成红色
```

Observed result:

```json
{
  "status": "已更新元素颜色",
  "count": 16,
  "fill": "#ef4444"
}
```

The target resolved to the `flow-entry` node through EntityResolver and updated its fill color.

### Export Placeholder

Input:

```text
导出 PNG
```

Observed result:

```json
{
  "status": "导出功能会在后续导出模块接入",
  "count": 16,
  "fill": "#ef4444"
}
```

The command reports the current limitation without mutating the project.

### Empty History Feedback

After a fresh reload, entering `撤销` produced:

```json
{
  "status": "当前没有可撤销的操作",
  "count": 5
}
```

Entering `重做` immediately after that produced:

```json
{
  "status": "当前没有可重做的操作",
  "count": 5
}
```

The local command path does not report a successful history action when no matching history entry exists.

## Review Notes

- Phase E keeps the text compatibility input explicitly marked as fallback/debug compatibility, not as the final voice path.
- The router intentionally supports constrained local command patterns only. Broad natural-language editing remains a later Agent/LLM responsibility.
- The generated flow uses existing layout and renderer layers; this phase did not introduce new rendering primitives.
- Export is intentionally documented as unfinished. The placeholder prevents a misleading success state before Phase I export work.
- No third-party dependency was added in this checkpoint.
- No API key, token, password, model credential, network request, or Fabric native Group usage was added.

## Phase E Decision

Phase E local Agent and execution pipeline work is ready to support Phase F voice and audio work.
