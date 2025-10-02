#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { getFeaturePaths, isFeatureBranch } from './common.js';

async function setupPlan(options = {}) {
  const { json = false } = options;

  // Get all paths and variables from common functions
  const paths = getFeaturePaths();

  // Check if we're on a proper feature branch (only for git repos)
  if (!isFeatureBranch(paths.CURRENT_BRANCH, paths.HAS_GIT)) {
    process.exit(1);
  }

  // Ensure the feature directory exists
  await fs.mkdir(paths.FEATURE_DIR, { recursive: true });

  // Copy plan template if it exists, otherwise note it or create empty file
  const template = path.join(paths.REPO_ROOT, '.specify/templates/plan-template.md');
  try {
    await fs.copyFile(template, paths.IMPL_PLAN);
    console.log(`Copied plan template to ${paths.IMPL_PLAN}`);
  } catch {
    console.warn(`Plan template not found at ${template}`);
    // Create a basic plan file if template doesn't exist
    await fs.writeFile(paths.IMPL_PLAN, '# Implementation Plan\n\n', 'utf-8');
  }

  // Output results
  const result = {
    FEATURE_SPEC: paths.FEATURE_SPEC,
    IMPL_PLAN: paths.IMPL_PLAN,
    SPECS_DIR: paths.FEATURE_DIR,
    BRANCH: paths.CURRENT_BRANCH,
    HAS_GIT: paths.HAS_GIT
  };

  if (json) {
    console.log(JSON.stringify(result));
  } else {
    console.log(`FEATURE_SPEC: ${result.FEATURE_SPEC}`);
    console.log(`IMPL_PLAN: ${result.IMPL_PLAN}`);
    console.log(`SPECS_DIR: ${result.SPECS_DIR}`);
    console.log(`BRANCH: ${result.BRANCH}`);
    console.log(`HAS_GIT: ${result.HAS_GIT}`);
  }
}

// CLI
const args = process.argv.slice(2);
const options = {
  json: args.includes('-Json')
};

if (args.includes('-Help') || args.includes('-h')) {
  console.log(`Usage: node setup-plan.js [-Json] [-Help]
  -Json     Output results in JSON format
  -Help     Show this help message`);
  process.exit(0);
}

setupPlan(options).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
