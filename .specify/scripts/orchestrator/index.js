#!/usr/bin/env node
// .specify/scripts/orchestrator/index.js

import { QwenAgent } from './agents/qwen-agent.js';
import { ClaudeAgent } from './agents/claude-agent.js';
import { GeminiAgent } from './agents/gemini-agent.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

class SpecKitOrchestrator {
  constructor() {
    this.qwen = new QwenAgent();
    this.claude = new ClaudeAgent();
    this.gemini = new GeminiAgent();
  }

  async plan() {
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(15) + '🚀 SPECKIT ORCHESTRATOR' + ' '.repeat(20) + '║');
    console.log('╚' + '═'.repeat(58) + '╝\n');
    
    console.log('📋 Planning Phase\n');
    
    // Find latest spec (support both .specify/specs and root/specs)
    const specsDir = await this.getSpecsDir();
    const specs = await fs.readdir(specsDir);
    
    if (specs.length === 0) {
      console.log('❌ No specs found. Run /specify in Cursor first.\n');
      return;
    }
    
    const latestSpec = specs.sort().reverse()[0];
    const specDir = path.join(specsDir, latestSpec);
    
    console.log(`📁 Latest spec: ${latestSpec}`);
    
    // Read tasks
    const tasksPath = path.join(specDir, 'tasks.md');
    let tasksContent;
    try {
      tasksContent = await fs.readFile(tasksPath, 'utf-8');
      console.log('✅ tasks.md found\n');
    } catch (err) {
      console.log(`❌ tasks.md not found in ${specDir}. Run /tasks to generate it or create it manually.`);
      return;
    }
    
    // Parse tasks (simple parsing)
    const tasks = this.parseTasks(tasksContent);
    
    // Create plan
    const plan = {
      specId: latestSpec,
      createdAt: new Date().toISOString(),
      phases: [
        {
          number: 1,
          name: 'Implementation',
          parallel: false,
          tasks: tasks.filter(t => t.type === 'implementation').map(t => ({
            id: t.id,
            agent: 'qwen',
            description: t.description,
            autoReview: true
          }))
        },
        {
          number: 2,
          name: 'Security Review',
          parallel: false,
          tasks: [{
            id: 'REVIEW',
            agent: 'claude',
            description: 'Security and architecture review'
          }]
        },
        {
          number: 3,
          name: 'Testing',
          parallel: false,
          tasks: tasks.filter(t => t.type === 'testing').map(t => ({
            id: t.id,
            agent: 'qwen',
            description: t.description
          }))
        }
      ]
    };
    
