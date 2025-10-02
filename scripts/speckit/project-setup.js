#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.cwd();

class ProjectSetup {
  constructor() {
    this.servicesConfig = null;
    this.projectName = null;
  }

  async loadServicesConfig() {
    const configPath = path.join(__dirname, '../../.speckit/project-services.yaml');
    const raw = await fs.readFile(configPath, 'utf-8');
    this.servicesConfig = YAML.parse(raw);
    return this.servicesConfig;
  }

  async promptUser(question) {
    console.log(question);
    // In real implementation, use readline or prompt library
    // For now, return defaults
    return null;
  }

  async setupNewProject(projectName, options = {}) {
    this.projectName = projectName;
    await this.loadServicesConfig();

    console.log(`\n🚀 Setting up new project: ${projectName}\n`);

    // 1. Create directory structure
    await this.createDirectoryStructure();

    // 2. Initialize Git
    if (options.initGit !== false) {
      await this.initializeGit();
    }

    // 3. Create package.json
    await this.createPackageJson();

    // 4. Setup BigQuery datasets
    if (options.setupBigQuery !== false) {
      await this.setupBigQuery();
    }

    // 5. Create Cloud Run configuration
    if (options.setupCloudRun !== false) {
      await this.createCloudRunConfig();
    }

    // 6. Create environment file template
    await this.createEnvTemplate();

    // 7. Create GitHub workflows
    if (options.setupGithub !== false) {
      await this.createGithubWorkflows();
    }

    // 8. Create database schema template
    if (options.setupDatabase !== false) {
      await this.createPrismaSchema();
    }

    // 9. Create README
    await this.createReadme();

    console.log('\n✅ Project setup complete!\n');
    console.log('Next steps:');
    console.log('  1. Update .env with your actual values');
    console.log('  2. Run: npm install');
    console.log('  3. Run: npm run speckit:validate specs/*/spec.md');
    console.log('  4. Configure GCP: gcloud config set project YOUR_PROJECT_ID');
    console.log('  5. Setup GitHub repository and push code\n');
  }

  async createDirectoryStructure() {
    console.log('📁 Creating directory structure...');

    const dirs = [
      '.speckit/state/agent-outputs/qwen',
      '.speckit/state/agent-outputs/claude',
      '.speckit/state/agent-outputs/gemini',
      '.speckit/state/logs',
      '.speckit/prompts',
      '.cursor/commands',
      '.cursor/context',
      '.cursor/rules',
      'scripts/speckit',
      'scripts/gcp',
      'specs',
      'prisma/migrations',
      'src/app/api',
      'src/lib',
      'tests/unit',
      'tests/integration',
      '.github/workflows'
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(projectRoot, dir), { recursive: true });
    }

