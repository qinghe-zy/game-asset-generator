# Failure Drill

This drill lists expected MVP behavior when common services or inputs fail. It should be rerun after the pending API proxy and persistence/export branches merge.

## 1. STT Unsupported or Microphone Denied

Expected behavior:

- App remains usable through text fallback.
- UI explains that browser STT may be unavailable, especially in mainland China.
- Voice-first path can still be tested in Edge or another supported browser.

Current evidence:

- Text fallback input exists on current main.
- Web Speech unsupported handling exists in the speech module.

## 2. LLM API Key Missing

Expected behavior:

- Server returns a typed `MISSING_API_KEY` error.
- Frontend can fall back to local templates.
- No API key is requested or stored in the browser.

Current evidence:

- Implemented in pending `codex/voice-canvas-api-proxy` branch.
- Needs verification again after merge.

## 3. LLM Request Timeout

Expected behavior:

- Server aborts model request.
- Frontend receives a typed timeout/network error.
- Local templates remain usable.

Current evidence:

- Frontend `LlmAgentProvider` has timeout tests on current main.
- Server timeout path exists in pending API proxy branch.

## 4. Invalid AgentPlan Returned

Expected behavior:

- Invalid plans never execute.
- User sees a recoverable error or fallback plan.

Current evidence:

- `validateAgentPlan` exists on current main.
- Frontend and pending server provider both validate model output.

## 5. Invalid Imported Project JSON

Expected behavior:

- Import is rejected with a clear message.
- Current canvas remains unchanged.

Current evidence:

- Implemented in pending `codex/voice-canvas-persistence-export` branch.
- Needs verification again after merge.

## 6. Layout Adapter Failure

Expected behavior:

- Grid fallback or safe error path prevents broken canvas state.
- Manual positions should not be destroyed by incremental operations.

Current evidence:

- Layout adapters are covered by unit tests on current main.
- A future final drill should force a layout exception and record observed fallback behavior.

## 7. Corrupted Autosave Data

Expected behavior:

- Corrupted stored JSON is ignored.
- App starts from demo/default state instead of crashing.

Current evidence:

- Implemented in pending persistence/export branch.

## 8. Export Requested on Empty Canvas

Expected behavior:

- PNG and JSON export should still produce a valid file or a clear status message.
- Export should not include debug UI overlays.

Current evidence:

- Implemented in pending persistence/export branch for JSON/PNG toolbar paths.

## Release Drill Commands

```bash
npm run test
npm run lint
npm run build
```

Manual checks:

- Run local text fallback and create a diagram.
- Confirm plan and verify nodes/connectors render.
- Reload and verify autosave after persistence branch merges.
- Export JSON and PNG after persistence branch merges.
- Start API proxy and check `/api/health` after API branch merges.
