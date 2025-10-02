# SpecKit Implement

Execute the current planned task with multi-agent orchestration.

## Usage
```
/speckit-implement
```

## What it does
1. Loads current task from state
2. Executes each phase sequentially or in parallel
3. Calls agent CLIs (qwen/claude/gemini) for each subtask
4. Enforces constitutional rules and approvals
5. Handles vetoes and re-implementations
6. Saves agent outputs and metrics
7. Archives completed task

## Prerequisites
- Must have an active task (run `/speckit-start` first)
- Task status must be "pending_approval"

## Script
```bash
npm run speckit:implement
```
