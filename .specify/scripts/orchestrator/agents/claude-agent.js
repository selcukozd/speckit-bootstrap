// .specify/scripts/orchestrator/agents/claude-agent.js
import { BaseAgent } from './base-agent.js';

export class ClaudeAgent extends BaseAgent {
  constructor() {
    super('claude', 'claude');
  }

  buildCommand(promptFile) {
    // Claude Code CLI komut formatı
    // Gerçek syntax'ı claude --help ile kontrol edin
    return `claude --file "${promptFile}"`;
  }

  parseOutput(stdout) {
    // Security review parsing
    const severityMatch = stdout.match(/Severity:\s*(CRITICAL|HIGH|MEDIUM|LOW)/i);
    const vetoMatch = stdout.match(/VETO:\s*(YES|NO)/i);
    
    // Risk extraction (basit parsing)
    const risks = [];
    const riskPattern = /🔴|🟠|🟡|🟢/g;
    const riskMatches = stdout.match(riskPattern);
    
    return {
      fullResponse: stdout,
      severity: severityMatch?.[1] || 'UNKNOWN',
      veto: vetoMatch?.[1] === 'YES',
      riskCount: riskMatches?.length || 0,
      hasCriticalIssues: stdout.includes('CRITICAL') || stdout.includes('🔴')
    };
  }
}