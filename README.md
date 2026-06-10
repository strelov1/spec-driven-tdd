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

```bash
npx spec-driven-tdd install
```

Requires **OpenSpec** (npm dependency, pulled automatically) and
**[Superpowers](https://github.com/obra/superpowers)** (Claude Code marketplace,
no npm package — `/plugin install superpowers@claude-plugins-official`). Full
steps in [docs/installation.md](docs/installation.md); what each provides is in
[docs/dependencies.md](docs/dependencies.md).

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
flowchart LR
    A["Session start<br/>startup · clear · compact"] --> B{"Context<br/>injection?"}
    B -->|"hook-driven<br/>Claude Code · Cursor · opencode"| D
    B -->|"static<br/>Codex · Gemini"| S1["read AGENTS.md /<br/>GEMINI.md directly"]

    subgraph HOOK ["SessionStart hook"]
        direction TB
        D["run-hook.cmd → session-start<br/>polyglot bash wrapper"] --> F["cat entry SKILL.md ·<br/>escape_for_json()"]
        F --> H{"harness<br/>env var?"}
        H -->|CURSOR_PLUGIN_ROOT| I1["additional_context"]
        H -->|CLAUDE_PLUGIN_ROOT| I2["hookSpecificOutput<br/>.additionalContext"]
        H -->|default| I3["additionalContext"]
    end

    I1 & I2 & I3 --> J["valid JSON<br/>on stdout"]
    J --> K["Entry skill loaded →<br/>invoke spec-driven-tdd"]
    S1 --> K
```

### The lifecycle the skill enforces

The thin `using-spec-driven-tdd` entry skill triggers the `spec-driven-tdd`
orchestrator, which drives a four-phase loop. A task is `[x]` only after a clean
review — not at green tests.

```mermaid
flowchart LR
    Entry["using-spec-driven-tdd<br/>entry skill"] --> Orch["spec-driven-tdd<br/>orchestrator"]
    Orch --> P1["1 · PLAN<br/>/opsx:propose + brainstorming"]
    P1 --> P2["2 · ISOLATE<br/>1 change = 1 worktree"]
    P2 --> P3["3 · IMPLEMENT<br/>per-task loop"]
    P3 --> P4["4 · FINISH<br/>verify → finish branch<br/>→ /opsx:archive + sync"]

    subgraph Loop ["per-task micro-cycle"]
        direction TB
        R["RED"] --> G["GREEN"] --> RF["REFACTOR"] --> S["simplify"] --> RT["re-test"] --> RV["REVIEW"] --> FX["fix Crit/Imp"] --> X["mark [x]"]
    end
    P3 -.per task.-> R
```

Dependencies are composed by name (OpenSpec CLI, Superpowers); only `simplify`
is vendored.

## Test

```bash
npm test   # or: bash tests/run-all.sh
```

## License

MIT
