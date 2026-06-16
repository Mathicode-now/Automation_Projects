import { AnalyzerAgent } from './analyzer-agent';
import { TransformerAgent } from './transformer-agent';
import { ValidatorAgent } from './validator-agent';
import { MigrationContext, MigrationResult, MigrationOptions } from './types';

/**
 * Migration Orchestrator — The top-level agentic coordinator.
 * 
 * Follows an Observe → Plan → Act → Validate loop:
 * 1. OBSERVE: Analyzer scans Selenium test files
 * 2. PLAN: Builds a transformation plan (what patterns to convert)
 * 3. ACT: Transformer rewrites code to Playwright
 * 4. VALIDATE: Validator checks correctness and runs the output
 * 
 * Each step is handled by a specialized sub-agent.
 */
export class MigrationOrchestrator {
  private analyzer: AnalyzerAgent;
  private transformer: TransformerAgent;
  private validator: ValidatorAgent;
  private options: MigrationOptions;

  constructor(options: MigrationOptions = {}) {
    this.options = {
      dryRun: false,
      verbose: true,
      outputDir: './tests/playwright/migrated',
      ...options,
    };
    this.analyzer = new AnalyzerAgent();
    this.transformer = new TransformerAgent();
    this.validator = new ValidatorAgent();
  }

  async migrate(inputFiles: string[]): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    console.log('\n🤖 Migration Orchestrator Starting');
    console.log(`   Files to migrate: ${inputFiles.length}`);
    console.log(`   Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    for (const file of inputFiles) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📄 Processing: ${file}`);
      console.log('─'.repeat(60));

      // Step 1: OBSERVE — Analyze the Selenium test
      console.log('\n🔍 Step 1: ANALYZE');
      const context = await this.analyzer.analyze(file);
      console.log(`   Found ${context.patterns.length} Selenium patterns`);
      console.log(`   Imports: ${context.imports.join(', ')}`);
      console.log(`   Complexity: ${context.complexity}`);

      // Step 2: PLAN — Build transformation plan
      console.log('\n📋 Step 2: PLAN');
      const plan = this.analyzer.buildPlan(context);
      console.log(`   Transformations planned: ${plan.steps.length}`);
      for (const step of plan.steps) {
        console.log(`     • ${step.description}`);
      }

      // Step 3: ACT — Transform the code
      console.log('\n⚙️  Step 3: TRANSFORM');
      const transformed = await this.transformer.transform(context, plan);
      console.log(`   Lines: ${context.sourceLines} → ${transformed.code.split('\n').length}`);
      console.log(`   Patterns converted: ${transformed.conversions.length}`);

      // Step 4: VALIDATE — Check the output
      console.log('\n✅ Step 4: VALIDATE');
      const validation = await this.validator.validate(transformed, context);
      console.log(`   Syntax valid: ${validation.syntaxValid ? '✅' : '❌'}`);
      console.log(`   Patterns complete: ${validation.patternsComplete ? '✅' : '❌'}`);
      console.log(`   Confidence: ${validation.confidence}%`);

      if (validation.warnings.length > 0) {
        console.log('   ⚠️  Warnings:');
        validation.warnings.forEach(w => console.log(`      - ${w}`));
      }

      results.push({
        inputFile: file,
        outputFile: transformed.outputPath,
        context,
        plan,
        transformed,
        validation,
        success: validation.syntaxValid && validation.patternsComplete,
      });
    }

    this.printSummary(results);
    return results;
  }

  private printSummary(results: MigrationResult[]) {
    console.log('\n\n' + '═'.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('═'.repeat(60));
    
    const succeeded = results.filter(r => r.success).length;
    const failed = results.length - succeeded;
    const avgConfidence = Math.round(
      results.reduce((sum, r) => sum + r.validation.confidence, 0) / results.length
    );

    console.log(`\n   Total files: ${results.length}`);
    console.log(`   ✅ Succeeded: ${succeeded}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   Avg confidence: ${avgConfidence}%`);
    console.log('\n' + '═'.repeat(60));
  }
}
