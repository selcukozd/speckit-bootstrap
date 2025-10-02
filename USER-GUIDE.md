# SpecKit Bootstrap Kullanım Kılavuzu

Bu kılavuz, SpecKit bootstrap'ını yeni projeleri hızlı ve güvenli şekilde başlatmak için nasıl kullanacağınızı gösterir.

---

## 📋 İçindekiler

1. [Temel Kullanım](#temel-kullanım)
2. [Yeni Proje Başlatma (Bootstrap)](#yeni-proje-başlatma-bootstrap)
3. [Günlük İş Akışı](#günlük-iş-akışı)
4. [Agent'ları Anlama](#agentları-anlama)
5. [Constitutional Rules](#constitutional-rules)
6. [En İyi Pratikler](#en-iyi-pratikler)
7. [Sorun Giderme](#sorun-giderme)
8. [İleri Seviye Kullanım](#ileri-seviye-kullanım)

---

## Temel Kullanım

### Cursor'da Slash Komutları

SpecKit, Cursor IDE'de doğrudan kullanabileceğiniz slash komutlarıyla gelir:

```
/speckit-start <task açıklaması>    → Yeni task planla
/speckit-implement                  → Planı çalıştır
/speckit-status                     → Durum göster
/speckit-review <file>              → Claude güvenlik incelemesi
/speckit-metrics                    → Metrikleri göster
/speckit-override <rule> <neden>    → Kural override et
/speckit-init <proje-adı>           → Yeni proje başlat
```

### Terminal Komutları

Alternatif olarak terminal'den de kullanabilirsiniz:

```bash
npm run speckit:plan -- "Task açıklaması"
npm run speckit:implement
npm run speckit:status
npm run speckit:validate specs/*/spec.md
```

---

## Yeni Proje Başlatma (Bootstrap)

### Adım 1: Projeyi İnit Et

```bash
# Cursor'da
/speckit-init my-new-project

# Veya terminal'de
npm run speckit:init -- my-new-project
```

Bu komut şunları oluşturur:
- ✅ Bootstrap dizin yapısı
- ✅ Constitution ve templates
- ✅ Orchestrator ve state yönetimi
- ✅ README ve dokümantasyon

### Adım 2: Profil'i Özelleştir

`.speckit/profile.yaml` dosyasını düzenle (stack-agnostic profil):

```yaml
language: typescript
framework: nextjs
package_manager: pnpm
linter: eslint
formatter: prettier
test_runner: vitest
coverage_threshold: 0.8

datastores: [postgres, redis]
security_defaults:
  validation_lib: zod
  secret_manager: env
  auth_scheme: session

performance_budgets:
  api_p95_ms: 200
  bundle_kb: 500
  job_latency_ms: 1000
```

### Adım 3: Environment Variables

```bash
cp .env.example .env
# .env dosyasını gerçek değerlerle doldur
```

### Adım 4: Bağımlılıkları Kur

```bash
npm install
```

### Adım 5: (Opsiyonel) Bulut Servislerini Setup Et

```bash
# Örnekler (ihtiyaca göre):
# gcloud auth application-default login
# aws configure
```

---

## Günlük İş Akışı

### Senaryo 1: Bootstrap Doğrulama Task'ı

#### 1. Task Planla

```
/speckit-start Validate bootstrap deliverables exist and pass constitution gates
```

Sistem şunları yapar:
- Task ID oluşturur (örn: T456)
- Task'ı phase'lere böler
- Her phase'i uygun agent'lara atar
- Süre ve risk tahmini yapar
- State'i `.speckit/state/current-task.json`'a kaydeder

**Çıktı Örneği:**
```
📋 Multi-Agent Execution Plan
Feature: Bootstrap Validation

Phase 1 (Parallel - 15 min)
├─ 🤖 Qwen: Check `.specify/templates` alignment
├─ 🤖 Qwen: Verify `.speckit/profile.yaml` schema
└─ ☁️ Gemini: Validate CI scripts (optional)

Phase 2 (Sequential - 10 min)
├─ 🔍 Claude: Security review
└─ 🔍 Claude: Architecture review

Total: 25 min
Approve? (yes/no)
```

#### 2. Plan'ı İncele ve Onayla

State'i kontrol et:
```
/speckit-status
```

Plan uygunsa implement et:
```
/speckit-implement
```

#### 3. Agent'lar Çalışır

Sistem sırayla:
1. **Qwen** doğrulamalar ve testleri yazar (CLI ile)
2. **Claude** güvenlik review yapar (CLI ile)
3. Sorun varsa düzeltir
4. Test'leri çalıştırır
5. Başarıysa arşivler

**Real-time Çıktı:**
```
🚀 Executing Multi-Agent Plan

Phase 1: Implementation
├─ 🤖 Qwen: Verifying `.speckit/profile.yaml`
│  └─ Status: ✅ Complete (2 min)

Phase 2: Security Review
🔍 Claude: Analyzing security...
🟡 MEDIUM: Missing `security_defaults.secret_manager` in profile
   Fix: Set to `env` or your cloud secret manager

🔄 Qwen: Applying fixes...
✅ Fixed

Phase 2: ✅ Complete

✅ Bootstrap Validated!
```

#### 4. Commit Et

```bash
git status
git add .
git commit -m "chore(bootstrap): validate and update profile

🤖 Generated with SpecKit
Task: T456
Agents: Qwen (implementation), Claude (review)
"
```

---

## Agent'ları Anlama

### 🧠 GPT-5 (Orchestrator)

**Ne Yapar:**
- Task'ları planlar ve böler
- Agent'ları koordine eder
- Final kararları verir

**Ne Yapmaz:**
- Kod yazmaz (agent'lara delege eder)
- Claude veto'sunu override edemez

**Ne Zaman Çalışır:** Her plan phase'inde

---

### 🤖 Qwen (Implementation Engineer)

**Ne Yapar:**
- Spec'e göre kod/validasyon/test yazar
- API endpoint'leri implement eder
- Unit test'ler yazar
- CRUD operations

**Ne Yapmaz:**
- ❌ Database schema değiştiremez
- ❌ Auth/authorization değiştiremez
- ❌ Bağımlılık ekleyemez
- ❌ API contract'ları değiştiremez

**Limitler:**
- Max 500 satır per task
- Test yazmak zorunlu
- Spec'i harfiyen takip eder

---

### 🔍 Claude (Security Reviewer & Architect)

**Ne Yapar:**
- Güvenlik review
- Architecture review
- **VETO** yetkisi var (HIGH/CRITICAL risks için)
- Refactoring önerileri

**Ne Yapmaz:**
- Test fail ederse deploy onaylamaz
- Auth değişikliklerini skip edemez

**Veto Kriterleri:**
- SQL injection riski
- Auth bypass mümkünlüğü
- Hardcoded secrets
- Unbounded resource usage

---

### ☁️ Gemini (Infrastructure Specialist)

**Ne Yapar:**
- CI/CD konfigürasyonu
- Database/secret store entegrasyonu
- Monitoring ve logging

**Ne Yapmaz:**
- Frontend kod yazmaz
- Business logic implement etmez

---

## Constitutional Rules

Kurallar `.speckit/constitutional-rules.yaml` dosyasında tanımlıdır. Güvenlik-kritik değişiklikler (auth, payments, user data) için Claude review zorunludur.

---

## En İyi Pratikler

- Her zaman spec-driven çalış: `/specify → /clarify → /plan → /tasks → /implement`
- Profil (profile.yaml) üzerinden yapılandır: kodu değiştirmeden ayarla
- Metrics'i takip et: `npm run speckit:metrics`

---

## Sorun Giderme

- Task takıldı: `/speckit-status`, `.speckit/state/logs/speckit.ndjson`
- Veto: Review içeriğini uygula, tekrar `/speckit-implement`
- Auto-commit kapatma: `set SPECKIT_AUTOCOMMIT=0`

---

## Hızlı Referans

```bash
# Planning
/speckit-start <task>
/speckit-validate <spec>

# Execution
/speckit-implement
/speckit-status

# Review
/speckit-review <file>

# Metrics & Logs
/speckit-metrics
/speckit-lessons

# Management
/speckit-override <rule> <reason>

# Project Setup
/speckit-init <project-name>
```

### Dosya Yapısı

```
project/
├── .speckit/
│   ├── profile.yaml               → Teknoloji profili
│   ├── constitutional-rules.yaml  → Agent kuralları
│   ├── prompts/                   → Agent prompt'ları
│   └── state/                     → Task state & logs
├── .cursor/
│   ├── commands/                  → Slash komutlar
│   └── context/                   → Cursor context files
├── scripts/speckit/               → SpecKit scripts
├── specs/                         → Feature specs
└── .cursorrules                   → Orchestration rules
```

### Environment Variables

```bash
SPECKIT_AUTOCOMMIT=1
```

---

## Destek

- 📖 System Overview: `SYSTEM-OVERVIEW.md`
- 🚀 Setup Guide: `NEW-PROJECT-SETUP.md`
- 📝 Constitution: `.specify/memory/constitution.md`
- 🔧 Profile: `.speckit/profile.yaml`
