# Voice Canvas MVP PR Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Before coding from this roadmap, use `superpowers:writing-plans` to expand the selected PR into a code-level micro-plan, then use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement it. This roadmap is the long-running goal plan; it is not permission to batch multiple PRs into one change.

**Goal:** Deliver a complete, reviewable Voice Canvas MVP through small PRs while keeping `main` runnable and demo-ready after every merge.

**Architecture:** Build the product in thin vertical layers: foundation, state and command core, layout, canvas renderer, Agent pipeline, voice orchestration, UI integration, Serverless proxy, export/persistence, final documentation, and release verification. Each PR owns one capability and includes tests, manual acceptance, review notes, GitHub synchronization, and a clear PR description.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Fabric.js, dagre, d3-hierarchy, browser Web Speech API, Web Audio API, local Node/Express proxy, domestic Serverless deployment docs, DeepSeek-compatible LLM adapter.

---

## 0. Operating Rules

Do not start goal mode or coding until this roadmap is reviewed and approved.

Every coding PR must follow this loop:

1. Create or switch to a feature branch named `codex/<short-feature-name>`.
2. Expand the selected PR into a code-level micro-plan if the PR has more than one touched module.
3. Implement only that PR's scope.
4. Run automated checks.
5. Run manual acceptance checks.
6. Review the diff before committing.
7. Commit with a focused message.
8. Push branch to GitHub.
9. Open a PR with a complete title and description.
10. Review the PR as if another engineer wrote it.
11. Merge only after the branch is runnable and the PR matches its description.

`main` must remain runnable after every merge. If a PR breaks the demo path, fix it before moving on.

Do not accumulate completed local branches for later batch push. Each implementation round must end with its own pushed branch and PR.

## 1. GitHub Sync Contract

Target GitHub repository:

```text
https://github.com/qinghe-zy/game-asset-generator.git
```

Local repository currently needs a remote check before coding starts:

```bash
git remote -v
```

If no origin exists, add it during the first implementation session:

```bash
git remote add origin https://github.com/qinghe-zy/game-asset-generator.git
git remote -v
```

If the remote already exists but points elsewhere, stop and ask before changing it.

Each PR branch should be pushed:

```bash
git push -u origin codex/<short-feature-name>
```

GitHub synchronization is mandatory for every implementation round. A PR is not considered complete until its branch has been pushed to GitHub and the PR text is ready for review.

Strictly forbidden:

- Importing all source code in one large commit.
- Combining several roadmap PRs into one branch to save time.
- Keeping multiple finished PRs local and pushing them later as a batch.
- Merging or reporting completion before the corresponding branch is pushed.

PR descriptions must use:

```markdown
## 功能描述

说明这个 PR 新增或修改了什么，以及用户如何使用它。

## 实现思路

说明关键技术选择、核心模块和主要数据流。

## 测试方式

列出验证命令、手工测试步骤，以及当前已知限制。
```

When a PR adds a third-party library, README must list it and explain what it is used for. If any code is reused from prior personal work, the PR description must say so.

## 2. Design Reference

Product implementation should reference:

```text
D:\Project\voice-canvas\DESIGN.md
```

This file contains a Vercel-inspired design system:

- White and near-white surfaces.
- Ink-black primary text and actions.
- Subtle hairline borders.
- Sparse but precise spacing.
- Technical mono labels where useful.
- Minimal, workbench-first UI rather than a marketing landing page.

The app should feel like a developer-grade creative tool. It should not become a toy canvas with oversized decorations. Visual quality is part of MVP acceptance.

For every UI-facing PR, `D:\Project\voice-canvas\DESIGN.md` is a style constraint, not a loose inspiration note. The PR manual acceptance must check:

- Workbench-first layout, not a landing page.
- Near-white surfaces, ink text, subtle hairline borders, and restrained elevation.
- Dense but readable tool layout suitable for repeated use.
- Technical labels can use mono styling; body text stays clean and readable.
- No oversized decorative cards, generic gradients, or toy-like drawing-tool chrome.
- Responsive behavior keeps controls readable and avoids overlap.

## 3. Quality Gates

Each PR has four gates. Passing tests is required, but it is not enough by itself.

### Automated Gate

Run the commands listed by that PR. At minimum after the test harness exists:

```bash
npm run test
npm run build
npm run lint
```

### Manual Acceptance Gate

Run the app when the PR affects user-visible behavior:

```bash
npm run dev
```

Then verify the acceptance checklist for that PR. Browser checks should focus on visible behavior, not pixel-perfect screenshots.

For UI-facing PRs, include a design-reference check against `D:\Project\voice-canvas\DESIGN.md`. Record any intentional deviation in the PR description.

### Review Gate

Before commit:

```bash
git diff
git status --short
```

Review for:

