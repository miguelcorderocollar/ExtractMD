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

  test('popup opens and displays settings', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Check that main elements are present
    await expect(page.locator('text=ExtractMD')).toBeVisible();
    await expect(page.locator('text=General Settings')).toBeVisible();
    await expect(page.locator('#includeTimestamps')).toBeVisible();
  });

  test('can toggle a setting', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    const checkbox = page.locator('#includeTimestamps');
    const initialState = await checkbox.isChecked();
    
    await checkbox.click();
    
    // Wait a bit for setting to save
    await page.waitForTimeout(100);
    
    // Reload popup
    await page.reload();
    
    // Check if state persisted
    const newState = await checkbox.isChecked();
    expect(newState).toBe(!initialState);
    
    // Reset to initial state
    if (newState !== initialState) {
      await checkbox.click();
      await page.waitForTimeout(100);
    }
  });

  test('displays KPI counters', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    const kpiSection = page.locator('#kpi-section');
    await expect(kpiSection).toBeVisible();
    
    const kpiCounters = page.locator('#kpi-counters');
    await expect(kpiCounters).toContainText('YT:');
    await expect(kpiCounters).toContainText('Articles:');
  });
});

