import { expect, test } from './fixtures';

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop windows');
  await page.goto('/');
});

test('About is open and focused on arrival', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Jared Chester' })).toBeVisible();
  await expect(page.locator('#win-about')).toBeVisible();
});

test('the menubar opens a window and brings it into view', async ({ page }) => {
  await page
    .getByRole('navigation', { name: 'Windows' })
    .getByRole('button', { name: 'Experience' })
    .click();
  await expect(page.locator('#win-experience')).toBeInViewport();
  await expect(page.locator('#win-experience')).toBeFocused();
});

test('closing a window leaves a placeholder that reopens it', async ({ page }) => {
  await page.getByRole('button', { name: 'Close Experience' }).click();
  await expect(page.locator('#win-experience')).toBeHidden();
  await page.getByRole('button', { name: /Experience is closed/ }).click();
  await expect(page.locator('#win-experience')).toBeVisible();
});

test('a window can be dragged by its title bar', async ({ page }) => {
  const win = page.locator('#win-about');
  const before = await win.boundingBox();
  const bar = win
    .locator('div')
    .filter({ hasText: /^About$/ })
    .first();
  const handle = await bar.boundingBox();
  if (!before || !handle) throw new Error('About window is not laid out');
  await page.mouse.move(handle.x + 120, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + 240, handle.y + handle.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  const after = await win.boundingBox();
  expect(after!.x - before.x).toBeCloseTo(120, -1);
  expect(after!.y - before.y).toBeCloseTo(40, -1);
});

test('Escape closes the focused window and returns focus to what opened it', async ({ page }) => {
  const menuItem = page
    .getByRole('navigation', { name: 'Windows' })
    .getByRole('button', { name: 'Contact' });
  await menuItem.click();
  await expect(page.locator('#win-contact')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#win-contact')).toBeHidden();
  await expect(menuItem).toBeFocused();
});

test('selecting a span shows its numbers in the inspector', async ({ page }) => {
  await page.getByRole('option', { name: /Insights API/ }).click();
  await expect(page.getByRole('heading', { level: 3, name: 'Insights API' })).toBeVisible();
  await expect(page.getByText('records a month').first()).toBeVisible();
});

test('arrow keys move through the trace', async ({ page }) => {
  const list = page.getByRole('listbox', { name: /Career spans/ });
  await list.focus();
  const before = await list.getAttribute('aria-activedescendant');
  await page.keyboard.press('ArrowDown');
  await expect(list).not.toHaveAttribute('aria-activedescendant', before ?? '');
});

test('Contact never shows a phone number', async ({ page }) => {
  await expect(page.locator('#win-contact')).not.toContainText(/\d{3}[-.\s]\d{3}[-.\s]\d{4}/);
});
