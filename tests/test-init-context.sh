#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Test: init-context bootstraps AGENTS.md + CLAUDE.md/GEMINI.md symlinks"

# --- fresh target dir: all three created ---
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

out="$(node "$ROOT/bin/cli.js" init-context --dir "$TMP" 2>&1)"
rc=$?
assert_contains "$rc" "^0$" "fresh dir: init-context exits 0"

if [ -f "$TMP/AGENTS.md" ] && [ ! -L "$TMP/AGENTS.md" ]; then
  echo "  ok: AGENTS.md created as a regular file"; PASS=$((PASS + 1))
else
  echo "  FAIL: AGENTS.md missing or not a regular file"; FAIL=$((FAIL + 1))
fi

base="$(basename "$TMP")"
assert_contains "$(cat "$TMP/AGENTS.md")" "$base" "AGENTS.md heading names the target dir"

for f in CLAUDE.md GEMINI.md; do
  if [ -L "$TMP/$f" ] && [ "$(readlink "$TMP/$f")" = "AGENTS.md" ]; then
    echo "  ok: $f is a relative symlink to AGENTS.md"; PASS=$((PASS + 1))
  else
    echo "  FAIL: $f is not a symlink to AGENTS.md"; FAIL=$((FAIL + 1))
  fi
done

# --- re-run: everything already present, never overwritten, still exits 0 ---
before_agents="$(cat "$TMP/AGENTS.md")"
out2="$(node "$ROOT/bin/cli.js" init-context --dir "$TMP" 2>&1)"
rc2=$?
assert_contains "$rc2" "^0$" "re-run on fully-populated dir exits 0"
for f in AGENTS.md CLAUDE.md GEMINI.md; do
  assert_contains "$out2" "skipped: $f already exists" "re-run reports skipped: $f already exists"
done
if [ "$(cat "$TMP/AGENTS.md")" = "$before_agents" ]; then
  echo "  ok: AGENTS.md content unchanged by re-run"; PASS=$((PASS + 1))
else
  echo "  FAIL: AGENTS.md content changed by re-run"; FAIL=$((FAIL + 1))
fi

# --- existing regular CLAUDE.md with real content is never overwritten ---
TMP2="$(mktemp -d)"
printf 'real project instructions\n' > "$TMP2/CLAUDE.md"
out3="$(node "$ROOT/bin/cli.js" init-context --dir "$TMP2" 2>&1)"
rc3=$?
assert_contains "$rc3" "^0$" "existing regular CLAUDE.md: exits 0"
assert_contains "$out3" "skipped: CLAUDE.md already exists" "existing regular CLAUDE.md: reports skipped"
if [ "$(cat "$TMP2/CLAUDE.md")" = "real project instructions" ]; then
  echo "  ok: existing CLAUDE.md content preserved"; PASS=$((PASS + 1))
else
  echo "  FAIL: existing CLAUDE.md content was overwritten"; FAIL=$((FAIL + 1))
fi
if [ -f "$TMP2/AGENTS.md" ]; then
  echo "  ok: AGENTS.md still created alongside preserved CLAUDE.md"; PASS=$((PASS + 1))
else
  echo "  FAIL: AGENTS.md not created"; FAIL=$((FAIL + 1))
fi
rm -rf "$TMP2"

# --- existing symlink pointing elsewhere is never overwritten ---
TMP3="$(mktemp -d)"
printf 'other file\n' > "$TMP3/OTHER.md"
ln -s OTHER.md "$TMP3/GEMINI.md"
node "$ROOT/bin/cli.js" init-context --dir "$TMP3" >/tmp/init-context-out3.txt 2>&1
if [ "$(readlink "$TMP3/GEMINI.md")" = "OTHER.md" ]; then
  echo "  ok: existing GEMINI.md symlink to a different target is untouched"; PASS=$((PASS + 1))
else
  echo "  FAIL: existing GEMINI.md symlink was replaced"; FAIL=$((FAIL + 1))
fi
assert_contains "$(cat /tmp/init-context-out3.txt)" "skipped: GEMINI.md already exists" \
  "existing symlink-elsewhere GEMINI.md: reports skipped"
rm -rf "$TMP3" /tmp/init-context-out3.txt

# --- existing dangling symlink still counts as "exists" ---
TMP4="$(mktemp -d)"
ln -s does-not-exist.md "$TMP4/CLAUDE.md"
out4="$(node "$ROOT/bin/cli.js" init-context --dir "$TMP4" 2>&1)"
rc4=$?
assert_contains "$rc4" "^0$" "dangling symlink: exits 0"
assert_contains "$out4" "skipped: CLAUDE.md already exists" "dangling CLAUDE.md symlink: reports skipped"
if [ "$(readlink "$TMP4/CLAUDE.md")" = "does-not-exist.md" ]; then
  echo "  ok: dangling CLAUDE.md symlink is untouched"; PASS=$((PASS + 1))
else
  echo "  FAIL: dangling CLAUDE.md symlink was replaced"; FAIL=$((FAIL + 1))
fi
rm -rf "$TMP4"

# --- default target is cwd when --dir is omitted ---
TMP5="$(mktemp -d)"
out5="$(cd "$TMP5" && node "$ROOT/bin/cli.js" init-context 2>&1)"
rc5=$?
assert_contains "$rc5" "^0$" "no --dir: exits 0"
if [ -f "$TMP5/AGENTS.md" ]; then
  echo "  ok: no --dir defaults to cwd"; PASS=$((PASS + 1))
else
  echo "  FAIL: no --dir did not bootstrap cwd"; FAIL=$((FAIL + 1))
fi
rm -rf "$TMP5"

finish
