## MODIFIED Requirements

### Requirement: Vendored third-party skills carry provenance attribution

Each vendored Superpowers skill SHALL declare its third-party origin so the
duplicate-with-plugin risk is visible and the MIT license is honored. The skill's
`description` frontmatter SHALL begin with a provenance prefix naming the source
and version, and the MIT license SHALL be committed in the tree.

#### Scenario: Description carries the provenance prefix
- **WHEN** a vendored Superpowers skill's `SKILL.md` frontmatter is read
- **THEN** its `description` begins with `[Superpowers 6.2.0, MIT]`

#### Scenario: License is committed in the tree
- **WHEN** the repository tree is inspected
- **THEN** the Superpowers MIT license is present as a committed file at
  `skills/SUPERPOWERS-LICENSE`
