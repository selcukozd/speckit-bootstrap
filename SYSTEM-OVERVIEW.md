# SpecKit Orchestration System - Complete Overview

## Table of Contents
1. [What is SpecKit?](#what-is-speckit)
2. [Why Use SpecKit?](#why-use-speckit)
3. [System Architecture](#system-architecture)
4. [Components](#components)
5. [Agent Roles and Capabilities](#agent-roles-and-capabilities)
6. [File Structure](#file-structure)
7. [Complete Workflow](#complete-workflow)
8. [Constitutional Rules](#constitutional-rules)
9. [State Management](#state-management)
10. [CLI Command Reference](#cli-command-reference)
11. [Integration with Cursor](#integration-with-cursor)

---

## What is SpecKit?

SpecKit is a **multi-agent orchestration system** designed for complex software development projects. It coordinates multiple AI agents (GPT-5, Qwen, Claude, Gemini) to work together on features, each with specialized roles and constitutional constraints.

Think of it as a **software development team** where:
- **GPT-5** is the Project Manager (orchestrates and decides)
- **Qwen** is the Junior Developer (fast implementation, needs review)
- **Claude** is the Senior Architect (reviews for security/quality, has veto power)
- **Gemini** is the DevOps Engineer (handles infrastructure, databases, cloud)

### Key Principles

1. **Separation of Concerns**: Each agent has specific responsibilities
2. **Constitutional Constraints**: Agents have clearly defined "can" and "cannot" rules
3. **Safety Through Review**: Implementation (Qwen) always reviewed by security expert (Claude)
4. **Traceability**: All decisions, agent outputs, and state changes are logged
5. **Deterministic Workflow**: Predictable phases with clear approval gates

---

## Why Use SpecKit?

### Problem It Solves

Without SpecKit, AI-assisted development faces:
- **Inconsistent quality**: No systematic review process
- **Security blind spots**: Single agent may miss vulnerabilities
- **Complex task chaos**: No structured breakdown of multi-step features
- **Lost context**: State and decisions not tracked between sessions
- **Role confusion**: One agent trying to do everything

### Benefits

1. **Quality Assurance**
   - Automatic security reviews on all code
   - Catches SQL injection, auth bypasses, hardcoded secrets
   - Claude's veto power blocks critical issues

2. **Faster Development**
   - Qwen handles boilerplate quickly
   - Parallel task execution
   - Less manual review needed

3. **Clear Accountability**
   - Every change attributed to specific agent
   - Constitutional rules prevent unauthorized actions
   - Audit trail in logs and metrics

4. **Cost Optimization**
   - Use expensive Claude only for reviews
   - Free Qwen for bulk implementation
   - Gemini for specialized infrastructure tasks

5. **Maintainability**
   - State persists across sessions
   - Easy to resume tasks
   - Metrics show agent performance over time

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (Developer)                         │
└───────────────┬─────────────────────────────────┬───────────────┘
                │                                 │
        Cursor Chat                      Direct CLI
                │                                 │
                v                                 v
┌───────────────────────────────────────────────────────────────────┐
│                     SpecKit Orchestrator                          │
│                   (orchestrator.js)                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  State Manager          Constitutional Engine           │    │
│  │  - Current task         - Enforce rules                 │    │
│  │  - Agent outputs        - Check approvals               │    │
│  │  - Logs/metrics         - Handle overrides              │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
       v              v              v              v
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│  GPT-5     │ │  Qwen      │ │  Claude    │ │  Gemini    │
│ (You/AI)   │ │ (Fast Impl)│ │ (Security) │ │ (GCP/Infra)│
└─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
      │              │              │              │
      │              v              v              v
      │      ┌──────────────────────────────────────────┐
      │      │         Project Files                    │
      │      │  - Source code                           │
      │      │  - Tests                                 │
      └─────>│  - Infrastructure configs                │
             │  - Documentation                         │
             └──────────────────────────────────────────┘
                              │
                              v
                  ┌──────────────────────┐
                  │  .speckit/state/     │
                  │  - current-task.json │
                  │  - agent-outputs/    │
                  │  - logs/             │
                  │  - metrics.json      │
                  │  - history/          │
                  └──────────────────────┘
```

### Data Flow

1. **Task Planning** (GPT-5)
   ```
   User Request -> Orchestrator.plan() -> Generate task breakdown
   -> Assign agents -> Save state -> Show plan to user
   ```

2. **Task Implementation**
   ```
   User Approval -> Orchestrator.implement()
   -> For each phase:
      -> Constitutional check
      -> Execute subtasks (parallel/sequential)
      -> Save agent outputs
      -> Trigger reviews if needed
   -> Archive completed task
   ```

3. **State Persistence**
   ```
   Every state change -> StateManager.saveTaskState()
   -> Update .speckit/state/current-task.json
   -> Update .cursor/context/ files
   -> Git commit (optional)
   ```

---

## Components

### 1. Orchestrator (`scripts/speckit/orchestrator.js`)

**Purpose**: Main controller that coordinates all agents and manages workflow.

**Key Methods**:
- `plan(taskDescription)`: Creates task breakdown with phases and subtasks
- `implement()`: Executes current task phase-by-phase
- `status()`: Shows current task state
- `executeSubtask(subtask)`: Runs individual agent actions

**Responsibilities**:
- Task decomposition
- Agent assignment
- Phase execution (parallel vs sequential)
- Constitutional rule enforcement
- Logging and metrics

### 2. State Manager (`scripts/speckit/state-manager.js`)

**Purpose**: Handles all state persistence, logging, and Cursor context updates.

**Key Methods**:
- `saveTaskState(taskId, state)`: Persists current task to JSON
- `saveAgentOutput(agent, taskId, output)`: Records agent work
- `getCurrentTask()`: Retrieves active task
- `archiveTask(taskId)`: Moves completed task to history
- `updateCursorContext(state)`: Updates `.cursor/context/` markdown files

**Features**:
- Automatic git commits (optional via `SPECKIT_AUTOCOMMIT`)
- History archiving with timestamps
- Cursor context synchronization
- Metrics tracking

### 3. Constitutional Engine (`scripts/speckit/constitutional.js`)

**Purpose**: Enforces agent capabilities and constraints defined in YAML rules.

**Key Methods**:
- `enforce(action, agent, subtask)`: Checks if agent can perform action
- `checkApprovals(changeType, taskContext)`: Validates required approvals
- `saveOverride(ruleId, reason)`: Bypasses rule with justification
- `getVetoProtocol(vetoType)`: Returns veto handling procedure

**Rule Categories**:
- Cannot rules (schema changes, auth modifications)
- File content checks (SQL injection, hardcoded secrets)
- Approval requirements (schema changes, deployments)
- Override management

### 4. Cost Tracker (`scripts/speckit/cost-tracker.js`)

**Purpose**: Tracks agent usage, duration, and generates reports.

**Key Methods**:
- `logCLIUsage(agent, command, duration)`: Records execution
- `calculateSummary(period)`: Aggregates metrics
- `generateReport(period)`: Creates formatted report

**Tracked Metrics**:
- Total CLI calls per agent
- Success/failure rates
- Average execution duration
- Agent-specific statistics

### 5. Override Manager (`scripts/speckit/override-manager.js`)

**Purpose**: CLI tool for managing constitutional rule overrides.

**Commands**:
- `add <rule-id> <reason>`: Create override with justification
- `list`: Show all active overrides
- `clear <task-id|all>`: Remove overrides

**Use Cases**:
- Emergency hotfixes
- Trusted internal packages
- One-time exceptions with audit trail

---

## Agent Roles and Capabilities

### GPT-5: Primary Orchestrator

**Role**: Project manager and decision-maker

**Can**:
- Parse specifications and create task breakdowns
- Assign tasks to specialist agents
- Merge agent outputs into cohesive solutions
- Make final decisions on conflicts
- Update specifications with results
- Approve schema changes
- Trigger deployments

**Cannot**:
- Write production code directly (delegates to Qwen/Claude)
- Execute database queries (delegates to Gemini)
- Override Claude security vetoes

**Limits**:
- Must document all decisions in SPEC.md
- Cannot skip review phase

---

### Qwen: Implementation Engineer

**Role**: Fast code generator that follows specs literally

**Can**:
- Write new functions/components per explicit spec
- Implement API endpoints with clear requirements
- Create unit tests matching acceptance criteria
- Generate SQL queries from schema specifications
- Refactor code for performance (non-breaking changes)

**Cannot**:
- Change database schemas
- Modify authentication/authorization logic
- Deploy to production
- Change API contracts without approval
- Add new dependencies
- Make architectural decisions

**Limits**:
- Max 500 lines per task
- Must include tests for all new code
- No creative interpretation - spec is literal

**Typical Tasks**:
- CRUD operations
- API endpoint implementation
- Form handling
- Simple business logic
- UI components (non-complex)

---

### Claude: Architect & Security Reviewer

**Role**: Security expert with veto power

**Can**:
- Review all code for security vulnerabilities
- Suggest architectural improvements
- Refactor complex code for maintainability
- Design system architecture
- **VETO any change with HIGH or CRITICAL security risk**
- Override Qwen implementations if broken
- Propose alternative approaches

**Cannot**:
- Deploy without tests passing
- Skip review of authentication changes
- Approve changes that break existing APIs

**Limits**:
- Must justify all vetoes with specific risks
- Cannot veto based on style preferences
- Must provide actionable alternatives

**Review Focus**:
- SQL injection vulnerabilities
- Authentication bypasses
- Hardcoded secrets
- Unbounded resource usage
- API security
- Input validation

---

### Gemini: Infrastructure Specialist

**Role**: DevOps and cloud infrastructure expert

**Can**:
- Write/optimize BigQuery queries
- Configure Cloud Run services
- Set up CI/CD pipelines
- Manage GCP quotas and labels
- Create view verification scripts
- Design data pipelines

**Cannot**:
- Change application business logic
- Modify frontend code
- Access production secrets directly
- Alter IAM policies without approval

**Limits**:
- Must estimate query costs before execution
- Cannot create views without schema documentation

**Typical Tasks**:
- Database setup (PostgreSQL, MongoDB, Redis)
- Cloud deployment (GCP, AWS, Vercel)
- CI/CD configuration
- Monitoring and logging
- Email/SMS service integration

---

## File Structure (Bootstrap)

```
project-root/
├── .speckit/
│   ├── profile.yaml                        # Technology profile (stack-agnostic)
│   ├── constitutional-rules.yaml          # Agent capabilities and constraints
│   ├── prompts/                           # Agent-specific prompt templates
│   │   ├── qwen-implement.md             # Qwen implementation instructions
│   │   ├── claude-review.md              # Claude review format
│   │   └── gemini-infra.md               # Gemini infrastructure template
│   └── state/                            # Persistent state and logs
│       ├── current-task.json             # Active task with plan
│       ├── agent-outputs/                # Outputs by agent
│       │   ├── qwen/
│       │   │   └── task-T237.json
│       │   ├── claude/
│       │   │   └── task-T237.json
│       │   └── gemini/
│       │       └── task-T237.json
│       ├── logs/
│       │   └── speckit.ndjson            # Event log (newline JSON)
│       ├── metrics.json                  # Aggregate metrics
│       ├── costs.json                    # Usage tracking
│       ├── overrides.json                # Active rule overrides
│       └── history/                      # Archived completed tasks
│           └── 2025-10-01-task-T237/
│               ├── task.json
│               └── agent-outputs/
│
├── .cursor/
│   ├── commands/                         # Slash commands for Cursor
│   │   ├── speckit-start.md
│   │   ├── speckit-implement.md
│   │   ├── speckit-status.md
│   │   ├── speckit-review.md
│   │   ├── speckit-metrics.md
│   │   ├── speckit-lessons.md
│   │   └── speckit-override.md
│   └── context/                          # Auto-updated context files
│       ├── speckit-state.md              # Current state summary
│       ├── speckit-active-task.md        # Detailed task info
│       └── speckit-constitution.md       # Quick rules reference
│
├── scripts/speckit/                      # Core JavaScript modules
│   ├── orchestrator.js                   # Main orchestration logic
│   ├── state-manager.js                  # State persistence
│   ├── constitutional.js                 # Rule enforcement
│   ├── cost-tracker.js                   # Usage metrics
│   ├── override-manager.js               # Override CLI
│   ├── spec-validator.js                 # (Optional) Spec validation
│   └── cli-validator.js                  # (Optional) CLI validation
│
├── .cursorrules                          # Cursor AI behavior rules
├── .specify/memory/constitution.md       # Constitution v2 (stack-agnostic)
├── package.json                          # NPM scripts
└── SYSTEM-OVERVIEW.md                    # This document
```

### Key Files Explained

#### `.speckit/constitutional-rules.yaml`
Defines what each agent can and cannot do. The "constitution" of your project.

#### `.speckit/state/current-task.json`
Contains the active task with:
- Task ID
- Phases and subtasks
- Agent assignments
- Status and timestamps

#### `.cursor/context/speckit-*.md`
Auto-generated markdown files that provide context to Cursor's AI assistant about current task state.

#### `.cursorrules`
Instructions for Cursor on when and how to use SpecKit, including the multi-agent workflow.

---

## Complete Workflow

### Phase 1: Task Planning

```bash
# Via Cursor chat
/speckit-start Add user authentication with JWT

# Via CLI
npm run speckit:plan -- "Add user authentication with JWT"
```

**What Happens**:
1. Orchestrator receives task description
2. Generates unique task ID (e.g., T237)
3. Creates plan with phases:
   - Phase 1: Implementation (Qwen)
   - Phase 2: Review (Claude)
   - Phase 3: Testing (Qwen) / Infrastructure (Gemini)
4. Estimates time and cost
5. Saves to `.speckit/state/current-task.json`
6. Updates Cursor context files
7. Shows plan to user for approval

**Example Plan Output**:
```json
{
  "task_id": "T237",
  "summary": "Add user authentication with JWT",
  "phases": [
    {
      "phase": 1,
      "parallel": true,
      "subtasks": [
        {
          "agent": "qwen",
          "action": "implement",
          "description": "Create auth endpoints",
          "files": ["app/api/auth/route.ts"],
          "acceptance": ["tests pass", "JWT validation works"],
          "estimated_minutes": 15
        }
      ]
    },
    {
      "phase": 2,
      "parallel": false,
      "subtasks": [
        {
          "agent": "claude",
          "action": "review",
          "description": "Security review",
          "critical": true
        }
      ]
    }
  ],
  "risks": ["JWT secret management", "Token expiration handling"],
  "total_estimated_minutes": 25
}
```

---

### Phase 2: Task Implementation

```bash
# Via Cursor chat
/speckit-implement

# Via CLI
npm run speckit:implement
```

**What Happens**:

1. **Load Current Task**
   - Reads `.speckit/state/current-task.json`
   - Validates status is "pending_approval"

2. **Execute Phase 1 (Implementation)**
   ```
   - Orchestrator calls Qwen agent
   - Constitutional check: Can Qwen create auth endpoints?
   - Qwen generates code patches and tests
   - Save output to .speckit/state/agent-outputs/qwen/task-T237.json
   - Log event to .speckit/state/logs/speckit.ndjson
   ```

3. **Execute Phase 2 (Review)**
   ```
   - Orchestrator calls Claude agent
   - Claude reviews Qwen's implementation
   - Checks for security issues
   - If CRITICAL issue found:
     - Claude issues VETO
     - Orchestrator re-assigns to Qwen with fixes
     - Qwen re-implements
     - Claude re-reviews
   - If approved:
     - Save Claude's review output
     - Proceed to next phase
   ```

4. **Execute Phase 3 (Testing/Infrastructure)**
   ```
   - Parallel execution if multiple subtasks
   - Qwen writes tests
   - Gemini sets up monitoring/logging
   - Save all outputs
   ```

5. **Archive Task**
   ```
   - Move to .speckit/state/history/2025-10-01-task-T237/
   - Update metrics.json
   - Clear current-task.json
   - Git commit (if enabled)
   ```

**Console Output Example**:
```
🚀 Implementing T237...

==================================================
📍 Phase 1 (Parallel)
==================================================
  🤖 qwen: Create auth endpoints
  ✅ Success (2.3s)

==================================================
📍 Phase 2 (Sequential)
==================================================
  🔍 claude: Security review
  ⚠️  Issue found: Missing JWT secret validation
  🔴 VETO: CRITICAL security issue
  🤖 qwen: Re-implementing with fixes...
  ✅ Re-implementation complete
  🔍 claude: Re-reviewing...
  ✅ Approved

✅ Task complete!
```

---

### Phase 3: Status Check

```bash
# Via Cursor chat
/speckit-status

# Via CLI
npm run speckit:status
```

**Output**:
```
📋 Current Task: T237
📍 Phase: completed
🔖 Status: archived

Summary: Add user authentication with JWT
Phases: 2/2 complete
Agent outputs:
  - qwen: Implementation (2 attempts)
  - claude: Security review (approved on 2nd attempt)
Duration: 8 minutes
```

---

### Phase 4: Metrics and Learning

```bash
# View metrics
npm run speckit:metrics

# View lessons learned
npm run speckit:lessons
```

**Metrics Output**:
```json
{
  "tasks": [
    {
      "task_id": "T237",
      "completed": "2025-10-01T18:55:00Z",
      "duration_minutes": 8,
      "agents_used": ["qwen", "claude"],
      "vetoes": 1,
      "re_implementations": 1
    }
  ],
  "summary": {
    "total_tasks": 8,
    "success_rate": 0.875,
    "avg_duration_minutes": 42,
    "total_cost_usd": 2.80,
    "qwen_redo_rate": 0.25,
    "claude_veto_rate": 0.125
  }
}
```

---

## Constitutional Rules

### Rule Structure

Rules are defined in `.speckit/constitutional-rules.yaml` with this structure:

```yaml
agents:
  agent_name:
    role: Description of agent's purpose
    can:
      - List of allowed actions
    cannot:
      - List of prohibited actions
    limits:
      - Constraints and requirements

veto_protocol:
  security_veto:
    trigger: Condition that initiates veto
    action: |
      Step-by-step process
    appeals: Override conditions

conflict_resolution:
  scenario_name:
    scenario: Description
    resolver: Who decides
    process: |
      Resolution steps

approval_requirements:
  change_type:
    requires: [agent1, agent2]
    reason: Justification
```

### Key Rules

#### Schema Changes
- **Requires**: GPT-5 + Claude approval
- **Reason**: Database changes are irreversible
- **Agents blocked**: Qwen, Gemini (without approval)

#### Authentication Changes
- **Requires**: Mandatory Claude review
- **Reason**: Security-critical code
- **Agents blocked**: Qwen (cannot modify auth logic)

#### Dependency Additions
- **Requires**: GPT-5 + Claude approval
- **Reason**: New dependencies increase attack surface
- **Agents blocked**: Qwen

#### API Contract Changes
- **Requires**: GPT-5 + Claude approval
- **Reason**: Breaking changes affect clients
- **Agents blocked**: Qwen

### Veto Protocol

When Claude identifies a security risk:

1. **CRITICAL/HIGH Severity**:
   - Pipeline halts immediately
   - Claude provides: risk description, attack scenario, remediation
   - GPT-5 reviews veto justification
   - If valid: Qwen re-implements with guidance
   - If invalid: GPT-5 documents override and proceeds

2. **MEDIUM Severity**:
   - Pipeline continues but flags issue
   - GPT-5 decides: fix now vs technical debt backlog
   - If fix now: Qwen addresses in same PR
   - If backlog: Creates tracking task

### Overrides

Sometimes you need to bypass rules:

```bash
# Add override with justification
npm run speckit:override add qwen.cannot.add_dependency "Using trusted internal package @company/utils"

# List active overrides
npm run speckit:override list

# Clear overrides after task
npm run speckit:override clear T237

# Clear all overrides
npm run speckit:override clear all
```

**Override Guidelines**:
- Always provide clear reason
- Use for one-time exceptions only
- Clear immediately after task completes
- Overrides are logged in history for audit

---

## State Management

### Current Task State

Located at `.speckit/state/current-task.json`:

```json
{
  "taskId": "T237",
  "phase": "implementing",
  "plan": { /* task plan */ },
  "status": "pending_approval",
  "timestamp": "2025-10-01T18:48:15.144Z"
}
```

**Status Values**:
- `planned`: Task created, awaiting approval
- `pending_approval`: Ready to implement
- `implementing`: Currently executing
- `completed`: Finished successfully
- `archived`: Moved to history

### Agent Outputs

Each agent's work saved separately:

**Path**: `.speckit/state/agent-outputs/{agent}/task-{taskId}.json`

**Qwen Output Example**:
```json
{
  "agent": "qwen",
  "success": true,
  "output": {
    "patches": [
      {
        "file": "app/api/auth/route.ts",
        "action": "create",
        "diff": "..."
      }
    ],
    "tests": [
      {
        "file": "tests/auth.test.ts",
        "content": "..."
      }
    ],
    "notes": "Implemented JWT validation with bcrypt",
    "estimated_risk": "MEDIUM"
  },
  "duration": 2300
}
```

**Claude Output Example**:
```json
{
  "agent": "claude",
  "success": true,
  "output": {
    "veto": false,
    "severity": "LOW",
    "risks": [],
    "recommendations": ["Add rate limiting", "Log failed attempts"]
  },
  "duration": 1800
}
```

### Event Logs

Newline-delimited JSON (NDJSON) format at `.speckit/state/logs/speckit.ndjson`:

```json
{"time":"2025-10-01T18:48:15.144Z","type":"task_created","taskId":"T237"}
{"time":"2025-10-01T18:50:20.567Z","type":"phase_start","phase":1,"agent":"qwen"}
{"time":"2025-10-01T18:50:23.890Z","type":"subtask","agent":"qwen","description":"Create auth endpoints","success":true}
{"time":"2025-10-01T18:51:00.123Z","type":"phase_complete","phase":1}
{"time":"2025-10-01T18:51:05.456Z","type":"veto","agent":"claude","severity":"CRITICAL"}
```

**Event Types**:
- `task_created`: New task started
- `phase_start`: Phase beginning
- `subtask`: Individual subtask execution
- `phase_complete`: Phase finished
- `veto`: Claude blocked implementation
- `override`: Rule bypassed

### History Archive

Completed tasks moved to `.speckit/state/history/{date}-task-{taskId}/`:

```
.speckit/state/history/2025-10-01-task-T237/
├── task.json                  # Final task state
└── agent-outputs/             # All agent outputs
    ├── qwen/
    │   └── task-T237.json
    └── claude/
        └── task-T237.json
```

### Cursor Context Sync

State manager automatically updates `.cursor/context/` files:

1. **speckit-state.md**: High-level status summary
2. **speckit-active-task.md**: Detailed current task info
3. **speckit-constitution.md**: Quick rules reference

These files are automatically included in Cursor's AI context, so it always knows:
- What task is active
- What phase you're in
- What agents have done
- What rules apply

---

## CLI Command Reference

### Planning

```bash
# Start new task
npm run speckit:plan -- "Task description"
/speckit-start Task description

# Example
npm run speckit:plan -- "Add pagination to user list API"
```

### Implementation

```bash
# Execute current task
npm run speckit:implement
/speckit-implement
```

### Status

```bash
# Show current task
npm run speckit:status
/speckit-status
```

### Review

```bash
# Request specific review (placeholder)
npm run speckit:review -- --file path/to/file.js
/speckit-review path/to/file.js
```

### Metrics

```bash
# View metrics
npm run speckit:metrics
/speckit-metrics

# Output includes:
# - Total tasks completed
# - Success rate
# - Average duration
# - Cost breakdown by agent
# - Veto and redo rates
```

### Lessons

```bash
# Summarize lessons learned (placeholder)
npm run speckit:lessons
/speckit-lessons
```

### Overrides

```bash
# Add override
npm run speckit:override add <rule-id> <reason>

# List overrides
npm run speckit:override list

# Clear overrides
npm run speckit:override clear <task-id|all>

# Examples
npm run speckit:override add qwen.cannot.add_dependency "Using internal @company/utils package"
npm run speckit:override list
npm run speckit:override clear T237
npm run speckit:override clear all
```

---

## Integration with Cursor

### Slash Commands

SpecKit integrates with Cursor via custom slash commands defined in `.cursor/commands/`:

| Command | Description | Script |
|---------|-------------|--------|
| `/speckit-start` | Plan new task | `npm run speckit:plan` |
| `/speckit-implement` | Execute task | `npm run speckit:implement` |
| `/speckit-status` | Show status | `npm run speckit:status` |
| `/speckit-review` | Request review | `npm run speckit:review` |
| `/speckit-metrics` | View metrics | `npm run speckit:metrics` |
| `/speckit-lessons` | Summarize lessons | `npm run speckit:lessons` |
| `/speckit-override` | Manage overrides | `npm run speckit:override` |

### `.cursorrules` Integration

The `.cursorrules` file instructs Cursor when to use SpecKit:

**Auto-trigger for**:
- User says "implement", "build", "add feature"
- Changes involve >3 files
- Database/schema changes
- Security-sensitive code (auth, payments)
- Infrastructure changes

**Don't trigger for**:
- Quick fixes (<10 lines)
- Typo corrections
- Documentation-only changes
- User explicitly says "no speckit"

### Context Files

Cursor automatically reads `.cursor/context/*.md` files:

- **speckit-state.md**: Current task and status
- **speckit-active-task.md**: Detailed plan and phases
- **speckit-constitution.md**: Agent rules reference

This means Cursor's AI always knows the current SpecKit state without you having to explain it.

---

## Windows-Specific Considerations

### Path Handling

- Scripts use `path.join()` for cross-platform compatibility
- Supports Windows backslashes and Unix forward slashes
- Use quotes around paths with spaces: `npm run speckit:plan -- "My task"`

### Git Integration

- Uses `execSync()` with `--no-verify` flag
- Commits wrapped in try-catch (safe if not git repo)
- Disable auto-commits: `set SPECKIT_AUTOCOMMIT=0`

### Node.js ESM

- All scripts use ES modules (`import`/`export`)
- `package.json` includes `"type": "module"`
- Requires Node.js 14+ with ESM support

---

## Summary

SpecKit provides:
- **Structure**: Clear phases, agents, and workflows
- **Safety**: Constitutional rules and security reviews
- **Traceability**: Complete audit trail of decisions
- **Efficiency**: Right agent for right task
- **Integration**: Seamless Cursor experience

Start using this Bootstrap for any feature that requires:
- Multiple file changes
- Database modifications
- Security considerations
- Infrastructure setup
- Quality assurance

Next: See [NEW-PROJECT-SETUP.md](./NEW-PROJECT-SETUP.md) for step-by-step installation guide and check `specs/000-bootstrap/` for the bootstrap spec.
