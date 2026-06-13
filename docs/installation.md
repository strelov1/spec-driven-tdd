# Installation

Install the pack with the [`skills`](https://github.com/vercel-labs/skills) CLI —
it pulls every bundled skill straight from GitHub into your agent.

## 1. Install the prerequisite

OpenSpec powers the `/opsx:*` planning commands and is the one external
prerequisite:

```bash
npm i -g @fission-ai/openspec
```

The Superpowers skills are vendored into the pack as top-level skills, so they
install with everything else and need no marketplace step.

> If you already run the Superpowers marketplace plugin, skip the bundled skills
> whose description is prefixed `[Superpowers …]` — they duplicate the plugin.

See [dependencies.md](dependencies.md) for what each provides.

## 2. Install the skills

```bash
npx skills add strelov1/spec-driven-tdd
```

This adds the pack's skills — its own (`spec-driven-tdd`, `using-spec-driven-tdd`,
`simplify`) plus the vendored Superpowers set — into your agent's skills
directory, where the harness discovers them by their `name` + `description`
frontmatter.

## 3. How the workflow triggers

The thin `using-spec-driven-tdd` entry skill announces the workflow: when you
start an OpenSpec change it tells the agent to invoke the `spec-driven-tdd`
orchestrator before writing code. No extra setup is required — discovery of the
skill is enough.
