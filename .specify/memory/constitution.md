<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0
- Modified principles:
  - Technology Stack → Technology Profiles (stack-agnostic core)
  - Code Quality Standards → generalized across languages
  - Security Practices → framework-agnostic validations
  - Performance Requirements → profile-driven budgets
  - Architecture Principles → layered, spec-first
- Added sections:
  - Technology Profiles & Defaults
  - Bootstrap Deliverables & Readiness Gates
- Removed sections:
  - Framework-specific mandates (Next.js, Prisma, Tailwind, etc.)
-->

# SpecKit Constitution (Bootstrap-First)

## Core Principles

1) Spec-first development: Every change originates from a written spec and plan.
2) Multi-agent safety: Fast implementation is always reviewed for security/architecture.
3) Reuse and portability: The system must work across stacks via profiles.
4) Determinism: Phased workflow with explicit approval gates and audit trail.

### Technology Profiles (stack-agnostic core)
- This constitution is stack-agnostic. Projects select a Technology Profile that defines concrete tools and budgets.
- A profile file MUST exist at `.speckit/profile.yaml` with keys:
  - language, framework, test_runner, linter/formatter, package_manager
  - datastore(s), messaging, cache
  - performance_budgets (api_p95_ms, bundle_kb, job_latency_ms)
  - security_defaults (validation_lib, secret_manager, auth_scheme)

Profiles MAY include examples like `web-nextjs`, `api-fastapi`, `cli-node`, `data-python`.

### Code Quality Standards (generic)
- Tests are mandatory; minimum coverage threshold defined by profile (default ≥ 80%).
- Lint and format MUST pass in CI. Use the linter/formatter from profile.
- Public APIs (functions, endpoints, modules) MUST have API docs/comments.
- Typed where applicable (TypeScript, Python typing, etc.); avoid unsafe casts.
- Conventional commits enforced; PRs MUST link spec, plan, and tasks.

### Security Practices (generic)
- No secrets in code. Use environment managers or cloud secret stores.
- Validate and sanitize all inputs using profile-specified validation libraries.
- Parameterized queries only; avoid raw string-concatenated queries.
- Authentication and authorization flows REQUIRE security review.
- Apply rate limiting and abuse safeguards on auth-sensitive endpoints.

### Performance Requirements (profile-driven)
- Enforce profile budgets (defaults):
  - API p95 ≤ 200 ms
  - Client bundle ≤ 500 KB compressed
  - Background jobs: SLOs defined per job type
- Prefer caching with well-defined TTLs and invalidation.
- Monitor and track regressions in CI/CD where feasible.

### Architecture Principles (generic)
- Separation of concerns: UI, API, domain/services, data access are distinct layers.
- Business logic MUST NOT live in UI components.
- Single responsibility modules; dependencies are explicit and minimal.
- Twelve-Factor and security-by-default practices.

## Multi-Agent Orchestration & Approval Rules

Roles:
- GPT-5: Orchestrator (plans, coordinates, decides within rules).
- Qwen: Implementation engineer (fast code; must include tests; follows patterns).
- Claude: Security/architecture reviewer (veto power on HIGH/CRITICAL risks).
- Gemini: Infrastructure specialist (cloud, databases, CI/CD).

Approval requirements:
- Schema changes: GPT-5 + Claude + Gemini approval.
- Authentication changes: GPT-5 + Claude approval.
- API contract changes: GPT-5 + Claude approval.
- New dependencies: GPT-5 + Claude approval.
- Deployments: All tests pass + Gemini validation.

Agent constraints:
- Qwen CANNOT design schemas, change auth logic, add dependencies, or alter contracts without approvals.
- Qwen MUST include tests, keep per-task changes ≤ 500 lines, and follow existing patterns.
- Claude MUST justify vetoes with risk, evidence, and remediation.
- Gemini MUST estimate infra costs and define rollback.

Enforcement:
- Security-sensitive features (auth, payments, user data) MUST use multi-agent workflow.
- Quick fixes (≤ 10 lines), typos, docs-only may bypass unless security-critical.

## Bootstrap Deliverables & Readiness Gates

The bootstrap repository MUST provide:
1) Constitution (this file) and `.cursorrules` for orchestrated behavior.
2) Spec templates under `.specify/templates/` aligned with this constitution.
3) Orchestrator scripts under `scripts/speckit/` with state, logs, metrics.
4) Cursor slash commands under `.cursor/commands/` (or mapped npm scripts).
5) A sample "bootstrap" spec (`specs/000-bootstrap/`) demonstrating the workflow.

Readiness Gates for any feature:
- Gate 1: Spec complete (no [NEEDS CLARIFICATION])
- Gate 2: Plan passes Constitution Check
- Gate 3: Tests initially fail (contracts) then pass after implementation
- Gate 4: Security review complete (Claude) for sensitive areas
- Gate 5: Performance budgets acknowledged or exceptions documented

## Development Workflow & Quality Gates

- Use `/specify` to write WHAT, `/clarify` to resolve unknowns, `/plan` to design, `/tasks` to generate tasks, then orchestrate execution.
- TDD discipline: fail-first contract/integration tests before implementation.
- CI MUST run: typecheck (if typed), lint/format, tests with coverage, and optional performance checks.
- All PRs MUST link spec and tasks; include Constitution Check in the plan.

## Governance

Amendments:
- Propose changes via PR including a Sync Impact Report at the top of this file.
- SemVer for this constitution:
  - MAJOR: Breaking governance changes
  - MINOR: New principles/sections
  - PATCH: Clarifications
- Approvals for amendments: GPT-5 + relevant reviewers (Claude for security/auth; Gemini for infra/schema).

Compliance:
- Reviewers MUST block merges on Constitution violations or missing approvals.
- Security-critical changes REQUIRE Claude review; Claude may veto HIGH/CRITICAL risks.

Review cadence:
- Quarterly compliance review of security, performance, and quality targets.

**Version**: 2.0.0 | **Ratified**: 2025-10-02 | **Last Amended**: 2025-10-02