# SpecKit Override

Override constitutional rules for the current task.

## Usage
```
/speckit-override <rule-id> <reason>
```

## What it does
1. Allows user to bypass specific constitutional constraints
2. Logs override with justification
3. Adds to task metadata
4. Warns about risks
5. Requires confirmation

## Warning
⚠️ Use with caution! Overrides bypass safety checks designed to prevent:
- Security vulnerabilities
- Breaking changes
- Unauthorized modifications
- Schema corruption

## Arguments
- `<rule-id>`: Constitutional rule to override (e.g., "qwen.cannot.change_schema")
- `<reason>`: Justification for override (required)

## Example
```
/speckit-override qwen.cannot.add_dependency "Using trusted internal package"
```

## Script
```bash
npm run speckit:override -- "$ARGUMENTS"
```
