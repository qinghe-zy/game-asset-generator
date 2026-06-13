# Voice Canvas MVP Design

Date: 2026-06-13

## 1. Goal

Voice Canvas is an AI voice drawing tool. The MVP must provide a usable voice-first creation loop while keeping the architecture extensible enough for later STT providers, image generation, richer diagram types, login, and cloud storage.

The selected direction is:

- Build a runnable MVP, not the full long-term product in one pass.
- Use a structured canvas Agent as the core.
- Support real LLM planning plus local template fallback.
- Support long multi-turn conversations and complex request decomposition.
- Use a China-friendly Serverless API proxy for production, with pure frontend fallback for development and degraded demos.
- Keep the primary drawing and editing flow voice-driven after first microphone authorization.

## 2. Confirmed Scope

### In Scope

- Voice-first creation and editing after initial start and microphone permission.
- One-time click for app start and browser microphone authorization.
- Structured canvas output: shapes, text, connectors, groups, diagrams, planning boards, story maps, relationship maps, and other entertainment-oriented structured drawings.
- Agent-driven complex creation:
  - Understand a long request.
  - Produce a plan.
  - Ask for confirmation when the change is large or ambiguous.
  - Execute after voice confirmation.
  - Continue modifying the same canvas across multiple turns.
- Local low-latency commands:
  - Undo, redo, delete, clear, zoom, move, recolor, select, export.
- Local template fallback when LLM is unavailable.
- Runtime modes:
  - Local demo mode: Vite frontend plus local Node/Express API proxy.
  - Static fallback mode: frontend-only with templates and degraded LLM/STT behavior.
  - China Serverless production mode: static frontend plus domestic Serverless API proxy.
- Design document that records planned capabilities, implemented capabilities, and unfinished items with reasons.

### Out of Scope for MVP

- Freehand brush drawing.
- Professional bitmap image generation.
- Multi-user real-time collaboration.
- Login and cloud storage.
- Full backend STT implementation.
- Pixel-perfect canvas E2E screenshot testing.

Image generation remains an extension point through an `ImageProvider` interface.

## 3. Architecture

The MVP uses a split architecture:

```text
Browser Frontend
  -> SpeechOrchestrator
  -> CommandRouter
  -> AgentProvider or local command parser
  -> AgentPlan
  -> PlanValidator
  -> EntityResolver
  -> LayoutEngine
  -> CommandBuilder
  -> CommandManager
  -> ProjectState
  -> FabricRenderer

Production API
  -> API Gateway rate limits
  -> Serverless Function
  -> Domestic LLM provider
```

The frontend is React, TypeScript, and Vite. Vite does not provide backend routing by itself. API routes must be hosted by an explicit environment:

- In local development, a small Node/Express process exposes `/api/agent`; Vite forwards `/api/*` with a dev proxy.
- In production, a domestic Serverless Function provides the API route. The frontend calls the configured API base URL.

The API proxy hides model keys, validates request size, calls the LLM, and returns a normalized `AgentPlan`.

## 4. Recommended Directory Shape

```text
src/
  agent/
    AgentProvider.ts
    AgentPlan.ts
    CanvasDescriber.ts
    LocalTemplateAgent.ts
    LlmAgentProvider.ts
  canvas/
    ProjectState.ts
    FabricRenderer.ts
    ConnectionUpdater.ts
    Exporter.ts
  commands/
    CommandManager.ts
    CommandRouter.ts
    EntityResolver.ts
    PlanValidator.ts
  layout/
    LayoutEngine.ts
    DagreFlowLayout.ts
    TreeMindMapLayout.ts
    GridLayout.ts
    IncrementalLayout.ts
  speech/
    SpeechOrchestrator.ts
    WebSpeechProvider.ts
    TextFallbackProvider.ts
    TtsProvider.ts
    AudioFeedback.ts
  components/
    CanvasStage/
    VoiceBar/
    PendingPlanPanel/
    CommandLog/
    StatusBar/
    SettingsPanel/
  config/

api/
  agent/
    server.ts
    providers/

docs/
  DESIGN.md
```

## 5. Voice and Agent Behavior

### Voice State Machine

```ts
type VoiceState =
  | 'idle'
  | 'requesting-permission'
  | 'listening'
  | 'transcribing'
  | 'routing'
  | 'planning'
  | 'awaiting-confirmation'
  | 'executing'
  | 'speaking'
  | 'error'
```

