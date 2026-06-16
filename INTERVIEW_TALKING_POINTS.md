# Agentic AI Test Automation — Interview Talking Points

## Overview

I built two complementary projects that demonstrate how Agentic AI can solve real pain points in test automation:

1. **Self-Healing Test Framework** — An AI agent that automatically recovers from broken selectors at runtime
2. **Selenium → Playwright Migration Agent** — A multi-agent system that converts legacy Selenium tests to Playwright

Both use Playwright as the test execution engine and TypeScript throughout.

---

## Project 1: Self-Healing Test Framework

### The Problem I Solved

UI tests are fragile. Every time a developer renames a CSS class, changes an ID, or restructures HTML, test selectors break. Teams waste hours fixing selectors instead of catching real bugs.

### How It Works

I built an AI agent layer that wraps Playwright's locator API. When a selector fails:

1. The agent intercepts the failure
2. It reasons about what the element should be using context hints (ARIA role, text content, data attributes, structural position)
3. It tries 5 fallback strategies in priority order
4. If it finds a match, the test continues — and logs what was healed

### Healing Strategies (in confidence order)

| Strategy | Confidence | Example |
|----------|-----------|---------|
| ARIA Role + Name | 95% | `role=button[name="Submit"]` |
| Text Content | 90% | `text="Place Order"` |
| Data Attributes | 85% | `[data-tab="social"]` |
| Structural Position | 60% | Parent + nth-child |
| AI DOM Inference | 40-80% | Scores all candidates by similarity |

### Demo Flow

```
npm test                    → 7 tests pass (selectors correct)
SELF_HEAL=true npm test     → 5 broken-selector tests pass via healing
                              6 selectors healed, avg 88% confidence
```

### Key Design Decisions

- **No external API calls** — agent uses local DOM analysis and heuristic scoring
- **Zero overhead when selectors work** — agent only activates on failure
- **Confidence scoring** — each heal has a measurable confidence level (useful for CI thresholds)
- **Environment toggle** — `SELF_HEAL=true` to enable, disabled by default

### Technical Highlights

- Custom Playwright fixture (`test.extend`) that provides the agent to every test
- Custom reporter that aggregates heal statistics across the suite
- Strategy pattern for extensibility (easy to add strategy #6, #7, etc.)
- The context hints act as a contract: "I expect a button with this text" — if the selector breaks, the intent still works

---

## Project 2: Selenium → Playwright Migration Agent

### The Problem I Solved

Migrating a Selenium test suite to Playwright is tedious, repetitive work. It follows predictable patterns but requires knowledge of both APIs. Teams often have hundreds of test files to convert.

### Architecture: Multi-Agent System

I used an **Observe → Plan → Act → Validate** loop with 3 specialized agents:

```
┌─────────────────────────────────────────────────┐
│           Orchestrator (Coordinator)             │
│          Observe → Plan → Act → Validate        │
├──────────────┬────────────────┬─────────────────┤
│   Analyzer   │  Transformer   │    Validator    │
│    Agent     │     Agent      │      Agent      │
├──────────────┼────────────────┼─────────────────┤
│ Parse source │ Rewrite code   │ Detect leftover │
│ Detect 16+   │ Convert sels   │ Selenium code   │
│ pattern types│ Transform acts │ Syntax check    │
│ Assess risk  │ Fix lifecycle  │ Confidence score│
│ Build plan   │ Remove waits   │ Suggestions     │
└──────────────┴────────────────┴─────────────────┘
```

### What Gets Converted (16+ patterns)

- Imports → `@playwright/test`
- `new Builder().build()` → Playwright fixture
- `By.id/css/xpath/name/linkText` → `page.locator()`
- `.sendKeys()` → `.fill()` / `.press()`
- `.getText()` → `.textContent()`
- Explicit waits → removed (Playwright auto-waits)
- `driver.quit()` → removed (fixture teardown)
- `switchTo().frame()` → `page.frameLocator()`
- `executeScript()` → `page.evaluate()`
- `describe/it` → `test.describe/test`

### Demo Result

```
Input:  2 Selenium test files (login flow + shopping cart)
Output: 2 Playwright spec files
        47 patterns converted
        93% average confidence
        0 remaining Selenium patterns
```

### Key Design Decisions

- **Agents have single responsibilities** — Analyzer doesn't transform, Validator doesn't write
- **Order matters** — transformations run in dependency order (imports first, then selectors, then actions)
- **Comments stripped before validation** — avoids false positives from `// old code` references
- **Confidence is quantifiable** — can be used as a CI gate ("reject migrations below 80%")
- **Dry-run mode** — preview what would change without writing files

---

## How These Projects Complement Each Other

| Aspect | Self-Healing | Migration Agent |
|--------|-------------|-----------------|
| When | Runtime (test execution) | Build time (code generation) |
| Agent type | Single reactive agent | Multi-agent orchestrated pipeline |
| AI pattern | Observe → Reason → Act | Observe → Plan → Act → Validate |
| Input | DOM state at failure | Source code file |
| Output | Recovered locator | Transformed test file |
| Value | Reduces maintenance | Reduces migration effort |

Together they tell a story: "I can build AI that works both at code generation time AND at runtime."

---

## Technical Skills Demonstrated

- **Playwright** — fixtures, locators, reporters, config, auto-wait patterns
- **TypeScript** — generics, interfaces, discriminated unions, async patterns
- **Agentic AI design** — OODA loop, multi-agent coordination, confidence scoring
- **Test architecture** — strategy pattern, page object awareness, CI/CD integration
- **Regex/AST** — code pattern detection and transformation
- **CLI tooling** — ts-node, environment toggles, dry-run modes

---

## Questions I'm Ready For

**"Why not just use an LLM API for the transformations?"**
> The migration agent uses deterministic regex transforms — they're faster, free, reproducible, and don't hallucinate. An LLM could be added as strategy #6 for edge cases, but the 93% baseline works without one.

**"How would this scale to a real 500-file test suite?"**
> The CLI already supports `--input=path` for any directory. The orchestrator processes files independently — easy to parallelize. The confidence scoring helps prioritize which files need human review.

**"What happens when self-healing confidence is low?"**
> That's configurable. In CI you could set a threshold: heals above 80% auto-pass, below 80% flag for review. The heal log preserves the full context for debugging.

**"How do you handle Selenium patterns you haven't seen before?"**
> The analyzer's pattern list is extensible — adding a new regex matcher is one line. The validator catches any remaining Selenium code and reports it. The system degrades gracefully: partial migrations are still useful.
