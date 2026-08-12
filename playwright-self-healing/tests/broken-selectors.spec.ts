import { test, expect } from '../src/fixtures/healing-fixture';

/**
 * Morning Quest App — Self-Healing Tests
 * 
 * These tests simulate what happens AFTER a UI refactor on the Morning Quest homeschool app.
 * 
 * Scenario: UI components were refactored with renamed classes, changed IDs, and restructured DOM.
 * The old selectors no longer work.
 * 
 * WITHOUT self-healing: All tests fail immediately.
 * WITH self-healing: The agent recovers using contextual hints and fallback strategies.
 */

test.describe('Morning Quest App — Broken Selectors Demo', () => {

  test('broken: profile heading class renamed from .profile-header to .kid-heading', async ({ page, healingAgent }) => {
    await page.goto('/');

    // OLD selector (broken after refactor)
    // Hint: Element contains "Morning Quest" and is a heading
    const heading = await healingAgent.locate('.kid-heading', {
      tag: 'h1',
      text: 'Morning Quest',
      className: 'profile-header',
      role: 'heading',
    });

    await expect(heading).toBeVisible();
  });

  test('broken: add profile button ID changed from #new-profile-btn to #create-kid-action', async ({ page, healingAgent }) => {
    await page.goto('/');

    // OLD selector (broken)
    // Hint: The button has text "Add" and is for creating a profile
    const addButton = await healingAgent.locate('#create-kid-action', {
      role: 'button',
      text: 'Add',
      ariaLabel: 'Add new profile',
      tag: 'button',
    });

    await expect(addButton).toBeVisible();
  });

  test('broken: "create first profile" heading moved from h2 to h3', async ({ page, healingAgent }) => {
    await page.goto('/');

    // OLD selector (broken - looking for h3 when it's actually still h2)
    // Hint: The heading contains "Create your first profile" text
    // Healing agent will recover using the text content strategy
    const profileHeading = await healingAgent.locate('h3', {
      tag: 'h2',
      text: 'Create your first profile',
      role: 'heading',
      className: 'profile-heading',
    });

    await expect(profileHeading).toBeVisible();
    const headingText = await profileHeading.textContent();
    expect(headingText).toContain('Create your first profile');
  });

  test('broken: dashboard link class changed from .nav-dashboard to .header-link', async ({ page, healingAgent }) => {
    await page.goto('/');

    // OLD selector (broken)
    // Hint: Link that says "Parent Dashboard"
    const dashboardLink = await healingAgent.locate('.header-link', {
      role: 'button',
      text: 'Parent Dashboard',
      tag: 'button',
      className: 'nav-dashboard',
    });

    await expect(dashboardLink).toBeVisible();
  });

  test('broken: profile creation section wrapper moved to .form-container from .profile-form', async ({ page, healingAgent }) => {
    await page.goto('/');

    // OLD selector (broken)
    // Hint: Section containing the heading and form elements
    const formSection = await healingAgent.locate('.profile-form', {
      tag: 'div',
      parentSelector: '.form-container',
      text: 'Create your first profile',
      role: 'region',
    });

    await expect(formSection).toBeVisible();
  });

  test('broken: emoji avatar button class renamed from .emoji-selector to .avatar-picker', async ({ page, healingAgent }) => {
    await page.goto('/');

    // OLD selector (broken)
    // Hint: Button containing emoji character for avatar selection
    const emojiButton = await healingAgent.locate('.avatar-picker', {
      role: 'button',
      tag: 'button',
      className: 'emoji-selector',
      text: '🦊',
      ariaLabel: 'Select fox avatar',
    });

    await expect(emojiButton).toBeVisible();
  });
});
