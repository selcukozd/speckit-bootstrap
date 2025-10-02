// .specify/scripts/orchestrator/agents/qwen-agent.js
import { BaseAgent } from './base-agent.js';

export class QwenAgent extends BaseAgent {
  constructor() {
    super('qwen', 'qwen');
  }

  buildCommand(promptFile) {
    // Qwen CLI komut formatı
    // Gerçek syntax'ı qwen --help ile kontrol edin
    return `qwen chat --file "${promptFile}" --no-stream`;
  }

  parseOutput(stdout) {
    // Code block'ları extract et
    const codeBlocks = [];
    const codeRegex = /```(?:javascript|typescript|jsx|tsx|json)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeRegex.exec(stdout)) !== null) {
      codeBlocks.push(match[1].trim());
    }
    
    return {
      fullResponse: stdout,
      codeBlocks,
      hasCode: codeBlocks.length > 0
    };
  }
}