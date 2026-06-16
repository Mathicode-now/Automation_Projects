import {
  MigrationContext,
  TransformationPlan,
  TransformResult,
  Conversion,
} from './types';

/**
 * Transformer Agent — Rewrites Selenium code to Playwright.
 * 
 * Uses pattern-matching rules to convert:
 * - Imports → @playwright/test
 * - Driver lifecycle → Playwright fixtures
 * - By.xxx() → page.locator()
 * - Explicit waits → auto-wait (removed)
 * - Actions → Playwright equivalents
 */
export class TransformerAgent {

  async transform(
    context: MigrationContext,
    plan: TransformationPlan
  ): Promise<TransformResult> {
    let code = context.sourceCode;
    const conversions: Conversion[] = [];

    // Apply transformations in order
    code = this.transformImports(code, conversions);
    code = this.transformDriverInit(code, conversions);
    code = this.transformNavigation(code, conversions);
    code = this.transformSelectors(code, conversions);
    code = this.transformActions(code, conversions);
    code = this.transformWaits(code, conversions);
    code = this.transformAssertions(code, conversions);
    code = this.transformScreenshots(code, conversions);
    code = this.transformFrames(code, conversions);
    code = this.transformExecuteScript(code, conversions);
    code = this.removeDriverQuit(code, conversions);
    code = this.transformTestStructure(code, context, conversions);

    // Clean up
    code = this.cleanupCode(code);

    const outputPath = context.filePath
      .replace('/selenium/', '/playwright/migrated/')
      .replace('.test.js', '.spec.ts')
      .replace('.test.ts', '.spec.ts');

    return { code, outputPath, conversions };
  }

