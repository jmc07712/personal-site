import { expect, test } from '@playwright/test';

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop windows');
});

const pitchingAgent = (page: import('@playwright/test').Page) =>
  page.getByRole('heading', { level: 2, name: 'Pitching Agent' });

test('opening a case file gives it a URL, and Back and Forward follow it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('option', { name: /Pitching Agent/ }).click();
  await page.getByRole('button', { name: 'Open case file' }).click();
  await expect(page).toHaveURL(/\/work\/pitching-agent$/);
  await expect(pitchingAgent(page)).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(pitchingAgent(page)).toBeHidden();

  await page.goForward();
  await expect(pitchingAgent(page)).toBeVisible();
});

test('Escape closes a case file and returns focus to the button that opened it', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('option', { name: /Pitching Agent/ }).click();
  const opener = page.getByRole('button', { name: 'Open case file' });
  await opener.click();
  await expect(pitchingAgent(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(pitchingAgent(page)).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page).toHaveURL(/\/$/);
});

test('two case files can be open; closing them leaves no stale URL', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('option', { name: /Pitching Agent/ }).click();
  await page.getByRole('button', { name: 'Open case file' }).click();
  await page.getByRole('option', { name: /Insights API/ }).click();
  await page.getByRole('button', { name: 'Open case file' }).click();
  await expect(page).toHaveURL(/\/work\/insights-api$/);
  await page.getByRole('button', { name: 'Close insights-api.case' }).click();
  await expect(page).toHaveURL(/\/work\/pitching-agent$/);
  await page.getByRole('button', { name: 'Close pitching-agent.case' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('a case-file URL loads with the case file open', async ({ page }) => {
  await page.goto('/work/insights-api');
  await expect(page.getByRole('heading', { level: 2, name: 'Insights API' })).toBeVisible();
  await expect(page).toHaveTitle(/Insights API/);
});

test('an unknown case file is a 404', async ({ page }) => {
  const response = await page.goto('/work/nope');
  expect(response?.status()).toBe(404);
  await expect(page.getByText('That file isn’t on this desktop')).toBeVisible();
});
