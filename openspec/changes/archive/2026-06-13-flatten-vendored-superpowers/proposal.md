## Why

Installing via the `skills.sh` registry (`npx skills add strelov1/spec-driven-tdd`)
only surfaces the three top-level skills; the vendored Superpowers skills live
nested under `skills/vendor/superpowers/` and are invisible to the registry. The
registry cannot run our installer's conditional fallback, so a user who installs
this way silently lacks the TDD / review / debugging skills the pack depends on.
We want one uniform install flow where every bundled skill — including the
vendored Superpowers set — appears in the picker alongside `simplify`.

## What Changes

- Promote the vendored Superpowers skills from `skills/vendor/superpowers/<skill>/`
  to top-level `skills/<skill>/` so the `skills.sh` registry discovers them.
- **BREAKING**: Remove the installer's conditional vendored-fallback path
  (`deployVendored` and the `skills/vendor` strip in `bin/cli.js`). Bundled
  skills are now always deployed as first-class skills; the "prefer the plugin,
  fall back to a flattened copy" model is retired.
- Retarget the refresh script (`scripts/vendor-superpowers.mjs`) to write the
  upstream snapshot into top-level `skills/` instead of `skills/vendor/`.
- Add a `[Superpowers <version>, MIT]` provenance prefix to each vendored skill's
  `description` frontmatter so the duplicate-with-plugin risk is visible in the
  picker and attribution is explicit.
- Ship the MIT license in the committed tree (`skills/SUPERPOWERS-LICENSE`)
  rather than only emitting it during a fallback install.
- Update tests and docs (`tests/`, `README.md`, `docs/*`, `AGENTS.md`,
  `GEMINI.md`) to describe the flat, single-flow model.

Accepted trade-off: a user who already has the Superpowers marketplace plugin may
install duplicate skills. Avoiding that duplicate is now the user's
responsibility, made visible by the provenance prefix.

## Capabilities

### New Capabilities
- `skill-distribution`: How the pack packages and distributes its skills so a
  registry-based install surfaces every bundled skill, how third-party vendored
  skills are attributed, and how the installer deploys them.

### Modified Capabilities
<!-- No existing specs in openspec/specs/ yet; nothing to modify. -->

## Impact

- **Layout**: 10 skill directories move from `skills/vendor/superpowers/*` to
  `skills/*`; `skills/vendor/` is removed.
- **Installer**: `bin/cli.js` loses `deployVendored` and the vendor strip;
  dependency report reframes Superpowers as always-bundled.
- **Tooling**: `scripts/vendor-superpowers.mjs` retargets its output path.
- **Tests**: `tests/test-vendor.sh`, `tests/test-install.sh`,
  `tests/test-skills-structure.sh` rewritten for the flat model.
- **Docs**: `README.md`, `docs/dependencies.md`, `docs/installation.md`,
  `docs/workflow.md`, `AGENTS.md`, `GEMINI.md` reframed from "fallback" to
  "bundled, single picker".
- **Attribution**: MIT license committed at `skills/SUPERPOWERS-LICENSE`;
  provenance prefix added to vendored skill descriptions.
