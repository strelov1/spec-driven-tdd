#!/usr/bin/env node
'use strict';

// spec-driven-tdd installer.
// Stages the skill-pack (skills, hooks, per-harness manifests, context files)
// into a target directory the harness reads, then reports the two runtime
// prerequisites: OpenSpec (a real npm dependency) and Superpowers (plugin-only,
// no npm package — installed via the Claude Code marketplace).

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
  // skills/vendor is the source snapshot, not a discoverable skill set — never
  // ship it nested. It is deployed flattened, conditionally, by deployVendored.
  fs.rmSync(path.join(target, 'skills', 'vendor'), { recursive: true, force: true });
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

function superpowersPresent() {
  // Explicit override wins — lets users/tests force the decision.
  if (process.env.SDT_ASSUME_SUPERPOWERS === '1') return true;
  if (process.env.SDT_ASSUME_SUPERPOWERS === '0') return false;
  // Marketplace-installed; look for the plugin under the home config.
  const base = path.join(os.homedir(), '.claude', 'plugins');
  for (const sub of ['cache', 'data']) {
    const dir = path.join(base, sub);
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { recursive: true });
    } catch {
      continue;
    }
    if (entries.some((e) => String(e).toLowerCase().includes('superpowers'))) return true;
  }
  return false;
}

// Prints the dependency report and returns true when both prerequisites are present.
function reportDeps() {
  const openspec = openspecPresent();
  const superpowers = superpowersPresent();
  console.log('\nDependencies:');
  console.log(
    `  ${openspec ? 'OK' : '!!'} OpenSpec (npm: @fission-ai/openspec)` +
      (openspec ? '' : '  →  npm i -g @fission-ai/openspec')
  );
  console.log(
    `  ${superpowers ? 'OK' : '!!'} Superpowers (Claude Code plugin)` +
      (superpowers ? '' : '  →  /plugin install superpowers@claude-plugins-official')
  );
  if (!openspec || !superpowers) {
    console.log('\nThe orchestrator stops if a required dependency is missing — install the above first.');
  }
  return openspec && superpowers;
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

// When Superpowers is absent, deploy the vendored snapshot flattened into the
// target's skills/ so the harness discovers e.g. skills/test-driven-development.
// Returns true if anything was deployed.
function deployVendored(target) {
  const src = path.join(PACK_ROOT, 'skills', 'vendor', 'superpowers');
  if (!fs.existsSync(src)) return false;
  const skillsDir = path.join(target, 'skills');
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue; // skip LICENSE, NOTICE.md, .version
    const dest = path.join(skillsDir, entry.name);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(path.join(src, entry.name), dest, { recursive: true });
  }
  // Ship the MIT license alongside the flattened skills, as the license requires.
  fs.copyFileSync(path.join(src, 'LICENSE'), path.join(skillsDir, 'SUPERPOWERS-LICENSE'));
  return true;
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
  const haveSuperpowers = superpowersPresent();
  if (!haveSuperpowers) deployVendored(target);
  console.log(`Installed spec-driven-tdd → ${target}`);
  if (!opts.skipDeps) reportDeps();
  printNextSteps(target, opts.harness);
  return 0;
}

function help() {
  console.log(`spec-driven-tdd — installer

Usage:
  npx spec-driven-tdd install [--harness <name>] [--dir <path>] [--skip-deps]
  npx spec-driven-tdd doctor

Options:
  --harness   claude | cursor | codex | gemini | opencode  (default: claude)
  --dir       target directory (default: ~/.claude/plugins/spec-driven-tdd)
  --skip-deps skip the OpenSpec / Superpowers dependency report
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
