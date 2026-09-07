import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('browsing, URL state, calendar and back navigation work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'What’s happening?' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Music', exact: true }).check();
  await expect(page).toHaveURL(/category=Music/);
  await page.getByRole('checkbox', { name: 'Dance', exact: true }).check();
  await expect(page).toHaveURL(/category=Dance/);
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Music', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(page.locator('#calendar-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Next month' }).click();
  await page.locator('.calendar-day').first().click();
  await expect(page).toHaveURL(/day=/);
  await page.getByRole('button', { name: 'Show whole month' }).click();
  await expect(page).not.toHaveURL(/day=/);
  await page.goBack();
  await expect(page).toHaveURL(/day=/);
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.getByRole('checkbox', { name: 'Music', exact: true })).not.toBeChecked();
  await expect(page.locator('#calendar-panel')).toBeHidden();
  expect(errors).toEqual([]);
});

test('search empty state and custom range validation', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('searchbox').fill('no-event-could-match-this-12345');
  await expect(page.locator('#empty-state')).toBeVisible();
  await page.getByLabel('Custom dates', { exact: true }).check();
  await page.getByLabel('From', { exact: true }).fill('2027-12-10');
  await page.getByLabel('To', { exact: true }).fill('2027-12-01');
  await expect(page.locator('#date-error')).not.toBeEmpty();
  await page.getByLabel('To', { exact: true }).fill('2027-12-20');
  await expect(page.locator('#date-error')).toBeEmpty();
  await expect(page).toHaveURL(/from=2027-12-10/);
});

test('layout fits viewport and makes no external requests', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1')) external.push(request.url()); });
  await page.goto('./');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  expect(external).toEqual([]);
  await expect(page.getByRole('link', { name: 'Open source & update history' })).toBeVisible();
});

test('static page remains useful without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/chester-events/');
  await expect(page.locator('.notice')).toContainText('next 30 days');
  await expect(page.locator('#sources')).toBeVisible();
  await context.close();
});


test('calendar keyboard navigation crosses months with consistent URL state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./?view=calendar&month=2026-09&day=2026-09-30');
  const last = page.locator('[data-date="2026-09-30"]');
  await last.focus();
  await last.press('ArrowRight');
  await expect(page.locator('[data-date="2026-10-01"]')).toBeFocused();
  await expect(page).toHaveURL(/month=2026-10/);
  await expect(page).not.toHaveURL(/day=/);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/day=2026-10-01/);
});

test('capture list and calendar for visual review', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.screenshot({ path: testInfo.outputPath('list.png'), fullPage: true });
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.locator('#browse').scrollIntoViewIfNeeded();
  await page.locator('#calendar-panel').screenshot({ path: testInfo.outputPath('calendar.png') });
});


test('list and calendar pass automated accessibility checks', async ({ page }) => {
  await page.goto('./');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Calendar', exact: true })).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('button', { name: 'Calendar', exact: true })).toHaveCSS('background-color', 'rgb(53, 107, 193)');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});
