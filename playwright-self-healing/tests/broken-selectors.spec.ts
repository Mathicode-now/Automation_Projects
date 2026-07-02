import { test, expect } from '../src/fixtures/healing-fixture';

/**
 * These tests simulate what happens AFTER a UI refactor.
 * 
 * Scenario: A developer renamed CSS classes, changed IDs, and restructured
 * the HTML. The old selectors no longer work.
 * 
 * WITHOUT self-healing: All tests fail immediately.
 * WITH self-healing: The agent recovers using fallback strategies.
 */

test.describe('Broken Selectors Demo — UI Refactored', () => {

  test('broken: class renamed from .kid-btn to .user-card', async ({ page, healingAgent }) => {
    await page.goto('/');

    // OLD selector (broken after refactor)
    const users = await healingAgent.locate('.user-card', {
      role: 'button',
      className: 'kid-btn',  // Hint: the actual class is still kid-btn
      parentSelector: '.kid-buttons',
      text: 'Vihana',
    });

    await expect(users.first()).toBeVisible();
  });

  test('broken: ID renamed from #back-btn to #nav-back', async ({ page, healingAgent }) => {
    await page.goto('/');
    await page.locator('[data-kid="kid1"]').click();

    // OLD selector (broken)
    const backButton = await healingAgent.locate('#nav-back', {
      role: 'button',
      text: '← Back',
      ariaLabel: 'Go back',
      tag: 'button',
    });

    await backButton.click();
    await expect(page.locator('#kid-select.active')).toBeVisible();
  });

  test('broken: data attribute renamed from data-tab to data-section', async ({ page, healingAgent }) => {
    await page.goto('/');
    await page.locator('[data-kid="kid1"]').click();

    // OLD selector (broken)
    const socialTab = await healingAgent.locate('[data-section="social"]', {
      role: 'button',
      text: '🤝 Social',
      dataAttributes: { tab: 'social' },  // Hint: actual attr is data-tab
      tag: 'button',
    });

    await socialTab.click();

    // Verify social goals are visible
    const kindWordsGoal = await healingAgent.locate('[data-item="s1"]', {
      text: 'Use kind words all day',
      dataAttributes: { goal: 's1' },  // Actual attr is data-goal
      className: 'goal-card',
    });
    await expect(kindWordsGoal).toBeVisible();
  });

  test('broken: progress element ID changed', async ({ page, healingAgent }) => {
    await page.goto('/');
    await page.locator('[data-kid="kid1"]').click();
    await page.locator('[data-goal="d1"]').click();

    // OLD selector (broken)
    const progressLabel = await healingAgent.locate('#completion-text', {
      tag: 'p',
      parentSelector: 'footer',
      text: 'done today',
    });

    const text = await progressLabel.textContent();
    expect(text).toContain('done today');
  });

  test('broken: streak badge class changed', async ({ page, healingAgent }) => {
    await page.goto('/');
    await page.locator('[data-kid="kid1"]').click();

    // OLD selector (broken)
    const streak = await healingAgent.locate('.fire-streak-badge', {
      text: 'day streak',
      tag: 'div',
      className: 'streak-badge',
    });

    await expect(streak).toBeVisible();
  });
  //new code to test
  test('broken: element moved inside new .card-wrapper container', async ({ page, healingAgent }) => {
    await page.goto('/');
    await page.locator('[data-kid="kid1"]').click();

    // OLD selector: previously a direct child of .info-panel, 
    // now nested inside .card-wrapper
    const bioText = await healingAgent.locate('.info-panel > .bio', {
      tag: 'p',
      text: 'Loves building blocks and drawing',
      parentSelector: '.card-wrapper',
    });

    await expect(bioText).toBeVisible();
  });
});
