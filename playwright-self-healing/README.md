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
| 5 | AI Inference | 0-100%* | Local LLM (Llama via Ollama) reasons over DOM candidates |

\* Strategy 5 asks a local Llama model (served by [Ollama](https://ollama.com)) to pick the best-matching element and report its own confidence. If Ollama isn't running, the model isn't pulled, or the call times out, it falls back to the original local heuristic scorer (capped at 80%) — no external API, no network egress, no hard failure either way.

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

### Optional: local LLM for Strategy 5

Strategy 5 (AI Inference) can call a real local model instead of just the
heuristic scorer, via [Ollama](https://ollama.com) — no cloud API key, no
data leaving your machine.

```bash
# Install Ollama, then pull a small local model
ollama pull llama3.2

npm run test:heal
```

Config (all optional, sensible defaults shown):

| Env var | Default | Purpose |
|---|---|---|
| `SELF_HEAL_LLM` | `true` | Set to `false` to skip the LLM call and go straight to heuristic scoring |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2` | Any model you've pulled with `ollama pull` |
| `OLLAMA_TIMEOUT_MS` | `8000` | Abort and fall back to heuristics if Ollama doesn't respond in time |

If Ollama isn't installed or isn't running, Strategy 5 silently falls back
to the original DOM-scoring heuristic — the framework never depends on it.

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

- **No cloud AI API required** — Strategy 5 reasons with a local Llama model via Ollama (or falls back to local DOM/heuristic scoring if Ollama isn't available); no keys, no external network calls
- **Confidence scoring** — each heal reports how sure it is (useful for CI/CD thresholds)
- **Strategy ordering** — most reliable strategies run first (ARIA > text > structure)
- **Context hints** — tests provide what they know about the element, agent uses this for recovery
- **Zero runtime overhead** when selectors work — agent only activates on failure
- **Production-ready patterns**: Custom fixtures, reporters, environment-based toggles