    console.log('  ✓ Directories created');
  }

  async initializeGit() {
    console.log('🔧 Initializing Git...');

    const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Next.js
.next/
out/
build/
dist/

# Environment
.env
.env*.local
.env.production

# SpecKit State (optional - you may want to commit this)
.speckit/state/agent-outputs/**/*.tmp
.speckit/state/logs/*.ndjson

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary files
*.tmp
.temp/
`;

    await fs.writeFile(path.join(projectRoot, '.gitignore'), gitignore);
    console.log('  ✓ .gitignore created');
  }

  async createPackageJson() {
    console.log('📦 Creating package.json...');

    const packages = this.servicesConfig.common_npm_packages;
    const packageJson = {
      name: this.projectName,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        test: 'vitest',
        'test:coverage': 'vitest --coverage',
        lint: 'eslint . --ext .ts,.tsx',
        'lint:fix': 'eslint . --ext .ts,.tsx --fix',
        format: 'prettier --write "**/*.{ts,tsx,js,jsx,json,md}"',
        typecheck: 'tsc --noEmit',
        'db:push': 'prisma db push',
        'db:migrate': 'prisma migrate dev',
        'db:studio': 'prisma studio',
        'speckit:plan': 'node scripts/speckit/orchestrator.js plan',
        'speckit:implement': 'node scripts/speckit/orchestrator.js implement',
        'speckit:status': 'node scripts/speckit/orchestrator.js status',
        'speckit:review': 'node scripts/speckit/orchestrator.js review',
        'speckit:metrics': 'node scripts/speckit/orchestrator.js metrics',
        'speckit:validate': 'node scripts/speckit/cli-validator.js',
        'speckit:override': 'node scripts/speckit/override-manager.js',
        'gcp:setup': 'node scripts/gcp/setup-services.js',
        'gcp:deploy': 'node scripts/gcp/deploy.js'
      },
      dependencies: {},
      devDependencies: {}
    };

    // Add common packages
    for (const dep of packages.dependencies || []) {
      packageJson.dependencies[dep.split('@')[0]] = dep.includes('@') ? dep.split('@')[1] : 'latest';
    }

    for (const dep of packages.devDependencies || []) {
      packageJson.devDependencies[dep.split('@')[0]] = dep.includes('@') ? dep.split('@')[1] : 'latest';
    }

    // Add SpecKit dependencies
    packageJson.dependencies.yaml = '^2.5.1';

    await fs.writeFile(
      path.join(projectRoot, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    console.log('  ✓ package.json created');
  }

  async setupBigQuery() {
    console.log('🗄️  Creating BigQuery setup script...');

    const config = this.servicesConfig.bigquery;
    const script = `#!/usr/bin/env node
// BigQuery Setup Script
// Auto-generated from project-services.yaml

import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery();
const projectId = process.env.GCP_PROJECT_ID || '${this.servicesConfig.google_cloud.project_id}';
const location = '${config.location}';

async function setupDatasets() {
  console.log('Setting up BigQuery datasets...\\n');

  const datasets = ${JSON.stringify(config.datasets, null, 2)};

  for (const [key, dataset] of Object.entries(datasets)) {
    const datasetId = '${config.dataset_prefix}_' + dataset.name;

    try {
      const [exists] = await bigquery.dataset(datasetId).exists();

      if (exists) {
        console.log(\`✓ Dataset \${datasetId} already exists\`);
      } else {
        await bigquery.createDataset(datasetId, {
          location,
          description: dataset.description
        });
        console.log(\`✅ Created dataset: \${datasetId}\`);
      }
    } catch (error) {
      console.error(\`❌ Error with dataset \${datasetId}:\`, error.message);
    }
  }
}

async function createCommonTables() {
  console.log('\\nCreating common tables...\\n');

  const tables = ${JSON.stringify(config.common_tables, null, 2)};

  for (const [tableName, tableConfig] of Object.entries(tables)) {
    const datasetId = '${config.dataset_prefix}_processed_data';

    try {
      const [exists] = await bigquery.dataset(datasetId).table(tableName).exists();

      if (exists) {
        console.log(\`✓ Table \${tableName} already exists\`);
      } else {
        await bigquery.dataset(datasetId).createTable(tableName, {
          schema: tableConfig.schema,
          timePartitioning: tableConfig.partitioning ? {
            type: tableConfig.partitioning.type,
            field: tableConfig.partitioning.field
          } : undefined
        });
        console.log(\`✅ Created table: \${tableName}\`);
      }
    } catch (error) {
      console.error(\`❌ Error with table \${tableName}:\`, error.message);
    }
  }
}

async function main() {
  try {
    await setupDatasets();
    await createCommonTables();
    console.log('\\n✅ BigQuery setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
`;

    await fs.mkdir(path.join(projectRoot, 'scripts/gcp'), { recursive: true });
    await fs.writeFile(path.join(projectRoot, 'scripts/gcp/setup-bigquery.js'), script);

    console.log('  ✓ BigQuery setup script created');
  }

  async createCloudRunConfig() {
    console.log('☁️  Creating Cloud Run configuration...');

    const services = this.servicesConfig.cloud_run.services;

    for (const [name, config] of Object.entries(services)) {
      const serviceName = config.name.replace('{project-name}', this.projectName);

      const cloudRunYaml = `apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ${serviceName}
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '${this.servicesConfig.cloud_run.service_defaults.max_instances}'
        autoscaling.knative.dev/minScale: '${this.servicesConfig.cloud_run.service_defaults.min_instances}'
    spec:
      containerConcurrency: ${this.servicesConfig.cloud_run.service_defaults.concurrency}
      timeoutSeconds: ${config.timeout || this.servicesConfig.cloud_run.service_defaults.timeout}
      containers:
        - image: gcr.io/${this.servicesConfig.google_cloud.project_id}/${serviceName}:latest
          ports:
            - containerPort: ${config.port || 8080}
          resources:
            limits:
              cpu: '${config.cpu || this.servicesConfig.cloud_run.service_defaults.cpu}'
              memory: ${config.memory || this.servicesConfig.cloud_run.service_defaults.memory}
          env:
${Object.entries(config.env_vars || {}).map(([key, value]) =>
  `            - name: ${key}
              ${value.startsWith('secret:') ? `valueFrom:\n                secretKeyRef:\n                  name: ${value.split(':')[1]}\n                  key: latest` : `value: "${value}"`}`
).join('\n')}
`;

      await fs.writeFile(
        path.join(projectRoot, `cloud-run-${name}.yaml`),
        cloudRunYaml
      );
    }

    console.log('  ✓ Cloud Run configurations created');
  }

  async createEnvTemplate() {
    console.log('🔐 Creating environment template...');

    const envVars = this.servicesConfig.environment_variables;
    let envContent = `# Environment Variables for ${this.projectName}
# Copy this file to .env and fill in the values

# === Required ===
${envVars.required.map(v => `${v}=`).join('\n')}

# === Optional ===
${envVars.optional.map(v => `# ${v}=`).join('\n')}

# === GCP Specific ===
${envVars.gcp_specific.map(v => `${v}=`).join('\n')}

# === GitHub ===
${this.servicesConfig.github.secrets.map(s => `${s}=`).join('\n')}

# === Cloud Run Secrets ===
${this.servicesConfig.cloud_run.secrets.map(s => `${s}=`).join('\n')}
`;

    await fs.writeFile(path.join(projectRoot, '.env.example'), envContent);
    console.log('  ✓ .env.example created');
  }

  async createGithubWorkflows() {
    console.log('⚙️  Creating GitHub workflows...');

    const ciWorkflow = `name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/auth@v1
        with:
          credentials_json: \${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}
      - uses: google-github-actions/setup-gcloud@v1
      - run: gcloud builds submit --tag gcr.io/\${{ secrets.GCP_PROJECT_ID }}/${this.projectName}-api
      - run: gcloud run deploy ${this.projectName}-api --image gcr.io/\${{ secrets.GCP_PROJECT_ID }}/${this.projectName}-api --region us-central1
`;

    await fs.writeFile(
      path.join(projectRoot, '.github/workflows/ci-cd.yml'),
      ciWorkflow
    );

    console.log('  ✓ GitHub workflows created');
  }

  async createPrismaSchema() {
    console.log('🗃️  Creating Prisma schema...');

    const schema = `// Prisma Schema for ${this.projectName}
// Generated from project-services.yaml

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Event {
  id        String   @id @default(cuid())
  userId    String?
  eventType String
  eventData Json?
  timestamp DateTime @default(now())

  @@index([userId])
  @@index([timestamp])
  @@map("events")
}
`;

    await fs.writeFile(path.join(projectRoot, 'prisma/schema.prisma'), schema);
    console.log('  ✓ Prisma schema created');
  }

  async createReadme() {
    console.log('📝 Creating README...');

    const readme = `# ${this.projectName}

Project initialized with SpecKit orchestration system.

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Setup GCP services
npm run gcp:setup

# Start development
npm run dev
\`\`\`

## SpecKit Commands

\`\`\`bash
# Plan a new task
npm run speckit:plan -- "Add user authentication"

# Implement the task
npm run speckit:implement

# Check status
npm run speckit:status

# View metrics
npm run speckit:metrics
\`\`\`

## Services

- **GitHub**: Repository and CI/CD
- **Google Cloud Run**: Application hosting
- **BigQuery**: Data warehouse
- **PostgreSQL**: Primary database
- **Redis**: Caching and sessions

## Documentation

- [System Overview](./SYSTEM-OVERVIEW.md)
- [Setup Guide](./NEW-PROJECT-SETUP.md)
- [Services Configuration](./.speckit/project-services.yaml)

## Architecture

\`\`\`
${this.projectName}/
├── .speckit/          # SpecKit orchestration
├── scripts/           # Automation scripts
├── src/               # Application code
├── prisma/            # Database schema
└── tests/             # Test suites
\`\`\`
`;

    await fs.writeFile(path.join(projectRoot, 'README.md'), readme);
    console.log('  ✓ README created');
  }
}

// CLI
const command = process.argv[2];
const projectName = process.argv[3];

if (command === 'init' && projectName) {
  const setup = new ProjectSetup();
  setup.setupNewProject(projectName).catch(console.error);
} else {
  console.log('Usage: node scripts/speckit/project-setup.js init <project-name>');
  console.log('\nExample:');
  console.log('  node scripts/speckit/project-setup.js init my-new-project');
}
