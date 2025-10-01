<!--
Sync Impact Report
- Version change: N/A → 1.0.0
- Modified principles:
  - [none → Technology Stack]
  - [none → Code Quality Standards]
  - [none → Security Practices]
  - [none → Performance Requirements]
  - [none → Architecture Principles]
- Added sections:
  - Multi-Agent Orchestration & Approval Rules
  - Development Workflow & Quality Gates
- Removed sections:
  - None
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/spec-template.md (✅ aligned, no changes)
  - .specify/templates/tasks-template.md (✅ aligned, no changes)
  - .specify/templates/commands/* (⚠ pending — directory not found)
- Runtime docs:
  - README.md (✅ aligned, no changes)
- Deferred TODOs:
  - None
-->

# Sales-v2 Constitution

## Core Principles

### Technology Stack
- MUST use Next.js 15 App Router with TypeScript strict mode.
- MUST use PostgreSQL for relational data via Prisma ORM.
- MUST use Redis for caching and sessions.
- MUST use Tailwind CSS for styling.
- MUST use Vitest for unit and integration testing.

Rationale: A standardized, modern stack improves velocity, maintainability, and security while
leveraging proven ecosystem patterns.

### Code Quality Standards
- TypeScript strict mode enabled; no usage of `any` types.
- All functions MUST include JSDoc comments describing purpose, params, and returns.
- Test coverage MUST be ≥ 80% across lines, branches, and statements.
- ESLint and Prettier MUST be configured and enforced locally and in CI.
- Conventional commits enforced (e.g., feat, fix, chore, docs, refactor, test, perf, build, ci).

Rationale: Strong quality gates and documentation reduce regressions and improve onboarding and
review efficiency.

### Security Practices
- Secrets MUST NOT be committed to source control. Use `.env` locally and managed secrets in
  deployment environments.
- Input validation on all endpoints MUST use Zod schemas.
- SQL injection prevention: Database access MUST go through Prisma (no raw SQL).
- XSS prevention: Sanitize and encode user-generated content; prefer safe rendering helpers.
- CSRF protection MUST be enabled on all state-changing mutations.
- Authentication endpoints MUST be rate limited.

Rationale: These controls mitigate common web risks (OWASP Top 10) and protect user data.

### Performance Requirements
- API endpoints MUST achieve p95 response time under 200ms in production.
- Client JavaScript bundle MUST remain under 500 KB compressed.
- Images MUST be optimized (WebP/AVIF), responsive, and lazy-loaded.
- Database queries MUST use appropriate indexes; analyze and optimize regularly.
- Frequently accessed data MUST be cached in Redis with clear TTLs and invalidation strategies.

Rationale: Performance improves user experience and reduces infrastructure costs.

### Architecture Principles
- Prefer Server Components by default; use Client Components only when necessary (interactivity or
  browser-only APIs).
- API routes MUST live under `/app/api/`.
- Database queries MUST execute in server actions or API routes; NEVER in Client Components.
- Business logic MUST NOT live in UI components; keep it in services/server modules.

Rationale: Clear separation of concerns increases testability, security, and maintainability.

## Multi-Agent Orchestration & Approval Rules

Roles:
- GPT-5: Orchestrator. Plans, coordinates, and makes final decisions.
- Qwen: Implementation engineer. Writes code quickly, follows specs strictly; requires review.
- Claude: Security reviewer and architect. Reviews design and security; holds veto on HIGH/CRITICAL
  risks.
- Gemini: Infrastructure specialist. Handles databases, deployment, CI/CD, monitoring.

Approval requirements:
- Database schema changes: Require GPT-5 + Claude + Gemini approval.
- Authentication changes: Require GPT-5 + Claude approval (mandatory).
- API contract changes: Require GPT-5 + Claude approval.
- New dependencies: Require GPT-5 + Claude approval.
- Deployments: Require all tests passing and Gemini validation.

Agent constraints:
- Qwen CANNOT design schemas, make architecture decisions, change auth logic, or add dependencies
  without approval.
- Qwen MUST follow specs literally, include tests for all code, stay under 500 lines per task, and
  use existing patterns.
- Claude CAN veto HIGH/CRITICAL security risks, suggest architectural improvements, and refactor
  complex code. Claude MUST provide risk explanations, remediation guidance, and approve all
  auth/payment code.
- Gemini MUST estimate infrastructure costs, verify database schemas, and provide rollback
  procedures.

Enforcement:
- Security-sensitive features (auth, payments, user data) MUST follow this multi-agent workflow.
- Quick fixes (≤ 10 lines), typos, and docs-only changes may bypass SpecKit, unless they touch
  security-critical code paths.

## Development Workflow & Quality Gates

- Specifications are defined with `/specify` and clarified with `/clarify`.
- Technical plans use `/plan`; tasks are generated via `/tasks`.
- TDD discipline: write failing tests before implementation; CI MUST assert tests initially fail for
  new contracts, then pass after implementation.
- CI MUST enforce: typecheck, lint, format, tests (≥ 80% coverage), bundle-size budget, and basic
  performance budgets.
- Branching and commits MUST follow conventional commits; PRs MUST link to spec and tasks.
- API routes live in `/app/api/`; database access is centralized in server-side modules; no business
  logic in components.

## Governance

Amendments:
- Propose constitution changes via PR updating this file with a Sync Impact Report.
- Versioning policy uses Semantic Versioning:
  - MAJOR: Backward-incompatible governance changes or removals.
  - MINOR: New sections/principles or material expansions.
  - PATCH: Clarifications and non-semantic refinements.
- Required approvals for constitution amendments: GPT-5 plus the relevant reviewers based on the
  affected areas (Claude for security/auth; Gemini for infrastructure/database).

Compliance:
- All PRs must include a Constitution Check in the plan. Reviewers MUST block merges on violations
  or missing approvals as defined above.
- Security-critical changes MUST include Claude review; Claude may veto HIGH/CRITICAL risks.

Review cadence:
- Quarterly compliance review to assess adherence to performance, security, and quality targets.
- Performance SLOs and security controls may be adjusted via MINOR amendments.

**Version**: 1.0.0 | **Ratified**: 2025-10-01 | **Last Amended**: 2025-10-01