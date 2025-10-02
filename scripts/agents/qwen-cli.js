#!/usr/bin/env node
import { argv, exit } from 'process';

function parseArg(flag, fallback = '') {
  const idx = argv.indexOf(flag);
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return fallback;
}

async function main() {
  const command = argv[2];
  if (command !== 'implement') {
    console.log('Usage: qwen-cli implement --task "desc" [--files "a,b"] [--spec path]');
    exit(0);
  }
  const task = parseArg('--task');
  const files = parseArg('--files');
  const spec = parseArg('--spec');

  const result = {
    status: 'complete',
    agent: 'qwen',
    files_created: files ? files.split(',') : [],
    summary: `Implemented: ${task}`,
    spec
  };
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err?.stack || String(err));
  exit(1);
});


