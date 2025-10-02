# Manual Multi-Agent Workflow

## Overview

Bu proje **gerçek multi-agent orkestrasyon** kullanır:
- **PM (Project Manager)**: Cursor/GPT-5 → Task planlama, koordinasyon
- **Qwen**: Gerçek CLI → Implementation
- **Claude**: Gerçek CLI → Security review
- **Gemini**: Gerçek CLI → Infrastructure

**NOT:** Agent'lar simüle edilmiyor, terminal'de gerçekten çalışıyor!

---

## Workflow

### 1️⃣ Spec Oluştur

**Cursor'da:**
```
/specify "Kullanıcı authentication sistemi ekle"
```

**Cursor:**
- Spec oluşturur
- Belirsizlikleri işaretler
- `specs/002-xxx/spec.md` kaydeder

---

### 2️⃣ Plan Oluştur

**Terminal'de:**
```bash
npm run speckit:plan -- "Implement user authentication"
```

**Çıktı:**
```
📋 Planning task (Manual Multi-Agent Mode)

✅ Task T103 planned

📝 CLI Commands to Execute (Manual Mode):

## Phase 1:

### 🤖 qwen - Create user authentication
\`\`\`bash
npm run agent:qwen -- implement --task "Create user authentication" --spec "specs/001/spec.md"
\`\`\`

## Phase 2:

### 🔍 claude - Security review
\`\`\`bash
npm run agent:claude -- review --focus security,architecture --spec "specs/001/spec.md"
\`\`\`
```

**Cursor → GPT-5:** Bu çıktıyı Cursor'a yapıştır, PM koordinasyon yapsın

---

### 3️⃣ Implement (Manuel - Paralel Execution)

**Terminal 1 (Qwen Task 1):**
```bash
npm run agent:qwen -- implement \
  --task "Create user model" \
  --files "src/models/user.ts" \
  --spec "specs/001/spec.md"
```

**Output:**
```json
{
  "status": "complete",
  "agent": "qwen",
  "files_created": ["src/models/user.ts"],
  "summary": "Implemented: Create user model",
  "spec": "specs/001/spec.md"
}
```

**Terminal 2 (Qwen Task 2 - Parallel):**
```bash
npm run agent:qwen -- implement \
  --task "Create auth endpoints" \
  --files "src/api/auth.ts" \
  --spec "specs/001/spec.md"
```

**Cursor'a Yapıştır:**
```
Phase 1 complete. Qwen outputs:

Task 1:
{json output}

Task 2:
{json output}
```

**Cursor → GPT-5:**
- Outputs'ları review eder
- Phase 2 komutlarını verir

---

### 4️⃣ Security Review (Claude)

**Terminal 3 (Claude):**
```bash
npm run agent:claude -- review \
  --files "src/models/user.ts,src/api/auth.ts" \
  --focus security,architecture \
  --spec "specs/001/spec.md"
```

**Output:**
```json
{
  "status": "approved",
  "agent": "claude",
  "files": ["src/models/user.ts", "src/api/auth.ts"],
  "focus": ["security", "architecture"],
  "spec": "specs/001/spec.md",
  "issues": []
}
```

**Cursor'a Yapıştır:**
```
Phase 2 complete. Claude review:
{json output}
```

**Cursor → GPT-5:**
- Review'ı analiz eder
- Eğer issue varsa → Qwen'e fix komutu üretir
- Eğer approved → "✅ All complete, ready to commit"

---

## Agent CLI Komutları

### Qwen (Implementation)

```bash
npm run agent:qwen -- implement \
  --task "Task description" \
  --files "path/to/file1.ts,path/to/file2.ts" \
  --spec "specs/001/spec.md"
```

**Output Format:**
```json
{
  "status": "complete",
  "agent": "qwen",
  "files_created": ["path/to/file1.ts"],
  "summary": "Brief description",
  "spec": "specs/001/spec.md"
}
```

---

### Claude (Security Review)

```bash
npm run agent:claude -- review \
  --files "src/**/*.ts" \
  --focus "security,architecture,performance" \
  --spec "specs/001/spec.md"
```

