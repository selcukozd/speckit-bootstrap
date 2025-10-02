# Pre-Commit Hooks Setup

Pre-commit hooks ensure code quality by running checks before every commit.

---

## 🎯 Why Use Pre-Commit Hooks?

- **Catch errors early**: Find issues before they reach CI/CD
- **Maintain consistency**: Enforce code style automatically
- **Save time**: Fix problems locally instead of in CI
- **Team alignment**: Everyone follows the same standards

---

## 📦 Option 1: Simple Git Hooks (Built-in)

### Manual Setup
```bash
# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Run quality checks
npm run quality:check

if [ $? -ne 0 ]; then
  echo "❌ Pre-commit checks failed. Please fix errors before committing."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
EOF

# Make executable
chmod +x .git/hooks/pre-commit
```

### Test It
```bash
# Try to commit (hooks will run)
git add .
git commit -m "test commit"
```

---

## 📦 Option 2: Husky (Recommended for Teams)

Husky makes git hooks shareable across the team via `package.json`.

### Installation
```bash
npm install --save-dev husky
npx husky init
```

### Configure Pre-Commit Hook
```bash
# Create pre-commit hook
npx husky add .husky/pre-commit "npm run pre-commit"
```

### `.husky/pre-commit` File
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."
npm run pre-commit
```

### Add to package.json
```json
{
  "scripts": {
    "pre-commit": "npm run quality:check",
    "prepare": "husky install"
  }
}
```

### Test It
```bash
git add .
git commit -m "test: husky pre-commit"
```

---

## 📦 Option 3: lint-staged (Fast Pre-Commit)

Only lint files that are staged for commit (much faster).

### Installation
```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

### Add to package.json
```json
{
  "lint-staged": {
    "*.js": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  },
  "scripts": {
    "prepare": "husky install"
  }
}
```

### Benefits
- ✅ Only checks changed files (fast!)
- ✅ Auto-fixes formatting issues
- ✅ Prevents committing broken code

---

## 🔧 Customization Options

### Skip Hooks (Emergency Use Only)
```bash
# Skip hooks for one commit
git commit --no-verify -m "emergency fix"

# Not recommended for regular use!
```

### Different Hooks for Different Files
```json
{
  "lint-staged": {
    "*.js": ["eslint --fix"],
    "*.ts": ["tsc --noEmit", "eslint --fix"],
    "*.{css,scss}": ["stylelint --fix"],
    "*.md": ["prettier --write"]
  }
}
```

### Add Commit Message Validation
```bash
# Create commit-msg hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'

# Install commitlint
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### `commitlint.config.js`
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']
    ]
  }
};
```

---

## 🚀 Recommended Setup (Complete)

### 1. Install Tools
```bash
npm install --save-dev husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky install
```

### 2. Configure package.json
```json
{
  "scripts": {
    "prepare": "husky install",
    "pre-commit": "lint-staged",
    "lint": "eslint . --fix",
    "format": "prettier --write .",
    "test": "jest"
  },
  "lint-staged": {
    "*.js": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ]
  }
}
```

### 3. Create Hooks
```bash
# Pre-commit: Run linters on staged files
npx husky add .husky/pre-commit "npx lint-staged"

# Commit-msg: Validate commit messages
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'

# Pre-push: Run tests before push
npx husky add .husky/pre-push "npm test"
```

### 4. Create commitlint.config.js
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional']
};
```

---

## 🎯 What Each Hook Does

### Pre-Commit
- Runs on: `git commit`
- Purpose: Validate code before committing
- Checks: Linting, formatting, type-checking

### Commit-Msg
- Runs on: `git commit`
- Purpose: Enforce commit message format
- Example: `feat: add new feature` ✅
- Example: `fixed stuff` ❌

### Pre-Push
- Runs on: `git push`
- Purpose: Run tests before pushing
- Prevents: Pushing broken code to remote

---

## 📝 Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

### Examples
```bash
feat(agents): add Qwen API integration
fix(orchestrator): resolve task planning bug
docs(readme): update installation guide
chore(deps): upgrade node-fetch to 3.3.2
```

---

## 🔧 Troubleshooting

### Hook Not Running
```bash
# Verify hook exists
ls -la .git/hooks/pre-commit

# Verify it's executable
chmod +x .git/hooks/pre-commit

# Check husky installation
npx husky install
```

### Hook Fails on Windows
```bash
# Use cross-platform commands
npm install --save-dev cross-env

# Update scripts
"pre-commit": "cross-env NODE_ENV=test lint-staged"
```

### Slow Pre-Commit Hooks
```bash
# Use lint-staged (only checks changed files)
npm install --save-dev lint-staged

# Skip tests in pre-commit, run in pre-push instead
npx husky add .husky/pre-push "npm test"
```

---

## 📚 Further Reading

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

*Remember*: Pre-commit hooks are a safety net, not a replacement for writing good code!

