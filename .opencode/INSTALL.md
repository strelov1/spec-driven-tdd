# opencode

opencode discovers skills under `skills/` and reads `AGENTS.md` as its context
file. To install:

```bash
git clone https://github.com/strelov1/spec-driven-tdd.git ~/.config/opencode/plugins/spec-driven-tdd
```

SessionStart context injection uses the same `hooks/session-start` script;
opencode invokes it via the SDK-standard top-level `additionalContext` shape
(the hook's default branch). No harness-specific env var is required.
