# SpecKit Review

Request Claude security and architecture review.

## Usage
```
/speckit-review <file or "all">
```

## What it does
1. Calls Claude CLI with review prompt
2. Analyzes security vulnerabilities
3. Checks constitutional compliance
4. Identifies performance issues
5. Returns veto decision with remediation

## Arguments
- `<file>`: Path to specific file to review
- `all`: Review all changes in current task

## Example
```
/speckit-review src/app/api/auth/route.ts
/speckit-review all
```

## Script
```bash
npm run speckit:review -- "$ARGUMENTS"
```
