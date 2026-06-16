import * as fs from 'fs';
import * as path from 'path';
import { MigrationOrchestrator } from './agent/orchestrator';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'migrate':
      await runMigration();
      break;
    case 'demo':
      await runDemo();
      break;
    case 'report':
      showReport();
      break;
    default:
      showHelp();
  }
}

async function runMigration() {
  const dryRun = args.includes('--dry-run');
  const inputDir = args.find(a => a.startsWith('--input='))?.split('=')[1] || './tests/selenium';

  const files = findSeleniumTests(inputDir);
  if (files.length === 0) {
    console.log('❌ No Selenium test files found in:', inputDir);
    return;
  }

  const orchestrator = new MigrationOrchestrator({ dryRun });
  const results = await orchestrator.migrate(files);

  if (!dryRun) {
    for (const result of results) {
      if (result.success) {
        const outDir = path.dirname(result.outputFile);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(result.outputFile, result.transformed.code);
        console.log(`\n💾 Written: ${result.outputFile}`);
      }
    }
  }
}

async function runDemo() {
  console.log('🎬 Running migration demo with sample Selenium tests...\n');

  const orchestrator = new MigrationOrchestrator({ dryRun: false });
  const sampleDir = path.join(__dirname, '..', 'tests', 'selenium');
  const files = findSeleniumTests(sampleDir);

  if (files.length === 0) {
    console.log('No sample tests found. Create tests in tests/selenium/ first.');
    return;
  }

  const results = await orchestrator.migrate(files);

  // Write output
  const outDir = path.join(__dirname, '..', 'tests', 'playwright', 'migrated');
  fs.mkdirSync(outDir, { recursive: true });

  for (const result of results) {
    if (result.success) {
      const outFile = path.join(outDir, path.basename(result.outputFile));
      fs.writeFileSync(outFile, result.transformed.code);
    }
  }
}

function showReport() {
  const outDir = path.join(__dirname, '..', 'tests', 'playwright', 'migrated');
  if (!fs.existsSync(outDir)) {
    console.log('No migrations found. Run `npm run demo` first.');
    return;
  }

  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.spec.ts'));
  console.log('\n📊 Migration Report');
  console.log('═'.repeat(50));
  console.log(`  Migrated files: ${files.length}`);
  files.forEach(f => console.log(`    ✅ ${f}`));
  console.log('═'.repeat(50));
}

function findSeleniumTests(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.test.js') || f.endsWith('.test.ts') || f.endsWith('.spec.js'))
    .map(f => path.join(dir, f));
}

function showHelp() {
  console.log(`
🤖 Selenium → Playwright Migration Agent

Commands:
  migrate [--dry-run] [--input=path]   Migrate Selenium tests to Playwright
  demo                                  Run demo with sample tests
  report                                Show migration report

Examples:
  ts-node src/cli.ts migrate --input=./my-tests
  ts-node src/cli.ts migrate --dry-run
  ts-node src/cli.ts demo
`);
}

main().catch(console.error);
