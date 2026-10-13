import { expect, test } from './fixtures';

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
  // The first case file now covers the trace, so reach the second one by keyboard.
  const trace = page.getByRole('listbox', { name: /Career spans/ });
  await trace.focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(trace).toHaveAttribute('aria-activedescendant', 'row-insights-api');
  await page.keyboard.press('Enter');
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

// Unknown params stream after the static shell, so Next.js answers with the not-found page and a
// noindex tag rather than a 404 status (see "Status codes" in the loading.js docs).
test('an unknown case file shows the not-found page and is kept out of search', async ({
  page,
}) => {
  await page.goto('/work/nope');
  await expect(page.getByText('Page not found')).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
});
