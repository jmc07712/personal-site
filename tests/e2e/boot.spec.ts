import { expect, test } from '@playwright/test';

test('phones never hide content behind the boot', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'pocket', 'phone layout');
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Jared Chester' })).toBeVisible({
    timeout: 1_000,
  });
});
