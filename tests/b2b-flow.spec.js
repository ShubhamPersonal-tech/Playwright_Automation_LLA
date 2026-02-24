/**
 * B2B Flow test. Runs after login (uses session from .auth/salesforce-auth.json).
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.resolve(__dirname, '..', '.auth', 'salesforce-auth.json');

test('B2B Flow', async ({ page, context }) => {
  // Close any new tab opened during the flow (popups, target=_blank, etc.) immediately
  context.on('page', (newPage) => newPage.close());

  // ---------------------------
  // Attach to lightning session
  // ---------------------------
  await page.goto('https://cwc--qasales.sandbox.lightning.force.com/lightning/page/home');
  await page.waitForSelector('one-appnav', { timeout: 60000 });
  // ---------------------------
  /// Open user detail page
  await page.goto('https://cwc--qasales.sandbox.my.salesforce-setup.com/lightning/setup/ManageUsers/page?address=%2F00574000001KtCH%3Fnoredirect%3D1%26isUserEntityOverride%3D1');
  // Wait for setup page
  await page.waitForLoadState('domcontentloaded');
  // Salesforce Setup iframe
  const frame = page.frameLocator('iframe');
  // ---- TARGET ONLY USER DETAIL ROW ----
  const userDetailRow = frame.getByRole('row', { name: /User Detail/i });
  // real Login button inside that row
  const loginBtn = userDetailRow.locator('input[name="login"]');
  // wait until visible
  await loginBtn.waitFor({ state: 'visible', timeout: 120000 });
  // ---- CLICK + WAIT FOR SWITCH USER ----
  await Promise.all([
    page.waitForNavigation({ timeout: 120000 }),
    loginBtn.click()
  ]);
  // confirm redirect to lightning
  await page.waitForURL(/lightning|one\.one/, { timeout: 120000 });
  console.log('Login As User successful');
  await page.goto('https://cwc--qasales.sandbox.lightning.force.com/lightning/n/B2BQuickSales');
  await page.getByRole('button', { name: 'New' }).click();
  await page.getByRole('textbox', { name: '*Company' }).fill('test');
  await page.getByRole('combobox', { name: '*Industry' }).click();
  await page.getByText('Air Services').click();
  // open dropdown
  await page.getByRole('combobox', { name: '*Account Type' }).click();
  // wait dropdown container
  const listbox = page.locator('.slds-listbox:visible').last();
  await listbox.waitFor();
  // select value using data-value
  await listbox.locator('[data-value="SOHO/Small"]').click();
  await page.getByRole('textbox', { name: 'Social Security Number' }).fill('223344556');
  await page.getByRole('combobox', { name: 'Salutation' }).click();
  await page.getByText('Mr', { exact: true }).click();
  await page.getByRole('textbox', { name: '*First Name' }).fill('test');
  await page.getByRole('textbox', { name: '*Last Name' }).fill('Auto');
  await page.getByRole('textbox', { name: '*Phone' }).fill('(123) 456-7890');
  await page.getByRole('textbox', { name: '*Email' }).fill('testauto@gmail.com');
  await page.getByRole('button', { name: 'Create Customer Account' }).click();
  // ---------------- Address Search (OmniScript Google Address) ----------------
  const addressInput = page
    .locator('text=Address Search')
    .locator('xpath=ancestor::div[contains(@class,"slds-form-element")]')
    .locator('input')
    .first();
  await addressInput.waitFor({ state: 'visible' });
  await addressInput.scrollIntoViewIfNeeded();
  // Focus FIRST (important)
  await addressInput.click();
  // type slowly to trigger Salesforce debounce + Google API
  await addressInput.pressSequentially('1', { delay: 200 });
  await page.waitForTimeout(800);
  await addressInput.pressSequentially('451 Ashford', { delay: 120 });
  // WAIT — google predictions load silently
  await page.waitForTimeout(2500);
  // select first suggestion via keyboard (most reliable)
  await addressInput.press('ArrowDown');
  await addressInput.press('Enter');
  // wait for fields autofill
  await page.waitForTimeout(2000);
  await page.getByRole('link', { name: 'Certificate of Registration' }).click();
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForTimeout(5000);
  await page.getByRole('link', { name: 'Business License' }).waitFor({ state: 'visible' });
  await page.getByRole('link', { name: 'Business License' }).click();
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.waitForTimeout(20000);
  await page.getByRole('button', { name: 'Create Contact' }).click();
  await page.locator('.spinner-overlay').waitFor({ state: 'hidden', timeout: 60000 });
  await page.getByRole('button', { name: 'Proceed to Credit Check' }).click();
  await page.getByText('Default').waitFor({ state: 'visible', timeout: 30000 });
  await page.getByText('Default').click();
  // Wait for modal spinner to finish so Close is clickable and not blocked
  await page.getByRole('article').locator('.slds-spinner_container, [class*="spinner"]').waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  // Wait for Close button to be enabled (starts disabled, then spinner can block it)
  const closeBtn = page.getByRole('article').getByRole('button', { name: 'Close' });
  await closeBtn.waitFor({ state: 'visible', timeout: 60000 });
  await expect(closeBtn).toBeEnabled({ timeout: 60000 });
  // Close modal and wait for account view + page ready
  await Promise.all([
    closeBtn.click(),
    page.waitForURL(/\/lightning\/r\/Account\/.*\/view/, { timeout: 60000 }),
    page.waitForLoadState('domcontentloaded')
  ]);
  await page.locator('.slds-icon-waffle').waitFor({ timeout: 600000 });
  await page.context().storageState({ path: authFile });
});
