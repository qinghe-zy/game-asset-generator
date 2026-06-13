# Local Template Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local template Agent that turns common Chinese drawing requests into useful `AgentPlan` objects without calling an LLM.

**Architecture:** The Agent stays inside `src/agent` and returns validated plan-shaped data only. It recognizes broad prompt families, emits logical create operations and connectors, and leaves coordinate calculation and command execution to later PRs.

**Tech Stack:** TypeScript, Vitest, existing `AgentPlan` and `PlanValidator` contracts.

---

### Task 1: Add LocalTemplateAgent tests

**Files:**
- Create: `src/agent/LocalTemplateAgent.test.ts`

- [x] **Step 1: Write failing coverage for the supported prompt families**

Add tests that call `createLocalTemplatePlan(input)` and assert:
- flowchart prompts create sequential nodes and connectors with `layoutIntent.type === 'flow'`.
- architecture prompts create grouped frontend/backend/data areas and cross-layer connectors.
- mind map prompts create a root and topic branches with `layoutIntent.type === 'mindmap'`.
- entertainment planning prompts create a non-trivial party/travel planning map rather than a single shape.
- unknown prompts still return a useful fallback plan with a `fallbackReason`.
- every generated plan passes `validateAgentPlan`.

- [x] **Step 2: Run the tests and confirm RED**

Run:

```bash
npm run test -- src/agent/LocalTemplateAgent.test.ts
```

Expected: FAIL because `src/agent/LocalTemplateAgent.ts` does not exist yet.

### Task 2: Implement LocalTemplateAgent

**Files:**
- Create: `src/agent/LocalTemplateAgent.ts`

- [x] **Step 1: Add the public API**

Create:

```ts
export interface LocalTemplatePlanInput {
  prompt: string
}

export function createLocalTemplatePlan(input: string | LocalTemplatePlanInput): AgentPlan
```

Normalize whitespace and lowercase matching text before routing templates.

- [x] **Step 2: Add focused templates**

Implement template builders for:
- flowchart: registration/login/process requests.
- architecture: frontend/backend/database/service/system requests.
- mind map: mind map/brainstorm/topic requests.
- story map: story/plot/script/user journey requests.
- relationship map: relationship/stakeholder/persona/ecosystem requests.
- planning map: party/travel/event/game/activity requests.

Each template should emit multiple `create-shape` operations plus meaningful `create-connector` operations, set `requiresConfirmation: true`, and include a human-readable `summary`, `speechFeedback`, and `fallbackReason`.

- [x] **Step 3: Keep IDs deterministic and safe**

Use a small slug helper so generated operation IDs and element IDs are stable across tests and do not contain spaces or punctuation.

- [x] **Step 4: Run focused tests and confirm GREEN**

Run:

```bash
npm run test -- src/agent/LocalTemplateAgent.test.ts
```

Expected: PASS.

### Task 3: PR verification

**Files:**
- Review: `src/agent/LocalTemplateAgent.ts`
- Review: `src/agent/LocalTemplateAgent.test.ts`
- Review: this plan document

- [x] **Step 1: Run complete automated checks**

Run:

```bash
npm run test
npm run build
npm run lint
```

- [x] **Step 2: Run review and safety checks**

Run:

```bash
git diff --check
rg -n -e "api[_-]?key" -e "secret" -e "token" -e "password" -e "Authorization" -e "Bearer" -e "sk-" docs src package.json README.md AGENTS.md index.html
```

Review the diff for scope creep. This PR should not wire UI, execute commands, add network calls, or introduce dependencies.

- [ ] **Step 3: Commit, push, and open PR**

Commit:

```bash
git add docs/superpowers/plans/2026-06-13-local-template-agent.md src/agent/LocalTemplateAgent.ts src/agent/LocalTemplateAgent.test.ts
git commit -m "feat: add local template agent"
git push -u origin codex/voice-canvas-local-template-agent
```

Open a PR with:
- `## 功能描述`
- `## 实现思路`
- `## 测试方式`

Mention that no third-party dependency was added and no previous personal code was reused.
