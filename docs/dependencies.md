# Dependencies

This document explains third-party dependencies used by the Voice Canvas MVP and separates library usage from original project logic.

## Runtime Dependencies on Current Main

- React and React DOM: render the workbench UI.
- Fabric.js: render structured `ProjectState` elements to a canvas.
- @dagrejs/dagre: compute flowchart and architecture layouts.
- d3-hierarchy: compute mind map and tree layouts.

## Development Dependencies on Current Main

- Vite: local development server and production frontend build.
- TypeScript: static type checking.
- ESLint and TypeScript ESLint: lint TypeScript and React source.
- Vitest and jsdom: unit and DOM-style tests.
- React type packages and Vite React plugin: React development support.

## Pending API Proxy Dependencies

The pending `codex/voice-canvas-api-proxy` branch adds:

- Express: Node API routes for `/api/health` and `/api/agent/plan`.
- cors: development-time browser/API communication.
- tsx: run the TypeScript API entrypoint without a separate server build step.
- @types/express and @types/cors: TypeScript declarations for the API proxy.

## Original Project Logic

The following parts are project-specific implementation, not copied framework code:

- `ProjectState` model and canvas element types.
- Command manager, macro undo/redo, and local command routing.
- Entity resolver scoring.
- Canvas summarization for compact Agent context.
- AgentPlan contract and validation.
- Layout adapters and incremental layout glue.
- Fabric renderer and connector updater.
- Local template Agent plans.
- Voice/STT/TTS orchestration scaffolding.
- Pending plan confirmation UI.
- Runtime settings UI.
- Pending persistence/export modules.
- Pending VPS API proxy and DeepSeek AgentPlan prompt.

No personal historical project code has been intentionally reused. If that changes later, disclose the source in the relevant PR description.
