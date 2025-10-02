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

async function callGeminiAPI(config, type, configPath) {
  const systemPrompt = `You are Gemini, an infrastructure specialist agent. Handle:
- Database setup (PostgreSQL, MongoDB, Redis)
- Cloud deployment (GCP, AWS, Vercel)
- CI/CD pipelines
- Email/SMS services
- Monitoring & logging

Output format (JSON):
{
  "steps": [
    {
      "action": "create_file|run_command|configure_service",
      "target": "path or service name",
      "content": "configuration or command"
    }
  ],
  "summary": "What was configured",
  "services": ["service1", "service2"]
}`;

  const userPrompt = `Setup infrastructure: ${type}
${configPath ? `Config file: ${configPath}` : ''}

Generate infrastructure setup steps. Return JSON.`;

  try {
    const response = await fetch(`${config.gemini.endpoint}/models/${config.gemini.model}:generateContent?key=${config.gemini.api_key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    // Try to parse JSON from response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If not JSON, create structured response
      parsed = {
        steps: [],
        summary: content.substring(0, 200),
        services: [type]
      };
    }

    return {
      status: 'complete',
      agent: 'gemini',
      action: 'infra-setup',
      type,
      ...parsed
    };
  } catch (err) {
    console.error('❌ API call failed:', err.message);
    console.error('💡 Falling back to stub mode for testing');
    
    // Fallback to stub mode
    return {
      status: 'complete',
      agent: 'gemini',
      mode: 'stub',
      action: 'infra-setup',
      type,
      steps: [],
      summary: `[STUB] Infrastructure setup for ${type}`,
      note: 'Real API unavailable, using stub response'
    };
  }
}

async function main() {
  const sub = argv[2];
  const action = argv[3];
  
  if (sub !== 'infra' || action !== 'setup') {
    console.log('Usage: gemini-cli infra setup --type "generic" [--config path]');
    exit(0);
  }
  
  const type = parseArg('--type', 'generic');
  const configPath = parseArg('--config');

  if (!type) {
    console.error('❌ Error: --type is required');
    exit(1);
  }

  const config = loadConfig();
  const result = await callGeminiAPI(config, type, configPath);
  
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err?.stack || String(err));
  exit(1);
});


