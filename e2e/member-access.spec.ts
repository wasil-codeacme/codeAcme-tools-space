import { type Browser, type Page, expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? '';
const RUN_ID = Date.now();
const MEMBER_EMAIL = `member-${RUN_ID}@example.test`;
const MEMBER_PASSWORD = 'member-password-123';
const VISIBLE_CLIENT = `Visible Client ${RUN_ID}`;
const HIDDEN_CLIENT = `Hidden Client ${RUN_ID}`;

test.describe.configure({ mode: 'serial' });

async function signIn(browser: Browser, email: string, password: string): Promise<Page> {
  const page = await browser.newPage();
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');
  return page;
}

async function createClient(page: Page, name: string) {
  await page.goto('/tools/time-tracking/clients');
  await page.getByRole('button', { name: 'New client' }).click();
  await page.getByRole('textbox', { name: 'Client name' }).fill(name);
  await page.getByRole('button', { name: 'Create client' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}

test('an admin adds a member and assigns them to one client', async ({ browser }) => {
  const admin = await signIn(browser, ADMIN_EMAIL, ADMIN_PASSWORD);

  await admin.goto('/admin/team');
  await admin.getByRole('button', { name: 'Add member' }).click();
  await admin.getByLabel('Name').fill(`Member ${RUN_ID}`);
  await admin.getByLabel('Email').fill(MEMBER_EMAIL);
  await admin.getByLabel('Temporary password').fill(MEMBER_PASSWORD);
  await admin.getByRole('button', { name: 'Add member' }).last().click();
  await expect(admin.getByText(MEMBER_EMAIL)).toBeVisible();

  await createClient(admin, HIDDEN_CLIENT);
  await createClient(admin, VISIBLE_CLIENT);
  await admin.getByRole('combobox', { name: 'Assign a team member' }).click();
  await admin.getByRole('option', { name: new RegExp(MEMBER_EMAIL) }).click();
  await expect(admin.getByText(`Member ${RUN_ID}`)).toBeVisible();
  await admin.close();
});

test('the member only sees their assigned client and no admin areas', async ({ browser }) => {
  const member = await signIn(browser, MEMBER_EMAIL, MEMBER_PASSWORD);

  await expect(member.getByRole('link', { name: 'Team' })).toHaveCount(0);
  await member.goto('/tools/time-tracking');
  await expect(member.getByRole('combobox', { name: 'Client' })).toHaveText(VISIBLE_CLIENT);
  await expect(member.getByRole('link', { name: 'Reports' })).toHaveCount(0);

  await member.getByRole('combobox', { name: 'Client' }).click();
  await expect(member.getByRole('option', { name: HIDDEN_CLIENT })).toHaveCount(0);
  await member.keyboard.press('Escape');

  await member.goto('/admin/team');
  await expect(member).toHaveURL('/');

  const exportResponse = await member.request.get(
    '/api/tools/time-tracking/reports/export?clientId=anything&period=MONTH&date=2026-10-01&format=csv',
  );
  expect(exportResponse.status()).toBe(403);
  await member.close();
});
