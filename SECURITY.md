# Security Guidelines

## 🚨 Critical Security Warnings

### API Keys Management
- **NEVER** commit API keys to source control
- **ALWAYS** use `.agent-keys.json` for agent API keys (gitignored)
- **ALWAYS** use environment variables for production secrets
- **NEVER** hardcode credentials in source code

### Environment Variables
```bash
# Development
.agent-keys.json (gitignored)

# Production
Use secret management:
- Google Cloud Secret Manager
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
```

---

## 🔐 Best Security Practices

### 1. Credentials Management
- ✅ Use environment variables
- ✅ Use secret management services in production
- ✅ Rotate API keys regularly
- ❌ Never commit `.agent-keys.json`
- ❌ Never put secrets in code comments
- ❌ Never log API keys

### 2. Agent API Security
- All agent APIs require valid API keys
- Rate limiting should be implemented
- Monitor API usage for anomalies
- Use HTTPS only for API calls

### 3. File System Security
- ✅ `.speckit/state/` is gitignored (may contain sensitive data)
- ✅ `.speckit/context/` is gitignored (may contain task details)
- ✅ Agent outputs are stored locally only
- ❌ Never commit state files

### 4. Input Validation
- All agent CLI inputs should be validated
- Task descriptions should be sanitized
- File paths should be checked for directory traversal
- Command injection prevention in orchestrator

---

## 🔍 Security Checklist

### Pre-Production Deployment
- [ ] All `.agent-keys.json` files in `.gitignore`
- [ ] No hardcoded secrets in source code
- [ ] Environment variables properly configured
- [ ] HTTPS enforced for all API calls
- [ ] Rate limiting configured for agents
- [ ] Logging does not expose secrets
- [ ] Dependencies scanned for vulnerabilities

### Development Environment
- [ ] `.agent-keys.json` never committed
- [ ] Test credentials different from production
- [ ] Local state files gitignored
- [ ] No production API keys in development

---

## 🚨 Incident Response

### If API Keys Are Compromised

**Immediate Actions (< 5 minutes):**
1. **Revoke compromised keys** in respective provider consoles
   - Qwen: https://dashscope.console.aliyun.com/
   - Claude: https://console.anthropic.com/
   - Gemini: https://console.cloud.google.com/

2. **Generate new keys** immediately

3. **Update all environments**
   ```bash
   # Update local
   cp .agent-keys.example.json .agent-keys.json
   # Add new keys
   
   # Update production (if using secret manager)
   gcloud secrets versions add agent-keys --data-file=.agent-keys.json
   ```

4. **Audit git history** for leaked keys
   ```bash
   git log -S "sk-ant-" --all  # Search for Claude keys
   git log -S "your-qwen" --all  # Search for Qwen keys
   ```

5. **Review access logs** from API providers for unauthorized usage

**Follow-up Actions (< 24 hours):**
- [ ] Identify how keys were compromised
- [ ] Implement additional safeguards
- [ ] Document incident in `.speckit/security-incidents.md`
- [ ] Update this SECURITY.md if needed

---

## 🔒 Secret Management Patterns

### Option 1: Local Development (Default)
```json
// .agent-keys.json (gitignored)
{
  "qwen": {
    "api_key": "your-key-here",
    "endpoint": "https://dashscope.aliyuncs.com/api/v1"
  }
}
```

### Option 2: Environment Variables
```bash
# Set in shell
export QWEN_API_KEY="your-key"
export CLAUDE_API_KEY="your-key"
export GEMINI_API_KEY="your-key"

# Agent CLIs read from env if .agent-keys.json not found
```

### Option 3: Google Cloud Secret Manager
```bash
# Store secrets
gcloud secrets create agent-keys --data-file=.agent-keys.json

# Retrieve in application
gcloud secrets versions access latest --secret="agent-keys"
```

### Option 4: AWS Secrets Manager
```bash
# Store secrets
aws secretsmanager create-secret --name agent-keys --secret-string file://.agent-keys.json

# Retrieve in application
aws secretsmanager get-secret-value --secret-id agent-keys
```

---

## 🛡️ Security Monitoring

### What to Monitor
- Failed API authentication attempts
- Unusual agent usage patterns
- High API costs (potential key leakage)
- File access patterns to `.speckit/state/`
- Git commits to sensitive files

### Monitoring Tools
```bash
# Check for secrets in code
npm install --save-dev @secretlint/secretlint
npm run secretlint

# Check for secrets in git history
git-secrets --scan

# Audit npm packages
npm audit
npm audit fix
```

---

## 📋 Security Compliance

### For Teams
- All developers must read this SECURITY.md
- API keys rotation every 90 days
- Access to production keys limited to admins
- Development keys separated from production
- Incident response plan documented

### For Open Source Projects
- Never include real API keys in examples
- Always use `.agent-keys.example.json` with placeholders
- Document security practices in README
- Enable Dependabot security updates
- Use GitHub secret scanning

---

## 🔐 Agent-Specific Security

### Qwen Agent
- API Key Format: Alibaba Cloud DashScope key
- Rate Limits: Check Alibaba Cloud quotas
- Security: Keys can access all DashScope services
- Rotation: Via Alibaba Cloud console

### Claude Agent
- API Key Format: `sk-ant-api03-...`
- Rate Limits: Anthropic tier-based
- Security: Keys are account-wide
- Rotation: Via Anthropic console

### Gemini Agent
- API Key Format: Google AI Studio key
- Rate Limits: Per-project quotas
- Security: Keys can access all Gemini models
- Rotation: Via Google AI Studio

---

## 🚨 Vulnerability Reporting

If you discover a security vulnerability in SpecKit Bootstrap:

1. **DO NOT** open a public GitHub issue
2. **DO** email security concerns to project maintainers
3. **DO** provide detailed reproduction steps
4. **DO** allow 90 days for fix before public disclosure

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Git Secret Management](https://git-secret.io/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

## 🎯 Security Principles

1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Minimal necessary permissions
3. **Fail Securely**: Errors should not expose secrets
4. **Audit Everything**: Log all security-relevant events
5. **Keep Updated**: Regular dependency updates

---

**Remember**: Security is everyone's responsibility. When in doubt, ask!

---

*Document Version: 1.0*  
*Last Updated: 2025-10-02*  
*Next Review: 2025-11-02*

