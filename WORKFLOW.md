# Multi-Agent Workflow (Manual Mode)

Overview

Cursor/GPT-5 acts as PM. Implementation and reviews run via agent CLI wrappers.

Steps

1. Create/choose spec: `/specify` then complete clarifications.
2. Plan: `@agents plan` or `npm run speckit:plan -- "<task>"` to see phases and CLI commands.
3. Implement (manual): Run Phase 1 commands in separate terminals.
4. Review: Run Claude review commands; address issues.
5. Finalize: Ensure tests pass, summarize, commit.

Agent CLI Examples

- Qwen (implementation)
```bash
npm run agent:qwen -- implement \
  --task "Create user model" \
  --files "src/models/user.ts" \
  --spec "specs/001/spec.md"
```

- Claude (review)
```bash
npm run agent:claude -- review \
  --files "src/models/user.ts,src/api/auth.ts" \
  --focus "security,architecture" \
  --spec "specs/001/spec.md"
```

- Gemini (infrastructure)
```bash
npm run agent:gemini -- infra setup \
  --type "database" \
  --config ".speckit/profile.yaml"
```

Notes

- Parallel tasks: run in separate terminals.
- Paste JSON outputs back into Cursor for phase advancement.
- Security-sensitive work requires Claude review.
