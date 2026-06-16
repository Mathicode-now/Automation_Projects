# 🧬 Self-Healing Test Automation Framework

> Agentic AI-powered Playwright framework that automatically recovers from broken selectors when the UI changes.

## The Problem

UI tests break constantly. A developer renames a CSS class, changes an ID, or restructures HTML — and suddenly 50 tests fail. Teams waste hours fixing selectors instead of catching real bugs.

## The Solution

This framework wraps Playwright with an **Agentic AI layer** that:

1. **Detects** selector failures at runtime
2. **Reasons** about what element was intended (using context hints)
3. **Recovers** using multiple fallback strategies
4. **Reports** what was healed and with what confidence

## Healing Strategies (in priority order)

| # | Strategy | Confidence | How it works |
|---|----------|-----------|--------------|
| 1 | ARIA Role | 95% | Finds by accessibility role + name |
| 2 | Text Content | 90% | Matches visible text |
| 3 | Data Attributes | 85% | Falls back to data-* attributes |
| 4 | Structural Position | 60% | Uses parent + index |
| 5 | AI Inference | 40-80% | DOM analysis + scoring algorithm |

## Quick Start

```bash
cd playwright-self-healing

# Install dependencies
npm install
npx playwright install chromium

# Run tests normally (no healing)
npm test

# Run with BROKEN selectors (tests will fail)
npm run test:broken

# Run with self-healing ENABLED (tests recover)
npm run test:heal
```

## Project Structure

```
playwright-self-healing/
├── src/
│   ├── agent/
│   │   ├── self-healing-agent.ts   # Core AI agent with 5 strategies
│   │   └── types.ts                # TypeScript interfaces
│   ├── fixtures/
│   │   └── healing-fixture.ts      # Playwright test fixture
│   └── reporters/
│       └── heal-reporter.ts        # Custom reporter for heal stats
├── tests/
│   ├── checkout-flow.spec.ts       # Standard tests (fragile selectors)
│   └── broken-selectors.spec.ts    # Demo: broken selectors that get healed
├── playwright.config.ts
└── package.json
```

## How It Works

### 1. Define tests with context hints

```typescript
const button = await healingAgent.locate('#submit-btn', {
  role: 'button',
  text: 'Place Order',
  ariaLabel: 'Submit order',
  tag: 'button',
});
```

### 2. When the selector breaks, the agent kicks in

```
🔍 [HEAL] Primary selector failed: "#submit-btn"
   Context: {"role":"button","text":"Place Order"}
   ✅ Healed via text-content (confidence: 90%)
   New selector: "text="Place Order""
```

### 3. Review the healing report

```
═══════════════════════════════════════════════════
📊 SELF-HEALING SUMMARY
═══════════════════════════════════════════════════
  🧪 should complete checkout
     ✅ Healed via text-content (confidence: 90%)
     ✅ Healed via aria-role (confidence: 95%)

  Total: 2 selectors healed across 1 tests
═══════════════════════════════════════════════════
```

## Demo Scenario

The `broken-selectors.spec.ts` test file simulates a real-world UI refactor:

- `.kid-btn` → `.user-card` (class rename)
- `#back-btn` → `#nav-back` (ID rename)
- `data-tab` → `data-section` (attribute rename)
- `#progress-text` → `#completion-text` (ID rename)

Without self-healing: **all tests fail**.
With self-healing: **all tests pass** using fallback strategies.

## Key Design Decisions

- **No external AI API required** — the agent uses DOM analysis and heuristic scoring locally
- **Confidence scoring** — each heal reports how sure it is (useful for CI/CD thresholds)
- **Strategy ordering** — most reliable strategies run first (ARIA > text > structure)
- **Context hints** — tests provide what they know about the element, agent uses this for recovery
- **Zero runtime overhead** when selectors work — agent only activates on failure

## Interview Talking Points

1. **Agentic pattern**: The agent observes (failure), reasons (DOM analysis), and acts (selector recovery)
2. **Graceful degradation**: Confidence scoring lets you set thresholds (e.g., reject heals < 70%)
3. **Real ROI**: Eliminates hours of selector maintenance per sprint
4. **Extensible**: Strategy 5 can plug into any LLM API for more sophisticated reasoning
5. **Production-ready patterns**: Custom fixtures, reporters, environment-based toggles
