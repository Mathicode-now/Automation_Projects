import { TransformResult, MigrationContext, ValidationResult } from './types';

/**
 * Validator Agent — Verifies the transformed Playwright code is correct.
 * 
 * Checks:
 * - No remaining Selenium patterns (incomplete migration)
 * - Valid Playwright import structure
 * - Syntax validation (basic)
 * - Suggests manual review areas
 */
export class ValidatorAgent {

  async validate(
    transformed: TransformResult,
    context: MigrationContext
  ): Promise<ValidationResult> {
    const code = transformed.code;
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for remaining Selenium patterns
    const remainingSelenium = this.detectRemainingSelenium(code);
    if (remainingSelenium.length > 0) {
      warnings.push(...remainingSelenium.map(p => `Remaining Selenium pattern: "${p}"`));
    }

    // Validate imports
    const hasPlaywrightImport = code.includes("from '@playwright/test'") ||
      code.includes("from \"@playwright/test\"");
    if (!hasPlaywrightImport) {
      warnings.push('Missing @playwright/test import');
    }

    // Check for test structure
    const hasTestFunction = code.includes('test(') || code.includes('test.describe(');
    if (!hasTestFunction && context.testFramework !== 'unknown') {
      warnings.push('No test() function found — test structure may need manual adjustment');
    }

    // Check for page parameter
    const hasPageParam = code.includes('{ page }') || code.includes('({page})');
    if (!hasPageParam && code.includes('page.')) {
      suggestions.push('Ensure test functions receive `page` from fixture: async ({ page }) => {');
    }

    // Syntax checks
    const syntaxValid = this.basicSyntaxCheck(code);
    if (!syntaxValid) {
      warnings.push('Potential syntax issues detected (unbalanced brackets or quotes)');
    }

    // Check for TODO comments (manual intervention needed)
    const todoCount = (code.match(/\/\/ TODO/g) || []).length;
    if (todoCount > 0) {
      suggestions.push(`${todoCount} TODO comments require manual review`);
    }

    // Check for hardcoded waits
    if (code.includes('waitForTimeout')) {
      suggestions.push('Replace waitForTimeout with proper wait conditions (waitForSelector, waitForResponse)');
    }

    // Calculate confidence
    const patternsComplete = remainingSelenium.length === 0;
    const confidence = this.calculateConfidence(
      patternsComplete,
      syntaxValid,
      warnings.length,
      context.complexity
    );

    return {
      syntaxValid,
      patternsComplete,
      confidence,
      warnings,
      suggestions,
    };
  }

  private detectRemainingSelenium(code: string): string[] {
    const remaining: string[] = [];
    
    // Strip comments before checking for remaining patterns
    const codeWithoutComments = code
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    const seleniumPatterns = [
      /driver\.findElement/,
      /driver\.findElements/,
      /driver\.get\(/,
      /driver\.wait\(/,
      /By\.(id|css|xpath|className|name|tagName|linkText)\(/,
      /driver\.manage\(\)/,
      /new Builder\(\)/,
      /require\(['"]selenium/,
      /from ['"]selenium/,
    ];

    for (const pattern of seleniumPatterns) {
      if (pattern.test(codeWithoutComments)) {
        const match = codeWithoutComments.match(pattern);
        if (match) remaining.push(match[0]);
      }
    }
    return remaining;
  }

  private basicSyntaxCheck(code: string): boolean {
    // Count brackets only on non-comment, non-string lines
    // This is a heuristic — not a real parser
    const lines = code.split('\n');
    let braces = 0, parens = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comment lines
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;

      // Count only { } ( ) not inside string literals on this line
      // Simple approach: remove quoted content first
      const cleaned = trimmed
        .replace(/'[^']*'/g, '')
        .replace(/"[^"]*"/g, '');

      for (const char of cleaned) {
        if (char === '{') braces++;
        else if (char === '}') braces--;
        else if (char === '(') parens++;
        else if (char === ')') parens--;
      }
    }

    // Allow small imbalance (common with partial regex transforms)
    return Math.abs(braces) <= 2 && Math.abs(parens) <= 2;
  }

  private calculateConfidence(
    patternsComplete: boolean,
    syntaxValid: boolean,
    warningCount: number,
    complexity: string
  ): number {
    let confidence = 100;

    if (!patternsComplete) confidence -= 30;
    if (!syntaxValid) confidence -= 25;
    confidence -= warningCount * 5;

    if (complexity === 'high') confidence -= 10;
    if (complexity === 'medium') confidence -= 5;

    return Math.max(0, Math.min(100, confidence));
  }
}
