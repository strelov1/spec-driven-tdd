# Installation

The pack ships as an npm package with an installer CLI. The installer stages the
skill-pack into a directory your harness reads and reports the one runtime
prerequisite.

## 1. Install the prerequisite

| Prerequisite | Channel | Command |
|--------------|---------|---------|
| **OpenSpec** | npm | pulled automatically as a dependency (or `npm i -g @fission-ai/openspec`) |

OpenSpec is the only external prerequisite — a real npm dependency of this
package. The **Superpowers** skills
([obra/superpowers](https://github.com/obra/superpowers), MIT) are vendored into
the pack as top-level skills, so they install with everything else and need no
marketplace step.

> If you already run the Superpowers marketplace plugin, skip the bundled skills
> whose description is prefixed `[Superpowers …]` — they duplicate the plugin.

See [dependencies.md](dependencies.md) for what each provides.

## 2. Run the installer

```bash
npx spec-driven-tdd install
```

This copies `skills/` (the pack's own skills plus the vendored Superpowers set),
`hooks/`, the per-harness manifests, and the context files into
`~/.claude/plugins/spec-driven-tdd`, keeps the hooks executable, and prints a
dependency report (`OK` / `!!` per prerequisite).

The Superpowers skills are bundled as top-level skills, so the lifecycle works on
every harness without a marketplace step. If you also run the Superpowers
marketplace plugin, the bundled copies (description prefix `[Superpowers …]`)
duplicate it — remove either side to avoid two copies.

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
