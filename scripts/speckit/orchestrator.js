import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { StateManager } from './state-manager.js';
import { ConstitutionalEngine } from './constitutional.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

export class SpecKitOrchestrator {
  constructor() {
    this.state = new StateManager(projectRoot);
    this.constitutional = new ConstitutionalEngine('.speckit/constitutional-rules.yaml', projectRoot);
  }

  async plan(taskDescription) {
    console.log('📋 Planning task (Manual Multi-Agent Mode)\n');
    const specPath = path.join(projectRoot, 'SPEC.md');
    const spec = await fs.readFile(specPath, 'utf-8').catch(() => '# SPEC not found');

    const taskId = 'T' + Math.floor(Math.random() * 900 + 100);
    const plan = {
      task_id: taskId,
      summary: taskDescription || 'General task',
      phases: [
        {
          phase: 1,
          parallel: true,
          subtasks: [
            {
              agent: 'qwen',
              action: 'implement',
              description: taskDescription || 'Implementation work',
              files: [],
              acceptance: ['tests pass'],
              estimated_minutes: 10
            }
          ]
        },
        {
          phase: 2,
          parallel: false,
          subtasks: [
            { agent: 'claude', action: 'review', description: 'Security review', critical: true }
          ]
        }
      ],
      risks: [],
      total_estimated_minutes: 20
    };

    await this.state.saveTaskState(plan.task_id, {
      phase: 'planned',
      plan,
      status: 'pending_approval'
    });

    console.log(`✅ Task ${plan.task_id} planned`);
    console.log(JSON.stringify(plan, null, 2));

    // Print CLI commands for manual execution
    const cliByPhase = this.generateCLICommands(plan);
    console.log('\n📝 CLI Commands to Execute (Manual Mode):');
    for (const [phase, commands] of Object.entries(cliByPhase)) {
      console.log(`\n## Phase ${phase}:`);
      for (const cmd of commands) {
        console.log(`\n### ${this.getAgentEmoji(cmd.agent)} ${cmd.agent} - ${cmd.description}`);
        console.log('```bash');
        console.log(cmd.command);
        console.log('```');
      }
    }

    return plan;
  }

  async implement() {
    // Manual mode: Do not auto-execute. Show next phase commands instead.
    const currentTask = await this.state.getCurrentTask();
    if (!currentTask) throw new Error('No active task. Run: /speckit start <description>');

    console.log('⚠️ Manual Mode Enabled: Automatic execution is disabled.');
    console.log('Run the following CLI commands for the NEXT phase, then paste outputs back here.');

    const cliByPhase = this.generateCLICommands(currentTask.plan);
    const nextPhase = (currentTask.plan.phases || [])[0]?.phase ?? 1;
    const commands = cliByPhase[nextPhase] || [];
    if (commands.length === 0) {
      console.log('No commands found for the next phase.');
      return;
    }
    console.log(`\n## Phase ${nextPhase} Commands:`);
    for (const cmd of commands) {
      console.log(`\n### ${this.getAgentEmoji(cmd.agent)} ${cmd.agent} - ${cmd.description}`);
      console.log('```bash');
      console.log(cmd.command);
      console.log('```');
    }
  }

  async status() {
    const currentTask = await this.state.getCurrentTask();
    if (!currentTask) {
      console.log('📋 No active task');
      return;
    }
    console.log(`📋 Current Task: ${currentTask.taskId}`);
    console.log(`📍 Phase: ${currentTask.phase}`);
    console.log(`🔖 Status: ${currentTask.status}`);
    console.log('---');
    console.log(JSON.stringify(currentTask.plan || {}, null, 2));
  }

  async executeParallel(subtasks, taskContext) {
    const results = await Promise.all(subtasks.map(st => this.executeSubtask(st, taskContext)));
    for (const r of results) await this.state.saveAgentOutput(r.agent || 'unknown', taskContext.taskId, r);
    return results;
  }

  async executeSequential(subtasks, taskContext) {
    const results = [];
    for (const st of subtasks) {
      const r = await this.executeSubtask(st, taskContext);
      results.push(r);
      await this.state.saveAgentOutput(r.agent || 'unknown', taskContext.taskId, r);
      if (!r.success && st.critical) throw new Error(`Critical subtask failed: ${st.description}`);
    }
    return results;
  }

