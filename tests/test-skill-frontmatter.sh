#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Test: every skill's YAML frontmatter parses"
for f in "$ROOT"/skills/*/SKILL.md; do
  assert_frontmatter_valid "$f" "skills/$(basename "$(dirname "$f")")/SKILL.md"
done

finish
