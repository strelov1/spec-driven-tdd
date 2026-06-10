#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Test: npx installer stages the pack and reports dependencies"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

out="$(node "$ROOT/bin/cli.js" install --dir "$TMP" 2>&1)"
rc=$?

assert_contains "$rc" "^0$" "install exits 0"
assert_contains "$out" "spec-driven-tdd" "output names the pack"

# pack payload copied into the target
for f in \
  skills/spec-driven-tdd/SKILL.md \
  skills/using-spec-driven-tdd/SKILL.md \
  skills/simplify/SKILL.md \
  hooks/session-start \
  hooks/run-hook.cmd \
  .claude-plugin/plugin.json
do
  if [ -f "$TMP/$f" ]; then
    echo "  ok: copied $f"; PASS=$((PASS + 1))
  else
    echo "  FAIL: missing $f in target"; FAIL=$((FAIL + 1))
  fi
done

# hook stays executable after copy
if [ -x "$TMP/hooks/session-start" ]; then
  echo "  ok: hooks/session-start is executable"; PASS=$((PASS + 1))
else
  echo "  FAIL: hooks/session-start not executable"; FAIL=$((FAIL + 1))
fi

# dependency report names both prerequisites
assert_contains "$out" "OpenSpec" "report mentions OpenSpec dependency"
assert_contains "$out" "[Ss]uperpowers" "report mentions Superpowers dependency"

finish
