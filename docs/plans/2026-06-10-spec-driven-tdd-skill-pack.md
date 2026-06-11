# spec-driven-tdd Skill-Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an installable, multi-harness skill-pack that orchestrates OpenSpec planning + Superpowers execution discipline into one delivery loop.

**Architecture:** A Superpowers-style plugin: a SessionStart hook injects a small entry skill (`using-spec-driven-tdd`) that points at an on-demand orchestrator skill (`spec-driven-tdd`). The orchestrator composes installed skills by name (depend, not vendor); the one vendored skill is a portable `simplify`. Per-harness manifests + context files give parity across Claude Code, Codex, Cursor, Gemini, opencode.

**Tech Stack:** Bash (hooks), JSON (manifests), Markdown (skills/docs), bash test scripts with a tiny assert harness; `python3` for JSON validation in tests.

**Repo root:** the repository root (already git-init'd; design committed under `docs/specs/`).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `tests/test-helpers.sh` | assert helpers + pass/fail counters |
| `tests/run-all.sh` | run every `tests/test-*.sh`, aggregate result |
| `tests/test-session-start.sh` | verify hook emits correct JSON per harness |
| `tests/test-manifests.sh` | verify every JSON manifest is valid + has required fields |
| `tests/test-skills-structure.sh` | verify each SKILL.md has `name` + `description` frontmatter |
| `hooks/run-hook.cmd` | polyglot wrapper (Windows cmd + Unix bash) |
| `hooks/session-start` | read entry skill, emit per-harness JSON context |
| `hooks/hooks.json` | Claude Code SessionStart manifest |
| `hooks/hooks-cursor.json` | Cursor SessionStart manifest |
| `.claude-plugin/plugin.json` | Claude Code plugin manifest |
| `.codex-plugin/plugin.json` | Codex plugin manifest |
| `.cursor-plugin/plugin.json` | Cursor plugin manifest |
| `gemini-extension.json` | Gemini extension manifest |
| `.opencode/INSTALL.md` | opencode install notes |
| `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` | per-harness context files |
| `skills/using-spec-driven-tdd/SKILL.md` | entry skill (injected by hook) |
| `skills/spec-driven-tdd/SKILL.md` | the orchestrator workflow |
| `skills/simplify/SKILL.md` | vendored portable quality pass |
| `docs/workflow.md` | the lifecycle in detail |
| `docs/dependencies.md` | required installs + degradation rules |
| `docs/installation.md` | per-harness install steps |
| `docs/supported-tools.md` | harness support matrix |
| `README.md` / `LICENSE` / `package.json` | repo meta |

Convention: every commit uses `git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit`.

---

## Task 1: Test harness

**Files:**
- Create: `tests/test-helpers.sh`
- Create: `tests/run-all.sh`

- [ ] **Step 1: Write the helpers**

`tests/test-helpers.sh`:

```bash
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
```

- [ ] **Step 2: Write the runner**

`tests/run-all.sh`:

```bash
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
```

- [ ] **Step 3: Make executable and verify runner works with no tests yet**

Run: `chmod +x tests/*.sh && bash tests/run-all.sh`
Expected: exits 0, prints nothing between headers (no `test-*.sh` besides helpers/run-all match the `test-*` glob — note `test-helpers.sh` matches, so it runs but defines only functions and exits 0).

- [ ] **Step 4: Commit**

```bash
git add tests/test-helpers.sh tests/run-all.sh
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "test: add bash test harness"
```

---

## Task 2: SessionStart hook (`session-start`)

The hook reads the entry skill and prints JSON whose key depends on the harness env vars. This is the only nontrivial logic in the pack, so it is built test-first.

**Files:**
- Create: `tests/test-session-start.sh`
- Create: `hooks/session-start`
- Create (fixture used by the test): `skills/using-spec-driven-tdd/SKILL.md` is authored in Task 7; for this task the test creates a temporary entry-skill fixture so the hook can be tested in isolation.

- [ ] **Step 1: Write the failing test**

`tests/test-session-start.sh`:

```bash
#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOK="$ROOT/hooks/session-start"

echo "Test: session-start emits per-harness JSON"

# Claude Code shape
out_claude=$(CLAUDE_PLUGIN_ROOT="$ROOT" bash "$HOOK" 2>/dev/null)
assert_json_valid "$out_claude" "claude output is valid JSON"
assert_json_path "$out_claude" "'additionalContext' in d.get('hookSpecificOutput', {})" "claude uses hookSpecificOutput.additionalContext"
assert_contains "$out_claude" "using-spec-driven-tdd" "claude context mentions the entry skill"

# Cursor shape
out_cursor=$(CURSOR_PLUGIN_ROOT="$ROOT" bash "$HOOK" 2>/dev/null)
assert_json_valid "$out_cursor" "cursor output is valid JSON"
assert_json_path "$out_cursor" "'additional_context' in d" "cursor uses top-level additional_context"

# Copilot / SDK-standard shape
out_copilot=$(COPILOT_CLI=1 CLAUDE_PLUGIN_ROOT="$ROOT" bash "$HOOK" 2>/dev/null)
assert_json_path "$out_copilot" "'additionalContext' in d" "copilot uses top-level additionalContext"

finish
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-session-start.sh`
Expected: FAIL — `hooks/session-start` does not exist yet (assertions fail / non-JSON empty output).

- [ ] **Step 3: Implement the hook**

`hooks/session-start`:

```bash
#!/usr/bin/env bash
# SessionStart hook for the spec-driven-tdd pack.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

entry_content=$(cat "${PLUGIN_ROOT}/skills/using-spec-driven-tdd/SKILL.md" 2>&1 \
  || echo "Error reading using-spec-driven-tdd skill")

escape_for_json() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

entry_escaped=$(escape_for_json "$entry_content")
session_context="<EXTREMELY_IMPORTANT>\nYou have the spec-driven-tdd workflow.\n\n**Below is the full content of your 'using-spec-driven-tdd' entry skill. Invoke the 'spec-driven-tdd' skill when implementing an OpenSpec change.**\n\n${entry_escaped}\n</EXTREMELY_IMPORTANT>"

if [ -n "${CURSOR_PLUGIN_ROOT:-}" ]; then
  printf '{\n  "additional_context": "%s"\n}\n' "$session_context"
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -z "${COPILOT_CLI:-}" ]; then
  printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context"
else
  printf '{\n  "additionalContext": "%s"\n}\n' "$session_context"
fi

exit 0
```

- [ ] **Step 4: Create a minimal entry-skill stub so the hook has something to read**

`skills/using-spec-driven-tdd/SKILL.md` (stub; final content authored in Task 7):

```markdown
---
name: using-spec-driven-tdd
description: Entry skill for the spec-driven-tdd pack
---

Invoke the spec-driven-tdd skill when implementing an OpenSpec change.
```

- [ ] **Step 5: Run test to verify it passes**

Run: `chmod +x hooks/session-start && bash tests/test-session-start.sh`
Expected: PASS — `RESULT: 6 passed, 0 failed`.

- [ ] **Step 6: Commit**

```bash
git add hooks/session-start skills/using-spec-driven-tdd/SKILL.md tests/test-session-start.sh
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "feat: session-start hook with per-harness JSON output"
```

---

## Task 3: Polyglot wrapper (`run-hook.cmd`)

**Files:**
- Modify: `tests/test-session-start.sh:end` (add a wrapper assertion)
- Create: `hooks/run-hook.cmd`

- [ ] **Step 1: Add the failing assertion**

Append to `tests/test-session-start.sh` immediately before the `finish` line:

```bash
# run-hook.cmd should dispatch to the named script on Unix
out_wrap=$(CLAUDE_PLUGIN_ROOT="$ROOT" bash "$ROOT/hooks/run-hook.cmd" session-start 2>/dev/null)
assert_json_valid "$out_wrap" "run-hook.cmd dispatches session-start (valid JSON)"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-session-start.sh`
Expected: FAIL — `hooks/run-hook.cmd` does not exist.

- [ ] **Step 3: Implement the wrapper**

`hooks/run-hook.cmd` (polyglot; Windows batch branch + Unix bash branch):

```bash
: << 'CMDBLOCK'
@echo off
REM Cross-platform polyglot wrapper for hook scripts.
REM On Windows: cmd.exe runs this batch portion, which finds and calls bash.
REM On Unix: bash interprets it as a script (: is a no-op).
REM Usage: run-hook.cmd <script-name> [args...]

if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)
set "HOOK_DIR=%~dp0"
if exist "C:\Program Files\Git\bin\bash.exe" (
    "C:\Program Files\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)
where bash >nul 2>nul
if %ERRORLEVEL% equ 0 (
    bash "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)
exit /b 0
CMDBLOCK

# Unix: run the named script directly
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `chmod +x hooks/run-hook.cmd && bash tests/test-session-start.sh`
Expected: PASS — `RESULT: 7 passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add hooks/run-hook.cmd tests/test-session-start.sh
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "feat: polyglot run-hook.cmd wrapper"
```

---

## Task 4: Hook manifests

**Files:**
- Create: `tests/test-manifests.sh`
- Create: `hooks/hooks.json`
- Create: `hooks/hooks-cursor.json`

- [ ] **Step 1: Write the failing test**

`tests/test-manifests.sh`:

```bash
#!/usr/bin/env bash
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Test: all JSON manifests valid"
for f in \
  hooks/hooks.json \
  hooks/hooks-cursor.json \
  .claude-plugin/plugin.json \
  .codex-plugin/plugin.json \
  .cursor-plugin/plugin.json \
  gemini-extension.json \
  package.json
do
  if [ -f "$ROOT/$f" ]; then
    assert_json_valid "$(cat "$ROOT/$f")" "$f is valid JSON"
  else
    echo "  FAIL: $f missing"; FAIL=$((FAIL + 1))
  fi
done

# plugin manifests must carry the pack name
for f in .claude-plugin/plugin.json .codex-plugin/plugin.json .cursor-plugin/plugin.json gemini-extension.json; do
  assert_json_path "$(cat "$ROOT/$f")" "d.get('name') == 'spec-driven-tdd'" "$f name is spec-driven-tdd"
done

finish
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-manifests.sh`
Expected: FAIL — manifests do not exist yet.

- [ ] **Step 3: Create the two hook manifests**

`hooks/hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
            "async": false
          }
        ]
      }
    ]
  }
}
```

`hooks/hooks-cursor.json`:

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [
      {
        "command": "./hooks/run-hook.cmd session-start"
      }
    ]
  }
}
```

