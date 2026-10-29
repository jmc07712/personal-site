import { expect, test } from '@playwright/test';

test('a first desktop visit hydrates and reveals content after boot', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop boot');
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Jared Chester' })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('html')).not.toHaveClass(/\bbooting\b/);
  expect(errors).toEqual([]);
});

test('phones never hide content behind the boot', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'pocket', 'phone layout');
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Jared Chester' })).toBeVisible({
    timeout: 1_000,
  });
});
