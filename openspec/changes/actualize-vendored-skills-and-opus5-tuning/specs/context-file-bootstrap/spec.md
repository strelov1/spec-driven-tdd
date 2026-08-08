## ADDED Requirements

### Requirement: `init-context` bootstraps a shared AGENTS.md

Running `npx spec-driven-tdd init-context [--dir <path>]` SHALL create an
`AGENTS.md` file in the target directory (default: current working directory)
when one does not already exist, containing a minimal generic scaffold with no
project-specific or spec-driven-tdd-specific content.

#### Scenario: AGENTS.md is created when missing
- **WHEN** `init-context` runs against a directory with no `AGENTS.md`
- **THEN** an `AGENTS.md` file is created containing a heading derived from
  the target directory's basename and a line explaining that `CLAUDE.md` and
  `GEMINI.md` are symlinks to it

#### Scenario: Existing AGENTS.md is left untouched
- **WHEN** `init-context` runs against a directory that already has an
  `AGENTS.md`
- **THEN** the existing file is not modified and the command prints
  `skipped: AGENTS.md already exists`

### Requirement: `init-context` symlinks CLAUDE.md and GEMINI.md to AGENTS.md

Running `init-context` SHALL create `CLAUDE.md` and `GEMINI.md` in the target
directory as same-directory relative symlinks pointing to `AGENTS.md`, when
each does not already exist as a file or symlink.

#### Scenario: CLAUDE.md and GEMINI.md are created as symlinks
- **WHEN** `init-context` runs against a directory with no `CLAUDE.md` or
  `GEMINI.md`
- **THEN** both are created as relative symlinks resolving to `AGENTS.md` in
  the same directory

#### Scenario: Existing CLAUDE.md or GEMINI.md is never overwritten
- **WHEN** `init-context` runs against a directory where `CLAUDE.md` (or
  `GEMINI.md`) already exists, whether as a regular file, a symlink to a
  different target, or a dangling symlink
- **THEN** that file is left untouched and the command prints
  `skipped: <name> already exists` instead of replacing it

### Requirement: `init-context` exits successfully unless an I/O error occurs

The command SHALL exit `0` when every one of `AGENTS.md`, `CLAUDE.md`, and
`GEMINI.md` ends the run either freshly created or already present, and SHALL
exit non-zero only on an unexpected I/O error.

#### Scenario: All three already present
- **WHEN** `init-context` runs against a directory where all three files
  already exist
- **THEN** the command prints a `skipped` line for each and exits `0`
