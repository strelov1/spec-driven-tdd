## ADDED Requirements

### Requirement: Orchestrator states an explicit subagent-delegation threshold

The "Optional mode — large changes" step of `skills/spec-driven-tdd/SKILL.md`
SHALL state an explicit criterion for when to delegate to
`subagent-driven-development` or `dispatching-parallel-agents`, rather than
leaving the decision open-ended, so the orchestrator does not delegate small
or non-independent task sets by default.

#### Scenario: Step names a size/independence threshold
- **WHEN** `skills/spec-driven-tdd/SKILL.md`'s "Optional mode — large changes"
  step is read
- **THEN** it states that delegation applies only when the task list is
  genuinely large and tasks are independent, not for a handful of tasks
  runnable inline

#### Scenario: Step caps concurrent subagent count
- **WHEN** the same step is read
- **THEN** it instructs keeping the number of concurrent subagents low when
  `dispatching-parallel-agents` is used

### Requirement: Pack context files include a conciseness instruction

`CLAUDE.md`, `AGENTS.md`, and `GEMINI.md` at the repository root SHALL each
include an identical short instruction calibrating response length, so
content injected every session via `hooks/session-start` does not default to
verbose narration.

#### Scenario: All three context files carry the same instruction
- **WHEN** `CLAUDE.md`, `AGENTS.md`, and `GEMINI.md` are read
- **THEN** each contains the identical sentence instructing concise,
  outcome-focused responses