- Scope creep.
- Unrelated formatting churn.
- Broken PR description.
- Missing README dependency notes.
- Missing tests for new logic.
- Main branch runnability after merge.
- Branch has been pushed to GitHub for this PR, not held for a later batch push.

### Safety and Reliability Gate

For every PR, check whether the change affects user data, network calls, browser permissions, dependency surface, or generated content. If it does, include the relevant checks in the PR description.

Safety checks may include:

- No API keys, tokens, or secrets committed to source.
- Frontend code does not expose system-owned model keys.
- User-provided text is treated as data, not trusted instructions.
- Imported project JSON is validated before applying.
- LLM output is validated before execution.
- Destructive commands require confirmation.
- Failed network calls fall back cleanly.
- Browser permission failures show clear recovery UI.
- New dependencies are documented and are necessary for the PR.
- Large generated outputs are bounded by operation and element limits.

## 4. MVP Completion Definition

The MVP is complete only when all of these are true:

- User can open the app and see a polished working canvas shell.
- User can create a structured diagram from a text debug command and, where browser support allows, from voice.
- Complex creation produces a pending Agent plan before execution.
- User can confirm/cancel the plan.
- Rendered canvas contains editable structured elements, connectors, and groups.
- Basic voice/local commands work: undo, redo, select, recolor, delete, clear, export.
- Multi-turn context uses a compact canvas summary.
- Incremental layout adds nodes without destroying existing layout.
- LLM can be called through a local proxy or Serverless-compatible adapter.
- LLM failure falls back to local templates.
- STT unavailable state is handled with clear UI and text debug fallback.
- Export PNG and project JSON work.
- README explains dependencies, scripts, local run, and deployment shape.
- `docs/DESIGN.md` records planned, implemented, and unfinished abilities.
- Security and failure-path checks are documented and pass for the demo path.
- Final demo can be reproduced from `main`.

## 5. PR Sequence Overview

The roadmap is split into 11 phases, 43 code/documentation PRs, and 1 local GitHub setup check.

Each PR should stay small. A PR can be split further during goal mode if its diff grows beyond a comfortable review size.

## Phase A: Repository and Foundation

### PR A0: Align GitHub Remote and Initial Branch Hygiene

**Purpose:** Make sure local work can sync to the provided GitHub repository.

**Files:** none unless a local setup note is needed.

**Implementation:**

- Check `git remote -v`.
- If no remote exists, add `origin` pointing to `https://github.com/qinghe-zy/game-asset-generator.git`.
- Do not push unrelated untracked files as a batch.
- Confirm default branch and remote visibility.

**Automated checks:**

```bash
git remote -v
git status --short --branch
```

**Manual acceptance:**

- Remote URL is visible and correct.
- No source files changed.

**Review gate:**

- Confirm no accidental file changes.

**PR:** Usually no PR needed if this is local-only setup. If a setup doc is added, open a docs-only PR.

### PR A1: Runnable Voice Canvas Shell

**Purpose:** Replace Vite starter with a workbench-first shell.

**Detailed plan:** Use Task 1 in [foundation plan](D:/Project/voice-canvas/docs/superpowers/plans/2026-06-13-voice-canvas-foundation-prs.md).

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- App opens to a Voice Canvas workbench.
- UI references the design system in `D:\Project\voice-canvas\DESIGN.md`.
- No template Vite/React marketing content remains.

**Review gate:**

- The PR is only app shell and README baseline.

### PR A2: Vitest Harness

**Purpose:** Add a test runner before state and command work.

**Detailed plan:** Use Task 2 in the foundation plan.

**Automated checks:**

```bash
npm run test
npm run build
npm run lint
```

**Manual acceptance:**

- Test command is documented.
- README lists Vitest and jsdom.

**Review gate:**

- No production behavior changes beyond scripts/docs.

## Phase B: State, Commands, and Interaction Core

### PR B1: ProjectState Model

**Purpose:** Add the source-of-truth model for canvas elements.

**Detailed plan:** Use Task 3 in the foundation plan.

**Automated checks:**

```bash
npm run test -- src/state/projectState.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- No visible UI regression.
- State model is independent from Fabric internals.

**Review gate:**

- Types are narrow and only cover MVP element kinds.

### PR B2: CommandManager and Macro Undo

**Purpose:** Add command sourcing with one-step undo for Agent macro operations.

**Detailed plan:** Use Task 4 in the foundation plan.

**Automated checks:**

```bash
npm run test -- src/commands/CommandManager.test.ts src/state/projectState.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- No UI regression.

**Review gate:**

- Macro command is one history entry.
- Debug pointer moves are not implemented in this PR.

### PR B3: InteractionController

**Purpose:** Handle async planning, aborts, and stale plan reconciliation.

