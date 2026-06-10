# Installation

The pack ships as an npm package with an installer CLI. The installer stages the
skill-pack into a directory your harness reads and reports the two runtime
prerequisites.

## 1. Install the prerequisites

| Prerequisite | Channel | Command |
|--------------|---------|---------|
| **OpenSpec** | npm | pulled automatically as a dependency (or `npm i -g @fission-ai/openspec`) |
| **Superpowers** | Claude Code marketplace (no npm package) | `/plugin install superpowers@claude-plugins-official` |

OpenSpec is a real npm dependency of this package. Superpowers
([obra/superpowers](https://github.com/obra/superpowers)) is distributed **only**
through the Claude Code plugin marketplace — there is no npm package for it. Use
the official marketplace command above, or obra's own marketplace:

```text
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

See [dependencies.md](dependencies.md) for what each provides.

## 2. Run the installer

```bash
npx spec-driven-tdd install
```

This copies `skills/`, `hooks/`, the per-harness manifests, and the context
files into `~/.claude/plugins/spec-driven-tdd`, keeps the hooks executable, and
prints a dependency report (`OK` / `!!` per prerequisite).

Options:

```bash
npx spec-driven-tdd install --harness <claude|cursor|codex|gemini|opencode>
npx spec-driven-tdd install --dir <path>      # custom target directory
npx spec-driven-tdd doctor                    # just run the dependency report
```

## 3. Register with your harness

The installer prints the exact next step; per harness:

- **Claude Code / Cursor:** point the harness at the install dir, or register it
  as a local marketplace: `/plugin marketplace add ~/.claude/plugins/spec-driven-tdd`.
- **Codex:** uses `.codex-plugin/plugin.json` + `AGENTS.md` (static context, no hook).
- **Gemini:** uses `gemini-extension.json` + `GEMINI.md` (static context, no hook).
- **opencode:** discovers skills under the install dir's `skills/`; see
  `.opencode/INSTALL.md`.

## From source

```bash
git clone https://github.com/strelov1/spec-driven-tdd.git
cd spec-driven-tdd
node bin/cli.js install
```