`SpeechOrchestrator` owns STT, TTS, barge-in behavior, and state transitions.

### Async Control and Command Queue

Voice interactions are asynchronous. The state machine must therefore include explicit cancellation and reconciliation rules.

Use a single `InteractionController` to coordinate:

- Current voice state.
- Active `AbortController` for LLM/STT requests.
- Current `pendingPlan`.
- Command queue.
- Latest `ProjectState.version`.

Rules:

- Every LLM planning request captures the current `ProjectState.version`.
- If the user issues a new command while planning is in progress, the new command is routed immediately.
- If the new command cancels or replaces the plan, abort the in-flight LLM request.
- If the LLM returns after the canvas version changed, do not auto-apply its plan. Revalidate it against the current state and either refresh the plan or ask for confirmation.
- Rendering commands are serialized through `CommandManager` so two operations cannot mutate `ProjectState` at the same time.
- Destructive voice commands during `executing` are queued until the current macro command finishes, then executed against the updated state.

### STT Strategy

The MVP uses browser Web Speech first. In mainland China, Chrome Web Speech is unreliable because it depends on Google services; Edge is more likely to work because it uses Microsoft/Azure infrastructure.

When STT is unavailable:

- The app shows a clear status.
- The app recommends Edge for voice testing.
- A text debug input is displayed so the Agent, layout, and canvas chain can still be verified.

The text input is a compatibility/debug fallback, not the strict voice-only acceptance path.

### Barge-in

When TTS is speaking and the microphone detects user speech:

- Stop TTS immediately.
- Abort any interruptible planning request if the user says cancel, stop, or starts a replacement instruction.
- Stop any thinking or speaking earcon.
- Pause the current `pendingPlan`.
- Route the new utterance as cancel, confirm, modify, or a new instruction.

High-priority local interruption phrases include:

- 等等
- 停
- 取消
- 先别执行
- 修改一下

### Earcons

The MVP should use lightweight Web Audio API earcons:

- Microphone enabled.
- Recognition started.
- Agent thinking.
- Pending confirmation.
- Execution success.
- Recoverable error.
- Barge-in interruption.

Earcons are enabled by default at low volume and can be disabled in settings.

## 6. Command Routing

The command route is:

```text
transcript
  -> Tier 1 exact and regex commands
  -> Tier 2 fuzzy matching
  -> EntityResolver
  -> Agent fallback if entity or intent is ambiguous
```

Simple commands should execute locally with low latency:

- Undo and redo.
- Delete selected element.
- Move selected element.
- Change color.
- Clear canvas.
- Export PNG or JSON.
- Confirm, cancel, regenerate, or modify pending plan.

When a command contains entity references such as "数据库", "左边那个红色的", or "标题下面的节点", local code must not guess blindly.

The resolver should:

- Search labels, IDs, aliases, shape type, group, selected element, position, and style.
- Score candidates with heuristics before asking for clarification.
- Execute directly if the top candidate passes the confidence threshold.
- Ask for clarification or fall back to Agent if multiple candidates match.
- Include candidate ID mappings in the Agent context so the LLM can output commands against concrete IDs.

Entity scoring should prefer:

- Currently selected element.
- Recently created or modified elements.
- Elements visible in the current viewport.
- Elements close to the spatial phrase in the transcript, such as left, right, top, bottom, center.
- Exact label or alias matches over fuzzy matches.
- Elements in the active group or recent subgraph.

Only ask a clarification question when the top candidates are too close in score or the command is destructive. This avoids frequent voice interruptions such as "which rectangle do you mean?" during normal flow.

## 7. AgentPlan

The LLM or local template provider returns an `AgentPlan`, not direct Fabric JSON.

```ts
interface AgentPlan {
  summary: string
  requiresConfirmation: boolean
  operations: PlanOperation[]
  layoutIntent: LayoutIntent
  speechFeedback: string
  riskFlags?: string[]
  fallbackReason?: string
}
```

Operations express intent:

- Create shape.
- Create text.
- Create connector.
- Create group.
- Update style.
- Move element.
- Delete element.
- Re-layout region.

They should not contain precise absolute coordinates unless the user explicitly requests a named position such as "左上角".

