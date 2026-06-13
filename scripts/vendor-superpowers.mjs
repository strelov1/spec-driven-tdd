#!/usr/bin/env node
// Reproducible sync of the Superpowers skills this pack vendors.
// Clones the pinned upstream tag into a temp dir and copies only the skills
// the orchestrator references, plus the MIT LICENSE the license requires us to
// ship. Output is committed as top-level skills/<name>/ (flattened so a registry
// discovers them) and distributed via npm — NOT a submodule (npx install does
// not fetch submodules).
//
// Offline fallback: set SUPERPOWERS_SRC=<path> to a local Superpowers checkout
// (a dir containing skills/ and LICENSE). When set, the script copies from that
// path instead of cloning. git clone remains the canonical online regen path.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '5.1.0';
const REPO = 'https://github.com/obra/superpowers';
const SKILLS = [
  'test-driven-development',
  'systematic-debugging',
  'requesting-code-review',
  'receiving-code-review',
  'verification-before-completion',
  'using-git-worktrees',
  'finishing-a-development-branch',
  'subagent-driven-development',
  'dispatching-parallel-agents',
  'brainstorming',
];

const HERE = path.dirname(fileURLToPath(import.meta.url));
// Vendored skills are flattened into the pack's top-level skills/ so a registry
// (e.g. skills.sh) discovers them. We touch only the SKILLS dirs below plus the
// two attribution files — never the whole skills/ directory.
const SKILLS_DIR = path.join(HERE, '..', 'skills');
const PREFIX = `[Superpowers ${VERSION}, MIT] `;

function clone(tag, into) {
  execFileSync('git', ['clone', '--depth', '1', '--branch', tag, REPO, into], {
    stdio: 'ignore',
  });
}

// Prepend the provenance prefix to a vendored skill's `description` so the
// third-party origin stays visible in the picker and survives regeneration.
function applyPrefix(skillMd) {
  const body = fs.readFileSync(skillMd, 'utf8');
  if (/^description:\s*\[Superpowers/m.test(body)) return;
  fs.writeFileSync(skillMd, body.replace(/^description:\s*(.*)$/m, `description: ${PREFIX}$1`));
}

function main() {
  const localSrc = process.env.SUPERPOWERS_SRC;
  const tmp = localSrc ? null : fs.mkdtempSync(path.join(os.tmpdir(), 'sp-vendor-'));
  try {
    let checkout;
    if (localSrc) {
      checkout = path.resolve(localSrc);
      console.log(`Using local source (SUPERPOWERS_SRC): ${checkout}`);
    } else {
      checkout = path.join(tmp, 'superpowers');
      try {
        clone(`v${VERSION}`, checkout);
      } catch {
        clone(VERSION, checkout); // some tags are not v-prefixed
      }
    }

    // Pre-flight: validate the source is complete BEFORE wiping DEST, so a
    // bad/incomplete source fails loudly while the committed snapshot stays
    // intact. Covers both the clone and SUPERPOWERS_SRC paths.
    const missing = [];
    for (const skill of SKILLS) {
      if (!fs.existsSync(path.join(checkout, 'skills', skill))) {
        missing.push(`skills/${skill}`);
      }
    }
    if (!fs.existsSync(path.join(checkout, 'LICENSE'))) {
      missing.push('LICENSE');
    }
    if (missing.length) {
      throw new Error(
        `source is incomplete (${checkout}); missing: ${missing.join(', ')}`
      );
    }

    fs.mkdirSync(SKILLS_DIR, { recursive: true });

    const dangling = [];
    for (const skill of SKILLS) {
      const src = path.join(checkout, 'skills', skill);
      const dest = path.join(SKILLS_DIR, skill);
      fs.rmSync(dest, { recursive: true, force: true });
      fs.cpSync(src, dest, { recursive: true });
      applyPrefix(path.join(dest, 'SKILL.md'));
      // surface cross-references to skills we do NOT vendor
      const body = fs.readFileSync(path.join(src, 'SKILL.md'), 'utf8');
      for (const m of body.matchAll(/superpowers:([a-z-]+)/g)) {
        if (!SKILLS.includes(m[1]) && !dangling.includes(m[1])) dangling.push(m[1]);
      }
    }

    fs.copyFileSync(path.join(checkout, 'LICENSE'), path.join(SKILLS_DIR, 'SUPERPOWERS-LICENSE'));
    fs.writeFileSync(
      path.join(SKILLS_DIR, 'SUPERPOWERS-NOTICE.md'),
      [
        '# Vendored Superpowers skills',
        '',
        `Source: ${REPO} @ ${VERSION} (MIT, (c) 2025 Jesse Vincent — see SUPERPOWERS-LICENSE).`,
        `Each vendored skill's description is prefixed \`${PREFIX.trim()}\` to mark its origin.`,
        'Regenerate with: `npm run vendor:superpowers`.',
        '',
        'Cross-references to skills NOT vendored here (degrade gracefully):',
        dangling.length ? dangling.map((d) => `- ${d}`).join('\n') : '- (none)',
        '',
      ].join('\n')
    );
    console.log(`Vendored ${SKILLS.length} skills @ ${VERSION} -> ${SKILLS_DIR}`);
    if (dangling.length) console.log(`Dangling refs noted: ${dangling.join(', ')}`);
  } finally {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main();
