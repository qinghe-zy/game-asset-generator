# Voice Canvas MVP Design Record

Date: 2026-06-14

## Goal

Voice Canvas is an AI voice drawing tool. The MVP goal is a voice-first drawing loop where a user describes a structured drawing, the app turns the request into an editable plan, asks for confirmation when needed, and renders the result on a canvas.

The app is designed as a real MVP rather than a toy demo. It supports structured diagrams, planning maps, story and entertainment maps, local fallbacks, and a deployment path that can run in mainland China with a VPS API proxy.

## Planned Capabilities

- Voice-first creation after the initial browser permission step.
- Browser STT with a visible text fallback when STT is unavailable.
- TTS and barge-in hooks for interrupting spoken feedback.
- Lightweight earcons for listening, thinking, confirmation, success, and error states.
- AgentPlan based drawing, where the Agent emits logical operations rather than Fabric.js JSON.
- Local command routing for low-latency undo, redo, selection, color changes, deletion, clear, and export.
- Entity resolution with heuristic scoring and Agent fallback when references are ambiguous.
- Confirmation flow for complex or destructive plans.
- ProjectState as the source of truth, with Fabric.js only as the renderer.
- Logical groups rendered as absolute background rectangles instead of native `fabric.Group`.
- Smart connectors that recompute endpoints from logical `fromId` and `toId`.
- Layout engines for flowcharts, mind maps, grids, and incremental additions.
- Canvas summary for future multi-turn Agent context without sending full Fabric JSON.
- Undo/redo with macro-command semantics.
- Local template Agent for offline and degraded demos.
- LLM Agent provider contract plus a VPS API proxy for server-side model calls.
- Project autosave, restore, JSON import/export, and PNG export.
- E2E tests that assert DOM state and `window.getProjectState()` JSON, not canvas pixels.
- Deployment documentation for `040415.xyz`, Nginx, and a Node/Express API on `127.0.0.1:3000`.

## Implemented Capabilities

- React/Vite app shell with a workbench-first layout.
- Status bar, canvas stage, voice/text control bar, command log, pending plan panel, and runtime settings panel.
- ProjectState model for shapes, text, connectors, and logical groups.
- CommandManager with undo/redo and macro-command execution.
- AgentPlan type, validation, command building, and local template Agent.
- Local template support for flowcharts, architecture diagrams, mind maps, story maps, relationship maps, and planning maps.
- Dagre flow layout, d3-hierarchy mind map layout, grid layout, and incremental layout.
- FabricRenderer that renders ProjectState to Fabric without native Fabric grouping.
- ConnectionUpdater for connector endpoint and label geometry.
- Debug-only `window.getProjectState()` for tests.
- Text fallback route that exercises the Agent, confirmation, layout, command, and canvas chain.
- PendingPlan confirm, cancel, and text refine UI.
- Web Speech provider, text fallback provider, SpeechOrchestrator basics, TTS barge-in hooks, and earcons.
- Runtime settings for local template, VPS proxy, Serverless-compatible mode, earcons, and text debug input.
- LLM Agent provider contract and server-side Agent API proxy PR.
- Playwright MVP E2E harness using local Chromium and ProjectState JSON assertions.

Some capabilities are implemented in open PRs at the time of this document:

- VPS Agent API proxy and DeepSeek-compatible provider: PR #36.
- Project persistence, JSON import/export, PNG export: PR #37.
- Security checklist, dependency inventory, and failure-drill documentation: PR #38.

## Unfinished Or Partial Capabilities

- Full voice-only acceptance is partial. Browser microphone permission still requires the normal browser gesture, and text fallback remains the most reliable path in Chrome inside mainland China.
- Backend STT is not implemented. The MVP uses browser Web Speech when available and text fallback otherwise.
- LLM multi-turn reconciliation is partial. The project has provider contracts and compact canvas summary groundwork, but robust stale-plan reconciliation and long conversation memory need more integration work.
- Entity resolution handles practical local cases, but complex spatial references should still fall back to Agent clarification.
- Advanced connector routing is not implemented. Connectors update logically, but obstacle avoidance and draw.io-level orthogonal routing remain future work.
- Image generation is not implemented. The MVP focuses on structured canvas creation.
- Login, cloud storage, and multi-user collaboration are out of scope for MVP.
- Production deployment to `040415.xyz` is documented, but final server deployment and live smoke testing require server access and environment variables.

