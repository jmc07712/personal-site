import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test('FDE engagement steps expose the customer, engineering, and product learning', async ({
  page,
}) => {
  await page.goto('/blog/forward-deployed-engineering');
  const article = page.getByRole('article', {
    name: 'Forward deployed engineering, from zero to one',
  });
  await expect(article).toBeVisible();
  await expect(article.getByText('Draft', { exact: true })).toHaveCount(0);
  const learn = article.getByRole('button', { name: /03\s*Learn/ });
  await learn.focus();
  await page.keyboard.press('Enter');
  await expect(learn).toHaveAttribute('aria-pressed', 'true');
  await expect(
    article.getByRole('heading', { name: 'Use feedback to improve the product' }),
  ).toBeVisible();
  await expect(
    article.locator('figure').getByText(/better support for document versions/),
  ).toBeVisible();
  await article.getByRole('button', { name: /04\s*Extend/ }).click();
  await expect(
    article.getByRole('heading', { name: 'Make the improvement useful to other teams' }),
  ).toBeVisible();
});

test('the eval exercise preserves reader labels, separates reference data, and reveals a regression', async ({
  page,
}, testInfo) => {
  await page.goto('/blog/evals-as-a-product-loop');
  const article = page.getByRole('article', { name: 'Evals are how I steer an AI product' });
  await article.getByRole('combobox', { name: 'Trace', exact: true }).selectOption('1');
  await article.getByRole('radio', { name: 'Unsupported claim', exact: true }).check();
  await expect(article.getByText('1 of 6 traces labeled by you.')).toBeVisible();
  await article.getByRole('button', { name: 'Next trace', exact: true }).click();
  await expect(article.getByRole('combobox', { name: 'Trace', exact: true })).toBeFocused();
  await article.getByRole('button', { name: 'Previous trace', exact: true }).click();
  await article.getByRole('button', { name: /02\s*Group errors/ }).click();
  await expect(
    article.getByText('Showing your labels for 1 of 6 traces. 5 unreviewed.'),
  ).toBeVisible();
  await article
    .getByRole('checkbox', { name: 'Use the example labels for all six traces' })
    .check();
  await expect(article.getByText('Showing all 6 example labels.')).toBeVisible();
  await article.getByRole('button', { name: 'Turn a failure into a check' }).click();
  await expect(
    article.getByText(/every policy claim is supported by an applicable source/),
  ).toBeVisible();
  await article.getByRole('button', { name: 'Inspect the candidate' }).click();
  await expect(article.getByText('3 / 6', { exact: true })).toBeVisible();
  await expect(article.getByText('4 / 6', { exact: true })).toBeVisible();
  await article.locator('summary').filter({ hasText: 'Is a team plan available?' }).click();
  await expect(
    article.getByText(/The candidate introduces a new error by treating an incomplete plan list/),
  ).toBeVisible();
  expect(await article.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(
    true,
  );
  await article.locator('figure').evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: testInfo.outputPath('comparison.png') });
  await article.getByRole('button', { name: /01\s*Read traces/ }).click();
  await expect(
    article.getByRole('radio', { name: 'Unsupported claim', exact: true }),
  ).toBeChecked();
  await article.getByRole('button', { name: /04\s*Compare runs/ }).click();
  await article.getByRole('button', { name: 'Restart the exercise' }).click();
  await expect(article.getByText('0 of 6 traces labeled by you.')).toBeVisible();
});

for (const slug of ['forward-deployed-engineering', 'evals-as-a-product-loop']) {
  test(`${slug} fits the reader and has no serious accessibility violations`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/blog/${slug}`);
    const article = page.locator(`section[id="win-post:${slug}"] article`);
    await expect(article).toBeVisible();
    const fits = await article.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    );
    expect(fits).toBe(true);
    await article
      .locator('figure')
      .evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: testInfo.outputPath('graphic.png') });
    const results = await new AxeBuilder({ page })
      .include(`section[id="win-post:${slug}"]`)
      .analyze();
    expect(
      results.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
    ).toEqual([]);
  });
}
