# Example Feature Specification

**Branch**: `000-example`
**Created**: 2025-10-02
**Status**: Example Template

Bu dosya yeni feature'lar için örnek bir template'tir. Gerçek spec'leri `/specify` komutuyla oluşturun.

---

## User Story

As a [user type], I want to [action] so that [benefit].

**Örnek:**
As a developer, I want to create specs using natural language so that I can quickly plan features without writing boilerplate.

---

## Acceptance Criteria

1. **Given** [initial state]
   **When** [action occurs]
   **Then** [expected outcome]

2. **Given** user runs `/specify "Add user login"`
   **When** the command completes
   **Then** a new spec file is created with all required sections

---

## Functional Requirements

- **FR-001**: System must allow users to [specific capability]
- **FR-002**: Feature should handle [edge case]
- **FR-003**: Output must include [specific data]

**Örnek:**
- **FR-001**: System must generate unique branch names (001-xxx, 002-xxx)
- **FR-002**: Spec template must include all mandatory sections
- **FR-003**: Output must be valid markdown format

---

## Non-Functional Requirements

- **NFR-001**: Performance: [metric] should complete in [time]
- **NFR-002**: Security: [sensitive data] must be protected
- **NFR-003**: Usability: [action] should take less than [N] steps

**Örnek:**
- **NFR-001**: Spec generation should complete in < 5 seconds
- **NFR-002**: API keys must never be committed to git
- **NFR-003**: User should complete first spec in < 2 minutes

---

## Technical Notes

Bu bölüm implementation sonrası eklenir (spec yazarken boş bırak).

**Tech stack seçildikten sonra:**
- Language: Node.js
- Framework: None (CLI tool)
- Dependencies: yaml parser

---

## Next Steps

1. Run `/clarify` to resolve ambiguities
2. Run `/plan` to create technical approach
3. Run `/tasks` to generate actionable task list
4. Run `@agents plan` to assign tasks to agents
5. Execute agents manually via CLI

---

## Tips for Writing Good Specs

✅ **DO:**
- Focus on WHAT, not HOW
- Write testable acceptance criteria
- Mark ambiguities with [NEEDS CLARIFICATION]
- Use concrete examples
- Think from user perspective

❌ **DON'T:**
- Include tech stack details (that's for `/plan`)
- Assume implementation approach
- Leave vague requirements ("fast", "secure" without metrics)
- Skip edge cases
- Write code samples

---

## Related Docs

- `MANUAL-WORKFLOW.md` - Full workflow guide
- `VS-CODE-SETUP.md` - IDE setup
- `.specify/templates/spec-template.md` - Full template
