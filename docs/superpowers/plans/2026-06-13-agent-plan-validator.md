# AgentPlan Validator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the AgentPlan contract and validate malformed or unsafe plans before they can reach command execution.

**Architecture:** Add a small `src/agent` boundary with pure TypeScript types and a validator that returns normalized plans or human-readable validation errors. The validator does not call an LLM, mutate ProjectState, or execute commands.

**Tech Stack:** TypeScript, Vitest, existing ProjectState element IDs.

---

## File Structure

- Create `src/agent/AgentPlan.ts`: shared plan, operation, and layout intent types.
- Create `src/agent/PlanValidator.ts`: pure validation and normalization helpers.
- Create `src/agent/PlanValidator.test.ts`: failing-first tests for operation limits, references, destructive confirmation, and optional field normalization.

## Task 1: AgentPlan Types and Validator

**Files:**
- Create: `src/agent/AgentPlan.ts`
- Create: `src/agent/PlanValidator.ts`
- Create: `src/agent/PlanValidator.test.ts`

- [ ] **Step 1: Write failing validator tests**

Create `src/agent/PlanValidator.test.ts` with tests that:

- Accept a valid create/update/connect plan and normalize missing `riskFlags`.
- Reject duplicate operation IDs.
- Reject connectors that reference missing created or existing element IDs.
- Reject destructive delete operations when `requiresConfirmation` is false.
- Reject plans with more than 40 operations.

- [ ] **Step 2: Run validator tests to verify red**

Run:

```bash
npm run test -- src/agent/PlanValidator.test.ts
```

Expected: FAIL because `PlanValidator` and `AgentPlan` modules do not exist.

- [ ] **Step 3: Implement AgentPlan types**

Create `src/agent/AgentPlan.ts` with:

- `AgentPlan`
- `PlanOperation`
- `LayoutIntent`
- operation variants for create shape/text/group/connector, update style, move element, delete element, and relayout region.

- [ ] **Step 4: Implement PlanValidator**

Create `src/agent/PlanValidator.ts` with:

- `validateAgentPlan(plan, context?)`
- `isValidationOk(result)`
- explicit `MAX_PLAN_OPERATIONS = 40`
- operation ID uniqueness validation
- created/existing element reference validation
- destructive confirmation validation
- normalization for `riskFlags`, `fallbackReason`, and `layoutIntent`.

- [ ] **Step 5: Run targeted tests**

Run:

```bash
npm run test -- src/agent/PlanValidator.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run full checks**

Run:

```bash
npm run test
npm run build
npm run lint
```

Expected: all pass.

- [ ] **Step 7: Review and commit**

Review:

```bash
git diff
git status --short
```

Then commit:

```bash
git add src/agent/AgentPlan.ts src/agent/PlanValidator.ts src/agent/PlanValidator.test.ts docs/superpowers/plans/2026-06-13-agent-plan-validator.md
git commit -m "feat: add agent plan validator"
```

## Self-Review

- Spec coverage: This plan covers B4 only: AgentPlan types and validator. It does not implement local template agents, layout, command execution, or UI confirmation.
- Placeholder scan: No TODO/TBD placeholders remain.
- Type consistency: `AgentPlan`, `PlanOperation`, `LayoutIntent`, `validateAgentPlan`, and `MAX_PLAN_OPERATIONS` are named consistently across tasks.
