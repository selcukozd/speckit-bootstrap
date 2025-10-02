# SpecKit Start

Start a new task with multi-agent planning.

## Usage
```
/speckit-start <task description>
```

## What it does
1. Creates a new task with unique ID
2. Analyzes the task description
3. Breaks down into phases and subtasks
4. Assigns agents based on capabilities
5. Estimates time and cost
6. Saves state to `.speckit/state/current-task.json`

## Example
```
/speckit-start Add user authentication with email/password
```

## Script
```bash
npm run speckit:plan -- "$ARGUMENTS"
```
