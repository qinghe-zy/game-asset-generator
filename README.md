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

For local LLM testing, run the API and frontend in separate terminals:

```bash
npm run api:dev
npm run dev
```

Vite proxies `/api/*` to `http://127.0.0.1:3000`. In production, Nginx should serve the static frontend and reverse proxy `/api/*` to the same local Agent API process.

Copy `.env.example` to a local `.env` or configure equivalent process environment variables on the VPS. `DEEPSEEK_API_KEY` is server-side only and must not be added to frontend code.

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

## PR Requirements

Each PR should implement one feature. PR descriptions should include:

- 功能描述
- 实现思路
- 测试方式

If a PR adds a third-party dependency, list it in this README and explain what part of the project uses it.
