#!/usr/bin/env node
import fs from 'fs/promises';
import { getFeaturePaths, isFeatureBranch, fileExists, dirHasFiles } from './common.js';

async function checkPrerequisites(options = {}) {
  const {
    json = false,
    requireTasks = false,
    includeTasks = false,
    pathsOnly = false
  } = options;

  const paths = getFeaturePaths();

  // Validate branch
  if (!isFeatureBranch(paths.CURRENT_BRANCH, paths.HAS_GIT)) {
    process.exit(1);
  }

  // If paths-only mode, output paths and exit
  if (pathsOnly) {
    const result = {
      REPO_ROOT: paths.REPO_ROOT,
      BRANCH: paths.CURRENT_BRANCH,
      FEATURE_DIR: paths.FEATURE_DIR,
      FEATURE_SPEC: paths.FEATURE_SPEC,
      IMPL_PLAN: paths.IMPL_PLAN,
      TASKS: paths.TASKS
    };

    if (json) {
      console.log(JSON.stringify(result));
    } else {
      console.log(`REPO_ROOT: ${result.REPO_ROOT}`);
      console.log(`BRANCH: ${result.BRANCH}`);
      console.log(`FEATURE_DIR: ${result.FEATURE_DIR}`);
      console.log(`FEATURE_SPEC: ${result.FEATURE_SPEC}`);
      console.log(`IMPL_PLAN: ${result.IMPL_PLAN}`);
      console.log(`TASKS: ${result.TASKS}`);
    }
    return;
  }

  // Validate required directories and files
  try {
    const stat = await fs.stat(paths.FEATURE_DIR);
    if (!stat.isDirectory()) {
      throw new Error('Not a directory');
    }
  } catch {
    console.error(`ERROR: Feature directory not found: ${paths.FEATURE_DIR}`);
    console.error('Run /specify first to create the feature structure.');
    process.exit(1);
  }

  if (!(await fileExists(paths.IMPL_PLAN))) {
    console.error(`ERROR: plan.md not found in ${paths.FEATURE_DIR}`);
    console.error('Run /plan first to create the implementation plan.');
    process.exit(1);
  }

  // Check for tasks.md if required
  if (requireTasks && !(await fileExists(paths.TASKS))) {
    console.error(`ERROR: tasks.md not found in ${paths.FEATURE_DIR}`);
    console.error('Run /tasks first to create the task list.');
    process.exit(1);
  }

  // Build list of available documents
  const docs = [];

  // Always check these optional docs
  if (await fileExists(paths.RESEARCH)) docs.push('research.md');
  if (await fileExists(paths.DATA_MODEL)) docs.push('data-model.md');

  // Check contracts directory (only if it exists and has files)
  if (await dirHasFiles(paths.CONTRACTS_DIR)) {
    docs.push('contracts/');
  }

  if (await fileExists(paths.QUICKSTART)) docs.push('quickstart.md');

  // Include tasks.md if requested and it exists
  if (includeTasks && (await fileExists(paths.TASKS))) {
    docs.push('tasks.md');
  }

  // Output results
  if (json) {
    console.log(JSON.stringify({
      FEATURE_DIR: paths.FEATURE_DIR,
      AVAILABLE_DOCS: docs
    }));
  } else {
    console.log(`FEATURE_DIR:${paths.FEATURE_DIR}`);
    console.log('AVAILABLE_DOCS:');

    // Show status of each potential document
    console.log(`  ${await fileExists(paths.RESEARCH) ? '✓' : '✗'} research.md`);
    console.log(`  ${await fileExists(paths.DATA_MODEL) ? '✓' : '✗'} data-model.md`);
    console.log(`  ${await dirHasFiles(paths.CONTRACTS_DIR) ? '✓' : '✗'} contracts/`);
    console.log(`  ${await fileExists(paths.QUICKSTART) ? '✓' : '✗'} quickstart.md`);

    if (includeTasks) {
      console.log(`  ${await fileExists(paths.TASKS) ? '✓' : '✗'} tasks.md`);
    }
  }
}

// CLI
const args = process.argv.slice(2);
const options = {
  json: args.includes('-Json'),
  requireTasks: args.includes('-RequireTasks'),
  includeTasks: args.includes('-IncludeTasks'),
  pathsOnly: args.includes('-PathsOnly')
};

if (args.includes('-Help') || args.includes('-h')) {
  console.log(`Usage: node check-prerequisites.js [OPTIONS]

Consolidated prerequisite checking for Spec-Driven Development workflow.

OPTIONS:
  -Json               Output in JSON format
  -RequireTasks       Require tasks.md to exist (for implementation phase)
  -IncludeTasks       Include tasks.md in AVAILABLE_DOCS list
  -PathsOnly          Only output path variables (no prerequisite validation)
  -Help, -h           Show this help message

EXAMPLES:
  # Check task prerequisites (plan.md required)
  node check-prerequisites.js -Json

  # Check implementation prerequisites (plan.md + tasks.md required)
  node check-prerequisites.js -Json -RequireTasks -IncludeTasks

  # Get feature paths only (no validation)
  node check-prerequisites.js -PathsOnly
`);
  process.exit(0);
}

checkPrerequisites(options).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
