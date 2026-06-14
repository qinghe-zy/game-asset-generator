# TTS and Barge-in Hooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Add speech feedback and interruption hooks so pending plan narration can be stopped when the user speaks or says a high-priority interruption phrase.

**Architecture:** Keep this PR limited to `src/speech` plus this plan file. Do not wire UI, command routing, model calls, microphone permission prompts, or app-shell state in this PR.

---

### Task 1: TTS Provider

**Files:**
- Create: `src/speech/TtsProvider.ts`
- Create: `src/speech/TtsProvider.test.ts`

- [x] **Step 1: Write failing tests**

Cover:
- Reports unsupported status when no `speechSynthesis` or utterance constructor exists.
- Speaks text through injected browser synthesis.
- Cancels current speech.
- Ignores empty text.
- Clears speaking state after utterance end.

- [x] **Step 2: Verify RED**

Run:

```powershell
npm.cmd run test -- src/speech/TtsProvider.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: fail because `src/speech/TtsProvider.ts` does not exist.

- [x] **Step 3: Implement minimal provider**

Implement:
- `TtsProviderStatus`
- `TtsProvider`
- `BrowserTtsProvider`
- constructor injection for browser synthesis and utterance constructor.

- [x] **Step 4: Verify GREEN**

Run:

```powershell
npm.cmd run test -- src/speech/TtsProvider.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: all TTS provider tests pass.

### Task 2: Speech Orchestrator Barge-in Hooks

**Files:**
- Create: `src/speech/SpeechOrchestrator.ts`
- Create: `src/speech/SpeechOrchestrator.test.ts`

- [x] **Step 1: Write failing tests**

Cover:
- Speaking a pending plan summary delegates to TTS.
- A final transcript containing interruption phrases cancels TTS.
- Interruption notifies a callback with the transcript and reason.
- Non-interruption transcript is forwarded to the normal transcript callback.
- `destroy()` unsubscribes from speech provider and cancels TTS.

- [x] **Step 2: Verify RED**

Run:

```powershell
npm.cmd run test -- src/speech/SpeechOrchestrator.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: fail because `src/speech/SpeechOrchestrator.ts` does not exist.

- [x] **Step 3: Implement minimal orchestrator**

Implement:
- `SpeechOrchestrator`
- interruption phrase detection for: `等等`, `停`, `取消`, `先别执行`, `修改一下`
- transcript subscription and cleanup.

- [x] **Step 4: Verify GREEN**

Run:

```powershell
npm.cmd run test -- src/speech/SpeechOrchestrator.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: all orchestrator tests pass.

### Task 3: PR Verification

- [x] Run `npm.cmd run test -- src/speech --maxWorkers=1 --no-file-parallelism`.
- [x] Run `npm.cmd run test -- --maxWorkers=1 --no-file-parallelism`.
- [x] Run `npm.cmd run build`.
- [x] Run `npm.cmd run lint`.
- [x] Run `git diff --check`.
- [x] Confirm no new dependencies, no API keys, no network calls, no UI wiring, and no microphone permission changes in this PR.
