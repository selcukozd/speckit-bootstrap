#!/usr/bin/env node
import { SpecValidator } from './spec-validator.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const specPath = process.argv[2];
const outputPath = process.argv[3];

if (!specPath) {
  console.error('Usage: node scripts/speckit/cli-validator.js <spec-path> [output-report-path]');
  process.exit(1);
}

const validator = new SpecValidator(projectRoot);
const absoluteSpecPath = path.isAbsolute(specPath) ? specPath : path.join(projectRoot, specPath);

try {
  const results = await validator.validateSpec(absoluteSpecPath);
  const report = await validator.generateReport(results, outputPath);

  console.log(report);

  if (!results.valid) {
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
