import { test as base, Page } from '@playwright/test';
import { SelfHealingAgent, ElementContext } from '../agent/self-healing-agent';

/**
 * Extended Playwright fixture that provides a self-healing agent
 * alongside the standard page object.
 */
export const test = base.extend<{
  healingAgent: SelfHealingAgent;
  smartLocator: (selector: string, context: ElementContext) => ReturnType<SelfHealingAgent['locate']>;
}>({
  healingAgent: async ({ page }, use) => {
    const agent = new SelfHealingAgent(page);
    await use(agent);

    // After test: output heal stats
    const stats = agent.getStats();
    if (stats.total > 0) {
      console.log('\n📊 Self-Healing Summary:');
      console.log(`   Healed: ${stats.total} selectors`);
      console.log(`   Avg confidence: ${stats.avgConfidence}%`);
      console.log(`   Strategies used:`, stats.byStrategy);
    }
  },

  smartLocator: async ({ page }, use) => {
    const agent = new SelfHealingAgent(page);
    const locate = (selector: string, context: ElementContext) => {
      return agent.locate(selector, context);
    };
    await use(locate);
  },
});

export { expect } from '@playwright/test';
