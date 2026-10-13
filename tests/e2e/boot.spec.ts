import { expect, test } from '@playwright/test';

test('a first desktop visit plays the boot, then reveals the desktop', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'the boot hides the hero on desktop only');
  await page.goto('/');
  const name = page.getByRole('heading', { level: 1, name: 'Jared Chester' });
  // The curtain lifts when the boot ends, and never later than its 8 s safety timeout.
  await expect(name).toBeVisible({ timeout: 15_000 });
  // Once it has played, the boot doesn't play again this session.
  await expect
    .poll(() => page.evaluate(() => window.sessionStorage.getItem('booted')), { timeout: 15_000 })
    .toBe('1');
  await page.reload();
  await expect(name).toBeVisible({ timeout: 3_000 });
});

test('phones never hide content behind the boot', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'pocket', 'phone layout');
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Jared Chester' })).toBeVisible({
    timeout: 1_000,
  });
});