- [ ] **Step 4: Partial run (manifests valid, plugin manifests still missing)**

Run: `bash tests/test-manifests.sh`
Expected: hook manifests pass; `.claude-plugin/...` etc. still FAIL (created in Task 5). This is expected — Task 5 completes this test.

- [ ] **Step 5: Commit**

```bash
git add hooks/hooks.json hooks/hooks-cursor.json tests/test-manifests.sh
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "feat: SessionStart hook manifests (claude + cursor)"
```

---

## Task 5: Per-harness plugin manifests

**Files:**
- Create: `.claude-plugin/plugin.json`
- Create: `.codex-plugin/plugin.json`
- Create: `.cursor-plugin/plugin.json`
- Create: `gemini-extension.json`
- Create: `package.json`

- [ ] **Step 1: Create the manifests**

`.claude-plugin/plugin.json`:

```json
{
  "name": "spec-driven-tdd",
  "description": "Plan and track in OpenSpec; implement with TDD, simplify, and code review. An orchestrator skill-pack.",
  "version": "0.1.0",
  "author": { "name": "strelov1", "email": "strelov1@gmail.com" },
  "license": "MIT",
  "keywords": ["openspec", "tdd", "spec-driven", "workflow", "code-review"],
  "skills": "./skills/",
  "hooks": "./hooks/hooks.json"
}
```

