## 1. Vendor bump

- [x] 1.1 Bump `VERSION` in `scripts/vendor-superpowers.mjs` from `5.1.0` to `6.2.0`
- [x] 1.2 Run `npm run vendor:superpowers`; review the dangling-reference output in `skills/SUPERPOWERS-NOTICE.md` for any `superpowers:<name>` reference to a skill outside the vendored set
- [x] 1.3 Confirm every vendored `skills/<name>/SKILL.md` description begins with `[Superpowers 6.2.0, MIT]`
- [x] 1.4 Run `npm test` and confirm `tests/test-vendor.sh`, `tests/test-skill-frontmatter.sh`, `tests/test-skills-structure.sh` stay green

## 2. Opus 5 prompting tuning

- [x] 2.1 Add an explicit delegation threshold (large + independent task sets only; keep concurrent subagent count low) to the "Optional mode — large changes" step in `skills/spec-driven-tdd/SKILL.md`
- [x] 2.2 Add the shared conciseness instruction to `CLAUDE.md`
- [x] 2.3 Add the identical conciseness instruction to `AGENTS.md`
- [x] 2.4 Add the identical conciseness instruction to `GEMINI.md`
- [x] 2.5 Add a test asserting all three context files contain the identical conciseness sentence (also covers the 2.1 delegation threshold, in `tests/test-prompting-guidance.sh`)

## 3. `init-context` CLI command

- [x] 3.1 Write `tests/test-init-context.sh`: covers creating `AGENTS.md` + `CLAUDE.md`/`GEMINI.md` symlinks in an empty target dir, skipping each of the three when already present (regular file, symlink to a different target, and dangling symlink), and exiting 0 when all three are already present
- [x] 3.2 Implement `init-context` in `bin/cli.js`: parse `--dir`, add the command to the dispatch switch, create `AGENTS.md` from a minimal generic template only if missing, symlink `CLAUDE.md`/`GEMINI.md` to `AGENTS.md` only if missing, print `skipped: <name> already exists` for anything already present, update `help()` usage text
- [x] 3.3 Re-run `tests/test-init-context.sh` and the full `npm test` suite, confirm green
- [x] 3.4 Simplify pass on the `bin/cli.js` diff
- [x] 3.5 Request + receive code review on the `init-context` diff; fix Critical + Important (fixed a TOCTOU race: switched to atomic exclusive-create + EEXIST handling instead of check-then-act)
- [x] 3.6 Add a short mention of `init-context` to `docs/installation.md`

## 4. Finish

- [ ] 4.1 Run `verification-before-completion`: full `npm test` green, manually run `init-context` against a scratch directory to confirm behavior end to end
- [ ] 4.2 Finish the development branch and integrate the worktree
- [ ] 4.3 `/opsx:archive` then `/opsx:sync`