    // Save plan
    const planPath = path.join(projectRoot, '.specify/state/current-plan.json');
    await fs.mkdir(path.dirname(planPath), { recursive: true });
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2));
    
    console.log('📊 Execution Plan:');
    this.displayPlan(plan);
    
    console.log('\n✅ Plan saved to .specify/state/current-plan.json');
    console.log('\nRun: npm run implement\n');
  }

  async implement() {
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(10) + '🚀 MULTI-AGENT IMPLEMENTATION' + ' '.repeat(18) + '║');
    console.log('╚' + '═'.repeat(58) + '╝\n');
    
    // Load plan
    const planPath = path.join(projectRoot, '.specify/state/current-plan.json');
    const plan = JSON.parse(await fs.readFile(planPath, 'utf-8'));
    
    // Load constitution
    const constitutionPath = path.join(projectRoot, '.specify/memory/constitution.md');
    const constitution = await fs.readFile(constitutionPath, 'utf-8').catch(() => '');
    
    // Load spec
    const specPath = path.join(await this.getSpecsDir(), plan.specId, 'spec.md');
    const spec = await fs.readFile(specPath, 'utf-8').catch(() => '');
    
    const context = { constitution, spec };
    
    // Execute phases
    for (const phase of plan.phases) {
      console.log('\n' + '═'.repeat(60));
      console.log(`📍 PHASE ${phase.number}: ${phase.name.toUpperCase()}`);
      console.log('═'.repeat(60));
      
      for (const task of phase.tasks) {
        const result = await this.executeTask(task, context);
        
        // Save result
        await this.saveResult(task.agent, task.id, result);
        
        // Auto-review for Qwen tasks
        if (task.agent === 'qwen' && task.autoReview && result.success) {
          await this.autoReview(result, context);
        }
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ IMPLEMENTATION COMPLETE');
    console.log('═'.repeat(60));
    console.log('\n📊 Results saved to .specify/state/agent-outputs/\n');
  }

  async executeTask(task, context) {
    const agent = this.getAgent(task.agent);
    
    const prompt = this.buildPrompt(task);
    
    return await agent.call(prompt, context);
  }

  async autoReview(implementationResult, context) {
    console.log('\n🔄 Auto-triggering Claude security review...');
    
    const reviewPrompt = `
# Security Review Request

Review the following implementation for security issues, performance problems, and architectural concerns.

## Implementation Output:
${implementationResult.output.fullResponse}

## Your Task:
1. Identify security vulnerabilities (CRITICAL/HIGH/MEDIUM/LOW)
2. Check for performance issues
3. Validate architectural decisions
4. Verify constitutional compliance

## Output Format:
Severity: [CRITICAL|HIGH|MEDIUM|LOW]
VETO: [YES if CRITICAL or HIGH issues, NO otherwise]

### Issues Found:
[List each issue with severity emoji: 🔴 CRITICAL, 🟠 HIGH, 🟡 MEDIUM, 🟢 LOW]

### Recommendations:
[Specific fixes needed]
`;
    
    const reviewResult = await this.claude.call(reviewPrompt, context);
    
    if (reviewResult.success) {
      if (reviewResult.output.veto) {
        console.log(`\n⛔ CLAUDE VETO: ${reviewResult.output.severity} risk detected`);
        console.log('Implementation blocked. Fix required.');
      } else {
        console.log(`\n✅ Claude approved (${reviewResult.output.severity} severity)`);
      }
    }
    
    await this.saveResult('claude', 'REVIEW', reviewResult);
    
    return reviewResult;
  }

  async getSpecsDir() {
    const candidates = [
      path.join(projectRoot, '.specify/specs'),
      path.join(projectRoot, 'specs')
    ];
    for (const dir of candidates) {
      try {
        const stat = await fs.stat(dir);
        if (stat.isDirectory()) return dir;
      } catch (_) {
        // continue
      }
    }
    throw new Error(`ENOENT: no specs directory found. Looked in: ${candidates.join(' | ')}`);
  }

  getAgent(agentName) {
    const agents = {
      qwen: this.qwen,
      claude: this.claude,
      gemini: this.gemini
    };
    return agents[agentName.toLowerCase()];
  }

  buildPrompt(task) {
    return `
# Task: ${task.description}

Please implement this task following these guidelines:
- Write clean, well-documented code
- Include error handling
- Follow TypeScript best practices
- Include inline comments

Output your implementation in code blocks with proper language tags.
`;
  }

  parseTasks(tasksMarkdown) {
    const tasks = [];
    const lines = tasksMarkdown.split('\n');
    
    for (const line of lines) {
      const match = line.match(/- \[ \] (T\d+\.\d+): (.+)/);
      if (match) {
        const [, id, description] = match;
        tasks.push({
          id,
          description,
          type: description.toLowerCase().includes('test') ? 'testing' : 'implementation'
        });
      }
    }
    
    return tasks;
  }

  async saveResult(agent, taskId, result) {
    const outputDir = path.join(projectRoot, '.specify/state/agent-outputs', agent);
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputFile = path.join(outputDir, `task-${taskId}.json`);
    await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
  }

  displayPlan(plan) {
    for (const phase of plan.phases) {
      console.log(`\nPhase ${phase.number}: ${phase.name}`);
      for (const task of phase.tasks) {
        const emoji = { qwen: '🤖', claude: '🔍', gemini: '☁️' }[task.agent] || '❓';
        console.log(`  ${emoji} ${task.agent}: ${task.description}`);
      }
    }
  }
}

// CLI Entry
const command = process.argv[2];
const orchestrator = new SpecKitOrchestrator();

try {
  if (command === 'plan') {
    await orchestrator.plan();
  } else if (command === 'implement') {
    await orchestrator.implement();
  } else {
    console.log('Usage: node index.js [plan|implement]');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}