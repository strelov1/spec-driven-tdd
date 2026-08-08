#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CONCISENESS='Keep responses focused, brief, and concise\.'

echo "Test: orchestrator states an explicit subagent-delegation threshold"
SKILL="$ROOT/skills/spec-driven-tdd/SKILL.md"
assert_contains "$(cat "$SKILL")" "genuinely large.*independent" \
  "delegation threshold names size + independence"
assert_contains "$(cat "$SKILL")" "keep.*concurrent subagents.*low" \
  "delegation threshold caps concurrent subagent count"

echo "Test: pack context files carry the identical conciseness instruction"
for f in CLAUDE.md AGENTS.md GEMINI.md; do
  assert_contains "$(cat "$ROOT/$f")" "$CONCISENESS" "$f carries the conciseness instruction"
done

finish
