# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Voice Canvas MVP Delivery Rules

This project is expected to become a complete AI voice drawing MVP, not a toy-scale demo.

Before implementation starts:
- Keep planning and coding separate. Do not start goal mode or code changes until the current plan has been reviewed and approved by the user.
- Use `D:\Project\voice-canvas\DESIGN.md` as the visual design reference for the app shell and UI polish.
- Use the MVP design spec and PR roadmap under `docs/superpowers/` as the implementation contract.

During goal-mode implementation:
- Work through small PRs. Each PR should implement or modify one feature only.
- If a feature feels large, split it into smaller PRs before coding.
- Start each PR from a branch named `codex/<short-feature-name>`.
- Push each branch to GitHub and open a PR when the PR is ready.
- Target GitHub repository: `https://github.com/qinghe-zy/game-asset-generator.git`.
- If the local `origin` remote is missing, add it. If it points somewhere else, stop and ask before changing it.

Every PR must include:
- A clear one-sentence title.
- 功能描述: what changed and how a user or reviewer can use it.
- 实现思路: the core technical approach and important tradeoffs.
- 测试方式: exact commands and manual checks used.
- Dependency notes in `README.md` when adding any third-party library or framework.
- A note in the PR description when reusing code from previous personal work.

Every PR must pass these gates before merge:
- Automated checks listed for that PR.
- Manual acceptance for the changed behavior, not only unit tests.
- A self-review of `git diff` for scope creep, unrelated churn, missing docs, and missing tests.
- Main branch remains runnable and demo-ready after merge.

Avoid:
- Empty PR descriptions.
- PR descriptions that do not match the diff.
- Bundling unrelated features into one PR.
- Claiming a capability is implemented before it is actually verified.
- Letting the project degrade into a toy demo that only draws trivial shapes.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
