#!/usr/bin/env bash
# Shared assert helpers for spec-driven-tdd pack tests.
set -uo pipefail

PASS=0
FAIL=0

assert_contains() {
  local haystack="$1" needle="$2" msg="$3"
  if printf '%s' "$haystack" | grep -Eq "$needle"; then
    echo "  ok: $msg"; PASS=$((PASS + 1))
  else
    echo "  FAIL: $msg (missing /$needle/)"; FAIL=$((FAIL + 1))
  fi
}

assert_json_valid() {
  local input="$1" msg="$2"
  if printf '%s' "$input" | python3 -c 'import json,sys; json.load(sys.stdin)' 2>/dev/null; then
    echo "  ok: $msg"; PASS=$((PASS + 1))
  else
    echo "  FAIL: $msg (invalid JSON)"; FAIL=$((FAIL + 1))
  fi
}

assert_json_path() {
  # assert_json_path <json> <python-expr on obj `d`> <msg>
  local input="$1" expr="$2" msg="$3"
  if printf '%s' "$input" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if ($expr) else 1)" 2>/dev/null; then
    echo "  ok: $msg"; PASS=$((PASS + 1))
  else
    echo "  FAIL: $msg"; FAIL=$((FAIL + 1))
  fi
}

finish() {
  echo ""
  echo "RESULT: $PASS passed, $FAIL failed"
  [ "$FAIL" -eq 0 ]
}
