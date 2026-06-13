---
name: using-spec-driven-tdd
description: Entry point for the spec-driven-tdd workflow - invoke at the START of an OpenSpec change to load the delivery discipline and hand off to the spec-driven-tdd orchestrator before writing code
---

# Using spec-driven-tdd

You have the **spec-driven-tdd** workflow: plan and track in OpenSpec, implement
with Superpowers discipline (TDD, simplify, review), finish and archive.

## The rule

When you are about to implement an OpenSpec change — or the user asks to build,
apply, or work through a change — invoke the `spec-driven-tdd` skill BEFORE
writing code, and follow its steps rather than improvising.

If a 1% chance it applies, invoke it. Knowing the lifecycle is not the same as
following it.

## What it composes

- **Plan / track:** OpenSpec (`/opsx:propose`, `/opsx:apply`, `/opsx:archive`,
  `/opsx:sync`).
- **Execute:** Superpowers (`test-driven-development`, `requesting-code-review`,
  `receiving-code-review`, `systematic-debugging`, `using-git-worktrees`,
  `verification-before-completion`, `finishing-a-development-branch`) plus this
  pack's `simplify` skill.

Dependencies and graceful degradation: see `docs/dependencies.md`.

Invoke `spec-driven-tdd` now if you are starting implementation.
