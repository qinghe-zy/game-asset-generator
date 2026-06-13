# Phase D Renderer Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record Phase D canvas renderer acceptance evidence before moving into the local Agent and execution pipeline.

**Architecture:** This is a docs-only acceptance PR. It does not change runtime code. It gathers automated, browser, debug-state, and safety evidence for the completed renderer phase: Fabric canvas shell, shape/text rendering, logical groups, connectors, and debug ProjectState exposure.

**Tech Stack:** Markdown, npm scripts, Vite dev server, Edge headless smoke via Playwright.

---

## Scope

This PR implements the Phase D module acceptance checkpoint from the MVP roadmap:

- Create `docs/qa/phase-d-renderer-acceptance.md`.
- Create this micro-plan.

This PR does not add renderer features, alter UI, change dependencies, or modify tests.

## Task 1: Run Acceptance Checks

- [ ] **Step 1: Run canvas-focused automated tests**

```bash
npm run test -- src/canvas
```

Expected: PASS.

- [ ] **Step 2: Run full automated gate**

```bash
npm run test
npm run build
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 3: Run browser smoke**

Start Vite on `127.0.0.1:5177`, then use Edge headless to confirm:

- canvas region exists.
- Fabric upper canvas exists.
- `window.getProjectState()` exists in dev.
- returned ProjectState has 5 elements.
- group `demo-group` exists.
- connector `voice-to-plan` exists.
- connector region has non-white pixels.
- console errors are 0.

## Task 2: Write Acceptance Record

- [ ] **Step 1: Create `docs/qa/phase-d-renderer-acceptance.md`**

The document must include:

- Scope and date.
- Automated checks and exact pass counts.
- Browser smoke evidence.
- Current renderer capabilities.
- Deferred capabilities.
- Safety and testing notes.

- [ ] **Step 2: Review the record against the roadmap**

Verify it covers:

- Canvas renders non-trivial demo state.
- Groups are global-coordinate rectangles, not Fabric Group.
- Connectors render from relationships.
- Debug ProjectState is available for future E2E.
- No pixel-perfect screenshot testing is introduced.

## Task 3: PR Quality Gate

- [ ] **Step 1: Run final checks**

```bash
npm run test -- src/canvas
npm run test
npm run build
npm run lint
git diff --check
rg -n -e "fabric\.Group" -e "new\s+Group" -e "from 'fabric'.*Group" -e 'from "fabric".*Group' src
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md index.html
```

Expected:

- Automated checks pass.
- No Fabric Group usage appears.
- Secret scan finds no real credentials.

## Task 4: Commit, Push, and Open PR

- [ ] **Step 1: Stage and commit**

```bash
git add docs/superpowers/plans/2026-06-13-phase-d-renderer-acceptance.md docs/qa/phase-d-renderer-acceptance.md
git commit -m "docs: record phase d renderer acceptance"
```

- [ ] **Step 2: Push branch**

```bash
git push -u origin codex/voice-canvas-phase-d-acceptance
```

- [ ] **Step 3: Open GitHub PR**

Use title:

```text
docs: record phase d renderer acceptance
```

Use body:

```markdown
## 功能描述

记录 Phase D canvas renderer 阶段验收结果，确认当前 main 已具备真实 Fabric canvas、shape/text、logical group、connector 和 dev-only ProjectState debug getter，为后续 Phase E 的本地 Agent 执行链路提供可审查基础。

## 实现思路

这是 docs-only PR，不改运行时代码。文档汇总了 canvas-focused 测试、全量测试、build/lint、浏览器 smoke、debug ProjectState 检查、安全扫描和已知延后项，避免把阶段验收和下一阶段功能混在同一个 PR。

## 测试方式

- `npm run test -- src/canvas`
- `npm run test`
- `npm run build`
- `npm run lint`
- Edge headless browser smoke：确认 canvas/Fabric upper canvas、`window.getProjectState()`、group/connector JSON、connector 区域绘制和 console errors 为 0。
- `git diff --check`
- Fabric Group scan
- secret scan

本 PR 没有新增第三方依赖。
```

- [ ] **Step 4: Confirm PR status**

```bash
gh pr view --json number,state,mergeStateStatus,isDraft,headRefName,baseRefName,url,title
```

Expected: PR is open against `main` and not draft.

## Self-Review

- Spec coverage: Phase D acceptance is recorded before starting Phase E.
- Boundary check: docs-only; no runtime code changes.
- Safety: no secrets, no dependency changes, no false claims about unfinished features.
