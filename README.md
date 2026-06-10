# spec-driven-tdd

An installable, multi-harness skill-pack that fuses **OpenSpec** (planning +
task tracking) with **Superpowers** (TDD, simplify, code review) into one
delivery loop.

Plan in OpenSpec → isolate in a worktree → implement each task via
TDD → simplify → review → finish and archive. A task is done only after a clean
review, not at green tests.

- Composes existing skills by name (depend, not vendor). The only vendored skill
  is the portable `simplify`.
- Works across Claude Code, Codex, Cursor, Gemini, and opencode.

## Install

See [docs/installation.md](docs/installation.md). Requires OpenSpec and
Superpowers — see [docs/dependencies.md](docs/dependencies.md).

## Workflow

See [docs/workflow.md](docs/workflow.md).

## How it works

### Context injection (install → SessionStart)

Hook-driven harnesses (Claude Code, Cursor, opencode) run the polyglot
`run-hook.cmd` wrapper, and the `session-start` script emits the entry skill as
harness-shaped JSON. Codex and Gemini have no hook mechanism — they read the
same entry context from a static `AGENTS.md` / `GEMINI.md`. Either way the agent
boots knowing the workflow exists.

```mermaid
flowchart TD
    A["Session start<br/>(startup · clear · compact)"] --> B{"How does the harness<br/>inject context?"}
    B -->|hook-driven| H1["Claude Code · Cursor · opencode<br/>manifest declares a SessionStart hook"]
    B -->|static context| S1["Codex · Gemini<br/>read AGENTS.md / GEMINI.md directly"]
    H1 --> D["hooks/run-hook.cmd session-start<br/>(polyglot: cmd.exe → bash on Windows, bash on Unix)"]
    D --> E["hooks/session-start"]
    E --> F["cat skills/using-spec-driven-tdd/SKILL.md<br/>escape_for_json() · wrap in EXTREMELY_IMPORTANT"]
    F --> H{"Branch on harness env var"}
    H -->|CURSOR_PLUGIN_ROOT| I1["additional_context"]
    H -->|CLAUDE_PLUGIN_ROOT| I2["hookSpecificOutput.additionalContext"]
    H -->|default| I3["additionalContext (SDK / opencode)"]
    I1 --> J["printf '%s' → valid JSON on stdout"]
    I2 --> J
    I3 --> J
    J --> K["Entry-skill context loaded:<br/>'invoke spec-driven-tdd for an OpenSpec change'"]
    S1 --> K
```

### The lifecycle the skill enforces

The thin `using-spec-driven-tdd` entry skill triggers the `spec-driven-tdd`
orchestrator, which drives a four-phase loop. A task is `[x]` only after a clean
review — not at green tests.

```mermaid
flowchart LR
    Entry["using-spec-driven-tdd<br/>(entry skill)"] --> Orch["spec-driven-tdd<br/>(orchestrator)"]
    Orch --> P1["PLAN<br/>OpenSpec /opsx:propose<br/>+ brainstorming"]
    P1 --> P2["ISOLATE<br/>1 change = 1 worktree"]
    P2 --> P3["IMPLEMENT<br/>per-task loop"]
    P3 --> P4["FINISH<br/>verify → finish branch<br/>→ /opsx:archive + sync"]

    subgraph Loop["per-task micro-cycle"]
        direction LR
        R["RED"] --> G["GREEN"] --> RF["REFACTOR"] --> S["simplify"] --> RT["re-test"] --> RV["REVIEW"] --> FX["fix Critical/Important"] --> X["mark [x]"]
    end
    P3 -.repeat per task.-> R
```

Dependencies are composed by name (OpenSpec CLI, Superpowers); only `simplify`
is vendored.

## Test

```bash
npm test   # or: bash tests/run-all.sh
```

## License

MIT
