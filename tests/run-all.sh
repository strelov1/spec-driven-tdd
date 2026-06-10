#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
rc=0
for t in "$SCRIPT_DIR"/test-*.sh; do
  echo "=== $(basename "$t") ==="
  bash "$t" || rc=1
  echo ""
done
exit "$rc"
