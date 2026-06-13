## Context

The pack ships two kinds of skills: ones it authors (`simplify`,
`spec-driven-tdd`, `using-spec-driven-tdd`) at top-level `skills/`, and a
vendored snapshot of Superpowers (10 skills, pinned 5.1.0, MIT © Jesse Vincent)
nested under `skills/vendor/superpowers/`. Two install paths exist:

- `npx skills add strelov1/spec-driven-tdd` — the third-party `skills.sh`
  registry. It clones the repo and discovers skills one level deep
  (`skills/<name>/SKILL.md`). It finds only the three top-level skills; the
  nested vendored set is invisible to it.
- `npx spec-driven-tdd install` — the pack's own `bin/cli.js`. It copies the
  payload and, when the Superpowers plugin is absent, flattens the vendored
  snapshot into the target via `deployVendored`, stripping `skills/vendor` so it
  never leaks. This conditional fallback is the logic the registry cannot run.

The registry path therefore silently omits the TDD / review / debugging skills
the orchestrator depends on. The user wants one uniform flow where the picker
lists every bundled skill.

## Goals / Non-Goals

**Goals:**
- Every bundled skill, including vendored Superpowers, is discoverable by the
  registry and installed by both paths identically.
- Third-party origin stays explicit (provenance prefix + committed license).
- Refresh tooling keeps working against the new layout.

**Non-Goals:**
- Conditional "install only if the plugin is absent" behavior. The registry
  cannot express it; we drop it rather than maintain two divergent flows.
- Preventing duplicate skills when the Superpowers plugin is already installed.
  That becomes the user's responsibility, surfaced by the provenance prefix.
- Changing the content of any vendored skill beyond its `description` prefix.

## Decisions

**Decision: Move the vendored skills to top-level rather than commit a generated
duplicate.** `skills/vendor/superpowers/<name>/` → `skills/<name>/`, and remove
`skills/vendor/`. A single source of truth in the tree; the registry sees them
because they now sit one level deep.
- *Alternative considered:* keep `skills/vendor/` as the snapshot source and also
  commit a flattened copy at top-level. Rejected — duplicates every vendored file
  in the repo and invites drift between the two copies.

**Decision: Retire `deployVendored` and the vendor-strip in `bin/cli.js`.** Once
the skills are top-level, the installer's generic "copy all of `skills/`" already
deploys them. The conditional branch becomes not just unnecessary but wrong — it
would look for a `skills/vendor/` that no longer exists. The dependency report
reframes Superpowers from "vendored fallback" to "bundled".
- *Alternative considered:* keep `deployVendored` as a no-op guard. Rejected —
  dead code that contradicts the new layout and confuses the tests.

**Decision: Provenance prefix in each `description`.** Prefix every vendored
skill's `description` with `[Superpowers 5.1.0, MIT]`. It is visible directly in
the `skills.sh` picker (which shows descriptions), making the third-party origin
and the duplicate risk obvious at selection time, and it satisfies attribution.
- *Alternative considered:* a separate `NOTICE`/`SUPERPOWERS-LICENSE` only.
  Kept the committed license, but a license file is invisible in the picker, so
  the prefix carries the user-facing signal. The refresh script must re-apply the
  prefix on regeneration so it survives `npm run vendor:superpowers`.

**Decision: Commit `skills/SUPERPOWERS-LICENSE` in the tree.** Today the license
only rides along during a fallback install. With the skills always present, the
MIT license must be committed beside them.

## Risks / Trade-offs

- **Duplicate skills when the Superpowers plugin is installed** → Mitigation: the
  `[Superpowers 5.1.0, MIT]` prefix makes the origin obvious in the picker; docs
  tell plugin users not to tick those entries.
- **Vendored snapshot drifts from upstream (frozen 5.1.0)** → Mitigation:
  `npm run vendor:superpowers` refreshes in place; the version lives in the
  prefix, the NOTICE, and the `.version` file, so staleness is visible.
- **Refresh script overwrites the provenance prefix** → Mitigation: the script
  applies the prefix as part of regeneration; a test asserts the prefix is
  present after a refresh-shaped layout.
- **Tests encode the old fallback model** → Mitigation: rewrite the affected
  tests first (RED) to specify the flat model before moving files.

## Migration Plan

1. Rewrite `tests/test-vendor.sh`, `tests/test-install.sh`,
   `tests/test-skills-structure.sh` to assert the flat model (RED).
2. Move `skills/vendor/superpowers/<name>/` → `skills/<name>/` (10 skills);
   commit `skills/SUPERPOWERS-LICENSE`; remove `skills/vendor/`.
3. Add the `[Superpowers 5.1.0, MIT]` prefix to each vendored `description`.
4. Remove `deployVendored` and the vendor-strip from `bin/cli.js`; reframe the
   dependency report.
5. Retarget `scripts/vendor-superpowers.mjs` to write top-level `skills/` and
   re-apply the prefix.
6. Update docs (`README.md`, `docs/dependencies.md`, `docs/installation.md`,
   `docs/workflow.md`, `AGENTS.md`, `GEMINI.md`).
7. Run the full suite green; verify a registry-shaped discovery lists all skills.

Rollback: revert the change; the previous nested-vendor + fallback model is
restored wholesale.

## Open Questions

None — model, attribution, and tempo are settled.
