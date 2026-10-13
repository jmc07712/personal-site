import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const path of ['/', '/work/pitching-agent', '/blog']) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious.map((v) => `${v.id}: ${v.nodes.length} nodes`)).toEqual([]);
  });
}
