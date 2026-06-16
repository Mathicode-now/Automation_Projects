import type {
  Reporter,
  TestCase,
  TestResult,
  FullConfig,
  Suite,
} from '@playwright/test/reporter';

/**
 * Custom Playwright reporter that tracks self-healing activity
 * and generates a summary of healed selectors.
 */
class HealReporter implements Reporter {
  private healedTests: Array<{
    title: string;
    file: string;
    heals: string[];
  }> = [];

  onBegin(config: FullConfig, suite: Suite) {
    console.log('\n🧬 Self-Healing Test Reporter Active');
    console.log(`   Running ${suite.allTests().length} tests\n`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Extract heal logs from stdout
    const output = result.stdout.map(s => s.toString()).join('');
    const healMatches = output.match(/✅ Healed via .+/g) || [];

    if (healMatches.length > 0) {
      this.healedTests.push({
        title: test.title,
        file: test.location.file,
        heals: healMatches,
      });
    }

    const status = result.status === 'passed' ? '✅' : '❌';
    const healTag = healMatches.length > 0 ? ` [🧬 ${healMatches.length} healed]` : '';
    console.log(`  ${status} ${test.title}${healTag}`);
  }

  onEnd() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 SELF-HEALING SUMMARY');
    console.log('═'.repeat(60));

    if (this.healedTests.length === 0) {
      console.log('  No selectors needed healing in this run.');
    } else {
      let totalHeals = 0;
      for (const t of this.healedTests) {
        console.log(`\n  🧪 ${t.title}`);
        for (const heal of t.heals) {
          console.log(`     ${heal}`);
          totalHeals++;
        }
      }
      console.log(`\n  Total: ${totalHeals} selectors healed across ${this.healedTests.length} tests`);
    }
    console.log('═'.repeat(60) + '\n');
  }
}

export default HealReporter;
