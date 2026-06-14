# Workbench Status UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans, superpowers:test-driven-development, and frontend-design guidance to implement this plan task-by-task.

**Goal:** Add the first Phase G workbench UI layer: status bar, voice bar, and command log, while preserving the current text fallback planning flow.

**Design reference:** Use `D:\Project\voice-canvas\DESIGN.md` as the style constraint. Keep near-white surfaces, ink text, hairline borders, compact technical labels, and a workbench-first layout.

**Architecture:** Keep this PR limited to UI components and controller metadata. Do not wire real STT, TTS, earcons, settings persistence, remote LLM, or export behavior in this PR.

---

### Task 1: Component Shells and App Wiring

**Files:**
- Create `src/components/StatusBar/StatusBar.tsx`
- Create `src/components/StatusBar/StatusBar.css`
- Create `src/components/VoiceBar/VoiceBar.tsx`
- Create `src/components/VoiceBar/VoiceBar.css`
- Create `src/components/CommandLog/CommandLog.tsx`
- Create `src/components/CommandLog/CommandLog.css`
- Modify `src/App.tsx`
- Modify `src/App.css`
- Modify `src/App.test.tsx`
- Modify `src/app/useVoiceCanvasController.ts`

- [x] **Step 1: Write failing tests**

Cover:
- App renders StatusBar, VoiceBar, and CommandLog landmarks.
- StatusBar shows current mode and STT fallback status.
- VoiceBar keeps the existing text compatibility input and undo/redo actions.
- CommandLog records submitted prompt and execution/cancel/undo/redo outcomes.

- [x] **Step 2: Verify RED**

Run:

```powershell
npm.cmd run test -- src/App.test.tsx --maxWorkers=1 --no-file-parallelism
```

Expected: fail because new landmarks and log entries are not rendered yet.

- [x] **Step 3: Implement minimal UI**

Implement:
- `StatusBar` with compact status segments.
- `VoiceBar` wrapping the existing text fallback form.
- `CommandLog` with bounded recent entries.
- Controller command log entries for prompt submission and outcomes.

- [x] **Step 4: Verify GREEN**

Run:

```powershell
npm.cmd run test -- src/App.test.tsx --maxWorkers=1 --no-file-parallelism
```

Expected: App tests pass.

### Task 2: PR Verification

- [x] Run `npm.cmd run test -- --maxWorkers=1 --no-file-parallelism`.
- [x] Run `npm.cmd run build`.
- [x] Run `npm.cmd run lint`.
- [x] Run `git diff --check`.
- [x] Check CSS against `D:\Project\voice-canvas\DESIGN.md`: near-white surfaces, ink hierarchy, hairline borders, compact controls, no marketing hero, no decorative gradient/orb, no nested cards.
- [x] Confirm no new dependencies, no API keys, no network calls, no microphone permission changes, and no claim that real STT UI is complete in this PR.
