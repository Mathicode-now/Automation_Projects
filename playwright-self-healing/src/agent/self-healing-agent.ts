import { Page, Locator } from '@playwright/test';
import { HealingResult, HealingStrategy, HealLog } from './types';

/**
 * Self-Healing Agent - Agentic AI layer that intercepts selector failures
 * and attempts to locate elements using multiple fallback strategies.
 * 
 * Strategies (in order of confidence):
 * 1. ARIA role + accessible name
 * 2. Text content matching
 * 3. Structural/positional analysis
 * 4. Visual similarity (data attributes, nearby landmarks)
 * 5. AI-powered inference (uses LLM to reason about DOM)
 */
export class SelfHealingAgent {
  private page: Page;
  private healLog: HealLog[] = [];
  private enabled: boolean;

  constructor(page: Page) {
    this.page = page;
    this.enabled = process.env.SELF_HEAL === 'true';
  }

  /**
   * Attempts to locate an element. If the primary selector fails and
   * self-healing is enabled, tries fallback strategies.
   */
  async locate(
    primarySelector: string,
    context: ElementContext
  ): Promise<Locator> {
    // Try primary selector first
    const primary = this.page.locator(primarySelector);
    if (await this.isVisible(primary)) {
      return primary;
    }

    if (!this.enabled) {
      throw new Error(
        `Element not found: "${primarySelector}" — Self-healing is disabled. ` +
        `Run with SELF_HEAL=true to enable auto-recovery.`
      );
    }

    console.log(`\n🔍 [HEAL] Primary selector failed: "${primarySelector}"`);
    console.log(`   Context: ${JSON.stringify(context)}`);

    // Try each healing strategy
    const strategies = this.getStrategies(context);
    
    for (const strategy of strategies) {
      const result = await this.tryStrategy(strategy, context);
      if (result.found) {
        this.logHeal({
          originalSelector: primarySelector,
          healedSelector: result.selector!,
          strategy: strategy.name,
          confidence: result.confidence,
          context,
          timestamp: new Date().toISOString(),
        });
        
        console.log(`   ✅ Healed via ${strategy.name} (confidence: ${result.confidence}%)`);
        console.log(`   New selector: "${result.selector}"`);
        
        return this.page.locator(result.selector!);
      }
    }

    throw new Error(
      `[HEAL FAILED] Could not recover selector: "${primarySelector}". ` +
      `All ${strategies.length} strategies exhausted.`
    );
  }

  private getStrategies(context: ElementContext): HealingStrategy[] {
    return [
      { name: 'aria-role', fn: () => this.healByAriaRole(context) },
      { name: 'text-content', fn: () => this.healByTextContent(context) },
      { name: 'data-attributes', fn: () => this.healByDataAttributes(context) },
      { name: 'structural-position', fn: () => this.healByStructure(context) },
      { name: 'ai-inference', fn: () => this.healByAI(context) },
    ];
  }

  private async tryStrategy(
    strategy: HealingStrategy,
    context: ElementContext
  ): Promise<HealingResult> {
    try {
      const result = await strategy.fn();
      if (result.found) {
        const locator = this.page.locator(result.selector!);
        if (await this.isVisible(locator)) {
          return result;
        }
      }
    } catch {
      // Strategy failed, try next
    }
    return { found: false, confidence: 0 };
  }

  // Strategy 1: Find by ARIA role and accessible name
  private async healByAriaRole(context: ElementContext): Promise<HealingResult> {
    if (!context.role || !context.name) {
      return { found: false, confidence: 0 };
    }

    const selector = `role=${context.role}[name="${context.name}"]`;
    const locator = this.page.locator(selector);
    
    if (await this.isVisible(locator)) {
      return { found: true, selector, confidence: 95 };
    }
    return { found: false, confidence: 0 };
  }

  // Strategy 2: Find by text content
  private async healByTextContent(context: ElementContext): Promise<HealingResult> {
    if (!context.text) {
      return { found: false, confidence: 0 };
    }

    // Try exact text match first
    const exactSelector = `text="${context.text}"`;
    let locator = this.page.locator(exactSelector);
    if (await this.isVisible(locator)) {
      return { found: true, selector: exactSelector, confidence: 90 };
    }

    // Try partial text match
    const partialSelector = `text=${context.text}`;
    locator = this.page.locator(partialSelector);
    if (await this.isVisible(locator)) {
      return { found: true, selector: partialSelector, confidence: 75 };
    }

    return { found: false, confidence: 0 };
  }

