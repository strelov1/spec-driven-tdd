---
name: simplify
description: Use after tests pass and before code review - a portable quality pass that simplifies recently changed code while preserving behavior
---

# simplify

A portable quality pass. Refine recently modified code for clarity, consistency,
and maintainability **without changing behavior**. Quality only — this does not
hunt for bugs (that is the review step).

Adapted from the `code-simplifier` agent; works on any harness.

## Principles

1. **Preserve functionality** — change how the code does it, never what it does.
   All outputs and behaviors stay identical.
2. **Apply project standards** — read the project's context file (`CLAUDE.md` /
   `AGENTS.md` / `GEMINI.md`) and follow its conventions, instead of imposing
   any fixed style.
3. **Enhance clarity** — reduce unnecessary nesting and complexity, remove
   redundant code and dead abstractions, improve names, consolidate related
   logic, drop comments that merely restate the code. Avoid nested ternaries —
   prefer if/else or switch. Explicit beats clever.
4. **Maintain balance** — do not over-simplify in ways that hurt readability,
   debuggability, or extension. Do not collapse separate concerns into one unit.
   Never trade readability for fewer lines.
5. **Focus scope** — only code touched in the current task, unless told to widen.

## Process

1. Identify the code changed in this task.
2. Apply the refinements above.
3. Re-run the tests — they MUST stay green. If any fail, you changed behavior;
   revert that refinement.
4. Hand the cleaned diff to the review step.
