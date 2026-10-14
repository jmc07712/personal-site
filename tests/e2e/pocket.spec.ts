import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'pocket', 'phone layout');
});

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test('the home screen comes first and nothing scrolls sideways', async ({ page }) => {
  await page.goto('/');
  const home = page.getByRole('region', { name: 'Home screen' });
  await expect(home.getByText('Jared Chester')).toBeInViewport();
  await expect(home.getByRole('link')).toHaveCount(7);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expectNoHorizontalScroll(page);
});

test('a home screen icon scrolls to its window and focuses it', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('region', { name: 'Home screen' })
    .getByRole('link', { name: 'Writing' })
    .click();
  await expect(page.locator('#win-writing')).toBeFocused();
  await expect(page.locator('#win-writing')).toBeInViewport();
});

for (const size of [
  { width: 320, height: 640 },
  { width: 844, height: 390 },
  { width: 430, height: 932 },
]) {
  test(`no horizontal scroll at ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');
    await expectNoHorizontalScroll(page);
  });
}

test('the dock jumps to a section and marks it', async ({ page }) => {
  await page.goto('/');
  const dock = page.getByRole('navigation', { name: 'Sections' });
  await dock.getByRole('link', { name: 'Work' }).click();
  await expect(page.locator('#work')).toBeInViewport();
  await expect(dock.getByRole('link', { name: 'Work' })).toHaveAttribute(
    'aria-current',
    'location',
  );
});

test('a role expands to its systems and a case file opens as a sheet', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Amazon Ads/ }).click();
  await page.getByRole('button', { name: /Insights API/ }).click();
  await page.getByRole('button', { name: 'Read the case file' }).click();
  await expect(page).toHaveURL(/\/work\/insights-api$/);
  const sheet = page.locator('#win-case\\:insights-api');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Back' }).click();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});

test('the dock never covers the end of the page', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const footer = await page.locator('footer').last().boundingBox();
  const dock = await page.getByRole('navigation', { name: 'Sections' }).boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(dock!.y);
});
