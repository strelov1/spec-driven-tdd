# Vendor Superpowers skills into the pack

**Status:** Design approved — pending spec review
**Date:** 2026-06-11

## Problem

`spec-driven-tdd` depends on Superpowers for its execution discipline (TDD,
debugging, code review, worktrees, verification, finishing). Superpowers ships
**only** through the Claude Code plugin marketplace — there is no npm package and
no way to install it on Codex, Gemini, or opencode. On those harnesses the
orchestrator hits a hard stop on the first step that needs TDD or review.

**Goal:** make the lifecycle actually executable outside Claude by carrying the
referenced Superpowers skills inside this pack — the same model already used for
the bundled `simplify` skill.

## Constraints & findings

- **License is permissive.** Superpowers is MIT (© 2025 Jesse Vincent). MIT
  allows copy/modify/distribute provided the copyright notice and license text
  travel with the copies. Vendoring is legal; we MUST ship their `LICENSE`.
- **Portable text ≠ portable behavior.** Some skills depend on Claude-Code
  runtime primitives that other harnesses lack:
  - `subagent-driven-development`, `dispatching-parallel-agents` — require
    Task/subagents. Vendored as text, but will not execute off Claude.
  - `using-git-worktrees` — Claude uses native worktree tools; elsewhere it must
    fall back to plain `git worktree`.
  - The rest (TDD, debugging, code-review, verification, finishing) are pure
    discipline and run anywhere.
- **npm dist excludes submodules.** The pack is distributed via npm `files`, and
  `npx install` does not fetch git submodules — so the vendored copy must be a
  committed snapshot, not a submodule or an install-time fetch.

## Scope — skills to vendor

The 10 Superpowers skills referenced by `skills/spec-driven-tdd/SKILL.md` and
`skills/using-spec-driven-tdd/SKILL.md`:

1. `test-driven-development`
2. `systematic-debugging`
3. `requesting-code-review`
4. `receiving-code-review`
5. `verification-before-completion`
6. `using-git-worktrees`
7. `finishing-a-development-branch`
8. `subagent-driven-development`
9. `dispatching-parallel-agents`
10. `brainstorming` (invoked by `/opsx:propose`)

Each is vendored as a **whole directory** (including `references/`,
`visual-companion.md`, etc.), not just its `SKILL.md`. Cross-references from a
vendored skill to a non-vendored Superpowers skill are checked during sync and
noted in `NOTICE.md` if any dangle.

**Pinned upstream version: `5.1.0`.**

## Design

### Repository layout

```
skills/
  spec-driven-tdd/
  using-spec-driven-tdd/
  simplify/
  vendor/
    superpowers/
      LICENSE          # MIT © Jesse Vincent — required by the license
      NOTICE.md        # upstream repo, pinned tag, how to re-sync, dangling refs
      .version         # "5.1.0"
      test-driven-development/
      systematic-debugging/
      requesting-code-review/
      receiving-code-review/
      verification-before-completion/
      using-git-worktrees/
      finishing-a-development-branch/
      subagent-driven-development/
      dispatching-parallel-agents/
      brainstorming/
```

### Sync script — `scripts/vendor-superpowers.mjs`

Reproducible source of the snapshot. Responsibilities:

1. Download the upstream tarball for the pinned tag (default `5.1.0`), not a
   submodule — keeps npm distribution self-contained.
2. Extract only the 10 listed skill directories plus `LICENSE`.
3. Write them into `skills/vendor/superpowers/`, replacing prior contents.
4. Write `.version` and refresh `NOTICE.md`.
5. Report any cross-reference from a vendored skill to a skill not in the set.

The script's output is **committed** to the repo and included in npm `files`.
Updating = re-run with a new tag. (One-time decision: pinned, not `latest`.)

### Installer — vendored-as-fallback

Reuse the existing `superpowersPresent()` detection in `bin/cli.js`:

- Superpowers detected (Claude w/ marketplace plugin) → **skip** vendored copy;
  the native version is authoritative, avoiding a duplicate-name skill set that
  could drift from upstream.
- Not detected (Codex / Gemini / opencode, or Claude without the plugin) →
  **deploy** `skills/vendor/superpowers/*` into the install target's `skills/`.

This single rule satisfies both "works off Claude" and, incidentally, removes
the separate `/plugin install` step when Superpowers is absent on Claude.

`reportDeps()` updates: when the vendored fallback is deployed, Superpowers
reports `OK (vendored fallback)` instead of `!!`.

Implementation notes:

- `PAYLOAD`/`copyInto` currently copy `skills/` wholesale. `skills/vendor/` must
  NOT be copied unconditionally — it is deployed conditionally and into the
  target's top-level `skills/`, flattened (so the harness discovers
  `skills/test-driven-development/`, not `skills/vendor/superpowers/...`).
- Detection runs before the conditional deploy; keep it a pure function so the
  `doctor` command can report the same result without mutating anything.

### Honest degradation

`docs/dependencies.md` gains a per-harness capability table:

| Capability | Claude | Codex / Gemini / opencode |
|---|---|---|
| TDD, debugging, code-review, verification, finishing | full | full (vendored) |
| git worktrees | native tools | plain `git worktree` fallback |
| subagent / parallel modes | full | unavailable — orchestrator must say so |

The orchestrator continues to **announce and stop** rather than silently skip a
step whose runtime capability is missing.

### Documentation & tests

- Update `docs/dependencies.md`, `docs/installation.md`,
  `docs/supported-tools.md` to describe the vendored fallback and the pinned
  version.
- Add MIT attribution for Superpowers to the repo (NOTICE / README section).
- Extend `tests/test-skills-structure.sh`: vendored skills present, `LICENSE`
  and `.version` exist, `.version` matches the pin.
- Extend `tests/test-install.sh`: with Superpowers absent, install deploys the
  flattened vendored skills and `reportDeps()` shows the fallback; with it
  present, vendored is skipped.

## Non-goals

- Auto-updating the snapshot (manual re-sync only).
- Vendoring all 14 upstream skills — only the 10 the orchestrator references.
- Making subagent/parallel modes work off Claude — those degrade by design.
