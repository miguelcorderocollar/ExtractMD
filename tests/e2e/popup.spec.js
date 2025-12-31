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
    await expect(page.locator('#extractNowBtn')).toBeVisible();
    await expect(page.locator('#downloadBtn')).toBeVisible();
    await expect(page.locator('#openSettingsBtn')).toBeVisible();
  });

  test('displays Extract Now button', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    const extractBtn = page.locator('#extractNowBtn');
    await expect(extractBtn).toContainText('Extract Now');
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
    
    const domainSection = page.locator('.domain-section');
    await expect(domainSection).toBeVisible();
    
    const toggleBtn = page.locator('#toggleDomainBtn');
    await expect(toggleBtn).toBeVisible();
  });

  test('settings button is visible', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    const settingsBtn = page.locator('#openSettingsBtn');
    await expect(settingsBtn).toBeVisible();
    await expect(settingsBtn).toContainText('Settings');
  });
});
