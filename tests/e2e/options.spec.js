import { test, expect } from '@playwright/test';
import { launchWithExtension, getExtensionId } from './helpers/extension.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('ExtractMD Options Page', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    context = await launchWithExtension();
    extensionId = await getExtensionId(context);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('options page opens and displays settings', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    
    // Check that main elements are present
    await expect(page.locator('text=ExtractMD Settings')).toBeVisible();
    await expect(page.locator('text=General Settings')).toBeVisible();
  });

  test('displays all settings accordions', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    
    // Check for all accordion sections
    await expect(page.locator('text=General Settings')).toBeVisible();
    await expect(page.locator('text=YouTube Transcript Settings')).toBeVisible();
    await expect(page.locator('text=HN Comments Settings')).toBeVisible();
    await expect(page.locator('text=HN News Settings')).toBeVisible();
    await expect(page.locator('text=Article Exporter')).toBeVisible();
  });

  test('can toggle a setting', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    
    // Open YouTube settings accordion first
    await page.locator('text=YouTube Transcript Settings').click();
    await page.waitForTimeout(300); // Wait for accordion animation
    
    const checkbox = page.locator('#includeTimestamps');
    await expect(checkbox).toBeVisible();
    
    const initialState = await checkbox.isChecked();
    
    await checkbox.click();
    
    // Wait a bit for setting to save
    await page.waitForTimeout(100);
    
    // Reload options page
    await page.reload();
    
    // Re-open the accordion
    await page.locator('text=YouTube Transcript Settings').click();
    await page.waitForTimeout(300);
    
    // Check if state persisted
    const newState = await page.locator('#includeTimestamps').isChecked();
    expect(newState).toBe(!initialState);
    
    // Reset to initial state
    if (newState !== initialState) {
      await page.locator('#includeTimestamps').click();
      await page.waitForTimeout(100);
    }
  });

  test('displays KPI counters with clear button', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    
    const kpiSection = page.locator('#kpi-section');
    await expect(kpiSection).toBeVisible();
    
    const kpiCounters = page.locator('#kpi-counters');
    await expect(kpiCounters).toContainText('YT:');
    await expect(kpiCounters).toContainText('Articles:');
    
    const clearBtn = page.locator('#clearKpiBtn');
    await expect(clearBtn).toBeVisible();
    await expect(clearBtn).toContainText('Clear');
  });

  test('displays import/export buttons', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    
    const exportBtn = page.locator('#exportSettingsBtn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toContainText('Export Settings');
    
    const importBtn = page.locator('#importSettingsBtn');
    await expect(importBtn).toBeVisible();
    await expect(importBtn).toContainText('Import Settings');
  });
});

