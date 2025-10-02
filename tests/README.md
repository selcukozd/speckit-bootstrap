# Tests Directory

This directory will contain the test suite for SpecKit Bootstrap.

## Structure

```
tests/
├── unit/              # Unit tests for individual functions/classes
│   ├── orchestrator.test.js
│   ├── state-manager.test.js
│   ├── constitutional.test.js
│   └── agents/
│       ├── qwen-cli.test.js
│       ├── claude-cli.test.js
│       └── gemini-cli.test.js
├── integration/       # Integration tests for component interactions
│   ├── e2e-workflow.test.js
│   ├── agent-orchestrator.test.js
│   └── state-persistence.test.js
└── contract/          # Contract tests for external APIs
    ├── qwen-api.test.js
    ├── claude-api.test.js
    └── gemini-api.test.js
```

## Recommended Test Framework

We recommend using **Vitest** for testing:

```bash
npm install --save-dev vitest
```

Update `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

## Example Unit Test

```javascript
// tests/unit/orchestrator.test.js
import { describe, it, expect } from 'vitest';
import { SpecKitOrchestrator } from '../../scripts/speckit/orchestrator.js';

describe('SpecKitOrchestrator', () => {
  it('should create a plan with valid task description', async () => {
    const orchestrator = new SpecKitOrchestrator();
    const plan = await orchestrator.plan('Test task');
    
    expect(plan).toBeDefined();
    expect(plan.task_id).toMatch(/^T\d+$/);
    expect(plan.phases).toBeInstanceOf(Array);
    expect(plan.phases.length).toBeGreaterThan(0);
  });
  
  it('should generate CLI commands from plan', () => {
    const orchestrator = new SpecKitOrchestrator();
    const plan = {
      phases: [
        {
          phase: 1,
          subtasks: [
            { agent: 'qwen', action: 'implement', description: 'Test' }
          ]
        }
      ]
    };
    
    const commands = orchestrator.generateCLICommands(plan);
    expect(commands).toHaveProperty('1');
    expect(commands[1][0].command).toContain('npm run agent:qwen');
  });
});
```

## Example Integration Test

```javascript
// tests/integration/e2e-workflow.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';

describe('End-to-End Workflow', () => {
  beforeEach(() => {
    // Cleanup state
    if (fs.existsSync('.speckit/state')) {
      fs.rmSync('.speckit/state', { recursive: true });
    }
  });
  
  it('should complete full workflow: plan -> implement -> review', async () => {
    // Plan
    const planOutput = execSync('npm run speckit:plan -- "Test feature"').toString();
    expect(planOutput).toContain('Task');
    expect(planOutput).toContain('planned');
    
    // Implement (stub mode)
    const implOutput = execSync('npm run agent:qwen -- implement --task "Test"').toString();
    expect(implOutput).toContain('complete');
    
    // Review (stub mode)
    const reviewOutput = execSync('npm run agent:claude -- review --files "test.js"').toString();
    expect(reviewOutput).toContain('approved');
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest run tests/unit/orchestrator.test.js
```

## Coverage Goals

- **Target**: 80% code coverage
- **Critical Components**: 100% coverage
  - `orchestrator.js`
  - `constitutional.js`
  - `state-manager.js`

## TODO

- [ ] Install Vitest
- [ ] Write unit tests for all scripts
- [ ] Write integration tests for workflows
- [ ] Write contract tests for APIs
- [ ] Configure coverage reporting
- [ ] Add test results to CI/CD

---

**Contributors**: See `CONTRIBUTING.md` for testing guidelines.

