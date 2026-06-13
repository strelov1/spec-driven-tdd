#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_DIR="$ROOT/skills"
SCRIPT="$ROOT/scripts/vendor-superpowers.mjs"

echo "Test: vendored Superpowers snapshot is flattened, attributed, and pinned"

for skill in \
  test-driven-development systematic-debugging requesting-code-review \
  receiving-code-review verification-before-completion using-git-worktrees \
  finishing-a-development-branch subagent-driven-development \
  dispatching-parallel-agents brainstorming
do
  if [ -f "$SKILLS_DIR/$skill/SKILL.md" ]; then
    echo "  ok: vendored $skill at top level"; PASS=$((PASS + 1))
  else
    echo "  FAIL: missing top-level vendored skill $skill"; FAIL=$((FAIL + 1))
  fi
done

# MIT license committed beside the flattened skills
if [ -f "$SKILLS_DIR/SUPERPOWERS-LICENSE" ]; then
  echo "  ok: SUPERPOWERS-LICENSE committed"; PASS=$((PASS + 1))
else
  echo "  FAIL: SUPERPOWERS-LICENSE missing"; FAIL=$((FAIL + 1))
fi

# version pin recorded in the committed notice
if [ -f "$SKILLS_DIR/SUPERPOWERS-NOTICE.md" ] && grep -q '5.1.0' "$SKILLS_DIR/SUPERPOWERS-NOTICE.md"; then
  echo "  ok: SUPERPOWERS-NOTICE.md pins 5.1.0"; PASS=$((PASS + 1))
else
  echo "  FAIL: SUPERPOWERS-NOTICE.md missing or not pinned to 5.1.0"; FAIL=$((FAIL + 1))
fi

# the refresh script targets top-level skills/, not a nested vendor/ path segment.
# Match `vendor` only as a path part (vendor/ vendor' vendor") so the npm script
# name `vendor:superpowers` (colon) and the word "vendored" do not false-positive.
if grep -Eq "vendor[/'\"]" "$SCRIPT"; then
  echo "  FAIL: refresh script still targets a nested vendor/ path"; FAIL=$((FAIL + 1))
else
  echo "  ok: refresh script no longer targets skills/vendor"; PASS=$((PASS + 1))
fi

# the refresh script re-applies the provenance prefix on regeneration
if grep -Eq 'Superpowers.*MIT' "$SCRIPT"; then
  echo "  ok: refresh script re-applies the provenance prefix"; PASS=$((PASS + 1))
else
  echo "  FAIL: refresh script does not re-apply the provenance prefix"; FAIL=$((FAIL + 1))
fi

finish