Large creations, destructive changes, and broad re-layouts require confirmation. Small local edits can execute immediately.

## 8. Canvas Model

The application state is the source of truth. Fabric JSON is a rendering detail.

```ts
type CanvasElement =
  | ShapeElement
  | TextElement
  | ConnectorElement
  | GroupElement

interface BaseElement {
  id: string
  kind: 'shape' | 'text' | 'connector' | 'group'
  label?: string
  locked?: boolean
  manualLocked?: boolean
  style?: ElementStyle
  parentId?: string
  meta?: {
    aliases?: string[]
    source?: 'agent' | 'voice-command' | 'template'
    createdAt: number
    updatedAt: number
  }
}
```

Supported MVP elements:

- Shapes: rectangle, rounded rectangle, circle, diamond, cylinder, sticky note.
- Text: title, note, label.
- Connectors: arrow line with optional label.
- Groups: logical containers rendered as background rectangles.

Supported operations:

- Add, update, delete, move, duplicate.
- Select, deselect, select all.
- Undo and redo.
- Clear.
- Export PNG.
- Export project JSON.
- Auto-save to localStorage and restore on next visit.

## 9. Undo and Redo

Undo/redo must support both small local edits and large Agent-generated changes.

Use command sourcing with immutable `ProjectState` updates:

- Every executable action is a command.
- Commands are applied through `CommandManager`.
- Commands return the next immutable `ProjectState`.
- A complex Agent operation is wrapped as one `MacroCommand`.
- Undoing a `MacroCommand` reverts the whole user-visible action, not each internal node creation one by one.

Recommended implementation:

```ts
interface Command {
  id: string
  label: string
  apply(state: ProjectState): ProjectState
  invert(before: ProjectState, after: ProjectState): Command
}
```

For MVP simplicity, each command can store compact before/after snapshots at `ProjectState` level. If snapshot size becomes a problem later, replace this with structural patches. The user-facing behavior must stay the same.

Undo stack rules:

- A confirmed Agent plan is one undo step.
- A local voice edit is one undo step.
- Auto-layout caused by a command is included in that command's undo step.
- Failed validation and canceled pending plans do not enter history.
- Debug mouse dragging is committed as one command at drag end, not every pointer movement.

## 10. Fabric Group Rule

Do not use native `fabric.Group` for application groups.

Reason: Fabric groups use local coordinates relative to the group center. This complicates LLM output, layout, connector updates, and ProjectState consistency.

MVP rule:

- `GroupElement` exists only in `ProjectState`.
- A group renders as an absolute-positioned background rectangle at the bottom layer.
- The group title renders as a separate text object.
- Child elements keep global absolute coordinates.
- Parent-child relations are stored by `parentId`.

Moving a group must be handled through a command:

```text
MoveGroupCommand(groupId, dx, dy)
  -> move group background
  -> move group title
  -> move all child elements
  -> update affected connectors
```

Mouse or touch dragging in debug mode must still route through the command system.

## 11. Connections

Connectors store logical references, not fixed endpoint coordinates.

```ts
interface ConnectorElement {
  id: string
  kind: 'connector'
  fromId: string
  toId: string
  label?: string
  routing?: 'straight' | 'orthogonal'
  style?: ElementStyle
}
```

`ConnectionUpdater` recomputes connector geometry whenever an attached element changes.

Trigger sources:

- Layout changes.
- Voice move commands.
- Group movement.
- Debug mouse dragging.
- Import or restore.

MVP connector rules:

- Rect-like shapes connect from edge center points.
- Circles use projected circumference points.
- Diamonds can use bounding-box edge fallback.
- Labels sit near the line midpoint.
- Advanced obstacle avoidance and draw.io-style orthogonal routing are future work.

## 12. Layout

LLMs should output logic and relationships, not exact positions.

```ts
interface LayoutIntent {
  type: 'grid' | 'flow' | 'mindmap' | 'freeform'
  direction?: 'TB' | 'LR'
  mode: 'global' | 'incremental' | 'preserve-manual'
  anchorElementId?: string
  preserveManualPositions?: boolean
}
```

MVP layout strategies:

