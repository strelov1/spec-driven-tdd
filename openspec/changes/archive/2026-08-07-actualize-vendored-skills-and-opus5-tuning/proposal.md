## Why

The vendored Superpowers skills are pinned to 5.1.0 while upstream is at 6.2.0;
the newer snapshot already trims narration and over-verification boilerplate in
ways that match Anthropic's Claude Opus 5 prompting guidance, so refreshing the
pin is free, low-risk tuning. Separately, this pack's own first-party content
(the `spec-driven-tdd` orchestrator and its three context files) predates that
guidance and has two gaps worth closing directly: no explicit threshold for
when to delegate to subagents, and no response-length calibration. Finally,
projects that install this pack currently have no supported way to bootstrap a
shared `AGENTS.md` with `CLAUDE.md`/`GEMINI.md` symlinked to it — every install
duplicates the same content across three files by hand.

## What Changes

- Bump the vendored Superpowers pin from `5.1.0` to `6.2.0` in
  `scripts/vendor-superpowers.mjs` and re-run `npm run vendor:superpowers`. No
  vendored skill is hand-edited; the regenerated snapshot replaces the tree as
  the script already does.
- Add an explicit delegation threshold to the "Optional mode — large changes"
  step of `skills/spec-driven-tdd/SKILL.md`, so subagent/parallel modes are
  used only for genuinely large, independent task sets rather than by default.
- Add an identical short conciseness instruction to `CLAUDE.md`, `AGENTS.md`,
  and `GEMINI.md` at the repo root (the pack's own context files, injected via
  `hooks/session-start`).
- Add a new `init-context` subcommand to `bin/cli.js` that bootstraps a target
  project's `AGENTS.md` (minimal generic scaffold, created only if missing) and
  symlinks `CLAUDE.md` and `GEMINI.md` to it (created only if missing). Never
  overwrites an existing file or symlink.

## Capabilities

### New Capabilities
- `opus5-prompting-tuning`: explicit subagent-delegation threshold in the
  `spec-driven-tdd` orchestrator skill, plus a shared conciseness instruction
  across the pack's three context files.
- `context-file-bootstrap`: `init-context` CLI command that scaffolds
  `AGENTS.md` and symlinks `CLAUDE.md`/`GEMINI.md` to it in a target project,
  non-destructively.

### Modified Capabilities
- `skill-distribution`: the vendored-skill provenance scenario currently
  hardcodes `[Superpowers 5.1.0, MIT]`; the pinned version changes to 6.2.0.

## Impact

- `scripts/vendor-superpowers.mjs` (version constant)
- `skills/` (regenerated vendored skill snapshot — 10 directories, content only)
- `skills/spec-driven-tdd/SKILL.md`
- `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`
- `bin/cli.js` (new subcommand)
- `docs/installation.md` (mention the new command)
- `tests/` (new `test-init-context.sh`)
- `openspec/specs/skill-distribution/spec.md` (provenance version)
