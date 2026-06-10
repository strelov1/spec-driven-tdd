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

function parseArgs(argv) {
  const opts = { command: 'install', harness: 'claude', dir: null, skipDeps: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') opts.dir = argv[++i];
    else if (a === '--harness') opts.harness = argv[++i];
    else if (a === '--skip-deps') opts.skipDeps = true;
    else if (a === '-h' || a === '--help') opts.command = 'help';
    else rest.push(a);
  }
  if (rest[0]) opts.command = rest[0];
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
    fs.cpSync(src, path.join(target, item), { recursive: true });
  }
  for (const rel of EXECUTABLES) {
    const p = path.join(target, rel);
    if (fs.existsSync(p)) fs.chmodSync(p, 0o755);
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
    require.resolve('@fission-ai/openspec/package.json', { paths: [PACK_ROOT] });
    return true;
  } catch {
    return hasOnPath('openspec');
  }
}

function superpowersPresent() {
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
  copyInto(target);
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
  const opts = parseArgs(process.argv.slice(2));
  let code = 0;
  switch (opts.command) {
    case 'install':
      code = install(opts);
      break;
    case 'doctor':
    case 'check':
      reportDeps();
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
