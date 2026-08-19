import { test, expect } from '../src/fixtures/healing-fixture';

/**
 * Healing Strategy Coverage — Morning Quest App
 *
 * Two tests per strategy from the README table. Each test uses a
 * context object that is deliberately too weak for the higher-priority
 * strategies (no `role`+`name` pair, so ARIA Role never fires) so the
 * targeted strategy is the one that actually recovers the element.
 */

test.describe('Healing Strategy — Text Content (90% / 75%)', () => {

  test('heals via exact text match: hero subtitle', async ({ page, healingAgent }) => {
    await page.goto('/');

    // OLD selector (broken) — hint gives the full, exact visible text
    const subtitle = await healingAgent.locate('.tagline-old', {
      tag: 'p',
      text: "Pick your profile and start today's adventure!",
    });

    await expect(subtitle).toBeVisible();
  });

  test('heals via partial text match: app title substring', async ({ page, healingAgent }) => {
    await page.goto('/');

    // OLD selector (broken) — hint is only a substring ("Quest") of the
    // actual heading text ("Morning Quest"), so the exact-match lookup
    // misses and the agent falls back to its partial-text pass (75%).
    const title = await healingAgent.locate('.app-title-old', {
      tag: 'h1',
      text: 'Quest',
    });

    await expect(title).toBeVisible();
    await expect(title).toContainText('Morning Quest');
  });
});

test.describe('Healing Strategy — Data Attributes (85%)', () => {

  test('heals via data-state on the daily progress bar', async ({ page, healingAgent }) => {
    await page.goto('/');
    await page.getByPlaceholder("Kid's name").fill('Rex');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.locator('text=Rex').first().click();

    // OLD selector (broken) — no text/role hint given, only a data-*
    // fallback. The progress track and its fill both carry this attribute,
    // so `.first()` grabs the outer track.
    const progress = await healingAgent.locate('.old-progress-bar', {
      tag: 'div',
      dataAttributes: { state: 'indeterminate' },
    });

    await expect(progress.first()).toBeVisible();
  });

  test('heals via data-state on the first task checkbox', async ({ page, healingAgent }) => {
    await page.goto('/');
    await page.getByPlaceholder("Kid's name").fill('Rex');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.locator('text=Rex').first().click();

    // OLD selector (broken) — every unchecked task shares this attribute,
    // so the agent's data-attribute pass is inherently ambiguous here;
    // `.first()` deterministically lands on the first task in the list.
    const checkbox = await healingAgent.locate('.old-task-checkbox', {
      tag: 'button',
      role: 'checkbox',
      dataAttributes: { state: 'unchecked' },
    });

    await expect(checkbox.first()).toBeVisible();
  });
});

test.describe('Healing Strategy — Structural Position (60%)', () => {

  test('heals via parent + index: first sticker card (Engineer)', async ({ page, healingAgent }) => {
    await page.goto('/');
    await page.getByPlaceholder("Kid's name").fill('Rex');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.locator('text=Rex').first().click();

    // OLD selector (broken) — no text/role/data hint, only a repeated
    // sibling pattern (all 13 career sticker cards share this class list)
    // plus an index into that pattern.
    const engineerCard = await healingAgent.locate('.sticker-card-0-old', {
      tag: 'div',
      parentSelector: '.relative.rounded-2xl.p-3.text-center',
      index: 0,
    });

    await expect(engineerCard).toBeVisible();
    await expect(engineerCard).toContainText('Engineer');
  });

  test('heals via parent + index: second sticker card (Athlete)', async ({ page, healingAgent }) => {
    await page.goto('/');
    await page.getByPlaceholder("Kid's name").fill('Rex');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.locator('text=Rex').first().click();

    // OLD selector (broken) — same repeated pattern, next index.
    const athleteCard = await healingAgent.locate('.sticker-card-1-old', {
      tag: 'div',
      parentSelector: '.relative.rounded-2xl.p-3.text-center',
      index: 1,
    });

    await expect(athleteCard).toBeVisible();
    await expect(athleteCard).toContainText('Athlete');
  });
});

test.describe('Healing Strategy — AI Inference (40-80%)', () => {

  test('heals via DOM scoring: emoji avatar button', async ({ page, healingAgent }) => {
    await page.goto('/');

    // OLD selector (broken) — no text/role/data/structural hint at all.
    // Scored on tag + aria-label alone (55%); the winning class is shared
    // with two other elements, so `.first()` is required to land on the
    // highest-scored (first-in-DOM) candidate.
    const emojiButton = await healingAgent.locate('#emoji-picker-btn-old', {
      tag: 'button',
      ariaLabel: 'Change emoji',
    });

    await expect(emojiButton.first()).toBeVisible();
  });

  test('heals via DOM scoring: remove-profile button', async ({ page, healingAgent }) => {
    await page.goto('/');
    await page.getByPlaceholder("Kid's name").fill('Rex');
    await page.getByRole('button', { name: 'Add' }).click();

    // OLD selector (broken) — scored on tag + aria-label alone (55%);
    // this candidate happens to be uniquely identified by its class.
    const removeButton = await healingAgent.locate('#remove-profile-btn-old', {
      tag: 'button',
      ariaLabel: 'Remove',
    });

    await expect(removeButton).toBeVisible();
  });
});
