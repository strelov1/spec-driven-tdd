# Supported tools

| Harness | Manifest | Context file | Hook manifest |
|---------|----------|--------------|---------------|
| Claude Code | `.claude-plugin/plugin.json` | `CLAUDE.md` | `hooks/hooks.json` |
| Cursor | `.cursor-plugin/plugin.json` | `CLAUDE.md` | `hooks/hooks-cursor.json` |
| Codex | `.codex-plugin/plugin.json` | `AGENTS.md` | — |
| Gemini | `gemini-extension.json` | `GEMINI.md` | — |
| opencode | `skills/` discovery | `AGENTS.md` | `hooks/session-start` (default shape) |

All harnesses share `skills/` and `hooks/session-start`.
