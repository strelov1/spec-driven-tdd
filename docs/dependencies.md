# Dependencies

| Dependency | Required? | Provides |
|------------|-----------|----------|
| [OpenSpec](https://www.npmjs.com/package/@fission-ai/openspec) CLI + initialized project | Yes (npm dep) | `/opsx:*`, change/task tracking |
| [Superpowers](https://github.com/obra/superpowers) skills | Bundled (vendored, pinned 5.1.0) | TDD, code review, debugging, worktrees, finishing, brainstorming |
| `simplify` skill | Bundled | quality pass (ships in this pack) |
| `spike` skill | Bundled | optional, risk-gated feasibility check in the Plan phase (ships in this pack) |
| Claude Code `/code-review` | Optional | extra built-in bug pass (CC only) |

## Degradation

- The quality pass and the Superpowers skills are bundled, so they never degrade
  across harnesses.
- Bug review defaults to the portable `requesting-code-review`. `/code-review`
  is an optional Claude-Code-only addition.
- If OpenSpec is missing, the orchestrator must say so and stop, not silently
  skip steps.

## Per-harness capability

The Superpowers skills are bundled as top-level skills (vendored snapshot, pinned
5.1.0). Vendoring carries the *text*; some skills need Claude-only runtime
primitives and degrade elsewhere:

| Capability | Claude Code | Codex / Gemini / opencode |
|------------|-------------|---------------------------|
| TDD, debugging, code-review, verification, finishing | full | full (bundled) |
| git worktrees | native tools | plain `git worktree` fallback |
| subagent / parallel task modes | full | unavailable — orchestrator says so and stops |

The vendored copy is a committed snapshot, refreshed with `npm run
vendor:superpowers`. Each vendored skill's description is prefixed
`[Superpowers 5.1.0, MIT]`; if you also run the Superpowers marketplace plugin,
skip those skills to avoid duplicates. Superpowers is MIT (© 2025 Jesse Vincent);
its license ships at `skills/SUPERPOWERS-LICENSE` (attribution in
`skills/SUPERPOWERS-NOTICE.md`).