**Detailed plan:** Use Task 5 in the foundation plan.

**Automated checks:**

```bash
npm run test -- src/interaction/InteractionController.test.ts
npm run test
npm run build
npm run lint
```

**Manual acceptance:**

- No UI regression.

**Review gate:**

- Stale plan is not auto-applied.
- Abort behavior is covered by tests.

### PR B4: AgentPlan Types and Validator

**Purpose:** Define the contract between LLM/local templates and execution.

**Files:**

- Create `src/agent/AgentPlan.ts`.
- Create `src/agent/PlanValidator.ts`.
- Create `src/agent/PlanValidator.test.ts`.

**Implementation details:**

- Define `AgentPlan`, `PlanOperation`, `LayoutIntent`.
- Validate operation IDs and references.
- Reject plans with too many operations.
- Reject destructive operations without `requiresConfirmation`.
- Normalize missing optional fields.

**Automated checks:**

```bash
npm run test -- src/agent/PlanValidator.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- No UI change.

**Review gate:**

- Validator prevents direct execution of malformed LLM output.
- Operation limit is explicit and documented in the test name.

### PR B5: EntityResolver Scoring

**Purpose:** Resolve spoken references to canvas element IDs without frequent clarification loops.

**Files:**

- Create `src/commands/EntityResolver.ts`.
- Create `src/commands/EntityResolver.test.ts`.

**Implementation details:**

- Score exact label matches.
- Score aliases.
- Score selected elements.
- Score recent changes.
- Score viewport visibility.
- Return `resolved`, `ambiguous`, or `missing`.

**Automated checks:**

```bash
npm run test -- src/commands/EntityResolver.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- No UI change.

**Review gate:**

- Resolver does not call LLM.
- Destructive ambiguous commands remain unresolved.

### PR B6: CanvasDescriber

**Purpose:** Produce compact canvas summaries for multi-turn Agent context.

**Files:**

- Create `src/agent/CanvasDescriber.ts`.
- Create `src/agent/CanvasDescriber.test.ts`.

**Implementation details:**

- Summarize title, element count, groups, labels, relations, selected IDs, and recent changes.
- Exclude Fabric JSON and full styles.
- Add threshold behavior for large canvases.

**Automated checks:**

```bash
npm run test -- src/agent/CanvasDescriber.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- No UI change.

**Review gate:**

- Summary stays small for 100+ elements.

## Phase C: Layout Engine

### PR C1: LayoutEngine Interface and Grid Layout

**Purpose:** Add a layout abstraction plus reliable fallback layout.

**Files:**

- Create `src/layout/LayoutEngine.ts`.
- Create `src/layout/GridLayout.ts`.
- Create `src/layout/LayoutEngine.test.ts`.

**Implementation details:**

- Accept logical elements and connectors.
- Output positions without mutating input.
- Grid layout avoids overlap for basic nodes.

**Automated checks:**

```bash
npm run test -- src/layout/LayoutEngine.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- No UI change.

**Review gate:**

- Layout module has no React or Fabric dependency.

### PR C2: Dagre Flow Layout Adapter

**Purpose:** Use dagre for flowchart and architecture layout.

**Files:**

- Modify `package.json`.
- Modify `README.md`.
- Create `src/layout/DagreFlowLayout.ts`.
- Create `src/layout/DagreFlowLayout.test.ts`.

**Implementation details:**

- Install `@dagrejs/dagre`.
- Convert nodes and edges to dagre graph.
- Preserve manual-locked nodes by excluding them from global movement or restoring their positions.
- Use grid fallback if dagre fails.

**Automated checks:**

```bash
npm run test -- src/layout/DagreFlowLayout.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- README lists dagre and its purpose.

**Review gate:**

- No custom full flow layout algorithm.

### PR C3: d3-hierarchy Mind Map Adapter

**Purpose:** Use d3-hierarchy for tree-style mind maps.

**Files:**

- Modify `package.json`.
- Modify `README.md`.
- Create `src/layout/TreeMindMapLayout.ts`.
- Create `src/layout/TreeMindMapLayout.test.ts`.

**Implementation details:**

- Install `d3-hierarchy`.
- Convert parent-child data into tree layout.
- Produce center-out node coordinates.
- Use grid fallback if the tree is invalid.

**Automated checks:**

```bash
npm run test -- src/layout/TreeMindMapLayout.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- README lists d3-hierarchy and its purpose.

**Review gate:**

- Adapter is thin and isolated.

### PR C4: Incremental Layout

**Purpose:** Add nodes near anchors without disturbing existing manual layout.

**Files:**

- Create `src/layout/IncrementalLayout.ts`.
- Create `src/layout/IncrementalLayout.test.ts`.

**Implementation details:**