`.cursor-plugin/plugin.json` (same fields, Cursor hook manifest):

```json
{
  "name": "spec-driven-tdd",
  "description": "Plan and track in OpenSpec; implement with TDD, simplify, and code review. An orchestrator skill-pack.",
  "version": "0.1.0",
  "author": { "name": "strelov1", "email": "strelov1@gmail.com" },
  "license": "MIT",
  "skills": "./skills/",
  "hooks": "./hooks/hooks-cursor.json"
}
```

`.codex-plugin/plugin.json`:

```json
{
  "name": "spec-driven-tdd",
  "description": "Plan and track in OpenSpec; implement with TDD, simplify, and code review. An orchestrator skill-pack.",
  "version": "0.1.0",
  "author": { "name": "strelov1", "email": "strelov1@gmail.com" },
  "license": "MIT",
  "skills": "./skills/"
}
```

`gemini-extension.json`:

```json
{
  "name": "spec-driven-tdd",
  "description": "Plan and track in OpenSpec; implement with TDD, simplify, and code review.",
  "version": "0.1.0",
  "contextFileName": "GEMINI.md"
}
```

`package.json`:

```json
{
  "name": "spec-driven-tdd",
  "version": "0.1.0",
  "description": "Orchestrator skill-pack fusing OpenSpec planning with Superpowers execution discipline.",
  "license": "MIT",
  "scripts": {
    "test": "bash tests/run-all.sh"
  }
}
```

