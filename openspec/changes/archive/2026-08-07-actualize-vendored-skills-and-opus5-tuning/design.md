## Context

The pack vendors 10 Superpowers skills as a committed snapshot via
`scripts/vendor-superpowers.mjs`, pinned to `5.1.0`. Upstream is at `6.2.0`;
spot-diffing `brainstorming`, `test-driven-development`,
`requesting-code-review`, `subagent-driven-development`, and
`verification-before-completion` against the pinned copies shows no skill
renames or removed cross-references, only internal trims (shorter narration,
fewer "why this matters" rationalization sections) — the kind of tuning
Anthropic's Claude Opus 5 prompting guide recommends. Separately, this pack's
own first-party content — `skills/spec-driven-tdd/SKILL.md` and the three root
context files — was written before that guidance existed and has two concrete
gaps: an open-ended subagent-delegation step, and no response-length
calibration anywhere in content injected every session via
`hooks/session-start`. Finally, `bin/cli.js` already has an `install` command
for deploying this pack itself, but nothing to bootstrap a *consuming*
project's own `AGENTS.md`/`CLAUDE.md`/`GEMINI.md` trio — teams end up
hand-copying the same content into three files.

## Goals / Non-Goals

**Goals:**
- Refresh vendored skill content to upstream `6.2.0` without hand-editing
  vendored text or breaking any skill name this pack references.
- Close the two concrete Opus-5-era gaps in this pack's own content
  (delegation threshold, conciseness note) without touching the
  `verification-before-completion` step in the Finish phase, which is core
  methodology rather than redundant self-check scaffolding.
- Ship a non-destructive `init-context` command for other projects to adopt
  the `AGENTS.md`-as-source-of-truth pattern that `bin/cli.js:copyInto` already
  supports via `verbatimSymlinks: true`.

**Non-Goals:**
- Restructuring this pack's *own* `CLAUDE.md`/`AGENTS.md`/`GEMINI.md` into a
  symlink trio — explicitly deferred; they stay three real files with
  duplicated content for now.
- Hand-editing any vendored skill's prose — only the version pin changes.
- Any change to `skills/spec-driven-tdd/SKILL.md` step 4.1
  (`verification-before-completion` in Finish) — out of scope by decision.

## Decisions

**Vendor bump is a pin change + regen, not a rewrite.** Bump `VERSION` in
`scripts/vendor-superpowers.mjs` from `'5.1.0'` to `'6.2.0'`, then run
`npm run vendor:superpowers`. The script already replaces each skill directory
wholesale (`fs.rmSync` + `fs.cpSync` recursive) and prepends the provenance
prefix, so the only manual edit is the version constant. Alternative
considered: hand-porting individual upstream trims into the pinned 5.1.0
copies — rejected because it diverges from a reproducible upstream tag and
defeats the point of vendoring via script.

**Delegation threshold lives in `spec-driven-tdd/SKILL.md`, not in the
vendored `subagent-driven-development` skill itself.** The threshold is
specific to how *this pack's* orchestrator decides whether to enter that
optional mode; the vendored skill describes how to execute the mode once
chosen. Editing the vendored copy would be overwritten on the next
`vendor:superpowers` run and duplicates the "don't hand-edit vendored text"
rule above.

**Conciseness note is duplicated verbatim into `CLAUDE.md`, `AGENTS.md`, and
`GEMINI.md`** rather than factored into one file, per the explicit decision to
keep this pack's own context files as three separate files (see Non-Goals).
The three copies must stay byte-identical for that one instruction; nothing
enforces this automatically, so a one-line comment convention isn't warranted
for a single sentence but future edits should keep the wording synced by hand.

**`init-context` template is intentionally minimal and generic.** It contains
only a heading (the target directory's basename) and one line explaining the
symlink arrangement — no spec-driven-tdd-specific or example-project-specific
content, so the command is useful to any project regardless of whether it
adopts this pack. Alternative considered: shipping a fuller starter template
(commands/conventions sections) — rejected per explicit decision to keep the
first version minimal; can be extended later without a breaking change since
the command never overwrites an existing file.

**`init-context` never overwrites.** For each of `AGENTS.md`, `CLAUDE.md`,
`GEMINI.md`, the command checks existence with `fs.existsSync` (which follows
symlinks — a dangling symlink still counts as "exists" for `fs.lstatSync`, so
use `fs.lstatSync`/catch-ENOENT semantics to also treat an existing symlink to
a missing target as "exists, skip") before creating anything, and prints
`skipped: <name> already exists` rather than prompting or erasing. This
mirrors the general safety default (never destructive without confirmation)
and needs no `--force` escape hatch for a first version, since re-running the
command after manually fixing one file is enough to fill in the rest.

## Risks / Trade-offs

- **Upstream 6.2.0 could still surprise us in files not spot-diffed** (the
  spot-diff covered 5 of 10 vendored skills) → mitigation: after regenerating,
  run the full `npm test` suite (`tests/test-vendor.sh`,
  `tests/test-skills-structure.sh`, `tests/test-skill-frontmatter.sh` already
  assert structural invariants) and re-check for any `superpowers:<name>`
  cross-reference to a skill outside the vendored set — the script's own
  dangling-reference detector in `SUPERPOWERS-NOTICE.md` output surfaces this.
- **Duplicated conciseness note across 3 files can drift** → mitigation:
  accepted trade-off per Non-Goals; the sentence is short and low-churn.
- **`init-context`'s relative symlinks break if the command is ever run with
  a `--dir` pointing somewhere the relative target can't resolve** (e.g. a
  network filesystem quirk) → mitigation: symlink target is a bare filename
  (`AGENTS.md`), created in the same directory as the link, so relative
  resolution is always same-directory and does not depend on `--dir`'s value.

## Migration Plan

Implemented as a single OpenSpec change on this repo directly (no consuming
projects are affected until they choose to run `npm run vendor:superpowers`
themselves or install a newer version of this pack). No rollback tooling
needed beyond normal git revert; the vendor regen is idempotent and
re-runnable.
