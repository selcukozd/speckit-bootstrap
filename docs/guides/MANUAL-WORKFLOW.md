# Manual Multi-Agent Workflow

## Overview

This project uses **real multi-agent orchestration** with manual control:
- **PM (Project Manager)**: You, the developer → Task planning and coordination
- **Qwen**: Real CLI agent → Implementation
- **Claude**: Real CLI agent → Security review
- **Gemini**: Real CLI agent → Infrastructure

**NOTE:** Agents are NOT simulated - they run as real CLI processes calling actual APIs!

---

## Workflow Steps

### 1️⃣ Plan a Task

**In your terminal:**
```bash
npm run speckit:plan -- "Implement user authentication"
```

**Output:**
```
📋 Planning task (Manual Multi-Agent Mode)

✅ Task T103 planned

📝 CLI Commands to Execute (Manual Mode):

## Phase 1:

### 🤖 qwen - Create user authentication
```bash
npm run agent:qwen -- implement --task "Create user authentication" --spec "specs/001/spec.md"
```

## Phase 2:

### 🔍 claude - Security review
```bash
npm run agent:claude -- review --files "auth.js" --focus security,architecture
```
```

---

### 2️⃣ Execute Phase 1 - Implementation

**Copy and run the Phase 1 command:**
```bash
npm run agent:qwen -- implement --task "Create user authentication" --spec "specs/001/spec.md"
```

**Qwen output (example):**
```json
{
  "status": "complete",
  "agent": "qwen",
  "files_created": ["auth.js", "auth.test.js"],
  "summary": "Implemented user authentication with JWT",
  "code": {
    "auth.js": "// implementation code...",
    "auth.test.js": "// test code..."
  }
}
```

**What to do next:**
1. Review the JSON output
2. Check the `code` field for implementation
3. Save files if needed
4. Proceed to Phase 2

---

### 3️⃣ Execute Phase 2 - Review

**Copy and run the Phase 2 command:**
```bash
npm run agent:claude -- review --files "auth.js" --focus security,architecture
```

**Claude output (example):**
```json
{
  "status": "approved",
  "agent": "claude",
  "files": ["auth.js"],
  "issues": [
    {
      "severity": "medium",
      "type": "security",
      "file": "auth.js",
      "line": 42,
      "description": "JWT expiration should be configurable",
      "recommendation": "Move expiration to environment variable"
    }
  ],
  "summary": "Minor improvements needed, safe to proceed with fixes"
}
```

**What to do next:**
1. Review security issues
2. If CRITICAL issues → fix before proceeding
3. If MEDIUM/LOW issues → create backlog tasks or fix now
4. Proceed to Phase 3 or commit

---

### 4️⃣ Execute Phase 3 (if applicable) - Infrastructure

**Copy and run the Phase 3 command:**
```bash
npm run agent:gemini -- infra setup --type "database" --config ".speckit/profile.yaml"
```

**Gemini output (example):**
```json
{
  "status": "complete",
  "agent": "gemini",
  "action": "infra-setup",
  "type": "database",
  "steps": [
    {
      "action": "create_file",
      "target": "docker-compose.yml",
      "content": "version: '3.8'..."
    },
    {
      "action": "run_command",
      "target": "docker-compose up -d"
    }
  ],
  "services": ["postgres", "redis"],
  "summary": "Database infrastructure configured"
}
```

---

### 5️⃣ Commit Changes

**After all phases complete:**
```bash
git add .
git commit -m "feat: implement user authentication"
git push
```

---

## Advanced Workflows

### Parallel Phase Execution

If a phase has multiple independent tasks, you can run them in parallel:

```bash
# Terminal 1
npm run agent:qwen -- implement --task "Task 1"

# Terminal 2 (simultaneously)
npm run agent:qwen -- implement --task "Task 2"

# Terminal 3 (simultaneously)
npm run agent:qwen -- implement --task "Task 3"

# Collect all outputs and proceed
```

