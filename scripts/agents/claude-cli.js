#!/usr/bin/env node
import { argv, exit } from 'process';

function parseArg(flag, fallback = '') {
  const idx = argv.indexOf(flag);
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return fallback;
}

async function main() {
  const command = argv[2];
  if (command !== 'review') {
    console.log('Usage: claude-cli review --files "a,b" --focus topics --spec path');
    exit(0);
  }
  const files = parseArg('--files');
  const focus = parseArg('--focus');
  const spec = parseArg('--spec');

  const issues = [];
  const result = {
    status: 'approved',
    agent: 'claude',
    files: files ? files.split(',') : [],
    focus: focus ? focus.split(',') : [],
    spec,
    issues
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err?.stack || String(err));
  exit(1);
});


