# Speech Provider Text Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the speech transcript boundary and add a text fallback provider that can drive the same command pipeline as future STT providers.

**Architecture:** Keep this PR limited to `src/speech`. Define provider contracts in `SpeechProvider.ts` and implement `TextFallbackProvider` as an event-emitting adapter for typed text. Do not wire Web Speech, TTS, barge-in, or UI changes in this PR.

**Tech Stack:** TypeScript, Vitest.

---

### Task 1: Speech Contract And Text Fallback

**Files:**
- Create: `src/speech/SpeechProvider.ts`
- Create: `src/speech/TextFallbackProvider.ts`
- Create: `src/speech/TextFallbackProvider.test.ts`

- [x] **Step 1: Write failing tests**

Cover:
- `TextFallbackProvider` starts in an idle text-fallback mode.
- Subscribers receive a final transcript event when text is submitted.
- Empty or whitespace-only text does not emit a transcript.
- `start()` and `stop()` update provider status.
- `destroy()` removes listeners and stops future emissions.

- [x] **Step 2: Verify RED**

Run:

```powershell
npm run test -- src/speech/TextFallbackProvider.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: fail because `src/speech/TextFallbackProvider.ts` does not exist.

- [x] **Step 3: Implement minimal provider**

Define:
- `SpeechProviderStatus`
- `SpeechTranscriptEvent`
- `SpeechProvider`
- `TranscriptListener`

Implement:
- `TextFallbackProvider.subscribe(listener)`
- `TextFallbackProvider.submitText(text)`
- `TextFallbackProvider.start()`
- `TextFallbackProvider.stop()`
- `TextFallbackProvider.getStatus()`
- `TextFallbackProvider.destroy()`

- [x] **Step 4: Verify GREEN**

Run:

```powershell
npm run test -- src/speech/TextFallbackProvider.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: all speech fallback tests pass.

### Task 2: PR Verification

- [x] Run `npm run test -- --maxWorkers=1 --no-file-parallelism`.
- [x] Run `npm run build`.
- [x] Run `npm run lint`.
- [x] Run `git diff --check`.
- [x] Confirm no new dependencies, no browser permission prompts, no network calls, no API keys, and no Web Speech implementation in this PR.
