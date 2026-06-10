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

## Test

```bash
npm test   # or: bash tests/run-all.sh
```

## License

MIT
