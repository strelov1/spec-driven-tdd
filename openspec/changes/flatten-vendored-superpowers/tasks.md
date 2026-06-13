## 1. Specify the flat model in tests (RED)

- [x] 1.1 Rewrite `tests/test-skills-structure.sh` to assert every bundled skill — the three pack skills plus the 10 vendored Superpowers skills — has matching `name` + `description` frontmatter at top-level `skills/<name>/SKILL.md`
- [x] 1.2 Add a test asserting no `skills/vendor/` directory exists and each vendored skill resolves at `skills/<name>/SKILL.md`
- [x] 1.3 Add a test asserting each vendored skill's `description` begins with `[Superpowers 5.1.0, MIT]`
- [x] 1.4 Rewrite `tests/test-install.sh` so it asserts the installer copies vendored skills (e.g. `skills/test-driven-development/SKILL.md`) unconditionally, and remove assertions about `SDT_ASSUME_SUPERPOWERS`, vendor-strip, and the flattened-fallback path
- [x] 1.5 Rewrite/retire `tests/test-vendor.sh` to assert the refresh writes top-level `skills/` and a committed `skills/SUPERPOWERS-LICENSE`, dropping nested-`vendor/` assertions
- [x] 1.6 Run `npm test` and confirm the rewritten assertions fail for the right reasons (RED)

## 2. Flatten the layout (GREEN)

- [x] 2.1 Move each `skills/vendor/superpowers/<name>/` directory (10 skills) to `skills/<name>/`, preserving nested files
- [x] 2.2 Commit the Superpowers MIT license at `skills/SUPERPOWERS-LICENSE` and relocate `NOTICE.md`/`.version` to a committed location
- [x] 2.3 Remove the now-empty `skills/vendor/` directory
- [x] 2.4 Add the `[Superpowers 5.1.0, MIT]` prefix to each vendored skill's `description` frontmatter
- [x] 2.5 Run the structure/prefix tests and confirm they pass

## 3. Simplify the installer (GREEN)

- [x] 3.1 Remove `deployVendored` and the `skills/vendor` strip from `bin/cli.js`
- [x] 3.2 Reframe the dependency report: Superpowers is "bundled", not a conditional "vendored fallback"
- [x] 3.3 Run `tests/test-install.sh` and confirm it passes

## 4. Retarget the refresh script (GREEN)

- [x] 4.1 Update `scripts/vendor-superpowers.mjs` to write the snapshot into top-level `skills/` and re-apply the `[Superpowers 5.1.0, MIT]` description prefix on regeneration
- [x] 4.2 Update the committed `SUPERPOWERS-LICENSE`/NOTICE/`.version` placement to match
- [x] 4.3 Run `tests/test-vendor.sh` and confirm it passes

## 5. Update docs

- [x] 5.1 Reframe `README.md` and `docs/dependencies.md` from "vendored fallback" to "bundled, single picker"; explain the duplicate-with-plugin caveat
- [x] 5.2 Update `docs/installation.md`, `docs/workflow.md`, `AGENTS.md`, `GEMINI.md` to the flat model
- [x] 5.3 Confirm no doc still references `skills/vendor/` or the conditional fallback

## 6. Verify

- [x] 6.1 Run the full suite (`npm test`) green
- [x] 6.2 Simulate registry discovery (list `skills/*/SKILL.md`) and confirm all 13 skills appear
