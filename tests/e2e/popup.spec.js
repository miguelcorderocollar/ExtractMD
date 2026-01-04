import { test, expect } from '@playwright/test';
import { launchWithExtension, getExtensionId } from './helpers/extension.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('ExtractMD Popup', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    context = await launchWithExtension();
    extensionId = await getExtensionId(context);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('popup opens and displays quick actions', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Check that main elements are present
    await expect(page.locator('text=ExtractMD')).toBeVisible();
    // Note: extractNowBtn is hidden when no active tab with content script
    // This is correct behavior - the button only shows when extraction is available
    await expect(page.locator('#openSettingsBtn')).toBeVisible();
  });

  test('Extract Now button exists in DOM', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Button exists in DOM but may be hidden when no active tab with content
    const extractBtn = page.locator('#extractNowBtn');
    await expect(extractBtn).toHaveCount(1);
    await expect(extractBtn).toHaveText(/Extract Now/);
  });

  test('displays KPI counters', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const kpiSection = page.locator('#kpi-section');
    await expect(kpiSection).toBeVisible();

    const kpiCounters = page.locator('#kpi-counters');
    await expect(kpiCounters).toBeVisible();
  });

  test('displays domain toggle section', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const domainBar = page.locator('.domain-bar');
    await expect(domainBar).toBeVisible();

    const toggleBtn = page.locator('#toggleDomainBtn');
    // Button is hidden when no active tab with domain
    await expect(toggleBtn).toBeHidden();
  });

  test('settings button is visible', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    const settingsBtn = page.locator('#openSettingsBtn');
    await expect(settingsBtn).toBeVisible();
    await expect(settingsBtn).toContainText('Settings');
  });
});
