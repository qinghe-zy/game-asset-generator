# Web Speech Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Add a browser Web Speech provider that conforms to the existing `SpeechProvider` contract while honestly reporting unsupported environments.

**Architecture:** Keep this PR limited to `src/speech` plus this plan file. Do not wire UI, TTS, barge-in, command routing, or microphone controls into the app shell in this PR.

**Risk notes:**
- Web Speech recognition is not Baseline across browsers.
- Chrome implementations can depend on remote recognition services, so China mainland availability must be treated as unreliable.
- Unsupported status must be explicit so the UI can fall back to text input in a later PR.

---

### Task 1: Web Speech Provider

**Files:**
- Create: `src/speech/WebSpeechProvider.ts`
- Create: `src/speech/WebSpeechProvider.test.ts`

- [x] **Step 1: Write failing tests**

Cover:
- Reports unsupported status when no `SpeechRecognition` or `webkitSpeechRecognition` constructor exists.
- Uses `SpeechRecognition` when available and starts in idle web-speech mode.
- `start()` calls recognition start and moves to listening.
- `stop()` calls recognition stop and moves to idle.
- Final result events emit trimmed transcript text with `source: 'web-speech'`.
- Recognition errors move status to error with a readable message.
- `destroy()` stops recognition, clears handlers, and prevents future transcript emissions.

- [x] **Step 2: Verify RED**

Run:

```powershell
npm.cmd run test -- src/speech/WebSpeechProvider.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: fail because `src/speech/WebSpeechProvider.ts` does not exist.

- [x] **Step 3: Implement minimal provider**

Implement:
- Constructor injection via `{ speechRecognitionConstructor?: ... }` for testability and browser capability detection.
- Fallback detection for `window.SpeechRecognition` and `window.webkitSpeechRecognition`.
- `getStatus`, `start`, `stop`, `subscribe`, and `destroy`.
- Browser event handlers for `onresult`, `onerror`, and `onend`.

- [x] **Step 4: Verify GREEN**

Run:

```powershell
npm.cmd run test -- src/speech/WebSpeechProvider.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: all Web Speech provider tests pass.

### Task 2: PR Verification

- [x] Run `npm.cmd run test -- --maxWorkers=1 --no-file-parallelism`.
- [x] Run `npm.cmd run build`.
- [x] Run `npm.cmd run lint`.
- [x] Run `git diff --check`.
- [x] Confirm no new dependencies, no API keys, no network calls, no UI wiring, and no claims that Web Speech works reliably in China mainland.
