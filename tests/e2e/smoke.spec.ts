import { expect, test } from '@playwright/test';

test('home page renders with metadata and no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));

  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Jared Chester/);

  const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
  const person = JSON.parse(jsonLd ?? '{}') as { '@type'?: string; sameAs?: string[] };
  expect(person['@type']).toBe('Person');
  expect(person.sameAs).toHaveLength(2);

  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});
