import { test, expect } from '../src/fixtures/healing-fixture';

/**
 * E-Commerce-style checkout flow tests using the Summer Goals app.
 * 
 * The app mimics a checkout journey:
 * - Kid selection = Customer login
 * - Goal categories (tabs) = Product categories / cart sections  
 * - Checking goals = Adding items / completing steps
 * - Progress bar = Checkout progress
 * 
 * These tests use intentionally FRAGILE selectors to demonstrate
 * how easily tests break when the UI changes.
 */

test.describe('User Selection Flow (Login)', () => {
  test('should display available users', async ({ page, healingAgent }) => {
    await page.goto('/');

    // This selector will BREAK if dev renames the class
    const userButtons = await healingAgent.locate('.kid-btn', {
      role: 'button',
      className: 'kid-btn',
      parentSelector: '.kid-buttons',
    });

    await expect(userButtons.first()).toBeVisible();
    expect(await userButtons.count()).toBe(2);
  });

  test('should select a user and navigate to dashboard', async ({ page, healingAgent }) => {
    await page.goto('/');

    // Fragile: uses data attribute that might get renamed
    const firstUser = await healingAgent.locate('[data-kid="kid1"]', {
      role: 'button',
      text: 'Vihana',
      dataAttributes: { kid: 'kid1' },
      tag: 'button',
    });

    await firstUser.click();

    // Verify dashboard appeared
    const dashboard = await healingAgent.locate('#dashboard.active', {
      tag: 'div',
      className: 'active',
    });
    await expect(dashboard).toBeVisible();
  });
});

test.describe('Goal Category Navigation (Product Browsing)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-kid="kid1"]').click();
  });

  test('should navigate between categories', async ({ page, healingAgent }) => {
    // Click "Physical" tab — fragile selector
    const physicalTab = await healingAgent.locate('[data-tab="physical"]', {
      role: 'button',
      text: '🚴 Physical',
      dataAttributes: { tab: 'physical' },
      tag: 'button',
    });
    await physicalTab.click();

    // Verify physical goals are shown
    const bikeGoal = await healingAgent.locate('[data-goal="p1"]', {
      text: 'Ride bike for 30 minutes',
      dataAttributes: { goal: 'p1' },
      className: 'goal-card',
    });
    await expect(bikeGoal).toBeVisible();
  });

  test('should show all tab options', async ({ page, healingAgent }) => {
    const tabs = await healingAgent.locate('.tab', {
      role: 'button',
      className: 'tab',
      parentSelector: '.tab-bar',
    });

    expect(await tabs.count()).toBe(5);
  });
});

test.describe('Goal Completion (Checkout Steps)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-kid="kid1"]').click();
  });

  test('should toggle a goal as complete', async ({ page, healingAgent }) => {
    const firstGoal = await healingAgent.locate('[data-goal="d1"]', {
      text: 'Read for 20 minutes',
      dataAttributes: { goal: 'd1' },
      className: 'goal-card',
    });

    await firstGoal.click();

    // Verify it's now checked
    const checkedGoal = await healingAgent.locate('.goal-card.checked', {
      className: 'checked',
      parentSelector: '#tab-content',
      index: 0,
    });
    await expect(checkedGoal).toBeVisible();
  });

  test('should update progress bar after completion', async ({ page, healingAgent }) => {
    // Complete a goal
    await page.locator('[data-goal="d1"]').click();

    // Check progress text updates
    const progressText = await healingAgent.locate('#progress-text', {
      tag: 'p',
      className: 'progress-text',
      parentSelector: 'footer',
    });

    const text = await progressText.textContent();
    expect(text).not.toBe('0% done today');
  });
});

test.describe('Navigation Back (Cart Abandonment)', () => {
  test('should return to user selection', async ({ page, healingAgent }) => {
    await page.goto('/');
    await page.locator('[data-kid="kid1"]').click();

    const backBtn = await healingAgent.locate('#back-btn', {
      role: 'button',
      text: '← Back',
      ariaLabel: 'Go back',
      tag: 'button',
    });
    await backBtn.click();

    const kidSelect = await healingAgent.locate('#kid-select.active', {
      tag: 'div',
      className: 'active',
    });
    await expect(kidSelect).toBeVisible();
  });
});
