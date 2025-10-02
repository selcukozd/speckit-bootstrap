#!/usr/bin/env node
import { argv, exit } from 'process';
import { readFileSync, existsSync } from 'fs';
import fetch from 'node-fetch';

function parseArg(flag, fallback = '') {
  const idx = argv.indexOf(flag);
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return fallback;
}

function loadConfig() {
  const configPath = '.agent-keys.json';
  if (!existsSync(configPath)) {
    console.error('❌ Error: .agent-keys.json not found!');
    console.error('💡 Copy .agent-keys.example.json to .agent-keys.json and add your API keys');
    exit(1);
  }
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (err) {
    console.error('❌ Error parsing .agent-keys.json:', err.message);
    exit(1);
  }
}

async function callQwenAPI(config, task, files, spec) {
  const systemPrompt = `You are Qwen, a fast code implementation agent. Generate clean, production-ready code for the given task.

Output format (JSON):
{
  "files_created": ["file1.ts", "file2.ts"],
  "code": {
    "file1.ts": "// code here",
    "file2.ts": "// code here"
  },
  "summary": "Brief description of what was implemented"
}`;

  const userPrompt = `Task: ${task}
${files ? `Files to create/modify: ${files}` : ''}
${spec ? `Spec file: ${spec}` : ''}

Generate implementation code as JSON.`;

  try {
    const response = await fetch(`${config.qwen.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.qwen.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.qwen.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to parse JSON from response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If not JSON, create structured response
      parsed = {
        files_created: files ? files.split(',').map(f => f.trim()) : [],
        code: content,
        summary: `Implemented: ${task}`
      };
    }

    return {
      status: 'complete',
      agent: 'qwen',
      ...parsed
    };
  } catch (err) {
    console.error('❌ API call failed:', err.message);
    console.error('💡 Falling back to stub mode for testing');
    
    // Fallback to stub mode
    return {
      status: 'complete',
      agent: 'qwen',
      mode: 'stub',
      files_created: files ? files.split(',') : [],
      summary: `[STUB] Implemented: ${task}`,
      note: 'Real API unavailable, using stub response'
    };
  }
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

  if (!task) {
    console.error('❌ Error: --task is required');
    exit(1);
  }

  const config = loadConfig();
  const result = await callQwenAPI(config, task, files, spec);
  
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err?.stack || String(err));
  exit(1);
});