- Find anchor by `anchorElementId`.
- Place new nodes to the right or below the anchor.
- Avoid overlapping existing bounding boxes.
- Preserve `manualLocked` positions.

**Automated checks:**

```bash
npm run test -- src/layout/IncrementalLayout.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- No UI change yet.

**Review gate:**

- Incremental layout does not perform global relayout.

### Phase C Module Acceptance

Run:

```bash
npm run test -- src/layout
npm run test
npm run build
npm run lint
```

Review:

- Layout adapters are isolated.
- Manual positions are respected.
- Third-party dependencies are documented.

## Phase D: Canvas Renderer

### PR D1: Fabric Dependency and CanvasStage Shell

**Purpose:** Add Fabric.js and mount a real canvas without drawing logic.

**Files:**

- Modify `package.json`.
- Modify `README.md`.
- Create `src/components/CanvasStage/CanvasStage.tsx`.
- Create `src/components/CanvasStage/CanvasStage.css`.
- Modify `src/App.tsx`.

**Implementation details:**

- Install `fabric`.
- Mount and dispose Fabric canvas safely.
- Keep UI shell runnable.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- Browser shows the real canvas region.
- No console errors on mount/unmount.
- README lists Fabric.js and its purpose.

**Review gate:**

- No Fabric Group usage.

### PR D2: FabricRenderer for Shapes and Text

**Purpose:** Render ProjectState shape and text elements onto Fabric.

**Files:**

- Create `src/canvas/FabricRenderer.ts`.
- Create `src/canvas/FabricRenderer.test.ts` if practical with mocked Fabric boundary.
- Modify `CanvasStage`.

**Implementation details:**

- Render rectangle, rounded rectangle, circle, diamond, cylinder fallback, sticky note, text.
- Use global coordinates.
- Keep Fabric objects tagged with element IDs.

**Automated checks:**

```bash
npm run test
npm run build
npm run lint
```

**Manual acceptance:**

- Load demo ProjectState and see shapes/text.
- No native Fabric group is used.

**Review gate:**

- ProjectState remains source of truth.

### PR D3: Logical Group Rendering

**Purpose:** Render groups as background rectangles and separate titles.

**Files:**

- Modify `src/canvas/FabricRenderer.ts`.
- Add tests for group object creation.

**Implementation details:**

- Render group background behind children.
- Render group title separately.
- Store parent relation only in ProjectState.

**Automated checks:**

```bash
npm run test
npm run build
npm run lint
```

**Manual acceptance:**

- Group box appears behind contained elements.
- Moving individual nodes does not convert them into Fabric local coordinates.

**Review gate:**

- No `fabric.Group`.

### PR D4: ConnectionUpdater and Connectors

**Purpose:** Draw connectors from element relationships and update when elements move.

**Files:**

- Create `src/canvas/ConnectionUpdater.ts`.
- Create `src/canvas/ConnectionUpdater.test.ts`.
- Modify `FabricRenderer`.

**Implementation details:**

- Calculate edge anchors for rect-like shapes.
- Calculate circle projected anchors.
- Use bounding box fallback for diamonds.
- Position labels near line midpoint.

**Automated checks:**

```bash
npm run test -- src/canvas/ConnectionUpdater.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- Demo connector follows nodes after a programmatic move.

**Review gate:**

- Connectors store `fromId` and `toId`, not fixed endpoints.

### PR D5: Canvas Debug ProjectState Exposure

**Purpose:** Expose debug-only `window.getProjectState()` for E2E and manual verification.

**Files:**

- Create `src/debug/projectStateDebug.ts`.
- Modify app state wiring.

**Implementation details:**

- Only expose in development or test mode.
- Return serializable ProjectState.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- In dev console, `window.getProjectState()` returns current JSON.

**Review gate:**

- No sensitive API keys or config exposed.

### Phase D Module Acceptance

Run:

```bash
npm run test
npm run build
npm run lint
npm run dev
```

Manual review:

- Canvas renders a non-trivial demo state.
- Groups are global-coordinate rectangles.
- Connectors update.
- No canvas pixel-perfect automated tests are added.

## Phase E: Local Agent and Execution Pipeline

### PR E1: Local Template Agent

**Purpose:** Generate useful diagrams without LLM.

**Files:**

- Create `src/agent/LocalTemplateAgent.ts`.
- Create `src/agent/LocalTemplateAgent.test.ts`.

**Implementation details:**

- Recognize flowchart, architecture, mind map, story map, relationship map, and party/travel planning prompts.
- Return AgentPlan, not ProjectState.
- Include fallback reason.

**Automated checks:**

