import { type Page, expect, test } from '@playwright/test';

// Runs against a seeded database (`pnpm db:seed`) using the seed admin account.
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? '';
const CLIENT_NAME = `E2E Client ${Date.now()}`;
const NOTES = `time spent on 21st october
30 mins meet
Meeting with Anna 1h
Bitwarden setup 15 m ??`;

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('link', { name: /Time Tracking/ }).first()).toBeVisible();
});

test.afterAll(async () => {
  await page.close();
});

test('the dashboard lists the time tracking tool', async () => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Time Tracking' })).toBeVisible();
});

test('an admin creates a client with a monthly limit', async () => {
  await page.goto('/tools/time-tracking/clients');
  await page.getByRole('button', { name: 'New client' }).click();
  await page.getByRole('textbox', { name: 'Client name' }).fill(CLIENT_NAME);
  await page.getByRole('textbox', { name: 'Monthly limit' }).fill('1');
  await page.getByRole('button', { name: 'Create client' }).click();
  await expect(page.getByRole('heading', { name: CLIENT_NAME })).toBeVisible();
});

test('time is logged with the quick-add row and the limit warning shows', async () => {
  await page.goto('/tools/time-tracking/clients');
  const clientId = (
    await page.getByRole('link', { name: new RegExp(CLIENT_NAME) }).getAttribute('href')
  )
    ?.split('/')
    .pop();
  await page.goto(`/tools/time-tracking?client=${clientId}&date=2026-10-21`);

  await page.getByLabel('Duration').first().fill('1h 10m');
  await page.getByLabel('Task').first().fill('Event sheet set up');
  await page.getByLabel('Task').first().press('Enter');

  await expect(page.getByText('Event sheet set up').first()).toBeVisible();
  await expect(page.getByText(/reached its 1h monthly limit/)).toBeVisible();
});

test('pasted notes are imported onto the right days', async () => {
  await page.getByRole('button', { name: 'Paste from notes' }).click();
  await page.getByRole('textbox', { name: 'Notes' }).fill(NOTES);
  await expect(page.getByText('3 items · 1h 45m')).toBeVisible();
  await page.getByRole('button', { name: 'Import 3 items' }).click();
  await expect(page.getByText('Imported 3 entries.')).toBeVisible();
  await expect(page.getByText('Meeting with Anna')).toBeVisible();
});

test('the monthly report previews and exports as PDF and CSV', async () => {
  await page.goto('/tools/time-tracking/clients');
  const clientId = (
    await page.getByRole('link', { name: new RegExp(CLIENT_NAME) }).getAttribute('href')
  )
    ?.split('/')
    .pop();
  await page.goto(`/tools/time-tracking/reports?clientId=${clientId}&period=MONTH&date=2026-10-01`);
  await expect(page.getByText('1 entry is marked "needs review"', { exact: false })).toBeVisible();

  for (const [format, contentType] of [
    ['pdf', 'application/pdf'],
    ['csv', 'text/csv; charset=utf-8'],
  ] as const) {
    const response = await page.request.get(
      `/api/tools/time-tracking/reports/export?clientId=${clientId}&period=MONTH&date=2026-10-01&branding=none&format=${format}`,
    );
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe(contentType);
  }
});
