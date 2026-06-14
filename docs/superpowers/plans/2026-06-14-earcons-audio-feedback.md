# Earcons Audio Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Add lightweight Web Audio earcons for voice-first state confidence without external audio assets.

**Architecture:** Keep this PR limited to `src/speech` plus this plan file. Do not wire UI, settings persistence, status transitions, microphone permission prompts, or app-shell state in this PR.

---

### Task 1: Audio Feedback Module

**Files:**
- Create: `src/speech/AudioFeedback.ts`
- Create: `src/speech/AudioFeedback.test.ts`

- [x] **Step 1: Write failing tests**

Cover:
- Reports unsupported status when no audio context factory exists.
- Does nothing when disabled.
- Plays one-shot cues for microphone, success, error, confirmation, and interruption.
- Starts and stops a looped thinking cue.
- `destroy()` stops thinking feedback and closes the audio context.

- [x] **Step 2: Verify RED**

Run:

```powershell
npm.cmd run test -- src/speech/AudioFeedback.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: fail because `src/speech/AudioFeedback.ts` does not exist.

- [x] **Step 3: Implement minimal module**

Implement:
- `AudioCue` union.
- `AudioFeedbackStatus`.
- `AudioFeedback`.
- `BrowserAudioFeedback` using injected `AudioContext` factory.
- Generated oscillator/gain tones only; no external audio files.

- [x] **Step 4: Verify GREEN**

Run:

```powershell
npm.cmd run test -- src/speech/AudioFeedback.test.ts --maxWorkers=1 --no-file-parallelism
```

Expected: all audio feedback tests pass.

### Task 2: PR Verification

- [x] Run `npm.cmd run test -- src/speech --maxWorkers=1 --no-file-parallelism`.
- [x] Run `npm.cmd run test -- --maxWorkers=1 --no-file-parallelism`.
- [x] Run `npm.cmd run build`.
- [x] Run `npm.cmd run lint`.
- [x] Run `git diff --check`.
- [x] Confirm no new dependencies, no external audio assets, no API keys, no network calls, no UI wiring, and no microphone permission changes in this PR.
