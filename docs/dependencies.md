# Dependencies

| Dependency | Required? | Provides |
|------------|-----------|----------|
| [OpenSpec](https://www.npmjs.com/package/@fission-ai/openspec) CLI + initialized project | Yes (npm dep) | `/opsx:*`, change/task tracking |
| [Superpowers](https://github.com/obra/superpowers) | Yes (CC marketplace, no npm) — bundled fallback when marketplace absent | TDD, code review, debugging, worktrees, finishing, brainstorming |
| `simplify` skill | Bundled | quality pass (ships in this pack) |
| Claude Code `/code-review` | Optional | extra built-in bug pass (CC only) |

## Degradation

- The quality pass is bundled, so it never degrades across harnesses.
- Bug review defaults to the portable `requesting-code-review`. `/code-review`
  is an optional Claude-Code-only addition.
- If OpenSpec or Superpowers is missing, the orchestrator must say so and stop,
  not silently skip steps.

## Per-harness capability

Superpowers is vendored (pinned 5.1.0) and deployed as a fallback when the
marketplace plugin is not detected. Vendoring carries the *text*; some skills
need Claude-only runtime primitives and degrade elsewhere:

| Capability | Claude Code | Codex / Gemini / opencode |
|------------|-------------|---------------------------|
| TDD, debugging, code-review, verification, finishing | full | full (vendored) |
| git worktrees | native tools | plain `git worktree` fallback |
| subagent / parallel task modes | full | unavailable — orchestrator says so and stops |

The vendored copy is a committed snapshot, refreshed with `npm run
vendor:superpowers`. Superpowers is MIT (© 2025 Jesse Vincent); its license
ships at `skills/vendor/superpowers/LICENSE` and, after a fallback install, at
`skills/SUPERPOWERS-LICENSE` in the target.
