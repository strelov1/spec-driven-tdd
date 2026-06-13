## Context

The `spec-driven-tdd` lifecycle is Plan → Isolate → Implement → Finish. Planning
(`/opsx:propose`, which itself uses `brainstorming`) shapes scope, but nothing
validates that a risky technical approach is *feasible* before the team commits
to a full proposal/design/tasks/implementation cycle. Existing skills only
partially touch this: `test-driven-development` lists "throwaway prototypes" as a
TDD exception but gives no process. The skills.sh registry has spike skills
(notably `nousresearch/hermes-agent`'s `spike` and `awesome-copilot`'s
`create-technical-spike`), but the user chose a thin in-repo skill tailored to the
OpenSpec hand-off rather than vendoring one.

## Goals / Non-Goals

**Goals:**
- A cheap, disposable feasibility check that can stop a non-viable change before
  any OpenSpec artifacts are written.
- A clear verdict that maps deterministically to the next planning action.
- A portable, harness-agnostic skill in the `simplify` mold (short, principled).

**Non-Goals:**
- Making the spike mandatory. It is risk-gated; most changes skip it.
- Persisting spike code or its artifacts into the change. Only the verdict lives on.
- Replacing research or TDD. A spike picks an approach, then real work uses TDD.
- Vendoring an external spike skill (the user chose an in-repo skill).

## Decisions

**Decision: A thin in-repo `spike` skill, modeled on `simplify`.** Short
Principles + Process, harness-agnostic, no slash command. Authored by the pack so
it integrates directly with the OpenSpec hand-off.
- *Alternative considered:* vendor `hermes-agent`'s `spike`. Rejected by the user
  — its verdict-to-`/opsx:propose` wiring is pack-specific, and a thin skill keeps
  the dependency surface small.

**Decision: Trigger from the Plan phase, risk-gated.** The orchestrator (not the
spike skill) decides whether to spike, based on technical risk, before
`/opsx:propose`. Keeps the spike optional and the trigger logic in one place.
- *Alternative considered:* embed the offer inside `/opsx:propose`. Rejected —
  `propose` is an external OpenSpec command shared across repos; we do not own it.

**Decision: Ephemeral code, verdict-only output.** Spike code lives in scratch
(e.g. `/tmp`), never in the change worktree, and is discarded. The skill returns a
`VALIDATED` / `PARTIAL` / `INVALIDATED` verdict that the Plan phase maps to an
action. This is the seam between "is it possible?" and "build it properly".
- *Alternative considered:* write a `spike-notes.md` into the change dir. Rejected
  by the user — keep only the verdict.

**Decision: Five micro-steps, adapted from hermes' shape.** Decompose (2–5
feasibility questions) → Align (confirm before coding) → Build minimal (hardcode
everything, no tooling) → Observe (run, capture real output) → Verdict. Encodes
the disposability discipline ("a spike needing cleanup was over-built").

## Risks / Trade-offs

- **Spike becomes a procrastination step on low-risk work** → Mitigation: it is
  risk-gated and optional; the skill and the Plan phase both state "skip when
  feasibility is clear".
- **Spike code leaks into the change** → Mitigation: the skill mandates scratch
  location outside the worktree and discards code; a requirement/scenario asserts
  it.
- **Verdict is ambiguous** → Mitigation: exactly three verdicts, each with a
  single mapped action defined in the orchestrator.

## Migration Plan

1. Add `spike` to `tests/test-skills-structure.sh` pack skills (RED).
2. Create `skills/spike/SKILL.md` (GREEN).
3. Wire the optional spike gate + verdict mapping into the `spec-driven-tdd`
   Plan phase.
4. Note the bundled spike in `docs/workflow.md` and `docs/dependencies.md`.
5. Full suite green; verify the skill is discoverable.

Rollback: delete `skills/spike/`, revert the Plan-phase and doc edits, and drop
`spike` from the structure test.

## Open Questions

None — form, trigger, and output are settled from brainstorming.
