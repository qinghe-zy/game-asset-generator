# Voice Canvas

Voice Canvas is an AI voice drawing tool. The MVP focuses on a voice-first structured canvas: users speak drawing goals, the app turns them into editable canvas objects, and the server-side Agent API can call a domestic LLM without exposing model keys in the browser.

## Scripts

- `npm run dev`: start the Vite dev server.
- `npm run api:dev`: start the local Agent API on `127.0.0.1:3000`.
- `npm run api:start`: start the Agent API process for VPS production.
- `npm run build`: type-check and build the frontend.
- `npm run lint`: run ESLint.
- `npm run preview`: preview the production build.
- `npm run test`: run unit tests.
- `npm run test:e2e`: run the Playwright MVP browser flow. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when using a locally installed Chromium build.
- `npm run verify:mvp`: run the MVP acceptance gate in a safe order: unit tests, API tests, lint, build, then E2E.

Run `npm run verify:mvp` for final local acceptance. It runs `npm run build` before `npm run test:e2e` because both commands write to `dist`; running them in parallel can create false E2E failures.

Run `npm run test:e2e` separately from `npm run build`; both commands write to `dist`.

## Demo Flow

1. Start the app with `npm run dev`.
2. Use the text compatibility input if browser STT is unavailable.
3. Enter `画一个用户注册登录流程图`.
4. Review the pending plan.
5. Execute the plan and confirm that the canvas item count, status bar, and command log update.
6. Run `npm run test:e2e` to verify the same MVP flow in Chromium through DOM and ProjectState JSON assertions.

See [docs/DESIGN.md](docs/DESIGN.md) for the planned capabilities, implemented capabilities, unfinished items, browser/STT limitations, and deployment notes.

For local LLM testing, run the API and frontend in separate terminals:

```bash
npm run api:dev
npm run dev
```

Vite proxies `/api/*` to `http://127.0.0.1:3000`. In production, Nginx should serve the static frontend and reverse proxy `/api/*` to the same local Agent API process.

Copy `.env.example` to a local `.env` or configure equivalent process environment variables on the VPS. `DEEPSEEK_API_KEY` is server-side only and must not be added to frontend code.

See [VPS deployment guide](docs/deployment/vps-nginx.md) for the `040415.xyz` production shape. See [Serverless compatibility notes](docs/deployment/serverless-compatibility.md) for the future API Gateway and cloud function migration path.

## Current Status

This branch contains the runnable frontend foundation plus a VPS-ready Agent API proxy. The API exposes `GET /api/health` and `POST /api/agent/plan`; failed or missing model configuration returns typed errors so the frontend can fall back to local templates.

## Dependencies

- React and React DOM: render the frontend application.
- Fabric.js: power the interactive canvas surface and future ProjectState rendering.
- @dagrejs/dagre: compute automatic directed graph layouts for flowcharts and architecture diagrams.
- d3-hierarchy: compute tree layouts for mind maps and parent-child diagrams.
- Express: host the `/api/health` and `/api/agent/plan` routes on the VPS or local development machine.
- cors: allow the local frontend and Agent API to communicate during development.
- tsx: run the TypeScript Agent API entrypoint without a separate server build step.
- @types/d3-hierarchy: provide TypeScript declarations for the mind map layout adapter.
- @types/express and @types/cors: provide TypeScript declarations for the Agent API proxy.
- Vite: local development server and production build.
- ESLint and TypeScript ESLint: lint TypeScript and React source.
- Vitest and jsdom: run browser-like unit tests for state, command, and interaction modules.
- Playwright Test: run browser-level MVP acceptance flows without pixel assertions.

## PR Requirements

Each PR should implement one feature. PR descriptions should include:

- 功能描述
- 实现思路
- 测试方式

If a PR adds a third-party dependency, list it in this README and explain what part of the project uses it.
