#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOK="$ROOT/hooks/session-start"

echo "Test: session-start emits per-harness JSON"

# Claude Code shape
out_claude=$(CLAUDE_PLUGIN_ROOT="$ROOT" bash "$HOOK" 2>/dev/null)
assert_json_valid "$out_claude" "claude output is valid JSON"
assert_json_path "$out_claude" "'additionalContext' in d.get('hookSpecificOutput', {})" "claude uses hookSpecificOutput.additionalContext"
assert_contains "$out_claude" "using-spec-driven-tdd" "claude context mentions the entry skill"

# Cursor shape
out_cursor=$(CURSOR_PLUGIN_ROOT="$ROOT" bash "$HOOK" 2>/dev/null)
assert_json_valid "$out_cursor" "cursor output is valid JSON"
assert_json_path "$out_cursor" "'additional_context' in d" "cursor uses top-level additional_context"

# Copilot / SDK-standard shape
out_copilot=$(COPILOT_CLI=1 CLAUDE_PLUGIN_ROOT="$ROOT" bash "$HOOK" 2>/dev/null)
assert_json_path "$out_copilot" "'additionalContext' in d" "copilot uses top-level additionalContext"

# run-hook.cmd should dispatch to the named script on Unix
out_wrap=$(CLAUDE_PLUGIN_ROOT="$ROOT" bash "$ROOT/hooks/run-hook.cmd" session-start 2>/dev/null)
assert_json_valid "$out_wrap" "run-hook.cmd dispatches session-start (valid JSON)"

finish
