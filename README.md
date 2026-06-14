# Voice Canvas

Voice Canvas is an AI voice drawing tool. The MVP focuses on a voice-first structured canvas: users speak drawing goals, the app turns them into editable canvas objects, and later PRs add Agent planning, layout, voice orchestration, and Serverless model access.

## Scripts

- `npm run dev`: start the Vite dev server.
- `npm run build`: type-check and build the frontend.
- `npm run lint`: run ESLint.
- `npm run preview`: preview the production build.
- `npm run test`: run unit tests.
- `npm run test:e2e`: run the Playwright MVP browser flow. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when using a locally installed Chromium build.

Run `npm run test:e2e` separately from `npm run build`; both commands write to `dist`.

## Demo Flow

1. Start the app with `npm run dev`.
2. Use the text compatibility input if browser STT is unavailable.
3. Enter `画一个用户注册登录流程图`.
4. Review the pending plan.
5. Execute the plan and confirm that the canvas item count, status bar, and command log update.
6. Run `npm run test:e2e` to verify the same MVP flow in Chromium through DOM and ProjectState JSON assertions.

See [docs/DESIGN.md](docs/DESIGN.md) for the planned capabilities, implemented capabilities, unfinished items, browser/STT limitations, and deployment notes.

## Current Status

This branch contains the runnable frontend foundation. The implementation is intentionally split into small PRs so the main branch stays runnable after every merge.

## Dependencies

- React and React DOM: render the frontend application.
- Fabric.js: power the interactive canvas surface and future ProjectState rendering.
- @dagrejs/dagre: compute automatic directed graph layouts for flowcharts and architecture diagrams.
- d3-hierarchy: compute tree layouts for mind maps and parent-child diagrams.
- @types/d3-hierarchy: provide TypeScript declarations for the mind map layout adapter.
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
