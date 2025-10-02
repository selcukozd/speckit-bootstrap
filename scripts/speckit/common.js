#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getRepoRoot() {
  try {
    const result = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    return result;
  } catch {
    // Fall back to script location for non-git repos
    return path.resolve(__dirname, '../..');
  }
}

export function getCurrentBranch() {
  // First check if SPECIFY_FEATURE environment variable is set
  if (process.env.SPECIFY_FEATURE) {
    return process.env.SPECIFY_FEATURE;
  }

  // Then check git if available
  try {
    const result = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    return result;
  } catch {
    // Git command failed - continue to fallback
  }

  // For non-git repos, try to find the latest feature directory
  const repoRoot = getRepoRoot();
  const specsDir = path.join(repoRoot, 'specs');

  try {
    const entries = fs.readdirSync(specsDir, { withFileTypes: true });
    let highest = 0;
    let latestFeature = '';

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const match = entry.name.match(/^(\d{3})-/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > highest) {
            highest = num;
            latestFeature = entry.name;
          }
        }
      }
    }

    if (latestFeature) {
      return latestFeature;
    }
  } catch {
    // specs directory doesn't exist
  }

  // Final fallback
  return 'main';
}

export function hasGit() {
  try {
    execSync('git rev-parse --show-toplevel', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function isFeatureBranch(branch, hasGitRepo = true) {
  // For non-git repos, we can't enforce branch naming but still provide output
  if (!hasGitRepo) {
    console.warn('[specify] Warning: Git repository not detected; skipped branch validation');
    return true;
  }

  if (!/^\d{3}-/.test(branch)) {
    console.error(`ERROR: Not on a feature branch. Current branch: ${branch}`);
    console.error('Feature branches should be named like: 001-feature-name');
    return false;
  }
  return true;
}

export function getFeatureDir(repoRoot, branch) {
  return path.join(repoRoot, 'specs', branch);
}

export function getFeaturePaths() {
  const repoRoot = getRepoRoot();
  const currentBranch = getCurrentBranch();
  const hasGitRepo = hasGit();
  const featureDir = getFeatureDir(repoRoot, currentBranch);

  return {
    REPO_ROOT: repoRoot,
    CURRENT_BRANCH: currentBranch,
    HAS_GIT: hasGitRepo,
    FEATURE_DIR: featureDir,
    FEATURE_SPEC: path.join(featureDir, 'spec.md'),
    IMPL_PLAN: path.join(featureDir, 'plan.md'),
    TASKS: path.join(featureDir, 'tasks.md'),
    RESEARCH: path.join(featureDir, 'research.md'),
    DATA_MODEL: path.join(featureDir, 'data-model.md'),
    QUICKSTART: path.join(featureDir, 'quickstart.md'),
    CONTRACTS_DIR: path.join(featureDir, 'contracts')
  };
}

export async function fileExists(filepath) {
  try {
    const stat = await fs.stat(filepath);
    return stat.isFile();
  } catch {
    return false;
  }
}

export async function dirHasFiles(dirpath) {
  try {
    const stat = await fs.stat(dirpath);
    if (!stat.isDirectory()) return false;

    const entries = await fs.readdir(dirpath, { withFileTypes: true });
    return entries.some(e => e.isFile());
  } catch {
    return false;
  }
}
