# Project Specification

**Project**: SpecKit Bootstrap
**Version**: 0.1.0
**Last Updated**: 2025-10-02

---

## Overview

This is the main specification file for your project. Update this file as your project evolves.

**Purpose**: Multi-Agent Development Framework - A bootstrap template for spec-driven development with specialized AI agents.

**Target Users**: 
- Developers starting new projects
- Teams adopting spec-driven development
- Projects requiring multi-agent coordination

---

## Core Features

### 1. Multi-Agent Orchestration
- **Status**: ✅ Implemented
- **Description**: Coordinate multiple specialized AI agents (Qwen, Claude, Gemini) for development tasks
- **Files**: 
  - `scripts/speckit/orchestrator.js`
  - `scripts/agents/*.js`

### 2. Constitutional Rules Engine
- **Status**: ✅ Implemented
- **Description**: Enforce agent capabilities and constraints via declarative YAML rules
- **Files**: 
  - `scripts/speckit/constitutional.js`
  - `.speckit/constitutional-rules.yaml`

### 3. Manual CLI Workflow
- **Status**: ✅ Implemented
- **Description**: User manually executes agent CLI commands (copy-paste workflow)
- **Benefits**: Full visibility, easy debugging, platform-agnostic

### 4. State Management
- **Status**: ✅ Implemented
- **Description**: Track task progress, agent outputs, and metrics
- **Files**: 
  - `scripts/speckit/state-manager.js`
  - `.speckit/state/` (gitignored)

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────┐
│            User (PM Role)                       │
│         Terminal + Any IDE                      │
└────────────────┬────────────────────────────────┘
                 │
                 │ CLI Commands
                 ▼
┌─────────────────────────────────────────────────┐
│        Orchestrator (orchestrator.js)           │
│  - Generates task plans                         │
│  - Creates CLI commands                         │
│  - Enforces constitutional rules                │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┬────────────────┐
        │                 │                │
        ▼                 ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Qwen Agent   │  │ Claude Agent │  │ Gemini Agent │
│ (implement)  │  │ (review)     │  │ (infra)      │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                │
        └────────┬────────┴────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Real AI APIs    │
        │ (with fallback) │
        └─────────────────┘
```

### Data Flow

1. User runs `npm run speckit:plan -- "task description"`
2. Orchestrator creates plan with phases
3. Orchestrator generates CLI commands for each phase
4. User copies and runs commands manually
5. Agents call real APIs (or fallback to stub mode)
6. Agents return JSON results
7. User reviews outputs and proceeds to next phase

---

## Technology Stack

### Core
- **Language**: JavaScript (Node.js ES Modules)
- **Package Manager**: npm
- **Config Format**: YAML, JSON
- **Version Control**: Git

### Dependencies
- `yaml@^2.5.1` - YAML parsing for constitutional rules
- `node-fetch@^3.x` - HTTP client for agent API calls

### External APIs
- **Qwen API**: Implementation agent (Alibaba Cloud)
- **Claude API**: Security review agent (Anthropic)
- **Gemini API**: Infrastructure agent (Google)

---

## Configuration Files

| File | Purpose | Committed |
|------|---------|-----------|
| `.speckit/constitutional-rules.yaml` | Agent capabilities/constraints | ✅ Yes |
| `.speckit/profile.yaml` | Tech stack configuration | ✅ Yes |
| `.agent-keys.json` | API keys (user creates) | ❌ No (gitignored) |
| `.agent-keys.example.json` | API keys template | ✅ Yes |
| `.speckit/state/*` | Task state, metrics, logs | ❌ No (gitignored) |

---

## Workflows

### Basic Task Workflow

```bash
# 1. Plan a task
npm run speckit:plan -- "Add user authentication"

# 2. Execute Phase 1 (Implementation)
npm run agent:qwen -- implement --task "Create login endpoint" --files "api/auth.js"

# 3. Execute Phase 2 (Review)
npm run agent:claude -- review --files "api/auth.js" --focus security

# 4. Execute Phase 3 (Infrastructure)
npm run agent:gemini -- infra setup --type "database" --config ".speckit/profile.yaml"

# 5. Commit changes
git add .
git commit -m "feat: add user authentication"
```

### Constitutional Override Workflow

```bash
# If an agent is blocked by constitutional rules
npm run speckit:override qwen.cannot.add_dependency "Adding express for routing - approved by team"

# Re-run the blocked task
npm run agent:qwen -- implement --task "Add express routing"
```

---

## Quality Standards

### Code Quality
- **Test Coverage**: Target 80% (currently 0%, needs implementation)
- **Linting**: ESLint (to be configured)
- **Formatting**: Prettier (to be configured)

### Security
- API keys MUST be in `.agent-keys.json` (gitignored)
- Agent outputs reviewed by Claude before deployment
- Constitutional rules enforce security constraints

### Performance
- API calls: < 5s response time
- Orchestrator planning: < 1s
- State management: Async, non-blocking

---

## Deployment

This is a **bootstrap template** - not deployed as a service.

**Distribution**:
- GitHub: https://github.com/selcukozd/speckit-bootstrap
- Users clone and customize for their projects

**Setup Requirements**:
1. Node.js 18+
2. npm
3. Git
4. API keys for agents (optional, can use stub mode)

---

## Roadmap

### v0.2.0 (Next Release)
- [ ] Add comprehensive test suite
- [ ] Implement CI/CD pipeline
- [ ] Add example project (todo-api)
- [ ] Improve error handling and logging

### v0.3.0 (Future)
- [ ] VS Code extension
- [ ] Web UI for orchestration
- [ ] Cost tracking and optimization
- [ ] Agent performance metrics

### v1.0.0 (Stable)
- [ ] Production-ready stability
- [ ] Complete documentation
- [ ] Multi-language support
- [ ] Plugin system for custom agents

---

## Contributing

See `CONTRIBUTING.md` (to be created) for guidelines.

---

## License

MIT License - See `LICENSE` file for details.

---

## Support

- **Issues**: https://github.com/selcukozd/speckit-bootstrap/issues
- **Documentation**: See README.md and docs/ folder
- **Examples**: See specs/000-example/ for templates

---

*This specification is a living document. Update as the project evolves.*

