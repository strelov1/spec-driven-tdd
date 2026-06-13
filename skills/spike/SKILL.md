---
name: spike
description: Use before planning a risky change - a throwaway feasibility experiment that answers "is this even possible?" cheaply and ends in a VALIDATED / PARTIAL / INVALIDATED verdict
---

# spike

A disposable feasibility experiment. When a change carries unproven technical
risk — an untested approach, an external API, an open "is this possible?" — spike
it **before** writing any OpenSpec artifacts. The point is to answer the risky
question for the price of a script, so an unviable idea is killed cheaply.

**Core principle:** the code is throwaway. A spike that needs cleanup was
over-built. Only the verdict survives.

## When to use

Risk-gated, not mandatory. Spike only when feasibility is genuinely unclear. If
the approach is obviously viable, skip straight to planning. Research enough to
pick an approach, then spike the *riskiest* unknown first — there is no point
prototyping the easy parts if the hard part does not work.

## Process

1. **Decompose** — frame 2–5 concrete feasibility questions (Given/When/Then),
   ordered by risk. The most dangerous unknown goes first.
2. **Align** — show the questions and the plan; let the user trim before you
   write code.
3. **Build minimal** — write the smallest runnable thing in a scratch location
   (`/tmp`, a REPL, a one-off `curl`) — **never** inside the change's worktree.
   Hardcode everything. No packaging, Docker, config, or build tooling. It is a
   spike.
4. **Observe** — run it and capture the real output. A spike with no observable
   result proved nothing.
5. **Verdict** — close with exactly one, plus a sentence of why:
   - **VALIDATED** — the approach works; proceed to plan the change.
   - **PARTIAL** — only a subset works; narrow scope to that subset, then plan.
   - **INVALIDATED** — the approach does not work; do not create the change.

## After the spike

Discard the scratch code. Hand the verdict back to the caller — in the
`spec-driven-tdd` Plan phase it gates whether `/opsx:propose` runs at all.