**Output Format:**
```json
{
  "status": "approved|rejected",
  "agent": "claude",
  "files": ["src/file1.ts"],
  "focus": ["security"],
  "spec": "specs/001/spec.md",
  "issues": [
    {
      "severity": "HIGH",
      "file": "src/auth.ts",
      "line": 45,
      "description": "SQL injection risk",
      "fix": "Use parameterized queries"
    }
  ]
}
```

---

### Gemini (Infrastructure)

```bash
npm run agent:gemini -- infra setup \
  --type "database|ci-cd|monitoring" \
  --config ".speckit/profile.yaml"
```

**Output Format:**
```json
{
  "status": "complete",
  "agent": "gemini",
  "type": "database",
  "actions_taken": [
    "Created PostgreSQL database",
    "Set up migrations"
  ]
}
```

---

## Tips & Tricks

### Paralel Execution
```bash
# Ayrı terminal'lerde çalıştır:
Terminal 1: npm run agent:qwen -- implement --task "Task 1"
Terminal 2: npm run agent:qwen -- implement --task "Task 2"
Terminal 3: npm run agent:qwen -- implement --task "Task 3"

# Hepsi bitince outputs'ları Cursor'a yapıştır
```

### JSON Parsing (Optional)
```bash
npm run agent:qwen -- implement --task "Create model" | jq '.files_created'
```

### Error Handling
```bash
# Eğer agent hata verirse:
npm run agent:qwen -- implement --task "Fix bug" 2>&1 | tee error.log

# Cursor'a yapıştır, düzeltme planı istesin
```

### Git Workflow
```bash
# Phase 1-2-3 complete olduktan sonra:
git add .
git commit -m "feat: user authentication"
git push
```

---

## Current Status

**✅ Çalışan:**
- `npm run speckit:plan` → CLI komutları üretiyor
- `npm run agent:qwen` → JSON output veriyor (şu an stub)
- `npm run agent:claude` → JSON output veriyor (şu an stub)

**🔄 Yapılacak:**
- Agent CLI'larını gerçek API'lara bağla
- Qwen API entegrasyonu
- Claude API entegrasyonu
- Gemini API entegrasyonu

---

## Şu Anda Stub (Gerçek API Değil)

Agent CLI'lar şu an **stub** (sahte veri dönüyor):

```javascript
// scripts/agents/qwen-cli.js
const result = {
  status: 'complete',
  agent: 'qwen',
  files_created: files ? files.split(',') : [],
  summary: `Implemented: ${task}`,
  spec
};
```

**Gerçek API entegrasyonu için:**
1. Qwen API key al
2. `scripts/agents/qwen-cli.js` → API çağrısı ekle
3. Aynı şekilde Claude ve Gemini için

---

## Örnek Session

```bash
# 1. Plan
$ npm run speckit:plan -- "Add user profile page"

📝 CLI Commands:
## Phase 1:
### 🤖 qwen - Create profile component
npm run agent:qwen -- implement --task "Create profile component"

# 2. Copy komutu, terminal'de çalıştır
$ npm run agent:qwen -- implement --task "Create profile component"
{"status":"complete","files_created":["src/components/Profile.tsx"]}

# 3. Cursor'a yapıştır
User → Cursor: "Phase 1 complete: {json}"

# 4. Cursor sonraki komutu verir
Cursor: "✅ Profile created. Next: Claude review"
  npm run agent:claude -- review --files "src/components/Profile.tsx"

# 5. Çalıştır, yapıştır
$ npm run agent:claude -- review --files "src/components/Profile.tsx"
{"status":"approved","issues":[]}

User → Cursor: "Phase 2 complete: {json}"
Cursor: "✅ All phases complete. Ready to commit."
```

---

## VS Code Setup (Opsiyonel)

Eğer VS Code'a geçersen:
1. Bu workflow değişmez
2. Sadece Cursor yerine VS Code terminal kullanırsın
3. PM rolü için Continue.dev extension + GPT-4 API

Detaylı VS Code setup: `VS-CODE-SETUP.md` (ayrı dokümanda)
