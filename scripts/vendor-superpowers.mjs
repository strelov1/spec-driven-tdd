#!/usr/bin/env node
// Reproducible sync of the Superpowers skills this pack vendors.
// Clones the pinned upstream tag into a temp dir and copies only the skills
// the orchestrator references, plus the MIT LICENSE the license requires us to
// ship. Output is committed under skills/vendor/superpowers/ and distributed
// via npm — NOT a submodule (npx install does not fetch submodules).
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
const DEST = path.join(HERE, '..', 'skills', 'vendor', 'superpowers');

function clone(tag, into) {
  execFileSync('git', ['clone', '--depth', '1', '--branch', tag, REPO, into], {
    stdio: 'ignore',
  });
}

function main() {
  const localSrc = process.env.SUPERPOWERS_SRC;
  const tmp = localSrc ? null : fs.mkdtempSync(path.join(os.tmpdir(), 'sp-vendor-'));
  try {
    let checkout;
    if (localSrc) {
      checkout = path.resolve(localSrc);
      if (!fs.existsSync(path.join(checkout, 'skills'))) {
        throw new Error(`SUPERPOWERS_SRC has no skills/ dir: ${checkout}`);
      }
      console.log(`Using local source (SUPERPOWERS_SRC): ${checkout}`);
    } else {
      checkout = path.join(tmp, 'superpowers');
      try {
        clone(`v${VERSION}`, checkout);
      } catch {
        clone(VERSION, checkout); // some tags are not v-prefixed
      }
    }

    fs.rmSync(DEST, { recursive: true, force: true });
    fs.mkdirSync(DEST, { recursive: true });

    const dangling = [];
    for (const skill of SKILLS) {
      const src = path.join(checkout, 'skills', skill);
      if (!fs.existsSync(src)) {
        throw new Error(`upstream is missing skill: ${skill}`);
      }
      fs.cpSync(src, path.join(DEST, skill), { recursive: true });
      // surface cross-references to skills we do NOT vendor
      const body = fs.readFileSync(path.join(src, 'SKILL.md'), 'utf8');
      for (const m of body.matchAll(/superpowers:([a-z-]+)/g)) {
        if (!SKILLS.includes(m[1]) && !dangling.includes(m[1])) dangling.push(m[1]);
      }
    }

    fs.copyFileSync(path.join(checkout, 'LICENSE'), path.join(DEST, 'LICENSE'));
    fs.writeFileSync(path.join(DEST, '.version'), `${VERSION}\n`);
    fs.writeFileSync(
      path.join(DEST, 'NOTICE.md'),
      [
        '# Vendored Superpowers skills',
        '',
        `Source: ${REPO} @ ${VERSION} (MIT, (c) 2025 Jesse Vincent — see LICENSE).`,
        'Regenerate with: `npm run vendor:superpowers`.',
        '',
        'Cross-references to skills NOT vendored here (degrade gracefully):',
        dangling.length ? dangling.map((d) => `- ${d}`).join('\n') : '- (none)',
        '',
      ].join('\n')
    );
    console.log(`Vendored ${SKILLS.length} skills @ ${VERSION} -> ${DEST}`);
    if (dangling.length) console.log(`Dangling refs noted: ${dangling.join(', ')}`);
  } finally {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main();
