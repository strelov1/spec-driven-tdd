#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Skills authored by this pack.
PACK_SKILLS=(using-spec-driven-tdd spec-driven-tdd simplify)
# Superpowers skills vendored into this pack (flattened to top-level skills/).
VENDORED_SKILLS=(
  test-driven-development systematic-debugging requesting-code-review
  receiving-code-review verification-before-completion using-git-worktrees
  finishing-a-development-branch subagent-driven-development
  dispatching-parallel-agents brainstorming
)
PREFIX='[Superpowers 5.1.0, MIT]'

echo "Test: every bundled skill is top-level with name + description frontmatter"
for skill in "${PACK_SKILLS[@]}" "${VENDORED_SKILLS[@]}"; do
  f="$ROOT/skills/$skill/SKILL.md"
  if [ -f "$f" ]; then
    head=$(sed -n '1,12p' "$f")
    assert_contains "$head" "^name: $skill" "$skill has matching name"
    assert_contains "$head" "^description: " "$skill has a description"
  else
    echo "  FAIL: $f missing"; FAIL=$((FAIL + 1))
  fi
done

echo "Test: no nested skills/vendor directory remains"
if [ ! -e "$ROOT/skills/vendor" ]; then
  echo "  ok: skills/vendor removed"; PASS=$((PASS + 1))
else
  echo "  FAIL: skills/vendor still present"; FAIL=$((FAIL + 1))
fi

echo "Test: vendored skills carry the Superpowers provenance prefix"
for skill in "${VENDORED_SKILLS[@]}"; do
  desc=$(grep -m1 '^description: ' "$ROOT/skills/$skill/SKILL.md" 2>/dev/null || true)
  if printf '%s' "$desc" | grep -qF "description: $PREFIX"; then
    echo "  ok: $skill description carries provenance prefix"; PASS=$((PASS + 1))
  else
    echo "  FAIL: $skill description missing prefix '$PREFIX'"; FAIL=$((FAIL + 1))
  fi
done

echo "Test: Superpowers MIT license is committed in the tree"
if [ -f "$ROOT/skills/SUPERPOWERS-LICENSE" ]; then
  echo "  ok: skills/SUPERPOWERS-LICENSE present"; PASS=$((PASS + 1))
else
  echo "  FAIL: skills/SUPERPOWERS-LICENSE missing"; FAIL=$((FAIL + 1))
fi

finish