- `grid`: fallback layout for boards, notes, story maps, entertainment content.
- `flow`: use a small adapter around dagre for flowcharts and architecture diagrams.
- `mindmap`: use d3-hierarchy tree layout for parent-child mind maps.
- `incremental`: add new related elements near their anchors without re-laying out the whole canvas.

Do not hand-roll full flowchart or mind map layout algorithms in the MVP. Layout is a product dependency, not the product's core innovation. The MVP should spend complexity budget on voice routing, Agent planning, state reconciliation, and canvas execution.

Initial generation can use global layout. Later additions should usually use incremental layout. If the user has manually moved an element, mark it `manualLocked`; do not re-layout that element unless the user says "重新排版" or similar.

Implementation notes:

- Use dagre for `flow` global layout.
- Use d3-hierarchy for `mindmap` global layout.
- Keep adapters thin so the rest of the app depends only on `LayoutEngine`.
- Use a simple local grid fallback if a layout library fails or times out.
- Incremental layout can remain simple: place new nodes near anchor elements, avoid overlapping bounding boxes, and preserve existing manual positions.

## 13. CanvasDescriber

The Agent must not receive full Fabric JSON for every turn.

`CanvasDescriber` creates a compact context:

```yaml
title: AI 语音绘图工具架构
elementCount: 18
groups:
  - id: group_frontend
    label: 前端层
    nodes: [React, 语音入口, Fabric画布]
relations:
  - 语音入口 -> Agent代理
  - Agent代理 -> 布局引擎
selected: node_database
recentChanges:
  - 新增 Redis 缓存节点
```

Default summary excludes:

- Full styles.
- Precise coordinates.
- Fabric internals.

When the canvas grows large, summarize by group and include only selected elements, nearby subgraphs, and recent changes.

## 14. UI

The first screen should be the working canvas, not a landing page.

Main regions:

- Top status bar: model, STT, save, API mode.
- Canvas stage.
- Voice bar: listening state, transcript, Agent status.
- Command log: recent commands and results.
- Pending plan panel.
- Settings panel for API mode, audio feedback, and debug options.

`PendingPlanPanel` appears for complex changes:

- Shows plan summary.
- Shows rough counts of created, modified, and deleted elements.
- Provides execute, cancel, and text refine controls.
- Supports voice confirmation, cancellation, and refinement.

Click and text controls are usability fallbacks. The strict acceptance path must remain voice-only after initial permission.

## 15. Deployment and Risk Control

### Production

Recommended production route:

```text
Static frontend
  -> API Gateway with rate limits
  -> Domestic Serverless Function
  -> DeepSeek / Qwen / Zhipu
```

The Serverless Function must remain stateless. Production rate limits should be configured in API Gateway or the cloud provider gateway layer, not in function memory.

Gateway controls:

- Per-IP QPS or per-minute limit.
- Daily call cap.
- Request body size limit.
- Optional blacklist or WAF.

Function responsibilities:

- Validate request schema.
- Load model key from environment variables.
- Call the model with timeout.
- Parse and validate AgentPlan.
- Return normalized result or typed error.

### Local Development

Local development uses:

```text
Vite dev server
  -> /api proxy
  -> local Node/Express API
```

Local in-memory limits are allowed only as development safeguards.

### Static Fallback

The frontend-only mode can demonstrate templates and canvas behavior, but it cannot safely provide a system-owned LLM key. This mode must be documented as degraded.

## 16. Testing and Acceptance

### Required Acceptance Scenarios

- Start app, grant microphone permission, and enter listening state.
- Say "画一个用户注册登录流程图"; app creates a pending plan.
- Say "确认"; app renders nodes, connectors, and title.
- Say "把登录失败分支改成红色"; app resolves the target or asks/falls back to Agent.
- Say "加一个短信验证码步骤"; app adds a node with incremental layout.
- Say "撤销"; app restores previous state.
- Say "导出 PNG"; app creates a downloadable PNG.
- Simulate LLM failure; app falls back to local template.
- Simulate STT unavailable; app shows text debug input and clear explanation.
- Continue multi-turn edits; CanvasDescriber preserves enough context.

### Automated Tests

Unit tests:

- CommandRouter.
- EntityResolver.
- CanvasDescriber.
- PlanValidator.
- LayoutEngine.
- ConnectionUpdater.
- AgentPlan schema validation.
- CommandManager macro undo/redo.
- InteractionController abort and stale-plan reconciliation.

