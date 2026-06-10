#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Test: each SKILL.md has name + description frontmatter"
for skill in using-spec-driven-tdd spec-driven-tdd simplify; do
  f="$ROOT/skills/$skill/SKILL.md"
  if [ -f "$f" ]; then
    head=$(sed -n '1,10p' "$f")
    assert_contains "$head" "^name: $skill" "$skill has matching name"
    assert_contains "$head" "^description: " "$skill has a description"
  else
    echo "  FAIL: $f missing"; FAIL=$((FAIL + 1))
  fi
done
finish
