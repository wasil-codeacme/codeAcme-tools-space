import { type Page, expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? '';
const RUN_ID = Date.now();
const ACCOUNT_NAME = `E2E Tool ${RUN_ID}`;
const SECRET = `e2e-secret-${RUN_ID}`;

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');
});

test.afterAll(async () => {
  await page.close();
});

test('an internal account keeps its password hidden until revealed, and the reveal is audited', async () => {
  await page.goto('/tools/accounts');
  await page.getByRole('button', { name: 'New account' }).click();
  await page.getByRole('combobox', { name: 'Belongs to' }).click();
  await page.getByRole('option', { name: 'CodeAcme internal' }).click();
  await page.getByRole('textbox', { name: 'Tool', exact: true }).fill(ACCOUNT_NAME);
  await page.getByLabel('Password or API key').fill(SECRET);
  await page.getByRole('button', { name: 'Add account' }).click();

  const row = page.locator('li', { hasText: ACCOUNT_NAME });
  await expect(row).toBeVisible();
  await expect(page.getByText(SECRET)).toHaveCount(0);
  await row.getByRole('button', { name: 'Reveal' }).click();
  await expect(row.getByText(SECRET)).toBeVisible();

  await page.goto('/tools/accounts/activity');
  await expect(
    page.locator('li', { hasText: ACCOUNT_NAME }).getByText('Revealed secret'),
  ).toBeVisible();
});

test('the work timer starts, pauses, survives a reload and lands in the history', async () => {
  await page.goto('/tools/work-timer');
  const note = `E2E session ${RUN_ID}`;
  await page.getByLabel('Note').fill(note);
  await page.getByRole('button', { name: 'Start working' }).click();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByText('Paused')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByText(note)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start working' })).toBeVisible();
});
