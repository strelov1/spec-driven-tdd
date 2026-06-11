#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
V="$ROOT/skills/vendor/superpowers"

echo "Test: vendored Superpowers snapshot is complete and pinned"

for skill in \
  test-driven-development systematic-debugging requesting-code-review \
  receiving-code-review verification-before-completion using-git-worktrees \
  finishing-a-development-branch subagent-driven-development \
  dispatching-parallel-agents brainstorming
do
  if [ -f "$V/$skill/SKILL.md" ]; then
    echo "  ok: vendored $skill"; PASS=$((PASS + 1))
  else
    echo "  FAIL: missing vendored skill $skill"; FAIL=$((FAIL + 1))
  fi
done

# MIT license must travel with the copies
if [ -f "$V/LICENSE" ]; then
  echo "  ok: vendored LICENSE present"; PASS=$((PASS + 1))
else
  echo "  FAIL: vendored LICENSE missing"; FAIL=$((FAIL + 1))
fi

# version pin recorded and matches expectation
if [ -f "$V/.version" ] && grep -qx '5.1.0' "$V/.version"; then
  echo "  ok: .version pinned to 5.1.0"; PASS=$((PASS + 1))
else
  echo "  FAIL: .version missing or not 5.1.0"; FAIL=$((FAIL + 1))
fi

finish
