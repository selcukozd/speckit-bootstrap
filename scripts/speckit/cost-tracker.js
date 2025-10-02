import fs from 'fs/promises';
import path from 'path';

export class CostTracker {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.costPath = path.join(projectRoot, '.speckit/state/costs.json');
  }

  async logCLIUsage(agent, command, duration, exitCode, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      agent,
      command,
      duration_ms: duration,
      success: exitCode === 0,
      metadata
    };

    let costs = { entries: [], summary: {} };
    try {
      const raw = await fs.readFile(this.costPath, 'utf-8');
      costs = JSON.parse(raw);
    } catch {}

    costs.entries.push(entry);
    await fs.mkdir(path.dirname(this.costPath), { recursive: true });
    await fs.writeFile(this.costPath, JSON.stringify(costs, null, 2));

    return entry;
  }

  async calculateSummary(period = '7d') {
    let costs = { entries: [], summary: {} };
    try {
      const raw = await fs.readFile(this.costPath, 'utf-8');
      costs = JSON.parse(raw);
    } catch {
      return { total_calls: 0, by_agent: {}, avg_duration: 0 };
    }

    const cutoff = this.getPeriodCutoff(period);
    const filtered = costs.entries.filter(e => new Date(e.timestamp) >= cutoff);

    const summary = {
      total_calls: filtered.length,
      successful_calls: filtered.filter(e => e.success).length,
      failed_calls: filtered.filter(e => !e.success).length,
      total_duration_ms: filtered.reduce((sum, e) => sum + e.duration_ms, 0),
      avg_duration_ms: filtered.length > 0 ? Math.round(filtered.reduce((sum, e) => sum + e.duration_ms, 0) / filtered.length) : 0,
      by_agent: {}
    };

    for (const agent of ['qwen', 'claude', 'gemini', 'gpt5']) {
      const agentEntries = filtered.filter(e => e.agent === agent);
      if (agentEntries.length > 0) {
        summary.by_agent[agent] = {
          calls: agentEntries.length,
          successful: agentEntries.filter(e => e.success).length,
          failed: agentEntries.filter(e => !e.success).length,
          total_duration_ms: agentEntries.reduce((sum, e) => sum + e.duration_ms, 0),
          avg_duration_ms: Math.round(agentEntries.reduce((sum, e) => sum + e.duration_ms, 0) / agentEntries.length)
        };
      }
    }

    return summary;
  }

  getPeriodCutoff(period) {
    const now = new Date();
    const match = period.match(/^(\d+)([dhm])$/);
    if (!match) return new Date(0);

    const [, amount, unit] = match;
    const value = parseInt(amount);

    switch (unit) {
      case 'd': return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
      case 'h': return new Date(now.getTime() - value * 60 * 60 * 1000);
      case 'm': return new Date(now.getTime() - value * 60 * 1000);
      default: return new Date(0);
    }
  }

  async generateReport(period = '7d') {
    const summary = await this.calculateSummary(period);

    const report = `# Cost & Usage Report (${period})

## Summary
- **Total CLI Calls:** ${summary.total_calls}
- **Successful:** ${summary.successful_calls} (${summary.total_calls > 0 ? Math.round(summary.successful_calls / summary.total_calls * 100) : 0}%)
- **Failed:** ${summary.failed_calls}
- **Total Duration:** ${Math.round(summary.total_duration_ms / 1000)}s
- **Average Duration:** ${Math.round(summary.avg_duration_ms / 1000)}s per call

## By Agent

${Object.entries(summary.by_agent).map(([agent, stats]) => `### ${agent}
- Calls: ${stats.calls}
- Success Rate: ${Math.round(stats.successful / stats.calls * 100)}%
- Total Duration: ${Math.round(stats.total_duration_ms / 1000)}s
- Avg Duration: ${Math.round(stats.avg_duration_ms / 1000)}s
`).join('\n')}

---
*Generated: ${new Date().toLocaleString()}*
`;

    return report;
  }
}

export default CostTracker;