## Voice-Only Acceptance Definition

The intended strict path is:

1. User opens the app and grants microphone permission.
2. User speaks a drawing request.
3. The app transcribes, routes, creates an AgentPlan, and asks for confirmation.
4. User confirms by voice.
5. The app executes the plan and renders the canvas.
6. User continues by voice for undo, redo, modification, export, or refinement.

Because browser STT is unreliable in mainland China, the MVP also includes a text compatibility input. This input is a fallback for demos and automated tests; it does not replace the voice-first product direction.

## Browser And STT Limitations

- Chrome Web Speech may fail in mainland China because it depends on Google services.
- Edge is more likely to work because its speech path uses Microsoft infrastructure.
- When STT is unavailable, the app must show text fallback rather than blocking the Agent and canvas chain.
- Automated E2E tests use text fallback to avoid relying on live microphone and external speech services.

## Layout And Canvas Rules

- AgentPlan outputs logical operations and layout intent, not precise X/Y coordinates.
- Flow layout uses dagre.
- Mind map layout uses d3-hierarchy.
- Grid layout is the fallback.
- Incremental layout preserves existing canvas structure where possible.
- ProjectState is the source of truth.
- Fabric.js renders the current ProjectState only.
- Native Fabric groups are avoided. Logical groups render as absolute background rectangles.
- Connectors store logical references and are recalculated during render or movement.

## Deployment Modes

### Local Template Mode

Runs as a frontend-only demo with local template Agent behavior. This mode is useful for offline demos, automated tests, and degraded environments.

### Local VPS-Proxy Development

Run the API and frontend separately:

```bash
npm run api:dev
npm run dev
```

Vite proxies `/api/*` to `http://127.0.0.1:3000`.

### VPS Production Mode

The planned production shape is:

```text
Nginx static frontend
  -> /api reverse proxy
  -> Node/Express API on 127.0.0.1:3000
  -> Domestic LLM provider
```

Known server assumptions:

- Domains: `https://040415.xyz` and `https://www.040415.xyz`.
- Public IP: `20.78.128.220`.
- OS: Ubuntu 22.04.
- Web service: Nginx.
- Static site directory: `/var/www/040415.xyz/html`.
- HTTPS: Let's Encrypt is already configured and auto-renews.
- API process should listen on `127.0.0.1:3000`.

### Future Serverless-Compatible Mode

The API handler should stay stateless so the same validation, prompt construction, provider call, timeout, and AgentPlan validation logic can later move behind a domestic API Gateway and function runtime.

Rate limits should be configured at Nginx, WAF, API Gateway, or cloud gateway level. Function memory should not be used as the durable rate-limit store.

## Security Notes

- Model keys must stay on the server and must not be bundled into frontend code.
- Request body size should be limited.
- The API should validate input and output schemas.
- Provider calls should use timeouts and typed errors.
- Production logs should not include secrets or full user prompts unless an explicit privacy policy allows it.
- Rate limiting should be applied before expensive LLM calls.

## Testing Strategy

Unit and integration tests cover state, commands, layouts, AgentPlan validation, local templates, speech providers, and rendering helpers.

E2E tests cover:

- Text fallback input.
- PendingPlanPanel DOM.
- Status bar transitions.
- Command log output.
- ProjectState JSON after execution.

E2E tests intentionally avoid pixel-perfect canvas screenshots and Fabric DOM inspection. Canvas visuals should be checked by ProjectState assertions and manual smoke tests.

## Current Verification Commands

```bash
npm run test
npm run lint
npm run build
npm run test:e2e
```

When using a local Chromium build:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chrome npm run test:e2e
```

On Windows PowerShell:

```powershell
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='C:\Users\33398\.agent-browser\browsers\chrome-148.0.7778.167\chrome.exe'
npm.cmd run test:e2e
```

Run `npm run test:e2e` separately from `npm run build` because both commands write to `dist`.

## Future Extensions

- Backend STT provider for China-friendly production speech recognition.
- Rich multi-turn Agent memory and stale-plan reconciliation.
- Advanced connector routing with obstacle avoidance.
- Image generation provider for bitmap assets.
- Cloud accounts and project sync.
- Collaboration and sharing.
- More diagram templates and domain-specific Agent skills.
