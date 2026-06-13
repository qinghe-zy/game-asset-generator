# EntityResolver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve spoken or typed entity references to concrete ProjectState element IDs using deterministic local scoring.

**Architecture:** Add a pure `EntityResolver` in `src/commands` that reads ProjectState plus optional interaction context and returns `resolved`, `ambiguous`, or `missing`. It does not call an LLM, mutate state, or execute commands.

**Tech Stack:** TypeScript, Vitest, existing ProjectState and CanvasElement types.

---

## File Structure

- Create `src/commands/EntityResolver.ts`: scoring logic and result types.
- Create `src/commands/EntityResolver.test.ts`: tests for exact labels, aliases, selected/recent/viewport weighting, ambiguity, and missing results.

## Task 1: EntityResolver Scoring

**Files:**
- Create: `src/commands/EntityResolver.ts`
- Create: `src/commands/EntityResolver.test.ts`

- [ ] **Step 1: Write failing resolver tests**

Create `src/commands/EntityResolver.test.ts` with tests that:

- Resolve an exact label match.
- Resolve an alias match.
- Prefer a selected element when the query is generic.
- Prefer a recent element when candidates otherwise match.
- Prefer a visible viewport element over an offscreen candidate.
- Return `ambiguous` when top candidates are too close.
- Return `missing` when no candidate scores.

- [ ] **Step 2: Run resolver tests to verify red**

Run:

```bash
npm run test -- src/commands/EntityResolver.test.ts
```

Expected: FAIL because `EntityResolver` does not exist.

- [ ] **Step 3: Implement EntityResolver**

Create `src/commands/EntityResolver.ts` with:

- `resolveEntity(query, state, context?)`
- `EntityResolutionResult`
- scoring for exact label/id, alias, generic kind words, selected IDs, recent IDs, and viewport intersection
- an ambiguity margin of 10 points

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm run test -- src/commands/EntityResolver.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full checks**

Run:

```bash
npm run test
npm run build
npm run lint
```

Expected: all pass.

- [ ] **Step 6: Review and commit**

Review:

```bash
git diff
git status --short
```

Then commit:

```bash
git add src/commands/EntityResolver.ts src/commands/EntityResolver.test.ts docs/superpowers/plans/2026-06-13-entity-resolver.md
git commit -m "feat: add entity resolver scoring"
```

## Self-Review

- Spec coverage: This plan covers B5 only. It does not parse commands, call LLM, ask clarification in UI, or execute destructive actions.
- Placeholder scan: No TODO/TBD placeholders remain.
- Type consistency: `resolveEntity`, `EntityResolutionResult`, and context property names are consistent across the test and implementation tasks.
