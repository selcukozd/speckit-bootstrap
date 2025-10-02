# VS Code Setup: Multi-Agent Workflow

## Neden VS Code?

**Cursor'dan VS Code'a geçiş sebepleri:**
1. ✅ Native terminal entegrasyonu (split terminals)
2. ✅ Task runner (`.vscode/tasks.json`) → Tek tuşla agent çalıştır
3. ✅ Bedava (Continue.dev + GPT-4 API daha ucuz)
4. ✅ Daha esnek (custom scripts, keybindings)
5. ✅ PowerShell uyumluluk sorunları yok

---

## Setup (Adım Adım)

### 1️⃣ VS Code Extensions Kur

```bash
# Extension'ları kur:
code --install-extension Continue.continue
code --install-extension ms-vscode.task-runner
code --install-extension eriklynd.json-tools
```

**Veya GUI'den:**
1. VS Code aç
2. `Ctrl+Shift+X` → Extensions
3. Ara ve kur:
   - **Continue** (Chat interface, GPT-4 API)
   - **Task Runner** (Task manager)
   - **JSON Tools** (JSON parsing)

---

### 2️⃣ Continue.dev Kur ve Yapılandır

**2.1. GPT-4 API Key Al**

```bash
# OpenAI'dan API key al:
https://platform.openai.com/api-keys

# Veya başka provider:
# - Anthropic (Claude API)
# - Google (Gemini API)
# - OpenRouter (multi-model)
```

**2.2. Continue Config**

`~/.continue/config.json` (veya VS Code'da `Ctrl+Shift+P` → "Continue: Edit Config"):

```json
{
  "models": [
    {
      "title": "GPT-4 (PM Role)",
      "provider": "openai",
      "model": "gpt-4-turbo-preview",
      "apiKey": "sk-..."
    }
  ],
  "systemMessage": "You are a PM coordinating multi-agent tasks. Generate CLI commands for Qwen/Claude/Gemini agents. Review their outputs and plan next steps.",
  "slashCommands": [
    {
      "name": "agents-plan",
      "description": "Plan multi-agent task execution",
      "prompt": "Read tasks.md and generate CLI commands for each agent. Output format:\n\nPhase 1:\n- Agent: qwen\n- Command: npm run agent:qwen -- implement...\n\nPhase 2:\n- Agent: claude\n- Command: npm run agent:claude -- review..."
    },
    {
      "name": "agents-review",
      "description": "Review agent outputs and plan next phase",
      "prompt": "I'll paste agent JSON outputs. Review them and:\n1. Check for errors/issues\n2. Generate next phase commands\n3. Mark complete if all phases done"
    }
  ]
}
```

---

### 3️⃣ VS Code Tasks Yapılandır

**`.vscode/tasks.json` oluştur:**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "SpecKit: Plan",
      "type": "shell",
      "command": "npm run speckit:plan -- '${input:taskDescription}'",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": true,
        "panel": "dedicated",
        "showReuseMessage": false
      },
      "problemMatcher": []
    },
    {
      "label": "Agent: Qwen Implement",
      "type": "shell",
      "command": "npm run agent:qwen -- implement --task '${input:qwenTask}' --files '${input:qwenFiles}' --spec '${input:specPath}'",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": true,
        "panel": "dedicated",
        "showReuseMessage": false,
        "clear": true
      },
      "problemMatcher": []
    },
    {
      "label": "Agent: Claude Review",
      "type": "shell",
      "command": "npm run agent:claude -- review --files '${input:claudeFiles}' --focus '${input:claudeFocus}' --spec '${input:specPath}'",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": true,
        "panel": "dedicated",
        "showReuseMessage": false,
        "clear": true
      },
      "problemMatcher": []
    },
    {
      "label": "Agent: Gemini Infra",
      "type": "shell",
      "command": "npm run agent:gemini -- infra setup --type '${input:geminiType}' --config '.speckit/profile.yaml'",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": true,
        "panel": "dedicated",
        "showReuseMessage": false
      },
      "problemMatcher": []
    }
  ],
  "inputs": [
    {
      "id": "taskDescription",
      "type": "promptString",
      "description": "Task description for planning"
    },
    {
      "id": "qwenTask",
      "type": "promptString",
      "description": "Qwen task description"
    },
    {
      "id": "qwenFiles",
      "type": "promptString",
      "description": "Files (comma-separated)",
      "default": ""
    },
    {
      "id": "claudeFiles",
      "type": "promptString",
      "description": "Files to review (comma-separated)"
    },
    {
      "id": "claudeFocus",
      "type": "promptString",
      "description": "Review focus (comma-separated)",
      "default": "security,architecture"
    },
    {
      "id": "specPath",
      "type": "promptString",
      "description": "Spec file path",
      "default": "specs/001/spec.md"
    },
    {
      "id": "geminiType",
      "type": "pickString",
      "description": "Infrastructure type",
      "options": ["database", "ci-cd", "monitoring", "container"],
      "default": "database"
    }
  ]
}
```

---

### 4️⃣ Keybindings Ekle (Opsiyonel)

**`.vscode/keybindings.json`:**

```json
[
  {
    "key": "ctrl+shift+p",
    "command": "workbench.action.tasks.runTask",
    "args": "SpecKit: Plan"
  },
  {
    "key": "ctrl+shift+q",
    "command": "workbench.action.tasks.runTask",
    "args": "Agent: Qwen Implement"
  },
  {
    "key": "ctrl+shift+c",
    "command": "workbench.action.tasks.runTask",
    "args": "Agent: Claude Review"
  }
]
```

---

### 5️⃣ Terminal Layout

**Split Terminal Setup:**

1. `Ctrl+Shift+\`` → Terminal aç
2. `Ctrl+Shift+5` → Split terminal (3 panel):
   - **Terminal 1**: Qwen tasks
   - **Terminal 2**: Claude reviews
   - **Terminal 3**: Gemini infra

