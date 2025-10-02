#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

async function getNextFeatureNumber() {
  const specsDir = path.join(projectRoot, 'specs');
  try {
    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    const featureDirs = entries
      .filter(e => e.isDirectory() && /^\d{3}-/.test(e.name))
      .map(e => parseInt(e.name.slice(0, 3)))
      .filter(n => !isNaN(n));
    return featureDirs.length > 0 ? Math.max(...featureDirs) + 1 : 1;
  } catch {
    await fs.mkdir(specsDir, { recursive: true });
    return 1;
  }
}

async function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

async function createFeature(description) {
  const featureNum = await getNextFeatureNumber();
  const featureNumStr = String(featureNum).padStart(3, '0');
  const slug = await slugify(description);
  const branchName = `${featureNumStr}-${slug}`;
  const specDir = path.join(projectRoot, 'specs', branchName);
  const specFile = path.join(specDir, 'spec.md');

  // Create directory
  await fs.mkdir(specDir, { recursive: true });

  // Create empty spec file
  await fs.writeFile(specFile, `# Feature Specification\n\n${description}\n`);

  // Check if git repo exists
  let hasGit = false;
  try {
    execSync('git rev-parse --git-dir', { cwd: projectRoot, stdio: 'ignore' });
    hasGit = true;
  } catch {}

  // Create and checkout branch if git exists
  if (hasGit) {
    try {
      execSync(`git checkout -b ${branchName}`, { cwd: projectRoot, stdio: 'inherit' });
    } catch (err) {
      console.error('Git branch creation failed:', err.message);
    }
  }

  // Output JSON
  const result = {
    BRANCH_NAME: branchName,
    SPEC_FILE: specFile,
    FEATURE_NUM: featureNumStr,
    HAS_GIT: hasGit
  };

  console.log(JSON.stringify(result));
  return result;
}

// CLI
const args = process.argv.slice(2);
let description = '';
let isJson = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-Json') {
    isJson = true;
  } else {
    description = args[i];
  }
}

if (!description) {
  console.error('Usage: node create-feature.js [-Json] "feature description"');
  process.exit(1);
}

createFeature(description).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
