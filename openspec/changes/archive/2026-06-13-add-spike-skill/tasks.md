## 1. Specify the skill in tests (RED)

- [x] 1.1 Add `spike` to the `PACK_SKILLS` list in `tests/test-skills-structure.sh`
- [x] 1.2 Run `npm test` and confirm the structure test fails because `skills/spike/SKILL.md` is missing (RED)

## 2. Create the spike skill (GREEN)

- [x] 2.1 Write `skills/spike/SKILL.md` with `name: spike` + a description, and the Principles + Process (Decompose → Align → Build minimal → Observe → Verdict), stating disposability and the VALIDATED/PARTIAL/INVALIDATED verdict
- [x] 2.2 Run the structure test and confirm it passes

## 3. Wire the spike into the Plan phase

- [x] 3.1 Edit `skills/spec-driven-tdd/SKILL.md` Plan phase: add the optional, risk-gated spike step before `/opsx:propose`, with the verdict → action mapping (VALIDATED→propose, PARTIAL→narrow scope, INVALIDATED→stop)
- [x] 3.2 Confirm the wording marks the spike as optional (skip when feasibility is clear)

## 4. Update docs

- [x] 4.1 Note the bundled `spike` skill and the risk-gated Plan step in `docs/workflow.md`
- [x] 4.2 Add `spike` to the bundled-skills description in `docs/dependencies.md`

## 5. Verify

- [x] 5.1 Run the full suite (`npm test`) green
- [x] 5.2 Confirm `skills/spike/SKILL.md` is discoverable (appears in `skills/*/SKILL.md`)
