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

# re-install replaces the payload — a stale file from a previous install is gone
mkdir -p "$TMP/skills/zzz-stale"
echo stale > "$TMP/skills/zzz-stale/SKILL.md"
node "$ROOT/bin/cli.js" install --dir "$TMP" >/dev/null 2>&1
if [ ! -e "$TMP/skills/zzz-stale" ]; then
  echo "  ok: re-install removes stale payload"; PASS=$((PASS + 1))
else
  echo "  FAIL: stale payload survived re-install"; FAIL=$((FAIL + 1))
fi

# --skip-deps suppresses the dependency report
skip_out="$(node "$ROOT/bin/cli.js" install --dir "$(mktemp -d)" --skip-deps 2>&1)"
if printf '%s' "$skip_out" | grep -q 'Dependencies:'; then
  echo "  FAIL: --skip-deps still printed the dependency report"; FAIL=$((FAIL + 1))
else
  echo "  ok: --skip-deps suppresses the dependency report"; PASS=$((PASS + 1))
fi

# unknown command exits non-zero
node "$ROOT/bin/cli.js" bogus-cmd >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "  ok: unknown command exits non-zero"; PASS=$((PASS + 1))
else
  echo "  FAIL: unknown command exited 0"; FAIL=$((FAIL + 1))
fi

# --dir without a value is a usage error, not a silent default
node "$ROOT/bin/cli.js" install --dir >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "  ok: --dir without a value errors"; PASS=$((PASS + 1))
else
  echo "  FAIL: --dir without a value did not error"; FAIL=$((FAIL + 1))
fi

finish
