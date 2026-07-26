#!/usr/bin/env python3
"""Validate one SKILL.md's YAML frontmatter the way a registry parses it.

Exits 0 when the block parses and carries a `name` matching the skill's
directory plus a non-empty `description`, printing that description so callers
can assert on the parsed value rather than on quoting style; otherwise prints
the reason and exits 1. `skills add` skips any SKILL.md whose frontmatter fails
to parse, so an unquoted `description` silently drops the skill from every
install.
"""
import os
import sys

try:
    import yaml
except ImportError:
    sys.exit("PyYAML missing (pip3 install pyyaml)")

path = sys.argv[1]
text = open(path, encoding="utf-8").read()

if not text.startswith("---\n"):
    sys.exit("no frontmatter block")
end = text.find("\n---", 3)
if end == -1:
    sys.exit("unterminated frontmatter block")

try:
    meta = yaml.safe_load(text[4 : end + 1])
except yaml.YAMLError as exc:
    sys.exit("YAML parse error: " + " ".join(str(exc).split()))

if not isinstance(meta, dict):
    sys.exit("frontmatter is not a mapping")

expected = os.path.basename(os.path.dirname(path))
if meta.get("name") != expected:
    sys.exit(f"name is {meta.get('name')!r}, expected {expected!r}")
description = str(meta.get("description") or "").strip()
if not description:
    sys.exit("description is empty")

print(description)
