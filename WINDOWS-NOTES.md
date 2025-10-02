# Windows Uyumluluk Notları

## PowerShell Sınırlamaları

### Bash Operatörleri Desteklenmiyor

PowerShell (5.1 ve öncesi) bu operatörleri desteklemez:
- `||` (OR)
- `&&` (AND)

**Doğru kullanım:**
```powershell
# Yanlış (bash)
npm run test || exit 0

# Doğru (PowerShell)
npm run test; if ($LASTEXITCODE -ne 0) { exit 0 }

# Veya
try { npm run test } catch { exit 0 }
```

### Script Path Sorunları

Windows'ta path'ler farklı davranır:
- Relative path'ler (`./script.ps1`) çalışma dizinine bağlı
- `$PWD` bash'teki gibi çalışmayabilir

**Çözüm:** Node.js scriptleri kullan (`npm run` ile):
```json
{
  "scripts": {
    "speckit:create": "node scripts/speckit/create-feature.js"
  }
}
```

## Cursor Hook'ları

Eğer Cursor otomatik validation çalıştırıyorsa ve `||` hatası alıyorsanız:
1. Hata kritik değil, Cursor kendi düzeltiyor
2. Hook'u bulmak için: `.cursor/`, `.git/hooks/`, veya workspace settings kontrol et
3. Hook'u Node.js script'ine çevir

## Platform-Agnostic Yaklaşım

✅ **Yapılması gereken:**
- npm scripts kullan
- Node.js scriptleri yaz
- Cross-platform kütüphaneler kullan (fs, path, etc.)

❌ **Yapılmaması gereken:**
- PowerShell/Bash'e özel syntax
- Hardcoded path separator (`/` veya `\\`)
- Platform-specific komutlar