---

### Handling Errors

**If an agent fails:**
```bash
# Capture error output
npm run agent:qwen -- implement --task "Fix bug" 2>&1 | tee error.log

# Review error.log and retry with modified parameters
```

**If Claude vetoes (CRITICAL security issue):**
```json
{
  "status": "requires_changes",
  "issues": [
    {
      "severity": "critical",
      "description": "SQL injection vulnerability"
    }
  ]
}
```

→ Fix the issue and re-run implementation and review

---

### Constitutional Override

**If an agent is blocked by constitutional rules:**
```bash
# Override with justification
npm run speckit:override qwen.cannot.add_dependency "Adding express for routing - approved by tech lead"

# Re-run the blocked task
npm run agent:qwen -- implement --task "Add express routing"
```

---

## Full Example Walkthrough

```bash
# 1. Plan
npm run speckit:plan -- "Add user profile page"
#   Output: CLI commands for phases

# 2. Execute Phase 1 - Implementation
npm run agent:qwen -- implement --task "Create profile page" --files "src/pages/profile.tsx"
#   Output: {"status":"complete","files_created":["src/pages/profile.tsx"]}

# 3. Review output and save files

# 4. Execute Phase 2 - Review
npm run agent:claude -- review --files "src/pages/profile.tsx"
#   Output: {"status":"approved","issues":[]}

# 5. Commit
git add src/pages/profile.tsx
git commit -m "feat: add user profile page"
```

---

## Tips & Best Practices

### 1. Keep Terminal History
Save your terminal commands for repeatability:
```bash
history | grep "npm run" > workflow-history.txt
```

### 2. Use Shell Aliases
```bash
# Add to ~/.bashrc or ~/.zshrc
alias specplan='npm run speckit:plan --'
alias qwen='npm run agent:qwen --'
alias claude='npm run agent:claude --'
alias gemini='npm run agent:gemini --'

# Usage
specplan "Add login feature"
qwen implement --task "Create login"
```

### 3. JSON Processing
Use `jq` to parse agent outputs:
```bash
npm run agent:qwen -- implement --task "Test" | jq '.summary'
```

### 4. Stub Mode Testing
Test the workflow without real API calls:
- Agents automatically fall back to stub mode if API keys are invalid
- Use this to validate your workflow before burning API credits

---

## IDE Integration (Optional)

You can integrate this workflow with any IDE or editor:

### VS Code
- Use integrated terminal
- Create tasks in `.vscode/tasks.json`
- Use keyboard shortcuts to run tasks

### Neovim/Vim
- Use `:terminal` or tmux
- Map commands to keybindings
- Use ale or null-ls for linting

### IntelliJ/WebStorm
- Use built-in terminal
- Create run configurations
- Use external tools feature

### Any Editor
- Open a terminal alongside your editor
- Copy-paste commands as needed
- No special setup required!

---

## Troubleshooting

### "API call failed"
→ Check `.agent-keys.json` has valid API keys
→ Agent will fallback to stub mode automatically

### "Constitutional rule blocked task"
→ Use `npm run speckit:override` with justification
→ Or modify `.speckit/constitutional-rules.yaml`

### "Phase X commands not working"
→ Ensure you completed previous phases
→ Check `.speckit/state/current-task.json` for task state

---

## Comparison with Other Tools

**SpecKit vs. Fully Automated Tools:**
- ✅ Full visibility into agent actions
- ✅ Control at every step
- ✅ Easy debugging
- ✅ No surprises
- ❌ Requires manual copy-paste

**SpecKit vs. Cursor Composer/GitHub Copilot:**
- ✅ Multi-agent specialization
- ✅ Constitutional rules enforcement
- ✅ Security review built-in
- ✅ IDE-agnostic
- ❌ More command-line focused

---

**Philosophy**: Manual control > Full automation. You're the PM, agents are your team.
