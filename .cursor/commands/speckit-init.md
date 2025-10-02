# SpecKit Init

Initialize a new project with all your preferred services pre-configured.

## Usage
```
/speckit-init <project-name>
```

## What it does
1. Creates complete directory structure
2. Initializes Git with .gitignore
3. Creates package.json with all common dependencies
4. Sets up BigQuery datasets and tables
5. Creates Cloud Run configuration files
6. Generates .env.example with all required variables
7. Creates GitHub CI/CD workflows
8. Sets up Prisma schema
9. Creates comprehensive README

## Services Pre-configured
- **GitHub**: Repository, workflows, branch protection
- **Google Cloud**: Project settings, service accounts
- **BigQuery**: Datasets (raw, processed, analytics), common tables
- **Cloud Run**: API, worker, and cron services
- **PostgreSQL**: Database schema via Prisma
- **Redis**: Keyspace configuration
- **Monitoring**: Uptime checks, alerts, log sinks

## Configuration Source
All service configurations come from `.speckit/project-services.yaml`

## Example
```
/speckit-init my-ecommerce-app
```

This will create a new project with:
- Complete SpecKit orchestration
- Pre-configured GCP services
- Ready-to-use CI/CD pipelines
- Database schema templates
- Environment variable templates

## Customization
Edit `.speckit/project-services.yaml` to customize:
- Default service configurations
- Common npm packages
- Database schemas
- Cloud Run settings
- GitHub workflow templates
- Environment variables

## Script
```bash
npm run speckit:init -- "$ARGUMENTS"
```