```bash
npm run test -- src/agent/LocalTemplateAgent.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- Text debug command can produce a pending plan without network.

**Review gate:**

- Templates are useful enough for demo, not toy circles.

### PR E2: Plan to CommandBuilder

**Purpose:** Convert validated AgentPlan operations into macro commands.

**Files:**

- Create `src/agent/CommandBuilder.ts`.
- Create `src/agent/CommandBuilder.test.ts`.

**Implementation details:**

- Create shape/text/group/connector commands.
- Apply layout before rendering.
- Wrap plan execution as a macro command.

**Automated checks:**

```bash
npm run test -- src/agent/CommandBuilder.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- Local template plan can create ProjectState.
- Undo removes the whole generated diagram.

**Review gate:**

- Invalid plans do not execute.

### PR E3: PendingPlan Runtime

**Purpose:** Wire local Agent plan, confirmation, and execution in app state.

**Files:**

- Create `src/app/useVoiceCanvasController.ts`.
- Modify `src/App.tsx`.
- Create or modify `PendingPlanPanel`.

**Implementation details:**

- Text debug input sends prompt to local template Agent.
- Complex plan appears as pending.
- Confirm executes macro command.
- Cancel clears pending plan.

**Automated checks:**

```bash
npm run test
npm run build
npm run lint
```

**Manual acceptance:**

- Type "画一个用户注册登录流程图".
- Pending plan appears.
- Click execute.
- Canvas renders the flow.
- Undo removes the full flow.

**Review gate:**

- Text fallback is clearly marked as debug/compat mode.

### PR E4: CommandRouter for Local Commands

**Purpose:** Parse and execute simple commands without LLM.

**Files:**

- Create `src/commands/CommandRouter.ts`.
- Create `src/commands/CommandRouter.test.ts`.
- Wire into app controller.

**Implementation details:**

- Support undo, redo, clear, delete selected, export commands.
- Support basic color commands using EntityResolver.
- Route ambiguous commands to pending clarification state.

**Automated checks:**