- [ ] **Step 2: Run manifest test to verify it passes**

Run: `bash tests/test-manifests.sh`
Expected: PASS — every manifest valid + named `spec-driven-tdd`.

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json gemini-extension.json package.json
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "feat: per-harness plugin manifests + package.json"
```

---

## Task 6: Skill structure test + context files

**Files:**
- Create: `tests/test-skills-structure.sh`
- Create: `CLAUDE.md`
- Create: `AGENTS.md`
- Create: `GEMINI.md`

- [ ] **Step 1: Write the failing skill-structure test**

`tests/test-skills-structure.sh`:

```bash
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/test-skills-structure.sh`
Expected: FAIL — `spec-driven-tdd` and `simplify` skills missing; `using-spec-driven-tdd` still the Task 2 stub (name passes, but final content comes in Task 7).

- [ ] **Step 3: Create the three context files**

`CLAUDE.md`:

```markdown
# spec-driven-tdd

This repo is a skill-pack. When implementing an OpenSpec change, invoke the
`spec-driven-tdd` skill and follow its lifecycle: plan in OpenSpec, isolate in a
worktree, implement each task via TDD → simplify → review, then finish + archive.

See `skills/spec-driven-tdd/SKILL.md` for the full workflow and
`docs/dependencies.md` for what must be installed.
```

`AGENTS.md` (Codex / generic): identical body to `CLAUDE.md`.

`GEMINI.md` (referenced by `gemini-extension.json`): identical body to `CLAUDE.md`.

- [ ] **Step 4: Commit**

```bash
git add tests/test-skills-structure.sh CLAUDE.md AGENTS.md GEMINI.md
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "feat: context files + skill-structure test"
```

---

## Task 7: Entry skill (`using-spec-driven-tdd`)

Replace the Task 2 stub with the real entry skill — the `using-superpowers`
analogue: tiny, always injected, establishes the invocation discipline.

**Files:**
- Modify: `skills/using-spec-driven-tdd/SKILL.md`

- [ ] **Step 1: Write the full entry skill**

`skills/using-spec-driven-tdd/SKILL.md`:

```markdown
---
name: using-spec-driven-tdd
description: Use when implementing an OpenSpec change - establishes the spec-driven-tdd delivery discipline and when to invoke the workflow
---

# Using spec-driven-tdd

You have the **spec-driven-tdd** workflow: plan and track in OpenSpec, implement
with Superpowers discipline (TDD, simplify, review), finish and archive.

## The rule

When you are about to implement an OpenSpec change — or the user asks to build,
apply, or work through a change — invoke the `spec-driven-tdd` skill BEFORE
writing code, and follow its steps rather than improvising.

If a 1% chance it applies, invoke it. Knowing the lifecycle is not the same as
following it.

## What it composes

- **Plan / track:** OpenSpec (`/opsx:propose`, `/opsx:apply`, `/opsx:archive`).
- **Execute:** Superpowers (`test-driven-development`, `requesting-code-review`,
  `receiving-code-review`, `systematic-debugging`, `using-git-worktrees`,
  `verification-before-completion`, `finishing-a-development-branch`) plus this
  pack's `simplify` skill.

Dependencies and graceful degradation: see `docs/dependencies.md`.

Invoke `spec-driven-tdd` now if you are starting implementation.
```

- [ ] **Step 2: Re-run structure + session-start tests**

Run: `bash tests/test-skills-structure.sh && bash tests/test-session-start.sh`
Expected: skill-structure still passes for `using-spec-driven-tdd`; session-start still passes (entry content now richer, still mentions the name).

- [ ] **Step 3: Commit**

```bash
git add skills/using-spec-driven-tdd/SKILL.md
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "feat: real using-spec-driven-tdd entry skill"
```

---

## Task 8: Orchestrator skill (`spec-driven-tdd`)

**Files:**
- Create: `skills/spec-driven-tdd/SKILL.md`

- [ ] **Step 1: Write the orchestrator skill**

`skills/spec-driven-tdd/SKILL.md`:

```markdown
---
name: spec-driven-tdd
description: Use when implementing an OpenSpec change - orchestrates OpenSpec planning and task tracking with Superpowers TDD, simplification, and code review
---

