## ADDED Requirements

### Requirement: Spike is an optional, risk-gated planning step

The `spec-driven-tdd` Plan phase SHALL offer a feasibility spike only when a
change carries unclear technical risk (an unproven approach, an external
dependency, or an open "is this possible?" question). It SHALL NOT run a spike
for changes whose feasibility is already clear.

#### Scenario: Unclear technical risk runs a spike first
- **WHEN** planning a change whose technical approach is unproven
- **THEN** the orchestrator invokes the `spike` skill before `/opsx:propose`

#### Scenario: Clear feasibility skips the spike
- **WHEN** planning a change whose feasibility is already obvious
- **THEN** the orchestrator goes straight to `/opsx:propose` with no spike

### Requirement: The spike produces a verdict that gates the change

The `spike` skill SHALL end every run with one verdict — `VALIDATED`, `PARTIAL`,
or `INVALIDATED` — and the orchestrator SHALL map the verdict to a planning
action: `VALIDATED` proceeds to `/opsx:propose`; `PARTIAL` narrows scope to the
viable subset, then proceeds; `INVALIDATED` stops without creating a change.

#### Scenario: VALIDATED proceeds to propose
- **WHEN** a spike returns `VALIDATED`
- **THEN** the workflow continues to `/opsx:propose` for the validated approach

#### Scenario: INVALIDATED stops the change
- **WHEN** a spike returns `INVALIDATED`
- **THEN** no OpenSpec change is created and the user is told why it is not viable

#### Scenario: PARTIAL narrows scope
- **WHEN** a spike returns `PARTIAL`
- **THEN** the workflow narrows scope to the viable subset before `/opsx:propose`

### Requirement: Spike code is disposable

The `spike` skill SHALL treat its experiment code as throwaway: it is built in a
scratch location, never inside the change's worktree, and is discarded once it
has answered its question. Only the verdict (and its reasoning) persists.

#### Scenario: Spike code stays out of the change worktree
- **WHEN** a spike is run during planning
- **THEN** its scratch code is not committed to the change's branch or worktree

#### Scenario: Only the verdict survives
- **WHEN** a spike finishes
- **THEN** the experiment code is discarded and the verdict carries the decision

### Requirement: The spike skill is bundled and discoverable

The `spike` skill SHALL ship as a first-class top-level skill
(`skills/spike/SKILL.md`) with `name` + `description` frontmatter, discoverable by
the registry like the pack's other skills.

#### Scenario: Spike skill is present and well-formed
- **WHEN** the repository's `skills/` directory is scanned
- **THEN** `skills/spike/SKILL.md` exists with `name: spike` and a `description`
