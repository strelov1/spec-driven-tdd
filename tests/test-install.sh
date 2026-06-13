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

# pack payload copied into the target — authored skills, hooks, plugin manifest,
# and the vendored Superpowers skills now ship as first-class top-level skills.
for f in \
  skills/spec-driven-tdd/SKILL.md \
  skills/using-spec-driven-tdd/SKILL.md \
  skills/simplify/SKILL.md \
  skills/test-driven-development/SKILL.md \
  skills/brainstorming/SKILL.md \
  skills/SUPERPOWERS-LICENSE \
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

# a vendored skill is copied as a WHOLE directory — a nested file must survive
# (guards against a non-recursive copy regression)
if [ -f "$TMP/skills/brainstorming/scripts/server.cjs" ]; then
  echo "  ok: vendored skill copied with its nested files intact"; PASS=$((PASS + 1))
else
  echo "  FAIL: vendored skill missing nested files"; FAIL=$((FAIL + 1))
fi

# no nested vendor/ directory leaks into the target
if [ ! -e "$TMP/skills/vendor" ]; then
  echo "  ok: no skills/vendor in target"; PASS=$((PASS + 1))
else
  echo "  FAIL: skills/vendor leaked into target"; FAIL=$((FAIL + 1))
fi

# hook stays executable after copy
if [ -x "$TMP/hooks/session-start" ]; then
  echo "  ok: hooks/session-start is executable"; PASS=$((PASS + 1))
else
  echo "  FAIL: hooks/session-start not executable"; FAIL=$((FAIL + 1))
fi

# dependency report names both prerequisites; Superpowers is now bundled
assert_contains "$out" "OpenSpec" "report mentions OpenSpec dependency"
assert_contains "$out" "Superpowers \(bundled" "report shows Superpowers as bundled"

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

# an unexpected extra positional argument is a usage error
node "$ROOT/bin/cli.js" install extra-arg >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "  ok: extra positional argument errors"; PASS=$((PASS + 1))
else
  echo "  FAIL: extra positional argument did not error"; FAIL=$((FAIL + 1))
fi

# the doctor command prints the dependency report
doctor_out="$(node "$ROOT/bin/cli.js" doctor 2>&1)"
assert_contains "$doctor_out" "Dependencies:" "doctor prints the dependency report"

# a non-claude harness gets its own next-steps line, not the claude one
codex_out="$(node "$ROOT/bin/cli.js" install --dir "$(mktemp -d)" --harness codex 2>&1)"
assert_contains "$codex_out" "codex: discovers skills under" "non-claude harness shows its own next steps"

finish