# spec-driven-tdd

Plan and track in OpenSpec. Implement with Superpowers discipline. One change at
a time, one task at a time.

**Core principle:** OpenSpec owns *what* and *progress*; the execution skills own
*how*. A task is done only after its review is clean — not at green tests.

## Dependencies

Requires OpenSpec CLI + Superpowers installed. If a referenced skill or command
is unavailable, say so and fall back per `docs/dependencies.md` — never silently
skip a step. `/code-review` is a Claude-Code-only optional enhancement.

## Lifecycle

### 1. Plan (OpenSpec)

If no change exists for the work, run `/opsx:propose` (it uses `brainstorming`
to shape scope, then writes proposal/design/tasks). OpenSpec is the single
source of truth for scope and the task list. Do not invent tasks outside it.

### 2. Isolate (worktree)

Before touching code, invoke `using-git-worktrees` to create an isolated
worktree for the change so the main workspace stays clean. (Pairs with
`finishing-a-development-branch` at the end.)

### 3. Implement — per-task loop

Get the task list and context via `/opsx:apply` (read every `contextFiles`
path). Then, for EACH pending task, run this micro-cycle:

1. **RED** — invoke `test-driven-development`: write a failing test first. No
   production code without a failing test.
2. **GREEN** — minimal code to pass. If a test fails unexpectedly, invoke
   `systematic-debugging` before guessing.
3. **REFACTOR** — unit-local cleanup under green tests.
4. **simplify** — invoke this pack's `simplify` skill for a diff-wide quality
   pass; it applies edits.
5. **Re-run tests** — they must stay green after simplify.
6. **Review** — invoke `requesting-code-review` on the task's diff; use
   `receiving-code-review` to act on it. On Claude Code you may additionally run
   `/code-review`. Fix Critical + Important before continuing.
7. **Mark done** — only now flip the task `- [ ]` → `- [x]` in the OpenSpec
   tasks file.

**Optional mode — large changes:** instead of the inline loop, invoke
`subagent-driven-development` to dispatch each task to a fresh subagent with
per-task review. Use `dispatching-parallel-agents` when tasks are independent.

Pause and ask if a task is ambiguous or implementation reveals a design issue
(then suggest updating the OpenSpec artifacts).

### 4. Finish

When all tasks are `[x]`:

1. `verification-before-completion` — confirm the change actually works.
2. `finishing-a-development-branch` — integrate the worktree's branch.
3. `/opsx:archive` then `/opsx:sync` — close tracking and update main specs.

## Checklist

- [ ] Change selected/created in OpenSpec
- [ ] Worktree created
- [ ] Every task ran RED→GREEN→REFACTOR→simplify→review before `[x]`
- [ ] All tasks `[x]`
- [ ] Verified, branch finished, change archived + synced
```

- [ ] **Step 2: Run structure test**

Run: `bash tests/test-skills-structure.sh`
Expected: `spec-driven-tdd` name + description assertions PASS (simplify still missing → its lines FAIL until Task 9).

- [ ] **Step 3: Commit**

```bash
git add skills/spec-driven-tdd/SKILL.md
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "feat: spec-driven-tdd orchestrator skill"
```

---

## Task 9: Vendored `simplify` skill

Adapted from the `code-simplifier` agent (claude-plugins-official, MIT),
language-agnostic, JS/React specifics removed.

**Files:**
- Create: `skills/simplify/SKILL.md`

- [ ] **Step 1: Write the simplify skill**

`skills/simplify/SKILL.md`:

```markdown
---
name: simplify
description: Use after tests pass and before code review - a portable quality pass that simplifies recently changed code while preserving behavior
---

# simplify

A portable quality pass. Refine recently modified code for clarity, consistency,
and maintainability **without changing behavior**. Quality only — this does not
hunt for bugs (that is the review step).

Adapted from the `code-simplifier` agent; works on any harness.

## Principles

1. **Preserve functionality** — change how the code does it, never what it does.
   All outputs and behaviors stay identical.
2. **Apply project standards** — read the project's context file (`CLAUDE.md` /
   `AGENTS.md` / `GEMINI.md`) and follow its conventions, instead of imposing
   any fixed style.