  async executeSubtask(subtask, taskContext) {
    console.log(`  ${this.getAgentEmoji(subtask.agent)} ${subtask.agent}: ${subtask.description}`);
    const allowed = await this.constitutional.enforce(subtask.action, subtask.agent, subtask);
    if (!allowed.allowed) {
      console.log(`  ⛔ BLOCKED: ${allowed.reason}`);
      return { agent: subtask.agent, success: false, error: allowed.reason, duration: 0 };
    }

    // MVP: simulate outputs
    const start = Date.now();
    if (subtask.agent === 'qwen') {
      await new Promise(r => setTimeout(r, 300));
      return { agent: 'qwen', success: true, output: { patches: [], tests: [] }, duration: Date.now() - start };
    }
    if (subtask.agent === 'claude') {
      await new Promise(r => setTimeout(r, 300));
      return { agent: 'claude', success: true, output: { veto: false, severity: 'LOW' }, duration: Date.now() - start };
    }
    if (subtask.agent === 'gemini') {
      await new Promise(r => setTimeout(r, 300));
      return { agent: 'gemini', success: true, output: { commands: [] }, duration: Date.now() - start };
    }
    const result = { agent: subtask.agent, success: true, output: {}, duration: 0 };
    await this.state.appendLog({ type: 'subtask', agent: subtask.agent, description: subtask.description, success: true });
    return result;
  }

  getAgentEmoji(agent) {
    const emojis = { gpt5: '🧠', qwen: '🤖', claude: '🔍', gemini: '☁️' };
    return emojis[agent] || '❓';
  }
}

// Helper: generate CLI commands per phase for manual execution
SpecKitOrchestrator.prototype.generateCLICommands = function(plan) {
  const commands = {};
  const phases = plan?.phases || [];
  for (const phase of phases) {
    const list = [];
    for (const task of (phase.subtasks || [])) {
      let command;
      const description = task.description || 'Task';
      const filesArg = Array.isArray(task.files) && task.files.length > 0 ? task.files.join(',') : '';
      switch (task.agent) {
        case 'qwen':
          command = `npm run agent:qwen -- implement --task "${description}"${filesArg ? ` --files "${filesArg}"` : ''} --spec "specs/001/spec.md"`;
          break;
        case 'claude':
          command = `npm run agent:claude -- review${filesArg ? ` --files "${filesArg}"` : ''} --focus security,architecture --spec "specs/001/spec.md"`;
          break;
        case 'gemini':
          command = `npm run agent:gemini -- infra setup --type "generic" --config ".speckit/profile.yaml"`;
          break;
        default:
          command = `# Manual task: ${description}`;
      }
      list.push({ agent: task.agent, description, command });
    }
    commands[phase.phase] = list;
  }
  return commands;
};

// CLI (cross-platform main-module detection)
const isMain = (() => {
  try {
    const current = fileURLToPath(import.meta.url);
    const invoked = path.resolve(process.argv[1] || '');
    return current === invoked;
  } catch {
    return false;
  }
})();

if (isMain) {
  const orchestrator = new SpecKitOrchestrator();
  const command = process.argv[2];
  switch (command) {
    case 'plan':
      await orchestrator.plan(process.argv.slice(3).join(' '));
      break;
    case 'implement':
      await orchestrator.implement();
      break;
    case 'status':
      await orchestrator.status();
        break;
      case 'review':
        // Placeholder: wire to Claude in future iteration
        console.log('🔍 Review command placeholder');
        break;
      case 'metrics':
        try {
          const metrics = await fs.readFile(path.join(projectRoot, '.speckit/state/metrics.json'), 'utf-8');
          console.log(metrics);
        } catch {
          console.log('{}');
        }
        break;
      case 'lessons':
        // Placeholder for lessons learned aggregation
        console.log('🧾 Lessons command placeholder');
      break;
    default:
        console.log('Usage: node scripts/speckit/orchestrator.js [plan|implement|status|review|metrics|lessons]');
  }
}

