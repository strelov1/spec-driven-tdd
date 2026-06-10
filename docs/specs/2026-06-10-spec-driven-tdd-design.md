# spec-driven-tdd — Design

Date: 2026-06-10
Status: Approved for planning

## Summary

`spec-driven-tdd` is an installable, multi-harness skill-pack (modeled on the
Superpowers plugin) that fuses two existing systems into one disciplined
delivery loop:

- **OpenSpec** owns *planning* and *task tracking* — the durable source of truth
  for "what" and the per-task checklist.
- **Superpowers** (plus Claude Code's built-in `/simplify` and `/code-review`)
  owns *execution discipline* — TDD, simplification, code review, debugging,
  and branch finishing.

The pack does **not** reimplement either system. It is a thin orchestrator that
defines how the existing skills and commands interlock, and packages that
orchestration so it auto-loads at session start across multiple agent harnesses.

## Motivation

OpenSpec's `apply` loop (see `OpenSpec` `apply.md`, step 6) is literally
"make the code changes required … mark task `[x]`" — it has **no test
discipline and no review gate**. Superpowers' `test-driven-development` and
`requesting-code-review` provide exactly that discipline, but have **no concept
of a change, a task list, or progress tracking**.

The gap is the seam between the two. This pack fills it: it wraps OpenSpec's
naked task loop so that between "take a task" and "mark it done", the work
passes through RED-GREEN-REFACTOR, simplification, and review.

This is the concrete, defined coexistence that Fission-AI/OpenSpec issue #780
discusses but leaves unbuilt.

## Goals

- Define a single, opinionated delivery lifecycle: plan (OpenSpec) → implement
  per-task (TDD + simplify + review) → finish + archive (OpenSpec).
- Package it as a Superpowers-style skill-pack: a SessionStart hook injects an
  entry skill that makes the workflow discoverable; the workflow skill is
  invoked on demand.
- Support multiple harnesses: Claude Code, Codex, Cursor, Gemini, opencode —
  same skills, per-harness manifests, context files, and hook output shapes.
- Degrade gracefully when a harness lacks a dependency (e.g. `/simplify` exists
  only in Claude Code).

## Non-goals

- Not reimplementing or vendoring OpenSpec or Superpowers content. The pack
  composes them; it depends on them being installed.
- Not modifying OpenSpec config/schema in this version. Encoding discipline as
  OpenSpec `config.yaml` per-artifact rules is a noted future seam, not part of
  this design.
- Not a marketplace submission. Distribution beyond local install is out of
  scope for now.

## Architecture

### Repository layout

```
spec-driven-tdd/
  .claude-plugin/plugin.json     Claude Code manifest
  .codex-plugin/plugin.json      Codex manifest
  .cursor-plugin/plugin.json     Cursor manifest
  .opencode/{INSTALL.md,plugins} opencode adapter
  gemini-extension.json          Gemini extension (contextFileName: GEMINI.md)
  CLAUDE.md  AGENTS.md  GEMINI.md per-harness context files
  hooks/
    hooks.json          SessionStart for Claude Code
    hooks-cursor.json   SessionStart for Cursor
    run-hook.cmd        polyglot wrapper (Windows cmd + Unix bash)
    session-start       reads entry skill, emits per-harness JSON context
  skills/
    using-spec-driven-tdd/SKILL.md   entry skill (injected by the hook)
    spec-driven-tdd/SKILL.md         the orchestrator workflow
  docs/
    workflow.md         the lifecycle in detail
    dependencies.md     what must be installed, and degradation rules
    installation.md     per-harness install steps
    supported-tools.md  harness support matrix
    specs/              design docs (this file)
  README.md  LICENSE  package.json
```

### Auto-load mechanism (mirrors Superpowers)

1. The harness fires its SessionStart hook, which runs
   `hooks/run-hook.cmd session-start`.
2. `run-hook.cmd` is a polyglot: `cmd.exe` runs the batch branch on Windows
   (locating Git-bash), `bash` runs the script branch on Unix.
3. `session-start` reads `skills/using-spec-driven-tdd/SKILL.md` and emits it as
   session context, JSON-shaped for the calling harness:
   - Claude Code: `hookSpecificOutput.additionalContext`
   - Cursor: `additional_context` (snake_case)
   - Copilot/SDK standard: top-level `additionalContext`
4. The entry skill is short: it tells the agent the workflow exists and when to
   invoke the full `spec-driven-tdd` skill.

### The orchestrated lifecycle

The `spec-driven-tdd` skill defines this loop and, at each step, **invokes the
existing skill/command** rather than reimplementing it.

| Phase | Delegates to | Interlock rule |
|-------|--------------|----------------|
| Plan | `/opsx:propose` (which itself uses `brainstorming`) | OpenSpec is the single source of truth for scope and the task list. |
| Implement (per task from `/opsx:apply`) | `test-driven-development` → simplify → bug-review | Mark `[x]` only after a clean review. RED before any production code. Unexpected failure → `systematic-debugging`. |
| Finish | `verification-before-completion` → `finishing-a-development-branch` → `/opsx:archive` + `/opsx:sync` | Tracking closes in OpenSpec. |

Per-task micro-cycle:

```
RED  → GREEN → REFACTOR (TDD, unit-local)
     → simplify (diff-wide quality, auto-applies)
     → re-run tests (must stay green)
     → bug review (correctness / requirements)
     → fix Critical + Important
     → only now mark task [x]
```

A task is "done" not at GREEN but after its review is clean. Review cadence is
**per task** (matching subagent-driven-development discipline).

### Cross-harness degradation

`/simplify` and `/code-review` are Claude Code built-ins; they do not exist on
Codex, Cursor, Gemini, or opencode. The design degrades:

- **Bug review (portable default):** Superpowers `requesting-code-review` — a
  normal skill available wherever Superpowers is installed.
- **On Claude Code (enhanced):** add `/simplify` as the quality pass and
  optionally `/code-review` for an additional built-in bug pass.
- **Where `/simplify` is absent:** the simplify step collapses into TDD's
  REFACTOR (unit-local cleanup), so the loop still holds.

The orchestrator detects/declares these dependencies and warns when one is
missing rather than failing silently.

### Dependencies

- **OpenSpec CLI** installed and a project initialized (`openspec/config.yaml`).
- **Superpowers** installed (provides `test-driven-development`,
  `requesting-code-review`, `systematic-debugging`,
  `verification-before-completion`, `finishing-a-development-branch`,
  `brainstorming`).
- **Claude Code only:** `/simplify`, `/code-review` (enhancements, not required).

Documented in `docs/dependencies.md`; surfaced by the orchestrator at runtime.

## Open questions (resolved)

- **Scope:** global / multi-project. ✓
- **Format:** full skill-pack (Superpowers-style). ✓
- **Harnesses:** all (Claude Code / Codex / Cursor / Gemini / opencode). ✓
- **Review cadence:** per task. ✓
- **Simplify placement:** inside each task, after GREEN, before that task's
  review (it applies edits, so it must precede the review it would otherwise
  invalidate). ✓
- **Name:** `spec-driven-tdd` (working name; changeable before scaffolding).

## Future seams (not built now)

- Encode discipline directly into OpenSpec `config.yaml` `tasks` rules
  (e.g. "each task begins with a failing test").
- Marketplace distribution / one-command install.
- A custom OpenSpec schema (`spec-driven-tdd`) alongside `spec-driven`.