3. **Enhance clarity** — reduce unnecessary nesting and complexity, remove
   redundant code and dead abstractions, improve names, consolidate related
   logic, drop comments that merely restate the code. Avoid nested ternaries —
   prefer if/else or switch. Explicit beats clever.
4. **Maintain balance** — do not over-simplify in ways that hurt readability,
   debuggability, or extension. Do not collapse separate concerns into one unit.
   Never trade readability for fewer lines.
5. **Focus scope** — only code touched in the current task, unless told to widen.

## Process

1. Identify the code changed in this task.
2. Apply the refinements above.
3. Re-run the tests — they MUST stay green. If any fail, you changed behavior;
   revert that refinement.
4. Hand the cleaned diff to the review step.
```

- [ ] **Step 2: Run the full suite**

Run: `bash tests/run-all.sh`
Expected: PASS — all tests green (`test-skills-structure.sh` now covers all three skills; manifests + session-start all pass).

- [ ] **Step 3: Commit**

```bash
git add skills/simplify/SKILL.md
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "feat: vendored portable simplify skill"
```

---

## Task 10: opencode adapter

**Files:**
- Create: `.opencode/INSTALL.md`

- [ ] **Step 1: Write the opencode install note**

`.opencode/INSTALL.md`:

```markdown
# opencode

opencode discovers skills under `skills/` and reads `AGENTS.md` as its context
file. To install:

\`\`\`bash
git clone https://github.com/strelov1/spec-driven-tdd.git ~/.config/opencode/plugins/spec-driven-tdd
\`\`\`

SessionStart context injection uses the same `hooks/session-start` script;
opencode invokes it via the SDK-standard top-level `additionalContext` shape
(the hook's default branch). No harness-specific env var is required.
```

- [ ] **Step 2: Commit**

```bash
git add .opencode/INSTALL.md
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "docs: opencode adapter install note"
```

---

## Task 11: Documentation

**Files:**
- Create: `docs/workflow.md`
- Create: `docs/dependencies.md`
- Create: `docs/installation.md`
- Create: `docs/supported-tools.md`

- [ ] **Step 1: `docs/workflow.md`**

```markdown
# Workflow

The lifecycle the `spec-driven-tdd` skill enforces.

| Phase | Tool | Rule |
|-------|------|------|
| Plan | `/opsx:propose` (+ `brainstorming`) | OpenSpec owns scope + task list |
| Isolate | `using-git-worktrees` | one change → one worktree |
| Implement (per task) | `test-driven-development` → `simplify` → `requesting-code-review` + `receiving-code-review` | RED before code; `[x]` only after clean review |
| Finish | `verification-before-completion` → `finishing-a-development-branch` → `/opsx:archive` + `/opsx:sync` | tracking closes in OpenSpec |

Per-task micro-cycle: RED → GREEN → REFACTOR → simplify → re-run tests → review
→ fix Critical/Important → mark `[x]`.

Optional: `subagent-driven-development` (large changes),
`dispatching-parallel-agents` (independent tasks).
```

- [ ] **Step 2: `docs/dependencies.md`**

```markdown
# Dependencies

| Dependency | Required? | Provides |
|------------|-----------|----------|
| OpenSpec CLI + initialized project | Yes | `/opsx:*`, change/task tracking |
| Superpowers | Yes | TDD, code review, debugging, worktrees, finishing, brainstorming |
| `simplify` skill | Bundled | quality pass (ships in this pack) |
| Claude Code `/code-review` | Optional | extra built-in bug pass (CC only) |

## Degradation

- The quality pass is bundled, so it never degrades across harnesses.
- Bug review defaults to the portable `requesting-code-review`. `/code-review`
  is an optional Claude-Code-only addition.
- If OpenSpec or Superpowers is missing, the orchestrator must say so and stop,
  not silently skip steps.
```

- [ ] **Step 3: `docs/installation.md`**

```markdown
# Installation

Clone the pack, then register it with your harness.

\`\`\`bash
git clone https://github.com/strelov1/spec-driven-tdd.git
\`\`\`

- **Claude Code:** install as a plugin (uses `.claude-plugin/plugin.json` +
  `hooks/hooks.json`). Ensure OpenSpec and Superpowers are also installed.
- **Cursor:** uses `.cursor-plugin/plugin.json` + `hooks/hooks-cursor.json`.
- **Codex:** uses `.codex-plugin/plugin.json` + `AGENTS.md`.
- **Gemini:** uses `gemini-extension.json` + `GEMINI.md`.
- **opencode:** see `.opencode/INSTALL.md`.
```

