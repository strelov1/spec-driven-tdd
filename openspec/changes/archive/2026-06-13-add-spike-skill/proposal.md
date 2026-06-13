## Why

Some OpenSpec changes carry unproven technical risk — "is this even possible?",
"will this API behave?", "is the approach viable?". Today the lifecycle jumps from
planning straight to a full TDD implementation; there is no cheap, disposable way
to test feasibility *before* committing to a change. A throwaway spike answers the
risky question for the price of a script, and an INVALIDATED verdict saves the
whole proposal/design/tasks/implementation cost.

## What Changes

- Add a bundled `spike` skill (`skills/spike/SKILL.md`) — a portable, throwaway
  feasibility experiment that ends in a `VALIDATED` / `PARTIAL` / `INVALIDATED`
  verdict. Spike code is disposable; only the verdict persists.
- Wire the spike into the `spec-driven-tdd` Plan phase as an **optional,
  risk-gated** step before `/opsx:propose`: run it only when technical risk is
  unclear, never as a mandatory step.
- Map the verdict to a planning action: `VALIDATED` → `/opsx:propose`;
  `PARTIAL` → narrow scope, then `/opsx:propose`; `INVALIDATED` → stop, do not
  create the change.

## Capabilities

### New Capabilities
- `feasibility-spike`: when and how the workflow runs a throwaway spike to
  validate technical feasibility before planning a change, and how its verdict
  gates whether a change is created.

### Modified Capabilities
<!-- No existing spec captures the lifecycle phases as requirements; nothing to modify. -->

## Impact

- **New skill:** `skills/spike/SKILL.md` (bundled, top-level, like `simplify`).
- **Orchestrator:** `skills/spec-driven-tdd/SKILL.md` Plan phase gains the
  optional spike gate + verdict mapping.
- **Tests:** `tests/test-skills-structure.sh` adds `spike` to the pack skills.
- **Docs:** `docs/workflow.md` and `docs/dependencies.md` note the bundled spike.
