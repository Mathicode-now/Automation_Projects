import * as fs from 'fs';
import {
  MigrationContext,
  SeleniumPattern,
  PatternType,
  TransformationPlan,
  TransformStep,
} from './types';

/**
 * Analyzer Agent — Observes and understands Selenium test code.
 * 
 * Responsibilities:
 * - Parse source files for Selenium patterns
 * - Identify test framework (Jest, Mocha, etc.)
 * - Detect Page Object patterns
 * - Assess migration complexity
 * - Build a transformation plan
 */
export class AnalyzerAgent {

  async analyze(filePath: string): Promise<MigrationContext> {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const lines = sourceCode.split('\n');

    const patterns = this.detectPatterns(lines);
    const imports = this.detectImports(lines);
    const testFramework = this.detectTestFramework(sourceCode);
    const hasPageObject = this.detectPageObject(sourceCode);
    const complexity = this.assessComplexity(patterns);

    return {
      filePath,
      sourceCode,
      sourceLines: lines.length,
      imports,
      patterns,
      complexity,
      testFramework,
      hasPageObject,
    };
  }

  private detectPatterns(lines: string[]): SeleniumPattern[] {
    const patterns: SeleniumPattern[] = [];
    const matchers: Array<{ regex: RegExp; type: PatternType }> = [
      { regex: /require\(['"]selenium-webdriver['"]\)|from ['"]selenium-webdriver['"]/, type: 'import' },
      { regex: /new\s+(webdriver\.)?Builder\(\)/, type: 'driver-init' },
      { regex: /driver\.get\(|driver\.navigate\(\)\.to\(/, type: 'navigation' },
      { regex: /driver\.findElement\(/, type: 'find-element' },
      { regex: /driver\.findElements\(/, type: 'find-elements' },
      { regex: /\.click\(\)/, type: 'click' },
      { regex: /\.sendKeys\(/, type: 'send-keys' },
      { regex: /driver\.wait\(|until\./, type: 'wait' },
      { regex: /expect\(|assert\.|\.should\./, type: 'assertion' },
      { regex: /driver\.quit\(\)|driver\.close\(\)/, type: 'driver-quit' },
      { regex: /driver\.takeScreenshot\(/, type: 'screenshot' },
      { regex: /Select\(|\.selectByVisibleText\(/, type: 'select-dropdown' },
      { regex: /driver\.switchTo\(\)\.frame\(/, type: 'frame-switch' },
      { regex: /driver\.getWindowHandle|driver\.switchTo\(\)\.window\(/, type: 'window-handle' },
      { regex: /driver\.manage\(\)\.addCookie\(|driver\.manage\(\)\.getCookie/, type: 'cookie' },
      { regex: /driver\.executeScript\(|driver\.executeAsyncScript\(/, type: 'execute-script' },
    ];

    lines.forEach((line, index) => {
      for (const matcher of matchers) {
        if (matcher.regex.test(line)) {
          patterns.push({
            type: matcher.type,
            original: line.trim(),
            lineNumber: index + 1,
            selector: this.extractSelector(line),
            action: this.extractAction(line),
          });
        }
      }
    });

    return patterns;
  }

  private extractSelector(line: string): string | undefined {
    // Extract By.xxx('value') patterns
    const byMatch = line.match(/By\.(id|css|xpath|className|name|tagName|linkText)\(['"]([^'"]+)['"]\)/);
    if (byMatch) return `${byMatch[1]}:${byMatch[2]}`;

    // Extract CSS selector patterns
    const cssMatch = line.match(/By\.css\(['"]([^'"]+)['"]\)/);
    if (cssMatch) return cssMatch[1];

    return undefined;
  }

  private extractAction(line: string): string | undefined {
    const actionMatch = line.match(/\.(click|sendKeys|getText|getAttribute|isDisplayed|isEnabled)\(/);
    return actionMatch ? actionMatch[1] : undefined;
  }

  private detectImports(lines: string[]): string[] {
    const imports: string[] = [];
    for (const line of lines) {
      if (line.includes('selenium-webdriver')) imports.push('selenium-webdriver');
      if (line.includes('chromedriver')) imports.push('chromedriver');
      if (line.includes('geckodriver')) imports.push('geckodriver');
      if (line.includes('selenium-webdriver/chrome')) imports.push('chrome-options');
      if (line.includes('selenium-webdriver/firefox')) imports.push('firefox-options');
    }
    return [...new Set(imports)];
  }

  private detectTestFramework(source: string): MigrationContext['testFramework'] {
    if (source.includes('describe(') && source.includes('it(')) {
      if (source.includes('@jest') || source.includes('jest.')) return 'jest';
      if (source.includes('mocha') || source.includes('before(')) return 'mocha';
      return 'jasmine';
    }
    return 'unknown';
  }

  private detectPageObject(source: string): boolean {
    return /class\s+\w+Page/.test(source) || /PageObject|pageObject/.test(source);
  }

  private assessComplexity(patterns: SeleniumPattern[]): MigrationContext['complexity'] {
    const count = patterns.length;
    const hasAdvanced = patterns.some(p =>
      ['frame-switch', 'window-handle', 'execute-script', 'select-dropdown'].includes(p.type)
    );

    if (count > 30 || hasAdvanced) return 'high';
    if (count > 15) return 'medium';
    return 'low';
  }

  buildPlan(context: MigrationContext): TransformationPlan {
    const typeCounts = new Map<PatternType, number>();
    for (const pattern of context.patterns) {
      typeCounts.set(pattern.type, (typeCounts.get(pattern.type) || 0) + 1);
    }

    const steps: TransformStep[] = [];

    // Always start with imports
    if (typeCounts.has('import')) {
      steps.push({
        type: 'import',
        description: 'Replace selenium-webdriver imports with @playwright/test',
        count: typeCounts.get('import')!,
      });
    }

    // Driver init → Playwright fixture
    if (typeCounts.has('driver-init')) {
      steps.push({
        type: 'driver-init',
        description: 'Replace WebDriver builder with Playwright test fixture (page)',
        count: typeCounts.get('driver-init')!,
      });
    }

    // Navigation
    if (typeCounts.has('navigation')) {
      steps.push({
        type: 'navigation',
        description: 'Convert driver.get() to page.goto()',
        count: typeCounts.get('navigation')!,
      });
    }

    // Selectors
    const selectorCount = (typeCounts.get('find-element') || 0) + (typeCounts.get('find-elements') || 0);
    if (selectorCount > 0) {
      steps.push({
        type: 'find-element',
        description: 'Convert By.xxx() selectors to page.locator()',
        count: selectorCount,
      });
    }

    // Actions
    if (typeCounts.has('click')) {
      steps.push({
        type: 'click',
        description: 'Convert .click() to Playwright .click() with auto-wait',
        count: typeCounts.get('click')!,
      });
    }

    if (typeCounts.has('send-keys')) {
      steps.push({
        type: 'send-keys',
        description: 'Convert .sendKeys() to .fill() or .type()',
        count: typeCounts.get('send-keys')!,
      });
    }

    // Waits
    if (typeCounts.has('wait')) {
      steps.push({
        type: 'wait',
        description: 'Remove explicit waits (Playwright auto-waits) or convert to waitFor',
        count: typeCounts.get('wait')!,
      });
    }

    // Cleanup
    if (typeCounts.has('driver-quit')) {
      steps.push({
        type: 'driver-quit',
        description: 'Remove driver.quit() (Playwright handles teardown)',
        count: typeCounts.get('driver-quit')!,
      });
    }

    // Advanced patterns
    for (const advType of ['frame-switch', 'window-handle', 'execute-script', 'screenshot'] as PatternType[]) {
      if (typeCounts.has(advType)) {
        steps.push({
          type: advType,
          description: `Convert ${advType} to Playwright equivalent`,
          count: typeCounts.get(advType)!,
        });
      }
    }

    const estimatedConfidence = context.complexity === 'low' ? 95
      : context.complexity === 'medium' ? 80
      : 65;

    return { steps, estimatedConfidence };
  }
}
