# skill-distribution Specification

## Purpose
TBD - created by archiving change flatten-vendored-superpowers. Update Purpose after archive.
## Requirements
### Requirement: All bundled skills are registry-discoverable

Every skill the pack bundles SHALL live at the top level of `skills/` as
`skills/<name>/SKILL.md`, so a registry that discovers skills one directory deep
(e.g. `skills.sh`) surfaces all of them. The pack SHALL NOT nest bundled skills
under a non-discoverable subdirectory such as `skills/vendor/`.

#### Scenario: Registry surfaces every bundled skill
- **WHEN** the `skills.sh` registry scans the repository's `skills/` directory
- **THEN** it lists every bundled skill, including the vendored Superpowers
  skills, alongside `simplify`, `spec-driven-tdd`, and `using-spec-driven-tdd`

#### Scenario: No nested vendor directory remains
- **WHEN** the repository tree is inspected after the change
- **THEN** no `skills/vendor/` directory exists and each former vendored skill
  resolves at `skills/<name>/SKILL.md`

### Requirement: Vendored third-party skills carry provenance attribution

Each vendored Superpowers skill SHALL declare its third-party origin so the
duplicate-with-plugin risk is visible and the MIT license is honored. The skill's
`description` frontmatter SHALL begin with a provenance prefix naming the source
and version, and the MIT license SHALL be committed in the tree.

#### Scenario: Description carries the provenance prefix
- **WHEN** a vendored Superpowers skill's `SKILL.md` frontmatter is read
- **THEN** its `description` begins with `[Superpowers 5.1.0, MIT]`

#### Scenario: License is committed in the tree
- **WHEN** the repository tree is inspected
- **THEN** the Superpowers MIT license is present as a committed file at
  `skills/SUPERPOWERS-LICENSE`

### Requirement: Installer deploys all bundled skills uniformly

The installer SHALL deploy every top-level skill under `skills/` to the target
without branching on whether the Superpowers marketplace plugin is present. The
installer SHALL NOT contain a conditional vendored-fallback path.

#### Scenario: Installer copies all top-level skills
- **WHEN** `bin/cli.js install --dir <target>` runs
- **THEN** every `skills/<name>/SKILL.md` from the pack is copied to
  `<target>/skills/<name>/SKILL.md`, including the vendored Superpowers skills

#### Scenario: No conditional fallback branch
- **WHEN** the installer source is inspected
- **THEN** it contains no `deployVendored` function and no logic that strips a
  `skills/vendor` directory from the target

### Requirement: Refresh script updates the snapshot in place

The `vendor:superpowers` refresh script SHALL write the upstream snapshot into
the top-level `skills/` directory so re-running it updates the discoverable
skills directly, preserving the provenance prefix and license.

#### Scenario: Refresh writes to top-level skills
- **WHEN** `npm run vendor:superpowers` completes
- **THEN** each refreshed skill is written under `skills/<name>/` and the
  committed `skills/SUPERPOWERS-LICENSE` is present