```bash
npm run test -- src/commands/CommandRouter.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- Generate a flow.
- Enter "撤销".
- Enter "重做".
- Enter "把登录改成红色" where matching is unambiguous.

**Review gate:**

- No broad natural language guessing in regex code.

### Phase E Module Acceptance

Run:

```bash
npm run test
npm run build
npm run lint
npm run dev
```

Manual review:

- A non-trivial diagram can be generated locally.
- Confirmation is required for complex creation.
- Undo/redo work at user-action granularity.

## Phase F: Voice and Audio

### PR F1: Speech Provider Interfaces and Text Fallback

**Purpose:** Define speech abstraction and keep app usable when STT is unavailable.

**Files:**

- Create `src/speech/SpeechProvider.ts`.
- Create `src/speech/TextFallbackProvider.ts`.
- Add tests for provider state if useful.

**Implementation details:**

- Define transcript event contract.
- Text fallback produces the same transcript event shape as STT.

**Automated checks:**

```bash
npm run test
npm run build
npm run lint
```

**Manual acceptance:**

- Text input still drives Agent pipeline.

**Review gate:**

- Text fallback is not described as the strict voice path.

### PR F2: WebSpeechProvider

**Purpose:** Add browser Web Speech recognition.

**Files:**

- Create `src/speech/WebSpeechProvider.ts`.
- Create `src/speech/WebSpeechProvider.test.ts` with browser API mocks.

**Implementation details:**

- Detect API availability.
- Start/stop listening.
- Emit interim and final transcripts.
- Report unsupported state.

**Automated checks:**

```bash
npm run test -- src/speech/WebSpeechProvider.test.ts
npm run build
npm run lint
```

**Manual acceptance:**

- In Edge or supported browser, microphone can produce transcript.
- In unsupported browser, status explains fallback.

**Review gate:**

- No assumption that Chrome in mainland China works.

### PR F3: TTS and Barge-in Hooks

**Purpose:** Add speech feedback and interruption mechanics.

**Files:**

- Create `src/speech/TtsProvider.ts`.
- Create `src/speech/SpeechOrchestrator.ts`.
- Create tests with mocked speech synthesis.

**Implementation details:**

- Speak pending plan summary.
- Cancel TTS on barge-in signal.
- Route interruption phrase to controller.

**Automated checks:**

```bash
npm run test -- src/speech
npm run build
npm run lint
```

**Manual acceptance:**

- App speaks confirmation summary where browser supports TTS.
- "取消" or "停" stops pending speech path.

**Review gate:**

- TTS can be disabled.

### PR F4: Earcons

**Purpose:** Add subtle audio feedback for voice-first confidence.

**Files:**

- Create `src/speech/AudioFeedback.ts`.
- Wire into status transitions.

**Implementation details:**

- Use Web Audio API generated tones.
- Add enabled/disabled setting.
- Stop looped thinking sound after timeout or completion.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- Microphone, thinking, success, error, and interruption cues are audible and not harsh.

**Review gate:**

- No external audio assets added.

### Phase F Module Acceptance

Manual review is required:

- First-click permission path works.
- Voice path works in supported browser.
- Unsupported STT path remains usable through text fallback.
- TTS can be interrupted.

## Phase G: UI Integration and Polish

### PR G1: Workbench Layout and Status Bar

**Purpose:** Build the real app shell around canvas, status, voice bar, and command log.

**Files:**

- Create `src/components/StatusBar`.
- Create `src/components/VoiceBar`.
- Create `src/components/CommandLog`.
- Modify app shell CSS.

**Implementation details:**

- Follow `D:\Project\voice-canvas\DESIGN.md`.
- Keep workbench dense and focused.
- Use visible state transitions.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- UI feels like a production workbench.
- UI follows `D:\Project\voice-canvas\DESIGN.md`: near-white surfaces, ink hierarchy, hairline separators, restrained depth, and technical polish.
- No text overlaps at desktop and mobile widths.

**Review gate:**

- No marketing landing page.

### PR G2: PendingPlanPanel

**Purpose:** Show plan summary, execute/cancel, and text refinement.

**Files:**

- Create `src/components/PendingPlanPanel`.
- Add tests if component testing is added, otherwise manual acceptance.

**Implementation details:**

- Show summary.
- Show created/modified/deleted counts.
- Provide execute/cancel/refine controls.
- Voice confirmation still works independently.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- Complex plan opens panel.
- Execute/cancel work.
- Text refine updates plan request.
- Panel styling follows the design reference and feels like an integrated workbench control, not a modal ad card.

**Review gate:**

- Panel does not hide canvas context.

### PR G3: Settings Panel

**Purpose:** Let users see and adjust runtime mode, audio feedback, and debug options.

**Files:**

- Create `src/components/SettingsPanel`.
- Create `src/config/runtimeConfig.ts`.

**Implementation details:**

- Show API mode: local template, local proxy, Serverless.
- Toggle earcons.
- Toggle text debug input.
- Avoid exposing API keys in UI.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- Settings persist in localStorage where appropriate.
- Settings panel uses compact form controls and hairline separation consistent with the design reference.

**Review gate:**

- No secrets are stored by default.

### PR G4: Responsive and Accessibility Pass

**Purpose:** Ensure app is usable on desktop and reasonable on smaller screens.

**Files:**

- Modify component CSS.
- Add accessible labels.

**Implementation details:**

- Test desktop, tablet, mobile widths.
- Ensure focus states.
- Ensure buttons have labels.
- Avoid hidden instructions that only sighted users can understand.
- Re-check visual style against `D:\Project\voice-canvas\DESIGN.md` after responsive changes.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- No overlapping text.
- Main controls reachable by keyboard for fallback.
- Voice-first path remains prominent.

**Review gate:**

- UI still follows design reference.

### Phase G Module Acceptance

Run app and perform:

- Generate local diagram.
- Confirm via panel.
- Undo/redo.
- Resize browser.
- Review visual quality against `D:\Project\voice-canvas\DESIGN.md`.

## Phase H: LLM and API Proxy

### PR H1: AgentProvider Interface and LLM Client Contract

**Purpose:** Define provider boundary for local template and remote LLM.

**Files:**

- Create `src/agent/AgentProvider.ts`.
- Create `src/agent/LlmAgentProvider.ts`.
- Add tests with mocked fetch.

**Implementation details:**

- `AgentProvider.plan(input, context)` returns AgentPlan.
- Remote provider calls configured API base URL.
- Handles timeout and typed errors.

**Automated checks:**

```bash
npm run test -- src/agent
npm run build
npm run lint
```

**Manual acceptance:**

- App can switch between local and remote provider config.

**Review gate:**

- No model key in frontend.

### PR H2: Local Node/Express API Proxy

**Purpose:** Provide local `/api/agent` for development.

**Files:**

- Modify `package.json`.
- Modify `README.md`.
- Modify `vite.config.ts`.
- Create `api/agent/server.ts`.
- Create `api/agent/providers/deepseek.ts`.
- Create `.env.example` updates if needed.

**Implementation details:**

- Install minimal server dependencies.
- Read key from server environment.
- Validate request body.
- Timeout model call.
- Return AgentPlan JSON.
- Vite proxy forwards `/api`.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- Local frontend can call local proxy.
- Missing API key returns clear error and frontend falls back to local templates.

**Review gate:**

- README lists server dependency and local run command.
- No key committed.

### PR H3: DeepSeek Prompt and Schema

**Purpose:** Make remote LLM return useful structured AgentPlans.

**Files:**

- Create `api/agent/prompt.ts`.
- Create `api/agent/schema.ts`.
- Add tests for schema validation where possible.

**Implementation details:**

- Prompt asks for AgentPlan only.
- Include current CanvasDescriber summary.
- Limit operation count.
- Ask for IDs when modifying existing elements.

**Automated checks:**

```bash
npm run test
npm run build
npm run lint
```

**Manual acceptance:**

- With key configured, "画一个三层架构图" returns a useful pending plan.
- Without key, local fallback still works.

**Review gate:**

- Prompt does not claim unsupported image generation.

### PR H4: Serverless Deployment Docs

**Purpose:** Document production path without requiring self-managed server.

**Files:**

- Create `docs/deployment/alibaba-function-compute.md`.
- Modify `README.md`.

**Implementation details:**

- Explain static frontend + API Gateway + Function Compute.
- Explain environment variables.
- Explain API Gateway rate limiting.
- Explain China network assumptions.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- A reviewer understands how production hides model keys.

**Review gate:**

- No false claim that Vite alone hosts `/api`.

### Phase H Module Acceptance

Manual review:

- Local template mode works.
- Local proxy mode works when configured.
- Missing/failed LLM falls back gracefully.
- README and deployment docs match actual commands.

## Phase I: Persistence and Export

### PR I1: Project Autosave and Restore

**Purpose:** Keep work after reload.

**Files:**

- Create `src/persistence/projectStorage.ts`.
- Add tests.
- Wire into app controller.

**Implementation details:**

- Save ProjectState to localStorage.
- Restore on load.
- Handle invalid stored JSON.

**Automated checks:**

```bash
npm run test -- src/persistence
npm run build
npm run lint
```

**Manual acceptance:**

- Generate a diagram.
- Reload.
- Diagram restores.

**Review gate:**

- Storage errors do not crash app.

### PR I2: Project JSON Export and Import

**Purpose:** Let users download and reload `.voicecanvas.json`.

**Files:**

- Create `src/persistence/projectFile.ts`.
- Add UI command.
- Add tests.

**Implementation details:**

- Export serializable ProjectState.
- Validate imported version.
- Use file input fallback for import.

**Automated checks:**

```bash
npm run test -- src/persistence
npm run build
npm run lint
```

**Manual acceptance:**

- Export JSON.
- Clear canvas.
- Import JSON.
- Diagram returns.

**Review gate:**

- Imported JSON is validated before applying.

### PR I3: PNG Export

**Purpose:** Export the rendered canvas.

**Files:**

- Create `src/canvas/Exporter.ts`.
- Wire command and UI.

**Implementation details:**

- Use Fabric export API.
- Name file from project title and timestamp.
- Handle empty canvas gracefully.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- Generate diagram.
- Run export command.
- PNG downloads and opens.

**Review gate:**

- Export does not include hidden debug UI.

### Phase I Module Acceptance

Manual review:

- Restore works.
- JSON roundtrip works.
- PNG export works.

## Phase J: E2E and Final Documentation

### PR J1: Playwright DOM E2E Harness

**Purpose:** Add E2E tests that avoid canvas pixel assertions.

**Files:**

- Modify `package.json`.
- Modify `README.md`.
- Create `playwright.config.ts`.
- Create `tests/e2e/mvp-flow.spec.ts`.

**Implementation details:**

- Install Playwright.
- Test text debug input.
- Test PendingPlanPanel DOM.
- Test status transitions.
- Test `window.getProjectState()` element counts and relations.
- Do not use pixel-perfect canvas screenshots.

**Automated checks:**

```bash
npm run test:e2e
npm run test
npm run build
npm run lint
```

**Manual acceptance:**

- E2E passes locally.
- README lists Playwright and testing scope.

**Review gate:**

- Tests do not inspect Fabric internals through DOM.

### PR J2: Final `docs/DESIGN.md` Implementation Record

**Purpose:** Submit the required design document with planned, implemented, and unfinished parts.

**Files:**

- Modify `docs/DESIGN.md`.

**Implementation details:**

- List planned command capabilities.
- List implemented command capabilities.
- List unfinished features with reasons.
- Mention STT limitations.
- Mention Serverless/API Gateway requirement for system-owned keys.
- Mention local template fallback.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- Document matches actual code.
- No fake completed features.

**Review gate:**

- Written in human tone, concise and specific.

### PR J3: README Demo Guide

**Purpose:** Make the project reproducible by judges at any time.

**Files:**

- Modify `README.md`.

**Implementation details:**

- Add setup commands.
- Add local demo flow.
- Add browser recommendations.
- Add API key/proxy explanation.
- Add known limitations.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- A fresh reviewer can run the app from README.

**Review gate:**

- README dependency list is complete.

### PR J4: Final MVP Acceptance Pass

**Purpose:** Stabilize final demo without adding new scope.

**Files:**

- Only bug fixes found during acceptance.

**Required demo script:**

1. Open app.
2. Start voice or use text debug fallback if STT is unavailable.
3. Create "用户注册登录流程图".
4. Confirm plan.
5. Add "短信验证码步骤".
6. Recolor a resolved node.
7. Undo and redo.
8. Export PNG.
9. Reload and confirm autosave.
10. Show `docs/DESIGN.md`.

**Automated checks:**

```bash
npm run test
npm run test:e2e
npm run build
npm run lint
```

**Manual acceptance:**

- The demo script works from `main`.
- No console errors during normal demo.
- PR descriptions and README match final behavior.

**Review gate:**

- This PR only stabilizes; it does not introduce new features.

## Phase K: Security, Dependency, and Failure-Path Hardening

### PR K1: Security Checklist and Secret Handling Audit

**Purpose:** Verify the project does not leak keys and documents the frontend/backend security boundary.

**Files:**

- Create `docs/security/checklist.md`.
- Modify `README.md` if setup guidance needs clarification.
- Modify `.env.example` only if variable names or warnings are missing.

**Implementation details:**

- Document where LLM keys may live.
- Document why frontend bundles cannot safely contain system-owned keys.
- Check `.gitignore` covers local env files.
- Check README does not ask users to paste production keys into frontend code.
- Check Serverless/API Gateway guidance is consistent with implementation.

**Automated checks:**

```bash
npm run test
npm run build
npm run lint
```

**Manual acceptance:**

- Search the repository for common secret prefixes before opening the PR.
- Confirm `.env.example` contains placeholders only.
- Confirm local `.env` files are ignored.

**Review gate:**

- No secret is committed.
- Security docs use practical wording and match the actual architecture.

### PR K2: Dependency and License Notes

**Purpose:** Make third-party usage explicit for reviewers and avoid unexplained framework/library additions.

**Files:**

- Modify `README.md`.
- Create `docs/dependencies.md`.

**Implementation details:**

- List React, Vite, Vitest, jsdom, Fabric.js, dagre, d3-hierarchy, Playwright, Express or the selected local proxy dependency.
- For each dependency, explain what project module uses it.
- Mark which parts are original implementation: AgentPlan contract, ProjectState, command system, EntityResolver, CanvasDescriber, UI integration.
- If any copied or reused personal code exists, document its source. If none exists, say the implementation was written for this project.

**Automated checks:**

```bash
npm run build
npm run lint
```

**Manual acceptance:**

- README and dependency docs agree with `package.json`.
- No dependency appears in `package.json` without an explanation.

**Review gate:**

- Dependency notes are factual and not padded.

### PR K3: Failure-Path Drill

**Purpose:** Prove the MVP behaves well when expected services fail.

**Files:**

- Create `docs/qa/failure-drill.md`.
- Add tests for failure paths if missing.
- Fix small failure-path bugs found during the drill.

**Drill scenarios:**

1. STT unsupported or microphone denied.
2. LLM API key missing.
3. LLM request timeout.
4. Invalid AgentPlan returned.
5. Invalid imported project JSON.
6. Layout adapter throws and grid fallback is used.
7. Canvas restore data is corrupted.
8. Export requested on an empty canvas.

**Automated checks:**

```bash
npm run test
npm run test:e2e
npm run build
npm run lint
```

**Manual acceptance:**

- Run each drill scenario and record observed behavior in `docs/qa/failure-drill.md`.
- The app stays usable or provides clear recovery instructions.

**Review gate:**

- This PR fixes only failure-path bugs found by the drill.
- No new product feature is introduced here.

## 6. Long-Running Review Rhythm

After each phase, do a module-level review before starting the next phase:

- Phase A: repo and shell can run.
- Phase B: state, commands, async control are tested.
- Phase C: layout produces readable positions and respects manual locks.
- Phase D: canvas renders structured data and connectors correctly.
- Phase E: local Agent can create and modify meaningful diagrams.
- Phase F: voice path works where supported, fallback is honest.
- Phase G: UI is polished and usable.
- Phase H: remote LLM path is safe and documented.
- Phase I: user work can be saved and exported.
- Phase J: final demo is reproducible.
- Phase K: security, dependencies, and failure paths are documented and verified.

If a phase review finds architectural drift, stop and fix before moving forward.

## 7. Goal Mode Startup Checklist

When the user approves this roadmap and asks to start goal mode:

1. Create the goal with the objective "Complete Voice Canvas MVP through small reviewed PRs".
2. Confirm GitHub remote.
3. Start with PR A0 or A1 depending on remote state.
4. For each PR, create a branch.
5. Expand that PR into a code-level micro-plan when needed.
6. Implement, test, manually accept, review, commit, push, open PR.
7. Report exact verification and remaining risks.

Do not skip review between PRs to go faster. The plan values reliable progress over batch speed.
