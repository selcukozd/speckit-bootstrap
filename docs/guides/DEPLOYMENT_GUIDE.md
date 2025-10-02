# Deployment Guide

> **Note**: This is a template deployment guide for projects bootstrapped with SpecKit. Customize for your specific deployment target (Cloud Run, Vercel, AWS, etc.)

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │───▶│     Staging     │───▶│   Production    │
│   (localhost)   │    │  (auto deploy)  │    │ (manual deploy) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
    Local Dev              Safe Testing            Live Users
```

---

## 🎯 Golden Rules

### Rule #1: NEVER Deploy Directly to Production
- ✅ **ALWAYS** deploy to staging first
- ✅ **ALWAYS** test thoroughly on staging
- ✅ **ONLY** promote to production after validation

### Rule #2: Staging-First Deployment Process
```bash
# ✅ CORRECT Process
git push origin staging        # → Auto-deploy to staging
# Test staging thoroughly
git push origin main           # → Deploy to production

# ❌ WRONG Process
# Skipping staging and deploying directly to production
```

### Rule #3: Zero-Downtime Guarantee
- Users should NEVER see broken deployments
- All breaking changes must be tested in staging
- Rollback must be available within 2 minutes

---

## 🚀 Deployment Environments

### Development Environment
- **Purpose**: Local development and testing
- **URL**: `http://localhost:3000`
- **Command**: `npm run dev` (or project-specific command)
- **Config**: Uses local `.env` or `.agent-keys.json`

### Staging Environment
- **Purpose**: Pre-production testing and validation
- **URL**: Configure based on your hosting provider
- **Deploy**: Automatic on push to `staging` branch
- **Config**: Uses staging environment variables
- **Resources**: Minimal (cost-effective for testing)

### Production Environment
- **Purpose**: Live application for end users
- **URL**: Your production domain
- **Deploy**: Manual approval process
- **Config**: Uses production environment variables
- **Resources**: Scaled for production load

---

## 📋 Pre-Deployment Checklist

### Local Validation
- [ ] All tests passing (`npm run test`)
- [ ] No linter errors (`npm run lint:check`)
- [ ] Code formatted (`npm run format:check`)
- [ ] Quality gates passed (`npm run quality:check`)
- [ ] Agent tests working (if applicable)
- [ ] Documentation updated

### Security Validation
- [ ] No API keys in source code
- [ ] `.agent-keys.json` in `.gitignore`
- [ ] Environment variables documented
- [ ] Secrets properly managed
- [ ] Dependencies vulnerability-free (`npm audit`)

---

## 🔧 Deployment Methods

### Option 1: GitHub Actions (Recommended)
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [staging, main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run quality:check
      - run: npm run build
      # Add your deployment steps here
```

### Option 2: Cloud Build (GCP)
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/npm'
    args: ['ci']
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'quality:check']
  - name: 'gcr.io/cloud-builders/npm'
    args: ['run', 'build']
  # Add deployment steps
```

### Option 3: Manual Deployment
```bash
# Build locally
npm run quality:check
npm run build

# Deploy via CLI (example for Vercel)
vercel --prod

# Or via Docker
docker build -t myapp .
docker push registry.example.com/myapp:latest
```

---

## 🐳 Docker Deployment

### Multi-Stage Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Docker Compose (Local Testing)
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
```

---

## 🧪 Smoke Tests

### Health Check Endpoint
```javascript
// Example health check
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION
  });
}
```

### Smoke Test Script
```bash
#!/bin/bash
# smoke-test.sh

SERVICE_URL=$1

echo "Testing health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$SERVICE_URL/api/health")

if [ "$HTTP_CODE" -ne 200 ]; then
  echo "❌ Health check failed (HTTP $HTTP_CODE)"
  exit 1
fi

echo "✅ Health check passed"

# Add more endpoint tests here
```

---

## 🚨 Emergency Procedures

### Quick Rollback
```bash
# Method 1: Revert last commit
git revert HEAD
git push origin staging  # Test in staging first

# Method 2: Deploy specific commit
git checkout [WORKING_COMMIT_HASH]
git push origin staging --force
```

### Production Issues Debug
```bash
# Check application logs
docker logs container-name --tail 100

# Or cloud provider logs
# GCP: gcloud run services logs read SERVICE_NAME
# AWS: aws logs tail /aws/SERVICE_NAME
# Vercel: vercel logs
```

---

## 🔐 Environment Configuration

### Environment Variables Template
```bash
# .env.example
NODE_ENV=development
APP_VERSION=1.0.0

# Agent API Keys (DO NOT COMMIT REAL KEYS)
QWEN_API_KEY=your-qwen-key-here
CLAUDE_API_KEY=your-claude-key-here
GEMINI_API_KEY=your-gemini-key-here

# Application specific
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
API_BASE_URL=https://api.example.com
```

### Setting Environment Variables

**Local Development:**
```bash
cp .env.example .env
# Edit .env with real values
```

**Staging/Production (Cloud Providers):**
```bash
# Vercel
vercel env add QWEN_API_KEY

# Google Cloud Run
gcloud run services update SERVICE_NAME \
  --set-env-vars="QWEN_API_KEY=value"

# AWS ECS
aws ecs update-service ...
```

---

## 📊 Monitoring & Maintenance

### Daily Checks
- [ ] Application health status
- [ ] Error rates
- [ ] Response times
- [ ] Resource usage

### Weekly Maintenance
- [ ] Dependency updates check
- [ ] Security audit (`npm audit`)
- [ ] Performance review
- [ ] Log analysis

### Monthly Reviews
- [ ] Deployment pipeline efficiency
- [ ] Cost optimization
- [ ] Capacity planning
- [ ] Documentation updates

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should match package.json engines
```

**Issue**: Environment variables not loading
```bash
# Verify .env file exists
cat .env

# Check environment in runtime
console.log(process.env.NODE_ENV)
```

**Issue**: Agent API calls failing
```bash
# Test API keys
npm run agent:qwen -- implement --task "Test"

# Check .agent-keys.json exists
cat .agent-keys.json
```

---

## 🎯 Success Metrics

### Deployment KPIs
- ✅ Zero failed production deployments
- ✅ < 5 minute staging validation time
- ✅ < 2 minute rollback capability
- ✅ 99.9% uptime
- ✅ All quality gates pass before deploy

### Performance Benchmarks
- API Response Time: < 200ms (p95)
- Page Load Time: < 2 seconds
- Build Time: < 5 minutes
- Test Suite: < 2 minutes

---

## 🔄 CI/CD Pipeline Example

### Complete GitHub Actions Workflow
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [staging, main]
  pull_request:
    branches: [staging, main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run quality:check
  
  build:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
  
  deploy_staging:
    needs: build
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Add staging deployment steps
  
  deploy_production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      # Add production deployment steps
```

---

## ⚠️ IMPORTANT NOTES

1. **Always test in staging first**
2. **Never skip quality checks**
3. **Keep deployment logs**
4. **Document all manual steps**
5. **Maintain rollback procedures**

---

*Template Version: 1.0*  
*Customize this guide for your specific project needs*  
*Keep this document updated as deployment processes evolve*

