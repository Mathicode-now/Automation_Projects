# 🤖 Selenium → Playwright Migration Agent

> Agentic AI framework that automatically migrates Selenium WebDriver test suites to Playwright, using an Observe → Plan → Act → Validate loop.

## Architecture

The system uses a multi-agent architecture where each agent has a specific role:

```
┌─────────────────────────────────────────────────────────┐
│                  Migration Orchestrator                   │
│            (Observe → Plan → Act → Validate)             │
├──────────┬──────────────────┬───────────────────────────┤
│ Analyzer │   Transformer    │        Validator           │
│  Agent   │      Agent       │          Agent             │
├──────────┼──────────────────┼───────────────────────────┤
│ • Parse  │ • Rewrite imports│ • Detect remaining        │
│ • Detect │ • Convert sels   │   Selenium patterns       │
│   patterns│ • Transform acts │ • Bracket validation      │
│ • Assess │ • Remove waits   │ • Confidence scoring      │
│   complex│ • Fix lifecycle  │ • Suggestions             │
└──────────┴──────────────────┴───────────────────────────┘
```

## Quick Start

```bash
cd selenium-to-playwright-agent

# Install
npm install

# Run demo migration (uses sample Selenium tests)
npm run demo

# Migrate your own tests
npm run migrate -- --input=./path/to/selenium/tests

# Dry run (preview without writing files)
npm run migrate:dry-run
```

## What Gets Converted

| Selenium Pattern | Playwright Equivalent |
|---|---|
| `require('selenium-webdriver')` | `import { test, expect } from '@playwright/test'` |
| `new Builder().forBrowser('chrome').build()` | Playwright fixture (`page` param) |
| `driver.get(url)` | `page.goto(url)` |
| `driver.findElement(By.id('x'))` | `page.locator('#x')` |
| `driver.findElement(By.css('.x'))` | `page.locator('.x')` |
| `driver.findElement(By.xpath('//x'))` | `page.locator('xpath=//x')` |
| `driver.findElement(By.name('x'))` | `page.locator('[name="x"]')` |
| `driver.findElement(By.linkText('x'))` | `page.locator('a:has-text("x")')` |
| `.sendKeys('text')` | `.fill('text')` |
| `.sendKeys(Key.ENTER)` | `.press('Enter')` |
| `.getText()` | `.textContent()` |
| `.isDisplayed()` | `.isVisible()` |
| `driver.wait(until.elementLocated(...))` | Auto-wait (removed) |
| `driver.sleep(1000)` | `page.waitForTimeout(1000)` |
| `driver.quit()` | Handled by fixture (removed) |
| `driver.switchTo().frame(x)` | `page.frameLocator(x)` |
| `driver.executeScript(fn)` | `page.evaluate(fn)` |
| `driver.takeScreenshot()` | `page.screenshot()` |
| `describe/it` | `test.describe/test` |

## Project Structure

```
selenium-to-playwright-agent/
├── src/
│   ├── agent/
│   │   ├── orchestrator.ts      # Top-level coordinator
│   │   ├── analyzer-agent.ts    # Parses Selenium code
│   │   ├── transformer-agent.ts # Rewrites to Playwright
│   │   ├── validator-agent.ts   # Verifies output correctness
│   │   └── types.ts             # Shared interfaces
│   └── cli.ts                   # CLI entry point
├── tests/
│   ├── selenium/                # Sample input tests
│   │   ├── login-flow.test.js
│   │   └── shopping-cart.test.js
│   └── playwright/migrated/     # Output (generated)
├── package.json
└── tsconfig.json
```

## Agentic Design Pattern

Each agent follows the OODA loop (Observe, Orient, Decide, Act):

1. **Analyzer Agent** (Observe + Orient)
   - Scans source for 16+ Selenium pattern types
   - Detects test framework (Jest/Mocha/Jasmine)
   - Identifies Page Object patterns
   - Assesses complexity (low/medium/high)
   - Builds a prioritized transformation plan

2. **Transformer Agent** (Decide + Act)
   - Applies transformations in dependency order
   - Handles selector conversion (8 By.xxx types)
   - Manages action mapping (click, type, assertions)
   - Restructures test lifecycle (fixtures vs setup/teardown)

3. **Validator Agent** (Verify)
   - Strips comments before checking for leftover Selenium
   - Validates bracket balance
   - Calculates confidence score (0-100%)
   - Generates suggestions for manual review

## Interview Talking Points

1. **Multi-agent architecture** — specialized agents with single responsibilities
2. **OODA loop** — each agent observes, plans, acts, validates
3. **Confidence scoring** — quantifiable output quality (useful for CI gates)
4. **Pattern-based transformation** — extensible rule engine, not hardcoded rewrites
5. **Graceful degradation** — partial migrations still produce useful output
6. **Real-world value** — saves days of manual migration effort per project