  private transformImports(code: string, conversions: Conversion[]): string {
    const patterns = [
      {
        from: /const\s*\{[^}]*\}\s*=\s*require\(['"]selenium-webdriver['"]\);?/g,
        to: "import { test, expect } from '@playwright/test';",
      },
      {
        from: /import\s*\{[^}]*\}\s*from\s*['"]selenium-webdriver['"];?/g,
        to: "import { test, expect } from '@playwright/test';",
      },
      {
        from: /const\s+\w+\s*=\s*require\(['"]selenium-webdriver['"]\);?/g,
        to: "import { test, expect } from '@playwright/test';",
      },
      {
        from: /require\(['"]chromedriver['"]\);?/g,
        to: '// chromedriver not needed — Playwright manages browsers',
      },
      {
        from: /const\s*\{[^}]*\}\s*=\s*require\(['"]selenium-webdriver\/chrome['"]\);?/g,
        to: '// Chrome options configured in playwright.config.ts',
      },
    ];

    for (const pattern of patterns) {
      const match = code.match(pattern.from);
      if (match) {
        conversions.push({
          pattern: 'import',
          from: match[0],
          to: pattern.to,
          lineNumber: this.getLineNumber(code, match[0]),
          confidence: 98,
        });
        code = code.replace(pattern.from, pattern.to);
      }
    }
    return code;
  }

  private transformDriverInit(code: string, conversions: Conversion[]): string {
    // Handle: let driver; ... driver = await new Builder()...build();
    // Handle: let/const driver = await new Builder()...build();
    // Handle: multi-line Builder patterns with options
    const patterns = [
      /(?:let|const|var)\s+driver\s*=\s*(?:await\s+)?new\s+(?:webdriver\.)?Builder\(\)[\s\S]*?\.build\(\);?/g,
      /driver\s*=\s*(?:await\s+)?new\s+(?:webdriver\.)?Builder\(\)[\s\S]*?\.build\(\);?/g,
    ];

    for (const pattern of patterns) {
      const matches = code.match(pattern);
      if (matches) {
        for (const m of matches) {
          conversions.push({
            pattern: 'driver-init',
            from: m.trim(),
            to: '// Driver managed by Playwright fixture — use `page` parameter',
            lineNumber: this.getLineNumber(code, m),
            confidence: 95,
          });
        }
        code = code.replace(pattern, '// Driver managed by Playwright fixture — use `page` parameter');
      }
    }

    // Handle: let driver; (declaration without init)
    code = code.replace(/\s*let\s+driver;\n?/g, '\n');

    return code;
  }

  private transformNavigation(code: string, conversions: Conversion[]): string {
    // driver.get(url) → page.goto(url)
    code = code.replace(
      /(?:await\s+)?driver\.get\(([^)]+)\)/g,
      (match, url) => {
        const replacement = `await page.goto(${url})`;
        conversions.push({
          pattern: 'navigation',
          from: match,
          to: replacement,
          lineNumber: this.getLineNumber(code, match),
          confidence: 99,
        });
        return replacement;
      }
    );

    // driver.navigate().to(url) → page.goto(url)
    code = code.replace(
      /(?:await\s+)?driver\.navigate\(\)\.to\(([^)]+)\)/g,
      (match, url) => {
        const replacement = `await page.goto(${url})`;
        conversions.push({
          pattern: 'navigation',
          from: match,
          to: replacement,
          lineNumber: this.getLineNumber(code, match),
          confidence: 99,
        });
        return replacement;
      }
    );

    // driver.navigate().back() → page.goBack()
    code = code.replace(
      /(?:await\s+)?driver\.navigate\(\)\.back\(\)/g,
      'await page.goBack()'
    );

    // driver.navigate().forward() → page.goForward()
    code = code.replace(
      /(?:await\s+)?driver\.navigate\(\)\.forward\(\)/g,
      'await page.goForward()'
    );

    return code;
  }

  private transformSelectors(code: string, conversions: Conversion[]): string {
    const selectorMap: Array<{ from: RegExp; toFn: (match: string, value: string) => string }> = [
      { from: /By\.id\(['"]([^'"]+)['"]\)/g, toFn: (_, v) => `'#${v}'` },
      { from: /By\.css\(['"]([^'"]+)['"]\)/g, toFn: (_, v) => `'${v}'` },
      { from: /By\.className\(['"]([^'"]+)['"]\)/g, toFn: (_, v) => `'.${v}'` },
      { from: /By\.name\(['"]([^'"]+)['"]\)/g, toFn: (_, v) => `'[name="${v}"]'` },
      { from: /By\.tagName\(['"]([^'"]+)['"]\)/g, toFn: (_, v) => `'${v}'` },
      { from: /By\.xpath\(['"]([^'"]+)['"]\)/g, toFn: (_, v) => `'xpath=${v}'` },
      { from: /By\.linkText\(['"]([^'"]+)['"]\)/g, toFn: (_, v) => `'a:has-text("${v}")'` },
      { from: /By\.partialLinkText\(['"]([^'"]+)['"]\)/g, toFn: (_, v) => `'a:has-text("${v}")'` },
    ];

    // driver.findElement(By.xxx('value')) → page.locator('selector')
    for (const sel of selectorMap) {
      code = code.replace(
        new RegExp(`(?:await\\s+)?driver\\.findElement\\(${sel.from.source}\\)`, 'g'),
        (match, value) => {
          const playwright = `page.locator(${sel.toFn(match, value)})`;
          conversions.push({
            pattern: 'find-element',
            from: match,
            to: playwright,
            lineNumber: this.getLineNumber(code, match),
            confidence: 92,
          });
          return playwright;
        }
      );

      // findElements → locator (returns multiple)
      code = code.replace(
        new RegExp(`(?:await\\s+)?driver\\.findElements\\(${sel.from.source}\\)`, 'g'),
        (match, value) => {
          const playwright = `page.locator(${sel.toFn(match, value)}).all()`;
          conversions.push({
            pattern: 'find-elements',
            from: match,
            to: playwright,
            lineNumber: this.getLineNumber(code, match),
            confidence: 88,
          });
          return playwright;
        }
      );
    }

    return code;
  }

  private transformActions(code: string, conversions: Conversion[]): string {
    // .sendKeys('text') → .fill('text')
    code = code.replace(
      /\.sendKeys\(([^)]+)\)/g,
      (match, keys) => {
        // Check if it's Key.ENTER etc
        if (keys.includes('Key.')) {
          const keyMap: Record<string, string> = {
            'Key.ENTER': "'Enter'",
            'Key.TAB': "'Tab'",
            'Key.ESCAPE': "'Escape'",
            'Key.BACK_SPACE': "'Backspace'",
            'Key.RETURN': "'Enter'",
          };
          for (const [from, to] of Object.entries(keyMap)) {
            if (keys.includes(from)) {
              return `.press(${to})`;
            }
          }
        }
        return `.fill(${keys})`;
      }
    );

    // .getText() → .textContent()
    code = code.replace(/\.getText\(\)/g, '.textContent()');

    // .getAttribute('x') → .getAttribute('x') (same API)
    // .isDisplayed() → .isVisible()
    code = code.replace(/\.isDisplayed\(\)/g, '.isVisible()');

    // .isEnabled() → .isEnabled() (same API)
    // .clear() → .clear()
    code = code.replace(/\.clear\(\)/g, '.fill(\'\')');

    return code;
  }

  private transformWaits(code: string, conversions: Conversion[]): string {
    // Explicit waits → Playwright auto-waits or waitFor
    code = code.replace(
      /(?:await\s+)?driver\.wait\(until\.elementLocated\(([^)]+)\)[^)]*\)/g,
      (match, selector) => {
        const replacement = `// Auto-wait: Playwright waits for element automatically`;
        conversions.push({
          pattern: 'wait',
          from: match,
          to: replacement,
          lineNumber: this.getLineNumber(code, match),
          confidence: 85,
        });
        return replacement;
      }
    );

    // driver.wait(until.elementIsVisible(...))
    code = code.replace(
      /(?:await\s+)?driver\.wait\(until\.elementIsVisible\([^)]+\)[^)]*\)/g,
      '// Auto-wait: Playwright waits for visibility automatically'
    );

