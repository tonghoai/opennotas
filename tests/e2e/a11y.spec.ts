import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openSeededApp, openSettings } from './helpers/workspace';

// Serious and critical axe findings both gate the suite. Lower-severity
// findings stay in the attached JSON report for follow-up.
test.describe('accessibility @a11y', () => {
  test('main workspace has no serious accessibility violations', async ({ page, isMobile }) => {
    await openSeededApp(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
    console.log('A11Y main serious', serious.map((violation) => ({ id: violation.id, nodes: violation.nodes.length })));
    await test.info().attach('axe-main.json', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
    expect(serious).toEqual([]);
  });

  test('settings has no serious accessibility violations', async ({ page, isMobile }) => {
    await openSeededApp(page);
    await openSettings(page, isMobile);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
    console.log('A11Y settings serious', serious.map((violation) => ({ id: violation.id, nodes: violation.nodes.length })));
    await test.info().attach('axe-settings.json', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
    expect(serious).toEqual([]);
  });

  test('UI kit gallery has no serious accessibility violations', async ({ page }) => {
    await page.goto('/dev/ui');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
    console.log('A11Y gallery serious', serious.map((violation) => ({ id: violation.id, nodes: violation.nodes.length })));
    await test.info().attach('axe-gallery.json', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
    expect(serious).toEqual([]);
  });
});
