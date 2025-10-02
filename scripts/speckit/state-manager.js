import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export class StateManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.stateDir = path.join(projectRoot, '.speckit/state');
    this.currentTaskPath = path.join(this.stateDir, 'current-task.json');
    this.logsDir = path.join(this.stateDir, 'logs');
    this.metricsPath = path.join(this.stateDir, 'metrics.json');
  }

  async saveTaskState(taskId, state) {
    await fs.mkdir(this.stateDir, { recursive: true });
    const payload = { taskId, ...state, timestamp: new Date().toISOString() };
    await fs.writeFile(this.currentTaskPath, JSON.stringify(payload, null, 2));
    await this.updateIDEContext(payload);
    await this.gitAddCommitSafe(this.stateDir, `chore(speckit): update state for ${taskId}`);
  }

  async saveAgentOutput(agent, taskId, output) {
    const outputPath = path.join(this.stateDir, `agent-outputs/${agent}/task-${taskId}.json`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    await this.gitAddCommitSafe(outputPath, `chore(speckit): ${agent} output for ${taskId}`);
  }

  async getCurrentTask() {
    try {
      const data = await fs.readFile(this.currentTaskPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async archiveTask(taskId) {
    const timestamp = new Date().toISOString().split('T')[0];
    const archivePath = path.join(this.stateDir, `history/${timestamp}-task-${taskId}`);
    await fs.mkdir(archivePath, { recursive: true });

    const agentOutputs = path.join(this.stateDir, 'agent-outputs');
    try { await fs.cp(agentOutputs, path.join(archivePath, 'agent-outputs'), { recursive: true }); } catch {}
    try { await fs.cp(this.currentTaskPath, path.join(archivePath, 'task.json')); } catch {}

    await this.gitAddCommitSafe(archivePath, `archive(speckit): task ${taskId} completed`);
    await this.appendMetrics({ task_id: taskId, completed: new Date().toISOString() });
  }

  async updateIDEContext(state) {
    // IDE-agnostic context files for any editor
    const contextDir = path.join(this.projectRoot, '.speckit/context');
    await fs.mkdir(contextDir, { recursive: true });

    // Main state summary
    const statePath = path.join(contextDir, 'current-state.md');
    const stateContent = `# Current SpecKit State (Auto-generated)

**Task:** ${state.taskId}
**Phase:** ${state.phase}
**Status:** ${state.status}

## Latest Agent Outputs
${state.agentOutputs?.map(o => `- **${o.agent}**: ${o.summary}`).join('\n') || '- (none)'}

## Next Steps
${state.nextSteps?.map((s, i) => `${i + 1}. ${s}`).join('\n') || '- (none)'}

---
Last updated: ${new Date().toLocaleString()}
`;
    await fs.writeFile(statePath, stateContent);

    // Active task details
    const taskPath = path.join(contextDir, 'active-task.md');
    const taskContent = `# Active Task Details

**ID:** ${state.taskId}
**Created:** ${state.timestamp}
**Phase:** ${state.phase} / ${state.plan?.phases?.length || 0}

## Plan Summary
${state.plan?.summary || 'No description'}

## Phases
${state.plan?.phases?.map(p =>
  `### Phase ${p.phase} (${p.parallel ? 'Parallel' : 'Sequential'})
${p.subtasks?.map(st => `- [${st.agent}] ${st.description}`).join('\n') || ''}`
).join('\n\n') || 'No phases defined'}

## Risks
${state.plan?.risks?.map(r => `- ⚠️ ${r}`).join('\n') || '- None identified'}

## Estimated Duration
${state.plan?.total_estimated_minutes || 0} minutes

---
*This file is auto-updated on every state change*
`;
    await fs.writeFile(taskPath, taskContent);

    // Constitution reference (static, only create if missing)
    const constitutionPath = path.join(contextDir, 'constitutional-rules.md');
    try {
      await fs.access(constitutionPath);
    } catch {
      const constitutionContent = `# Constitutional Rules Reference

This file provides quick reference to the project's constitutional rules.

**Full rules:** \`.speckit/constitutional-rules.yaml\`

## Agent Roles
- **GPT-5**: Orchestrator, planner, decision maker
- **Qwen**: Implementation engineer (strict spec adherence)
- **Claude**: Security reviewer, architect (veto power)
- **Gemini**: Infrastructure specialist (GCP, databases, CI/CD)

## Key Constraints
- Qwen CANNOT: change schemas, modify auth, add dependencies, change API contracts
- Claude CAN veto: HIGH/CRITICAL security risks (with remediation)
- All schema changes require: GPT-5 + Claude approval
- All auth changes require: GPT-5 + Claude review (mandatory)

## Override Protocol
Use \`npm run speckit:override <rule-id> <reason>\` to bypass a rule with justification.

---
*This file is static - edit \`.speckit/constitutional-rules.yaml\` to modify rules*
`;
      await fs.writeFile(constitutionPath, constitutionContent);
    }

    await this.gitAddCommitSafe(contextDir, 'chore(speckit): update IDE context');
  }

  async gitAddCommitSafe(targetPath, message) {
    // Auto-commit is now enabled by default
    const autocommit = process.env.SPECKIT_AUTOCOMMIT !== '0';
    if (!autocommit) return;

    try {
      execSync(`git add "${targetPath}"`, { cwd: this.projectRoot });
      execSync(`git commit -m "${message}" --no-verify`, { cwd: this.projectRoot });
    } catch {}
  }

  async appendLog(event) {
    await fs.mkdir(this.logsDir, { recursive: true });
    const line = JSON.stringify({ time: new Date().toISOString(), ...event }) + '\n';
    await fs.appendFile(path.join(this.logsDir, 'speckit.ndjson'), line);
  }

  async appendMetrics(entry) {
    let metrics = { tasks: [], summary: {} };
    try {
      const raw = await fs.readFile(this.metricsPath, 'utf-8');
      metrics = JSON.parse(raw);
    } catch {}
    metrics.tasks.push(entry);
    await fs.mkdir(path.dirname(this.metricsPath), { recursive: true });
    await fs.writeFile(this.metricsPath, JSON.stringify(metrics, null, 2));
    await this.gitAddCommitSafe(this.metricsPath, 'chore(speckit): update metrics');
  }
}

export default StateManager;