    // Generic driver.wait with timeout
    code = code.replace(
      /(?:await\s+)?driver\.wait\([^,]+,\s*(\d+)\)/g,
      'await page.waitForTimeout($1) // Consider using waitForSelector instead'
    );

    // driver.sleep() → page.waitForTimeout()
    code = code.replace(
      /(?:await\s+)?driver\.sleep\((\d+)\)/g,
      'await page.waitForTimeout($1) // TODO: Replace with proper wait condition'
    );

    return code;
  }

  private transformAssertions(code: string, conversions: Conversion[]): string {
    // Keep assertions mostly as-is but wrap with Playwright expect where possible
    // expect(await element.getText()).toBe('x') → await expect(locator).toHaveText('x')
    code = code.replace(
      /expect\(await\s+([^.]+)\.getText\(\)\)\.(?:toBe|toEqual)\(([^)]+)\)/g,
      'await expect($1).toHaveText($2)'
    );

    // expect(await element.isDisplayed()).toBe(true) → await expect(locator).toBeVisible()
    code = code.replace(
      /expect\(await\s+([^.]+)\.isDisplayed\(\)\)\.(?:toBe|toEqual)\(true\)/g,
      'await expect($1).toBeVisible()'
    );

    return code;
  }

  private transformScreenshots(code: string, conversions: Conversion[]): string {
    code = code.replace(
      /(?:await\s+)?driver\.takeScreenshot\(\)/g,
      'await page.screenshot({ path: \'screenshot.png\' })'
    );
    return code;
  }

  private transformFrames(code: string, conversions: Conversion[]): string {
    // driver.switchTo().frame(x) → page.frameLocator(x)
    code = code.replace(
      /(?:await\s+)?driver\.switchTo\(\)\.frame\(([^)]+)\)/g,
      (match, frame) => {
        conversions.push({
          pattern: 'frame-switch',
          from: match,
          to: `page.frameLocator(${frame})`,
          lineNumber: this.getLineNumber(code, match),
          confidence: 75,
        });
        return `page.frameLocator(${frame})`;
      }
    );

    // driver.switchTo().defaultContent()
    code = code.replace(
      /(?:await\s+)?driver\.switchTo\(\)\.defaultContent\(\)/g,
      '// Back to main frame — use page directly'
    );

    return code;
  }

  private transformExecuteScript(code: string, conversions: Conversion[]): string {
    code = code.replace(
      /(?:await\s+)?driver\.executeScript\(([^)]+)\)/g,
      'await page.evaluate($1)'
    );
    code = code.replace(
      /(?:await\s+)?driver\.executeAsyncScript\(([^)]+)\)/g,
      'await page.evaluate($1)'
    );
    return code;
  }

  private removeDriverQuit(code: string, conversions: Conversion[]): string {
    const match = code.match(/(?:await\s+)?driver\.quit\(\);?/);
    if (match) {
      conversions.push({
        pattern: 'driver-quit',
        from: match[0],
        to: '// Teardown handled by Playwright',
        lineNumber: this.getLineNumber(code, match[0]),
        confidence: 100,
      });
    }
    code = code.replace(/(?:await\s+)?driver\.quit\(\);?\n?/g, '// Teardown handled by Playwright\n');
    code = code.replace(/(?:await\s+)?driver\.close\(\);?\n?/g, '// Teardown handled by Playwright\n');
    return code;
  }

  private transformTestStructure(
    code: string,
    context: MigrationContext,
    conversions: Conversion[]
  ): string {
    // If using jest/mocha describe/it pattern, convert to Playwright test()
    if (context.testFramework !== 'unknown') {
      // it('name', async () => { → test('name', async ({ page }) => {
      code = code.replace(
        /it\(['"]([^'"]+)['"],\s*async\s*\(\)\s*=>\s*\{/g,
        "test('$1', async ({ page }) => {"
      );

      // describe stays the same in Playwright (test.describe)
      code = code.replace(
        /describe\(['"]([^'"]+)['"],\s*(?:function\s*\(\)|(?:\(\)\s*=>))\s*\{/g,
        "test.describe('$1', () => {"
      );

      // before/after hooks — add { page } param
      code = code.replace(
        /beforeEach\(async\s*\(\)\s*=>\s*\{/g,
        'test.beforeEach(async ({ page }) => {'
      );
      code = code.replace(
        /afterEach\(async\s*\(\)\s*=>\s*\{/g,
        'test.afterEach(async ({ page }) => {'
      );
      code = code.replace(/beforeAll\(/g, 'test.beforeAll(');
      code = code.replace(/afterAll\(/g, 'test.afterAll(');
    }

    return code;
  }

  private cleanupCode(code: string): string {
    // Remove multiple consecutive blank lines
    code = code.replace(/\n{3,}/g, '\n\n');
    // Remove trailing whitespace
    code = code.replace(/[ \t]+$/gm, '');
    return code;
  }

  private getLineNumber(code: string, text: string): number {
    const index = code.indexOf(text);
    if (index === -1) return 0;
    return code.substring(0, index).split('\n').length;
  }
}
