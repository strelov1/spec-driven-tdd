# Dependencies

| Dependency | Required? | Provides |
|------------|-----------|----------|
| [OpenSpec](https://www.npmjs.com/package/@fission-ai/openspec) CLI + initialized project | Yes (npm dep) | `/opsx:*`, change/task tracking |
| [Superpowers](https://github.com/obra/superpowers) | Yes (CC marketplace, no npm) | TDD, code review, debugging, worktrees, finishing, brainstorming |
| `simplify` skill | Bundled | quality pass (ships in this pack) |
| Claude Code `/code-review` | Optional | extra built-in bug pass (CC only) |

## Degradation

- The quality pass is bundled, so it never degrades across harnesses.
- Bug review defaults to the portable `requesting-code-review`. `/code-review`
  is an optional Claude-Code-only addition.
- If OpenSpec or Superpowers is missing, the orchestrator must say so and stop,
  not silently skip steps.
