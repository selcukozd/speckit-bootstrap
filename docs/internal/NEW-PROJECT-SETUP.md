# SpecKit Setup Guide - New Project from Scratch

This guide walks through setting up the SpecKit orchestration system in a new project, step-by-step with complete examples.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup Steps](#detailed-setup-steps)
4. [Configuration Options](#configuration-options)
5. [Testing the Setup](#testing-the-setup)
6. [Troubleshooting](#troubleshooting)
7. [Windows-Specific Notes](#windows-specific-notes)

---

## Prerequisites

### Required Software

1. **Node.js 14+** with ES modules support
   ```bash
   node --version  # Should be v14.0.0 or higher
   ```

2. **Git** (optional but recommended)
   ```bash
   git --version
   ```

3. **Cursor IDE** (for slash commands)
   - Download from https://cursor.sh

4. **npm or pnpm** (package manager)
   ```bash
   npm --version
   # or
   pnpm --version
   ```

### Project Requirements

- Empty or existing project directory
- Node.js project (or create new one)
- Write access to create files and directories

---

## Quick Start

For the impatient, here's the 5-minute setup:

```bash
# 1. Initialize Node.js project (if new)
npm init -y

# 2. Install dependencies
npm install yaml

# 3. Create directory structure
mkdir -p .speckit/state/logs .speckit/prompts .speckit/state/agent-outputs/{qwen,claude,gemini} .cursor/commands .cursor/context scripts/speckit

# 4. Copy files from this repo
# - .speckit/constitutional-rules.yaml
# - .speckit/prompts/*.md
# - scripts/speckit/*.js
# - .cursor/commands/*.md
# - .cursorrules

# 5. Update package.json scripts (see below)

# 6. Test
npm run speckit:plan -- "Test task"
npm run speckit:status
```

Now let's go through each step in detail.

---

## Detailed Setup Steps

### Step 1: Initialize Node.js Project

If starting from scratch:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Initialize package.json
npm init -y
```

This creates a basic `package.json`.

### Step 2: Configure ES Modules

SpecKit uses ES modules (`import`/`export`), so update `package.json`:

```json
{
  "name": "your-project-name",
  "version": "1.0.0",
  "type": "module",
  "scripts": {},
  "dependencies": {}
}
```

Add `"type": "module"` to enable ES modules.

### Step 3: Install Dependencies

SpecKit requires only one dependency:

```bash
npm install yaml
```

**Why yaml?**
- Constitutional rules stored in `.speckit/constitutional-rules.yaml`
- Human-readable, easy to edit
- YAML parsing for rule enforcement

### Step 4: Create Directory Structure

Create all necessary directories:

**Windows (PowerShell)**:
```powershell
New-Item -ItemType Directory -Force -Path .speckit\state\logs
New-Item -ItemType Directory -Force -Path .speckit\state\agent-outputs\qwen
New-Item -ItemType Directory -Force -Path .speckit\state\agent-outputs\claude
New-Item -ItemType Directory -Force -Path .speckit\state\agent-outputs\gemini
New-Item -ItemType Directory -Force -Path .speckit\state\history
New-Item -ItemType Directory -Force -Path .speckit\prompts
New-Item -ItemType Directory -Force -Path .cursor\commands
New-Item -ItemType Directory -Force -Path .cursor\context
New-Item -ItemType Directory -Force -Path scripts\speckit
```

**Windows (Command Prompt)**:
```cmd
mkdir .speckit\state\logs
mkdir .speckit\state\agent-outputs\qwen
mkdir .speckit\state\agent-outputs\claude
mkdir .speckit\state\agent-outputs\gemini
mkdir .speckit\state\history
mkdir .speckit\prompts
mkdir .cursor\commands
mkdir .cursor\context
mkdir scripts\speckit
```

**Unix/Mac/Git Bash**:
```bash
mkdir -p .speckit/state/logs
mkdir -p .speckit/state/agent-outputs/{qwen,claude,gemini}
mkdir -p .speckit/state/history
mkdir -p .speckit/prompts
mkdir -p .cursor/commands
mkdir -p .cursor/context
mkdir -p scripts/speckit
```

**Expected Structure**:
```
your-project/
├── .speckit/
│   ├── prompts/
│   └── state/
│       ├── logs/
│       ├── history/
│       └── agent-outputs/
│           ├── qwen/
│           ├── claude/
│           └── gemini/
├── .cursor/
│   ├── commands/
│   └── context/
├── scripts/
│   └── speckit/
└── package.json
```

### Step 5: Create Constitutional Rules

Create `.speckit/constitutional-rules.yaml`:

```yaml
agents:
  gpt5:
    role: Primary Orchestrator
    can:
      - Parse SPEC.md and create task breakdown
      - Assign tasks to specialist agents
      - Merge agent outputs into cohesive solution
      - Make final decisions on conflicts
      - Update SPEC.md with results
      - Approve schema changes
      - Trigger deployments
    cannot:
      - Write production code directly (delegates to Qwen/Claude)
      - Execute database queries (delegates to Gemini)
      - Override Claude security vetoes
    limits:
      - Must document all decisions in SPEC.md
      - Cannot skip review phase

  qwen:
    role: Implementation Engineer
    can:
      - Write new functions/components per explicit spec
      - Implement API endpoints with clear requirements
      - Create unit tests matching acceptance criteria
      - Generate SQL queries from schema specifications
      - Refactor code for performance (non-breaking)
    cannot:
      - Change database schemas
      - Modify authentication/authorization logic
      - Deploy to production
      - Change API contracts without approval
      - Add new dependencies
      - Make architectural decisions
    limits:
      - Max 500 lines per task
      - Must include tests for all new code
      - No creative interpretation - spec is literal

  claude:
    role: Architect & Security Reviewer
    can:
      - Review all code for security vulnerabilities
      - Suggest architectural improvements
      - Refactor complex code for maintainability
      - Design system architecture
      - VETO any change with HIGH or CRITICAL security risk
      - Override Qwen implementations if broken
      - Propose alternative approaches
    cannot:
      - Deploy without tests passing
      - Skip review of authentication changes
      - Approve changes that break existing APIs
    limits:
      - Must justify all vetoes with specific risks
      - Cannot veto based on style preferences
      - Must provide actionable alternatives

  gemini:
    role: Infrastructure Specialist
    can:
      - Write/optimize database queries
      - Configure cloud services
      - Set up CI/CD pipelines
      - Manage cloud quotas and labels
      - Create verification scripts
      - Design data pipelines
    cannot:
      - Change application business logic
      - Modify frontend code
      - Access production secrets directly
      - Alter IAM policies without approval
    limits:
      - Must estimate costs before execution
      - Cannot create resources without documentation

veto_protocol:
  security_veto:
    trigger: "Claude identifies HIGH or CRITICAL security risk"
    action: |
      1. Pipeline halts immediately
      2. Claude must provide: risk description, attack scenario, remediation
      3. GPT-5 reviews veto justification
      4. If veto valid: Qwen re-implements with Claude's guidance
      5. If veto invalid: GPT-5 documents override reason and proceeds
    appeals: "Only GPT-5 can override Claude security veto with written justification"

  quality_veto:
    trigger: "Claude identifies MEDIUM risk or code quality issues"
    action: |
      1. Pipeline continues but flags issue
      2. GPT-5 decides: fix now vs technical debt backlog
      3. If fix now: Qwen addresses in same PR
      4. If backlog: Creates tracking task

conflict_resolution:
  qwen_vs_claude:
    scenario: "Qwen's implementation differs from Claude's review suggestion"
    resolver: GPT-5
    process: |
      1. GPT-5 requests test results from both approaches
      2. Claude explains technical reasoning
      3. Qwen defends spec adherence
      4. GPT-5 chooses based on: security > performance > maintainability > spec literalism

approval_requirements:
  schema_changes:
    requires: [gpt5, claude]
    reason: "Database changes are irreversible and high-risk"

  dependency_additions:
    requires: [gpt5, claude]
    reason: "New dependencies increase attack surface"

  api_contract_changes:
    requires: [gpt5, claude]
    reason: "Breaking changes affect clients"

  deployment:
    requires: [gpt5, gemini]
    must_pass: [tests, smoke_tests]
    reason: "Production changes need validation"
```

**Customization Tips**:
- Adjust agent capabilities to match your team's tools (remove Gemini if no GCP)
- Add more agents (e.g., "copilot" for documentation)
- Modify line limits for Qwen (default: 500 lines)
- Add project-specific approval requirements

### Step 6: Create Agent Prompts

Create three prompt template files in `.speckit/prompts/`:

#### `.speckit/prompts/qwen-implement.md`

```markdown
You are Qwen, the Implementation Engineer in a multi-agent system.

## Your Role
Write code EXACTLY as specified. No creativity, no interpretation, no improvements unless explicitly asked.

## Constitutional Constraints
{{constitutional_constraints}}

## Current Task
{{subtask}}

## Existing Code
{{existing_code}}

## Full Specification
{{spec}}

## Output Format (JSON ONLY)
{
  "patches": [
    {
      "file": "path/to/file.js",
      "action": "create" | "modify",
      "diff": "unified diff format if modify, full content if create"
    }
  ],
  "tests": [
    {
      "file": "path/to/test.js",
      "content": "full test file content"
    }
  ],
  "notes": "Any ambiguities or assumptions made",
  "estimated_risk": "LOW" | "MEDIUM" | "HIGH"
}

## Critical Rules
- If spec is ambiguous, state assumption in notes and proceed
- If task violates constitutional constraints, return error in notes
- Include tests that match acceptance criteria EXACTLY
- Use existing code style and patterns
- Do NOT add features not in spec
```

#### `.speckit/prompts/claude-review.md`

```markdown
You are Claude, the Architect & Security Reviewer in a multi-agent system.

## Your Role
Review code for security, performance, and correctness. You have VETO power for HIGH/CRITICAL risks.

## Implementation to Review
{{implementation}}

## Original Specification
{{spec}}

## Constitutional Rules
{{rules}}

## Focus Areas
{{focus_areas}}

## Output Format (Markdown)

## Overall Severity: [LOW | MEDIUM | HIGH | CRITICAL]

## VETO: [YES | NO]
(YES only if HIGH or CRITICAL risks that must be fixed before deployment)

## Risks Found

### Risk 1: [Title]
**Severity:** [LOW | MEDIUM | HIGH | CRITICAL]
**Category:** [Security | Performance | Reliability | Maintainability]
**Description:**
[Detailed explanation]

**Evidence:**
```
// problematic code
```

**Remediation:**
```
// fixed code
```

### Risk 2: [Title]
...

## Recommendations
1. [Non-blocking improvements]
2. [Best practices suggestions]

## Approval Status
- [ ] Security: Pass/Fail
- [ ] Performance: Pass/Fail
- [ ] Reliability: Pass/Fail
- [ ] Constitutional Compliance: Pass/Fail

**Final Decision:** [APPROVE | CONDITIONAL APPROVE | REJECT]

## Critical Rules
- VETO if SQL injection possible
- VETO if authentication can be bypassed
- VETO if unbounded resource usage
- VETO if constitutional rules violated
- For MEDIUM risks, suggest but don't block
```

#### `.speckit/prompts/gemini-infra.md`

```markdown
You are Gemini, the Infrastructure Specialist in a multi-agent system.

## Your Role
Handle all database, cloud, and infrastructure tasks. Ensure queries are optimized and quotas respected.

## Current Task
{{subtask}}

## Specification
{{spec}}

## Infrastructure Context
- Cloud Provider: {{cloud_provider}}
- Database: {{database}}

## Tasks
{{tasks}}

## Output Format (JSON)
{
  "verification_script": {
    "script": "#!/bin/bash\n...",
    "checks": ["check1", "check2"]
  },
  "optimization": {
    "original_cost_estimate": "$0.05",
    "optimized_cost_estimate": "$0.02",
    "changes_made": ["added timeout", "added indexes"]
  },
  "smoke_tests": [
    {
      "endpoint": "/api/health",
      "method": "GET",
      "expected_status": 200,
      "command": "curl -f https://..."
    }
  ],
  "deployment_steps": [
    "command 1...",
    "command 2..."
  ],
  "rollback_plan": "rollback command..."
}

## Critical Rules
- Always estimate costs
- Set timeouts for all queries
- Add labels/tags for tracking
- Verify resources exist before deployment
- Provide rollback commands
```

### Step 7: Create Core Scripts

Create five JavaScript files in `scripts/speckit/`:

#### `scripts/speckit/orchestrator.js`

```javascript
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
    console.log('📋 Planning task\n');

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
    return plan;
  }

  async implement() {
    const currentTask = await this.state.getCurrentTask();
    if (!currentTask) throw new Error('No active task. Run: npm run speckit:plan -- "task"');

    console.log(`🚀 Implementing ${currentTask.taskId}...\n`);

    for (const phase of currentTask.plan.phases) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📍 Phase ${phase.phase}${phase.parallel ? ' (Parallel)' : ' (Sequential)'}`);
      console.log('='.repeat(50));

      if (phase.parallel) {
        await this.executeParallel(phase.subtasks, currentTask);
      } else {
        await this.executeSequential(phase.subtasks, currentTask);
      }

      await this.state.appendLog({ type: 'phase_complete', phase: phase.phase });
    }

    await this.state.archiveTask(currentTask.taskId);
    console.log('\n✅ Task complete!');
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

    // Simulate agent work (replace with actual agent calls)
    const start = Date.now();
    await new Promise(r => setTimeout(r, 300));

    const result = { agent: subtask.agent, success: true, output: {}, duration: Date.now() - start };
    await this.state.appendLog({ type: 'subtask', agent: subtask.agent, description: subtask.description, success: true });

    return result;
  }

  getAgentEmoji(agent) {
    const emojis = { gpt5: '🧠', qwen: '🤖', claude: '🔍', gemini: '☁️' };
    return emojis[agent] || '❓';
  }
}

// CLI detection
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
      console.log('🧾 Lessons command placeholder');
      break;
    default:
      console.log('Usage: node scripts/speckit/orchestrator.js [plan|implement|status|review|metrics|lessons]');
  }
}
```

#### `scripts/speckit/state-manager.js`

```javascript
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
    await this.updateCursorContext(payload);
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

  async updateCursorContext(state) {
    const contextDir = path.join(this.projectRoot, '.cursor/context');
    await fs.mkdir(contextDir, { recursive: true });

    const statePath = path.join(contextDir, 'speckit-state.md');
    const stateContent = `## Current SPECKIT State (Auto-generated)

**Task:** ${state.taskId}
**Phase:** ${state.phase}
**Status:** ${state.status}

### Latest Agent Outputs:
${state.agentOutputs?.map(o => `- **${o.agent}**: ${o.summary}`).join('\n') || '- (none)'}

### Next Steps:
${state.nextSteps?.map((s, i) => `${i + 1}. ${s}`).join('\n') || '- (none)'}

---
Last updated: ${new Date().toLocaleString()}
`;
    await fs.writeFile(statePath, stateContent);

    const taskPath = path.join(contextDir, 'speckit-active-task.md');
    const taskContent = `## Active Task Details

**ID:** ${state.taskId}
**Created:** ${state.timestamp}
**Phase:** ${state.phase}

### Plan Summary:
${state.plan?.summary || 'No description'}

### Phases:
${state.plan?.phases?.map(p =>
  `#### Phase ${p.phase} (${p.parallel ? 'Parallel' : 'Sequential'})
${p.subtasks?.map(st => `- [${st.agent}] ${st.description}`).join('\n') || ''}`
).join('\n\n') || 'No phases defined'}

---
*This file is auto-updated on every state change*
`;
    await fs.writeFile(taskPath, taskContent);

    await this.gitAddCommitSafe(contextDir, 'chore(speckit): update cursor context');
  }

  async gitAddCommitSafe(targetPath, message) {
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
```

#### `scripts/speckit/constitutional.js`

```javascript
import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';

export class ConstitutionalEngine {
  constructor(rulesPath = '.speckit/constitutional-rules.yaml', projectRoot = process.cwd()) {
    this.rulesPath = path.isAbsolute(rulesPath) ? rulesPath : path.join(projectRoot, rulesPath);
    this.overridesPath = path.join(projectRoot, '.speckit/state/overrides.json');
    this.rules = null;
    this.overrides = null;
  }

  async load() {
    if (this.rules) return this.rules;
    try {
      const raw = await fs.readFile(this.rulesPath, 'utf-8');
      this.rules = YAML.parse(raw);
    } catch {
      this.rules = {};
    }
    return this.rules;
  }

  async loadOverrides() {
    if (this.overrides) return this.overrides;
    try {
      const raw = await fs.readFile(this.overridesPath, 'utf-8');
      this.overrides = JSON.parse(raw);
    } catch {
      this.overrides = { active: [], history: [] };
    }
    return this.overrides;
  }

  async saveOverride(ruleId, reason, taskId) {
    await this.loadOverrides();
    const override = {
      ruleId,
      reason,
      taskId,
      timestamp: new Date().toISOString(),
      active: true
    };
    this.overrides.active.push(override);
    this.overrides.history.push(override);
    await fs.mkdir(path.dirname(this.overridesPath), { recursive: true });
    await fs.writeFile(this.overridesPath, JSON.stringify(this.overrides, null, 2));
    return override;
  }

  async clearOverrides(taskId) {
    await this.loadOverrides();
    this.overrides.active = this.overrides.active.filter(o => o.taskId !== taskId);
    await fs.writeFile(this.overridesPath, JSON.stringify(this.overrides, null, 2));
  }

  async enforce(action, agent, subtask, taskId = null) {
    await this.load();
    await this.loadOverrides();

    const deny = (reason, ruleId = null) => ({ allowed: false, reason, ruleId });
    const allow = () => ({ allowed: true });

    const isOverridden = (ruleId) => {
      return this.overrides.active.some(o =>
        o.ruleId === ruleId && (!taskId || o.taskId === taskId)
      );
    };

    const description = (subtask?.description || '').toLowerCase();
    const files = subtask?.files || [];

    const agentRules = this.rules?.agents?.[agent];
    if (!agentRules) return allow();

    const cannotRules = agentRules.cannot || [];
    for (const rule of cannotRules) {
      const ruleText = rule.toLowerCase();

      if (ruleText.includes('database schema') || ruleText.includes('schema change')) {
        const ruleId = `${agent}.cannot.change_schema`;
        if (isOverridden(ruleId)) continue;

        if (/schema|prisma|migration|alter\s+table/.test(description) ||
            files.some(f => /schema|migration/i.test(f))) {
          return deny(`${agent} cannot change database schemas (constitutional rule)`, ruleId);
        }
      }

      if (ruleText.includes('authentication') || ruleText.includes('authorization')) {
        const ruleId = `${agent}.cannot.modify_auth`;
        if (isOverridden(ruleId)) continue;

        if (/auth|authentication|authorization|jwt|session/.test(description) ||
            files.some(f => /auth|session|jwt/i.test(f))) {
          return deny(`${agent} cannot modify authentication/authorization logic (constitutional rule)`, ruleId);
        }
      }

      if (ruleText.includes('dependencies') || ruleText.includes('add new dependencies')) {
        const ruleId = `${agent}.cannot.add_dependency`;
        if (isOverridden(ruleId)) continue;

        if (/package\.json|pnpm-lock|yarn\.lock/.test(files.join(',')) ||
            /dependency|add package/.test(description)) {
          return deny(`${agent} cannot add dependencies without approval (constitutional rule)`, ruleId);
        }
      }
    }

    return allow();
  }

  async getAgentCapabilities(agent) {
    await this.load();
    return this.rules?.agents?.[agent] || { role: 'Unknown', can: [], cannot: [], limits: [] };
  }
}

export default ConstitutionalEngine;
```

#### `scripts/speckit/cost-tracker.js`

```javascript
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
}

export default CostTracker;
```

#### `scripts/speckit/override-manager.js`

```javascript
import { ConstitutionalEngine } from './constitutional.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const constitutional = new ConstitutionalEngine('.speckit/constitutional-rules.yaml', projectRoot);

const command = process.argv[2];
const ruleId = process.argv[3];
const reason = process.argv.slice(4).join(' ');

async function main() {
  switch (command) {
    case 'add':
      if (!ruleId || !reason) {
        console.error('❌ Usage: node override-manager.js add <rule-id> <reason>');
        process.exit(1);
      }

      console.log('⚠️  WARNING: You are about to override a constitutional rule!');
      console.log(`Rule: ${ruleId}`);
      console.log(`Reason: ${reason}\n`);

      const override = await constitutional.saveOverride(ruleId, reason, 'manual-override');
      console.log(`✅ Override activated: ${override.ruleId}`);
      console.log(`   Timestamp: ${override.timestamp}`);
      console.log(`   Reason: ${override.reason}\n`);
      console.log('💡 This override will apply to all tasks until cleared.');
      break;

    case 'list':
      await constitutional.loadOverrides();
      const overrides = constitutional.overrides;

      if (overrides.active.length === 0) {
        console.log('✅ No active overrides');
      } else {
        console.log(`⚠️  ${overrides.active.length} active override(s):\n`);
        overrides.active.forEach((o, i) => {
          console.log(`${i + 1}. ${o.ruleId}`);
          console.log(`   Task: ${o.taskId}`);
          console.log(`   Reason: ${o.reason}`);
          console.log(`   Since: ${new Date(o.timestamp).toLocaleString()}\n`);
        });
      }
      break;

    case 'clear':
      if (!ruleId) {
        console.error('❌ Usage: node override-manager.js clear <task-id|all>');
        process.exit(1);
      }

      if (ruleId === 'all') {
        await constitutional.clearOverrides();
        console.log('✅ All overrides cleared');
      } else {
        await constitutional.clearOverrides(ruleId);
        console.log(`✅ Overrides cleared for task: ${ruleId}`);
      }
      break;

    default:
      console.log('Usage:');
      console.log('  node scripts/speckit/override-manager.js add <rule-id> <reason>');
      console.log('  node scripts/speckit/override-manager.js list');
      console.log('  node scripts/speckit/override-manager.js clear <task-id|all>');
  }
}

main().catch(console.error);
```

### Step 8: Add NPM Scripts

Update `package.json` to include SpecKit commands:

```json
{
  "name": "your-project-name",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "speckit:plan": "node scripts/speckit/orchestrator.js plan",
    "speckit:implement": "node scripts/speckit/orchestrator.js implement",
    "speckit:status": "node scripts/speckit/orchestrator.js status",
    "speckit:review": "node scripts/speckit/orchestrator.js review",
    "speckit:metrics": "node scripts/speckit/orchestrator.js metrics",
    "speckit:lessons": "node scripts/speckit/orchestrator.js lessons",
    "speckit:override": "node scripts/speckit/override-manager.js"
  },
  "dependencies": {
    "yaml": "^2.5.1"
  }
}
```

### Step 9: Create Cursor Slash Commands

Create slash command files in `.cursor/commands/`:

#### `.cursor/commands/speckit-start.md`

```markdown
# SpecKit Start

Start a new task with multi-agent planning.

## Usage
```
/speckit-start <task description>
```

## Script
```bash
npm run speckit:plan -- "$ARGUMENTS"
```
```

#### `.cursor/commands/speckit-implement.md`

```markdown
# SpecKit Implement

Execute the current planned task.

## Usage
```
/speckit-implement
```

## Script
```bash
npm run speckit:implement
```
```

#### `.cursor/commands/speckit-status.md`

```markdown
# SpecKit Status

Show current task status.

## Usage
```
/speckit-status
```

## Script
```bash
npm run speckit:status
```
```

#### `.cursor/commands/speckit-metrics.md`

```markdown
# SpecKit Metrics

Show usage metrics.

## Usage
```
/speckit-metrics
```

## Script
```bash
npm run speckit:metrics
```
```

#### `.cursor/commands/speckit-override.md`

```markdown
# SpecKit Override

Manage constitutional rule overrides.

## Usage
```
/speckit-override add <rule-id> <reason>
/speckit-override list
/speckit-override clear <task-id|all>
```

## Script
```bash
npm run speckit:override "$ARGUMENTS"
```
```

### Step 10: Create `.cursorrules` File

Create `.cursorrules` in project root:

```markdown
# SpecKit Orchestration Rules

## When to Use SpecKit

### AUTO-TRIGGER for:
- User says "implement", "build", "add feature", "create"
- Changes involve >3 files
- Any database/schema changes
- Security-sensitive code (auth, payments)
- Infrastructure changes

### DON'T use for:
- Quick fixes (<10 lines)
- Typo corrections
- Documentation-only changes

## Commands

Use these slash commands:
- `/speckit-start <description>` - Plan a task
- `/speckit-implement` - Execute the task
- `/speckit-status` - Check current state
- `/speckit-metrics` - View statistics
- `/speckit-override` - Manage rule overrides

## Agent Roles

- **GPT-5**: Orchestrator (you, in Cursor chat)
- **Qwen**: Implementation (fast, needs review)
- **Claude**: Security review (veto power)
- **Gemini**: Infrastructure (cloud, databases)

Always refer to `.speckit/constitutional-rules.yaml` for capabilities.
```

### Step 11: Initialize Git (Optional)

If using Git integration:

```bash
git init
git add .
git commit -m "chore: setup SpecKit orchestration"
```

To disable auto-commits:

**Windows (PowerShell)**:
```powershell
$env:SPECKIT_AUTOCOMMIT="0"
```

**Unix/Mac**:
```bash
export SPECKIT_AUTOCOMMIT=0
```

---

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPECKIT_AUTOCOMMIT` | `1` (enabled) | Auto-commit state changes to git |

### Constitutional Rules Customization

Edit `.speckit/constitutional-rules.yaml`:

**Add new agent**:
```yaml
agents:
  copilot:
    role: Documentation Writer
    can:
      - Write README files
      - Generate API docs
    cannot:
      - Modify code
    limits:
      - Must follow style guide
```

**Add approval requirement**:
```yaml
approval_requirements:
  payment_integration:
    requires: [gpt5, claude, gemini]
    reason: "Payment code needs security + infrastructure review"
```

**Add conflict resolution**:
```yaml
conflict_resolution:
  custom_scenario:
    scenario: "Description"
    resolver: gpt5
    process: |
      1. Step one
      2. Step two
```

---

## Testing the Setup

### Test 1: Basic Planning

```bash
npm run speckit:plan -- "Add hello world endpoint"
```

**Expected Output**:
```
📋 Planning task

✅ Task T123 planned
{
  "task_id": "T123",
  "summary": "Add hello world endpoint",
  "phases": [ ... ]
}
```

**Verify**:
- `.speckit/state/current-task.json` created
- `.cursor/context/speckit-state.md` updated
- `.cursor/context/speckit-active-task.md` created

### Test 2: Check Status

```bash
npm run speckit:status
```

**Expected Output**:
```
📋 Current Task: T123
📍 Phase: planned
🔖 Status: pending_approval
---
{task details}
```

### Test 3: Implementation

```bash
npm run speckit:implement
```

**Expected Output**:
```
🚀 Implementing T123...

==================================================
📍 Phase 1 (Parallel)
==================================================
  🤖 qwen: Add hello world endpoint

==================================================
📍 Phase 2 (Sequential)
==================================================
  🔍 claude: Security review

✅ Task complete!
```

**Verify**:
- `.speckit/state/agent-outputs/qwen/task-T123.json` created
- `.speckit/state/agent-outputs/claude/task-T123.json` created
- `.speckit/state/logs/speckit.ndjson` has entries
- `.speckit/state/history/2025-10-01-task-T123/` archived

### Test 4: Metrics

```bash
npm run speckit:metrics
```

**Expected Output**:
```json
{
  "tasks": [
    {
      "task_id": "T123",
      "completed": "2025-10-01T..."
    }
  ],
  "summary": {}
}
```

### Test 5: Constitutional Enforcement

```bash
npm run speckit:plan -- "Modify authentication system"
npm run speckit:implement
```

**Expected**: Qwen blocked with message:
```
⛔ BLOCKED: qwen cannot modify authentication/authorization logic (constitutional rule)
```

### Test 6: Override Management

```bash
# Add override
npm run speckit:override add qwen.cannot.modify_auth "Emergency hotfix for login bug"

# List overrides
npm run speckit:override list

# Clear override
npm run speckit:override clear all
```

### Test 7: Cursor Integration

In Cursor IDE:
1. Type `/speckit-start Test from Cursor`
2. Check terminal output
3. Verify state files updated

---

## Troubleshooting

### Issue: "Cannot find module 'yaml'"

**Solution**:
```bash
npm install yaml
```

### Issue: "No active task"

**Cause**: No `current-task.json` file exists

**Solution**:
```bash
npm run speckit:plan -- "New task"
```

### Issue: ES module errors

**Symptoms**:
```
SyntaxError: Cannot use import statement outside a module
```

**Solution**: Ensure `package.json` has `"type": "module"`:
```json
{
  "type": "module"
}
```

### Issue: Permission denied on Windows

**Symptoms**: Cannot create directories or files

**Solution**: Run terminal as Administrator or check folder permissions

### Issue: Git commits failing

**Symptoms**: State saves but git errors

**Solutions**:
1. Initialize git: `git init`
2. Configure user: `git config user.name "Your Name"` and `git config user.email "you@example.com"`
3. Disable auto-commits: `set SPECKIT_AUTOCOMMIT=0`

### Issue: Slash commands not working in Cursor

**Solution**:
1. Restart Cursor
2. Check `.cursor/commands/` files exist
3. Verify commands follow markdown format
4. Check terminal output for errors

### Issue: Constitutional rules not enforcing

**Solution**:
1. Verify `.speckit/constitutional-rules.yaml` exists
2. Check YAML syntax (use online validator)
3. Ensure rule IDs match in override calls
4. Check `enforce()` method logs

### Issue: Context files not updating

**Symptoms**: Cursor doesn't see current task

**Solution**:
1. Check `.cursor/context/` directory exists
2. Manually trigger: `npm run speckit:status`
3. Verify `updateCursorContext()` is called in state manager

---

## Windows-Specific Notes

### Path Handling

Windows uses backslashes (`\`), but Node.js `path` module handles this automatically:

```javascript
// This works on both Windows and Unix
path.join('.speckit', 'state', 'current-task.json')
// Windows: .speckit\state\current-task.json
// Unix: .speckit/state/current-task.json
```

### PowerShell vs Command Prompt

**PowerShell** (recommended):
```powershell
npm run speckit:plan -- "Task description"
$env:SPECKIT_AUTOCOMMIT="0"
```

**Command Prompt**:
```cmd
npm run speckit:plan -- "Task description"
set SPECKIT_AUTOCOMMIT=0
```

### Git Bash

If using Git Bash on Windows, use Unix-style commands:
```bash
npm run speckit:plan -- "Task description"
export SPECKIT_AUTOCOMMIT=0
```

### Long Path Issues

Windows has a 260-character path limit. If you hit this:

1. Enable long paths:
   ```powershell
   # Run as Administrator
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

2. Or use shorter project path (e.g., `C:\Projects\myapp` instead of `C:\Users\username\Documents\Projects\myapp`)

### Line Endings

Git may convert line endings on Windows. Add `.gitattributes`:

```
* text=auto
*.js text eol=lf
*.md text eol=lf
*.json text eol=lf
*.yaml text eol=lf
```

---

## Next Steps

After setup:

1. **Test Basic Flow**:
   - Create a simple task
   - Implement it
   - Check metrics

2. **Customize Rules**:
   - Edit `.speckit/constitutional-rules.yaml`
   - Add project-specific agents
   - Define approval workflows

3. **Integrate with CI/CD**:
   - Run `npm run speckit:metrics` in pipeline
   - Fail builds on constitutional violations
   - Track agent performance over time

4. **Train Team**:
   - Share this guide
   - Document project-specific workflows
   - Create task templates

5. **Monitor and Improve**:
   - Review metrics weekly
   - Identify patterns (high veto rates, slow agents)
   - Update constitutional rules based on learnings

---

## Summary Checklist

- [ ] Node.js 14+ installed
- [ ] `package.json` with `"type": "module"`
- [ ] `yaml` dependency installed
- [ ] Directory structure created
- [ ] `.speckit/constitutional-rules.yaml` created
- [ ] Agent prompt templates created
- [ ] All 5 JavaScript scripts created
- [ ] NPM scripts added to `package.json`
- [ ] Cursor slash commands created
- [ ] `.cursorrules` file created
- [ ] Git initialized (optional)
- [ ] Tests passed (plan, status, implement)
- [ ] Cursor integration tested

Congratulations! SpecKit is now set up and ready to use.

For detailed usage, see [SYSTEM-OVERVIEW.md](./SYSTEM-OVERVIEW.md).