Integration tests:

- Template AgentPlan to layout to commands to ProjectState.
- Incremental layout does not move `manualLocked` existing elements.
- Connector endpoints update after element movement.
- Pending plan confirm, cancel, and refine behavior.
- LLM result returning after state version changes is not auto-applied.
- Barge-in cancel aborts the active planning request.

E2E tests:

- Test PendingPlanPanel DOM.
- Test status bar transitions.
- Test command log output.
- Test text debug input route.
- Test exported project state.

Do not rely on pixel-perfect canvas screenshots. Do not attempt to inspect Fabric internals through DOM. Expose a debug-only `window.getProjectState()` for E2E assertions against JSON structure, element counts, IDs, relations, and command results.

Visual canvas checks can be manual or loose smoke checks only.

### Performance Targets

- Local simple command response: under 200 ms.
- LLM plan response: normally 3-15 seconds.
- LLM timeout: 15 seconds.
- 80 elements remain usable in MVP.
- AgentPlan validation failure must never execute changes.
- TTS must be interruptible by barge-in.

## 17. DESIGN.md Deliverable Requirements

The final `docs/DESIGN.md` must include:

- Planned capabilities.
- Implemented capabilities.
- Unfinished capabilities and reasons.
- Voice-only acceptance definition.
- Browser/STT limitations.
- Deployment modes and security tradeoffs.
- Serverless hosting assumptions.
- API Gateway rate-limit recommendation.
- Known future extensions:
  - Backend STT.
  - Image generation.
  - Advanced diagram layout.
  - Login and cloud storage.
  - Richer collaboration.

It must not claim work is implemented before the code exists and is verified.

## 18. PR and Review Workflow

Development must be organized as small pull requests.

Rules:

- Each PR implements or modifies one feature only.
- Large features must be split into several independently reviewable PRs.
- Every merged PR must leave `main` runnable so reviewers can reproduce the demo at any time.
- Third-party libraries and frameworks introduced by a PR must be listed in README, with a short explanation of what the project uses them for.
- Reused code from previous personal work must be disclosed in the PR description with its source.

PR description template:

```markdown
## 功能描述

说明这个 PR 新增或修改了什么，以及用户如何使用它。

## 实现思路

说明关键技术选择、核心模块和主要数据流。

## 测试方式

列出验证命令、手工测试步骤，以及当前已知限制。
```

PR titles should be one clear sentence describing the change, such as "Add ProjectState and macro undo support".

Avoid empty PR descriptions, descriptions unrelated to the actual diff, and unexplained dependency additions. Use direct human wording; keep explanations practical and easy for reviewers to follow.

## 19. Implementation Order

Recommended implementation order:

1. Define `ProjectState`, elements, and command system.
2. Implement `CommandManager` with macro commands and immutable state snapshots.
3. Implement `InteractionController` with abort, queue, and stale-plan reconciliation.
4. Implement `FabricRenderer` without native Fabric groups.
5. Implement `ConnectionUpdater`.
6. Implement `LayoutEngine` adapters for dagre flow, d3-hierarchy mind maps, grid fallback, and incremental placement.
7. Implement local template Agent and AgentPlan validation.
8. Implement voice state machine, TTS, barge-in, earcons, and text debug fallback.
9. Implement PendingPlan confirmation flow.
10. Implement CanvasDescriber and EntityResolver with scoring heuristics.
11. Implement local Node/Express API proxy and LLM provider.
12. Add domestic Serverless deployment adapter documentation.
13. Add export, auto-save, and restore.
14. Update `docs/DESIGN.md` with planned, implemented, and unfinished sections.
15. Run unit tests, build, and manual voice acceptance checks.

## 20. Implementation Defaults

- Document Alibaba Cloud Function Compute first because the product prioritizes mainland China access and domestic deployment.
- Implement DeepSeek as the first production LLM adapter because the existing product design already selects it as the default domestic model.
- Use Fabric.js in the MVP renderer, but keep `ProjectState` independent from Fabric internals.
- Use dagre and d3-hierarchy from the start through thin adapters. Do not implement full custom flowchart or mind map layout algorithms in-house.
- Start with unit and integration tests. Add Playwright only for DOM, status, command, and `window.getProjectState()` checks; avoid canvas pixel assertions.