**Veya otomatik:**

`.vscode/settings.json`:
```json
{
  "terminal.integrated.splitCwd": "workspaceRoot",
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.profiles.windows": {
    "Qwen Terminal": {
      "path": "pwsh.exe",
      "args": ["-NoExit", "-Command", "Write-Host '🤖 Qwen Terminal' -ForegroundColor Green"]
    },
    "Claude Terminal": {
      "path": "pwsh.exe",
      "args": ["-NoExit", "-Command", "Write-Host '🔍 Claude Terminal' -ForegroundColor Blue"]
    }
  }
}
```

---

## Workflow (VS Code)

### Senaryo 1: Tek Tuşla Task Çalıştır

```
1. Ctrl+Shift+P → "Tasks: Run Task"
2. Seç: "SpecKit: Plan"
3. Input: "Add user authentication"
4. Enter → CLI komutları terminalde
```

### Senaryo 2: Manuel Copy-Paste (Eski Yöntem)

```
1. Terminal'de: npm run speckit:plan -- "Add auth"
2. Copy CLI komutları
3. Continue.dev chat'te: "Here's the plan: {paste}"
4. GPT-4: "Run Phase 1 commands"
5. Terminal'de çalıştır, outputs'ları copy
6. Continue'ye yapıştır: "Phase 1 outputs: {paste}"
7. GPT-4: "✅ Phase 1 OK, run Phase 2..."
```

### Senaryo 3: Tam Otomatik (Task Runner)

```
1. Ctrl+Shift+Q → Qwen task popup
2. Input task description
3. Input files
4. Enter → Otomatik çalışır, JSON output
5. Output'u Continue'ye copy
6. Ctrl+Shift+C → Claude review popup
7. Input files
8. Enter → Review çalışır
9. Output'u Continue'ye copy
10. GPT-4: "All done ✅"
```

---

## Continue.dev Slash Commands

### `/agents-plan`

**Usage:**
```
/agents-plan

Task: Add user authentication
Files: src/models/user.ts, src/api/auth.ts
```

**GPT-4 Output:**
```markdown
📋 Multi-Agent Plan

Phase 1 (Parallel):
🤖 Qwen Task 1:
npm run agent:qwen -- implement --task "Create user model" --files "src/models/user.ts"

🤖 Qwen Task 2:
npm run agent:qwen -- implement --task "Create auth endpoints" --files "src/api/auth.ts"

Phase 2 (Sequential):
🔍 Claude Review:
npm run agent:claude -- review --files "src/models/user.ts,src/api/auth.ts" --focus security
```

### `/agents-review`

**Usage:**
```
/agents-review

Phase 1 outputs:

Qwen Task 1:
{"status":"complete","files_created":["src/models/user.ts"]}

Qwen Task 2:
{"status":"complete","files_created":["src/api/auth.ts"]}
```

**GPT-4 Output:**
```markdown
✅ Phase 1 Complete

Files Created:
- src/models/user.ts
- src/api/auth.ts

Next Phase: Security Review

Run:
npm run agent:claude -- review --files "src/models/user.ts,src/api/auth.ts" --focus security,architecture --spec "specs/001/spec.md"
```

---

## Advanced: Otomatik JSON Parsing

**`.vscode/tasks.json` ekle:**

```json
{
  "label": "Qwen + Parse",
  "type": "shell",
  "command": "npm run agent:qwen -- implement --task '${input:qwenTask}' | jq -r '.files_created[]'",
  "presentation": {
    "reveal": "always",
    "panel": "dedicated"
  }
}
```

**Kullanım:**
- Task çalıştır → JSON otomatik parse
- Output direkt Continue'ye yapıştır

---

## Continue.dev Context Files

**`.continuerc.json` (workspace root):**

```json
{
  "contextProviders": [
    {
      "name": "spec",
      "params": {
        "path": "specs/**/spec.md"
      }
    },
    {
      "name": "tasks",
      "params": {
        "path": "specs/**/tasks.md"
      }
    },
    {
      "name": "constitution",
      "params": {
        "path": ".specify/memory/constitution.md"
      }
    }
  ]
}
```

