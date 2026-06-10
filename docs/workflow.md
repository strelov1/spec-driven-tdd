# Workflow

The lifecycle the `spec-driven-tdd` skill enforces.

| Phase | Tool | Rule |
|-------|------|------|
| Plan | `/opsx:propose` (+ `brainstorming`) | OpenSpec owns scope + task list |
| Isolate | `using-git-worktrees` | one change → one worktree |
| Implement (per task) | `test-driven-development` → `simplify` → `requesting-code-review` + `receiving-code-review` | RED before code; `[x]` only after clean review |
| Finish | `verification-before-completion` → `finishing-a-development-branch` → `/opsx:archive` + `/opsx:sync` | tracking closes in OpenSpec |

Per-task micro-cycle: RED → GREEN → REFACTOR → simplify → re-run tests → review
→ fix Critical/Important → mark `[x]`.

Optional: `subagent-driven-development` (large changes),
`dispatching-parallel-agents` (independent tasks).
