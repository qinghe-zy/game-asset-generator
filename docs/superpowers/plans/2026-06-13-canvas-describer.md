# CanvasDescriber Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce compact ProjectState summaries for multi-turn Agent context without sending full canvas JSON.

**Architecture:** Add a pure `CanvasDescriber` in `src/agent` that reads ProjectState and returns a small structured summary containing counts, groups, selected IDs, recent changes, and connector relations. It excludes precise coordinates, full styles, and Fabric internals.

**Tech Stack:** TypeScript, Vitest, existing ProjectState and CanvasElement types.

---

## File Structure

- Create `src/agent/CanvasDescriber.ts`: summary types and `describeCanvas` implementation.
- Create `src/agent/CanvasDescriber.test.ts`: tests for grouped nodes, relations, selected/recent IDs, and large-canvas truncation.

## Task 1: CanvasDescriber Summary

**Files:**
- Create: `src/agent/CanvasDescriber.ts`
- Create: `src/agent/CanvasDescriber.test.ts`

- [ ] **Step 1: Write failing describer tests**

Create `src/agent/CanvasDescriber.test.ts` with tests that:

- Include title, version, and element count.
- Summarize groups with child labels.
- Summarize connector relations by labels.
- Include selected IDs and recent changes from options.
- Exclude raw style and coordinate details.
- Limit node samples for a large canvas.

- [ ] **Step 2: Run describer tests to verify red**

Run:

```bash
npm run test -- src/agent/CanvasDescriber.test.ts
```

Expected: FAIL because `CanvasDescriber` does not exist.

- [ ] **Step 3: Implement CanvasDescriber**

Create `src/agent/CanvasDescriber.ts` with:

- `describeCanvas(state, options?)`
- summary interfaces for groups and relations
- `maxNodes` option defaulting to 25
- relation labels derived from connector `fromId` and `toId`
- no full `style`, `x`, `y`, `width`, or `height` in the returned summary

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm run test -- src/agent/CanvasDescriber.test.ts
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
git add src/agent/CanvasDescriber.ts src/agent/CanvasDescriber.test.ts docs/superpowers/plans/2026-06-13-canvas-describer.md
git commit -m "feat: add canvas describer summary"
```

## Self-Review

- Spec coverage: This plan covers B6 only. It does not call LLM, execute plans, or render canvas.
- Placeholder scan: No TODO/TBD placeholders remain.
- Type consistency: `describeCanvas`, `CanvasSummary`, group summary, and relation summary names are consistent across tasks.
