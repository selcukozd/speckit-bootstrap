# ⚡ Quickstart: 5 Dakikada Başla

Bu guide ile 5 dakikada ilk feature spec'ini oluştur ve multi-agent workflow'u çalıştır.

---

## 🎯 Ön Koşullar

- Node.js 18+ yüklü olmalı
- Git yüklü olmalı
- Terminal/CMD bilgisi (temel)

---

## 📦 Adım 1: Projeyi Clone'la (30 saniye)

```bash
git clone https://github.com/selcukozd/speckit-bootstrap.git my-project
cd my-project
```

---

## 🔧 Adım 2: Dependencies Kur (1 dakika)

```bash
npm install
```

**Çıktı:**
```
added 2 packages in 3s
```

---

## 🔑 Adım 3: Agent API Keys Ekle (2 dakika)

### 3.1. Config Dosyası Oluştur

```bash
# Windows
copy .agent-keys.example.json .agent-keys.json

# Mac/Linux
cp .agent-keys.example.json .agent-keys.json
```

### 3.2. API Keys'leri Doldur

`.agent-keys.json` dosyasını aç ve API key'lerini ekle:

```json
{
  "qwen": {
    "api_key": "YOUR-QWEN-KEY"
  },
  "claude": {
    "api_key": "sk-ant-api03-YOUR-KEY"
  },
  "openai": {
    "api_key": "sk-YOUR-KEY"
  }
}
```

**API Key nasıl alınır?**
- **Qwen**: https://dashscope.aliyun.com/
- **Claude**: https://console.anthropic.com/
- **OpenAI** (GPT-4): https://platform.openai.com/api-keys

**Not:** Şimdilik stub agent'lar kullanıyoruz, API keys opsiyonel.

---

## 🚀 Adım 4: İlk Spec'ini Oluştur (1 dakika)

```bash
npm run speckit:plan -- "Create user authentication system"
```

**Çıktı:**
```
📋 Planning task (Manual Multi-Agent Mode)

✅ Task T103 planned

📝 CLI Commands to Execute (Manual Mode):

## Phase 1:

### 🤖 qwen - Create user authentication system
```bash
npm run agent:qwen -- implement --task "Create user authentication system"
```

## Phase 2:

### 🔍 claude - Security review
```bash
npm run agent:claude -- review --focus security,architecture
```
```

---

## 🎬 Adım 5: Agent'ları Çalıştır (30 saniye)

### 5.1. Qwen (Implementation)

**Copy-paste Phase 1 komutunu:**
```bash
npm run agent:qwen -- implement --task "Create user authentication system"
```

**Çıktı:**
```json
{
  "status": "complete",
  "agent": "qwen",
  "files_created": [],
  "summary": "Implemented: Create user authentication system"
}
```

### 5.2. Claude (Review)

**Copy-paste Phase 2 komutunu:**
```bash
npm run agent:claude -- review --focus security,architecture
```

**Çıktı:**
```json
{
  "status": "approved",
  "agent": "claude",
  "files": [],
  "issues": []
}
```

---

## ✅ Tamamlandı!

İlk multi-agent workflow'unu tamamladın! 🎉

---

## 🔄 Sonraki Adımlar

### Gerçek Agent API'larını Bağla

Şu an agent'lar **stub** (sahte veri dönüyor). Gerçek API'lara bağlamak için:

**`scripts/agents/qwen-cli.js` dosyasını düzenle:**
```javascript
// Gerçek API çağrısı ekle
import fetch from 'node-fetch';

const config = JSON.parse(fs.readFileSync('.agent-keys.json', 'utf-8'));

const response = await fetch(config.qwen.endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${config.qwen.api_key}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: config.qwen.model,
    messages: [{
      role: 'user',
      content: `Implement: ${task}`
    }]
  })
});

const result = await response.json();
```

Aynı şekilde `claude-cli.js` ve `gemini-cli.js` için tekrarla.

---

### IDE Setup (Opsiyonel)

**Herhangi bir IDE/Editor kullanabilirsin:**
- VS Code, Neovim, IntelliJ, Sublime, veya sadece terminal
- `MANUAL-WORKFLOW.md` oku
- Terminal yanında aç, komutları copy-paste et
- IDE-agnostic: Özel kurulum gerekmez!

---

## 🆘 Sorun mu Yaşıyorsun?

### "npm: command not found"
```bash
# Node.js yükle:
https://nodejs.org/
```

### "Permission denied"
```bash
# Windows PowerShell'i admin olarak çalıştır
# veya ExecutionPolicy değiştir:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### "ENOENT: no such file or directory"
```bash
# Doğru dizinde olduğundan emin ol:
pwd  # Linux/Mac
cd   # Windows

# Eğer proje root'unda değilsen:
cd path/to/my-project
```

---

## 📚 Daha Fazla Bilgi

- **Detaylı Workflow**: `MANUAL-WORKFLOW.md`
- **VS Code Setup**: `VS-CODE-SETUP.md`
- **Example Spec**: `specs/000-example/spec.md`
- **Windows Notes**: `WINDOWS-NOTES.md`

---

## 🎓 Workflow Özeti

```
1. npm run speckit:plan -- "Feature description"
   └─> CLI komutları üretir

2. Terminal'de agent komutlarını çalıştır
   └─> JSON outputs al

3. Sen (PM rolünde):
   - Agent outputs'larını review et
   - Sonraki phase'e karar ver
   - Manuel olarak ilerle

4. Tüm phases complete → git commit
```

**Her yeni feature için:**
1. `npm run speckit:plan`
2. Agent CLI'larını çalıştır
3. Review & iterate
4. Commit & push

İyi kodlamalar! 🚀
