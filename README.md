# 🤖 Agentic AI Test Automation Portfolio

Two projects demonstrating how Agentic AI patterns solve real problems in test automation — built with Playwright and TypeScript.

## Projects

### 1. [Self-Healing Test Framework](./playwright-self-healing/)

An AI agent layer that intercepts broken selectors at runtime and automatically recovers using 5 fallback strategies (ARIA role, text content, data attributes, structural position, DOM inference).

```bash
cd playwright-self-healing
npm install && npx playwright install chromium

# Normal tests (all pass)
npm test

# Broken selectors + self-healing (all recovered)
SELF_HEAL=true npx playwright test tests/broken-selectors.spec.ts
```

**Result:** 6 selectors healed across 5 tests, avg 88% confidence.

---

### 2. [Selenium → Playwright Migration Agent](./selenium-to-playwright-agent/)

A multi-agent pipeline (Analyzer → Transformer → Validator) that converts Selenium WebDriver tests to Playwright. Handles 16+ pattern types including selectors, actions, waits, frames, and test lifecycle.

```bash
cd selenium-to-playwright-agent
npm install

# Run the migration demo
npm run demo
```

**Result:** 2 files migrated, 47 patterns converted, 93% avg confidence.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Agentic AI Patterns                         │
├────────────────────────────┬───────────────────────────────────┤
│   Self-Healing Agent       │   Migration Agent Pipeline        │
│   (Runtime recovery)       │   (Code transformation)          │
├────────────────────────────┼───────────────────────────────────┤
│ • Observe: selector fails  │ • Observe: parse Selenium code   │
│ • Reason: try 5 strategies │ • Plan: build transform steps    │
│ • Act: use healed selector │ • Act: rewrite to Playwright     │
│ • Report: log + confidence │ • Validate: check completeness   │
└────────────────────────────┴───────────────────────────────────┘
```

## Tech Stack

- **Playwright** — test execution, locators, fixtures, reporters
- **TypeScript** — type-safe agent interfaces and transformations
- **Node.js** — CLI tooling, file processing

## Quick Links

- [Interview Talking Points](./INTERVIEW_TALKING_POINTS.md)
- [Self-Healing Architecture Diagram](./playwright-self-healing/docs/architecture.mmd)
- [Migration Flow Diagram](./playwright-self-healing/docs/flow-diagram.mmd)
