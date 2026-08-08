#!/usr/bin/env node
'use strict';

// spec-driven-tdd installer.
// Stages the skill-pack (skills, hooks, per-harness manifests, context files)
// into a target directory the harness reads, then reports the one runtime
// prerequisite: OpenSpec (a real npm dependency). The Superpowers skills are
// vendored into skills/ and ship with the pack, so they need no separate install.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const PACK_ROOT = path.join(__dirname, '..');

// Everything that makes up the installable pack. Missing entries are skipped,
// so the same list works across harnesses.
const PAYLOAD = [
  'skills',
  'hooks',
  '.claude-plugin',
  '.codex-plugin',
  '.cursor-plugin',
  'gemini-extension.json',
  'AGENTS.md',
  'GEMINI.md',
  'CLAUDE.md',
];

const EXECUTABLES = ['hooks/session-start', 'hooks/run-hook.cmd'];

class UsageError extends Error {}

function requireValue(value, flag) {
  if (value === undefined || value.startsWith('-')) {
    throw new UsageError(`${flag} requires a value`);
  }
  return value;
}

function parseArgs(argv) {
  const opts = { command: 'install', harness: 'claude', dir: null, skipDeps: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') opts.dir = requireValue(argv[++i], '--dir');
    else if (a === '--harness') opts.harness = requireValue(argv[++i], '--harness');
    else if (a === '--skip-deps') opts.skipDeps = true;
    else if (a === '-h' || a === '--help') opts.command = 'help';
    else rest.push(a);
  }
  if (rest[0]) opts.command = rest[0];
  if (rest.length > 1) {
    throw new UsageError(`unexpected argument: ${rest[1]}`);
  }
  return opts;
}

function defaultTarget() {
  // All harnesses load this pack from a plugin directory under the home config.
  return path.join(os.homedir(), '.claude', 'plugins', 'spec-driven-tdd');
}

function copyInto(target) {
  fs.mkdirSync(target, { recursive: true });
  for (const item of PAYLOAD) {
    const src = path.join(PACK_ROOT, item);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(target, item);
    // Replace, don't merge — so a payload item dropped in a newer version does
    // not linger as a stale copy the harness keeps loading.
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(src, dest, { recursive: true, verbatimSymlinks: true });
  }
  for (const rel of EXECUTABLES) {
    if (process.platform === 'win32') continue; // chmod is a no-op/throws on Windows
    const p = path.join(target, rel);
    if (!fs.existsSync(p)) continue;
    try {
      fs.chmodSync(p, 0o755);
    } catch {
      /* non-fatal on filesystems without POSIX permission bits */
    }
  }
}

// Exclusive create-or-skip: attempts `create()` and reports which happened.
// Using an atomic O_EXCL-style call (rather than check-then-act) means a file
// that appears between calls is never clobbered and never crashes the command
// — both `fs.writeFileSync(..., {flag: 'wx'})` and `fs.symlinkSync` fail with
// EEXIST for a path that already exists, whether a regular file or any kind
// of symlink (dangling or not).
function createIfMissing(label, create) {
  try {
    create();
    console.log(`created: ${label}`);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    console.log(`skipped: ${label} already exists`);
  }
}

function agentsTemplate(target) {
  const name = path.basename(target);
  return (
    `# ${name}\n\n` +
    'This file is the shared agent context for AGENTS.md-compatible harnesses. ' +
    '`CLAUDE.md` and `GEMINI.md` in this directory are symlinks to this file, ' +
    'so every harness reads the same content.\n'
  );
}

// Bootstraps a *consuming* project's own AGENTS.md/CLAUDE.md/GEMINI.md trio —
// unrelated to installing this pack. Never overwrites an existing file or
// symlink; each of the three is independently create-or-skip.
function initContext(opts) {
  const target = path.resolve(opts.dir || process.cwd());
  try {
    fs.mkdirSync(target, { recursive: true });

    const agentsPath = path.join(target, 'AGENTS.md');
    createIfMissing('AGENTS.md', () =>
      fs.writeFileSync(agentsPath, agentsTemplate(target), { flag: 'wx' })
    );

    for (const name of ['CLAUDE.md', 'GEMINI.md']) {
      const linkPath = path.join(target, name);
      createIfMissing(name, () => fs.symlinkSync('AGENTS.md', linkPath));
    }
  } catch (err) {
    console.error(`init-context failed: ${err.message}`);
    return 1;
  }
  return 0;
}

function hasOnPath(bin) {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'which', [bin], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function openspecPresent() {
  try {
    // Default resolution walks up node_modules from here, so it finds the
    // dependency whether installed locally, via npx, or globally as a sibling.
    require.resolve('@fission-ai/openspec/package.json');
    return true;
  } catch {
    return hasOnPath('openspec');
  }
}

// Prints the dependency report. OpenSpec is a real prerequisite; the Superpowers
// skills ship vendored in the pack, so they are always satisfied.
function reportDeps() {
  const openspec = openspecPresent();
  console.log('\nDependencies:');
  console.log(
    `  ${openspec ? 'OK' : '!!'} OpenSpec (npm: @fission-ai/openspec)` +
      (openspec ? '' : '  →  npm i -g @fission-ai/openspec')
  );
  console.log('  OK Superpowers (bundled skills)');
  if (!openspec) {
    console.log('\nThe orchestrator stops if a required dependency is missing — install the above first.');
  }
  return openspec;
}

function printNextSteps(target, harness) {
  console.log('\nNext steps:');
  if (harness === 'claude' || harness === 'cursor') {
    console.log(`  • Point the harness at: ${target}`);
    console.log('  • Or register it as a local marketplace: /plugin marketplace add ' + target);
  } else {
    console.log(`  • ${harness}: discovers skills under ${path.join(target, 'skills')}`);
  }
}

function install(opts) {
  const target = opts.dir || defaultTarget();
  if (opts.harness !== 'claude' && !opts.dir) {
    console.warn(
      `Note: the default target (${target}) is Claude-specific. ` +
        `For ${opts.harness}, pass --dir <path> pointing at your agent's skills/plugins location.`
    );
  }
  try {
    copyInto(target);
  } catch (err) {
    console.error(`Install failed: ${err.message}`);
    return 1;
  }
  console.log(`Installed spec-driven-tdd → ${target}`);
  if (!opts.skipDeps) reportDeps();
  printNextSteps(target, opts.harness);
  return 0;
}

function help() {
  console.log(`spec-driven-tdd — installer

Usage:
  npx spec-driven-tdd install [--harness <name>] [--dir <path>] [--skip-deps]
  npx spec-driven-tdd init-context [--dir <path>]
  npx spec-driven-tdd doctor

Options:
  --harness   claude | cursor | codex | gemini | opencode  (default: claude)
  --dir       target directory (default: ~/.claude/plugins/spec-driven-tdd for
              install; current directory for init-context)
  --skip-deps skip the OpenSpec / Superpowers dependency report

init-context bootstraps a project's own AGENTS.md, symlinking CLAUDE.md and
GEMINI.md to it. It never overwrites an existing file or symlink.
`);
  return 0;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    console.error(err.message);
    help();
    process.exit(1);
  }

  let code = 0;
  switch (opts.command) {
    case 'install':
      code = install(opts);
      break;
    case 'init-context':
      code = initContext(opts);
      break;
    case 'doctor':
    case 'check':
      code = reportDeps() ? 0 : 1;
      break;
    case 'help':
      code = help();
      break;
    default:
      console.error(`Unknown command: ${opts.command}`);
      help();
      code = 1;
  }
  process.exit(code);
}

main();
