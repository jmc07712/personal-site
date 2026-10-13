import { expect, test } from '@playwright/test';

test('the blog index opens the Writing window', async ({ page }) => {
  await page.goto('/blog');
  await expect(page.locator('#win-writing')).toBeVisible();
  await expect(page).toHaveTitle(/Writing/);
});

test('the RSS feed is served as RSS', async ({ request }) => {
  const response = await request.get('/feed.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/rss+xml');
  expect(await response.text()).toContain('<rss');
});

test('drafts are not published', async ({ page }) => {
  const response = await page.goto('/blog/hello-world');
  expect(response?.status()).toBe(404);
});
