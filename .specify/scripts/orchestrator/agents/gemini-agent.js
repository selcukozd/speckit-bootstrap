// .specify/scripts/orchestrator/agents/gemini-agent.js
import { BaseAgent } from './base-agent.js';

export class GeminiAgent extends BaseAgent {
  constructor() {
    super('gemini', 'gemini');
  }

  buildCommand(promptFile) {
    // Gemini CLI komut formatı
    // Gerçek syntax'ı gemini --help ile kontrol edin
    return `gemini code --input "${promptFile}"`;
  }

  parseOutput(stdout) {
    // Infrastructure response parsing
    return {
      fullResponse: stdout,
      hasConfig: stdout.includes('.env') || stdout.includes('config'),
      hasCommands: stdout.includes('gcloud') || stdout.includes('kubectl')
    };
  }
}