- [ ] **Step 4: `docs/supported-tools.md`**

```markdown
# Supported tools

| Harness | Manifest | Context file | Hook manifest |
|---------|----------|--------------|---------------|
| Claude Code | `.claude-plugin/plugin.json` | `CLAUDE.md` | `hooks/hooks.json` |
| Cursor | `.cursor-plugin/plugin.json` | `CLAUDE.md` | `hooks/hooks-cursor.json` |
| Codex | `.codex-plugin/plugin.json` | `AGENTS.md` | — |
| Gemini | `gemini-extension.json` | `GEMINI.md` | — |
| opencode | `skills/` discovery | `AGENTS.md` | `hooks/session-start` (default shape) |

All harnesses share `skills/` and `hooks/session-start`.
```

- [ ] **Step 5: Commit**

```bash
git add docs/workflow.md docs/dependencies.md docs/installation.md docs/supported-tools.md
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "docs: workflow, dependencies, installation, supported-tools"
```

---

## Task 12: README + LICENSE

**Files:**
- Create: `README.md`
- Create: `LICENSE`

- [ ] **Step 1: `README.md`**

```markdown
# spec-driven-tdd

An installable, multi-harness skill-pack that fuses **OpenSpec** (planning +
task tracking) with **Superpowers** (TDD, simplify, code review) into one
delivery loop.

Plan in OpenSpec → isolate in a worktree → implement each task via
TDD → simplify → review → finish and archive. A task is done only after a clean
review, not at green tests.

- Composes existing skills by name (depend, not vendor). The only vendored skill
  is the portable `simplify`.
- Works across Claude Code, Codex, Cursor, Gemini, and opencode.

## Install

See [docs/installation.md](docs/installation.md). Requires OpenSpec and
Superpowers — see [docs/dependencies.md](docs/dependencies.md).

## Workflow

See [docs/workflow.md](docs/workflow.md).

## Test

\`\`\`bash
npm test   # or: bash tests/run-all.sh
\`\`\`

## License

MIT
```

- [ ] **Step 2: `LICENSE`**

Create a standard MIT license, copyright `2026 strelov1`.

- [ ] **Step 3: Final full suite run**

Run: `bash tests/run-all.sh`
Expected: PASS — all tests green.

- [ ] **Step 4: Commit**

```bash
git add README.md LICENSE
git -c user.name="strelov1" -c user.email="strelov1@gmail.com" commit -m "docs: README + MIT license"
```

---

## Self-Review

**Spec coverage:**
- Repo layout (design §Architecture) → Tasks 2–12 create every listed file. ✓
- Auto-load via SessionStart hook + polyglot wrapper → Tasks 2, 3, 4. ✓
- Entry skill = `using-superpowers` analogue → Task 7. ✓
- Orchestrated lifecycle (plan/isolate/per-task/finish) → Task 8. ✓
- Vendored portable `simplify` → Task 9. ✓
- Depend-not-vendor policy (skills invoked by name) → encoded in Task 8 body. ✓
- Cross-harness manifests/context files → Tasks 5, 6, 10. ✓
- Degradation rules + dependencies → Task 11 (`docs/dependencies.md`) + Task 8 body. ✓
- Multi-harness parity (CC/Codex/Cursor/Gemini/opencode) → Tasks 5, 6, 10, 11. ✓

**Placeholder scan:** Task 6 (`AGENTS.md`/`GEMINI.md` = "identical body to CLAUDE.md") and Task 12 Step 2 (standard MIT text) reference well-known/identical content rather than re-printing it — acceptable, not ambiguous. No TBD/TODO steps. ✓

**Type consistency:** pack name `spec-driven-tdd` and skill names (`using-spec-driven-tdd`, `spec-driven-tdd`, `simplify`) are used identically across hook, manifests, tests, and skills. Hook env-var keys (`additional_context` / `hookSpecificOutput.additionalContext` / `additionalContext`) match the test assertions in Task 2. ✓

## Future seams (not in this plan)
- LLM-integration tests (Superpowers-style `run_claude`) for skill triggering.
- OpenSpec `config.yaml` `tasks` rules encoding the TDD discipline.
- Marketplace distribution.
