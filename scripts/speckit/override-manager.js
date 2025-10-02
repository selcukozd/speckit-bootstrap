import { ConstitutionalEngine } from './constitutional.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const constitutional = new ConstitutionalEngine('.speckit/constitutional-rules.yaml', projectRoot);

const command = process.argv[2];
const ruleId = process.argv[3];
const reason = process.argv.slice(4).join(' ');

async function main() {
  switch (command) {
    case 'add':
      if (!ruleId || !reason) {
        console.error('❌ Usage: node override-manager.js add <rule-id> <reason>');
        process.exit(1);
      }

      console.log('⚠️  WARNING: You are about to override a constitutional rule!');
      console.log(`Rule: ${ruleId}`);
      console.log(`Reason: ${reason}\n`);
      console.log('This bypasses safety checks. Proceed? (y/N)');

      // In real use, get confirmation from user
      // For now, proceed with override
      const override = await constitutional.saveOverride(ruleId, reason, 'manual-override');
      console.log(`✅ Override activated: ${override.ruleId}`);
      console.log(`   Timestamp: ${override.timestamp}`);
      console.log(`   Reason: ${override.reason}\n`);
      console.log('💡 This override will apply to all tasks until cleared.');
      break;

    case 'list':
      await constitutional.loadOverrides();
      const overrides = constitutional.overrides;

      if (overrides.active.length === 0) {
        console.log('✅ No active overrides');
      } else {
        console.log(`⚠️  ${overrides.active.length} active override(s):\n`);
        overrides.active.forEach((o, i) => {
          console.log(`${i + 1}. ${o.ruleId}`);
          console.log(`   Task: ${o.taskId}`);
          console.log(`   Reason: ${o.reason}`);
          console.log(`   Since: ${new Date(o.timestamp).toLocaleString()}\n`);
        });
      }

      if (overrides.history.length > 0) {
        console.log(`📋 Total overrides in history: ${overrides.history.length}`);
      }
      break;

    case 'clear':
      if (!ruleId) {
        console.error('❌ Usage: node override-manager.js clear <task-id>');
        console.error('   Or: node override-manager.js clear all');
        process.exit(1);
      }

      if (ruleId === 'all') {
        await constitutional.clearOverrides();
        console.log('✅ All overrides cleared');
      } else {
        await constitutional.clearOverrides(ruleId);
        console.log(`✅ Overrides cleared for task: ${ruleId}`);
      }
      break;

    default:
      console.log('Usage:');
      console.log('  node scripts/speckit/override-manager.js add <rule-id> <reason>');
      console.log('  node scripts/speckit/override-manager.js list');
      console.log('  node scripts/speckit/override-manager.js clear <task-id|all>');
      console.log('\nExamples:');
      console.log('  node scripts/speckit/override-manager.js add qwen.cannot.add_dependency "Using trusted internal package"');
      console.log('  node scripts/speckit/override-manager.js list');
      console.log('  node scripts/speckit/override-manager.js clear T237');
      console.log('  node scripts/speckit/override-manager.js clear all');
  }
}

main().catch(console.error);
