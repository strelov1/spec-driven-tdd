#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Test: all JSON manifests valid"
for f in \
  hooks/hooks.json \
  hooks/hooks-cursor.json \
  .claude-plugin/plugin.json \
  .codex-plugin/plugin.json \
  .cursor-plugin/plugin.json \
  gemini-extension.json \
  package.json
do
  if [ -f "$ROOT/$f" ]; then
    assert_json_valid "$(cat "$ROOT/$f")" "$f is valid JSON"
  else
    echo "  FAIL: $f missing"; FAIL=$((FAIL + 1))
  fi
done

# plugin manifests must carry the pack name
for f in .claude-plugin/plugin.json .codex-plugin/plugin.json .cursor-plugin/plugin.json gemini-extension.json; do
  assert_json_path "$(cat "$ROOT/$f")" "d.get('name') == 'spec-driven-tdd'" "$f name is spec-driven-tdd"
done

finish