**Artık chat'te:**
```
@spec What's the current feature?
@tasks Show all pending tasks
@constitution Check agent capabilities
```

---

## Cursor vs VS Code Karşılaştırma

| Feature | Cursor | VS Code + Continue |
|---------|--------|-------------------|
| Chat UI | ✅ Native | ✅ Extension |
| Multi-file context | ✅ Auto | ✅ Manual (@file) |
| Slash commands | ✅ Built-in | ✅ Custom config |
| Terminal integration | ⚠️ Basic | ✅ Advanced (tasks) |
| Task runner | ❌ | ✅ Built-in |
| Keybindings | ⚠️ Limited | ✅ Full control |
| Cost | 💰 $20/month | ✅ Pay-as-you-go (GPT-4 API) |
| PowerShell issues | ⚠️ Frequent | ✅ Rare |
| Platform agnostic | ⚠️ Medium | ✅ High |
| Agent CLI workflow | ⚠️ Manual copy-paste | ✅ Task automation |

**Sonuç:** VS Code + Continue.dev + Task Runner = Daha iyi workflow

---

## Migration: Cursor → VS Code

### Adım 1: Proje Export

```bash
# Mevcut Cursor workspace'ini aç
# Proje zaten .git repo → VS Code'da aç

code .
```

### Adım 2: Extensions Kur

```bash
code --install-extension Continue.continue
```

### Adım 3: Continue Config

`Ctrl+Shift+P` → "Continue: Edit Config"
```json
{
  "models": [{
    "provider": "openai",
    "model": "gpt-4-turbo-preview",
    "apiKey": "sk-..."
  }]
}
```

### Adım 4: Tasks Ekle

`.vscode/tasks.json` oluştur (yukarıdaki config)

### Adım 5: Test

```bash
# Terminal'de:
npm run speckit:plan -- "Test task"

# Veya task runner:
Ctrl+Shift+P → "Tasks: Run Task" → "SpecKit: Plan"
```

---

## Bonus: Fully Automated (Advanced)

Eğer tamamen otomatik olsun istersen:

**`scripts/auto-orchestrator.js`:**

```javascript
#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function autoOrchestrate(taskDescription) {
  // 1. Plan
  console.log('📋 Planning...');
  const { stdout: planOutput } = await execAsync(`npm run speckit:plan -- "${taskDescription}"`);
  const plan = JSON.parse(planOutput.match(/\{[\s\S]*\}/)[0]);

  // 2. Execute phases
  for (const phase of plan.phases) {
    console.log(`\n🚀 Phase ${phase.phase}...`);

    const results = [];
    for (const task of phase.subtasks) {
      const cmd = generateCommand(task);
      console.log(`Running: ${cmd}`);

      const { stdout } = await execAsync(cmd);
      const result = JSON.parse(stdout);
      results.push(result);
    }

    console.log('✅ Phase complete');
    console.log(JSON.stringify(results, null, 2));
  }

  console.log('\n✅ All phases complete!');
}

function generateCommand(task) {
  switch(task.agent) {
    case 'qwen':
      return `npm run agent:qwen -- implement --task "${task.description}"`;
    case 'claude':
      return `npm run agent:claude -- review --focus security`;
    default:
      return `echo "Unknown agent: ${task.agent}"`;
  }
}

// CLI
const taskDescription = process.argv.slice(2).join(' ');
autoOrchestrate(taskDescription).catch(console.error);
```

**package.json:**
```json
{
  "scripts": {
    "auto": "node scripts/auto-orchestrator.js"
  }
}
```

**Usage:**
```bash
npm run auto -- "Add user authentication"

# Otomatik:
# 1. Plan oluştur
# 2. Phase 1 çalıştır (Qwen tasks)
# 3. Phase 2 çalıştır (Claude review)
# 4. Sonuçları göster
```

**Ama dikkat:** Debug zor, hata handling gerekli.

---

## Önerilen Setup (Final)

### Basit (Recommended ✅)
- VS Code
- Continue.dev (GPT-4 API)
- Manuel copy-paste workflow
- Split terminals

### Orta
- VS Code
- Continue.dev
- Task runner (`.vscode/tasks.json`)
- Keybindings

### Advanced
- VS Code
- Continue.dev
- Full automation (`auto-orchestrator.js`)
- CI/CD entegrasyonu

**Senin için:** Basit veya Orta yeterli. Advanced gereksiz karmaşıklık.

---

## Son Söz

**Cursor'da kalmak ister misin?**
- Manuel workflow şu an çalışıyor
- `MANUAL-WORKFLOW.md` takip et
- Copy-paste yeterli

**VS Code'a geçmek ister misin?**
- Bu guide'ı takip et
- Daha native terminal workflow
- Task runner ile tek tuş

Her ikisi de **gerçek multi-agent orkestrasyon** yapıyor. Seçim senin!
