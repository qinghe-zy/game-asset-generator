# Voice Canvas

Voice Canvas is an AI voice drawing tool. The MVP focuses on a voice-first structured canvas: users speak drawing goals, the app turns them into editable canvas objects, and later PRs add Agent planning, layout, voice orchestration, and Serverless model access.

## Scripts

- `npm run dev`: start the Vite dev server.
- `npm run build`: type-check and build the frontend.
- `npm run lint`: run ESLint.
- `npm run preview`: preview the production build.
- `npm run test`: run unit tests.

## Current Status

This branch contains the runnable frontend foundation. The implementation is intentionally split into small PRs so the main branch stays runnable after every merge.

## Dependencies

- React and React DOM: render the frontend application.
- @dagrejs/dagre: compute automatic directed graph layouts for flowcharts and architecture diagrams.
- Vite: local development server and production build.
- ESLint and TypeScript ESLint: lint TypeScript and React source.
- Vitest and jsdom: run browser-like unit tests for state, command, and interaction modules.

## PR Requirements

Each PR should implement one feature. PR descriptions should include:

- 功能描述
- 实现思路
- 测试方式

If a PR adds a third-party dependency, list it in this README and explain what part of the project uses it.
