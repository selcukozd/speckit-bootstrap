## SPECKIT Orchestration Rules for Cursor

1. SPEC.md is source of truth.
2. Coordinate agents via orchestrator CLI.
3. Check `.cursor/context/speckit-state.md` before responding.
4. Enforce `.speckit/constitutional-rules.yaml` for approvals and vetoes.

### Commands
- `@speckit start <task>`: Plan a new task and save to state
- `@speckit implement`: Execute current task phases
- `@speckit status`: Show current status
- `@speckit review <file>`: Claude review for a file
- `@speckit rollback`: Revert last task changes

Refer to `.speckit/prompts/*` for agent templates.

