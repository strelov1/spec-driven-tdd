---
name: spec-driven-tdd
description: The spec-driven-tdd delivery workflow (orchestrator) - runs the full lifecycle for an OpenSpec change: OpenSpec planning/tracking + Superpowers TDD, simplify, and code review. Invoked by using-spec-driven-tdd; run it once implementation starts
---

# spec-driven-tdd

Plan and track in OpenSpec. Implement with Superpowers discipline. One change at
a time, one task at a time.

**Core principle:** OpenSpec owns *what* and *progress*; the execution skills own
*how*. A task is done only after its review is clean — not at green tests.

## Dependencies

Requires OpenSpec CLI + Superpowers installed. If a referenced skill or command
is unavailable, say so and fall back per `docs/dependencies.md` — never silently
skip a step. `/code-review` is a Claude-Code-only optional enhancement.

## Lifecycle

### 1. Plan (OpenSpec)

If no change exists for the work, run `/opsx:propose` (it uses `brainstorming`
to shape scope, then writes proposal/design/tasks). OpenSpec is the single
source of truth for scope and the task list. Do not invent tasks outside it.

### 2. Isolate (worktree)

Before touching code, invoke `using-git-worktrees` to create an isolated
worktree for the change so the main workspace stays clean. (Pairs with
`finishing-a-development-branch` at the end.)

### 3. Implement — per-task loop

Get the task list and context via `/opsx:apply` (read every `contextFiles`
path). Then, for EACH pending task, run this micro-cycle:

1. **RED** — invoke `test-driven-development`: write a failing test first. No
   production code without a failing test.
2. **GREEN** — minimal code to pass. If a test fails unexpectedly, invoke
   `systematic-debugging` before guessing.
3. **REFACTOR** — unit-local cleanup under green tests.
4. **simplify** — invoke this pack's `simplify` skill for a diff-wide quality
   pass; it applies edits.
5. **Re-run tests** — they must stay green after simplify.
6. **Review** — invoke `requesting-code-review` on the task's diff; use
   `receiving-code-review` to act on it. On Claude Code you may additionally run
   `/code-review`. Fix Critical + Important before continuing.
7. **Mark done** — only now flip the task `- [ ]` → `- [x]` in the OpenSpec
   tasks file.

**Optional mode — large changes:** instead of the inline loop, invoke
`subagent-driven-development` to dispatch each task to a fresh subagent with
per-task review. Use `dispatching-parallel-agents` when tasks are independent.

Pause and ask if a task is ambiguous or implementation reveals a design issue
(then suggest updating the OpenSpec artifacts).

### 4. Finish

When all tasks are `[x]`:

1. `verification-before-completion` — confirm the change actually works.
2. `finishing-a-development-branch` — integrate the worktree's branch.
3. `/opsx:archive` then `/opsx:sync` — close tracking and update main specs.

## Checklist

- [ ] Change selected/created in OpenSpec
- [ ] Worktree created
- [ ] Every task ran RED→GREEN→REFACTOR→simplify→review before `[x]`
- [ ] All tasks `[x]`
- [ ] Verified, branch finished, change archived + synced
