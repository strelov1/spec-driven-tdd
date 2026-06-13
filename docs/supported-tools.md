# Supported tools

| Harness | Manifest | Context file | Hook manifest |
|---------|----------|--------------|---------------|
| Claude Code | `.claude-plugin/plugin.json` | `CLAUDE.md` | `hooks/hooks.json` |
| Cursor | `.cursor-plugin/plugin.json` | `CLAUDE.md` | `hooks/hooks-cursor.json` |
| Codex | `.codex-plugin/plugin.json` | `AGENTS.md` | — |
| Gemini | `gemini-extension.json` | `GEMINI.md` | — |
| opencode | `skills/` discovery | `AGENTS.md` | `hooks/session-start` (default shape) |

All harnesses share `skills/` and `hooks/session-start`. The vendored Superpowers
skills (pinned 5.1.0) ship as top-level skills under `skills/`, so every harness
gets them; subagent/parallel modes remain Claude-only. See
`docs/dependencies.md` for the capability table.
