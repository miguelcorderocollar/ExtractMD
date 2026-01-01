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

  test('floating button settings persist across page reloads', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    
    // Navigate to General section (should be active by default)
    await expect(page.locator('text=Floating Button')).toBeVisible();
    
    // Toggle "Enable Drag" setting
    const dragToggle = page.locator('setting-toggle[setting-id="floatingButtonEnableDrag"] input');
    await expect(dragToggle).toBeVisible();
    const initialDragState = await dragToggle.isChecked();
    await dragToggle.click();
    await page.waitForTimeout(100);
    
    // Toggle "Enable Dismiss" setting
    const dismissToggle = page.locator('setting-toggle[setting-id="floatingButtonEnableDismiss"] input');
    await expect(dismissToggle).toBeVisible();
    const initialDismissState = await dismissToggle.isChecked();
    await dismissToggle.click();
    await page.waitForTimeout(100);
    
    // Change button size
    const sizeSelect = page.locator('setting-select[setting-id="floatingButtonSize"] select');
    await expect(sizeSelect).toBeVisible();
    await sizeSelect.selectOption('large');
    await page.waitForTimeout(100);
    
    // Reload the page
    await page.reload();
    await page.waitForTimeout(300);
    
    // Verify settings persisted
    const newDragState = await page.locator('setting-toggle[setting-id="floatingButtonEnableDrag"] input').isChecked();
    expect(newDragState).toBe(!initialDragState);
    
    const newDismissState = await page.locator('setting-toggle[setting-id="floatingButtonEnableDismiss"] input').isChecked();
    expect(newDismissState).toBe(!initialDismissState);
    
    const newSize = await page.locator('setting-select[setting-id="floatingButtonSize"] select').inputValue();
    expect(newSize).toBe('large');
    
    // Reset to original values
    if (newDragState !== initialDragState) {
      await page.locator('setting-toggle[setting-id="floatingButtonEnableDrag"] input').click();
      await page.waitForTimeout(100);
    }
    if (newDismissState !== initialDismissState) {
      await page.locator('setting-toggle[setting-id="floatingButtonEnableDismiss"] input').click();
      await page.waitForTimeout(100);
    }
    await page.locator('setting-select[setting-id="floatingButtonSize"] select').selectOption('medium');
    await page.waitForTimeout(100);
  });

  test('displays reset positions button and can reset positions', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    
    // Navigate to Data section where reset button is located
    await page.locator('[data-section="data"]').click();
    await page.waitForTimeout(300);
    
    // Check that Reset Data section is visible
    await expect(page.locator('text=Reset Data')).toBeVisible();
    
    // Check that reset button is visible
    const resetBtn = page.locator('#resetPositionsBtn');
    await expect(resetBtn).toBeVisible();
    await expect(resetBtn).toContainText('Reset Positions');
    
    // Set up a dialog handler to accept the confirmation
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('reset all floating button positions');
      await dialog.accept();
    });
    
    // Click the reset button
    await resetBtn.click();
    await page.waitForTimeout(500); // Wait for async operation
    
    // Check for success message
    const statusMessage = page.locator('#status');
    await expect(statusMessage).toBeVisible();
    await expect(statusMessage).toContainText('positions have been reset');
  });
});

