import { test as base } from '@playwright/test';

/**
 * Pages start as a returning visitor who has already seen the boot this session, so tests see
 * the desktop immediately. boot.spec.ts covers a first visit.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => window.sessionStorage.setItem('booted', '1'));
    await provide(page);
  },
});

export { expect } from '@playwright/test';