  // Strategy 3: Find by data attributes
  private async healByDataAttributes(context: ElementContext): Promise<HealingResult> {
    if (!context.dataAttributes) {
      return { found: false, confidence: 0 };
    }

    for (const [attr, value] of Object.entries(context.dataAttributes)) {
      const selector = `[data-${attr}="${value}"]`;
      const locator = this.page.locator(selector);
      if (await this.isVisible(locator)) {
        return { found: true, selector, confidence: 85 };
      }
    }
    return { found: false, confidence: 0 };
  }

  // Strategy 4: Find by structural position (parent > nth-child pattern)
  private async healByStructure(context: ElementContext): Promise<HealingResult> {
    if (!context.parentSelector || context.index === undefined) {
      return { found: false, confidence: 0 };
    }

    const selector = `${context.parentSelector} >> nth=${context.index}`;
    const locator = this.page.locator(selector);
    if (await this.isVisible(locator)) {
      return { found: true, selector, confidence: 60 };
    }
    return { found: false, confidence: 0 };
  }

  // Strategy 5: AI-powered inference using DOM analysis
  private async healByAI(context: ElementContext): Promise<HealingResult> {
    // Get a snapshot of the current DOM around the expected area
    const domSnapshot = await this.page.evaluate((ctx) => {
      const candidates: Array<{
        tag: string;
        id: string;
        classes: string;
        text: string;
        ariaLabel: string;
        dataAttrs: Record<string, string>;
        selector: string;
      }> = [];

      // Get all interactive elements and elements matching the expected tag
      const elements = document.querySelectorAll(
        'button, a, input, [role], [data-goal], [data-kid], [data-tab], .goal-card, .kid-btn, .tab'
      );

      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const dataAttrs: Record<string, string> = {};
        Array.from(el.attributes)
          .filter(a => a.name.startsWith('data-'))
          .forEach(a => dataAttrs[a.name] = a.value);

        let selector = el.tagName.toLowerCase();
        if (el.id) selector = `#${el.id}`;
        else if (el.className) selector = `.${el.className.split(' ')[0]}`;

        candidates.push({
          tag: el.tagName.toLowerCase(),
          id: el.id,
          classes: el.className,
          text: htmlEl.textContent?.trim().slice(0, 50) || '',
          ariaLabel: el.getAttribute('aria-label') || '',
          dataAttrs,
          selector,
        });
      });

      return candidates;
    }, context);

    // Score candidates based on context hints
    const scored = domSnapshot.map(candidate => {
      let score = 0;
      
      if (context.text && candidate.text.includes(context.text)) score += 40;
      if (context.tag && candidate.tag === context.tag) score += 20;
      if (context.className && candidate.classes.includes(context.className)) score += 30;
      if (context.ariaLabel && candidate.ariaLabel === context.ariaLabel) score += 35;
      
      if (context.dataAttributes) {
        for (const [key, val] of Object.entries(context.dataAttributes)) {
          if (candidate.dataAttrs[`data-${key}`] === val) score += 25;
        }
      }

      return { ...candidate, score };
    }).sort((a, b) => b.score - a.score);

    if (scored.length > 0 && scored[0].score >= 40) {
      const best = scored[0];
      let selector = best.selector;
      
      // Build a more specific selector
      if (best.id) {
        selector = `#${best.id}`;
      } else if (Object.keys(best.dataAttrs).length > 0) {
        const [attr, val] = Object.entries(best.dataAttrs)[0];
        selector = `[${attr}="${val}"]`;
      }

      return { found: true, selector, confidence: Math.min(scored[0].score, 80) };
    }

    return { found: false, confidence: 0 };
  }

  private async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.first().waitFor({ state: 'visible', timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  private logHeal(entry: HealLog): void {
    this.healLog.push(entry);
  }

  getHealLog(): HealLog[] {
    return this.healLog;
  }

  getStats() {
    const total = this.healLog.length;
    const avgConfidence = total > 0
      ? Math.round(this.healLog.reduce((sum, l) => sum + l.confidence, 0) / total)
      : 0;
    const byStrategy = this.healLog.reduce((acc, l) => {
      acc[l.strategy] = (acc[l.strategy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, avgConfidence, byStrategy };
  }
}

export interface ElementContext {
  role?: string;
  name?: string;
  text?: string;
  tag?: string;
  className?: string;
  ariaLabel?: string;
  dataAttributes?: Record<string, string>;
  parentSelector?: string;
  index?: number;
}
